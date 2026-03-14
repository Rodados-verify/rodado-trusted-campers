const steps = [
  {
    num: "01",
    title: "Cuéntanos tu camper",
    desc: "Rellenas un formulario en 5 minutos con los datos básicos del vehículo y las fotos que tengas. No hace falta que sean perfectas.",
  },
  {
    num: "02",
    title: "Un taller especializado lo inspecciona",
    desc: "Asignamos un taller verificado de la red Rodado en tu zona. El técnico inspecciona el vehículo a fondo y documenta su estado real con más de 80 puntos de revisión.",
  },
  {
    num: "03",
    title: "Preparamos tu ficha profesional",
    desc: "Con los datos del taller creamos tu ficha completa: galería cuidada, descripción detallada, datos técnicos verificados y el sello Rodado. Todo en una URL propia.",
  },
  {
    num: "04",
    title: "Compartes y vendes",
    desc: "Publicas tu ficha en Wallapop, Milanuncios, grupos de Facebook o donde quieras. El comprador llega informado. La negociación es más corta. El precio, mejor.",
  },
];

export const ComoFuncionaSection = () => (
  <section className="section-padding bg-sand" id="como-funciona">
    <div className="container">
      <h2 className="text-center font-display text-3xl md:text-4xl lg:text-5xl font-bold text-forest">
        Cuatro pasos para vender
        <br className="hidden sm:block" />
        <span className="italic text-ocre"> con confianza</span>
      </h2>

      <div className="mt-20 md:mt-28 grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
        {steps.map((step, i) => (
          <div
            key={i}
            className="relative animate-fade-up"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <span className="block font-display text-8xl md:text-9xl font-bold text-ocre/[0.07] leading-none select-none absolute -top-10 -left-2">
              {step.num}
            </span>
            <div className="relative pt-8">
              <span className="text-xs font-semibold uppercase tracking-widest text-ocre font-body">
                Paso {step.num}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold text-forest leading-snug">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed font-body">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
