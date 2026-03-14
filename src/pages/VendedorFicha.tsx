import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import SolicitudStepper from "@/components/vendedor/SolicitudStepper";
import { ExternalLink, Copy, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VendedorFicha = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState<string | null>(null);
  const [fichaSlug, setFichaSlug] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: usuario } = await supabase.from("usuarios").select("id").eq("user_id", user.id).single();
      if (!usuario) { setLoading(false); return; }

      const { data: sol } = await supabase
        .from("solicitudes")
        .select("id, estado, created_at")
        .eq("vendedor_id", usuario.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sol) {
        setEstado(sol.estado);
        setCreatedAt(sol.created_at);
        if (sol.estado === "publicado") {
          const { data: ficha } = await supabase.from("fichas").select("slug").eq("solicitud_id", sol.id).eq("activa", true).maybeSingle();
          if (ficha?.slug) setFichaSlug(ficha.slug);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const copyLink = () => {
    if (fichaSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/vehiculo/${fichaSlug}`);
      toast({ title: "Enlace copiado" });
    }
  };

  const shareWhatsApp = () => {
    if (fichaSlug) {
      const url = `${window.location.origin}/ficha/${fichaSlug}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(`Echa un vistazo a mi camper verificado por Rodado: ${url}`)}`, "_blank");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;
  }

  if (!estado) {
    return (
      <div className="mx-auto max-w-lg text-center py-16">
        <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="font-display text-2xl font-bold text-foreground">Aún no tienes una ficha</h1>
        <p className="mt-3 text-muted-foreground">Crea tu solicitud primero y tu ficha estará lista en pocos días.</p>
      </div>
    );
  }

  if (estado !== "publicado") {
    return (
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Tu ficha está en camino</h1>
          <p className="mt-2 text-muted-foreground">Normalmente en 3-5 días laborables tendrás tu ficha publicada.</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-6 lg:p-8">
          <SolicitudStepper currentStatus={estado as any} createdAt={createdAt || undefined} />
        </div>
      </div>
    );
  }

  // Published
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Mi ficha</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tu ficha está publicada y lista para compartir</p>
      </div>

      {fichaSlug && (
        <>
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <iframe
              src={`/ficha/${fichaSlug}`}
              className="h-[600px] w-full border-0"
              title="Mi ficha Rodado"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="ocre" asChild>
              <a href={`/ficha/${fichaSlug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Abrir en nueva pestaña
              </a>
            </Button>
            <Button variant="outline" onClick={copyLink}>
              <Copy className="mr-2 h-4 w-4" /> Copiar enlace
            </Button>
            <Button variant="forest-outline" onClick={shareWhatsApp}>
              Compartir en WhatsApp
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default VendedorFicha;
