import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

type Tab = "pendientes" | "en_curso" | "completados";

const TallerEncargos = () => {
  const { user } = useAuth();
  const [encargos, setEncargos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pendientes");

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: usuario } = await supabase.from("usuarios").select("id").eq("user_id", user.id).single();
      if (!usuario) { setLoading(false); return; }
      const { data: taller } = await supabase.from("talleres").select("id").eq("usuario_id", usuario.id).maybeSingle();
      if (!taller) { setLoading(false); return; }
      const { data: sols } = await supabase.from("solicitudes").select("*").eq("taller_id", taller.id).order("created_at", { ascending: false });
      setEncargos(sols || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = encargos.filter(e => {
    if (tab === "pendientes") return e.estado === "asignado";
    if (tab === "en_curso") return e.estado === "en_inspeccion";
    return e.estado === "contenido_generado" || e.estado === "publicado";
  });

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Mis encargos</h1>

      <div className="flex gap-2">
        {(["pendientes", "en_curso", "completados"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition-colors", tab === t ? "bg-forest text-white" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
            {t === "pendientes" ? "Pendientes" : t === "en_curso" ? "En curso" : "Completados"}
            {` (${encargos.filter(e => t === "pendientes" ? e.estado === "asignado" : t === "en_curso" ? e.estado === "en_inspeccion" : e.estado === "contenido_generado" || e.estado === "publicado").length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <p className="text-muted-foreground">No tienes encargos {tab === "pendientes" ? "pendientes" : tab === "en_curso" ? "en curso" : "completados"}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
              <div>
                <p className="font-medium">{e.marca} {e.modelo} · {e.anio}</p>
                <p className="text-sm text-muted-foreground">{e.provincia} · {new Date(e.created_at).toLocaleDateString("es-ES")}</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/taller/encargo/${e.id}`}><Eye className="mr-1 h-4 w-4" /> Ver</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TallerEncargos;
