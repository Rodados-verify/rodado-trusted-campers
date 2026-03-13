import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Upload, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import SolicitudStepper from "@/components/vendedor/SolicitudStepper";

type SolicitudStatus = "pendiente" | "asignado" | "en_inspeccion" | "contenido_generado" | "publicado";

const STATUS_OPTIONS: { value: SolicitudStatus; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "asignado", label: "Asignado" },
  { value: "en_inspeccion", label: "En inspección" },
  { value: "contenido_generado", label: "Contenido generado" },
  { value: "publicado", label: "Publicado" },
];

const AdminSolicitudDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [fotosOriginales, setFotosOriginales] = useState<any[]>([]);
  const [fotosTaller, setFotosTaller] = useState<any[]>([]);
  const [talleres, setTalleres] = useState<any[]>([]);
  const [selectedTaller, setSelectedTaller] = useState("");
  const [informe, setInforme] = useState<any>(null);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Publication form
  const [descripcion, setDescripcion] = useState("");
  const [precioFinal, setPrecioFinal] = useState<number | null>(null);
  const [incluyeTransporte, setIncluyeTransporte] = useState(false);
  const [fotosProcesadas, setFotosProcesadas] = useState<File[]>([]);
  const [fotoProcPreviews, setFotoProcPreviews] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      // Solicitud
      const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", id).single();
      if (!sol) { setLoading(false); return; }
      setSolicitud(sol);
      setPrecioFinal(sol.precio_venta ? Number(sol.precio_venta) : null);
      setIncluyeTransporte(sol.incluye_transporte);

      // Vendedor
      const { data: vend } = await supabase.from("usuarios").select("*").eq("id", sol.vendedor_id).single();
      setVendedor(vend);

      // Fotos originales
      const { data: fotos } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id).eq("tipo", "original");
      setFotosOriginales(fotos || []);

      // Fotos taller (also original tipo uploaded by taller)
      const { data: ft } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id);
      setFotosTaller(ft || []);

      // Talleres activos
      const { data: talleresData } = await supabase.from("talleres").select("*").eq("activo", true);
      setTalleres(talleresData || []);

      // Informe
      const { data: inf } = await supabase.from("informes").select("*").eq("solicitud_id", id).maybeSingle();
      setInforme(inf);

      // Checklist
      const { data: cl } = await supabase.from("checklist_items").select("*").eq("solicitud_id", id);
      setChecklistItems(cl || []);

      // Existing ficha
      const { data: ficha } = await supabase.from("fichas").select("*").eq("solicitud_id", id).maybeSingle();
      if (ficha?.descripcion_generada) setDescripcion(ficha.descripcion_generada);
      if (ficha?.precio_final) setPrecioFinal(Number(ficha.precio_final));
      if (ficha?.incluye_transporte_final) setIncluyeTransporte(ficha.incluye_transporte_final);

      // Existing fotos procesadas
      const { data: fp } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id).eq("tipo", "procesada");
      if (fp && fp.length > 0) {
        setFotoProcPreviews(fp.map(f => f.url));
      }

      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const assignTaller = async () => {
    if (!selectedTaller || !id) return;
    const { error } = await supabase.from("solicitudes").update({ taller_id: selectedTaller, estado: "asignado" }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setSolicitud((prev: any) => ({ ...prev, taller_id: selectedTaller, estado: "asignado" }));
    toast({ title: "Taller asignado correctamente" });
  };

  const changeStatus = async (newStatus: SolicitudStatus) => {
    if (!id) return;
    const { error } = await supabase.from("solicitudes").update({ estado: newStatus }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setSolicitud((prev: any) => ({ ...prev, estado: newStatus }));
    toast({ title: `Estado cambiado a "${newStatus}"` });
  };

  const handleProcesadasUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 30 - fotosProcesadas.length;
    const toAdd = files.slice(0, remaining);
    setFotosProcesadas(prev => [...prev, ...toAdd]);
    toAdd.forEach(f => {
      const reader = new FileReader();
      reader.onloadend = () => setFotoProcPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeProcesada = (i: number) => {
    setFotosProcesadas(prev => prev.filter((_, idx) => idx !== i));
    setFotoProcPreviews(prev => prev.filter((_, idx) => idx !== i));
  };

  const publishFicha = async () => {
    if (!id || !solicitud) return;
    setPublishing(true);
    try {
      // Upload processed photos
      for (const photo of fotosProcesadas) {
        const ext = photo.name.split(".").pop();
        const path = `admin/${id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("solicitud-fotos").upload(path, photo);
        if (upErr) { console.error(upErr); continue; }
        const { data: urlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(path);
        await supabase.from("fotos_solicitud").insert({ solicitud_id: id, url: urlData.publicUrl, tipo: "procesada" });
      }

      // Generate slug
      const shortId = id.substring(0, 4);
      const slug = `${solicitud.marca}-${solicitud.modelo}-${solicitud.anio}-${shortId}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

      // Upsert ficha
      const { data: existingFicha } = await supabase.from("fichas").select("id").eq("solicitud_id", id).maybeSingle();
      if (existingFicha) {
        await supabase.from("fichas").update({
          descripcion_generada: descripcion,
          precio_final: precioFinal,
          incluye_transporte_final: incluyeTransporte,
          slug,
          activa: true,
        }).eq("id", existingFicha.id);
      } else {
        await supabase.from("fichas").insert({
          solicitud_id: id,
          descripcion_generada: descripcion,
          precio_final: precioFinal,
          incluye_transporte_final: incluyeTransporte,
          slug,
          activa: true,
        });
      }

      // Update estado
      await supabase.from("solicitudes").update({ estado: "publicado" }).eq("id", id);
      setSolicitud((prev: any) => ({ ...prev, estado: "publicado" }));
      toast({ title: "¡Ficha publicada!", description: `Disponible en /vehiculo/${slug}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;
  if (!solicitud) return <div className="py-20 text-center"><p>Solicitud no encontrada</p></div>;

  const assignedTaller = talleres.find(t => t.id === solicitud.taller_id);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild><Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Link></Button>
        <div>
          <h1 className="font-display text-2xl font-bold">{solicitud.marca} {solicitud.modelo} · {solicitud.anio}</h1>
          <p className="text-sm text-muted-foreground">ID: {solicitud.id.substring(0, 8)}</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="rounded-xl border border-border bg-white p-6">
        <SolicitudStepper currentStatus={solicitud.estado as any} createdAt={solicitud.created_at} />
      </div>

      {/* Manual status change */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Cambiar estado:</span>
        {STATUS_OPTIONS.map(s => (
          <button
            key={s.value}
            onClick={() => changeStatus(s.value)}
            disabled={solicitud.estado === s.value}
            className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", solicitud.estado === s.value ? "bg-forest text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Bloque 1 - Vehicle & Vendedor */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-6">
        <h3 className="font-display text-lg font-semibold">Datos del vehículo y vendedor</h3>
        <div className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
          <div><p className="text-muted-foreground">Vendedor</p><p className="font-medium">{vendedor?.nombre || "—"}</p></div>
          <div><p className="text-muted-foreground">Email</p><p className="font-medium">{vendedor?.email || "—"}</p></div>
          <div><p className="text-muted-foreground">Teléfono</p><p className="font-medium">{vendedor?.telefono || "—"}</p></div>
          <div><p className="text-muted-foreground">Tipo</p><p className="font-medium capitalize">{solicitud.tipo_vehiculo}</p></div>
          <div><p className="text-muted-foreground">Marca</p><p className="font-medium">{solicitud.marca}</p></div>
          <div><p className="text-muted-foreground">Modelo</p><p className="font-medium">{solicitud.modelo}</p></div>
          <div><p className="text-muted-foreground">Año</p><p className="font-medium">{solicitud.anio}</p></div>
          <div><p className="text-muted-foreground">Kilómetros</p><p className="font-medium">{solicitud.km?.toLocaleString("es-ES")} km</p></div>
          <div><p className="text-muted-foreground">Provincia</p><p className="font-medium">{solicitud.provincia}</p></div>
          {solicitud.precio_venta && <div><p className="text-muted-foreground">Precio deseado</p><p className="font-medium">{Number(solicitud.precio_venta).toLocaleString("es-ES")} €</p></div>}
          <div><p className="text-muted-foreground">Transporte</p><p className="font-medium">{solicitud.incluye_transporte ? "Sí" : "No"}</p></div>
        </div>
        {solicitud.descripcion && (
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">Descripción del vendedor</p>
            <p className="mt-1 text-sm">{solicitud.descripcion}</p>
          </div>
        )}

        {/* Fotos originales */}
        {fotosOriginales.length > 0 && (
          <div>
            <p className="mb-3 text-sm font-medium">Fotos del vendedor ({fotosOriginales.length})</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {fotosOriginales.map(f => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <img src={f.url} alt="" className="h-full w-full object-cover hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bloque 2 - Taller */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold">Gestión del taller</h3>

        {solicitud.estado === "pendiente" ? (
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Asignar taller</Label>
              <select
                value={selectedTaller}
                onChange={e => setSelectedTaller(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              >
                <option value="">Seleccionar taller…</option>
                {talleres.map(t => (
                  <option key={t.id} value={t.id}>{t.nombre_taller} — {t.provincia}</option>
                ))}
              </select>
            </div>
            <Button variant="ocre" onClick={assignTaller} disabled={!selectedTaller}>Asignar taller</Button>
          </div>
        ) : (
          <div className="text-sm">
            <p className="text-muted-foreground">Taller asignado</p>
            <p className="font-medium">{assignedTaller?.nombre_taller || solicitud.taller_id?.substring(0, 8)}{assignedTaller ? ` — ${assignedTaller.provincia}` : ""}</p>
          </div>
        )}

        {/* Informe del taller */}
        {informe && (
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-sm font-medium">Informe del taller</p>
            {informe.observaciones_generales && (
              <div><p className="text-xs text-muted-foreground">Observaciones generales</p><p className="text-sm">{informe.observaciones_generales}</p></div>
            )}
            {informe.puntos_positivos && (
              <div><p className="text-xs text-muted-foreground">Puntos positivos</p><p className="text-sm">{informe.puntos_positivos}</p></div>
            )}
            {informe.url_pdf && (
              <a href={informe.url_pdf} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-forest hover:underline">
                <Download className="h-4 w-4" /> Descargar informe PDF
              </a>
            )}
          </div>
        )}

        {/* Checklist summary */}
        {checklistItems.length > 0 && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-sm font-medium">Checklist de inspección</p>
            {["Mecánica", "Carrocería", "Habitáculo", "Instalaciones", "Documentación"].map(seccion => {
              const items = checklistItems.filter(i => i.seccion === seccion);
              if (items.length === 0) return null;
              return (
                <div key={seccion} className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{seccion}</p>
                  <div className="mt-1 space-y-1">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <span className={cn("inline-block h-2 w-2 rounded-full", item.estado === "correcto" ? "bg-green-500" : item.estado === "con_observaciones" ? "bg-yellow-500" : "bg-muted-foreground/30")} />
                        <span>{item.item}</span>
                        {item.observacion && <span className="text-xs text-muted-foreground">— {item.observacion}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bloque 3 - Publicación */}
      {(solicitud.estado === "contenido_generado" || solicitud.estado === "publicado" || solicitud.estado === "en_inspeccion") && (
        <div className="rounded-xl border border-border bg-white p-6 space-y-6">
          <h3 className="font-display text-lg font-semibold">Contenido y publicación</h3>

          <div>
            <Label>Descripción del vehículo</Label>
            <Textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder="Escribe la descripción para la ficha pública…"
              className="mt-1.5 min-h-[200px] bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Precio de venta definitivo (€)</Label>
              <Input type="number" value={precioFinal ?? ""} onChange={e => setPrecioFinal(e.target.value ? Number(e.target.value) : null)} className="mt-1.5 bg-white" />
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center gap-2">
                <Checkbox id="transporte-final" checked={incluyeTransporte} onCheckedChange={c => setIncluyeTransporte(!!c)} />
                <Label htmlFor="transporte-final">Incluye transporte a domicilio</Label>
              </div>
            </div>
          </div>

          {/* Fotos procesadas upload */}
          <div>
            <Label>Fotos procesadas finales</Label>
            <label htmlFor="proc-upload" className="mt-2 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-forest/30 bg-forest/5 p-6 transition-colors hover:border-forest/50">
              <Upload className="h-6 w-6 text-forest" />
              <span className="text-sm">Subir fotos procesadas ({fotoProcPreviews.length}/30)</span>
            </label>
            <input id="proc-upload" type="file" accept="image/*" multiple className="hidden" onChange={handleProcesadasUpload} disabled={fotosProcesadas.length >= 30} />
            {fotoProcPreviews.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-6">
                {fotoProcPreviews.map((src, i) => (
                  <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button type="button" onClick={() => removeProcesada(i)} className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {solicitud.estado !== "publicado" && (
            <Button variant="ocre" size="lg" onClick={publishFicha} disabled={publishing || !descripcion}>
              {publishing ? "Publicando…" : "Publicar ficha"}
            </Button>
          )}

          {solicitud.estado === "publicado" && (
            <div className="flex items-center gap-3">
              <Button variant="ocre" asChild>
                <a href={`/vehiculo/${solicitud.marca}-${solicitud.modelo}-${solicitud.anio}-${id?.substring(0, 4)}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-/]/g, "")} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" /> Ver ficha publicada
                </a>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSolicitudDetalle;
