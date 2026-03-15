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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.warn("LOVABLE_API_KEY not configured, using direct Gemini fallback if available");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const data: ContractData = await req.json();

    let textContent = "";

    const prompt = data.tipo === 'contrato' 
      ? `Eres un experto legal en automoción en España. Redacta un contrato de compraventa de vehículo de segunda mano entre particulares conforme a la legislación española vigente.
      
      Datos del vendedor: ${data.vendedor.nombre}, DNI ${data.vendedor.dni}, ${data.vendedor.direccion}, ${data.vendedor.telefono}
      Datos del comprador: ${data.comprador.nombre}, DNI ${data.comprador.dni}, ${data.comprador.direccion}, ${data.comprador.telefono}
      Vehículo: ${data.vehiculo.marca} ${data.vehiculo.modelo} (${data.vehiculo.anio}), matrícula ${data.vehiculo.matricula}, bastidor ${data.vehiculo.bastidor}, ${data.vehiculo.km} km
      Operación: ${data.operacion.precio}€ — Forma de pago: ${data.operacion.forma_pago}
      Fecha: ${data.operacion.fecha}
      Observaciones: ${data.operacion.observaciones || "Ninguna"}
      
      Genera el contrato completo en español formal y jurídico. No incluyas comentarios externos, solo el texto del contrato.`
      : `Eres un experto legal en automoción en España. Redacta un recibo de señal para la reserva de un vehículo.
      
      Datos: Vendedor ${data.vendedor.nombre} (${data.vendedor.dni}), Comprador ${data.comprador.nombre} (${data.comprador.dni})
      Vehículo: ${data.vehiculo.marca} ${data.vehiculo.modelo}
      Importe señal: ${data.operacion.importe_senal || 0}€
      Condiciones: ${data.operacion.condiciones_devolucion}
      Fecha límite: ${data.operacion.fecha_limite}
      
      Genera el texto formal del recibo de señal.`;

    if (lovableApiKey) {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Responde solo con el texto legal solicitado, sin introducciones ni despedidas." },
            { role: "user", content: prompt }
          ],
          temperature: 0.5,
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        textContent = aiData.choices?.[0]?.message?.content || "No se pudo generar el texto.";
      } else {
        const errorText = await aiResponse.text();
        console.error("AI Gateway error:", errorText);
        throw new Error("Error en la conexión con el motor de IA");
      }
    } else {
      // Direct Gemini fallback if key is present but not Lovable one (unlikely in Lovable environment but safe)
      const genAiApiKey = Deno.env.get("GENAI_API_KEY") || Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY");
      if (genAiApiKey) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${genAiApiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const json = await response.json();
        textContent = json.candidates?.[0]?.content?.parts?.[0]?.text || "Error en fallback.";
      } else {
        textContent = `DOCUMENTO DE ${data.tipo.toUpperCase()}\n\n(Texto generado automáticamente por falta de conexión IA)\n\nEn fecha ${data.operacion.fecha}, comparecen...\n...`;
      }
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let page = pdfDoc.addPage([595.28, 841.89]);
    let y = 800;
    const margin = 50;
    const width = 595.28 - 2 * margin;

    // Logo / Brand
    page.drawText("RODADO — DOCUMENTACIÓN DE VENTA", { x: margin, y, size: 14, font: fontBold, color: rgb(0.11, 0.22, 0.18) });
    y -= 40;

    const items = textContent.split('\n');
    for (const item of items) {
      if (y < 60) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = 800;
      }
      
      const wrappedLines = wrapText(item, font, 10, width);
      for (const line of wrappedLines) {
         if (y < 60) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = 800;
        }
        page.drawText(line, { x: margin, y, size: 10, font: font });
        y -= 14;
      }
      y -= 6;
    }

    const pdfBytes = await pdfDoc.save();
    const fileName = `contratos/${data.solicitud_id}/${data.tipo}_${Date.now()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("documentos")
      .upload(fileName, pdfBytes, { contentType: "application/pdf" });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Error al guardar PDF: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage.from("documentos").getPublicUrl(fileName);

    // Save metadata
    const { error: dbError } = await (supabase as any)
      .from("documentos_venta")
      .insert({
        solicitud_id: data.solicitud_id,
        tipo: data.tipo,
        url_pdf: publicUrl,
        datos_comprador: data.comprador
      });

    if (dbError) {
      console.error("DB insert error:", dbError);
      throw new Error("Error al registrar el documento en la base de datos");
    }

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err: any) {
    console.error("Function error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});
