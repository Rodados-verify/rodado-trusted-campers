import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { solicitud_id } = await req.json();
    if (!solicitud_id) {
      return new Response(JSON.stringify({ error: "solicitud_id required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch all data
    const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", solicitud_id).single();
    if (!sol) {
      return new Response(JSON.stringify({ error: "Solicitud not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: informe } = await supabase.from("informes").select("*").eq("solicitud_id", solicitud_id).maybeSingle();

    // Build prompt with exact user-specified format
    const prompt = `Eres un redactor especializado en venta de autocaravanas y campers de ocasión en España.
Escribe una descripción de venta profesional, persuasiva y honesta de entre 200 y 280 palabras.
Escribe en español. Habla del vehículo en tercera persona. Destaca los puntos fuertes.
Menciona el equipamiento más relevante. Transmite confianza. No menciones precios.
No uses lenguaje exagerado ni superlativos vacíos.

Vehículo: ${sol.marca} ${sol.modelo} ${sol.anio}
Kilómetros: ${sol.km?.toLocaleString("es-ES")} km
${sol.descripcion ? `Descripción del propietario: ${sol.descripcion}` : ""}
${informe?.puntos_positivos ? `Puntos destacados por el inspector: ${informe.puntos_positivos}` : ""}
${informe?.observaciones_generales ? `Observaciones técnicas: ${informe.observaciones_generales}` : ""}`;

    // Call Lovable AI Gateway
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    let description = "Descripción pendiente de revisión";

    if (lovableApiKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${lovableApiKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const generated = aiData.choices?.[0]?.message?.content;
          if (generated && generated.trim().length > 50) {
            description = generated.trim();
          }
        } else {
          console.error("AI error:", aiResponse.status, await aiResponse.text());
        }
      } catch (aiErr) {
        console.error("AI call failed:", aiErr);
      }
    } else {
      console.error("LOVABLE_API_KEY not configured");
    }

    // Copy original photos as processed if none exist
    const { data: existingProcessed } = await supabase.from("fotos_solicitud").select("id").eq("solicitud_id", solicitud_id).eq("tipo", "procesada");
    if (!existingProcessed || existingProcessed.length === 0) {
      const { data: originals } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", solicitud_id).eq("tipo", "original");
      if (originals && originals.length > 0) {
        const inserts = originals.map((f: any) => ({
          solicitud_id,
          url: f.url,
          tipo: "procesada" as const,
        }));
        await supabase.from("fotos_solicitud").insert(inserts);
      }
    }

    // Upsert ficha
    const shortId = solicitud_id.substring(0, 4);
    const slug = `${sol.marca}-${sol.modelo}-${sol.anio}-${shortId}`
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const { data: existingFicha } = await supabase.from("fichas").select("id").eq("solicitud_id", solicitud_id).maybeSingle();
    if (existingFicha) {
      await supabase.from("fichas").update({
        descripcion_generada: description,
        precio_final: sol.precio_venta,
        incluye_transporte_final: sol.incluye_transporte,
        slug,
        activa: false,
      }).eq("id", existingFicha.id);
    } else {
      await supabase.from("fichas").insert({
        solicitud_id,
        descripcion_generada: description,
        precio_final: sol.precio_venta,
        incluye_transporte_final: sol.incluye_transporte,
        slug,
        activa: false,
      });
    }

    // Update status
    await supabase.from("solicitudes").update({ estado: "contenido_generado" }).eq("id", solicitud_id);

    return new Response(JSON.stringify({ description, slug }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
