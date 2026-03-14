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

    // 2) Download watermark bar
    const watermarkUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${WATERMARK_PATH}`;
    console.log("Downloading watermark:", watermarkUrl);
    const wmRes = await fetch(watermarkUrl, { signal: AbortSignal.timeout(10000) });
    if (!wmRes.ok) throw new Error(`Failed to download watermark: ${wmRes.status}`);
    const wmBuffer = new Uint8Array(await wmRes.arrayBuffer());

    // 3) Decode images
    const originalImage = await decode(imgBuffer) as Image;
    const watermarkImage = await decode(wmBuffer) as Image;

    const imgWidth = originalImage.width;
    const imgHeight = originalImage.height;

    // 4) Resize watermark to fit image width, height = 12% of image
    const barHeight = Math.round(imgHeight * 0.12);
    const resizedWatermark = watermarkImage.resize(imgWidth, barHeight);

    // 5) Apply semi-transparency to watermark (75% opacity)
    for (let x = 1; x <= resizedWatermark.width; x++) {
      for (let y = 1; y <= resizedWatermark.height; y++) {
        const pixel = resizedWatermark.getPixelAt(x, y);
        const r = (pixel >> 24) & 0xFF;
        const g = (pixel >> 16) & 0xFF;
        const b = (pixel >> 8) & 0xFF;
        resizedWatermark.setPixelAt(x, y, Image.rgbaToColor(r, g, b, 191));
      }
    }

    // 6) Composite watermark at bottom of original image
    originalImage.composite(resizedWatermark, 0, imgHeight - barHeight);

    // 7) Encode to JPEG
    const resultBuffer = await originalImage.encodeJPEG(90);

    // 8) Upload processed image to storage
    // Extract path from the original URL to create a processed path
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

    // 9) Insert processed foto record in fotos_solicitud
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
