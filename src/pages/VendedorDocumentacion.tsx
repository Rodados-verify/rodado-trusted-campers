
import { useState, useEffect } from "react";
import VendedorLayout from "@/components/vendedor/VendedorLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { toast } from "sonner";
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

  // Form states for modules
  const [compradorData, setCompradorData] = useState({
    nombre: "",
    dni: "",
    direccion: "",
    telefono: ""
  });
  const [operacionData, setOperacionData] = useState({
    precioFinal: 0,
    formaPago: "transferencia",
    fecha: new Date(),
    tieneSenal: false,
    importeSenal: 0,
    incluyeTransporte: false,
    observaciones: ""
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
      
      if (!userProfile) return;
      setUsuario(userProfile);

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

        // Load checklist
        const { data: clData } = await (supabase as any)
          .from("checklist_documentos")
          .select("*")
          .eq("solicitud_id", sol.id)
          .maybeSingle();
        
        if (clData) {
          setChecklist({
            permiso_circulacion: clData.permiso_circulacion as DocumentStatus,
            ficha_tecnica: clData.ficha_tecnica as DocumentStatus,
            itv_vigor: clData.itv_vigor as DocumentStatus,
            historial_mantenimiento: clData.historial_mantenimiento as DocumentStatus,
            informe_cargas: clData.informe_cargas as DocumentStatus,
            dos_llaves: clData.dos_llaves as DocumentStatus
          });
        }
      }
      setLoading(false);
    };

    loadData();
  }, [user]);

  const handleChecklistChange = async (doc: keyof ChecklistDocs, status: DocumentStatus) => {
    const newChecklist = { ...checklist, [doc]: status };
    setChecklist(newChecklist);
    setSavingChecklist(true);

    try {
      if (solicitud) {
        const { error } = await (supabase as any)
          .from("checklist_documentos")
          .upsert({
            solicitud_id: solicitud.id,
            [doc]: status,
            updated_at: new Date().toISOString()
          }, { onConflict: 'solicitud_id' });
        
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error saving checklist:", error);
      toast.error("No se pudo guardar el cambio");
    } finally {
      setSavingChecklist(false);
    }
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
    toast.info("Generando documento...");
    // Simulated call to Edge Function
    setTimeout(() => {
      toast.success(`${tipo === 'contrato' ? 'Contrato' : 'Recibo'} generado correctamente`);
    }, 2000);
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
                <div className="space-y-2 text-sm">
                  <p><strong>Nombre:</strong> {usuario?.nombre}</p>
                  <p><strong>Teléfono:</strong> {usuario?.telefono}</p>
                  <p className="text-xs text-muted-foreground italic">Datos tomados de tu perfil</p>
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
            <Button className="w-full bg-forest" onClick={() => generateContract('contrato')}>
              Generar contrato
            </Button>
            <p className="text-[10px] text-muted-foreground text-center italic">
              Este contrato ha sido generado como documento orientativo. Para operaciones de alto valor te recomendamos revisarlo con un profesional.
            </p>
          </CardFooter>
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
            <Button variant="outline" className="w-full border-ocre text-ocre hover:bg-ocre/5" onClick={() => generateContract('señal')}>
              Generar recibo de señal
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
