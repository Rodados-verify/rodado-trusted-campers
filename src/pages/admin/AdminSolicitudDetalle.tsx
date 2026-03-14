import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Eye, Sparkles, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SolicitudStepper from "@/components/vendedor/SolicitudStepper";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [fotosOriginales, setFotosOriginales] = useState<any[]>([]);
  const [talleres, setTalleres] = useState<any[]>([]);
  const [selectedTaller, setSelectedTaller] = useState("");
  const [informe, setInforme] = useState<any>(null);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [ficha, setFicha] = useState<any>(null);
  const [fotosProcesadas, setFotosProcesadas] = useState<any[]>([]);
  const [inspeccionDetalle, setInspeccionDetalle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [deleting, setDeleting] = useState(false);

  // Publication form
  const [descripcion, setDescripcion] = useState("");
  const [precioFinal, setPrecioFinal] = useState<number | null>(null);
  const [incluyeTransporte, setIncluyeTransporte] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", id).single();
      if (!sol) { setLoading(false); return; }
      setSolicitud(sol);
      setPrecioFinal(sol.precio_venta ? Number(sol.precio_venta) : null);
      setIncluyeTransporte(sol.incluye_transporte);

      const { data: vend } = await supabase.from("usuarios").select("*").eq("id", sol.vendedor_id).single();
      setVendedor(vend);

      const { data: fotos } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id).eq("tipo", "original");
      setFotosOriginales(fotos || []);

      const { data: talleresData } = await supabase.from("talleres").select("*").eq("activo", true);
      setTalleres(talleresData || []);

      const { data: inf } = await supabase.from("informes").select("*").eq("solicitud_id", id).maybeSingle();
      setInforme(inf);

      const { data: cl } = await supabase.from("checklist_items").select("*").eq("solicitud_id", id);
      setChecklistItems(cl || []);

      const { data: fichaData } = await supabase.from("fichas").select("*").eq("solicitud_id", id).maybeSingle();
      setFicha(fichaData);
      if (fichaData?.descripcion_generada) setDescripcion(fichaData.descripcion_generada);
      if (fichaData?.precio_final) setPrecioFinal(Number(fichaData.precio_final));
      if (fichaData?.incluye_transporte_final) setIncluyeTransporte(fichaData.incluye_transporte_final);

      const { data: fp } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id).eq("tipo", "procesada");
      setFotosProcesadas(fp || []);

      const { data: inspeccion } = await supabase.from("inspeccion_detalle").select("*").eq("solicitud_id", id).maybeSingle();
      setInspeccionDetalle(inspeccion);

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

  const generateContent = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ficha-content", {
        body: { solicitud_id: id },
      });
      if (error) throw error;
      setDescripcion(data.description);
      setSolicitud((prev: any) => ({ ...prev, estado: "contenido_generado" }));

      // Refresh fotos procesadas and ficha
      const { data: fp } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id).eq("tipo", "procesada");
      setFotosProcesadas(fp || []);
      const { data: fichaData } = await supabase.from("fichas").select("*").eq("solicitud_id", id).maybeSingle();
      setFicha(fichaData);

      toast({ title: "Contenido generado", description: "Descripción y fotos procesadas listas. Revisa y publica." });
    } catch (err: any) {
      toast({ title: "Error al generar", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const publishFicha = async () => {
    if (!id || !solicitud) return;
    setPublishing(true);
    try {
      const shortId = id.substring(0, 4);
      const slug = `${solicitud.marca}-${solicitud.modelo}-${solicitud.anio}-${shortId}`
        .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

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

      await supabase.from("solicitudes").update({ estado: "publicado" }).eq("id", id);
      setSolicitud((prev: any) => ({ ...prev, estado: "publicado" }));

      // Refresh ficha
      const { data: fichaData } = await supabase.from("fichas").select("*").eq("solicitud_id", id).maybeSingle();
      setFicha(fichaData);

      toast({ title: "¡Ficha publicada!", description: `Disponible en /vehiculo/${slug}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const deleteSolicitud = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      // First delete storage files
      const { data: fotos } = await supabase.from("fotos_solicitud").select("url").eq("solicitud_id", id);
      if (fotos && fotos.length > 0) {
        const paths = fotos.map(f => f.url);
        await supabase.storage.from("solicitud-fotos").remove(paths);
      }

      // Cascade delete via RPC
      const { error } = await supabase.rpc("delete_solicitud_cascade", { _solicitud_id: id });
      if (error) throw error;

      toast({ title: "Solicitud eliminada", description: "Se han borrado todos los datos asociados." });
      navigate("/admin");
    } catch (err: any) {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;
  if (!solicitud) return <div className="py-20 text-center"><p>Solicitud no encontrada</p></div>;

  const assignedTaller = talleres.find(t => t.id === solicitud.taller_id);
  const inspeccionCompleta = inspeccionDetalle && inspeccionDetalle.puntuacion_general !== null;
  const canGenerate = inspeccionCompleta && (solicitud.estado === "en_inspeccion" || solicitud.estado === "contenido_generado");
  const canPublish = inspeccionCompleta && descripcion && solicitud.estado === "contenido_generado";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild><Link to="/admin"><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Link></Button>
          <div>
            <h1 className="font-display text-2xl font-bold">{solicitud.marca} {solicitud.modelo} · {solicitud.anio}</h1>
            <p className="text-sm text-muted-foreground">ID: {solicitud.id.substring(0, 8)}</p>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={deleting}>
              <Trash2 className="mr-1 h-4 w-4" /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta solicitud?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borrarán permanentemente todos los datos: fotos, informes, inspección, checklist y ficha publicada. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={deleteSolicitud} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {deleting ? "Eliminando…" : "Eliminar definitivamente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

      {/* Bloque 3 - Contenido y publicación */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-6">
        <h3 className="font-display text-lg font-semibold">Contenido y publicación</h3>

        {/* Generate content button */}
        {solicitud.estado !== "publicado" && (
          <Button
            variant="ocre"
            onClick={generateContent}
            disabled={generating || !canGenerate}
          >
            {generating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando contenido…</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Generar descripción y fotos automáticamente</>
            )}
          </Button>
        )}

        {/* Description */}
        <div>
          <Label>Descripción del vehículo (generada automáticamente, editable)</Label>
          <Textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Pulsa 'Generar descripción' para crear el contenido automáticamente…"
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

        {/* Fotos procesadas preview */}
        {fotosProcesadas.length > 0 && (
          <div>
            <Label>Fotos procesadas ({fotosProcesadas.length})</Label>
            <div className="mt-2 grid grid-cols-4 gap-2 lg:grid-cols-6">
              {fotosProcesadas.map((f) => (
                <div key={f.id} className="aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <img src={f.url} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {solicitud.estado !== "publicado" && (
          <Button variant="ocre" size="lg" onClick={publishFicha} disabled={publishing || !canPublish}>
            {publishing ? "Publicando…" : "Publicar ficha"}
          </Button>
        )}

        {solicitud.estado === "publicado" && ficha?.slug && (
          <div className="flex items-center gap-3">
            <Button variant="ocre" asChild>
              <a href={`/vehiculo/${ficha.slug}`} target="_blank" rel="noopener noreferrer">
                <Eye className="mr-2 h-4 w-4" /> Ver ficha publicada
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSolicitudDetalle;
