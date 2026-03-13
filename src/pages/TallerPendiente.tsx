import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

const TallerPendiente = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="w-full max-w-lg text-center">
      <Link to="/" className="mb-8 block font-display text-2xl font-bold text-forest">
        Rodado
      </Link>
      <div className="rounded-xl border border-border bg-card p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <Clock className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-2xl font-bold text-foreground">
          Solicitud recibida
        </h1>
        <p className="mt-3 text-muted-foreground">
          Revisaremos tu perfil y te contactaremos en 48 horas.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  </div>
);

export default TallerPendiente;
