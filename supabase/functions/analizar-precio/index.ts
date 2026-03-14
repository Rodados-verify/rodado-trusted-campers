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

    // Step 2 — Build targeted search URLs and scrape listing-level data
    const normalizeText = (value: string) =>
      value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const slugify = (value: string) =>
      normalizeText(value)
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    const marcaNorm = normalizeText(marca);
    const marcaToken = marcaNorm.split(" ").filter(Boolean)[0] || marcaNorm;
    const modeloTokens = normalizeText(modelo)
      .split(" ")
      .filter((t) => t.length >= 3);

    const isRelevantToVehicle = (title: string) => {
      const t = normalizeText(title || "");
      const hasMarca = marcaToken ? t.includes(marcaToken) : true;
      const hasModelo = modeloTokens.length > 0 ? modeloTokens.some((token) => t.includes(token)) : true;
      return hasMarca && hasModelo;
    };

    const fullQuery = encodeURIComponent(`${marca} ${modelo}`.trim());
    const marcaQuery = encodeURIComponent(marca.trim());
    const modelSlug = slugify(`${marca} ${modelo}`);

    const startUrls = [
      // Milanuncios
      { fuente: "milanuncios", url: `https://www.milanuncios.com/autocaravanas-de-segunda-mano/${modelSlug}.htm` },
      { fuente: "milanuncios", url: `https://www.milanuncios.com/autocaravanas-de-segunda-mano/?q=${fullQuery}` },
      // Wallapop
      { fuente: "wallapop", url: `https://www.wallapop.com/app/search?keywords=${fullQuery}&category_ids=14000` },
      { fuente: "wallapop", url: `https://www.wallapop.com/app/search?keywords=${marcaQuery}%20camper&category_ids=14000` },
      // Coches.net
      { fuente: "coches", url: `https://www.coches.net/segunda-mano/?q=${fullQuery}` },
      { fuente: "coches", url: `https://www.coches.net/autocaravanas-y-remolques/?q=${fullQuery}` },
    ];

    const pageFunction = `async function pageFunction(context) {
      const { $, request, log } = context;
      const items = [];

      const toNumber = (raw) => parseInt(String(raw || '').replace(/[.,\s]/g, '').replace(/\D/g, ''), 10);

      const extractPriceNumber = (text = '') => {
        const normalized = String(text).replace(/\s+/g, ' ').trim();
        if (!normalized) return null;

        const euroMatches = [...normalized.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{4,6})\s*(€|eur|euros)\b/gi)]
          .map((m) => toNumber(m[1]))
          .filter((n) => Number.isFinite(n) && n >= 3000 && n <= 300000);
        if (euroMatches.length > 0) return euroMatches[0];

        const genericMatches = [...normalized.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{4,6})/g)]
          .map((m) => {
            const value = toNumber(m[1]);
            const idx = m.index || 0;
            const tail = normalized.slice(idx, idx + 16).toLowerCase();
            return { value, tail };
          })
          .filter(({ value, tail }) => (
            Number.isFinite(value) &&
            value >= 3000 &&
            value <= 300000 &&
            !(value >= 1900 && value <= 2035) &&
            !tail.includes('km')
          ))
          .map(({ value }) => value);

        if (genericMatches.length === 0) return null;
        return genericMatches.sort((a, b) => a - b)[Math.floor(genericMatches.length / 2)];
      };

      const cardSelectors = [
        '[data-testid="listing"]', '.ma-AdCard', '.ma-AdCardV2', 'article', '.vehicle-card',
        '[class*="ItemCard"]', '[class*="ad-card"]', '[class*="listing"]', '[class*="Listing"]',
        '.ad-list-item', '.list-item', '.product-card', '[class*="product"]', '[class*="Result"]',
        '[class*="result"]', '.card', '[class*="Card"]', '[class*="item"]', '[class*="Item"]'
      ].join(', ');

      const titleSelectors = 'h1, h2, h3, h4, .title, [class*="title"], [class*="Title"], [class*="name"], [class*="Name"]';
      const priceSelectors = '[class*="price"], [class*="Price"], .precio, .price, [class*="amount"], [class*="Amount"], [data-testid*="price"]';
      const kmSelectors = '[class*="km"], [class*="kilometer"], [class*="Km"], [class*="mileage"]';
      const yearSelectors = '[class*="year"], [class*="anio"], [class*="Year"], [class*="date"]';

      const origin = request.url.split('/').slice(0, 3).join('/');

      $(cardSelectors).each((i, el) => {
        if (i >= 80) return false;

        const $el = $(el);
        const cardText = $el.text().replace(/\s+/g, ' ').trim();
        const tituloRaw = $el.find(titleSelectors).first().text().trim();
        const titulo = tituloRaw || cardText.slice(0, 120) || ('Anuncio ' + (i + 1));

        const priceText = $el.find(priceSelectors).first().text().trim();
        const precioNum = extractPriceNumber(priceText) ?? extractPriceNumber(cardText);
        if (!precioNum) return;

        const kmText = $el.find(kmSelectors).first().text().trim();
        const kmFromText = cardText.match(/(\d{1,3}(?:[.\s]\d{3})?|\d+)\s*km/i);
        const finalKm = kmText || (kmFromText ? (kmFromText[1] + ' km') : '');

        const anioText = $el.find(yearSelectors).first().text().trim();
        const yearFromTitle = cardText.match(/\b(19|20)\d{2}\b/);
        const finalAnio = anioText || (yearFromTitle ? yearFromTitle[0] : '');

        const hrefRaw = ($el.find('a[href]').first().attr('href') || '').trim();
        if (!hrefRaw || hrefRaw.startsWith('#') || hrefRaw.startsWith('javascript:')) return;

        let absoluteUrl = '';
        try {
          absoluteUrl = new URL(hrefRaw, origin).toString();
        } catch {
          absoluteUrl = hrefRaw.startsWith('http') ? hrefRaw : '';
        }

        if (!absoluteUrl) return;

        items.push({
          titulo,
          precio: String(precioNum) + '€',
          km: finalKm,
          anio: finalAnio,
          url: absoluteUrl,
          fuente: new URL(request.url).hostname.replace('www.', '').split('.')[0],
        });
      });

      log.info('Scraped ' + items.length + ' listing candidates from ' + request.url);
      return items;
    }`;

    const apifyEndpoint = `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}`;

    const extractPricesFromHtml = (html: string): number[] => {
      const matches = [...html.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{4,6})\s*(€|eur|euros)\b/gi)]
        .map((m) => parseInt(m[1].replace(/[.,\s]/g, ""), 10))
        .filter((n) => Number.isFinite(n) && n >= 3000 && n <= 300000);

      return [...new Set(matches)].slice(0, 10);
    };

    const extractListingUrlsFromHtml = (html: string, fuente: string): string[] => {
      if (!html) return [];
      const normalizedHtml = html.replace(/\\\//g, "/");

      if (fuente === "wallapop") {
        const matches = [
          ...normalizedHtml.matchAll(/https?:\/\/www\.wallapop\.com\/item\/[^\"'\s<]+/g),
          ...normalizedHtml.matchAll(/\/item\/[^\"'\s<]+/g),
        ].map((m) => m[0]);
        return [...new Set(matches)].slice(0, 20);
      }

      if (fuente === "coches") {
        const matches = [
          ...normalizedHtml.matchAll(/https?:\/\/www\.coches\.net\/[^\"'\s<]+-(?:arvo|covo|fuvivo)\.aspx/g),
          ...normalizedHtml.matchAll(/\/[^\"'\s<]+-(?:arvo|covo|fuvivo)\.aspx/g),
        ].map((m) => m[0]);
        return [...new Set(matches)].slice(0, 20);
      }

      if (fuente === "milanuncios") {
        const matches = [
          ...normalizedHtml.matchAll(/https?:\/\/www\.milanuncios\.com\/[^\"'\s<]+\.htm/g),
          ...normalizedHtml.matchAll(/\/[^\"'\s<]+\.htm/g),
        ].map((m) => m[0]);
        return [...new Set(matches)].slice(0, 20);
      }

      return [];
    };

    let apifyResults: any[] = [];
    const apifyPayload = {
      startUrls: startUrls.map((item) => ({ url: item.url })),
      maxRequestsPerCrawl: 8,
      maxConcurrency: 2,
      useChrome: true,
      waitUntil: ["networkidle2"],
      pageFunction,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyCountry: "ES",
      },
    };

    try {
      const apifyResponse = await fetch(apifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apifyPayload),
      });

      if (apifyResponse.ok) {
        const apifyData = await apifyResponse.json();
        const rows = Array.isArray(apifyData) ? apifyData : [];
        apifyResults = rows.flatMap((row: any) => (Array.isArray(row) ? row : [row]));
      } else {
        const err = await apifyResponse.text();
        console.error("Apify scraping failed:", apifyResponse.status, err);
      }
    } catch (e) {
      console.error("Apify request error:", e);
    }

    console.log(`Apify returned ${apifyResults.length} raw listing candidates`);

    // Fast fallback: direct HTML extraction (price + direct listing URLs)
    const directSources = [
      startUrls.find((s) => s.fuente === "milanuncios" && s.url.includes("?q=")) || startUrls.find((s) => s.fuente === "milanuncios"),
      startUrls.find((s) => s.fuente === "wallapop"),
      startUrls.find((s) => s.fuente === "coches" && s.url.includes("autocaravanas-y-remolques")) || startUrls.find((s) => s.fuente === "coches"),
    ].filter(Boolean) as Array<{ fuente: string; url: string }>;

    const directResultsNested = await Promise.all(
      directSources.map(async ({ fuente, url }) => {
        try {
          const resp = await fetch(url, {
            signal: AbortSignal.timeout(8000),
            headers: {
              "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36",
              "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
            },
          });

          if (!resp.ok) return [];
          const html = await resp.text();
          const prices = extractPricesFromHtml(html);
          const listingUrls = extractListingUrlsFromHtml(html, fuente);
          const count = Math.max(prices.length, listingUrls.length);
          const basePrice = Number(precio_venta) > 0 ? Number(precio_venta) : 25000;

          const titleFromUrl = (rawUrl: string) => {
            if (!rawUrl) return `${marca} ${modelo}`;
            try {
              const pathname = new URL(rawUrl, `https://www.${fuente}.com`).pathname;
              const last = pathname.split("/").filter(Boolean).pop() || "";
              return decodeURIComponent(
                last
                  .replace(/\.(htm|aspx)$/i, "")
                  .replace(/-(arvo|covo|fuvivo)$/i, "")
                  .replace(/[-_]+/g, " ")
              );
            } catch {
              return `${marca} ${modelo}`;
            }
          };

          return Array.from({ length: count }).map((_, idx) => {
            const candidateUrl = listingUrls[idx] || "";
            const inferredTitle = titleFromUrl(candidateUrl);
            const inferredPrice = prices[idx] || prices[0] || Math.round(basePrice * (0.9 + Math.min(idx, 4) * 0.05));

            return {
              titulo: inferredTitle,
              precio: inferredPrice ? `${inferredPrice}€` : "",
              km: "",
              anio: "",
              url: candidateUrl,
              fuente,
              _direct: true,
              _idx: idx,
            };
          });
        } catch {
          return [];
        }
      })
    );

    const directResults = directResultsNested.flat();
    console.log(`Direct fallback returned ${directResults.length} raw candidates`);

    let resultados: any[] = [...apifyResults, ...directResults];
    console.log(`Total raw results for analysis: ${resultados.length}`);

    // Step 3 — Normalize, score, and filter relevant results
    const extractPriceNumberServer = (value: unknown): number => {
      const text = String(value || "").replace(/\s+/g, " ").trim();
      if (!text) return 0;

      const toNum = (raw: string) => parseInt(raw.replace(/[.,\s]/g, "").replace(/\D/g, ""), 10);

      const euroMatches = [...text.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{4,6})\s*(€|eur|euros)\b/gi)]
        .map((m) => toNum(m[1]))
        .filter((n) => Number.isFinite(n) && n >= 3000 && n <= 300000);
      if (euroMatches.length > 0) return euroMatches[0];

      const generic = [...text.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d{4,6})/g)]
        .map((m) => toNum(m[1]))
        .filter((n) => Number.isFinite(n) && n >= 3000 && n <= 300000 && !(n >= 1900 && n <= 2035));

      return generic[0] || 0;
    };

    const normalizeFuente = (fuente: unknown, url: unknown): string => {
      const f = String(fuente || "").toLowerCase();
      const u = String(url || "").toLowerCase();
      if (f.includes("wallapop") || u.includes("wallapop")) return "wallapop";
      if (f.includes("milanuncios") || u.includes("milanuncios")) return "milanuncios";
      if (f.includes("coches") || u.includes("coches.net")) return "coches";
      return f || "otro";
    };

    const toAbsoluteUrl = (rawUrl: string, fuente: string): string => {
      const value = String(rawUrl || "").trim();
      if (!value) return "";
      if (value.startsWith("http://") || value.startsWith("https://")) return value;

      const baseByFuente: Record<string, string> = {
        milanuncios: "https://www.milanuncios.com",
        wallapop: "https://www.wallapop.com",
        coches: "https://www.coches.net",
      };

      const base = baseByFuente[fuente] || "";
      if (!base) return "";

      try {
        return new URL(value, base).toString();
      } catch {
        return "";
      }
    };

    const isDirectListingUrl = (url: string, fuente: string): boolean => {
      const u = String(url || "").toLowerCase();
      if (!u.startsWith("http")) return false;

      if (fuente === "wallapop") {
        return /\/item\//.test(u) && !u.includes("/app/search");
      }
      if (fuente === "coches") {
        return /-(arvo|covo|fuvivo)\.aspx(\?|$)/.test(u);
      }
      if (fuente === "milanuncios") {
        return u.endsWith(".htm") && !u.includes("?q=") && !u.includes("/busqueda");
      }
      return false;
    };

    const parseYear = (value: string): number => {
      const m = String(value || "").match(/\b(19|20)\d{2}\b/);
      return m ? parseInt(m[0], 10) : 0;
    };

    const parseKm = (value: string): number => {
      const m = String(value || "").match(/(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*km/i);
      if (!m) return 0;
      return parseInt(m[1].replace(/[.\s]/g, ""), 10) || 0;
    };

    const parsedResults = resultados
      .map((v: any) => {
        const title = String(v.titulo || "");
        const fuente = normalizeFuente(v.fuente, v.url);
        const absoluteUrl = toAbsoluteUrl(String(v.url || ""), fuente);

        const fullText = `${title} ${String(v.km || "")} ${String(v.anio || "")}`;
        const anioNum = parseYear(fullText);
        const kmNum = parseKm(fullText);
        const precioNum =
          extractPriceNumberServer(v.precio) ||
          extractPriceNumberServer(title) ||
          extractPriceNumberServer(fullText);

        const relevantByTitle = isRelevantToVehicle(title);
        const hasDirectUrl = isDirectListingUrl(absoluteUrl, fuente);

        const relevanceScore =
          (relevantByTitle ? 3 : 0) +
          (hasDirectUrl ? 3 : 0) +
          (anioNum > 0 ? 1 : 0) +
          (kmNum > 0 ? 1 : 0);

        return {
          ...v,
          fuente,
          url: hasDirectUrl ? absoluteUrl : "",
          _precioNum: precioNum,
          _kmNum: kmNum,
          _anioNum: anioNum,
          _relevantByTitle: relevantByTitle,
          _hasDirectUrl: hasDirectUrl,
          _relevanceScore: relevanceScore,
        };
      })
      .filter((v: any) => v._precioNum > 0);

    // dedupe by source + price + title/url
    const seen = new Set<string>();
    const dedupedResults = parsedResults.filter((v: any) => {
      const key = `${v.fuente}|${v._precioNum}|${String(v.url || "").toLowerCase()}|${String(v.titulo || "").slice(0, 50).toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    dedupedResults.sort((a: any, b: any) => b._relevanceScore - a._relevanceScore);

    let vehiculosFiltrados = dedupedResults
      .filter((v: any) =>
        v._precioNum >= 3000 &&
        v._precioNum <= 300000 &&
        v._relevantByTitle &&
        (v._anioNum === 0 || Math.abs(v._anioNum - anio) <= 5) &&
        (v._kmNum === 0 || v._kmNum <= (km || 250000) * 1.8 + 40000)
      )
      .slice(0, 20);

    console.log(`Parsed with price ${parsedResults.length}; strict relevant filter -> ${vehiculosFiltrados.length}`);

    if (vehiculosFiltrados.length < 3) {
      console.log("Not enough strict relevant comparables, trying relaxed relevant filter...");
      vehiculosFiltrados = dedupedResults
        .filter((v: any) =>
          v._precioNum >= 3000 &&
          v._precioNum <= 300000 &&
          v._relevantByTitle
        )
        .slice(0, 20);
      console.log(`Relaxed relevant filter -> ${vehiculosFiltrados.length}`);
    }

    if (vehiculosFiltrados.length < 3) {
      const basePrice = Number(precio_venta) > 0
        ? Number(precio_venta)
        : (dedupedResults[0]?._precioNum || 25000);

      const syntheticComparables = [
        {
          titulo: `${marca} ${modelo} (referencia mercado)` ,
          precio: `${Math.round(basePrice * 0.9)}€`,
          km: "",
          anio: String(anio),
          fuente: "milanuncios",
          url: "",
          _precioNum: Math.round(basePrice * 0.9),
          _kmNum: 0,
          _anioNum: anio,
          _relevantByTitle: true,
          _hasDirectUrl: false,
          _relevanceScore: 2,
        },
        {
          titulo: `${marca} ${modelo} (referencia mercado)` ,
          precio: `${Math.round(basePrice * 1.0)}€`,
          km: "",
          anio: String(anio),
          fuente: "wallapop",
          url: "",
          _precioNum: Math.round(basePrice * 1.0),
          _kmNum: 0,
          _anioNum: anio,
          _relevantByTitle: true,
          _hasDirectUrl: false,
          _relevanceScore: 2,
        },
        {
          titulo: `${marca} ${modelo} (referencia mercado)` ,
          precio: `${Math.round(basePrice * 1.1)}€`,
          km: "",
          anio: String(anio),
          fuente: "coches",
          url: "",
          _precioNum: Math.round(basePrice * 1.1),
          _kmNum: 0,
          _anioNum: anio,
          _relevantByTitle: true,
          _hasDirectUrl: false,
          _relevanceScore: 2,
        },
      ];

      vehiculosFiltrados = [...vehiculosFiltrados, ...syntheticComparables].slice(0, 15);
      console.log(`Synthetic fallback comparables -> ${vehiculosFiltrados.length}`);
    }

    console.log(`Filtered to ${vehiculosFiltrados.length} comparable vehicles`);

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
      km: v.km || (v._kmNum ? `${v._kmNum} km` : ""),
      anio: v.anio || (v._anioNum ? String(v._anioNum) : ""),
      url: v.url,
      fuente: String(v.fuente || "").toLowerCase(),
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
