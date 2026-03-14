import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { solicitud_id, regenerar } = await req.json();
    if (!solicitud_id) throw new Error("solicitud_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check existing kit (unless regenerating)
    if (!regenerar) {
      const { data: existing } = await supabase
        .from("kit_publicacion")
        .select("*")
        .eq("solicitud_id", solicitud_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ success: true, data: existing }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch solicitud data
    const { data: solicitud, error: solError } = await supabase
      .from("solicitudes")
      .select("marca, modelo, anio, km, precio_venta, provincia, descripcion")
      .eq("id", solicitud_id)
      .single();

    if (solError || !solicitud) throw new Error("Solicitud not found");

    // Fetch ficha for slug and description
    const { data: ficha } = await supabase
      .from("fichas")
      .select("slug, descripcion_generada")
      .eq("solicitud_id", solicitud_id)
      .eq("activa", true)
      .maybeSingle();

    // Fetch inspeccion for extras
    const { data: inspeccion } = await supabase
      .from("inspeccion_detalle")
      .select("extras_verificados, puntos_destacados")
      .eq("solicitud_id", solicitud_id)
      .maybeSingle();

    const slug = ficha?.slug || solicitud_id;
    const fichaUrl = `rodado.es/vehiculo/${slug}`;
    const descripcionGenerada = ficha?.descripcion_generada || solicitud.descripcion || "";
    const extras = inspeccion?.extras_verificados?.join(", ") || "No especificados";
    const puntosDestacados = inspeccion?.puntos_destacados || "";

    const prompt = `Genera textos de anuncio de venta para el siguiente vehículo en tres formatos distintos.

Vehículo: ${solicitud.marca} ${solicitud.modelo} ${solicitud.anio} ${solicitud.km}km
Descripción verificada: ${descripcionGenerada}
Equipamiento destacado: ${extras}
Puntos destacados: ${puntosDestacados}
Precio: ${solicitud.precio_venta}€
Provincia: ${solicitud.provincia}
Ficha verificada: ${fichaUrl}

Responde SOLO en JSON válido (sin markdown):
{
  "wallapop_titulo": "máximo 60 caracteres, directo y con datos clave",
  "wallapop_descripcion": "máximo 900 caracteres, tono informal y directo, menciona que está verificado por Rodado e incluye URL de ficha: ${fichaUrl}",
  "milanuncios_titulo": "máximo 80 caracteres",
  "milanuncios_descripcion": "hasta 1800 caracteres, más formal y completo, incluye datos técnicos principales y URL de ficha: ${fichaUrl}",
  "cochesnet_titulo": "máximo 80 caracteres",
  "cochesnet_descripcion": "hasta 1800 caracteres, orientado a comprador técnico, incluye todos los datos relevantes y URL de ficha: ${fichaUrl}",
  "whatsapp_texto": "mensaje corto para compartir por WhatsApp, máximo 200 caracteres, incluye URL de ficha: ${fichaUrl}"
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un experto en redacción de anuncios de venta de vehículos para plataformas españolas. Responde solo con JSON válido, sin markdown ni texto adicional." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "rate_limit", message: "Demasiadas solicitudes. Inténtalo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let texts: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      texts = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("Failed to parse AI response");
    }

    // Delete old kit if regenerating
    if (regenerar) {
      await supabase.from("kit_publicacion").delete().eq("solicitud_id", solicitud_id);
    }

    // Save kit
    const record = {
      solicitud_id,
      wallapop_titulo: texts.wallapop_titulo || "",
      wallapop_descripcion: texts.wallapop_descripcion || "",
      milanuncios_titulo: texts.milanuncios_titulo || "",
      milanuncios_descripcion: texts.milanuncios_descripcion || "",
      cochesnet_titulo: texts.cochesnet_titulo || "",
      cochesnet_descripcion: texts.cochesnet_descripcion || "",
      whatsapp_texto: texts.whatsapp_texto || "",
    };

    const { data: saved, error: saveError } = await supabase
      .from("kit_publicacion")
      .insert(record)
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save kit");
    }

    return new Response(
      JSON.stringify({ success: true, data: saved }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generar-kit-publicacion error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
