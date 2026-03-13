import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const TallerPerfil = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [taller, setTaller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState({ completados: 0, enCurso: 0 });

  const [form, setForm] = useState({
    nombre_taller: "",
    direccion: "",
    provincia: "",
    descripcion: "",
  });

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: usuario } = await supabase.from("usuarios").select("id").eq("user_id", user.id).single();
      if (!usuario) { setLoading(false); return; }
      const { data: t } = await supabase.from("talleres").select("*").eq("usuario_id", usuario.id).maybeSingle();
      if (t) {
        setTaller(t);
        setForm({ nombre_taller: t.nombre_taller, direccion: t.direccion, provincia: t.provincia, descripcion: t.descripcion || "" });
        // Stats
        const { data: sols } = await supabase.from("solicitudes").select("estado").eq("taller_id", t.id);
        if (sols) {
          setStats({
            completados: sols.filter(s => s.estado === "contenido_generado" || s.estado === "publicado").length,
            enCurso: sols.filter(s => s.estado === "asignado" || s.estado === "en_inspeccion").length,
          });
        }
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taller) return;
    setSaving(true);
    const { error } = await supabase.from("talleres").update(form).eq("id", taller.id);
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Perfil actualizado" });
  };

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contraseña actualizada" });
    setPassword("");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Mi perfil</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="font-display text-2xl font-bold text-forest">{stats.completados}</p>
          <p className="text-sm text-muted-foreground">Completados</p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 text-center">
          <p className="font-display text-2xl font-bold text-ocre">{stats.enCurso}</p>
          <p className="text-sm text-muted-foreground">En curso</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div><Label>Nombre del taller</Label><Input value={form.nombre_taller} onChange={e => setForm(f => ({ ...f, nombre_taller: e.target.value }))} className="mt-1.5 bg-white" /></div>
        <div><Label>Dirección</Label><Input value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} className="mt-1.5 bg-white" /></div>
        <div><Label>Provincia</Label><Input value={form.provincia} onChange={e => setForm(f => ({ ...f, provincia: e.target.value }))} className="mt-1.5 bg-white" /></div>
        <div><Label>Descripción</Label><Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} className="mt-1.5 bg-white" /></div>
        <div><Label>Email</Label><Input value={user?.email || ""} disabled className="mt-1.5 bg-muted" /></div>
        <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</Button>
      </form>

      <form onSubmit={handlePassword} className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold">Cambiar contraseña</h3>
        <div><Label>Nueva contraseña</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 bg-white" required minLength={8} /></div>
        <Button type="submit">Cambiar contraseña</Button>
      </form>
    </div>
  );
};

export default TallerPerfil;
