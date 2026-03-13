import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminCuenta = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contraseña actualizada" });
    setPassword("");
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Mi cuenta</h1>
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled className="mt-1.5 bg-muted" />
        </div>
        <form onSubmit={handlePassword} className="space-y-4 border-t border-border pt-4">
          <div>
            <Label htmlFor="new-pass">Nueva contraseña</Label>
            <Input id="new-pass" type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1.5 bg-white" required minLength={8} />
          </div>
          <Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Cambiar contraseña"}</Button>
        </form>
      </div>
    </div>
  );
};

export default AdminCuenta;
