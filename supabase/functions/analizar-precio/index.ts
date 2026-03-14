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
    const { solicitud_id } = await req.json();
    if (!solicitud_id) throw new Error("solicitud_id is required");

    const APIFY_TOKEN = Deno.env.get("APIFY_TOKEN");
    if (!APIFY_TOKEN) throw new Error("APIFY_TOKEN not configured");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1 — Get vehicle data
    const { data: solicitud, error: solError } = await supabase
      .from("solicitudes")
      .select("marca, modelo, anio, km, precio_venta, provincia")
      .eq("id", solicitud_id)
      .single();

    if (solError || !solicitud) {
      throw new Error("Solicitud not found");
    }

    const { marca, modelo, anio, km, precio_venta, provincia } = solicitud;

    // Step 2 — Scrape via Apify
    const searchQuery = `${marca} ${modelo}`.replace(/\s+/g, "+");
    const startUrls = [
      { url: `https://www.milanuncios.com/autocaravanas/?q=${searchQuery}&aniodesde=${anio - 2}&aniohasta=${anio + 2}` },
      { url: `https://www.wallapop.com/app/search?keywords=${searchQuery}&category_ids=14000` },
      { url: `https://www.coches.net/autocaravanas-y-remolques/?q=${searchQuery}` },
    ];

    const pageFunction = `async function pageFunction(context) {
      const { $, request } = context;
      const items = [];
      $('[data-testid="listing"], .ma-AdCard, .ma-AdCardV2, article, .vehicle-card, [class*="ItemCard"], [class*="ad-card"]').each((i, el) => {
        const $el = $(el);
        const titulo = $el.find('h2, h3, .title, [class*="title"], [class*="Title"]').first().text().trim();
        const precio = $el.find('[class*="price"], [class*="Price"], .precio, .price').first().text().trim();
        const km = $el.find('[class*="km"], [class*="kilometer"]').first().text().trim();
        const anio = $el.find('[class*="year"], [class*="anio"]').first().text().trim();
        const href = $el.find('a').first().attr('href') || '';
        if (titulo && precio) {
          items.push({
            titulo,
            precio,
            km,
            anio,
            url: href.startsWith('http') ? href : request.url.split('/').slice(0, 3).join('/') + href,
            fuente: new URL(request.url).hostname.replace('www.', '').split('.')[0]
          });
        }
      });
      return items;
    }`;

    console.log("Calling Apify web-scraper...");
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls,
          pageFunction,
          maxRequestsPerCrawl: 15,
          maxConcurrency: 3,
        }),
      }
    );

    let resultados: any[] = [];
    if (apifyResponse.ok) {
      resultados = await apifyResponse.json();
      // Flatten if nested arrays
      if (Array.isArray(resultados) && resultados.length > 0 && Array.isArray(resultados[0])) {
        resultados = resultados.flat();
      }
    } else {
      console.error("Apify error:", apifyResponse.status, await apifyResponse.text());
    }

    console.log(`Apify returned ${resultados.length} raw results`);

    // Step 3 — Filter relevant results
    const vehiculosFiltrados = resultados
      .filter((v: any) => {
        const precioNum = parseInt(String(v.precio).replace(/\D/g, ""));
        const kmNum = parseInt(String(v.km).replace(/\D/g, "")) || 0;
        const anioNum = parseInt(String(v.anio)) || 0;
        return (
          precioNum > 5000 &&
          precioNum < 200000 &&
          (anioNum === 0 || Math.abs(anioNum - anio) <= 3) &&
          (kmNum === 0 || kmNum < km * 2)
        );
      })
      .slice(0, 15);

    console.log(`Filtered to ${vehiculosFiltrados.length} comparable vehicles`);

    // Not enough comparables
    if (vehiculosFiltrados.length < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "insufficient_data",
          message:
            "No hemos encontrado suficientes vehículos similares para hacer un análisis fiable. Prueba a actualizar en unos días.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 4 — AI Analysis via Lovable AI Gateway
    const precios = vehiculosFiltrados.map((v: any) =>
      parseInt(String(v.precio).replace(/\D/g, ""))
    );
    const precioMedio = Math.round(precios.reduce((a: number, b: number) => a + b, 0) / precios.length);
    const precioMinimo = Math.min(...precios);
    const precioMaximo = Math.max(...precios);
    const precioVendedor = precio_venta || 0;

    const prompt = `Eres un experto en valoración de autocaravanas y campers de ocasión en España.
Analiza el precio de venta propuesto por el vendedor y compáralo con los vehículos similares encontrados en el mercado.

Vehículo a valorar:
- Marca y modelo: ${marca} ${modelo}
- Año: ${anio}
- Kilómetros: ${km}
- Precio propuesto por el vendedor: ${precioVendedor}€
- Provincia: ${provincia}

Datos del mercado actual (${vehiculosFiltrados.length} vehículos similares encontrados):
- Precio mínimo: ${precioMinimo}€
- Precio máximo: ${precioMaximo}€
- Precio medio: ${precioMedio}€
- Precios individuales: ${precios.join(", ")}€

Responde SOLO en JSON con este formato exacto:
{
  "veredicto": "caro" | "en_mercado" | "barato",
  "diferencia_porcentaje": number,
  "precio_recomendado_min": number,
  "precio_recomendado_max": number,
  "precio_medio_mercado": number,
  "analisis": "texto de 2-3 frases explicando el análisis",
  "consejo": "texto de 1-2 frases con recomendación concreta al vendedor",
  "num_comparables": number
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
          { role: "system", content: "Responde solo con JSON válido, sin markdown ni texto adicional." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    let analysis: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("Failed to parse AI analysis");
    }

    // Prepare comparables with parsed numeric values
    const comparables = vehiculosFiltrados.map((v: any) => ({
      titulo: v.titulo,
      precio: parseInt(String(v.precio).replace(/\D/g, "")),
      km: v.km,
      anio: v.anio,
      url: v.url,
      fuente: v.fuente,
    }));

    // Step 5 — Save to database
    const record = {
      solicitud_id,
      veredicto: analysis.veredicto,
      diferencia_porcentaje: analysis.diferencia_porcentaje,
      precio_recomendado_min: analysis.precio_recomendado_min,
      precio_recomendado_max: analysis.precio_recomendado_max,
      precio_medio_mercado: analysis.precio_medio_mercado,
      analisis: analysis.analisis,
      consejo: analysis.consejo,
      num_comparables: analysis.num_comparables || vehiculosFiltrados.length,
      comparables,
    };

    const { data: saved, error: saveError } = await supabase
      .from("analisis_precio")
      .insert(record)
      .select()
      .single();

    if (saveError) {
      console.error("Save error:", saveError);
      throw new Error("Failed to save analysis");
    }

    return new Response(JSON.stringify({ success: true, data: saved }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analizar-precio error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "server_error",
        message: error instanceof Error ? error.message : "Error desconocido",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
