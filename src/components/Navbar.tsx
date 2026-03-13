import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-background/90 backdrop-blur-md border-b border-border" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 md:h-20 items-center justify-between">
        <Link to="/" className="font-display text-xl md:text-2xl font-bold text-forest tracking-tight">
          Rodado
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#como-funciona" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Cómo funciona
          </a>
          <a href="#talleres" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Para talleres
          </a>
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Acceder
          </Link>
          <Button variant="ocre" size="default" asChild>
            <Link to="/registro/vendedor">Vender mi camper</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background border-t border-border px-6 py-6 space-y-4">
          <a href="#como-funciona" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
            Cómo funciona
          </a>
          <a href="#talleres" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
            Para talleres
          </a>
          <Link to="/login" className="block text-sm font-medium text-muted-foreground" onClick={() => setMobileOpen(false)}>
            Acceder
          </Link>
          <Button variant="ocre" size="lg" className="w-full" asChild>
            <Link to="/registro/vendedor" onClick={() => setMobileOpen(false)}>Vender mi camper</Link>
          </Button>
        </div>
      )}
    </nav>
  );
};
