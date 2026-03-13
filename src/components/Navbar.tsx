import { Link } from "react-router-dom";
import { BadgeRodado } from "./BadgeRodado";

export const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
    <div className="container flex h-16 items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <span className="font-display text-xl font-bold text-foreground tracking-tight">Rodado</span>
      </Link>
      <div className="flex items-center gap-4">
        <BadgeRodado />
        <Link
          to="/login"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Acceder
        </Link>
      </div>
    </div>
  </nav>
);
