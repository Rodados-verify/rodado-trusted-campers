import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const RegistroTaller = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    telefono: "",
    nombre_taller: "",
    direccion: "",
    provincia: "",
    descripcion_taller: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre: form.nombre,
          telefono: form.telefono,
          role: "taller",
          nombre_taller: form.nombre_taller,
          direccion: form.direccion,
          provincia: form.provincia,
          descripcion_taller: form.descripcion_taller,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    navigate("/taller/pendiente");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-2xl font-bold text-forest">
          Rodado
        </Link>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold text-foreground">Registro de taller</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Únete a la red Rodado y recibe encargos de inspección.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" type="tel" value={form.telefono} onChange={handleChange} />
            </div>

            <hr className="border-border" />

            <div>
              <Label htmlFor="nombre_taller">Nombre del taller</Label>
              <Input id="nombre_taller" name="nombre_taller" value={form.nombre_taller} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={form.direccion} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="provincia">Provincia</Label>
              <Input id="provincia" name="provincia" value={form.provincia} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="descripcion_taller">Descripción breve</Label>
              <Textarea
                id="descripcion_taller"
                name="descripcion_taller"
                value={form.descripcion_taller}
                onChange={handleChange}
                placeholder="Especialidad, experiencia con campers…"
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Enviando…" : "Solicitar unirme como taller"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Acceder
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistroTaller;
