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

    // Step 2 — Scrape via Apify (broad + specific queries across 3 platforms)
    const fullQuery = `${marca} ${modelo}`.replace(/\s+/g, "+");
    const brandOnly = marca.replace(/\s+/g, "+");
    const tipo = "autocaravana camper";

    // Primary URLs (specific) + fallback URLs (brand-only, broader)
    const startUrls = [
      // Milanuncios — specific + broad
      { url: `https://www.milanuncios.com/autocaravanas/?q=${fullQuery}&aniodesde=${anio - 3}&aniohasta=${anio + 3}` },
      { url: `https://www.milanuncios.com/autocaravanas/?q=${brandOnly}&aniodesde=${anio - 4}&aniohasta=${anio + 4}` },
      // Wallapop — specific + broad
      { url: `https://www.wallapop.com/app/search?keywords=${fullQuery}&category_ids=14000` },
      { url: `https://www.wallapop.com/app/search?keywords=${brandOnly}+${tipo.replace(/\s+/g, "+")}&category_ids=14000` },
      // Coches.net — specific + broad
      { url: `https://www.coches.net/autocaravanas-y-remolques/?q=${fullQuery}` },
      { url: `https://www.coches.net/autocaravanas-y-remolques/?q=${brandOnly}` },
    ];

    const pageFunction = `async function pageFunction(context) {
      const { $, request, log } = context;
      const items = [];
      
      // Very broad selectors to catch any listing card across sites
      const cardSelectors = [
        '[data-testid="listing"]', '.ma-AdCard', '.ma-AdCardV2',
        'article', '.vehicle-card', '[class*="ItemCard"]', '[class*="ad-card"]',
        '[class*="AdCard"]', '[class*="listing"]', '[class*="Listing"]',
        '.ad-list-item', '.list-item', '.product-card', '[class*="product"]',
        '[class*="Result"]', '[class*="result"]', '.card', '[class*="Card"]'
      ].join(', ');
      
      const titleSelectors = 'h2, h3, h4, .title, [class*="title"], [class*="Title"], [class*="name"], [class*="Name"]';
      const priceSelectors = '[class*="price"], [class*="Price"], .precio, .price, [class*="amount"], [class*="Amount"]';
      const kmSelectors = '[class*="km"], [class*="kilometer"], [class*="Km"], [class*="mileage"]';
      const yearSelectors = '[class*="year"], [class*="anio"], [class*="Year"], [class*="date"]';
      
      $(cardSelectors).each((i, el) => {
        if (i >= 30) return false; // Limit per page
        const $el = $(el);
        const titulo = $el.find(titleSelectors).first().text().trim();
        const precio = $el.find(priceSelectors).first().text().trim();
        const kmText = $el.find(kmSelectors).first().text().trim();
        const anioText = $el.find(yearSelectors).first().text().trim();
        const href = $el.find('a').first().attr('href') || '';
        
        // Also try to extract year from title text
        const yearFromTitle = titulo.match(/\\b(19|20)\\d{2}\\b/);
        const finalAnio = anioText || (yearFromTitle ? yearFromTitle[0] : '');
        
        // Also try to extract km from title text  
        const kmFromTitle = titulo.match(/(\\d[\\d.]+)\\s*km/i);
        const finalKm = kmText || (kmFromTitle ? kmFromTitle[1] : '');
        
        if (titulo && precio) {
          items.push({
            titulo,
            precio,
            km: finalKm,
            anio: finalAnio,
            url: href.startsWith('http') ? href : request.url.split('/').slice(0, 3).join('/') + href,
            fuente: new URL(request.url).hostname.replace('www.', '').split('.')[0]
          });
        }
      });
      
      // If no cards found with structured selectors, try extracting from full page text
      if (items.length === 0) {
        log.info('No structured cards found, trying text extraction from: ' + request.url);
        const bodyText = $('body').text();
        const priceMatches = bodyText.match(/(\\d{1,3}[.,]\\d{3})\\s*€/g) || [];
        log.info('Found ' + priceMatches.length + ' price-like patterns in page text');
      }
      
      log.info('Scraped ' + items.length + ' items from ' + request.url);
      return items;
    }`;

    console.log("Calling Apify web-scraper with", startUrls.length, "URLs...");
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startUrls,
          pageFunction,
          maxRequestsPerCrawl: 30,
          maxConcurrency: 5,
          useChrome: true, // Enable JS rendering for dynamic sites like Wallapop
          waitUntil: "networkidle2",
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

    // Step 3 — Filter relevant results (relaxed criteria)
    // First pass: extract numeric price from all results
    const parsedResults = resultados.map((v: any) => ({
      ...v,
      _precioNum: parseInt(String(v.precio).replace(/\D/g, "")) || 0,
      _kmNum: parseInt(String(v.km).replace(/[.\s]/g, "").replace(/\D/g, "")) || 0,
      _anioNum: parseInt(String(v.anio).match(/\d{4}/)?.[0] || "0") || 0,
    }));

    // Relaxed filter: only require a valid price in reasonable range
    let vehiculosFiltrados = parsedResults
      .filter((v: any) => {
        return (
          v._precioNum >= 3000 &&
          v._precioNum <= 300000 &&
          // If year is detected, allow wide range (±5 years); otherwise keep it
          (v._anioNum === 0 || Math.abs(v._anioNum - anio) <= 5) &&
          // If km is detected, allow generous range; otherwise keep it
          (v._kmNum === 0 || v._kmNum < (km || 500000) * 3)
        );
      })
      .slice(0, 20);

    console.log(`Filtered to ${vehiculosFiltrados.length} comparable vehicles`);

    // If still not enough, use ALL results with valid prices as fallback
    if (vehiculosFiltrados.length < 3) {
      console.log("Not enough after filtering, using all results with valid prices...");
      vehiculosFiltrados = parsedResults
        .filter((v: any) => v._precioNum >= 3000 && v._precioNum <= 300000)
        .slice(0, 20);
      console.log(`Fallback: ${vehiculosFiltrados.length} vehicles with valid prices`);
    }

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
    const precios = vehiculosFiltrados.map((v: any) => v._precioNum).filter((p: number) => p > 0);
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
      precio: v._precioNum,
      km: v.km || v._kmNum ? `${v._kmNum} km` : "",
      anio: v.anio || (v._anioNum ? String(v._anioNum) : ""),
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
