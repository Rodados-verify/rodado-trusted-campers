import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();
  const { session, role, status, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  useEffect(() => {
    if (!authLoading && session && role) {
      if (role === "taller" && status === "pendiente") {
        navigate("/taller/pendiente", { replace: true });
      } else if (role === "vendedor") {
        navigate("/vendedor", { replace: true });
      } else if (role === "taller") {
        navigate("/taller", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      }
    }
  }, [authLoading, session, role, status, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Te hemos enviado un enlace para restablecer tu contraseña.");
    setShowForgot(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-2xl font-bold text-foreground">
          Rodado
        </Link>
        <div className="rounded-xl border border-border bg-card p-8">
          {showForgot ? (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground">Recuperar contraseña</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Introduce tu email y te enviaremos un enlace.
              </p>
              <form onSubmit={handleForgot} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="forgotEmail">Email</Label>
                  <Input
                    id="forgotEmail"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Enviando…" : "Enviar enlace"}
                </Button>
              </form>
              <button
                onClick={() => setShowForgot(false)}
                className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                Volver al login
              </button>
            </>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold text-foreground">Acceder</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Inicia sesión con tu cuenta de Rodado.
              </p>
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Accediendo…" : "Acceder"}
                </Button>
              </form>
              <button
                onClick={() => setShowForgot(true)}
                className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </button>
              <div className="mt-6 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <Link to="/registro/vendedor" className="font-medium text-primary hover:underline">
                  Vendedor
                </Link>{" "}
                ·{" "}
                <Link to="/registro/taller" className="font-medium text-primary hover:underline">
                  Taller
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
