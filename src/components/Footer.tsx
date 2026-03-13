import { Link } from "react-router-dom";

export const Footer = () => (
  <footer className="bg-forest py-16 md:py-20">
    <div className="container">
      <div className="flex flex-col items-center text-center">
        <span className="font-display text-2xl font-bold text-white tracking-tight">Rodado</span>
        <p className="mt-4 max-w-md text-sm text-white/60 leading-relaxed">
          Vende tu autocaravana como merece ser vendida.
        </p>
        <div className="mt-8 flex items-center gap-6 text-sm text-white/40">
          <a href="mailto:hola@rodado.es" className="hover:text-white/70 transition-colors">
            hola@rodado.es
          </a>
          <span>·</span>
          <Link to="/login" className="hover:text-white/70 transition-colors">
            Acceder
          </Link>
        </div>
        <div className="mt-10 w-16 border-t border-white/10" />
        <p className="mt-6 text-xs text-white/30">
          © {new Date().getFullYear()} Rodado. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </footer>
);
