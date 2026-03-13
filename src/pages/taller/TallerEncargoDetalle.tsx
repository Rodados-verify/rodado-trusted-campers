import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckEstado = "correcto" | "con_observaciones" | "no_aplica";

const SECCIONES = {
  "Mecánica": ["Motor", "Transmisión", "Frenos", "Suspensión", "Dirección", "Neumáticos", "Escape"],
  "Carrocería": ["Estado general", "Golpes", "Repintados", "Oxidación", "Juntas y sellados", "Puertas y accesos"],
  "Habitáculo": ["Estado general", "Humedades", "Tapicería", "Ventanas", "Persianas", "Iluminación"],
  "Instalaciones": ["Eléctrica (panel, batería, solar)", "Gas (instalación, bombonas, detector)", "Agua (depósitos, bomba, griferías)", "Calefacción", "Aire acondicionado"],
  "Documentación": ["ITV en vigor", "Ficha técnica correcta", "Historial de mantenimiento"],
};

interface CheckItem {
  seccion: string;
  item: string;
  estado: CheckEstado;
  observacion: string;
}

const TallerEncargoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [fotosVendedor, setFotosVendedor] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tallerId, setTallerId] = useState<string>("");

  // Checklist state
  const [checklist, setChecklist] = useState<CheckItem[]>([]);
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [puntosPositivos, setPuntosPositivos] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const fetchAll = async () => {
      // Get taller id
      const { data: usuario } = await supabase.from("usuarios").select("id").eq("user_id", user.id).single();
      if (!usuario) { setLoading(false); return; }
      const { data: taller } = await supabase.from("talleres").select("id").eq("usuario_id", usuario.id).maybeSingle();
      if (taller) setTallerId(taller.id);

      // Solicitud
      const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", id).single();
      if (!sol) { setLoading(false); return; }
      setSolicitud(sol);

      // Vendedor
      const { data: vend } = await supabase.from("usuarios").select("*").eq("id", sol.vendedor_id).single();
      setVendedor(vend);

      // Fotos vendedor
      const { data: fotos } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id).eq("tipo", "original");
      setFotosVendedor(fotos || []);

      // Existing checklist
      const { data: existingCl } = await supabase.from("checklist_items").select("*").eq("solicitud_id", id);
      if (existingCl && existingCl.length > 0) {
        setChecklist(existingCl.map(c => ({ seccion: c.seccion, item: c.item, estado: c.estado as CheckEstado, observacion: c.observacion || "" })));
      } else {
        // Initialize default checklist
        const initial: CheckItem[] = [];
        Object.entries(SECCIONES).forEach(([seccion, items]) => {
          items.forEach(item => initial.push({ seccion, item, estado: "correcto", observacion: "" }));
        });
        setChecklist(initial);
      }

      // Existing informe
      const { data: inf } = await supabase.from("informes").select("*").eq("solicitud_id", id).maybeSingle();
      if (inf) {
        setObservacionesGenerales(inf.observaciones_generales || "");
        setPuntosPositivos(inf.puntos_positivos || "");
      }

      setLoading(false);
    };
    fetchAll();
  }, [id, user]);

  const updateCheckItem = (index: number, field: keyof CheckItem, value: string) => {
    setChecklist(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handlePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 40 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (i: number) => {
    setPhotos(prev => prev.filter((_, idx) => idx !== i));
    setPhotoPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const saveDraft = async () => {
    if (!id || !tallerId) return;
    setSaving(true);
    try {
      // Save checklist
      await supabase.from("checklist_items").delete().eq("solicitud_id", id);
      const items = checklist.map(c => ({ solicitud_id: id, seccion: c.seccion, item: c.item, estado: c.estado as any, observacion: c.observacion || null }));
      await supabase.from("checklist_items").insert(items);

      // Save/update informe
      const { data: existing } = await supabase.from("informes").select("id").eq("solicitud_id", id).maybeSingle();
      if (existing) {
        await supabase.from("informes").update({ observaciones_generales: observacionesGenerales, puntos_positivos: puntosPositivos, borrador: true }).eq("id", existing.id);
      } else {
        await supabase.from("informes").insert({ solicitud_id: id, taller_id: tallerId, observaciones_generales: observacionesGenerales, puntos_positivos: puntosPositivos, borrador: true });
      }

      // Update solicitud estado to en_inspeccion if still asignado
      if (solicitud.estado === "asignado") {
        await supabase.from("solicitudes").update({ estado: "en_inspeccion" }).eq("id", id);
        setSolicitud((prev: any) => ({ ...prev, estado: "en_inspeccion" }));
      }

      toast({ title: "Borrador guardado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const completeInspection = async () => {
    if (!id || !tallerId || !user) return;
    setCompleting(true);
    try {
      // Save checklist
      await supabase.from("checklist_items").delete().eq("solicitud_id", id);
      const items = checklist.map(c => ({ solicitud_id: id, seccion: c.seccion, item: c.item, estado: c.estado as any, observacion: c.observacion || null }));
      await supabase.from("checklist_items").insert(items);

      // Upload photos
      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `taller/${tallerId}/${id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("solicitud-fotos").upload(path, photo);
        if (upErr) { console.error(upErr); continue; }
        const { data: urlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(path);
        await supabase.from("fotos_solicitud").insert({ solicitud_id: id, url: urlData.publicUrl, tipo: "original" });
      }

      // Upload PDF
      let pdfUrl = null;
      if (pdfFile) {
        const pdfPath = `taller/${tallerId}/${id}/informe.pdf`;
        const { error: pdfErr } = await supabase.storage.from("solicitud-fotos").upload(pdfPath, pdfFile);
        if (!pdfErr) {
          const { data: pdfUrlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(pdfPath);
          pdfUrl = pdfUrlData.publicUrl;
        }
      }

      // Save informe
      const { data: existing } = await supabase.from("informes").select("id").eq("solicitud_id", id).maybeSingle();
      const informeData = {
        solicitud_id: id,
        taller_id: tallerId,
        observaciones_generales: observacionesGenerales,
        puntos_positivos: puntosPositivos,
        borrador: false,
        ...(pdfUrl ? { url_pdf: pdfUrl } : {}),
      };
      if (existing) {
        await supabase.from("informes").update(informeData).eq("id", existing.id);
      } else {
        await supabase.from("informes").insert(informeData);
      }

      // Update estado
      await supabase.from("solicitudes").update({ estado: "contenido_generado" }).eq("id", id);
      setSolicitud((prev: any) => ({ ...prev, estado: "contenido_generado" }));
      toast({ title: "¡Inspección completada!", description: "El admin ha sido notificado." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;
  if (!solicitud) return <div className="py-20 text-center"><p>Encargo no encontrado</p></div>;

  const isCompleted = solicitud.estado === "contenido_generado" || solicitud.estado === "publicado";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild><Link to="/taller"><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Link></Button>
        <div>
          <h1 className="font-display text-2xl font-bold">{solicitud.marca} {solicitud.modelo} · {solicitud.anio}</h1>
          <p className="text-sm text-muted-foreground">{solicitud.provincia}</p>
        </div>
      </div>

      {/* Vehicle info */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold">Información del vehículo</h3>
        <div className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
          <div><p className="text-muted-foreground">Tipo</p><p className="font-medium capitalize">{solicitud.tipo_vehiculo}</p></div>
          <div><p className="text-muted-foreground">Marca</p><p className="font-medium">{solicitud.marca}</p></div>
          <div><p className="text-muted-foreground">Modelo</p><p className="font-medium">{solicitud.modelo}</p></div>
          <div><p className="text-muted-foreground">Año</p><p className="font-medium">{solicitud.anio}</p></div>
          <div><p className="text-muted-foreground">Kilómetros</p><p className="font-medium">{solicitud.km?.toLocaleString("es-ES")} km</p></div>
          <div><p className="text-muted-foreground">Provincia</p><p className="font-medium">{solicitud.provincia}</p></div>
        </div>
        {solicitud.descripcion && (
          <div className="border-t border-border pt-3"><p className="text-sm text-muted-foreground">Descripción del vendedor</p><p className="mt-1 text-sm">{solicitud.descripcion}</p></div>
        )}

        {/* Contact */}
        {vendedor && (
          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium">Contacto del vendedor</p>
            <p className="text-sm">{vendedor.nombre} · {vendedor.telefono || vendedor.email}</p>
          </div>
        )}

        {/* Fotos vendedor */}
        {fotosVendedor.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Fotos del vendedor</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {fotosVendedor.map(f => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <img src={f.url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inspection checklist */}
      {!isCompleted && (
        <div className="rounded-xl border border-border bg-white p-6 space-y-6">
          <h3 className="font-display text-lg font-semibold">Formulario de inspección</h3>

          {Object.entries(SECCIONES).map(([seccion]) => {
            const sectionItems = checklist.filter(c => c.seccion === seccion);
            return (
              <div key={seccion} className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wide text-forest">{seccion}</h4>
                {sectionItems.map((item, _) => {
                  const globalIndex = checklist.findIndex(c => c.seccion === item.seccion && c.item === item.item);
                  return (
                    <div key={item.item} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.item}</span>
                        <div className="flex gap-1">
                          {(["correcto", "con_observaciones", "no_aplica"] as CheckEstado[]).map(est => (
                            <button
                              key={est}
                              onClick={() => updateCheckItem(globalIndex, "estado", est)}
                              className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
                                item.estado === est
                                  ? est === "correcto" ? "bg-green-100 text-green-700" : est === "con_observaciones" ? "bg-yellow-100 text-yellow-700" : "bg-muted text-muted-foreground"
                                  : "bg-muted/50 text-muted-foreground/50 hover:bg-muted"
                              )}
                            >
                              {est === "correcto" ? "Correcto" : est === "con_observaciones" ? "Observaciones" : "N/A"}
                            </button>
                          ))}
                        </div>
                      </div>
                      {item.estado === "con_observaciones" && (
                        <Textarea
                          value={item.observacion}
                          onChange={e => updateCheckItem(globalIndex, "observacion", e.target.value)}
                          placeholder="Detalla la observación…"
                          className="min-h-[60px] bg-white text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* General observations */}
          <div>
            <Label>Observaciones generales</Label>
            <Textarea value={observacionesGenerales} onChange={e => setObservacionesGenerales(e.target.value)} className="mt-1.5 min-h-[100px] bg-white" placeholder="Resumen general del estado del vehículo…" />
          </div>

          <div>
            <Label>Puntos a destacar positivamente para la venta</Label>
            <Textarea value={puntosPositivos} onChange={e => setPuntosPositivos(e.target.value)} className="mt-1.5 min-h-[100px] bg-white" placeholder="Aspectos destacados del vehículo…" />
          </div>

          {/* Photos */}
          <div>
            <Label>Fotos de la inspección ({photos.length}/40)</Label>
            <label htmlFor="insp-photos" className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-ocre/30 bg-ocre/5 p-6 hover:border-ocre/50 transition-colors">
              <Upload className="h-6 w-6 text-ocre" />
              <span className="text-sm">Subir fotos de inspección</span>
            </label>
            <input id="insp-photos" type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} disabled={photos.length >= 40} />
            {photoPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-6">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)} className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PDF upload */}
          <div>
            <Label>Informe PDF (opcional)</Label>
            <input type="file" accept=".pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} className="mt-1.5 text-sm" />
            {pdfFile && <p className="mt-1 text-xs text-muted-foreground">{pdfFile.name}</p>}
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={saveDraft} disabled={saving}>
              {saving ? "Guardando…" : "Guardar borrador"}
            </Button>
            <Button variant="ocre" size="lg" onClick={completeInspection} disabled={completing}>
              {completing ? "Completando…" : "Completar inspección"}
            </Button>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-display text-lg font-bold text-green-800">Inspección completada ✓</p>
          <p className="mt-1 text-sm text-green-600">El equipo de Rodado está preparando la ficha del vehículo.</p>
        </div>
      )}
    </div>
  );
};

export default TallerEncargoDetalle;
