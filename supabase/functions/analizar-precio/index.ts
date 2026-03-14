import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Fuente = "milanuncios" | "wallapop" | "coches";

type ComparableCandidate = {
  titulo: string;
  precio: number;
  km: string;
  anio: string;
  url: string;
  fuente: Fuente;
  _yearNum: number;
  _kmNum: number;
  _score: number;
};

const normalizeText = (value: string) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const parseNumeric = (raw: string): number =>
  parseInt(String(raw || "").replace(/[.,\s]/g, "").replace(/\D/g, ""), 10);

const extractYear = (text: string): number => {
  const matches = [...String(text || "").matchAll(/\b(19|20)\d{2}\b/g)].map((m) => parseInt(m[0], 10));
  return matches.find((y) => y >= 1980 && y <= 2035) || 0;
};

const extractKm = (text: string): number => {
  const matches = [...String(text || "").matchAll(/(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})\s*km\b/gi)]
    .map((m) => parseNumeric(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 500 && n <= 700000);
  return matches[0] || 0;
};

const extractPriceCandidates = (html: string, plainText: string): number[] => {
  const fromMeta = [
    ...html.matchAll(/product:price:amount["'][^>]*content=["'](\d{4,6}(?:[.,]\d{1,2})?)["']/gi),
    ...html.matchAll(/"price"\s*:\s*"?(\d{4,6}(?:[.,]\d{1,2})?)"?/gi),
  ]
    .map((m) => parseNumeric(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 3000 && n <= 300000);

  const fromText = [...plainText.matchAll(/(\d{1,3}(?:[.\s]\d{3})+|\d{4,6})\s*(€|eur|euros)\b/gi)]
    .map((m) => parseNumeric(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 3000 && n <= 300000);

  const unique = [...new Set([...fromMeta, ...fromText])];
  return unique.slice(0, 6);
};

const detectFuenteFromUrl = (url: string): Fuente | null => {
  const u = String(url || "").toLowerCase();
  if (u.includes("milanuncios.com")) return "milanuncios";
  if (u.includes("wallapop.com")) return "wallapop";
  if (u.includes("coches.net")) return "coches";
  return null;
};

const isDirectListingUrl = (url: string, fuente: Fuente): boolean => {
  const u = String(url || "").toLowerCase();
  if (!u.startsWith("http")) return false;

  if (fuente === "wallapop") {
    const isValidHost = u.includes("es.wallapop.com") || u.includes("www.wallapop.com");
    return isValidHost && /\/item\//.test(u) && !u.includes("/app/search");
  }

  if (fuente === "coches") {
    return /-(arvo|covo|fuvivo)\.aspx(\?|$)/.test(u);
  }

  if (fuente === "milanuncios") {
    return u.endsWith(".htm") && !u.includes("?q=") && !u.includes("/busqueda");
  }

  return false;
};

const cleanHtmlToText = (html: string): string =>
  String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTitle = (html: string): string => {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og) return og.trim();

  const ttl = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (ttl) return ttl.trim();

  return "Vehículo similar";
};

const runGoogleSearch = async (apifyToken: string, queries: string[]): Promise<string[]> => {
  const endpoint = `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${apifyToken}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queries: queries.join("\n"),
      maxPagesPerQuery: 1,
      resultsPerPage: 10,
      languageCode: "es",
      mobileResults: false,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google search scraper failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const rows = Array.isArray(data) ? data : [];

  const urls = rows.flatMap((row: any) => {
    const fromOrganic = Array.isArray(row?.organicResults)
      ? row.organicResults.map((r: any) => r?.url || r?.link).filter(Boolean)
      : [];

    const fromRow = [row?.url, row?.link].filter(Boolean);

    return [...fromOrganic, ...fromRow];
  });

  return [...new Set(urls.map((u: unknown) => String(u || "").trim()).filter(Boolean))];
};

const fetchComparableFromListing = async (
  url: string,
  marcaTokens: string[],
  modeloTokens: string[],
  targetYear: number,
  targetKm: number,
): Promise<ComparableCandidate | null> => {
  const fuente = detectFuenteFromUrl(url);
  if (!fuente) return null;
  if (!isDirectListingUrl(url, fuente)) return null;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(9000),
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) return null;
    const html = await res.text();
    const plainText = cleanHtmlToText(html);
    const title = extractTitle(html);

    const prices = extractPriceCandidates(html, plainText);
    const price = prices[0] || 0;
    if (!price) return null;

    const yearNum = extractYear(`${title} ${plainText}`);
    const kmNum = extractKm(`${title} ${plainText}`);

    const relevanceText = normalizeText(`${title} ${url}`);
    const hasMarca = marcaTokens.some((t) => relevanceText.includes(t));
    const modelMatches = modeloTokens.filter((t) => relevanceText.includes(t)).length;

    if (!hasMarca || modelMatches === 0) return null;

    if (yearNum > 0 && Math.abs(yearNum - targetYear) > 8) return null;
    if (kmNum > 0 && kmNum > Math.max(targetKm * 2.3, 360000)) return null;

    const score =
      modelMatches * 2 +
      (yearNum > 0 ? Math.max(0, 3 - Math.abs(yearNum - targetYear)) : 0) +
      (kmNum > 0 ? 1 : 0) +
      2;

    return {
      titulo: title,
      precio: price,
      km: kmNum ? `${kmNum.toLocaleString("es-ES")} km` : "",
      anio: yearNum ? String(yearNum) : "",
      url,
      fuente,
      _yearNum: yearNum,
      _kmNum: kmNum,
      _score: score,
    };
  } catch {
    return null;
  }
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

    // 1) Load vehicle to analyze
    const { data: solicitud, error: solError } = await supabase
      .from("solicitudes")
      .select("marca, modelo, anio, km, precio_venta, provincia")
      .eq("id", solicitud_id)
      .single();

    if (solError || !solicitud) {
      throw new Error("Solicitud not found");
    }

    const { marca, modelo, anio, km, precio_venta, provincia } = solicitud;

    const marcaTokens = normalizeText(marca).split(" ").filter((t) => t.length >= 2);
    const modeloTokens = normalizeText(modelo).split(" ").filter((t) => t.length >= 3);

    // 2) Discover direct listing URLs from search index (more robust against blocked search pages)
    const searchQueries = [
      `site:milanuncios.com/autocaravanas-de-segunda-mano "${marca} ${modelo}"`,
      `site:milanuncios.com "${marca} ${modelo} camper"`,
      `site:milanuncios.com "${marca} ${modelo} ${anio}"`,
      `site:wallapop.com/item "${marca} ${modelo}" camper`,
      `site:wallapop.com/item "${marca} ${modelo} ${anio}"`,
      `site:coches.net "${marca} ${modelo}" (arvo.aspx OR covo.aspx OR fuvivo.aspx)`,
      `site:coches.net "${marca} ${modelo} camper" (arvo.aspx OR covo.aspx OR fuvivo.aspx)`,
      `site:coches.net "${marca} ${modelo} ${anio}" (arvo.aspx OR covo.aspx OR fuvivo.aspx)`,
    ];

    let discoveredUrls: string[] = [];
    try {
      discoveredUrls = await runGoogleSearch(APIFY_TOKEN, searchQueries);
    } catch (err) {
      console.error("Search discovery error:", err);
    }

    const directListingUrls = discoveredUrls
      .map((u) => String(u || "").trim())
      .filter((u) => {
        const fuente = detectFuenteFromUrl(u);
        return fuente ? isDirectListingUrl(u, fuente) : false;
      });

    const uniqueListingUrls = [...new Set(directListingUrls)].slice(0, 24);
    console.log(`Discovered ${uniqueListingUrls.length} direct listing URLs`);

    // 3) Extract each listing data from listing page itself
    const comparableCandidates = (
      await Promise.all(
        uniqueListingUrls.map((url) =>
          fetchComparableFromListing(url, marcaTokens, modeloTokens, anio, km || 200000),
        ),
      )
    ).filter(Boolean) as ComparableCandidate[];

    // Dedupe by source + price + URL
    const seen = new Set<string>();
    const deduped = comparableCandidates.filter((c) => {
      const key = `${c.fuente}|${c.precio}|${c.url.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    deduped.sort((a, b) => b._score - a._score);

    const vehiculosFiltrados = deduped.slice(0, 15);

    const byFuente = vehiculosFiltrados.reduce(
      (acc, row) => {
        acc[row.fuente] += 1;
        return acc;
      },
      { milanuncios: 0, wallapop: 0, coches: 0 } as Record<Fuente, number>,
    );

    console.log(
      `Comparable vehicles: total=${vehiculosFiltrados.length}, milanuncios=${byFuente.milanuncios}, wallapop=${byFuente.wallapop}, coches=${byFuente.coches}`,
    );

    if (vehiculosFiltrados.length < 3) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "insufficient_data",
          message:
            "No hemos encontrado suficientes anuncios reales y comparables para un análisis fiable. Ajusta marca/modelo o vuelve a intentarlo más tarde.",
          debug: {
            discovered_urls: uniqueListingUrls.length,
            comparables_total: vehiculosFiltrados.length,
            comparables_por_fuente: byFuente,
          },
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 4) Numeric market summary
    const precios = vehiculosFiltrados.map((v) => v.precio).filter((p) => p > 0);
    const precioMedio = Math.round(precios.reduce((a, b) => a + b, 0) / precios.length);
    const precioMinimo = Math.min(...precios);
    const precioMaximo = Math.max(...precios);
    const precioVendedor = Number(precio_venta || 0);

    // 5) AI verdict over real comparables
    const prompt = `Eres un experto en valoración de autocaravanas y campers de ocasión en España.
Analiza el precio de venta propuesto por el vendedor y compáralo con los vehículos similares encontrados en el mercado.

Vehículo a valorar:
- Marca y modelo: ${marca} ${modelo}
- Año: ${anio}
- Kilómetros: ${km}
- Precio propuesto por el vendedor: ${precioVendedor}€
- Provincia: ${provincia}

Datos del mercado actual (${vehiculosFiltrados.length} anuncios reales):
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

    let analysis: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("Failed to parse AI analysis");
    }

    const comparables = vehiculosFiltrados.map((v) => ({
      titulo: v.titulo,
      precio: v.precio,
      km: v.km,
      anio: v.anio,
      url: v.url,
      fuente: v.fuente,
    }));

    // 6) Persist analysis
    const record = {
      solicitud_id,
      veredicto: analysis.veredicto,
      diferencia_porcentaje: analysis.diferencia_porcentaje,
      precio_recomendado_min: Math.round(Number(analysis.precio_recomendado_min) || 0),
      precio_recomendado_max: Math.round(Number(analysis.precio_recomendado_max) || 0),
      precio_medio_mercado: Math.round(Number(analysis.precio_medio_mercado) || 0),
      analisis: analysis.analisis,
      consejo: analysis.consejo,
      num_comparables: comparables.length,
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
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});