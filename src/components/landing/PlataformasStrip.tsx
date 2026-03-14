const platforms = [
  "Wallapop",
  "Milanuncios",
  "Facebook Marketplace",
  "Grupos camper",
  "WhatsApp",
];

export const PlataformasStrip = () => (
  <section className="bg-sand py-5 md:py-6 border-y border-border/50">
    <div className="container">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
        <p className="text-xs md:text-sm text-muted-foreground font-body text-center leading-relaxed max-w-2xl">
          Tu ficha Rodado funciona en cualquier plataforma — comparte el enlace donde quieras
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {platforms.map((p, i) => (
            <span key={p} className="flex items-center gap-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-forest/70 font-body whitespace-nowrap">
                {p}
              </span>
              {i < platforms.length - 1 && (
                <span className="text-forest/20 hidden sm:inline">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>
);
