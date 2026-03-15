
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContractData {
  solicitud_id: string;
  tipo: 'contrato' | 'señal';
  vendedor: {
    nombre: string;
    dni: string;
    direccion: string;
    telefono: string;
  };
  comprador: {
    nombre: string;
    dni: string;
    direccion: string;
    telefono: string;
  };
  vehiculo: {
    marca: string;
    modelo: string;
    anio: number;
    matricula: string;
    bastidor: string;
    km: number;
  };
  operacion: {
    precio: number;
    forma_pago: string;
    fecha: string;
    importe_senal?: number;
    observaciones?: string;
    fecha_limite?: string;
    condiciones_devolucion?: string;
  };
}

function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const genAiApiKey = Deno.env.get("GENAI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const data: ContractData = await req.json();

    let textContent = "";

    if (genAiApiKey) {
      // Call Gemini
      const prompt = data.tipo === 'contrato' 
        ? `Redacta un contrato de compraventa de vehículo de segunda mano entre particulares conforme a la legislación española vigente. El contrato debe ser claro, profesional y proteger los intereses de ambas partes. Incluye todas las cláusulas estándar: identificación de las partes, descripción del vehículo, precio y forma de pago, estado del vehículo (vendido en el estado actual, sin garantía implícita), declaración de cargas y embargos, entrega de documentación, y firmas.

Datos del vendedor: ${data.vendedor.nombre}, DNI ${data.vendedor.dni}, ${data.vendedor.direccion}, ${data.vendedor.telefono}
Datos del comprador: ${data.comprador.nombre}, DNI ${data.comprador.dni}, ${data.comprador.direccion}, ${data.comprador.telefono}
Vehículo: ${data.vehiculo.marca} ${data.vehiculo.modelo} ${data.vehiculo.anio}, matrícula ${data.vehiculo.matricula}, bastidor ${data.vehiculo.bastidor}, ${data.vehiculo.km} km
Precio: ${data.operacion.precio}€ — Forma de pago: ${data.operacion.forma_pago}
Señal entregada previamente: ${data.operacion.importe_senal || 0}€ (si aplica)
Fecha: ${data.operacion.fecha}
Observaciones: ${data.operacion.observaciones || ""}

Genera el contrato completo en español formal y jurídico. Formato limpio, con secciones numeradas. Listo para imprimir y firmar.`
        : `Redacta un recibo de señal o reserva para la compra de un vehículo entre particulares en España. Debe incluir identificación de partes, descripción del vehículo, importe de la señal, forma de pago, condiciones de devolución y fecha límite.

Datos del vendedor: ${data.vendedor.nombre}, DNI ${data.vendedor.dni}
Datos del comprador: ${data.comprador.nombre}, DNI ${data.comprador.dni}
Vehículo: ${data.vehiculo.marca} ${data.vehiculo.modelo} (${data.vehiculo.anio})
Importe señal: ${data.operacion.precio}€
Fecha entrega: ${data.operacion.fecha}
Forma entrega: ${data.operacion.forma_pago}
Condiciones devolución: ${data.operacion.condiciones_devolucion}
Fecha límite para formalizar: ${data.operacion.fecha_limite}

Genera un texto formal de recibo listo para firmar.`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${genAiApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const json = await response.json();
      textContent = json.candidates?.[0]?.content?.parts?.[0]?.text || "Error generando texto con AI.";
    } else {
      // Fallback if no API key
      textContent = `CONTRATO DE COMPRAVENTA DE VEHÍCULO USADO\n\nEn la ciudad de ________ a fecha de ${data.operacion.fecha}...\n(Este es un texto de prueba ya que no se encontró API Key de Gemini)`;
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595.28, 841.89]);
    let y = 800;
    const margin = 50;
    const width = 595.28 - 2 * margin;

    // Title
    page.drawText("RODADO — DOCUMENTO DE VENTA", { x: margin, y, size: 14, font: fontBold, color: rgb(0.11, 0.22, 0.18) });
    y -= 30;

    const lines = textContent.split('\n');
    for (const line of lines) {
      if (y < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
      
      const wrapped = wrapText(line, font, 10, width);
      for (const wLine of wrapped) {
         if (y < 60) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = 800;
        }
        page.drawText(wLine, { x: margin, y, size: 10, font: font });
        y -= 14;
      }
      y -= 6; // Paragraph spacing
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `contratos/${data.solicitud_id}/${data.tipo}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(fileName, pdfBytes, { contentType: "application/pdf" });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(fileName);

    // Save to DB
    const { error: dbError } = await (supabase as any)
      .from("documentos_venta")
      .insert({
        solicitud_id: data.solicitud_id,
        tipo: data.tipo,
        url_pdf: publicUrl,
        datos_comprador: data.comprador
      });

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
