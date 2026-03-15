
import { useState, useEffect } from "react";
import VendedorLayout from "@/components/vendedor/VendedorLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  FileText, Lock, CheckCircle, AlertCircle, HelpCircle,
  ChevronDown, ChevronUp, Download, RefreshCw, Calculator,
  Share2, ArrowRight, CheckSquare, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

// Types
type DocumentStatus = 'tengo' | 'no_tengo' | 'no_se';

interface ChecklistDocs {
  permiso_circulacion: DocumentStatus;
  ficha_tecnica: DocumentStatus;
  itv_vigor: DocumentStatus;
  historial_mantenimiento: DocumentStatus;
  informe_cargas: DocumentStatus;
  dos_llaves: DocumentStatus;
}

const docExplanations = {
  permiso_circulacion: "El documento que acredita que el vehículo está a tu nombre. Si no lo tienes, solicita duplicado en Tráfico.",
  ficha_tecnica: "Documento obligatorio (tarjeta ITV). Si está caducada o la has perdido, solicita duplicado en cualquier estación ITV por unos 8,67€.",
  itv_vigor: "Si la ITV está caducada, el comprador no puede llevarse el vehículo legalmente. Pásala antes de vender.",
  historial_mantenimiento: "No es obligatorio pero aumenta mucho la confianza del comprador y justifica el precio.",
  informe_cargas: "Comprueba que el vehículo no tiene deudas pendientes. Puedes solicitarlo en la DGT por 8,67€ o en sede electrónica.",
  dos_llaves: "No es un documento pero el comprador siempre lo pregunta. Si solo tienes uno, avísalo en el anuncio."
};

const tiposITP: Record<string, number> = {
  'Andalucía': 0.04, 'Aragón': 0.05, 'Asturias': 0.08,
  'Baleares': 0.06, 'Canarias': 0.065, 'Cantabria': 0.06,
  'Castilla-La Mancha': 0.07, 'Castilla y León': 0.04,
  'Cataluña': 0.05, 'Extremadura': 0.08, 'Galicia': 0.04,
  'La Rioja': 0.06, 'Madrid': 0.06, 'Murcia': 0.06,
  'Navarra': 0.06, 'País Vasco': 0.04, 'Valencia': 0.08,
  'Ceuta': 0.03, 'Melilla': 0.03
};

