import { MapPin, Eye, Truck } from "lucide-react";
import { SelloRodado } from "@/components/SelloRodado";

const valuePoints = [
  {
    icon: MapPin,
    title: "Amplía tu mercado potencial",
    desc: "Un vendedor sin ficha verificada solo atrae compradores de su zona — nadie viaja 500 km a ver un vehículo sin tener mucha confianza. Con el sello Rodado y una ficha completa, cualquier comprador de España puede tomar la decisión antes de desplazarse.",
  },
  {
    icon: Eye,
    title: "Reduce las visitas que no van a ningún lado",
    desc: "Sin información detallada, recibes llamadas de curiosos, gente que negocia sin intención real de comprar y visitas que se caen en el último momento. Con una ficha completa el comprador ya sabe exactamente lo que hay — solo viene si de verdad le interesa.",
  },
  {
    icon: Truck,
    title: "El transporte lo resolvemos nosotros",
    desc: "Si el comprador es de otra ciudad, gestionamos el traslado del vehículo hasta su puerta. El comprador no tiene que viajar. Tú no tienes que coordinarlo. La venta se cierra igualmente.",
  },
];

export const AlcanceSection = () => (
  <section className="section-padding bg-background">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Left — text */}
        <div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-forest leading-[1.12]">
            Tu camper puede interesar a alguien en Sevilla, en Barcelona o en Bilbao.
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted-foreground font-body leading-relaxed max-w-lg">
            Sin una ficha completa y verificada, ese comprador nunca se va a mover. Con Rodado, llega informado, con confianza y listo para decidir.
          </p>

          <div className="mt-10 space-y-0 divide-y divide-border">
            {valuePoints.map((vp, i) => (
              <div key={i} className="py-6 first:pt-0 last:pb-0">
                <div className="flex items-start gap-3">
                  <vp.icon className="h-5 w-5 text-ocre mt-0.5 shrink-0" />
                  <div>
                    <h3 className="font-display text-lg font-semibold text-forest leading-snug">
                      {vp.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground font-body leading-relaxed">
                      {vp.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visual card */}
        <div className="flex justify-center lg:justify-end lg:pt-8">
          <div className="bg-sand rounded-2xl p-6 md:p-8 shadow-lg border border-border max-w-sm w-full">
            <div className="flex items-center justify-between mb-5">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground font-body">
                Actividad de tu ficha
              </span>
              <SelloRodado size="sm" />
            </div>

            <div className="space-y-4">
              {/* Card row 1 */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-forest font-body">Comprador interesado</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">Barcelona · 650 km</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-ocre/10 border border-ocre/30 px-2.5 py-0.5 text-[10px] font-semibold text-ocre">
                    Nuevo
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-2">Ficha consultada 3 veces</p>
              </div>

              {/* Card row 2 */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-forest font-body">Solicitud de transporte</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">Sevilla · 420 km</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-forest/10 border border-forest/30 px-2.5 py-0.5 text-[10px] font-semibold text-forest">
                    Recibida
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-2">Transporte presupuestado</p>
              </div>

              {/* Card row 3 */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-forest font-body">Comprador verificado</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">Bilbao · 390 km</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-ocre/10 border border-ocre/30 px-2.5 py-0.5 text-[10px] font-semibold text-ocre">
                    Contacto
                  </span>
                </div>
                <p className="text-xs text-muted-foreground font-body mt-2">Descargó informe completo</p>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground text-center mt-5 font-body">
              Tu ficha trabaja por ti en toda España
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
