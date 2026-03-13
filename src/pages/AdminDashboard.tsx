import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg text-center">
        <Link to="/" className="mb-8 block font-display text-2xl font-bold text-forest">
          Rodado
        </Link>
        <div className="rounded-xl border border-border bg-card p-8">
          <h1 className="font-display text-2xl font-bold text-foreground">
            Panel de administración 🛡️
          </h1>
          <p className="mt-3 text-muted-foreground">
            Próximamente: gestión de talleres, solicitudes y usuarios.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          <Button variant="outline" className="mt-8" onClick={signOut}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
