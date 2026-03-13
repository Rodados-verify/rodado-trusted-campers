export const Footer = () => (
  <footer className="border-t border-border bg-primary py-12">
    <div className="container text-center">
      <p className="font-display text-lg font-semibold text-primary-foreground">Rodado</p>
      <p className="mt-2 text-sm text-primary-foreground/70">
        Vende tu autocaravana o camper con la presentación de un profesional.
      </p>
      <p className="mt-4 text-sm text-primary-foreground/50">
        Contacto:{" "}
        <a href="mailto:hola@rodado.es" className="underline hover:text-primary-foreground/80">
          hola@rodado.es
        </a>
      </p>
      <p className="mt-6 text-xs text-primary-foreground/40">
        © {new Date().getFullYear()} Rodado. Todos los derechos reservados.
      </p>
    </div>
  </footer>
);