const VendedorDocumentacion = () => {
  const { user } = useAuth();
  const { width, height } = useWindowSize();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [vendedorExtraData, setVendedorExtraData] = useState({
    dni: "",
    direccion: ""
  });
  const [checklist, setChecklist] = useState<ChecklistDocs>({
    permiso_circulacion: 'no_tengo',
    ficha_tecnica: 'no_tengo',
    itv_vigor: 'no_tengo',
    historial_mantenimiento: 'no_tengo',
    informe_cargas: 'no_tengo',
    dos_llaves: 'no_tengo'
  });
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [docsGenerados, setDocsGenerados] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form states for modules
  const [compradorData, setCompradorData] = useState({
    nombre: "",
    dni: "",
    direccion: "",
    telefono: ""
  });
  const [vehiculoExtraData, setVehiculoExtraData] = useState({
    matricula: "",
    bastidor: ""
  });
  const [operacionData, setOperacionData] = useState({
    precioFinal: 0,
    formaPago: "transferencia",
    fecha: new Date(),
    tieneSenal: false,
    importeSenal: 0,
    incluyeTransporte: false,
    observaciones: "",
    fechaLimite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    condicionesDevolucion: "Se descuenta del precio final. Se pierde si el comprador desiste."
  });

  // ITP Calculator states
  const [itpCal, setItpCal] = useState({
    precio: 0,
    anio: 2020,
    comunidad: 'Madrid'
  });

  // Post-sale guide states
  const [postSaleChecks, setPostSaleChecks] = useState({
    dgt: false,
    seguro: false,
    itp: false,
    ivtm: false,
    contrato: false
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const { data: userProfile } = await supabase
        .from("usuarios")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (userProfile) {
        setUsuario(userProfile);
        setVendedorExtraData({
          dni: (userProfile as any).dni || "",
          direccion: (userProfile as any).direccion || ""
        });
      }

      const { data: sol } = await (supabase as any)
        .from("solicitudes")
        .select("*, kit_publicacion(*)")
        .eq("vendedor_id", userProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (sol) {
        setSolicitud(sol);
        setOperacionData(prev => ({ 
          ...prev, 
          precioFinal: sol.precio_venta || 0,
          incluyeTransporte: sol.incluye_transporte || false
        }));
        setItpCal(prev => ({ 
          ...prev, 
          precio: sol.precio_venta || 0,
          anio: sol.anio || 2020
        }));

        // Load checklist with error handling and fallback
        try {
          const { data: clData, error: clError } = await (supabase as any)
            .from("checklist_documentos")
            .select("*")
            .eq("solicitud_id", sol.id)
            .maybeSingle();
          
          if (clError) {
            console.warn("Checklist table may not exist yet:", clError.message);
            // Fallback to local storage
            const localCl = localStorage.getItem(`checklist_${sol.id}`);
            if (localCl) setChecklist(JSON.parse(localCl));
          } else if (clData) {
            setChecklist({
              permiso_circulacion: clData.permiso_circulacion as DocumentStatus,
              ficha_tecnica: clData.ficha_tecnica as DocumentStatus,
              itv_vigor: clData.itv_vigor as DocumentStatus,
              historial_mantenimiento: clData.historial_mantenimiento as DocumentStatus,
              informe_cargas: clData.informe_cargas as DocumentStatus,
              dos_llaves: clData.dos_llaves as DocumentStatus
            });
          }
        } catch (err) {
          console.error("Error loading checklist:", err);
          const localCl = localStorage.getItem(`checklist_${sol.id}`);
          if (localCl) setChecklist(JSON.parse(localCl));
        }

        // Load history with error handling and fallback
        try {
          const { data: hist, error: histError } = await (supabase as any)
            .from("documentos_venta")
            .select("*")
            .eq("solicitud_id", sol.id)
            .order("created_at", { ascending: false });
          
          if (histError) {
            const localHist = localStorage.getItem(`historial_${sol.id}`);
            if (localHist) setDocsGenerados(JSON.parse(localHist));
          } else if (hist) {
            setDocsGenerados(hist);
          }
        } catch (err) {
          console.error("Error loading document history:", err);
          const localHist = localStorage.getItem(`historial_${sol.id}`);
          if (localHist) setDocsGenerados(JSON.parse(localHist));
        }
      }
      setLoading(false);
    };

    loadData();
  }, [user]);

  const loadHistory = async (solId: string) => {
    const { data } = await (supabase as any)
      .from("documentos_venta")
      .select("*")
      .eq("solicitud_id", solId)
      .order("created_at", { ascending: false });
    if (data) setDocsGenerados(data);
  };

  const handleChecklistChange = async (doc: keyof ChecklistDocs, status: DocumentStatus) => {
    const newChecklist = { ...checklist, [doc]: status };
    setChecklist(newChecklist);
    setSavingChecklist(true);

    try {
      if (solicitud) {
        console.log("Saving checklist for solicitud:", solicitud.id, doc, status);
        // Ensure local fallback works unconditionally first
        localStorage.setItem(`checklist_${solicitud.id}`, JSON.stringify(newChecklist));
        
        const { error } = await (supabase as any)
          .from("checklist_documentos")
          .upsert({
            solicitud_id: solicitud.id,
            [doc]: status,
            updated_at: new Date().toISOString()
          }, { onConflict: 'solicitud_id' });
        
        if (error) {
          console.warn("Supabase upsert failed, strictly using local fallback:", error.message);
        }
      }
    } catch (error) {
      console.warn("Backend unavailable, using local memory.");
    } finally {
      setSavingChecklist(false);
    }
  };

  const createFallbackPDF = (tipo: 'contrato' | 'señal', data: any) => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    
    let y = 20;

    const checkPageBreak = (neededLines: number) => {
      if (y + (neededLines * 7) > 280) {
        doc.addPage();
        y = 20;
      }
    };

    const addLine = (text: string, bold = false, size = 11, marginTop = 0) => {
      y += marginTop;
      checkPageBreak(1);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      const split = doc.splitTextToSize(text, 170);
      checkPageBreak(split.length);
      doc.text(split, 20, y);
      y += (split.length * (size * 0.45));
    };

    const fechaFormateada = format(operacionData.fecha, "dd 'de' MMMM 'de' yyyy", { locale: es });

    if (tipo === 'contrato') {
      addLine("CONTRATO DE COMPRAVENTA DE VEHÍCULO USADO ENTRE PARTICULARES", true, 14, 0);
      addLine(`En ${solicitud?.provincia || "lugar de firma"}, a ${fechaFormateada}`, false, 11, 10);
      
      addLine("REUNIDOS", true, 12, 10);
      addLine(`De una parte, como VENDEDOR: D./Dña. ${usuario?.nombre || "____________________"}, mayor de edad, con DNI/NIF ${vendedorExtraData.dni || "__________"} y domicilio en ${vendedorExtraData.direccion || "____________________"}.`, false, 11, 5);
      addLine(`De otra parte, como COMPRADOR: D./Dña. ${compradorData.nombre || "____________________"}, mayor de edad, con DNI/NIF ${compradorData.dni || "__________"} y domicilio en ${compradorData.direccion || "____________________"}.`, false, 11, 5);
      
      addLine("Ambas partes intervienen en su propio nombre y derecho, y se reconocen recíprocamente la capacidad legal y necesaria para la celebración del presente CONTRATO DE COMPRAVENTA, de acuerdo con las siguientes:", false, 11, 5);

      addLine("CLÁUSULAS", true, 12, 10);
      
      addLine(`PRIMERA.- El VENDEDOR es propietario del vehículo marca ${solicitud?.marca || "__________"}, modelo ${solicitud?.modelo || "__________"}, matrícula ${vehiculoExtraData.matricula || "__________"}, número de bastidor ${vehiculoExtraData.bastidor || "__________"} y con ${solicitud?.km || "0"} kilómetros indicados en el odómetro.`, false, 11, 5);
      
      addLine(`SEGUNDA.- El VENDEDOR vende al COMPRADOR el vehículo reseñado en la cláusula anterior por la cantidad de ${operacionData.precioFinal || "0"} EUROS (${operacionData.precioFinal || "0"} €).`, false, 11, 5);
      
      addLine(`TERCERA.- El pago de la cantidad de ${operacionData.precioFinal || "0"} EUROS se realiza mediante ${operacionData.formaPago || "__________"} en el momento de la firma de este contrato. En caso de existir una señal previa entregada de ${operacionData.importeSenal || "0"} EUROS, ésta se descuenta del precio final total, sirviendo este documento de eficaz carta de pago.`, false, 11, 5);
      
      addLine(`CUARTA.- El COMPRADOR declara conocer el estado actual físico y mecánico del vehículo. El vehículo se vende en el estado actual en el que se encuentra, eximiendo al VENDEDOR de garantía alguna sobre averías futuras o desgastes propios del uso, salvo aquellos vicios o defectos ocultos sujetos al artículo 1484 del Código Civil.`, false, 11, 5);
      
      addLine(`QUINTA.- El VENDEDOR declara responsablemente que sobre el vehículo no pesa embargo, reserva de dominio, precinto, cargas impositivas, deudas, ni cualquier otra limitación de disposición. En caso contrario, el VENDEDOR se hace cargo de su cancelación y costas.`, false, 11, 5);
      
      addLine(`SEXTA.- Desde la fecha y hora de la firma de este contrato, el COMPRADOR asume la posesión del vehículo y se hace cargo de cuantas responsabilidades civiles, administrativas o de tráfico puedan contraerse por la propiedad y uso del mismo, eximiendo al VENDEDOR de cualquier contingencia derivada desde este mismo instante. El COMPRADOR se compromete a realizar la transferencia comercial en las próximas semanas.`, false, 11, 5);
      
      if (operacionData.observaciones) {
        addLine(`SÉPTIMA (OBSERVACIONES).- ${operacionData.observaciones}`, false, 11, 5);
      }

      addLine("Y para que así conste, y en prueba de conformidad con todo lo anterior, ambas partes firman el presente contrato por duplicado, a un solo efecto, en el lugar y fecha arriba indicados.", false, 11, 10);

    } else {
      addLine("RECIBO DE SEÑAL / RESERVA DE VEHÍCULO", true, 14, 0);
      addLine(`En ${solicitud?.provincia || "lugar de firma"}, a ${fechaFormateada}`, false, 11, 10);
      
      addLine("REUNIDOS", true, 12, 10);
      addLine(`VENDEDOR: D./Dña. ${usuario?.nombre || "____________________"}, constando DNI/NIF ${vendedorExtraData.dni || "__________"}.`, false, 11, 5);
      addLine(`COMPRADOR: D./Dña. ${compradorData.nombre || "____________________"}, constando DNI/NIF ${compradorData.dni || "__________"}.`, false, 11, 5);
      
      addLine("ACUERDAN", true, 12, 10);
      
      addLine(`PRIMERO.- El COMPRADOR hace entrega al VENDEDOR en este acto de la cantidad de ${operacionData.importeSenal || "0"} EUROS (${operacionData.importeSenal || "0"} €) en concepto de SEÑAL o RESERVA firme para la futura compra del vehículo marca ${solicitud?.marca || "__________"}, modelo ${solicitud?.modelo || "__________"}, y matrícula ${vehiculoExtraData.matricula || "__________"}.`, false, 11, 5);
      
      addLine(`SEGUNDO.- El precio total acordado para la futura compraventa se fija en ${operacionData.precioFinal || "0"} EUROS.`, false, 11, 5);
      
      addLine(`TERCERO.- Ambas partes fijan como fecha límite improrrogable para formalizar el contrato de compraventa y abonar la cantidad restante el día ${format(operacionData.fechaLimite, "dd 'de' MMMM 'de' yyyy", { locale: es })}.`, false, 11, 5);
      
      let condicionesText = "";
      if (operacionData.condicionesDevolucion === "precio") condicionesText = "La señal se descontará integramente del precio final estipulado en la compra.";
      else if (operacionData.condicionesDevolucion === "pierde") condicionesText = "Si el COMPRADOR desiste de la compraventa antes de la fecha límite, perderá la totalidad de la cantidad entregada como señal a favor del VENDEDOR. Si es el VENDEDOR quien desiste, devolverá la señal duplicada al COMPRADOR.";
      else if (operacionData.condicionesDevolucion === "vendedor") condicionesText = "Si el VENDEDOR se niega a vender el vehículo en las condiciones pactadas, deberá devolver la señal duplicada al COMPRADOR.";
      else condicionesText = operacionData.condicionesDevolucion || "La señal entregada es firme y condiciona la reserva excluyendo a otros posibles compradores.";
      
      addLine(`CUARTO (CONDICIONES).- ${condicionesText}`, false, 11, 5);
      
      addLine("Y en prueba de la más estricta conformidad, ambas partes firman el presente recibo por duplicado.", false, 11, 10);
    }

    checkPageBreak(5);
    y += 20;
    addLine("Firma de EL VENDEDOR                                                 Firma de EL COMPRADOR", true, 12, 0);
    
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    
    // Auto download it
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tipo}_${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return url;
  };

  const calculateProgress = () => {
    const items = Object.values(checklist);
    const count = items.filter(i => i === 'tengo').length;
    return (count / items.length) * 100;
  };

  const isComplete = calculateProgress() === 100;

  const handleMarkAsSold = async () => {
    if (!solicitud) return;
    
    try {
      const { error: solError } = await (supabase as any)
        .from("solicitudes")
        .update({ estado_venta: 'vendido', estado: 'publicado' }) // Keep as is or update as needed
        .eq("id", solicitud.id);
      
      const { error: fichaError } = await (supabase as any)
        .from("fichas")
        .update({ activa: false })
        .eq("solicitud_id", solicitud.id);

      if (solError || fichaError) throw solError || fichaError;

      setSolicitud({ ...solicitud, estado_venta: 'vendido' });
      toast.success("¡Enhorabuena! Vehículo marcado como vendido.");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error("Error marking as sold:", error);
      toast.error("Hubo un problema al actualizar el estado");
    }
  };

  const generateContract = async (tipo: 'contrato' | 'señal') => {
    if (!solicitud || !usuario) return;
    
    if (tipo === 'contrato' && (!compradorData.nombre || !compradorData.dni)) {
      toast.warning("Por favor rellena los datos del comprador");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading(`Generando ${tipo}...`);

    try {
      const { data, error } = await supabase.functions.invoke('generar-contrato', {
        body: {
          solicitud_id: solicitud.id,
          tipo,
          vendedor: {
            nombre: usuario.nombre,
            dni: vendedorExtraData.dni,
            direccion: vendedorExtraData.direccion,
            telefono: usuario.telefono || ""
          },
          comprador: compradorData,
          vehiculo: {
            marca: solicitud.marca,
            modelo: solicitud.modelo,
            anio: solicitud.anio,
            matricula: vehiculoExtraData.matricula,
            bastidor: vehiculoExtraData.bastidor,
            km: solicitud.km
          },
          operacion: {
            precio: operacionData.precioFinal,
            forma_pago: operacionData.formaPago,
            fecha: format(operacionData.fecha, "dd/MM/yyyy"),
            importe_senal: operacionData.importeSenal,
            observaciones: operacionData.observaciones,
            fecha_limite: format(operacionData.fechaLimite, "dd/MM/yyyy"),
            condiciones_devolucion: operacionData.condicionesDevolucion
          }
        }
      });

      if (error) {
        console.warn("Respuesta del servidor falló (¿Tabla no existe?). Generando PDF localmente...");
        const fallbackUrl = createFallbackPDF(tipo, {});
        
        // Save history to localStorage
        const newHist = {
          id: `local-${Date.now()}`,
          solicitud_id: solicitud.id,
          tipo,
          url_pdf: fallbackUrl,
          datos_comprador: compradorData,
          created_at: new Date().toISOString()
        };
        const localHist = JSON.parse(localStorage.getItem(`historial_${solicitud.id}`) || "[]");
        localStorage.setItem(`historial_${solicitud.id}`, JSON.stringify([newHist, ...localHist]));
        setDocsGenerados(prev => [newHist, ...prev]);

        toast.success(`Error en servidor superado. Documento descargado en tu ordenador.`, { id: toastId });
        return;
      }

      toast.success(`${tipo === 'contrato' ? 'Contrato' : 'Recibo'} generado en la nube y guardado`, { id: toastId });
      loadHistory(solicitud.id);
    } catch (error: any) {
      console.warn("Error crítico. Generando PDF localmente...");
      const fallbackUrl = createFallbackPDF(tipo, {});
      toast.success(`¡Generado y descargado localmente por fallo de conexión!`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <VendedorLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-ocre" />
        </div>
      </VendedorLayout>
    );
  }

  if (!solicitud) {
    return (
      <VendedorLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-xl font-semibold">No tienes una solicitud activa</h2>
          <p className="text-muted-foreground">Crea una solicitud para ver tu asistente de documentación.</p>
          <Button asChild>
            <a href="/vendedor">Ir a mi solicitud</a>
          </Button>
        </div>
      </VendedorLayout>
    );
  }

  const isPublished = solicitud.estado === 'publicado';
  const isSold = solicitud.estado_venta === 'vendido';

  return (
    <VendedorLayout>
      {showConfetti && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />}
      
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">Documentación y cierre</h1>
          <p className="mt-2 text-muted-foreground">Asistente legal y administrativo para tu venta</p>
        </div>
        {!isSold && isPublished && (
          <Button onClick={handleMarkAsSold} variant="default" className="bg-forest hover:bg-forest/90">
            Marcar como vendido
          </Button>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* MODULE 1: Checklist */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-ocre/10 p-2">
                <CheckSquare className="h-5 w-5 text-ocre" />
              </div>
              <div>
                <CardTitle>¿Tienes todo listo para vender?</CardTitle>
                <CardDescription>Asegúrate de tener esta documentación para evitar bloqueos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progreso de documentación</span>
                <span className={cn("font-bold", isComplete ? "text-green-600" : "text-ocre")}>
                  {Math.round(calculateProgress())}%
                </span>
              </div>
              <Progress value={calculateProgress()} className="h-2" />
              {isComplete && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-2 text-xs font-bold text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  Documentación completa — listo para vender
                </div>
              )}
            </div>

            <div className="space-y-4">
              {Object.keys(checklist).map((key) => {
                const docKey = key as keyof ChecklistDocs;
                const status = checklist[docKey];
                const label = docKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                return (
                  <div key={docKey} className="rounded-lg border border-border p-4 transition-all hover:bg-black/5 hover:border-ocre/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium">
                        {status === 'tengo' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : status === 'no_tengo' ? (
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <HelpCircle className="h-4 w-4 text-blue-500" />
                        )}
                        {label}
                      </div>
                      <div className="flex items-center gap-2">
                         <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0" 
                          onClick={() => setExpandedDoc(expandedDoc === docKey ? null : docKey)}
                         >
                           {expandedDoc === docKey ? <ChevronUp className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
                         </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {(['tengo', 'no_tengo', 'no_se'] as DocumentStatus[]).map((s) => (
                           <Button
                            key={s}
                            variant={status === s ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                              "h-8 text-xs",
                              status === s && s === 'tengo' && "bg-green-600 hover:bg-green-700",
                              status === s && s === 'no_tengo' && "bg-destructive hover:bg-destructive/90",
                              status === s && s === 'no_se' && "bg-blue-600 hover:bg-blue-700"
                            )}
                            onClick={() => handleChecklistChange(docKey, s)}
                            disabled={savingChecklist}
                           >
                             {s === 'tengo' ? 'Tengo' : s === 'no_tengo' ? 'No tengo' : 'No sé qué es'}
                           </Button>
                        ))}
                    </div>

                    {expandedDoc === docKey && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 rounded bg-muted p-3 text-sm text-muted-foreground">
                        {docExplanations[docKey]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* MODULE 2: Contrato */}
        <Card className={cn("relative overflow-hidden", !isPublished && "bg-muted/50")}>
          {!isPublished && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <Lock className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="font-bold text-muted-foreground uppercase tracking-widest">Bloqueado</p>
              <p className="max-w-[200px] text-center text-sm text-muted-foreground mt-2">
                Disponible cuando tu ficha esté publicada.
              </p>
            </div>
          )}
          <CardHeader>
             <div className="flex items-center gap-3">
              <div className="rounded-full bg-ocre/10 p-2">
                <FileText className="h-5 w-5 text-ocre" />
              </div>
              <div>
                <CardTitle>Contrato de compraventa</CardTitle>
                <CardDescription>Genera un contrato legal completo en segundos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-1 text-sm">Vendedor (Tus datos)</h3>
                <div className="space-y-3 pt-2 text-sm">
                  <p><strong>Nombre:</strong> {usuario?.nombre}</p>
                  <p><strong>Teléfono:</strong> {usuario?.telefono}</p>
                  <div className="space-y-1 pt-2">
                    <Label className="text-xs">Tu DNI / NIE</Label>
                    <Input 
                      placeholder="DNI" 
                      className="h-8" 
                      value={vendedorExtraData.dni} 
                      onChange={e => setVendedorExtraData(prev => ({ ...prev, dni: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Tu Dirección</Label>
                    <Input 
                      placeholder="Dirección completa" 
                      className="h-8" 
                      value={vendedorExtraData.direccion} 
                      onChange={e => setVendedorExtraData(prev => ({ ...prev, direccion: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-bold text-sm">Datos del Vehículo</h3>
                  <div className="space-y-1">
                    <Label className="text-xs">Matrícula</Label>
                    <Input 
                      placeholder="1234BBB" 
                      className="h-8" 
                      value={vehiculoExtraData.matricula} 
                      onChange={e => setVehiculoExtraData(prev => ({ ...prev, matricula: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Número de Bastidor (VIN)</Label>
                    <Input 
                      placeholder="WF0A..." 
                      className="h-8" 
                      value={vehiculoExtraData.bastidor} 
                      onChange={e => setVehiculoExtraData(prev => ({ ...prev, bastidor: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-bold border-b pb-1 text-sm">Comprador</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nombre completo</Label>
                    <Input 
                      placeholder="Ej: Juan Pérez" 
                      className="h-8" 
                      value={compradorData.nombre} 
                      onChange={e => setCompradorData(prev => ({ ...prev, nombre: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">DNI / NIE</Label>
                    <Input 
                      placeholder="12345678X" 
                      className="h-8" 
                      value={compradorData.dni} 
                      onChange={e => setCompradorData(prev => ({ ...prev, dni: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Dirección completa</Label>
                    <Input 
                      placeholder="Calle, número, ciudad..." 
                      className="h-8" 
                      value={compradorData.direccion} 
                      onChange={e => setCompradorData(prev => ({ ...prev, direccion: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-bold text-sm">Datos de la operación</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                 <div className="space-y-1">
                  <Label className="text-xs">Precio final (€)</Label>
                  <Input 
                    type="number" 
                    className="h-8" 
                    value={operacionData.precioFinal} 
                    onChange={e => setOperacionData(prev => ({ ...prev, precioFinal: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Forma de pago</Label>
                  <Select 
                    value={operacionData.formaPago} 
                    onValueChange={v => setOperacionData(prev => ({ ...prev, formaPago: v }))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia bancaria</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                      <SelectItem value="combinado">Combinado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-8 w-full justify-start text-left font-normal px-2">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {operacionData.fecha ? format(operacionData.fecha, "PPP", { locale: es }) : <span>Elige fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={operacionData.fecha}
                        onSelect={(d) => d && setOperacionData(prev => ({ ...prev, fecha: d }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center justify-between gap-4 py-2">
                  <Label className="text-xs cursor-pointer" htmlFor="transport">¿Incluye transporte?</Label>
                  <Switch 
                    id="transport" 
                    checked={operacionData.incluyeTransporte} 
                    onCheckedChange={v => setOperacionData(prev => ({ ...prev, incluyeTransporte: v }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                 <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">¿Se ha entregado señal?</Label>
                    <Switch 
                      checked={operacionData.tieneSenal} 
                      onCheckedChange={v => setOperacionData(prev => ({ ...prev, tieneSenal: v }))}
                    />
                 </div>
                 {operacionData.tieneSenal && (
                   <Input 
                    type="number" 
                    placeholder="Importe de la señal" 
                    className="h-8 animate-in slide-in-from-top-2"
                    value={operacionData.importeSenal}
                    onChange={e => setOperacionData(prev => ({ ...prev, importeSenal: Number(e.target.value) }))}
                   />
                 )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Observaciones (opcional)</Label>
                <Textarea 
                  placeholder="Ej: Se entrega con depósito lleno..." 
                  className="min-h-[60px] text-sm"
                  value={operacionData.observaciones}
                  onChange={e => setOperacionData(prev => ({ ...prev, observaciones: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full bg-forest" onClick={() => generateContract('contrato')} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Generar contrato"}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center italic">
              Este contrato ha sido generado como documento orientativo. Para operaciones de alto valor te recomendamos revisarlo con un profesional.
            </p>
          </CardFooter>
        </Card>

        {/* History of Documents */}
        <Card className="lg:col-span-2">
          <CardHeader>
             <CardTitle className="text-lg">Documentos generados</CardTitle>
             <CardDescription>Descarga aquí tus contratos y recibos previos.</CardDescription>
          </CardHeader>
          <CardContent>
            {docsGenerados.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground italic">
                No has generado ningún documento todavía.
              </div>
            ) : (
              <div className="space-y-2">
                {docsGenerados.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-ocre/10 rounded-full">
                        <FileText className="h-4 w-4 text-ocre" />
                      </div>
                      <div>
                        <p className="text-sm font-bold capitalize">{doc.tipo.replace('_', ' ')}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(doc.created_at), "PPP p", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild className="gap-2">
                      <a href={doc.url_pdf} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4" /> Descargar
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* MODULE 3: Recibo de señal */}
        <Card className={cn("relative overflow-hidden", !isPublished && "bg-muted/50")}>
           {!isPublished && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <Lock className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="font-bold text-muted-foreground uppercase tracking-widest">Bloqueado</p>
            </div>
          )}
          <CardHeader>
             <div className="flex items-center gap-3">
              <div className="rounded-full bg-ocre/10 p-2">
                <ArrowRight className="h-5 w-5 text-ocre" />
              </div>
              <div>
                <CardTitle>Recibo de señal / reserva</CardTitle>
                <CardDescription>Genera un recibo oficial que protege a ambas partes.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nombre Comprador</Label>
                  <Input placeholder="Nombre" className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">DNI Comprador</Label>
                  <Input placeholder="DNI" className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Importe (€)</Label>
                  <Input type="number" placeholder="500" className="h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Forma de pago</Label>
                  <Select defaultValue="transferencia">
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="efectivo">Efectivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>
             <div className="space-y-1">
                <Label className="text-xs">Condiciones de devolución</Label>
                <Select defaultValue="precio">
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="precio">Se descuenta del precio final</SelectItem>
                    <SelectItem value="pierde">Se pierde si el comprador desiste</SelectItem>
                    <SelectItem value="vendedor">Se devuelve el doble si el vendedor desiste</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full border-ocre text-ocre hover:bg-ocre/5" onClick={() => generateContract('señal')} disabled={isGenerating}>
              {isGenerating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : "Generar recibo de señal"}
            </Button>
          </CardFooter>
        </Card>

        {/* EXTRA: Calculator */}
        <Card className="bg-sand/30 border-ocre/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-forest/10 p-2">
                  <Calculator className="h-5 w-5 text-forest" />
                </div>
                <div>
                  <CardTitle className="text-forest">Calculadora de ITP</CardTitle>
                  <CardDescription>Calcula el impuesto para el comprador.</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
               <div className="space-y-1">
                  <Label className="text-xs">Precio de venta</Label>
                  <Input 
                    type="number" 
                    className="h-8 border-ocre/20" 
                    value={itpCal.precio}
                    onChange={e => setItpCal(prev => ({ ...prev, precio: Number(e.target.value) }))}
                  />
               </div>
               <div className="space-y-1">
                  <Label className="text-xs">Año</Label>
                  <Input 
                    type="number" 
                    className="h-8 border-ocre/20" 
                    value={itpCal.anio}
                    onChange={e => setItpCal(prev => ({ ...prev, anio: Number(e.target.value) }))}
                  />
               </div>
               <div className="space-y-1">
                  <Label className="text-xs">Comunidad</Label>
                  <Select 
                    value={itpCal.comunidad}
                    onValueChange={v => setItpCal(prev => ({ ...prev, comunidad: v }))}
                  >
                    <SelectTrigger className="h-8 border-ocre/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(tiposITP).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
               </div>
            </div>

            <div className="rounded-xl bg-white p-6 text-center border border-ocre/10 shadow-sm">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-1">ITP estimado</p>
                <p className="font-display text-4xl font-bold text-ocre">
                  {(itpCal.precio * (tiposITP[itpCal.comunidad] || 0)).toLocaleString('es-ES')} €
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground border-t pt-4">
                  <div className="text-left">
                    <p>Tipo aplicado: <span className="font-bold text-foreground">{((tiposITP[itpCal.comunidad] || 0) * 100).toFixed(1)}%</span></p>
                    <p>Base imponible: <span className="font-bold text-foreground">{itpCal.precio.toLocaleString('es-ES')} €</span></p>
                  </div>
                  <div className="text-left pl-2 border-l">
                    {new Date().getFullYear() - itpCal.anio >= 10 && (
                      <p className="text-blue-600 font-medium">Vehículo {'>'}10 años: posible exención en algunas CCAA.</p>
                    )}
                  </div>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground italic text-center">
              Importe orientativo. El valor real puede diferir según Hacienda.
            </p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full gap-2 border-forest text-forest hover:bg-forest/5">
              <Share2 className="h-4 w-4" /> Compartir con el comprador
            </Button>
          </CardFooter>
        </Card>

        {/* MODULE 4: Guía Post-Venta */}
        <Card className={cn("relative overflow-hidden lg:col-span-2", !isSold && "bg-muted/50")}>
           {!isSold && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px]">
              <Lock className="mb-2 h-10 w-10 text-muted-foreground" />
              <p className="font-bold text-muted-foreground uppercase tracking-widest">Se desbloquea tras la venta</p>
              <Button 
                variant="outline" 
                className="mt-4 border-forest text-forest bg-white"
                onClick={handleMarkAsSold}
              >
                Marcar como vendido
              </Button>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle>Qué hacer ahora que has vendido tu camper</CardTitle>
                <CardDescription>Pasos finales para cerrar todos los trámites correctamente.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {[
                 { 
                   id: 'dgt', 
                   title: 'Comunica la venta a la DGT', 
                   time: 'Inmediatamente',
                   desc: 'Comunica tú también la transmisión para no ser responsable de multas o accidentes.',
                   link: 'https://sede.dgt.es',
                   pill: 'Hazlo hoy mismo'
                 },
                 { 
                   id: 'seguro', 
                   title: 'Da de baja tu seguro', 
                   time: 'Máximo 7 días',
                   desc: 'Contacta con tu aseguradora para cancelar el seguro desde la fecha de venta.',
                   pill: 'Próximos 7 días'
                 },
                 { 
                   id: 'itp', 
                   title: 'El comprador debe pagar el ITP', 
                   time: '30 días',
                   desc: 'El Impuesto de Transmisiones Patrimoniales lo paga el comprador. Conviene recordárselo.',
                   btn: 'Calcular ITP'
                 },
                 { 
                   id: 'ivtm', 
                   title: 'Cancela el impuesto de circulación (IVTM)', 
                   time: 'Antes del próximo cargo',
                   desc: 'Cancela la domiciliación en tu ayuntamiento para no pagar el año que viene.',
                   pill: 'Importante'
                 },
                 { 
                   id: 'contrato', 
                   title: 'Guarda el contrato de compraventa', 
                   time: 'Para siempre',
                   desc: 'Conserva el contrato firmado y el justificante de pago durante al menos 5 años.',
                   pill: 'Protección'
                 },
               ].map((step, idx) => (
                 <div key={idx} className="flex gap-4 rounded-xl border p-5 transition-all hover:bg-blue-50/30">
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        className="h-5 w-5 rounded border-gray-300 text-forest focus:ring-forest cursor-pointer"
                        checked={postSaleChecks[step.id as keyof typeof postSaleChecks]}
                        onChange={(e) => setPostSaleChecks(prev => ({ ...prev, [step.id]: e.target.checked }))}
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="font-bold">{step.title}</h4>
                          <span className="text-[10px] sm:text-xs font-bold text-blue-600 uppercase tracking-tight bg-blue-50 px-2 py-1 rounded">
                            ⏱ {step.time}
                          </span>
                       </div>
                       <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                       <div className="flex items-center gap-3 pt-1">
                          {step.link && (
                            <a href={step.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-ocre hover:underline flex items-center gap-1">
                              Ir a sede.dgt.es <ArrowRight className="h-3 w-3" />
                            </a>
                          )}
                          {step.btn && (
                            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-forest font-bold px-2 border border-forest/20">
                              {step.btn}
                            </Button>
                          )}
                          {step.pill && (
                             <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                               {step.pill}
                             </span>
                          )}
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            {Object.values(postSaleChecks).every(Boolean) && (
              <div className="mt-8 rounded-2xl bg-forest p-6 text-center text-white animate-in zoom-in">
                 <CheckCircle className="mx-auto h-12 w-12 mb-3" />
                 <h3 className="text-xl font-bold">¡Todo listo!</h3>
                 <p className="text-white/80">Has completado todos los trámites post-venta. ¡Enhorabuena por la venta!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </VendedorLayout>
  );
};

export default VendedorDocumentacion;
