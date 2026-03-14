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

    const { data: checklist } = await supabase.from("checklist_items").select("*").eq("solicitud_id", solicitud_id);
    const { data: informe } = await supabase.from("informes").select("*").eq("solicitud_id", solicitud_id).maybeSingle();
    const { data: vendedor } = await supabase.from("usuarios").select("nombre").eq("id", sol.vendedor_id).single();

    // Build checklist summary
    const secciones = ["Mecánica", "Carrocería", "Habitáculo", "Instalaciones", "Documentación"];
    let checklistSummary = "";
    for (const sec of secciones) {
      const items = (checklist || []).filter((i: any) => i.seccion === sec);
      if (items.length === 0) continue;
      const correct = items.filter((i: any) => i.estado === "correcto").length;
      const obs = items.filter((i: any) => i.estado === "con_observaciones");
      checklistSummary += `\n${sec}: ${correct}/${items.length} correcto.`;
      if (obs.length > 0) {
        checklistSummary += ` Observaciones: ${obs.map((o: any) => `${o.item}: ${o.observacion}`).join("; ")}`;
      }
    }

    const prompt = `Eres un redactor experto en vehículos de segunda mano para la plataforma Rodado, especializada en autocaravanas, campers y furgonetas camperizadas. Genera una descripción atractiva y profesional para la ficha de venta pública de este vehículo.

DATOS DEL VEHÍCULO:
- Tipo: ${sol.tipo_vehiculo}
- Marca: ${sol.marca}
- Modelo: ${sol.modelo}
- Año: ${sol.anio}
- Kilómetros: ${sol.km?.toLocaleString("es-ES")} km
- Provincia: ${sol.provincia}
- Precio orientativo: ${sol.precio_venta ? Number(sol.precio_venta).toLocaleString("es-ES") + " €" : "No indicado"}
- Transporte incluido: ${sol.incluye_transporte ? "Sí" : "No"}
${sol.descripcion ? `- Descripción del vendedor: ${sol.descripcion}` : ""}

RESULTADO DE INSPECCIÓN PROFESIONAL:${checklistSummary}
${informe?.observaciones_generales ? `\nObservaciones generales del taller: ${informe.observaciones_generales}` : ""}
${informe?.puntos_positivos ? `\nPuntos destacados: ${informe.puntos_positivos}` : ""}

INSTRUCCIONES:
- Escribe en español, tono profesional pero cercano
- Destaca los puntos positivos del informe de inspección
- Menciona que ha sido inspeccionado por un taller verificado de la red Rodado
- Si hay observaciones, menciónalas de forma transparente pero constructiva
- No inventes datos que no estén en la información proporcionada
- Extensión: 150-300 palabras
- No incluyas el precio ni datos ya visibles en la ficha (marca, modelo, año, km)
- Empieza directamente con la descripción, sin títulos`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: corsHeaders });
    }

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
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

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), { status: 500, headers: corsHeaders });
    }

    const aiData = await aiResponse.json();
    const description = aiData.choices?.[0]?.message?.content || "";

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

    // Upsert ficha with generated description
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
