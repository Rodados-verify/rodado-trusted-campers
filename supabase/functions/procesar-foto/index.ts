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

// Forest green brand color
const BAND_R = 28, BAND_G = 58, BAND_B = 46; // #1C3A2E

function applyWatermark(originalImage: Image, watermarkImage: Image): void {
  const imgWidth = originalImage.width;
  const imgHeight = originalImage.height;

  // Band height: 8% of image height (more subtle)
  const bandHeight = Math.round(imgHeight * 0.08);
  const bandY = imgHeight - bandHeight;

  // 1) Draw semi-transparent forest-green band at the bottom
  for (let x = 1; x <= imgWidth; x++) {
    for (let y = bandY + 1; y <= imgHeight; y++) {
      const existingPixel = originalImage.getPixelAt(x, y);
      const eR = (existingPixel >> 24) & 0xFF;
      const eG = (existingPixel >> 16) & 0xFF;
      const eB = (existingPixel >> 8) & 0xFF;

      // Blend: 70% band color, 30% original
      const blendR = Math.round(BAND_R * 0.7 + eR * 0.3);
      const blendG = Math.round(BAND_G * 0.7 + eG * 0.3);
      const blendB = Math.round(BAND_B * 0.7 + eB * 0.3);

      originalImage.setPixelAt(x, y, Image.rgbaToColor(blendR, blendG, blendB, 255));
    }
  }

  // 2) Resize watermark PROPORTIONALLY to fit inside the band
  const wmAspect = watermarkImage.width / watermarkImage.height;
  // Watermark should be 85% of band height, and width follows aspect ratio
  const targetWmHeight = Math.round(bandHeight * 0.7);
  const targetWmWidth = Math.round(targetWmHeight * wmAspect);

  // Cap width at 40% of image width to avoid being too wide
  const maxWmWidth = Math.round(imgWidth * 0.4);
  let finalWidth = Math.min(targetWmWidth, maxWmWidth);
  let finalHeight = Math.round(finalWidth / wmAspect);

  // Ensure it fits within band
  if (finalHeight > bandHeight * 0.85) {
    finalHeight = Math.round(bandHeight * 0.85);
    finalWidth = Math.round(finalHeight * wmAspect);
  }

  const resizedWm = watermarkImage.resize(finalWidth, finalHeight);

  // 3) Apply slight transparency to watermark (90% opacity) and tint white for contrast
  for (let x = 1; x <= resizedWm.width; x++) {
    for (let y = 1; y <= resizedWm.height; y++) {
      const pixel = resizedWm.getPixelAt(x, y);
      const a = pixel & 0xFF;
      if (a < 10) continue; // skip fully transparent pixels
      const r = (pixel >> 24) & 0xFF;
      const g = (pixel >> 16) & 0xFF;
      const b = (pixel >> 8) & 0xFF;
      // Keep original colors but with 90% opacity
      resizedWm.setPixelAt(x, y, Image.rgbaToColor(r, g, b, Math.round(a * 0.9)));
    }
  }

  // 4) Center watermark on the band
  const wmX = Math.round((imgWidth - finalWidth) / 2);
  const wmY = bandY + Math.round((bandHeight - finalHeight) / 2);

  originalImage.composite(resizedWm, wmX, wmY);
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

    // 1) Download original image
    console.log("Downloading original image:", foto_url);
    const imgRes = await fetch(foto_url, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);
    const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());

    // 2) Download watermark
    const watermarkUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${WATERMARK_PATH}`;
    console.log("Downloading watermark:", watermarkUrl);
    const wmRes = await fetch(watermarkUrl, { signal: AbortSignal.timeout(10000) });
    if (!wmRes.ok) throw new Error(`Failed to download watermark: ${wmRes.status}`);
    const wmBuffer = new Uint8Array(await wmRes.arrayBuffer());

    // 3) Decode & apply watermark
    const originalImage = await decode(imgBuffer) as Image;
    const watermarkImage = await decode(wmBuffer) as Image;
    applyWatermark(originalImage, watermarkImage);

    // 4) Encode to JPEG
    const resultBuffer = await originalImage.encodeJPEG(90);

    // 5) Upload processed image
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

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload processed image: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(processedPath);
    const processedUrl = urlData.publicUrl;

    // 6) Insert processed foto record
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
