import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Upload, X, Check, AlertTriangle, Minus, Camera, Plus, FileText,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────
type EstadoValue = "correcto" | "con_observaciones" | "no_aplica";

interface InspeccionData {
  [key: string]: any;
  // Datos técnicos
  combustible: string;
  potencia_cv: number | null;
  potencia_kw: number | null;
  cilindrada: number | null;
  transmision: string;
  traccion: string;
  plazas: number | null;
  longitud_mm: number | null;
  mma_kg: number | null;
  peso_vacio_kg: number | null;
  capacidad_deposito_l: number | null;
  // Estado mecánico
  motor_estado: string; motor_obs: string;
  transmision_mec_estado: string; transmision_mec_obs: string;
  frenos_estado: string; frenos_obs: string;
  suspension_estado: string; suspension_obs: string;
  direccion_estado: string; direccion_obs: string;
  neumaticos_estado: string; neumaticos_obs: string;
  neumaticos_marca: string; neumaticos_dot: string; neumaticos_profundidad_mm: number | null;
  escape_estado: string; escape_obs: string;
  bateria_arranque_estado: string; bateria_arranque_obs: string;
  niveles_estado: string; niveles_obs: string;
  // Carrocería
  carroceria_estado: string; carroceria_obs: string;
  golpes_estado: string; golpes_obs: string;
  repintados_estado: string; repintados_obs: string;
  oxidacion_estado: string; oxidacion_obs: string;
  sellados_estado: string; sellados_obs: string;
  bajos_estado: string; bajos_obs: string;
  cristales_estado: string; cristales_obs: string;
  // Habitáculo
  habitaculo_estado: string; habitaculo_obs: string;
  humedades_estado: string; humedades_obs: string;
  tapiceria_estado: string; tapiceria_obs: string;
  cama_fija: boolean; cama_estado: string;
  dinette: boolean; dinette_estado: string;
  cocina_fuegos: number; cocina_horno: boolean; cocina_microondas: boolean; cocina_estado: string;
  frigorifico_tipo: string; frigorifico_estado: string;
  banio_completo: boolean; ducha_separada: boolean;
  wc_tipo: string; wc_estado: string;
  persianas_estado: string; iluminacion_estado: string;
  calefaccion_marca: string; calefaccion_tipo: string; calefaccion_estado: string;
  ac_tiene: boolean; ac_marca: string; ac_estado: string;
  // Instalaciones
  electrica_estado: string; electrica_obs: string;
  bateria_servicio_tipo: string; bateria_servicio_ah: number | null; bateria_servicio_anio: number | null; bateria_servicio_estado: string;
  panel_solar_tiene: boolean; panel_solar_w: number | null; panel_solar_estado: string;
  toma_220v_estado: string;
  inversor_tiene: boolean; inversor_w: number | null;
  gas_estado: string; gas_obs: string;
  agua_deposito_limpia_l: number | null; agua_deposito_grises_l: number | null; agua_estado: string;
  calefaccion_webasto_tiene: boolean; calefaccion_webasto_modelo: string;
  toldo_tiene: boolean; toldo_tipo: string; toldo_estado: string;
  // Extras
  extras_verificados: string[];
  // Fotos de desperfectos
  fotos_desperfectos_urls: string[];
  // Documentación
  itv_fecha_caducidad: string;
  historial_mantenimiento: string;
  num_propietarios: number | null;
  cargas_embargos: boolean;
  // Valoración
  puntuacion_general: number;
  recomendacion: string;
  observaciones_generales: string;
  puntos_destacados: string;
  // Fotos protocolo
  foto_frontal_url: string;
  foto_lateral_izq_url: string;
  foto_lateral_der_url: string;
  foto_trasera_url: string;
  foto_34_frontal_url: string;
  foto_34_trasero_url: string;
  foto_interior_conduccion_url: string;
  foto_dinette_url: string;
  foto_cocina_url: string;
  foto_banio_url: string;
  foto_cama_url: string;
  foto_habitaculo_url: string;
  foto_motor_url: string;
  foto_bajos_url: string;
  foto_neumaticos_url: string;
  foto_cuadro_electrico_url: string;
  foto_panel_solar_url: string;
  fotos_adicionales_urls: string[];
}

