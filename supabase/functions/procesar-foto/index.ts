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

// Brand colors #1C3A2E forest green
const BAND_R = 28, BAND_G = 58, BAND_B = 46;
// Accent ocre #C47B2A
const ACCENT_R = 196, ACCENT_G = 123, ACCENT_B = 42;

function applyWatermark(originalImage: Image, watermarkImage: Image): void {
  const imgWidth = originalImage.width;
  const imgHeight = originalImage.height;

  // === FLAG in top-left corner ===
  // Flag dimensions: width = 30% of image, height proportional to watermark
  const flagWidth = Math.round(imgWidth * 0.30);
  
  // Resize watermark proportionally to fit flag width with padding
  const wmPadding = Math.round(flagWidth * 0.08);
  const wmTargetWidth = flagWidth - wmPadding * 2;
  const wmAspect = watermarkImage.width / watermarkImage.height;
  const wmTargetHeight = Math.round(wmTargetWidth / wmAspect);
  
  // Flag height = watermark height + padding top/bottom
  const flagHeight = wmTargetHeight + wmPadding * 2;

  // 1) Draw forest-green flag background with slight transparency
  for (let x = 1; x <= flagWidth; x++) {
    for (let y = 1; y <= flagHeight; y++) {
      const existingPixel = originalImage.getPixelAt(x, y);
      const eR = (existingPixel >> 24) & 0xFF;
      const eG = (existingPixel >> 16) & 0xFF;
      const eB = (existingPixel >> 8) & 0xFF;

      // 80% band, 20% original for readability
      const blendR = Math.round(BAND_R * 0.80 + eR * 0.20);
      const blendG = Math.round(BAND_G * 0.80 + eG * 0.20);
      const blendB = Math.round(BAND_B * 0.80 + eB * 0.20);

      originalImage.setPixelAt(x, y, Image.rgbaToColor(blendR, blendG, blendB, 255));
    }
  }

  // 2) Draw ocre accent line at the bottom of the flag (3px thick)
  const accentThickness = Math.max(2, Math.round(flagHeight * 0.04));
  for (let x = 1; x <= flagWidth; x++) {
    for (let t = 0; t < accentThickness; t++) {
      const y = flagHeight - t;
      if (y >= 1) {
        originalImage.setPixelAt(x, y, Image.rgbaToColor(ACCENT_R, ACCENT_G, ACCENT_B, 255));
      }
    }
  }

  // 3) Draw ocre accent line on the right edge of the flag (3px thick)
  for (let y = 1; y <= flagHeight; y++) {
    for (let t = 0; t < accentThickness; t++) {
      const x = flagWidth - t;
      if (x >= 1) {
        originalImage.setPixelAt(x, y, Image.rgbaToColor(ACCENT_R, ACCENT_G, ACCENT_B, 255));
      }
    }
  }

  // 4) Resize watermark proportionally
  const resizedWm = watermarkImage.resize(wmTargetWidth, wmTargetHeight);

  // 5) Composite watermark centered in the flag area
  const wmX = wmPadding;
  const wmY = wmPadding;

  // Make watermark slightly transparent for elegance
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

  originalImage.composite(resizedWm, wmX, wmY);

  // 6) Add a subtle shadow on the right and bottom edges of the flag
  const shadowLength = Math.round(flagWidth * 0.02);
  for (let s = 1; s <= shadowLength; s++) {
    const opacity = Math.round(40 * (1 - s / shadowLength));
    // Right shadow
    const sx = flagWidth + s;
    if (sx <= imgWidth) {
      for (let y = 1; y <= flagHeight; y++) {
        const existing = originalImage.getPixelAt(sx, y);
        const eR = (existing >> 24) & 0xFF;
        const eG = (existing >> 16) & 0xFF;
        const eB = (existing >> 8) & 0xFF;
        const factor = 1 - opacity / 255;
        originalImage.setPixelAt(sx, y, Image.rgbaToColor(
          Math.round(eR * factor), Math.round(eG * factor), Math.round(eB * factor), 255
        ));
      }
    }
    // Bottom shadow
    const sy = flagHeight + s;
    if (sy <= imgHeight) {
      for (let x = 1; x <= flagWidth; x++) {
        const existing = originalImage.getPixelAt(x, sy);
        const eR = (existing >> 24) & 0xFF;
        const eG = (existing >> 16) & 0xFF;
        const eB = (existing >> 8) & 0xFF;
        const factor = 1 - opacity / 255;
        originalImage.setPixelAt(x, sy, Image.rgbaToColor(
          Math.round(eR * factor), Math.round(eG * factor), Math.round(eB * factor), 255
        ));
      }
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { foto_url, solicitud_id, foto_id } = await req.json();
    if (!foto_url) throw new Error("foto_url is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Downloading original image:", foto_url);
    const imgRes = await fetch(foto_url, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
    const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());

    const watermarkUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${WATERMARK_PATH}`;
    console.log("Downloading watermark:", watermarkUrl);
    const wmRes = await fetch(watermarkUrl, { signal: AbortSignal.timeout(10000) });
    if (!wmRes.ok) throw new Error(`Failed to download watermark: ${wmRes.status}`);
    const wmBuffer = new Uint8Array(await wmRes.arrayBuffer());

    const originalImage = await decode(imgBuffer) as Image;
    const watermarkImage = await decode(wmBuffer) as Image;
    console.log(`Original image dimensions: ${originalImage.width}x${originalImage.height}, size: ${imgBuffer.length} bytes`);

    // Skip watermarking for very small images (< 600px wide) - they'd look pixelated
    const MIN_WIDTH_FOR_WATERMARK = 600;
    let resultBuffer: Uint8Array;
    if (originalImage.width >= MIN_WIDTH_FOR_WATERMARK) {
      applyWatermark(originalImage, watermarkImage);
      resultBuffer = await originalImage.encodeJPEG(95);
    } else {
      console.log(`Skipping watermark: image too small (${originalImage.width}px wide)`);
      resultBuffer = await originalImage.encodeJPEG(95);
    }

    const urlObj = new URL(foto_url);
    const storagePath = urlObj.pathname.replace(`/storage/v1/object/public/${BUCKET}/`, "");
    const processedPath = `procesada/${storagePath.replace(/^(taller\/|[^/]+\/)/, "")}`;

    console.log("Uploading processed image to:", processedPath);
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(processedPath, resultBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) throw new Error(`Failed to upload: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(processedPath);
    const processedUrl = `${urlData.publicUrl}?v=${Date.now()}`;

    if (solicitud_id) {
      await supabase.from("fotos_solicitud").insert({
        solicitud_id,
        url: processedUrl,
        tipo: "procesada",
      });
    }

    console.log("Watermark applied successfully:", processedUrl);

    return new Response(
      JSON.stringify({ success: true, processed_url: processedUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("procesar-foto error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
