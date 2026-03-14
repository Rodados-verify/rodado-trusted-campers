import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Brand colors
const FOREST = rgb(0.11, 0.227, 0.18);
const OCRE = rgb(0.776, 0.604, 0.314);
const SAND_BG = rgb(0.969, 0.957, 0.937);
const WHITE = rgb(1, 1, 1);
const DARK = rgb(0.12, 0.12, 0.12);
const GRAY = rgb(0.45, 0.45, 0.45);
const LIGHT_GRAY = rgb(0.88, 0.88, 0.88);
const GREEN = rgb(0.2, 0.65, 0.35);
const YELLOW = rgb(0.75, 0.6, 0.15);
const RED = rgb(0.75, 0.2, 0.2);
const LIGHT_GREEN_BG = rgb(0.92, 0.97, 0.93);
const LIGHT_YELLOW_BG = rgb(0.98, 0.96, 0.90);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;
const CONTENT_W = PAGE_W - 2 * MARGIN;

interface InspeccionSection {
  section: string;
  items: { key: string; label: string }[];
}

const INSPECCION_SECTIONS: InspeccionSection[] = [
  {
    section: "Mecánica",
    items: [
      { key: "motor", label: "Motor" },
      { key: "transmision_mec", label: "Transmisión" },
      { key: "frenos", label: "Frenos" },
      { key: "suspension", label: "Suspensión" },
      { key: "direccion", label: "Dirección" },
      { key: "neumaticos", label: "Neumáticos" },
      { key: "escape", label: "Escape" },
      { key: "bateria_arranque", label: "Batería de arranque" },
      { key: "niveles", label: "Niveles" },
    ],
  },
  {
    section: "Carrocería",
    items: [
      { key: "carroceria", label: "Estado general" },
      { key: "golpes", label: "Golpes / abolladuras" },
      { key: "repintados", label: "Repintados" },
      { key: "oxidacion", label: "Oxidación" },
      { key: "sellados", label: "Sellados y juntas" },
      { key: "bajos", label: "Bajos" },
      { key: "cristales", label: "Cristales" },
    ],
  },
  {
    section: "Habitáculo",
    items: [
      { key: "habitaculo", label: "Estado general" },
      { key: "humedades", label: "Humedades" },
      { key: "tapiceria", label: "Tapicería" },
      { key: "persianas", label: "Persianas" },
      { key: "iluminacion", label: "Iluminación" },
    ],
  },
  {
    section: "Instalaciones",
    items: [
      { key: "electrica", label: "Instalación eléctrica" },
      { key: "toma_220v", label: "Toma 220V" },
      { key: "gas", label: "Instalación de gas" },
      { key: "agua", label: "Instalación de agua" },
    ],
  },
];

// Photo fields to include in the gallery with labels
const PHOTO_FIELDS: { key: string; label: string }[] = [
  { key: "foto_34_frontal_url", label: "3/4 frontal" },
  { key: "foto_frontal_url", label: "Frontal" },
  { key: "foto_lateral_izq_url", label: "Lateral izquierdo" },
  { key: "foto_lateral_der_url", label: "Lateral derecho" },
  { key: "foto_trasera_url", label: "Trasera" },
  { key: "foto_34_trasero_url", label: "3/4 trasero" },
  { key: "foto_interior_conduccion_url", label: "Interior conducción" },
  { key: "foto_habitaculo_url", label: "Habitáculo" },
  { key: "foto_dinette_url", label: "Dinette" },
  { key: "foto_cocina_url", label: "Cocina" },
  { key: "foto_cama_url", label: "Cama" },
  { key: "foto_banio_url", label: "Baño" },
  { key: "foto_motor_url", label: "Motor" },
  { key: "foto_bajos_url", label: "Bajos" },
  { key: "foto_neumaticos_url", label: "Neumáticos" },
  { key: "foto_cuadro_electrico_url", label: "Cuadro eléctrico" },
  { key: "foto_panel_solar_url", label: "Panel solar" },
];

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

