import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const VendedorCuenta = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // Solicitud summary
  const [solicitud, setSolicitud] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: usuario } = await supabase.from("usuarios").select("*").eq("user_id", user.id).single();
      if (usuario) {
        setNombre(usuario.nombre);
        setTelefono(usuario.telefono || "");
      }

      const { data: uRow } = await supabase.from("usuarios").select("id").eq("user_id", user.id).single();
      if (uRow) {
        const { data: sol } = await supabase.from("solicitudes").select("marca, modelo, anio, estado").eq("vendedor_id", uRow.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (sol) setSolicitud(sol);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("usuarios").update({ nombre, telefono }).eq("user_id", user.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Datos actualizados" });
    }
    setSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: "La contraseña debe tener al menos 6 caracteres", variant: "destructive" });
      return;
    }
    setChangingPw(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Contraseña actualizada" });
      setNewPassword("");
    }
    setChangingPw(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Mi cuenta</h1>

      {/* Personal data */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold">Datos personales</h3>
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1.5 bg-background" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <div className="mt-1.5 flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
            <Mail className="mr-2 h-4 w-4" />
            {user?.email}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">El email no se puede cambiar</p>
        </div>
        <div>
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} className="mt-1.5 bg-background" />
        </div>
        <Button variant="ocre" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>

      {/* Password */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold">Cambiar contraseña</h3>
        <div>
          <Label htmlFor="newpw">Nueva contraseña</Label>
          <Input id="newpw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5 bg-background" placeholder="Mínimo 6 caracteres" />
        </div>
        <Button variant="outline" onClick={handlePasswordChange} disabled={changingPw}>
          {changingPw ? "Actualizando…" : "Cambiar contraseña"}
        </Button>
      </div>

      {/* Vehicle summary */}
      {solicitud && (
        <div className="rounded-xl border border-border bg-white p-6 space-y-3">
          <h3 className="font-display text-lg font-semibold">Mi vehículo</h3>
          <p className="text-sm">
            <span className="font-medium">{solicitud.marca} {solicitud.modelo}</span> · {solicitud.anio}
          </p>
          <p className="text-sm text-muted-foreground capitalize">Estado: {solicitud.estado.replace("_", " ")}</p>
          <div className="border-t border-border pt-3">
            <p className="text-sm text-muted-foreground">
              ¿Tienes alguna duda? Escríbenos a{" "}
              <a href="mailto:hola@rodado.es" className="font-medium text-ocre hover:underline">hola@rodado.es</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendedorCuenta;
