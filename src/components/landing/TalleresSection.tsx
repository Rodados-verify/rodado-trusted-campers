import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import tallerImage from "@/assets/taller-workshop.jpg";

export const TalleresSection = () => (
  <section className="section-padding bg-background" id="talleres">
    <div className="container">
      <div className="relative border-l-[6px] border-forest pl-10 md:pl-16">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Text — 7 cols */}
          <div className="lg:col-span-7">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-forest leading-tight">
              ¿Tienes un taller especializado en campers o autocaravanas?
            </h2>
            <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-xl font-body">
              Buscamos talleres en toda España para formar parte de la red Rodado. Recibirás encargos de inspección en tu zona con toda la información del vehículo, un proceso guiado paso a paso y el pago directo por cada trabajo completado. Sin captación, sin comerciales, sin inversión.
            </p>

            {/* Value points */}
            <div className="mt-10 space-y-6">
              {[
                "Encargos en tu zona sin esfuerzo comercial",
                "Proceso digital completo: recibes, inspeccionas, reportas y cobras",
                "Tú decides cuántos encargos aceptas cada mes",
              ].map((point, i) => (
                <div key={i}>
                  <p className="text-base font-medium text-foreground font-body">{point}</p>
                  {i < 2 && <div className="mt-6 w-full border-t border-border" />}
                </div>
              ))}
            </div>

            <div className="mt-12">
              <Button variant="forest-outline" size="xl" asChild>
                <Link to="/registro/taller">Solicitar unirme a la red</Link>
              </Button>
            </div>
          </div>

          {/* Image — 5 cols */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden aspect-[4/5]">
              <img
                src={tallerImage}
                alt="Taller inspeccionando autocaravana"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