// Fetch and embed an image, returns null on failure
async function fetchAndEmbedImage(pdfDoc: any, url: string): Promise<any | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Detect format from bytes
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      return await pdfDoc.embedJpg(bytes);
    } else if (bytes[0] === 0x89 && bytes[1] === 0x50) {
      return await pdfDoc.embedPng(bytes);
    }
    // Try jpg as fallback
    try { return await pdfDoc.embedJpg(bytes); } catch { /* skip */ }
    try { return await pdfDoc.embedPng(bytes); } catch { /* skip */ }
    return null;
  } catch (e) {
    console.warn("Failed to fetch image:", url, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Server config error" }), { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { solicitud_id } = await req.json();
    if (!solicitud_id) {
      return new Response(JSON.stringify({ error: "solicitud_id required" }), { status: 400, headers: corsHeaders });
    }

    // Fetch data
    const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", solicitud_id).single();
    if (!sol) {
      return new Response(JSON.stringify({ error: "Solicitud not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: inspeccion } = await supabase.from("inspeccion_detalle").select("*").eq("solicitud_id", solicitud_id).maybeSingle();
    const { data: taller } = sol.taller_id
      ? await supabase.from("talleres").select("nombre_taller, provincia").eq("id", sol.taller_id).maybeSingle()
      : { data: null };

    // Also fetch fotos_solicitud (original seller photos)
    const { data: fotosSolicitud } = await supabase
      .from("fotos_solicitud")
      .select("url, tipo")
      .eq("solicitud_id", solicitud_id)
      .order("created_at", { ascending: true });

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const createPage = () => {
      const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: FOREST });
      page.drawText("RODADO", { x: MARGIN, y: PAGE_H - 40, size: 20, font: timesRoman, color: WHITE });
      page.drawText("Informe de inspección verificada", { x: MARGIN + 105, y: PAGE_H - 38, size: 10, font: helvetica, color: rgb(0.85, 0.85, 0.85) });
      page.drawLine({ start: { x: MARGIN, y: 40 }, end: { x: PAGE_W - MARGIN, y: 40 }, thickness: 0.5, color: LIGHT_GRAY });
      page.drawText("rodado.es — Servicio de venta verificada para particulares", { x: MARGIN, y: 26, size: 7, font: helvetica, color: GRAY });
      page.drawText("Documento generado automáticamente", { x: PAGE_W - MARGIN - 160, y: 26, size: 7, font: helvetica, color: GRAY });
      return page;
    };

    // ═══════════════════════════════════════════════════════
    // PAGE 1: COVER WITH HERO IMAGE
    // ═══════════════════════════════════════════════════════
    let page = createPage();
    let y = PAGE_H - 100;

    // Try to embed a hero image (3/4 frontal or frontal)
    const heroUrl = inspeccion?.foto_34_frontal_url || inspeccion?.foto_frontal_url || null;
    if (heroUrl) {
      const heroImg = await fetchAndEmbedImage(pdfDoc, heroUrl);
      if (heroImg) {
        const imgDims = heroImg.scale(1);
        const maxW = CONTENT_W;
        const maxH = 220;
        const scale = Math.min(maxW / imgDims.width, maxH / imgDims.height);
        const drawW = imgDims.width * scale;
        const drawH = imgDims.height * scale;
        const imgX = MARGIN + (CONTENT_W - drawW) / 2;

        // Background behind image
        page.drawRectangle({ x: MARGIN - 3, y: y - drawH - 6, width: CONTENT_W + 6, height: drawH + 10, color: SAND_BG });
        page.drawImage(heroImg, { x: imgX, y: y - drawH - 2, width: drawW, height: drawH });
        y -= drawH + 20;
      }
    }

    // Vehicle name
    const vehicleName = `${sol.marca} ${sol.modelo}`;
    page.drawText(vehicleName.toUpperCase(), { x: MARGIN, y, size: 26, font: timesRoman, color: DARK });
    y -= 28;
    page.drawText(`${sol.anio}`, { x: MARGIN, y, size: 18, font: helveticaBold, color: OCRE });

    // Price if available
    if (sol.precio_venta) {
      const priceText = `${sol.precio_venta.toLocaleString("es-ES")} €`;
      const priceW = timesRoman.widthOfTextAtSize(priceText, 18);
      page.drawText(priceText, { x: PAGE_W - MARGIN - priceW, y, size: 18, font: timesRoman, color: FOREST });
    }
    y -= 25;

    // Divider
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 2, color: OCRE });
    y -= 22;

    // Key data grid
    const dataPoints: [string, string][] = [
      ["Tipo", sol.tipo_vehiculo || "—"],
      ["Kilómetros", `${sol.km?.toLocaleString("es-ES") || "—"} km`],
      ["Ubicación", sol.provincia || "—"],
    ];
    if (inspeccion) {
      if (inspeccion.combustible) dataPoints.push(["Combustible", inspeccion.combustible]);
      if (inspeccion.potencia_cv) dataPoints.push(["Potencia", `${inspeccion.potencia_cv} CV`]);
      if (inspeccion.transmision) dataPoints.push(["Transmisión", inspeccion.transmision]);
      if (inspeccion.plazas) dataPoints.push(["Plazas", String(inspeccion.plazas)]);
      if (inspeccion.longitud_mm) dataPoints.push(["Longitud", `${(inspeccion.longitud_mm / 1000).toFixed(2)} m`]);
      if (inspeccion.mma_kg) dataPoints.push(["MMA", `${inspeccion.mma_kg} kg`]);
      if (inspeccion.peso_vacio_kg) dataPoints.push(["Peso vacío", `${inspeccion.peso_vacio_kg} kg`]);
      if (inspeccion.cilindrada) dataPoints.push(["Cilindrada", `${inspeccion.cilindrada} cc`]);
    }

    const colW = CONTENT_W / 3;
    dataPoints.forEach(([label, value], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const xPos = MARGIN + col * colW;
      const yPos = y - row * 34;
      page.drawText(label.toUpperCase(), { x: xPos, y: yPos, size: 7, font: helveticaBold, color: GRAY });
      page.drawText(value, { x: xPos, y: yPos - 13, size: 11, font: helveticaBold, color: DARK });
    });
    y -= Math.ceil(dataPoints.length / 3) * 34 + 12;

    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: LIGHT_GRAY });
    y -= 25;

    // Score + Recommendation
    if (inspeccion?.puntuacion_general) {
      const circleX = MARGIN + 30;
      const circleY = y - 5;
      page.drawCircle({ x: circleX, y: circleY, size: 25, color: FOREST });
      const scoreText = String(inspeccion.puntuacion_general);
      page.drawText(scoreText, { x: circleX - (scoreText.length > 1 ? 10 : 5), y: circleY - 8, size: 20, font: timesRoman, color: WHITE });
      page.drawText("/10", { x: circleX + (scoreText.length > 1 ? 10 : 6), y: circleY - 3, size: 8, font: helvetica, color: WHITE });

      const recomTexts: Record<string, string> = {
        recomendado: "RECOMENDADO",
        recomendado_con_reservas: "CON RESERVAS",
        no_recomendado: "NO RECOMENDADO",
      };
      const recomColors: Record<string, typeof GREEN> = {
        recomendado: GREEN,
        recomendado_con_reservas: YELLOW,
        no_recomendado: RED,
      };
      const recomKey = inspeccion.recomendacion || "recomendado";
      page.drawText(recomTexts[recomKey] || recomKey, { x: MARGIN + 65, y: y - 2, size: 14, font: helveticaBold, color: recomColors[recomKey] || DARK });
      page.drawText("Valoración del taller verificador", { x: MARGIN + 65, y: y - 18, size: 9, font: helvetica, color: GRAY });
      y -= 50;
    }

    // Taller info
    if (taller) {
      page.drawText(`Inspección realizada por: ${taller.nombre_taller}`, { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
      y -= 14;
      page.drawText(`Ubicación taller: ${taller.provincia}`, { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
      y -= 14;
    }
    if (inspeccion?.created_at) {
      page.drawText(`Fecha: ${new Date(inspeccion.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`, { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
      y -= 25;
    }

    // Observaciones generales
    if (inspeccion?.observaciones_generales) {
      if (y < 100) { page = createPage(); y = PAGE_H - 100; }
      page.drawRectangle({ x: MARGIN, y: y - 60, width: CONTENT_W, height: 70, color: SAND_BG });
      page.drawText("OBSERVACIONES GENERALES", { x: MARGIN + 10, y: y - 5, size: 10, font: helveticaBold, color: FOREST });
      const obsLines = wrapText(inspeccion.observaciones_generales, helvetica, 9, CONTENT_W - 20);
      let obsY = y - 20;
      for (const line of obsLines.slice(0, 4)) {
        page.drawText(line, { x: MARGIN + 10, y: obsY, size: 9, font: helvetica, color: DARK });
        obsY -= 13;
      }
      y -= 80;
    }

    // Puntos destacados
    if (inspeccion?.puntos_destacados) {
      if (y < 100) { page = createPage(); y = PAGE_H - 100; }
      page.drawRectangle({ x: MARGIN, y: y - 60, width: CONTENT_W, height: 70, color: LIGHT_GREEN_BG });
      page.drawText("PUNTOS DESTACADOS", { x: MARGIN + 10, y: y - 5, size: 10, font: helveticaBold, color: GREEN });
      const puntosLines = wrapText(inspeccion.puntos_destacados, helvetica, 9, CONTENT_W - 20);
      let pY = y - 20;
      for (const line of puntosLines.slice(0, 4)) {
        page.drawText(line, { x: MARGIN + 10, y: pY, size: 9, font: helvetica, color: DARK });
        pY -= 13;
      }
      y -= 80;
    }

    // ═══════════════════════════════════════════════════════
    // PHOTO GALLERY PAGES
    // ═══════════════════════════════════════════════════════
    if (inspeccion) {
      // Collect all available photos
      const photoEntries: { label: string; url: string }[] = [];
      for (const pf of PHOTO_FIELDS) {
        const url = inspeccion[pf.key];
        if (url) photoEntries.push({ label: pf.label, url });
      }
      // Add fotos_adicionales
      if (inspeccion.fotos_adicionales_urls?.length) {
        inspeccion.fotos_adicionales_urls.forEach((url: string, i: number) => {
          photoEntries.push({ label: `Adicional ${i + 1}`, url });
        });
      }

      if (photoEntries.length > 0) {
        // Fetch all images in parallel (max 20)
        const toFetch = photoEntries.slice(0, 20);
        const imageResults = await Promise.allSettled(
          toFetch.map(async (entry) => {
            const img = await fetchAndEmbedImage(pdfDoc, entry.url);
            return { label: entry.label, img };
          })
        );

        const embeddedPhotos = imageResults
          .filter((r): r is PromiseFulfilledResult<{ label: string; img: any }> => r.status === "fulfilled" && r.value.img !== null)
          .map((r) => r.value);

        if (embeddedPhotos.length > 0) {
          // Layout: 2 columns, 3 rows per page = 6 photos per page
          const COLS = 2;
          const ROWS = 3;
          const GAP = 12;
          const imgCellW = (CONTENT_W - GAP) / COLS;
          const imgCellH = 180;
          const PHOTOS_PER_PAGE = COLS * ROWS;

          for (let pageIdx = 0; pageIdx < Math.ceil(embeddedPhotos.length / PHOTOS_PER_PAGE); pageIdx++) {
            page = createPage();
            y = PAGE_H - 80;

            if (pageIdx === 0) {
              page.drawText("GALERÍA FOTOGRÁFICA", { x: MARGIN, y, size: 16, font: timesRoman, color: FOREST });
              y -= 8;
              page.drawText("Fotografías tomadas durante la inspección del vehículo", { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
              y -= 20;
            }

            const startIdx = pageIdx * PHOTOS_PER_PAGE;
            const pagePhotos = embeddedPhotos.slice(startIdx, startIdx + PHOTOS_PER_PAGE);

            for (let i = 0; i < pagePhotos.length; i++) {
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              const cellX = MARGIN + col * (imgCellW + GAP);
              const cellY = y - row * (imgCellH + 28);

              const { label, img } = pagePhotos[i];
              const dims = img.scale(1);
              const scale = Math.min(imgCellW / dims.width, (imgCellH - 18) / dims.height);
              const drawW = dims.width * scale;
              const drawH = dims.height * scale;

              // Image background
              page.drawRectangle({
                x: cellX,
                y: cellY - imgCellH,
                width: imgCellW,
                height: imgCellH,
                color: SAND_BG,
                borderColor: LIGHT_GRAY,
                borderWidth: 0.5,
              });

              // Center image in cell
              const imgX = cellX + (imgCellW - drawW) / 2;
              const imgY = cellY - imgCellH + (imgCellH - 18 - drawH) / 2 + 18;
              page.drawImage(img, { x: imgX, y: imgY, width: drawW, height: drawH });

              // Label below
              page.drawText(label.toUpperCase(), {
                x: cellX + 6,
                y: cellY - imgCellH + 5,
                size: 7,
                font: helveticaBold,
                color: FOREST,
              });
            }
          }
        }
      }

      // ── Fotos de desperfectos ──
      if (inspeccion.fotos_desperfectos_urls?.length > 0) {
        const despUrls: string[] = inspeccion.fotos_desperfectos_urls;
        const despImages = await Promise.allSettled(
          despUrls.slice(0, 12).map(async (url: string) => {
            const img = await fetchAndEmbedImage(pdfDoc, url);
            return img;
          })
        );

        const embeddedDesp = despImages
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
          .map((r) => r.value);

        if (embeddedDesp.length > 0) {
          page = createPage();
          y = PAGE_H - 80;

          // Title with warning color
          page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 28, color: LIGHT_YELLOW_BG });
          page.drawText("DESPERFECTOS DETECTADOS", { x: MARGIN + 10, y: y, size: 14, font: timesRoman, color: YELLOW });
          y -= 12;
          page.drawText("Fotos tomadas por el verificador durante la inspección", { x: MARGIN + 10, y, size: 8, font: helvetica, color: GRAY });
          y -= 25;

          const COLS = 2;
          const imgCellW = (CONTENT_W - 12) / COLS;
          const imgCellH = 170;

          for (let i = 0; i < embeddedDesp.length; i++) {
            const col = i % COLS;
            if (col === 0 && i > 0) y -= imgCellH + 15;
            if (y - imgCellH < 60) { page = createPage(); y = PAGE_H - 100; }

            const cellX = MARGIN + col * (imgCellW + 12);
            const img = embeddedDesp[i];
            const dims = img.scale(1);
            const scale = Math.min(imgCellW / dims.width, imgCellH / dims.height);
            const drawW = dims.width * scale;
            const drawH = dims.height * scale;

            page.drawRectangle({
              x: cellX,
              y: y - imgCellH,
              width: imgCellW,
              height: imgCellH,
              borderColor: YELLOW,
              borderWidth: 1,
              color: WHITE,
            });

            const imgX = cellX + (imgCellW - drawW) / 2;
            const imgY = y - imgCellH + (imgCellH - drawH) / 2;
            page.drawImage(img, { x: imgX, y: imgY, width: drawW, height: drawH });
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // CHECKLIST PAGES
    // ═══════════════════════════════════════════════════════
    page = createPage();
    y = PAGE_H - 100;

    page.drawText("CHECKLIST DE INSPECCIÓN", { x: MARGIN, y, size: 16, font: timesRoman, color: FOREST });
    y -= 10;
    page.drawText("Más de 80 puntos revisados por taller especializado", { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
    y -= 25;

    for (const section of INSPECCION_SECTIONS) {
      if (y < 120) { page = createPage(); y = PAGE_H - 100; }

      page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 22, color: SAND_BG });
      page.drawText(section.section.toUpperCase(), { x: MARGIN + 10, y, size: 10, font: helveticaBold, color: FOREST });

      // Section score
      const sectionItems = section.items.filter((item) => inspeccion?.[`${item.key}_estado`]);
      const sectionCorrect = sectionItems.filter((item) => inspeccion?.[`${item.key}_estado`] === "correcto").length;
      if (sectionItems.length > 0) {
        const scoreText = `${sectionCorrect}/${sectionItems.length}`;
        const scoreW = helveticaBold.widthOfTextAtSize(scoreText, 9);
        const scoreColor = sectionCorrect === sectionItems.length ? GREEN : YELLOW;
        page.drawText(scoreText, { x: PAGE_W - MARGIN - scoreW - 10, y, size: 9, font: helveticaBold, color: scoreColor });
      }
      y -= 28;

      for (const item of section.items) {
        if (y < 60) { page = createPage(); y = PAGE_H - 100; }

        const estado = inspeccion?.[`${item.key}_estado`] || "—";
        const obs = inspeccion?.[`${item.key}_obs`] || "";

        const statusColor = estado === "correcto" ? GREEN : estado === "con_observaciones" ? YELLOW : LIGHT_GRAY;
        page.drawCircle({ x: MARGIN + 8, y: y + 3, size: 4, color: statusColor });
        page.drawText(item.label, { x: MARGIN + 20, y, size: 9, font: helveticaBold, color: DARK });

        const statusText = estado === "correcto" ? "Correcto" : estado === "con_observaciones" ? "Observaciones" : estado === "no_aplica" ? "N/A" : "—";
        const statusTextColor = estado === "correcto" ? GREEN : estado === "con_observaciones" ? YELLOW : GRAY;
        const statusWidth = helvetica.widthOfTextAtSize(statusText, 8);
        page.drawText(statusText, { x: PAGE_W - MARGIN - statusWidth, y, size: 8, font: helveticaBold, color: statusTextColor });

        y -= 14;

        if (obs) {
          const obsWrapped = wrapText(obs, helvetica, 8, CONTENT_W - 30);
          for (const oLine of obsWrapped) {
            if (y < 60) { page = createPage(); y = PAGE_H - 100; }
            page.drawText(oLine, { x: MARGIN + 20, y, size: 8, font: helvetica, color: GRAY });
            y -= 11;
          }
        }
        y -= 4;
      }
      y -= 10;
    }

    // ═══════════════════════════════════════════════════════
    // EQUIPMENT
    // ═══════════════════════════════════════════════════════
    if (inspeccion) {
      if (y < 200) { page = createPage(); y = PAGE_H - 100; }

      page.drawText("EQUIPAMIENTO VERIFICADO", { x: MARGIN, y, size: 12, font: timesRoman, color: FOREST });
      y -= 22;

      const equipment: [string, string][] = [];
      if (inspeccion.cama_fija) equipment.push(["Cama fija", "Sí"]);
      if (inspeccion.dinette) equipment.push(["Dinette", "Sí"]);
      if (inspeccion.cocina_fuegos > 0) equipment.push(["Cocina", `${inspeccion.cocina_fuegos} fuegos`]);
      if (inspeccion.cocina_horno) equipment.push(["Horno", "Sí"]);
      if (inspeccion.cocina_microondas) equipment.push(["Microondas", "Sí"]);
      if (inspeccion.frigorifico_tipo && inspeccion.frigorifico_tipo !== "no_tiene") equipment.push(["Frigorífico", inspeccion.frigorifico_tipo]);
      if (inspeccion.banio_completo) equipment.push(["Baño completo", "Sí"]);
      if (inspeccion.ducha_separada) equipment.push(["Ducha separada", "Sí"]);
      if (inspeccion.wc_tipo && inspeccion.wc_tipo !== "no_tiene") equipment.push(["WC", inspeccion.wc_tipo]);
      if (inspeccion.ac_tiene) equipment.push(["Aire acondicionado", inspeccion.ac_marca || "Sí"]);
      if (inspeccion.calefaccion_marca) equipment.push(["Calefacción", inspeccion.calefaccion_marca]);
      if (inspeccion.calefaccion_webasto_tiene) equipment.push(["Webasto/Truma", inspeccion.calefaccion_webasto_modelo || "Sí"]);
      if (inspeccion.panel_solar_tiene) equipment.push(["Panel solar", inspeccion.panel_solar_w ? `${inspeccion.panel_solar_w}W` : "Sí"]);
      if (inspeccion.toldo_tiene) equipment.push(["Toldo", inspeccion.toldo_tipo || "Sí"]);
      if (inspeccion.inversor_tiene) equipment.push(["Inversor", inspeccion.inversor_w ? `${inspeccion.inversor_w}W` : "Sí"]);
      if (inspeccion.bateria_servicio_tipo) equipment.push(["Batería servicio", `${inspeccion.bateria_servicio_tipo.toUpperCase()}${inspeccion.bateria_servicio_ah ? ` ${inspeccion.bateria_servicio_ah}Ah` : ""}`]);
      if (inspeccion.agua_deposito_limpia_l) equipment.push(["Agua limpia", `${inspeccion.agua_deposito_limpia_l}L`]);
      if (inspeccion.agua_deposito_grises_l) equipment.push(["Aguas grises", `${inspeccion.agua_deposito_grises_l}L`]);

      const eqColW = CONTENT_W / 2;
      equipment.forEach(([label, value], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const xPos = MARGIN + col * eqColW;
        const yPos = y - row * 18;
        if (yPos < 60) return;
        if (col === 0 && row % 2 === 0) {
          page.drawRectangle({ x: MARGIN, y: yPos - 4, width: CONTENT_W, height: 18, color: SAND_BG });
        }
        page.drawText(label, { x: xPos, y: yPos, size: 9, font: helvetica, color: GRAY });
        page.drawText(value, { x: xPos + 120, y: yPos, size: 9, font: helveticaBold, color: DARK });
      });
      y -= Math.ceil(equipment.length / 2) * 18 + 15;

      // Extras
      if (inspeccion.extras_verificados?.length > 0) {
        if (y < 100) { page = createPage(); y = PAGE_H - 100; }
        page.drawText("EXTRAS", { x: MARGIN, y, size: 10, font: helveticaBold, color: FOREST });
        y -= 16;
        const extrasText = inspeccion.extras_verificados.join(" · ");
        const extrasLines = wrapText(extrasText, helvetica, 9, CONTENT_W);
        for (const line of extrasLines) {
          if (y < 60) { page = createPage(); y = PAGE_H - 100; }
          page.drawText(line, { x: MARGIN, y, size: 9, font: helvetica, color: DARK });
          y -= 13;
        }
        y -= 10;
      }
    }

    // ═══════════════════════════════════════════════════════
    // DOCUMENTATION
    // ═══════════════════════════════════════════════════════
    if (inspeccion && (inspeccion.itv_fecha_caducidad || inspeccion.num_propietarios)) {
      if (y < 120) { page = createPage(); y = PAGE_H - 100; }
      page.drawText("DOCUMENTACIÓN", { x: MARGIN, y, size: 12, font: timesRoman, color: FOREST });
      y -= 22;
      if (inspeccion.itv_fecha_caducidad) {
        page.drawText("ITV válida hasta:", { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
        page.drawText(new Date(inspeccion.itv_fecha_caducidad).toLocaleDateString("es-ES"), { x: MARGIN + 120, y, size: 9, font: helveticaBold, color: DARK });
        y -= 16;
      }
      if (inspeccion.historial_mantenimiento && inspeccion.historial_mantenimiento !== "no_disponible") {
        page.drawText("Historial mantenimiento:", { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
        page.drawText(inspeccion.historial_mantenimiento, { x: MARGIN + 120, y, size: 9, font: helveticaBold, color: DARK });
        y -= 16;
      }
      if (inspeccion.num_propietarios) {
        page.drawText("Propietarios anteriores:", { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
        page.drawText(String(inspeccion.num_propietarios), { x: MARGIN + 120, y, size: 9, font: helveticaBold, color: DARK });
        y -= 16;
      }
      page.drawText("Cargas/Embargos:", { x: MARGIN, y, size: 9, font: helvetica, color: GRAY });
      page.drawText(inspeccion.cargas_embargos ? "Sí" : "No", { x: MARGIN + 120, y, size: 9, font: helveticaBold, color: inspeccion.cargas_embargos ? RED : GREEN });
      y -= 25;
    }

    // ═══════════════════════════════════════════════════════
    // SELLO RODADO (FINAL)
    // ═══════════════════════════════════════════════════════
    if (y < 200) { page = createPage(); y = PAGE_H - 100; }

    const selloY = y - 10;
    page.drawRectangle({ x: MARGIN, y: selloY - 100, width: CONTENT_W, height: 110, color: FOREST, borderColor: OCRE, borderWidth: 2 });
    page.drawText("VEHÍCULO RODADO", { x: PAGE_W / 2 - 65, y: selloY - 30, size: 16, font: timesRoman, color: OCRE });
    page.drawText("Inspección verificada por taller especializado de la red Rodado", { x: PAGE_W / 2 - 170, y: selloY - 52, size: 9, font: helvetica, color: WHITE });
    page.drawText("Este documento certifica que el vehículo ha sido inspeccionado según el protocolo", { x: PAGE_W / 2 - 210, y: selloY - 70, size: 8, font: helvetica, color: rgb(0.85, 0.85, 0.85) });
    page.drawText("de más de 80 puntos de revisión de Rodado.", { x: PAGE_W / 2 - 110, y: selloY - 82, size: 8, font: helvetica, color: rgb(0.85, 0.85, 0.85) });

    // Serialize PDF
    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const fileName = `${solicitud_id}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("informes-pdf")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Failed to upload PDF: " + uploadError.message }), { status: 500, headers: corsHeaders });
    }

    const { data: publicUrlData } = supabase.storage.from("informes-pdf").getPublicUrl(fileName);
    const pdfUrl = publicUrlData.publicUrl;

    // Update informes with the PDF URL
    const { data: existingInforme } = await supabase.from("informes").select("id").eq("solicitud_id", solicitud_id).maybeSingle();
    if (existingInforme) {
      await supabase.from("informes").update({ url_pdf: pdfUrl }).eq("id", existingInforme.id);
    }

    return new Response(JSON.stringify({ url: pdfUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("PDF generation error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
