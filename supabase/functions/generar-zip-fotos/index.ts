import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "npm:jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { solicitud_id } = await req.json();
    if (!solicitud_id) throw new Error("solicitud_id is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get solicitud info for ZIP filename
    const { data: solicitud } = await supabase
      .from("solicitudes")
      .select("marca, modelo, anio")
      .eq("id", solicitud_id)
      .single();

    if (!solicitud) throw new Error("Solicitud not found");

    // Get processed photos (prefer procesada, fallback to original)
    const { data: fotos } = await supabase
      .from("fotos_solicitud")
      .select("url, tipo")
      .eq("solicitud_id", solicitud_id)
      .order("created_at", { ascending: true });

    if (!fotos || fotos.length === 0) throw new Error("No photos found");

    const procesadas = fotos.filter((f: any) => f.tipo === "procesada");
    const fotosToZip = procesadas.length > 0 ? procesadas : fotos.filter((f: any) => f.tipo === "original");

    // Create ZIP
    const zip = new JSZip();
    let i = 1;

    for (const foto of fotosToZip) {
      try {
        const res = await fetch(foto.url, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) continue;
        const buffer = await res.arrayBuffer();
        const ext = foto.url.toLowerCase().includes(".png") ? "png" : "jpg";
        zip.file(`foto-${String(i).padStart(2, "0")}.${ext}`, buffer);
        i++;
      } catch (e) {
        console.error("Error downloading photo for ZIP:", e);
      }
    }

    if (i === 1) throw new Error("No photos could be downloaded");

    const zipBuffer = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 6 } });

    const marca = (solicitud.marca || "vehiculo").toLowerCase().replace(/\s+/g, "-");
    const modelo = (solicitud.modelo || "").toLowerCase().replace(/\s+/g, "-");
    const filename = `rodado-${marca}-${modelo}-${solicitud.anio}.zip`;

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("generar-zip-fotos error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
