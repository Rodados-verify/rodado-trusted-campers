import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SelloRodado } from "@/components/SelloRodado";

const guarantees = [
  {
    title: "Inspección técnica completa",
    desc: "Más de 80 puntos revisados por un taller especializado en campers y autocaravanas.",
  },
  {
    title: "Datos verificados",
    desc: "Toda la información técnica contrastada contra la ficha técnica oficial del vehículo.",
  },
  {
    title: "Estado real documentado",
    desc: "Fotografía profesional del estado del vehículo, incluidos desperfectos si los hubiera.",
  },
];

export const SelloSection = () => (
  <section className="section-padding bg-forest" id="sello-rodado">
    <div className="container text-center">
      <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
        El sello que genera confianza
      </h2>
      <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-primary-foreground/70 font-body leading-relaxed">
        Cuando un comprador ve el sello Rodado en tu ficha, sabe que el vehículo ha sido inspeccionado por un taller especializado, que toda la información está verificada y que puede comprar con tranquilidad.
      </p>

      {/* Large seal */}
      <div className="mt-14 md:mt-20 flex justify-center">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-ocre/20 blur-3xl scale-150" />
          <SelloRodado size="xl" />
        </div>
      </div>

      {/* Guarantee columns */}
      <div className="mt-14 md:mt-20 grid sm:grid-cols-3 gap-10 max-w-4xl mx-auto text-left">
        {guarantees.map((g, i) => (
          <div key={i}>
            <h3 className="font-display text-lg font-semibold text-primary-foreground leading-snug">
              {g.title}
            </h3>
            <p className="mt-3 text-sm text-primary-foreground/60 leading-relaxed font-body">
              {g.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <Button
          variant="outline"
          size="xl"
          className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
          asChild
        >
          <Link to="/registro/vendedor">Ver ejemplo de ficha verificada</Link>
        </Button>
      </div>
    </div>
  </section>
);
