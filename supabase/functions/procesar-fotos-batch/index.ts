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

    // Get all original photos
    const { data: originals, error: fetchErr } = await supabase
      .from("fotos_solicitud")
      .select("id, url, solicitud_id, tipo")
      .eq("tipo", "original");

    if (fetchErr) throw fetchErr;
    console.log(`Found ${originals?.length || 0} original photos to process`);

    // Delete all existing "procesada" records (they point to originals)
    const { error: delErr } = await supabase
      .from("fotos_solicitud")
      .delete()
      .eq("tipo", "procesada");
    if (delErr) console.error("Delete error:", delErr);
    else console.log("Deleted existing procesada records");

    // Download watermark once
    const watermarkUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${WATERMARK_PATH}`;
    const wmRes = await fetch(watermarkUrl, { signal: AbortSignal.timeout(10000) });
    if (!wmRes.ok) throw new Error(`Watermark download failed: ${wmRes.status}`);
    const wmBuffer = new Uint8Array(await wmRes.arrayBuffer());
    console.log("Watermark downloaded");

    let processed = 0;
    let failed = 0;

    for (const foto of originals || []) {
      try {
        // Download original
        const imgRes = await fetch(foto.url, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) { failed++; continue; }
        const imgBuffer = new Uint8Array(await imgRes.arrayBuffer());

        // Decode
        const originalImage = await decode(imgBuffer) as Image;
        const watermarkImage = await decode(wmBuffer) as Image;

        const imgWidth = originalImage.width;
        const imgHeight = originalImage.height;
        const barHeight = Math.round(imgHeight * 0.12);
        const resizedWatermark = watermarkImage.resize(imgWidth, barHeight);

        // Semi-transparency
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

        // Upload
        const urlObj = new URL(foto.url);
        const storagePath = urlObj.pathname.replace(`/storage/v1/object/public/${BUCKET}/`, "");
        const processedPath = `procesada/${storagePath.replace(/^(taller\/|[^/]+\/)/, "")}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(processedPath, resultBuffer, { contentType: "image/jpeg", upsert: true });

        if (uploadError) { console.error("Upload error:", uploadError); failed++; continue; }

        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(processedPath);

        await supabase.from("fotos_solicitud").insert({
          solicitud_id: foto.solicitud_id,
          url: urlData.publicUrl,
          tipo: "procesada",
        });

        processed++;
        console.log(`Processed ${processed}/${originals?.length}: ${processedPath}`);
      } catch (e) {
        console.error(`Failed to process foto ${foto.id}:`, e);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed, failed, total: originals?.length || 0 }),
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