const DEFAULT_DATA: InspeccionData = {
  combustible: "", potencia_cv: null, potencia_kw: null, cilindrada: null,
  transmision: "", traccion: "", plazas: null, longitud_mm: null,
  mma_kg: null, peso_vacio_kg: null, capacidad_deposito_l: null,
  motor_estado: "correcto", motor_obs: "",
  transmision_mec_estado: "correcto", transmision_mec_obs: "",
  frenos_estado: "correcto", frenos_obs: "",
  suspension_estado: "correcto", suspension_obs: "",
  direccion_estado: "correcto", direccion_obs: "",
  neumaticos_estado: "correcto", neumaticos_obs: "",
  neumaticos_marca: "", neumaticos_dot: "", neumaticos_profundidad_mm: null,
  escape_estado: "correcto", escape_obs: "",
  bateria_arranque_estado: "correcto", bateria_arranque_obs: "",
  niveles_estado: "correcto", niveles_obs: "",
  carroceria_estado: "correcto", carroceria_obs: "",
  golpes_estado: "correcto", golpes_obs: "",
  repintados_estado: "correcto", repintados_obs: "",
  oxidacion_estado: "correcto", oxidacion_obs: "",
  sellados_estado: "correcto", sellados_obs: "",
  bajos_estado: "correcto", bajos_obs: "",
  cristales_estado: "correcto", cristales_obs: "",
  habitaculo_estado: "correcto", habitaculo_obs: "",
  humedades_estado: "correcto", humedades_obs: "",
  tapiceria_estado: "correcto", tapiceria_obs: "",
  cama_fija: false, cama_estado: "",
  dinette: false, dinette_estado: "",
  cocina_fuegos: 0, cocina_horno: false, cocina_microondas: false, cocina_estado: "",
  frigorifico_tipo: "no_tiene", frigorifico_estado: "",
  banio_completo: false, ducha_separada: false,
  wc_tipo: "no_tiene", wc_estado: "",
  persianas_estado: "correcto", iluminacion_estado: "correcto",
  calefaccion_marca: "", calefaccion_tipo: "", calefaccion_estado: "",
  ac_tiene: false, ac_marca: "", ac_estado: "",
  electrica_estado: "correcto", electrica_obs: "",
  bateria_servicio_tipo: "", bateria_servicio_ah: null, bateria_servicio_anio: null, bateria_servicio_estado: "",
  panel_solar_tiene: false, panel_solar_w: null, panel_solar_estado: "",
  toma_220v_estado: "correcto",
  inversor_tiene: false, inversor_w: null,
  gas_estado: "correcto", gas_obs: "",
  agua_deposito_limpia_l: null, agua_deposito_grises_l: null, agua_estado: "correcto",
  calefaccion_webasto_tiene: false, calefaccion_webasto_modelo: "",
  toldo_tiene: false, toldo_tipo: "", toldo_estado: "",
  extras_verificados: [],
  fotos_desperfectos_urls: [],
  itv_fecha_caducidad: "", historial_mantenimiento: "no_disponible",
  num_propietarios: null, cargas_embargos: false,
  puntuacion_general: 7, recomendacion: "recomendado",
  observaciones_generales: "", puntos_destacados: "",
  foto_frontal_url: "", foto_lateral_izq_url: "", foto_lateral_der_url: "",
  foto_trasera_url: "", foto_34_frontal_url: "", foto_34_trasero_url: "",
  foto_interior_conduccion_url: "", foto_dinette_url: "", foto_cocina_url: "",
  foto_banio_url: "", foto_cama_url: "", foto_habitaculo_url: "",
  foto_motor_url: "", foto_bajos_url: "", foto_neumaticos_url: "",
  foto_cuadro_electrico_url: "", foto_panel_solar_url: "",
  fotos_adicionales_urls: [],
};

// ─── Photo protocol slots ─────────────────────────────
const PHOTO_SLOTS_EXTERIOR = [
  { key: "foto_frontal_url", label: "Frontal", required: true },
  { key: "foto_lateral_izq_url", label: "Lateral izquierdo", required: true },
  { key: "foto_lateral_der_url", label: "Lateral derecho", required: true },
  { key: "foto_trasera_url", label: "Trasera", required: true },
  { key: "foto_34_frontal_url", label: "3/4 frontal izquierdo", required: true },
  { key: "foto_34_trasero_url", label: "3/4 trasero derecho", required: true },
];
const PHOTO_SLOTS_INTERIOR = [
  { key: "foto_interior_conduccion_url", label: "Zona de conducción", required: true },
  { key: "foto_dinette_url", label: "Dinette", required: true },
  { key: "foto_cocina_url", label: "Cocina", required: true },
  { key: "foto_banio_url", label: "Baño", required: true },
  { key: "foto_cama_url", label: "Cama", required: true },
  { key: "foto_habitaculo_url", label: "Habitáculo general", required: true },
];
const PHOTO_SLOTS_DETAIL = [
  { key: "foto_motor_url", label: "Motor", required: false },
  { key: "foto_bajos_url", label: "Bajos", required: false },
  { key: "foto_neumaticos_url", label: "Neumáticos", required: false },
  { key: "foto_cuadro_electrico_url", label: "Cuadro eléctrico", required: false },
  { key: "foto_panel_solar_url", label: "Panel solar", required: false },
];

// ─── Estado items definitions ──────────────────────────
const MECANICA_ITEMS = [
  { key: "motor", label: "Motor" },
  { key: "transmision_mec", label: "Transmisión" },
  { key: "frenos", label: "Frenos" },
  { key: "suspension", label: "Suspensión" },
  { key: "direccion", label: "Dirección" },
  { key: "neumaticos", label: "Neumáticos" },
  { key: "escape", label: "Escape" },
  { key: "bateria_arranque", label: "Batería de arranque" },
  { key: "niveles", label: "Niveles (aceite, refrigerante, etc.)" },
];

const CARROCERIA_ITEMS = [
  { key: "carroceria", label: "Estado general" },
  { key: "golpes", label: "Golpes / abolladuras" },
  { key: "repintados", label: "Repintados detectados" },
  { key: "oxidacion", label: "Oxidación" },
  { key: "sellados", label: "Sellados y juntas" },
  { key: "bajos", label: "Bajos del vehículo" },
  { key: "cristales", label: "Cristales" },
];

