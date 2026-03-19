import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wrench, TrendingUp, ShieldCheck } from "lucide-react";

const benefits = [
  "Nuevos clientes sin coste de adquisición ni marketing.",
  "Ingresos recurrentes por inspecciones pre-compra (Pack Rodado).",
  "Oportunidad de reparaciones y mantenimientos sugeridos en el informe.",
  "Asóciate a la marca líder en compraventa segura de campers.",
];

export const HeroTalleres = () => (
  <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-44 lg:pb-36 overflow-hidden bg-forest text-background">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Text */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 border-t border-ocre" />
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ocre">
              Para talleres mecánicos y especialistas camper
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.08] text-sand tracking-tight">
            Más clientes.<br />
            <span className="italic text-ocre">Cero esfuerzo comercial.</span>
          </h1>

          <p className="mt-8 max-w-lg text-lg md:text-xl text-sand/80 leading-relaxed font-body">
            Únete a la red de talleres verificadores de Rodados. Recibe vehículos en tus instalaciones, realiza inspecciones estandarizadas y aumenta tu facturación en reparaciones.
          </p>

          <div className="mt-8 space-y-3">
            {benefits.map((line, i) => (
              <div key={i} className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-ocre mt-0.5 shrink-0" />
                <span className="text-sm md:text-base text-sand/90 leading-snug font-body">
                  {line}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Button variant="ocre" size="xl" asChild>
              <Link to="/registro/taller">Solicitar acceso a la red</Link>
            </Button>
            <p className="mt-3 text-xs text-sand/60 font-body">
              El proceso de validación técnica toma entre 48 y 72 horas.
            </p>
          </div>
        </div>

        {/* Visual / Image */}
        <div className="relative">
          <div className="bg-background rounded-2xl p-6 md:p-8 shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ocre/5 to-transparent" />
            <div className="relative z-10">
              <h3 className="font-display text-xl md:text-2xl font-bold text-forest mb-4">
                El flujo para tu taller
              </h3>
              
              <div className="space-y-6 mt-8">
                <div className="flex gap-4">
                  <div className="bg-ocre/20 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-ocre font-bold text-lg">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-forest text-lg">Recibes el encargo</h4>
                    <p className="text-sm text-muted-foreground mt-1">El vendedor agenda la cita contigo directamente a través de nuestra plataforma.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-ocre/20 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-ocre font-bold text-lg">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-forest text-lg">Inspección pautada</h4>
                    <p className="text-sm text-muted-foreground mt-1">Revisas los +80 puntos en nuestra app de mecánicos. Rápido y sin papeleo.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="bg-ocre/20 w-12 h-12 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-ocre font-bold text-lg">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-forest text-lg">Reparaciones extra</h4>
                    <p className="text-sm text-muted-foreground mt-1">Si hay defectos, envías tu presupuesto. El vendedor o comprador lo acepta y facturas más.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
