import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

const AdminTalleres = () => {
  const { toast } = useToast();
  const [talleres, setTalleres] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: t } = await supabase.from("talleres").select("*").order("created_at", { ascending: false });
      if (t) {
        setTalleres(t);
        const uIds = [...new Set(t.map(taller => taller.usuario_id))];
        const { data: u } = await supabase.from("usuarios").select("*").in("id", uIds);
        if (u) setUsuarios(new Map(u.map(usr => [usr.id, usr])));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const updateEstado = async (tallerId: string, activo: boolean, usuarioId: string) => {
    const newEstado = activo ? "activo" : "rechazado";
    await supabase.from("talleres").update({ activo }).eq("id", tallerId);
    // Also update usuario estado
    await supabase.from("usuarios").update({ estado: newEstado as any }).eq("id", usuarioId);
    setTalleres(prev => prev.map(t => t.id === tallerId ? { ...t, activo } : t));
    toast({ title: activo ? "Taller activado" : "Taller rechazado" });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Talleres</h1>

      {talleres.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center">
          <p className="text-muted-foreground">No hay talleres registrados.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provincia</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {talleres.map(t => {
                const usr = usuarios.get(t.usuario_id);
                const estado = usr?.estado || (t.activo ? "activo" : "pendiente");
                return (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{t.nombre_taller}</td>
                    <td className="px-4 py-3">{t.provincia}</td>
                    <td className="px-4 py-3 text-muted-foreground">{usr?.email || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                        estado === "activo" ? "bg-green-100 text-green-700" : estado === "rechazado" ? "bg-red-100 text-red-700" : "bg-muted text-muted-foreground"
                      )}>
                        {estado === "activo" ? "Activo" : estado === "rechazado" ? "Rechazado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!t.activo && (
                          <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700" onClick={() => updateEstado(t.id, true, t.usuario_id)}>
                            <Check className="mr-1 h-4 w-4" /> Activar
                          </Button>
                        )}
                        {t.activo && (
                          <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => updateEstado(t.id, false, t.usuario_id)}>
                            <X className="mr-1 h-4 w-4" /> Rechazar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminTalleres;
