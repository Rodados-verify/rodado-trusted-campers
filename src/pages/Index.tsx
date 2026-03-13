import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SelloRodado } from "@/components/SelloRodado";
import heroImage from "@/assets/hero-camper.jpg";
import tallerImage from "@/assets/taller-workshop.jpg";

const steps = [
  {
    num: "01",
    title: "Cuéntanos tu vehículo",
    desc: "Rellenas un formulario con los datos de tu camper y nos envías las fotos que tengas.",
  },
  {
    num: "02",
    title: "Un taller de la red lo revisa",
    desc: "Un taller especializado en tu zona inspecciona el vehículo y documenta su estado real con un informe completo.",
  },
  {
    num: "03",
    title: "Preparamos tu presentación",
    desc: "Creamos una galería cuidada, una descripción detallada y una ficha propia con toda la información que necesita un comprador serio.",
  },
  {
    num: "04",
    title: "Publicas y vendes",
    desc: "Compartes tu ficha en cualquier plataforma. El comprador llega informado, el proceso es más corto y el precio, mejor.",
  },
];

const packItems = [
  {
    num: "01",
    title: "Inspección técnica completa",
    desc: "Un técnico especializado revisa más de 80 puntos del vehículo — mecánica, habitáculo, instalaciones eléctricas, gas, agua y estructura.",
  },
  {
    num: "02",
    title: "Informe de estado documentado",
    desc: "Recibes un informe detallado con el estado real del vehículo, fotos del proceso y observaciones técnicas.",
  },
  {
    num: "03",
    title: "Sello Rodado verificado",
    desc: "Tu ficha lleva el sello de vehículo inspeccionado por la red Rodado, lo que genera confianza inmediata en el comprador.",
  },
  {
    num: "04",
    title: "Galería cuidada del vehículo",
    desc: "Seleccionamos y procesamos las mejores imágenes para que el vehículo se vea exactamente como es, con luz y encuadre adecuados.",
  },
  {
    num: "05",
    title: "Ficha propia enlazable",
    desc: "Una URL única con toda la información del vehículo, lista para compartir en Wallapop, Milanuncios, grupos de Facebook o donde quieras.",
  },
  {
    num: "06",
    title: "Transporte a domicilio opcional",
    desc: "Si el comprador es de otra ciudad, nos encargamos de llevarlo hasta su puerta.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-44 lg:pb-36 overflow-hidden">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Text — 7 cols */}
            <div className="lg:col-span-7 relative z-10">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.08] text-forest tracking-tight">
                Vende tu camper
                <br />
                <span className="italic text-ocre">como merece</span>
                <br />
                ser vendido.
              </h1>
              <p className="mt-8 max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed">
                Inspección profesional, presentación de nivel y tu propia ficha de venta. Todo incluido, sin ceder ni un euro a los intermediarios.
              </p>

              {/* Pills */}
              <div className="mt-8 flex flex-wrap gap-3">
                {["Inspección verificada", "Ficha profesional", "Entrega a domicilio opcional"].map(
                  (pill) => (
                    <span
                      key={pill}
                      className="inline-flex items-center rounded-full border border-border bg-sand/50 px-4 py-2 text-sm font-medium text-foreground"
                    >
                      {pill}
                    </span>
                  )
                )}
              </div>

              <div className="mt-10">
                <Button variant="ocre" size="xl" asChild>
                  <Link to="/registro/vendedor">Solicitar mi pack — 349 €</Link>
                </Button>
              </div>
            </div>

            {/* Image — 5 cols */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3]">
                <img
                  src={heroImage}
                  alt="Camper en paisaje natural"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest/30 to-transparent" />
              </div>
              {/* Sello floating */}
              <div className="absolute -bottom-6 -left-6 hidden lg:block">
                <SelloRodado size="md" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── EL PROBLEMA ─── */}
      <section className="bg-sand section-padding">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-forest">
                ¿Cuánto estás perdiendo por vender mal tu camper?
              </h2>
              <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-lg">
                Los compradores comparan. La primera impresión en el anuncio lo decide todo. Sin una presentación profesional se pierden entre 2.000 y 5.000 € de margen, o semanas de espera sin respuestas serias.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Sin Rodado */}
              <div className="rounded-xl border border-border bg-background p-6 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Sin Rodado
                </span>
                <div className="w-8 border-t border-border" />
                <ul className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <li>Texto plano sin estructura</li>
                  <li>Fotos hechas con el móvil</li>
                  <li>Precio estimado a ojo</li>
                  <li>Semanas sin respuesta seria</li>
                </ul>
              </div>

              {/* Con Rodado */}
              <div className="rounded-xl border-2 border-ocre bg-background p-6 space-y-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-ocre">
                  Con Rodado
                </span>
                <div className="w-8 border-t border-ocre/40" />
                <ul className="space-y-3 text-sm text-foreground leading-relaxed">
                  <li>Inspección técnica documentada</li>
                  <li>Galería profesional del vehículo</li>
                  <li>Ficha propia con sello Rodado</li>
                  <li>Confianza inmediata para el comprador</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CÓMO FUNCIONA ─── */}
      <section className="section-padding bg-background" id="como-funciona">
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
                {/* Big decorative number */}
                <span className="block font-display text-8xl md:text-9xl font-bold text-ocre/[0.07] leading-none select-none absolute -top-10 -left-2">
                  {step.num}
                </span>
                <div className="relative pt-8">
                  <span className="text-xs font-semibold uppercase tracking-widest text-ocre">
                    Paso {step.num}
                  </span>
                  <h3 className="mt-2 font-display text-xl font-semibold text-forest leading-snug">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── QUÉ INCLUYE ─── */}
      <section className="bg-forest section-padding">
        <div className="container">
          <h2 className="text-center font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Todo lo que necesitas
            <br className="hidden sm:block" />
            para vender bien
          </h2>

          <div className="mt-20 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
            {packItems.map((item, i) => (
              <div key={i} className="group">
                <span className="text-sm font-semibold text-ocre">{item.num}</span>
                <h3 className="mt-2 font-display text-lg font-semibold text-white leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRECIO ─── */}
      <section className="bg-sand section-padding">
        <div className="container text-center">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-forest">
            Un pack. Un precio.
            <br />
            <span className="italic">Sin sorpresas.</span>
          </h2>

          <p className="mt-12 font-display text-7xl md:text-8xl lg:text-9xl font-bold text-ocre tracking-tight">
            349 €
          </p>

          <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto">
            El pago se habilitará próximamente online. Escríbenos para reservar tu plaza.
          </p>

          <div className="mt-10">
            <Button variant="ocre" size="xl" asChild>
              <Link to="/registro/vendedor">Quiero vender mi camper</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─── TALLERES ─── */}
      <section className="section-padding bg-background" id="talleres">
        <div className="container">
          <div className="relative border-l-[6px] border-forest pl-10 md:pl-16">
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
              {/* Text — 7 cols */}
              <div className="lg:col-span-7">
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-forest leading-tight">
                  ¿Tienes un taller especializado en campers o autocaravanas?
                </h2>
                <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-xl">
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
                      <p className="text-base font-medium text-foreground">{point}</p>
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
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
