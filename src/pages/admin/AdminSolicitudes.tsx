import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

type SolicitudStatus = "pendiente" | "asignado" | "en_inspeccion" | "contenido_generado" | "publicado";

const STATUS_LABELS: Record<SolicitudStatus, string> = {
  pendiente: "Pendiente",
  asignado: "Asignado",
  en_inspeccion: "En inspección",
  contenido_generado: "Contenido generado",
  publicado: "Publicado",
};

const STATUS_COLORS: Record<SolicitudStatus, string> = {
  pendiente: "bg-muted text-muted-foreground",
  asignado: "bg-blue-100 text-blue-700",
  en_inspeccion: "bg-yellow-100 text-yellow-700",
  contenido_generado: "bg-orange-100 text-orange-700",
  publicado: "bg-green-100 text-green-700",
};

interface SolicitudRow {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  provincia: string;
  estado: SolicitudStatus;
  created_at: string;
  vendedor_id: string;
  vendedor_nombre?: string;
}

const AdminSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState<SolicitudRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<SolicitudStatus | "todas">("todas");

  useEffect(() => {
    const fetchData = async () => {
      const { data: sols } = await supabase
        .from("solicitudes")
        .select("*")
        .order("created_at", { ascending: false });

      if (!sols) { setLoading(false); return; }

      // Get vendedor names
      const vendedorIds = [...new Set(sols.map(s => s.vendedor_id))];
      const { data: usuarios } = await supabase
        .from("usuarios")
        .select("id, nombre")
        .in("id", vendedorIds);

      const nameMap = new Map(usuarios?.map(u => [u.id, u.nombre]) || []);

      setSolicitudes(sols.map(s => ({
        ...s,
        estado: s.estado as SolicitudStatus,
        vendedor_nombre: nameMap.get(s.vendedor_id) || "—",
      })));
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = filterStatus === "todas" ? solicitudes : solicitudes.filter(s => s.estado === filterStatus);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Solicitudes</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(["todas", "pendiente", "asignado", "en_inspeccion", "contenido_generado", "publicado"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filterStatus === s ? "bg-forest text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {s === "todas" ? "Todas" : STATUS_LABELS[s]}
            {s !== "todas" && ` (${solicitudes.filter(sol => sol.estado === s).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <p className="text-muted-foreground">No hay solicitudes{filterStatus !== "todas" ? ` con estado "${STATUS_LABELS[filterStatus]}"` : ""}.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vendedor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Vehículo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provincia</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">{s.vendedor_nombre}</td>
                  <td className="px-4 py-3">{s.marca} {s.modelo} · {s.anio}</td>
                  <td className="px-4 py-3">{s.provincia}</td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[s.estado])}>
                      {STATUS_LABELS[s.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/solicitud/${s.id}`}><Eye className="mr-1 h-4 w-4" /> Ver</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSolicitudes;