const EXTRAS_SUGGESTIONS = [
  "TV", "Cámara trasera", "Sensores aparcamiento", "GPS/Navegador",
  "Panel solar", "Inversor", "Toldo eléctrico", "Portabicicletas",
  "Enganche", "Alarma", "Control de crucero", "Climatizador",
  "Claraboya", "Mosquiteras", "Portón trasero", "Baca",
];

// ─── Props ─────────────────────────────────────────────
interface InspeccionFormProps {
  solicitudId: string;
  tallerId: string;
  onComplete: () => void;
}

// ─── Component ─────────────────────────────────────────
const InspeccionForm = ({ solicitudId, tallerId, onComplete }: InspeccionFormProps) => {
  const { toast } = useToast();
  const [data, setData] = useState<InspeccionData>({ ...DEFAULT_DATA });
  const [saving, setSaving] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [newExtra, setNewExtra] = useState("");
  const [existingId, setExistingId] = useState<string | null>(null);
  const [savedSections, setSavedSections] = useState<Set<string>>(new Set());

  // Load existing
  useEffect(() => {
    const load = async () => {
      const { data: existing } = await (supabase as any)
        .from("inspeccion_detalle")
        .select("*")
        .eq("solicitud_id", solicitudId)
        .maybeSingle();
      if (existing) {
        setExistingId(existing.id);
        const merged = { ...DEFAULT_DATA };
        Object.keys(merged).forEach(k => {
          if (existing[k] !== null && existing[k] !== undefined) {
            (merged as any)[k] = existing[k];
          }
        });
        setData(merged);
        setSavedSections(new Set(["all"]));
      }
    };
    load();
  }, [solicitudId]);

  const update = useCallback((key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateNum = useCallback((key: string, value: string) => {
    setData(prev => ({ ...prev, [key]: value === "" ? null : Number(value) }));
  }, []);

  // ─── Save section ────────────────────────────────────
  const saveSection = async (sectionName: string) => {
    setSaving(sectionName);
    try {
      const payload: any = { ...data, solicitud_id: solicitudId, updated_at: new Date().toISOString() };
      delete payload.id;
      delete payload.created_at;

      if (existingId) {
        await (supabase as any).from("inspeccion_detalle").update(payload).eq("id", existingId);
      } else {
        const { data: inserted } = await (supabase as any).from("inspeccion_detalle").insert(payload).select("id").single();
        if (inserted) setExistingId(inserted.id);
      }

      setSavedSections(prev => new Set([...prev, sectionName]));
      toast({ title: `Sección "${sectionName}" guardada` });
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  // ─── Photo upload ────────────────────────────────────
  const uploadPhoto = async (key: string, file: File) => {
    const ext = file.name.split(".").pop();
    const path = `taller/${tallerId}/${solicitudId}/protocolo/${key}_${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("solicitud-fotos").upload(path, file);
    if (error) {
      toast({ title: "Error subiendo foto", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(path);
    update(key, urlData.publicUrl);

    // Also save to fotos_solicitud table for the gallery
    await supabase.from("fotos_solicitud").insert({
      solicitud_id: solicitudId,
      url: urlData.publicUrl,
      tipo: "procesada" as any,
    });
  };

  // ─── Upload additional photos ────────────────────────
  const uploadAdditionalPhotos = async (files: File[]) => {
    const urls: string[] = [...data.fotos_adicionales_urls];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `taller/${tallerId}/${solicitudId}/adicionales/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("solicitud-fotos").upload(path, file);
      if (error) continue;
      const { data: urlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(path);
      urls.push(urlData.publicUrl);
      await supabase.from("fotos_solicitud").insert({
        solicitud_id: solicitudId,
        url: urlData.publicUrl,
        tipo: "procesada" as any,
      });
    }
    update("fotos_adicionales_urls", urls);
  };

  // ─── Upload defect photos ───────────────────────────
  const uploadDefectPhotos = async (files: File[]) => {
    const urls: string[] = [...data.fotos_desperfectos_urls];
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `taller/${tallerId}/${solicitudId}/desperfectos/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("solicitud-fotos").upload(path, file);
      if (error) continue;
      const { data: urlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    update("fotos_desperfectos_urls", urls);
  };

  // ─── Complete inspection ─────────────────────────────
  const completeInspection = async () => {
    setCompleting(true);
    try {
      // Save all data
      const payload: any = { ...data, solicitud_id: solicitudId, updated_at: new Date().toISOString() };
      delete payload.id;
      delete payload.created_at;

      if (existingId) {
        await (supabase as any).from("inspeccion_detalle").update(payload).eq("id", existingId);
      } else {
        const { data: inserted } = await (supabase as any).from("inspeccion_detalle").insert(payload).select("id").single();
        if (inserted) setExistingId(inserted.id);
      }

      // Also save to informes for backward compatibility
      const { data: existingInforme } = await supabase.from("informes").select("id").eq("solicitud_id", solicitudId).maybeSingle();
      
      let pdfUrl: string | null = null;
      if (pdfFile) {
        const pdfPath = `taller/${tallerId}/${solicitudId}/informe.pdf`;
        const { error: pdfErr } = await supabase.storage.from("solicitud-fotos").upload(pdfPath, pdfFile, { upsert: true });
        if (!pdfErr) {
          const { data: pdfUrlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(pdfPath);
          pdfUrl = pdfUrlData.publicUrl;
        }
      }

      const informeData = {
        solicitud_id: solicitudId,
        taller_id: tallerId,
        observaciones_generales: data.observaciones_generales,
        puntos_positivos: data.puntos_destacados,
        borrador: false,
        ...(pdfUrl ? { url_pdf: pdfUrl } : {}),
      };

      if (existingInforme) {
        await supabase.from("informes").update(informeData).eq("id", existingInforme.id);
      } else {
        await supabase.from("informes").insert(informeData);
      }

      // Also save to checklist_items for backward compatibility
      await supabase.from("checklist_items").delete().eq("solicitud_id", solicitudId);
      const checkItems: any[] = [];
      [...MECANICA_ITEMS].forEach(item => {
        checkItems.push({ solicitud_id: solicitudId, seccion: "Mecánica", item: item.label, estado: data[`${item.key}_estado`] as any, observacion: data[`${item.key}_obs`] || null });
      });
      [...CARROCERIA_ITEMS].forEach(item => {
        checkItems.push({ solicitud_id: solicitudId, seccion: "Carrocería", item: item.label, estado: data[`${item.key}_estado`] as any, observacion: data[`${item.key}_obs`] || null });
      });
      if (checkItems.length > 0) {
        await supabase.from("checklist_items").insert(checkItems);
      }

      // Update solicitud estado
      await supabase.from("solicitudes").update({ estado: "contenido_generado" as any }).eq("id", solicitudId);

      toast({ title: "¡Inspección completada!", description: "El equipo está preparando la ficha." });
      onComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  // Check if mandatory sections have enough data
  const requiredPhotosFilled = PHOTO_SLOTS_EXTERIOR.every(s => data[s.key]) && PHOTO_SLOTS_INTERIOR.every(s => data[s.key]);
  const hasValoracion = data.puntuacion_general > 0 && data.recomendacion;

  return (
    <div className="space-y-4">
      <Accordion type="multiple" defaultValue={["datos-tecnicos"]} className="space-y-3">

        {/* ═══ SECCIÓN 1: DATOS TÉCNICOS ═══ */}
        <AccordionItem value="datos-tecnicos" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={1} title="Datos técnicos del vehículo" saved={savedSections.has("datos-tecnicos") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5">
            <p className="mb-4 text-xs text-muted-foreground">Consulta la ficha técnica del vehículo para rellenar estos datos.</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField label="Combustible" value={data.combustible} onChange={v => update("combustible", v)}
                options={[["diesel", "Diésel"], ["gasolina", "Gasolina"], ["electrico", "Eléctrico"], ["hibrido", "Híbrido"], ["glp", "GLP"]]} />
              <NumberField label="Potencia (CV)" value={data.potencia_cv} onChange={v => updateNum("potencia_cv", v)} />
              <NumberField label="Potencia (kW)" value={data.potencia_kw} onChange={v => updateNum("potencia_kw", v)} />
              <NumberField label="Cilindrada (cc)" value={data.cilindrada} onChange={v => updateNum("cilindrada", v)} />
              <SelectField label="Transmisión" value={data.transmision} onChange={v => update("transmision", v)}
                options={[["manual", "Manual"], ["automatica", "Automática"], ["semiautomatica", "Semiautomática"]]} />
              <SelectField label="Tracción" value={data.traccion} onChange={v => update("traccion", v)}
                options={[["delantera", "Delantera"], ["trasera", "Trasera"], ["total", "Total (4x4)"]]} />
              <NumberField label="Plazas" value={data.plazas} onChange={v => updateNum("plazas", v)} />
              <NumberField label="Longitud (mm)" value={data.longitud_mm} onChange={v => updateNum("longitud_mm", v)} />
              <NumberField label="MMA (kg)" value={data.mma_kg} onChange={v => updateNum("mma_kg", v)} />
              <NumberField label="Peso en vacío (kg)" value={data.peso_vacio_kg} onChange={v => updateNum("peso_vacio_kg", v)} />
              <NumberField label="Depósito combustible (L)" value={data.capacidad_deposito_l} onChange={v => updateNum("capacidad_deposito_l", v)} />
            </div>
            <SaveButton section="datos-tecnicos" saving={saving} onClick={() => saveSection("Datos técnicos")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 2: FOTOS PROTOCOLO ═══ */}
        <AccordionItem value="fotos-protocolo" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={2} title="Fotos del protocolo" saved={savedSections.has("fotos-protocolo") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Exterior (obligatorias)</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PHOTO_SLOTS_EXTERIOR.map(slot => (
                  <PhotoSlot key={slot.key} label={slot.label} url={data[slot.key]} required={slot.required}
                    onUpload={(file) => uploadPhoto(slot.key, file)} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Interior (obligatorias)</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PHOTO_SLOTS_INTERIOR.map(slot => (
                  <PhotoSlot key={slot.key} label={slot.label} url={data[slot.key]} required={slot.required}
                    onUpload={(file) => uploadPhoto(slot.key, file)} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Detalles (opcionales)</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {PHOTO_SLOTS_DETAIL.map(slot => (
                  <PhotoSlot key={slot.key} label={slot.label} url={data[slot.key]} required={false}
                    onUpload={(file) => uploadPhoto(slot.key, file)} />
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Fotos adicionales</h4>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ocre/30 bg-ocre/5 p-4 hover:border-ocre/50 transition-colors">
                <Camera className="h-5 w-5 text-ocre" />
                <span className="text-xs text-muted-foreground">Subir fotos adicionales</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) uploadAdditionalPhotos(files);
                }} />
              </label>
              {data.fotos_adicionales_urls.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {data.fotos_adicionales_urls.map((url, i) => (
                    <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg border border-border">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <SaveButton section="fotos-protocolo" saving={saving} onClick={() => saveSection("Fotos protocolo")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 3: ESTADO MECÁNICO ═══ */}
        <AccordionItem value="mecanica" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={3} title="Estado mecánico" saved={savedSections.has("mecanica") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-3">
            {MECANICA_ITEMS.map(item => (
              <EstadoRow key={item.key} label={item.label}
                estado={data[`${item.key}_estado`] as EstadoValue}
                obs={data[`${item.key}_obs`]}
                onEstado={v => update(`${item.key}_estado`, v)}
                onObs={v => update(`${item.key}_obs`, v)} />
            ))}
            {/* Extra fields for neumáticos */}
            {data.neumaticos_estado === "con_observaciones" && (
              <div className="ml-4 grid gap-3 sm:grid-cols-3 border-l-2 border-yellow-300 pl-4">
                <div><Label className="text-xs">Marca</Label><Input value={data.neumaticos_marca} onChange={e => update("neumaticos_marca", e.target.value)} className="mt-1 h-8 text-sm bg-white" /></div>
                <div><Label className="text-xs">DOT</Label><Input value={data.neumaticos_dot} onChange={e => update("neumaticos_dot", e.target.value)} className="mt-1 h-8 text-sm bg-white" /></div>
                <div><Label className="text-xs">Profundidad (mm)</Label><Input type="number" value={data.neumaticos_profundidad_mm ?? ""} onChange={e => updateNum("neumaticos_profundidad_mm", e.target.value)} className="mt-1 h-8 text-sm bg-white" /></div>
              </div>
            )}
            <SaveButton section="mecanica" saving={saving} onClick={() => saveSection("Estado mecánico")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 4: CARROCERÍA ═══ */}
        <AccordionItem value="carroceria" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={4} title="Carrocería y estructura" saved={savedSections.has("carroceria") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-3">
            {CARROCERIA_ITEMS.map(item => (
              <EstadoRow key={item.key} label={item.label}
                estado={data[`${item.key}_estado`] as EstadoValue}
                obs={data[`${item.key}_obs`]}
                onEstado={v => update(`${item.key}_estado`, v)}
                onObs={v => update(`${item.key}_obs`, v)} />
            ))}
            <SaveButton section="carroceria" saving={saving} onClick={() => saveSection("Carrocería")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 5: HABITÁCULO CAMPER ═══ */}
        <AccordionItem value="habitaculo" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={5} title="Habitáculo camper" saved={savedSections.has("habitaculo") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-6">
            {/* General + humedades + tapicería */}
            <div className="space-y-3">
              <EstadoRow label="Estado general" estado={data.habitaculo_estado as EstadoValue} obs={data.habitaculo_obs}
                onEstado={v => update("habitaculo_estado", v)} onObs={v => update("habitaculo_obs", v)} />
              <EstadoRow label="Humedades (con medidor)" estado={data.humedades_estado as EstadoValue} obs={data.humedades_obs}
                onEstado={v => update("humedades_estado", v)} onObs={v => update("humedades_obs", v)} />
              <EstadoRow label="Tapicería" estado={data.tapiceria_estado as EstadoValue} obs={data.tapiceria_obs}
                onEstado={v => update("tapiceria_estado", v)} onObs={v => update("tapiceria_obs", v)} />
            </div>

            {/* Zona descanso */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">🛏️ Zona de descanso</h4>
              <div className="space-y-3">
                <ToggleField label="Cama fija" checked={data.cama_fija} onChange={v => update("cama_fija", v)} />
                {data.cama_fija && <TextField label="Estado cama" value={data.cama_estado} onChange={v => update("cama_estado", v)} />}
                <ToggleField label="Dinette" checked={data.dinette} onChange={v => update("dinette", v)} />
                {data.dinette && <TextField label="Estado dinette" value={data.dinette_estado} onChange={v => update("dinette_estado", v)} />}
              </div>
            </div>

            {/* Cocina */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">🍳 Cocina</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Nº de fuegos" value={data.cocina_fuegos} onChange={v => updateNum("cocina_fuegos", v)} />
                <TextField label="Estado cocina" value={data.cocina_estado} onChange={v => update("cocina_estado", v)} />
              </div>
              <div className="mt-3 flex flex-wrap gap-4">
                <ToggleField label="Horno" checked={data.cocina_horno} onChange={v => update("cocina_horno", v)} />
                <ToggleField label="Microondas" checked={data.cocina_microondas} onChange={v => update("cocina_microondas", v)} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <SelectField label="Frigorífico" value={data.frigorifico_tipo} onChange={v => update("frigorifico_tipo", v)}
                  options={[["compresor", "Compresor"], ["absorcion", "Absorción"], ["no_tiene", "No tiene"]]} />
                {data.frigorifico_tipo !== "no_tiene" && <TextField label="Estado frigorífico" value={data.frigorifico_estado} onChange={v => update("frigorifico_estado", v)} />}
              </div>
            </div>

            {/* Baño */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">🚿 Baño</h4>
              <div className="space-y-3">
                <ToggleField label="Baño completo" checked={data.banio_completo} onChange={v => update("banio_completo", v)} />
                <ToggleField label="Ducha separada" checked={data.ducha_separada} onChange={v => update("ducha_separada", v)} />
                <SelectField label="WC" value={data.wc_tipo} onChange={v => update("wc_tipo", v)}
                  options={[["cassette", "Cassette"], ["fijo", "Fijo"], ["no_tiene", "No tiene"]]} />
                {data.wc_tipo !== "no_tiene" && <TextField label="Estado WC" value={data.wc_estado} onChange={v => update("wc_estado", v)} />}
              </div>
            </div>

            {/* Climatización */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">🌡️ Climatización</h4>
              <div className="space-y-3">
                <EstadoRow label="Persianas" estado={data.persianas_estado as EstadoValue} obs="" onEstado={v => update("persianas_estado", v)} onObs={() => {}} hideObs />
                <EstadoRow label="Iluminación" estado={data.iluminacion_estado as EstadoValue} obs="" onEstado={v => update("iluminacion_estado", v)} onObs={() => {}} hideObs />
                <div className="grid gap-3 sm:grid-cols-3">
                  <TextField label="Calefacción marca" value={data.calefaccion_marca} onChange={v => update("calefaccion_marca", v)} />
                  <TextField label="Calefacción tipo" value={data.calefaccion_tipo} onChange={v => update("calefaccion_tipo", v)} />
                  <TextField label="Calefacción estado" value={data.calefaccion_estado} onChange={v => update("calefaccion_estado", v)} />
                </div>
                <ToggleField label="Aire acondicionado" checked={data.ac_tiene} onChange={v => update("ac_tiene", v)} />
                {data.ac_tiene && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextField label="Marca AC" value={data.ac_marca} onChange={v => update("ac_marca", v)} />
                    <TextField label="Estado AC" value={data.ac_estado} onChange={v => update("ac_estado", v)} />
                  </div>
                )}
              </div>
            </div>
            <SaveButton section="habitaculo" saving={saving} onClick={() => saveSection("Habitáculo")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 6: INSTALACIONES ═══ */}
        <AccordionItem value="instalaciones" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={6} title="Instalaciones" saved={savedSections.has("instalaciones") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-6">
            {/* Eléctrica */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">⚡ Instalación eléctrica</h4>
              <EstadoRow label="Estado general eléctrica" estado={data.electrica_estado as EstadoValue} obs={data.electrica_obs}
                onEstado={v => update("electrica_estado", v)} onObs={v => update("electrica_obs", v)} />
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SelectField label="Batería servicio tipo" value={data.bateria_servicio_tipo} onChange={v => update("bateria_servicio_tipo", v)}
                  options={[["plomo", "Plomo"], ["agm", "AGM"], ["litio", "Litio"], ["gel", "Gel"]]} />
                <NumberField label="Capacidad (Ah)" value={data.bateria_servicio_ah} onChange={v => updateNum("bateria_servicio_ah", v)} />
                <NumberField label="Año batería" value={data.bateria_servicio_anio} onChange={v => updateNum("bateria_servicio_anio", v)} />
                <TextField label="Estado batería" value={data.bateria_servicio_estado} onChange={v => update("bateria_servicio_estado", v)} />
              </div>
            </div>

            {/* Solar */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">☀️ Energía solar</h4>
              <ToggleField label="Panel solar" checked={data.panel_solar_tiene} onChange={v => update("panel_solar_tiene", v)} />
              {data.panel_solar_tiene && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <NumberField label="Potencia (W)" value={data.panel_solar_w} onChange={v => updateNum("panel_solar_w", v)} />
                  <TextField label="Estado panel" value={data.panel_solar_estado} onChange={v => update("panel_solar_estado", v)} />
                </div>
              )}
              <div className="mt-3">
                <EstadoRow label="Toma 220V exterior" estado={data.toma_220v_estado as EstadoValue} obs="" onEstado={v => update("toma_220v_estado", v)} onObs={() => {}} hideObs />
              </div>
              <div className="mt-3">
                <ToggleField label="Inversor" checked={data.inversor_tiene} onChange={v => update("inversor_tiene", v)} />
                {data.inversor_tiene && <NumberField label="Potencia inversor (W)" value={data.inversor_w} onChange={v => updateNum("inversor_w", v)} />}
              </div>
            </div>

            {/* Gas */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">🔥 Gas</h4>
              <EstadoRow label="Instalación de gas" estado={data.gas_estado as EstadoValue} obs={data.gas_obs}
                onEstado={v => update("gas_estado", v)} onObs={v => update("gas_obs", v)} />
            </div>

            {/* Agua */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">💧 Agua</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField label="Depósito agua limpia (L)" value={data.agua_deposito_limpia_l} onChange={v => updateNum("agua_deposito_limpia_l", v)} />
                <NumberField label="Depósito aguas grises (L)" value={data.agua_deposito_grises_l} onChange={v => updateNum("agua_deposito_grises_l", v)} />
              </div>
              <div className="mt-3">
                <EstadoRow label="Estado instalación agua" estado={data.agua_estado as EstadoValue} obs="" onEstado={v => update("agua_estado", v)} onObs={() => {}} hideObs />
              </div>
            </div>

            {/* Calefacción y toldo */}
            <div className="border-t border-border pt-4 space-y-3">
              <ToggleField label="Calefacción Webasto/Truma" checked={data.calefaccion_webasto_tiene} onChange={v => update("calefaccion_webasto_tiene", v)} />
              {data.calefaccion_webasto_tiene && <TextField label="Modelo" value={data.calefaccion_webasto_modelo} onChange={v => update("calefaccion_webasto_modelo", v)} />}
              <ToggleField label="Toldo" checked={data.toldo_tiene} onChange={v => update("toldo_tiene", v)} />
              {data.toldo_tiene && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Tipo de toldo" value={data.toldo_tipo} onChange={v => update("toldo_tipo", v)} />
                  <TextField label="Estado toldo" value={data.toldo_estado} onChange={v => update("toldo_estado", v)} />
                </div>
              )}
            </div>
            <SaveButton section="instalaciones" saving={saving} onClick={() => saveSection("Instalaciones")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 7: EXTRAS VERIFICADOS ═══ */}
        <AccordionItem value="extras" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={7} title="Extras verificados" saved={savedSections.has("extras") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-4">
            <div className="flex gap-2">
              <Input value={newExtra} onChange={e => setNewExtra(e.target.value)} placeholder="Escribe un extra..." className="bg-white"
                onKeyDown={e => {
                  if (e.key === "Enter" && newExtra.trim()) {
                    update("extras_verificados", [...data.extras_verificados, newExtra.trim()]);
                    setNewExtra("");
                  }
                }} />
              <Button variant="outline" size="sm" onClick={() => {
                if (newExtra.trim()) {
                  update("extras_verificados", [...data.extras_verificados, newExtra.trim()]);
                  setNewExtra("");
                }
              }}><Plus className="h-4 w-4" /></Button>
            </div>
            {/* Suggestions */}
            <div className="flex flex-wrap gap-2">
              {EXTRAS_SUGGESTIONS.filter(s => !data.extras_verificados.includes(s)).map(s => (
                <button key={s} type="button" onClick={() => update("extras_verificados", [...data.extras_verificados, s])}
                  className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:border-ocre hover:text-ocre transition-colors">
                  + {s}
                </button>
              ))}
            </div>
            {/* Current extras */}
            {data.extras_verificados.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.extras_verificados.map((ex, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-sm font-medium text-forest">
                    {ex}
                    <button type="button" onClick={() => update("extras_verificados", data.extras_verificados.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <SaveButton section="extras" saving={saving} onClick={() => saveSection("Extras")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 8: DOCUMENTACIÓN ═══ */}
        <AccordionItem value="documentacion" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={8} title="Documentación" saved={savedSections.has("documentacion") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Fecha caducidad ITV</Label>
                <Input type="date" value={data.itv_fecha_caducidad} onChange={e => update("itv_fecha_caducidad", e.target.value)} className="mt-1.5 bg-white" />
              </div>
              <SelectField label="Historial de mantenimiento" value={data.historial_mantenimiento} onChange={v => update("historial_mantenimiento", v)}
                options={[["completo", "Completo"], ["parcial", "Parcial"], ["no_disponible", "No disponible"]]} />
              <NumberField label="Nº propietarios anteriores" value={data.num_propietarios} onChange={v => updateNum("num_propietarios", v)} />
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={data.cargas_embargos} onCheckedChange={v => update("cargas_embargos", v)} />
                <Label className="text-sm">Cargas o embargos</Label>
              </div>
            </div>
            <div>
              <Label className="text-sm">Informe PDF (opcional)</Label>
              <div className="mt-1.5 flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/30 transition-colors">
                  <FileText className="h-4 w-4" />
                  <span>{pdfFile ? pdfFile.name : "Seleccionar PDF"}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
                </label>
                {pdfFile && <button type="button" onClick={() => setPdfFile(null)} className="text-xs text-muted-foreground hover:text-destructive">Quitar</button>}
              </div>
            </div>
            <SaveButton section="documentacion" saving={saving} onClick={() => saveSection("Documentación")} />
          </AccordionContent>
        </AccordionItem>

        {/* ═══ SECCIÓN 9: VALORACIÓN FINAL ═══ */}
        <AccordionItem value="valoracion" className="rounded-xl border border-border bg-white overflow-hidden">
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <SectionHeader number={9} title="Valoración final" saved={savedSections.has("valoracion") || savedSections.has("all")} />
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-5 space-y-6">
            <div>
              <Label className="text-sm">Puntuación general: <span className="font-bold text-ocre text-lg">{data.puntuacion_general}/10</span></Label>
              <Slider value={[data.puntuacion_general]} min={1} max={10} step={1} className="mt-3"
                onValueChange={v => update("puntuacion_general", v[0])} />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>1</span><span>5</span><span>10</span>
              </div>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Recomendación</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "recomendado", label: "✅ Recomendado", cls: "bg-green-50 border-green-200 text-green-800" },
                  { value: "recomendado_con_reservas", label: "⚠️ Con reservas", cls: "bg-yellow-50 border-yellow-200 text-yellow-800" },
                  { value: "no_recomendado", label: "❌ No recomendado", cls: "bg-red-50 border-red-200 text-red-800" },
                ].map(r => (
                  <button key={r.value} type="button" onClick={() => update("recomendacion", r.value)}
                    className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-all",
                      data.recomendacion === r.value ? r.cls : "border-border text-muted-foreground hover:border-border/80"
                    )}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Observaciones generales</Label>
              <Textarea value={data.observaciones_generales} onChange={e => update("observaciones_generales", e.target.value)}
                placeholder="Resumen general del estado del vehículo..." className="mt-1.5 min-h-[100px] bg-white" />
            </div>
            <div>
              <Label className="text-sm">Puntos destacados positivamente</Label>
              <Textarea value={data.puntos_destacados} onChange={e => update("puntos_destacados", e.target.value)}
                placeholder="Aspectos destacados para la ficha de venta..." className="mt-1.5 min-h-[100px] bg-white" />
            </div>
            <SaveButton section="valoracion" saving={saving} onClick={() => saveSection("Valoración")} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ═══ COMPLETE BUTTON ═══ */}
      <div className="rounded-xl border border-border bg-white p-6 text-center space-y-4">
        {!requiredPhotosFilled && (
          <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-4 py-2 inline-block">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            Faltan fotos obligatorias del protocolo
          </p>
        )}
        {!hasValoracion && (
          <p className="text-sm text-yellow-700 bg-yellow-50 rounded-lg px-4 py-2 inline-block">
            <AlertTriangle className="inline h-4 w-4 mr-1" />
            Completa la valoración final
          </p>
        )}
        <div>
          <Button variant="ocre" size="lg" onClick={completeInspection}
            disabled={completing || !requiredPhotosFilled || !hasValoracion}
            className="min-w-[280px]">
            {completing ? "Completando inspección…" : "Completar inspección"}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Reusable sub-components ───────────────────────────

const SectionHeader = ({ number, title, saved }: { number: number; title: string; saved: boolean }) => (
  <div className="flex items-center gap-3 w-full">
    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
      saved ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
    )}>{saved ? <Check className="h-3.5 w-3.5" /> : number}</span>
    <span className="text-sm font-semibold text-foreground">{title}</span>
  </div>
);

const EstadoRow = ({ label, estado, obs, onEstado, onObs, hideObs }: {
  label: string; estado: EstadoValue; obs: string; onEstado: (v: EstadoValue) => void; onObs: (v: string) => void; hideObs?: boolean;
}) => (
  <div className="rounded-lg border border-border p-3 space-y-2">
    <div className="flex items-center justify-between gap-2 flex-wrap">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex gap-1">
        {([
          { v: "correcto" as const, label: "Correcto", icon: <Check className="h-3 w-3" />, cls: "bg-green-100 text-green-700" },
          { v: "con_observaciones" as const, label: "Observaciones", icon: <AlertTriangle className="h-3 w-3" />, cls: "bg-yellow-100 text-yellow-700" },
          { v: "no_aplica" as const, label: "N/A", icon: <Minus className="h-3 w-3" />, cls: "bg-muted text-muted-foreground" },
        ]).map(opt => (
          <button key={opt.v} type="button" onClick={() => onEstado(opt.v)}
            className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              estado === opt.v ? opt.cls : "bg-muted/30 text-muted-foreground/50 hover:bg-muted/60"
            )}>
            {opt.icon} {opt.label}
          </button>
        ))}
      </div>
    </div>
    {estado === "con_observaciones" && !hideObs && (
      <Textarea value={obs} onChange={e => onObs(e.target.value)} placeholder="Detalla la observación…"
        className="min-h-[50px] bg-white text-sm" />
    )}
  </div>
);

const PhotoSlot = ({ label, url, required, onUpload }: {
  label: string; url: string; required: boolean; onUpload: (file: File) => void;
}) => (
  <div className={cn("relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition-colors",
    url ? "border-green-300" : required ? "border-dashed border-ocre/40" : "border-dashed border-border"
  )}>
    {url ? (
      <img src={url} alt={label} className="h-full w-full object-cover" />
    ) : (
      <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 p-2 hover:bg-muted/20 transition-colors">
        <Camera className="h-5 w-5 text-muted-foreground" />
        <span className="text-[10px] text-center text-muted-foreground leading-tight">{label}</span>
        {required && <span className="text-[9px] text-ocre font-medium">Obligatoria</span>}
        <input type="file" accept="image/*" className="hidden" onChange={e => {
          const f = e.target.files?.[0];
          if (f) onUpload(f);
        }} />
      </label>
    )}
    {url && (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1">
        <span className="text-[10px] text-white font-medium">{label}</span>
      </div>
    )}
  </div>
);

const SaveButton = ({ section, saving, onClick }: { section: string; saving: string | null; onClick: () => void }) => (
  <div className="mt-4 flex justify-end">
    <Button variant="outline" size="sm" onClick={onClick} disabled={saving === section}>
      {saving === section ? "Guardando…" : "Guardar sección"}
    </Button>
  </div>
);

const SelectField = ({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="mt-1 flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <option value="">—</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
);

const NumberField = ({ label, value, onChange }: { label: string; value: number | null; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input type="number" value={value ?? ""} onChange={e => onChange(e.target.value)} className="mt-1 h-9 text-sm bg-white" />
  </div>
);

const TextField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <Label className="text-xs">{label}</Label>
    <Input value={value} onChange={e => onChange(e.target.value)} className="mt-1 h-9 text-sm bg-white" />
  </div>
);

const ToggleField = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center gap-3">
    <Switch checked={checked} onCheckedChange={onChange} />
    <Label className="text-sm">{label}</Label>
  </div>
);

export default InspeccionForm;
