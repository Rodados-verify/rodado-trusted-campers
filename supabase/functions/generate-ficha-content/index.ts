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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseKey || !anonKey) {
      console.error("Missing env vars:", { hasUrl: !!supabaseUrl, hasKey: !!supabaseKey, hasAnon: !!anonKey });
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify admin role
    const anonClient = createClient(supabaseUrl, anonKey, {
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
    const { data: inspeccion } = await supabase.from("inspeccion_detalle").select("*").eq("solicitud_id", solicitud_id).maybeSingle();

    // Build comprehensive prompt
    let vehicleDetails = `Vehículo: ${sol.marca} ${sol.modelo} ${sol.anio}
Kilómetros: ${sol.km?.toLocaleString("es-ES")} km
Tipo: ${sol.tipo_vehiculo}
Provincia: ${sol.provincia}`;

    if (sol.descripcion) {
      vehicleDetails += `\nMotivo de venta del propietario: ${sol.descripcion}`;
    }

    // Add technical data from inspection
    if (inspeccion) {
      const techParts: string[] = [];
      if (inspeccion.combustible) techParts.push(`Combustible: ${inspeccion.combustible}`);
      if (inspeccion.potencia_cv) techParts.push(`Potencia: ${inspeccion.potencia_cv} CV`);
      if (inspeccion.cilindrada) techParts.push(`Cilindrada: ${inspeccion.cilindrada} cc`);
      if (inspeccion.transmision) techParts.push(`Transmisión: ${inspeccion.transmision}`);
      if (inspeccion.traccion) techParts.push(`Tracción: ${inspeccion.traccion}`);
      if (inspeccion.plazas) techParts.push(`Plazas: ${inspeccion.plazas}`);
      if (inspeccion.longitud_mm) techParts.push(`Longitud: ${(inspeccion.longitud_mm / 1000).toFixed(2)} m`);
      if (inspeccion.mma_kg) techParts.push(`MMA: ${inspeccion.mma_kg} kg`);
      if (techParts.length > 0) vehicleDetails += `\n\nDatos técnicos verificados:\n${techParts.join(", ")}`;

      // Habitáculo
      const habitParts: string[] = [];
      if (inspeccion.cama_fija) habitParts.push("cama fija");
      if (inspeccion.dinette) habitParts.push("dinette");
      if (inspeccion.cocina_fuegos > 0) habitParts.push(`cocina ${inspeccion.cocina_fuegos} fuegos`);
      if (inspeccion.cocina_horno) habitParts.push("horno");
      if (inspeccion.frigorifico_tipo && inspeccion.frigorifico_tipo !== "no_tiene") habitParts.push(`frigorífico ${inspeccion.frigorifico_tipo}`);
      if (inspeccion.banio_completo) habitParts.push("baño completo");
      if (inspeccion.ducha_separada) habitParts.push("ducha separada");
      if (inspeccion.ac_tiene) habitParts.push("aire acondicionado");
      if (inspeccion.calefaccion_marca) habitParts.push(`calefacción ${inspeccion.calefaccion_marca}`);
      if (inspeccion.panel_solar_tiene) habitParts.push(`panel solar${inspeccion.panel_solar_w ? ` ${inspeccion.panel_solar_w}W` : ""}`);
      if (inspeccion.toldo_tiene) habitParts.push("toldo");
      if (inspeccion.inversor_tiene) habitParts.push("inversor");
      if (inspeccion.bateria_servicio_tipo) habitParts.push(`batería ${inspeccion.bateria_servicio_tipo}${inspeccion.bateria_servicio_ah ? ` ${inspeccion.bateria_servicio_ah}Ah` : ""}`);
      if (inspeccion.agua_deposito_limpia_l) habitParts.push(`depósito agua ${inspeccion.agua_deposito_limpia_l}L`);
      if (habitParts.length > 0) vehicleDetails += `\n\nEquipamiento del habitáculo: ${habitParts.join(", ")}`;

      // Extras
      if (inspeccion.extras_verificados?.length > 0) {
        vehicleDetails += `\n\nExtras verificados: ${inspeccion.extras_verificados.join(", ")}`;
      }

      // Valoración
      if (inspeccion.puntuacion_general) {
        vehicleDetails += `\n\nPuntuación del verificador: ${inspeccion.puntuacion_general}/10 — ${inspeccion.recomendacion?.replace(/_/g, " ")}`;
      }
      if (inspeccion.puntos_destacados) {
        vehicleDetails += `\nPuntos destacados por el inspector: ${inspeccion.puntos_destacados}`;
      }
      if (inspeccion.observaciones_generales) {
        vehicleDetails += `\nObservaciones técnicas: ${inspeccion.observaciones_generales}`;
      }
    } else {
      // Fallback to informe data
      if (informe?.puntos_positivos) vehicleDetails += `\nPuntos destacados por el inspector: ${informe.puntos_positivos}`;
      if (informe?.observaciones_generales) vehicleDetails += `\nObservaciones técnicas: ${informe.observaciones_generales}`;
    }

    const prompt = `Eres un redactor especializado en venta de autocaravanas y campers de ocasión en España.
Escribe una descripción de venta profesional, persuasiva y honesta de entre 200 y 280 palabras.
Escribe en español. Habla del vehículo en tercera persona. Destaca los puntos fuertes.
Menciona el equipamiento más relevante del habitáculo y las instalaciones.
Transmite confianza mencionando la inspección profesional. No menciones precios.
No uses lenguaje exagerado ni superlativos vacíos.

${vehicleDetails}`;

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

    // Copy protocol photos as processed if none exist
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
