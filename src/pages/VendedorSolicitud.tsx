import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SolicitudStepper from "@/components/vendedor/SolicitudStepper";
import NuevaSolicitudForm from "@/components/vendedor/NuevaSolicitudForm";
import { ExternalLink, Copy, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type SolicitudStatus = "pendiente" | "asignado" | "en_inspeccion" | "contenido_generado" | "publicado";

interface Solicitud {
  id: string;
  tipo_vehiculo: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  provincia: string;
  precio_venta: number | null;
  descripcion: string | null;
  incluye_transporte: boolean;
  estado: SolicitudStatus;
  created_at: string;
}

const VendedorSolicitud = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fichaSlug, setFichaSlug] = useState<string | null>(null);

  const fetchSolicitud = async () => {
    if (!user) return;
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!usuario) { setLoading(false); return; }

    const { data } = await supabase
      .from("solicitudes")
      .select("*")
      .eq("vendedor_id", usuario.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setSolicitud(data as Solicitud);
      // Check for published ficha
      if (data.estado === "publicado") {
        const { data: ficha } = await supabase
          .from("fichas")
          .select("slug")
          .eq("solicitud_id", data.id)
          .eq("activa", true)
          .maybeSingle();
        if (ficha?.slug) setFichaSlug(ficha.slug);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSolicitud();
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!solicitud) return;
    const channel = supabase
      .channel(`solicitud-${solicitud.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "solicitudes", filter: `id=eq.${solicitud.id}` }, (payload) => {
        setSolicitud((prev) => prev ? { ...prev, ...payload.new } as Solicitud : prev);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [solicitud?.id]);

  const copyLink = () => {
    if (fichaSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/ficha/${fichaSlug}`);
      toast({ title: "Enlace copiado" });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;
  }

  // Empty state
  if (!solicitud && !showForm) {
    return (
      <div className="mx-auto max-w-lg text-center py-16">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-ocre/10">
          <FileText className="h-8 w-8 text-ocre" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Empieza a vender tu camper como un profesional
        </h1>
        <p className="mt-4 text-muted-foreground">
          Rellena los datos de tu vehículo, sube tus fotos y nosotros nos encargamos del resto: inspección técnica, presentación profesional y tu propia ficha de venta.
        </p>
        <Button variant="ocre" size="lg" className="mt-8" onClick={() => setShowForm(true)}>
          Crear mi solicitud
        </Button>
      </div>
    );
  }

  // Form
  if (showForm && !solicitud) {
    return <NuevaSolicitudForm onCreated={() => { setShowForm(false); fetchSolicitud(); }} />;
  }

  // Existing solicitud
  if (solicitud) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Mi solicitud</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {solicitud.marca} {solicitud.modelo} · {solicitud.anio}
          </p>
        </div>

        {/* Stepper */}
        <div className="rounded-xl border border-border bg-white p-6 lg:p-8">
          <SolicitudStepper currentStatus={solicitud.estado} createdAt={solicitud.created_at} />

          {solicitud.estado === "publicado" && fichaSlug && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button variant="ocre" size="lg" asChild>
                <a href={`/ficha/${fichaSlug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Ver mi ficha
                </a>
              </Button>
              <Button variant="outline" onClick={copyLink}>
                <Copy className="mr-2 h-4 w-4" /> Copiar enlace
              </Button>
            </div>
          )}
        </div>

        {/* Vehicle summary */}
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-display text-lg font-semibold">Datos del vehículo</h3>
          <div className="mt-4 grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-medium capitalize">{solicitud.tipo_vehiculo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Marca</p>
              <p className="font-medium">{solicitud.marca}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Modelo</p>
              <p className="font-medium">{solicitud.modelo}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Año</p>
              <p className="font-medium">{solicitud.anio}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Kilómetros</p>
              <p className="font-medium">{solicitud.km.toLocaleString("es-ES")} km</p>
            </div>
            <div>
              <p className="text-muted-foreground">Provincia</p>
              <p className="font-medium">{solicitud.provincia}</p>
            </div>
            {solicitud.precio_venta && (
              <div>
                <p className="text-muted-foreground">Precio deseado</p>
                <p className="font-medium">{Number(solicitud.precio_venta).toLocaleString("es-ES")} €</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Transporte</p>
              <p className="font-medium">{solicitud.incluye_transporte ? "Incluido" : "No"}</p>
            </div>
          </div>
          {solicitud.descripcion && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="mt-1 text-sm">{solicitud.descripcion}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default VendedorSolicitud;
