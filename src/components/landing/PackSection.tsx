const packItems = [
  {
    num: "01",
    title: "Inspección técnica de +80 puntos",
    desc: "Mecánica, habitáculo, instalaciones eléctricas, gas, agua y estructura. Realizada por taller especializado en campers.",
  },
  {
    num: "02",
    title: "Informe de estado documentado",
    desc: "Cada punto revisado queda registrado con observaciones del técnico. Disponible para descargar y compartir.",
  },
  {
    num: "03",
    title: "Sello Rodado verificado",
    desc: "El distintivo que diferencia tu anuncio de todos los demás y genera confianza inmediata en el comprador.",
  },
  {
    num: "04",
    title: "Galería cuidada del vehículo",
    desc: "Protocolo de fotografía con más de 15 tomas estándar para mostrar el vehículo exactamente como es.",
  },
  {
    num: "05",
    title: "Ficha propia enlazable",
    desc: "URL única con toda la información, lista para compartir en cualquier plataforma de compraventa.",
  },
  {
    num: "06",
    title: "Transporte a domicilio opcional",
    desc: "Si el comprador es de otra ciudad, gestionamos el traslado del vehículo hasta su puerta.",
  },
];

export const PackSection = () => (
  <section className="bg-forest section-padding">
    <div className="container">
      <h2 className="text-center font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground">
        Todo lo que necesitas
        <br className="hidden sm:block" />
        para vender bien
      </h2>

      <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
        {packItems.map((item, i) => (
          <div key={i} className="group">
            <span className="text-sm font-semibold text-ocre font-body">{item.num}</span>
            <h3 className="mt-2 font-display text-lg font-semibold text-primary-foreground leading-snug">
              {item.title}
            </h3>
            <p className="mt-3 text-sm text-primary-foreground/60 leading-relaxed font-body">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
