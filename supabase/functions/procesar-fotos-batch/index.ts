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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1) Collect all photo URLs from inspeccion_detalle
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

    // Collect all URLs with their solicitud_id
    const allPhotos: { url: string; solicitud_id: string }[] = [];
    for (const insp of inspecciones || []) {
      for (const field of photoFields) {
        const url = (insp as any)[field];
        if (url && typeof url === "string" && url.startsWith("http")) {
          allPhotos.push({ url, solicitud_id: insp.solicitud_id });
        }
      }
      // Array fields
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

    console.log(`Found ${allPhotos.length} photos from inspeccion_detalle`);

    // 2) Clear existing fotos_solicitud and re-insert as originals
    for (const insp of inspecciones || []) {
      await supabase.from("fotos_solicitud").delete().eq("solicitud_id", insp.solicitud_id);
    }
    console.log("Cleared existing fotos_solicitud records");

    // Insert originals
    for (const photo of allPhotos) {
      await supabase.from("fotos_solicitud").insert({
        solicitud_id: photo.solicitud_id,
        url: photo.url,
        tipo: "original",
      });
    }
    console.log(`Inserted ${allPhotos.length} original records`);

    // 3) Download watermark once
    const watermarkUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${WATERMARK_PATH}`;
    const wmRes = await fetch(watermarkUrl, { signal: AbortSignal.timeout(10000) });
    if (!wmRes.ok) throw new Error(`Watermark download failed: ${wmRes.status}`);
    const wmBuffer = new Uint8Array(await wmRes.arrayBuffer());
    console.log("Watermark downloaded");

    // 4) Process each photo
    let processed = 0;
    let failed = 0;

    for (const photo of allPhotos) {
      try {
        const imgRes = await fetch(photo.url, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) { failed++; continue; }
        const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());

        const originalImage = await decode(imgBuffer) as Image;
        const watermarkImage = await decode(wmBuffer) as Image;

        const imgWidth = originalImage.width;
        const imgHeight = originalImage.height;
        const barHeight = Math.round(imgHeight * 0.12);
        const resizedWatermark = watermarkImage.resize(imgWidth, barHeight);

        for (let x = 1; x <= resizedWatermark.width; x++) {
          for (let y = 1; y <= resizedWatermark.height; y++) {
            const pixel = resizedWatermark.getPixelAt(x, y);
            const r = (pixel >> 24) & 0xFF;
            const g = (pixel >> 16) & 0xFF;
            const b = (pixel >> 8) & 0xFF;
            resizedWatermark.setPixelAt(x, y, Image.rgbaToColor(r, g, b, 191));
          }
        }

        originalImage.composite(resizedWatermark, 0, imgHeight - barHeight);
        const resultBuffer = await originalImage.encodeJPEG(90);

        const urlObj = new URL(photo.url);
        const storagePath = urlObj.pathname.replace(`/storage/v1/object/public/${BUCKET}/`, "");
        const processedPath = `procesada/${storagePath.replace(/^(taller\/|[^/]+\/)/, "")}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(processedPath, resultBuffer, { contentType: "image/jpeg", upsert: true });

        if (uploadError) { console.error("Upload error:", uploadError); failed++; continue; }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(processedPath);

        await supabase.from("fotos_solicitud").insert({
          solicitud_id: photo.solicitud_id,
          url: urlData.publicUrl,
          tipo: "procesada",
        });

        processed++;
        console.log(`Processed ${processed}/${allPhotos.length}`);
      } catch (e) {
        console.error(`Failed:`, e);
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
