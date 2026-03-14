import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { SelloRodado } from "@/components/SelloRodado";

const differentiators = [
  "No compramos tu camper. Tú vendes directamente al comprador.",
  "Sin comisiones. Sin cesión de margen. Precio fijo por el servicio.",
  "Publicas en Wallapop, Milanuncios, grupos de Facebook o donde quieras. Tú controlas tu venta.",
  "Tu ficha con sello Rodado genera la confianza que cierra la venta.",
];

export const HeroSection = () => (
  <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-44 lg:pb-36 overflow-hidden">
    <div className="container">
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
        {/* Text — 7 cols */}
        <div className="lg:col-span-7 relative z-10">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 border-t border-ocre" />
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ocre">
              Para vendedores particulares de autocaravanas y campers
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] text-forest tracking-tight">
            Vende tu camper
            <br />
            <span className="italic">sin ceder un euro.</span>
          </h1>

          <p className="mt-8 max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed font-body">
            Inspeccionamos tu vehículo, preparamos toda la presentación y te damos una ficha propia con sello verificado. Tú pones el precio. Tú cobras.
          </p>

          {/* Differentiators */}
          <div className="mt-8 space-y-3">
            {differentiators.map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-ocre mt-0.5 shrink-0" />
                <span className="text-sm md:text-base text-foreground leading-snug font-body">
                  {line}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Button variant="ocre" size="xl" asChild>
              <Link to="/registro/vendedor">Solicitar mi pack — 349 €</Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground font-body">
              Pago próximamente disponible online — escríbenos para reservar
            </p>
          </div>
        </div>

        {/* Ficha mockup — 5 cols */}
        <div className="lg:col-span-5 relative">
          <div className="bg-sand rounded-2xl p-6 md:p-8 shadow-lg border border-border">
            {/* Mockup header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                  Ficha verificada
                </p>
                <h3 className="font-display text-xl md:text-2xl font-bold text-forest mt-1">
                  Volkswagen California T6.1
                </h3>
                <p className="text-sm text-muted-foreground font-body mt-1">2021 · 45.000 km · Diésel</p>
              </div>
              <SelloRodado size="sm" />
            </div>

            {/* Mock image placeholder */}
            <div className="rounded-xl bg-forest/10 aspect-[16/10] flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-forest/5 to-forest/15" />
              <div className="relative text-center px-4">
                <span className="text-5xl">🚐</span>
                <p className="text-xs text-forest/60 mt-2 font-body font-medium">
                  Galería con +15 fotos verificadas
                </p>
              </div>
            </div>

            {/* Mock data grid */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {[
                { label: "Precio", value: "52.000 €" },
                { label: "Puntuación", value: "8.5 / 10" },
                { label: "Inspección", value: "✓ 80+ pts" },
              ].map((item) => (
                <div key={item.label} className="bg-background rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground font-body">{item.label}</p>
                  <p className="text-sm font-bold text-forest font-body mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>

            {/* Mock features */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["Sello verificado", "Informe técnico", "Datos contrastados"].map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-ocre/30 bg-ocre/10 px-3 py-1 text-xs font-medium text-ocre font-body"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-5 font-body">
              Esto es lo que recibirá el comprador al ver tu ficha
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
