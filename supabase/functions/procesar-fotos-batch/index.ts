import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image, decode } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WATERMARK_PATH = "_assets/watermark-bar.png";
const BUCKET = "solicitud-fotos";

const BAND_R = 28, BAND_G = 58, BAND_B = 46;
const ACCENT_R = 196, ACCENT_G = 123, ACCENT_B = 42;

function applyWatermark(originalImage: Image, watermarkImage: Image): void {
  const imgWidth = originalImage.width;
  const imgHeight = originalImage.height;

  const flagWidth = Math.round(imgWidth * 0.30);
  const wmPadding = Math.round(flagWidth * 0.08);
  const wmTargetWidth = flagWidth - wmPadding * 2;
  const wmAspect = watermarkImage.width / watermarkImage.height;
  const wmTargetHeight = Math.round(wmTargetWidth / wmAspect);
  const flagHeight = wmTargetHeight + wmPadding * 2;

  // 1) Forest-green flag background
  for (let x = 1; x <= flagWidth; x++) {
    for (let y = 1; y <= flagHeight; y++) {
      const existingPixel = originalImage.getPixelAt(x, y);
      const eR = (existingPixel >> 24) & 0xFF;
      const eG = (existingPixel >> 16) & 0xFF;
      const eB = (existingPixel >> 8) & 0xFF;
      const blendR = Math.round(BAND_R * 0.80 + eR * 0.20);
      const blendG = Math.round(BAND_G * 0.80 + eG * 0.20);
      const blendB = Math.round(BAND_B * 0.80 + eB * 0.20);
      originalImage.setPixelAt(x, y, Image.rgbaToColor(blendR, blendG, blendB, 255));
    }
  }

  // 2) Ocre accent bottom edge
  const accentThickness = Math.max(2, Math.round(flagHeight * 0.04));
  for (let x = 1; x <= flagWidth; x++) {
    for (let t = 0; t < accentThickness; t++) {
      const y = flagHeight - t;
      if (y >= 1) originalImage.setPixelAt(x, y, Image.rgbaToColor(ACCENT_R, ACCENT_G, ACCENT_B, 255));
    }
  }

  // 3) Ocre accent right edge
  for (let y = 1; y <= flagHeight; y++) {
    for (let t = 0; t < accentThickness; t++) {
      const x = flagWidth - t;
      if (x >= 1) originalImage.setPixelAt(x, y, Image.rgbaToColor(ACCENT_R, ACCENT_G, ACCENT_B, 255));
    }
  }

  // 4) Resize watermark proportionally
  const resizedWm = watermarkImage.resize(wmTargetWidth, wmTargetHeight);
  for (let x = 1; x <= resizedWm.width; x++) {
    for (let y = 1; y <= resizedWm.height; y++) {
      const pixel = resizedWm.getPixelAt(x, y);
      const a = pixel & 0xFF;
      if (a < 10) continue;
      const r = (pixel >> 24) & 0xFF;
      const g = (pixel >> 16) & 0xFF;
      const b = (pixel >> 8) & 0xFF;
      resizedWm.setPixelAt(x, y, Image.rgbaToColor(r, g, b, Math.round(a * 0.95)));
    }
  }
  originalImage.composite(resizedWm, wmPadding, wmPadding);

  // 5) Subtle shadow
  const shadowLength = Math.round(flagWidth * 0.02);
  for (let s = 1; s <= shadowLength; s++) {
    const opacity = Math.round(40 * (1 - s / shadowLength));
    const sx = flagWidth + s;
    if (sx <= imgWidth) {
      for (let y = 1; y <= flagHeight; y++) {
        const existing = originalImage.getPixelAt(sx, y);
        const eR = (existing >> 24) & 0xFF;
        const eG = (existing >> 16) & 0xFF;
        const eB = (existing >> 8) & 0xFF;
        const f = 1 - opacity / 255;
        originalImage.setPixelAt(sx, y, Image.rgbaToColor(Math.round(eR * f), Math.round(eG * f), Math.round(eB * f), 255));
      }
    }
    const sy = flagHeight + s;
    if (sy <= imgHeight) {
      for (let x = 1; x <= flagWidth; x++) {
        const existing = originalImage.getPixelAt(x, sy);
        const eR = (existing >> 24) & 0xFF;
        const eG = (existing >> 16) & 0xFF;
        const eB = (existing >> 8) & 0xFF;
        const f = 1 - opacity / 255;
        originalImage.setPixelAt(x, sy, Image.rgbaToColor(Math.round(eR * f), Math.round(eG * f), Math.round(eB * f), 255));
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: inspecciones, error: inspErr } = await supabase
      .from("inspeccion_detalle")
      .select("solicitud_id, foto_frontal_url, foto_lateral_izq_url, foto_lateral_der_url, foto_trasera_url, foto_34_frontal_url, foto_34_trasero_url, foto_interior_conduccion_url, foto_dinette_url, foto_cocina_url, foto_banio_url, foto_cama_url, foto_habitaculo_url, foto_motor_url, foto_bajos_url, foto_neumaticos_url, foto_cuadro_electrico_url, foto_panel_solar_url, fotos_adicionales_urls, fotos_desperfectos_urls");

    if (inspErr) throw inspErr;

    const photoFields = [
      "foto_frontal_url", "foto_lateral_izq_url", "foto_lateral_der_url", "foto_trasera_url",
      "foto_34_frontal_url", "foto_34_trasero_url", "foto_interior_conduccion_url",
      "foto_dinette_url", "foto_cocina_url", "foto_banio_url", "foto_cama_url",
      "foto_habitaculo_url", "foto_motor_url", "foto_bajos_url", "foto_neumaticos_url",
      "foto_cuadro_electrico_url", "foto_panel_solar_url",
    ];

    const allPhotos: { url: string; solicitud_id: string }[] = [];
    for (const insp of inspecciones || []) {
      for (const field of photoFields) {
        const url = (insp as any)[field];
        if (url && typeof url === "string" && url.startsWith("http")) {
          allPhotos.push({ url, solicitud_id: insp.solicitud_id });
        }
      }
      for (const url of (insp as any).fotos_adicionales_urls || []) {
        if (url && typeof url === "string" && url.startsWith("http")) {
          allPhotos.push({ url, solicitud_id: insp.solicitud_id });
        }
      }
      for (const url of (insp as any).fotos_desperfectos_urls || []) {
        if (url && typeof url === "string" && url.startsWith("http")) {
          allPhotos.push({ url, solicitud_id: insp.solicitud_id });
        }
      }
    }

    console.log(`Found ${allPhotos.length} photos`);

    for (const insp of inspecciones || []) {
      await supabase.from("fotos_solicitud").delete().eq("solicitud_id", insp.solicitud_id);
    }

    for (const photo of allPhotos) {
      await supabase.from("fotos_solicitud").insert({
        solicitud_id: photo.solicitud_id, url: photo.url, tipo: "original",
      });
    }

    const watermarkUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${WATERMARK_PATH}`;
    const wmRes = await fetch(watermarkUrl, { signal: AbortSignal.timeout(10000) });
    if (!wmRes.ok) throw new Error(`Watermark download failed: ${wmRes.status}`);
    const wmBuffer = new Uint8Array(await wmRes.arrayBuffer());

    let processed = 0, failed = 0;

    for (const photo of allPhotos) {
      try {
        const imgRes = await fetch(photo.url, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) { failed++; continue; }
        const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());

        const originalImage = await decode(imgBuffer) as Image;
        const watermarkImage = await decode(wmBuffer) as Image;
        console.log(`Image ${processed + 1}: ${originalImage.width}x${originalImage.height}, size: ${imgBuffer.length} bytes`);
        applyWatermark(originalImage, watermarkImage);

        // Use quality 95 to minimize re-compression artifacts
        const resultBuffer = await originalImage.encodeJPEG(95);

        const urlObj = new URL(photo.url);
        const storagePath = urlObj.pathname.replace(`/storage/v1/object/public/${BUCKET}/`, "");
        const processedPath = `procesada/${storagePath.replace(/^(taller\/|[^/]+\/)/, "")}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET).upload(processedPath, resultBuffer, { contentType: "image/jpeg", upsert: true });

        if (uploadError) { failed++; continue; }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(processedPath);
        const cacheBustedUrl = `${urlData.publicUrl}?v=${Date.now()}`;
        await supabase.from("fotos_solicitud").insert({
          solicitud_id: photo.solicitud_id, url: cacheBustedUrl, tipo: "procesada",
        });

        processed++;
        console.log(`Processed ${processed}/${allPhotos.length}`);
      } catch (e) {
        console.error("Failed:", e);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, total: allPhotos.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Batch error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
