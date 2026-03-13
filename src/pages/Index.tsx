import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BadgeRodado } from "@/components/BadgeRodado";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  ClipboardCheck,
  Wrench,
  Sparkles,
  Share2,
  Shield,
  Camera,
  FileText,
  Tag,
  Truck,
  Star,
  Users,
  Zap,
  Monitor,
} from "lucide-react";

const steps = [
  { icon: ClipboardCheck, title: "Solicitas", desc: "Rellenas el formulario con los datos de tu vehículo." },
  { icon: Wrench, title: "Taller inspecciona", desc: "Un taller verificado de la red Rodado lo revisa." },
  { icon: Sparkles, title: "Generamos tu contenido", desc: "Fotos procesadas, descripción con IA y ficha propia." },
  { icon: Share2, title: "Publicas y vendes", desc: "Comparte tu ficha en cualquier plataforma." },
];

const packItems = [
  { icon: Wrench, title: "Inspección técnica", desc: "Revisión profesional por taller verificado" },
  { icon: Shield, title: "Sello Rodado", desc: "Garantía de confianza para compradores" },
  { icon: Camera, title: "Fotos procesadas", desc: "Imágenes optimizadas para la venta" },
  { icon: FileText, title: "Descripción generada", desc: "Texto profesional creado con IA" },
  { icon: Tag, title: "Ficha propia", desc: "URL única para compartir en cualquier portal" },
  { icon: Truck, title: "Transporte opcional", desc: "Llevamos tu camper al taller más cercano" },
];

const tallerBenefits = [
  { icon: Star, title: "Ingresos extra sin inversión", desc: "Recibe encargos de inspección pagados sin coste inicial" },
  { icon: Users, title: "Clientes nuevos en tu zona", desc: "Accede a vendedores que necesitan inspección cerca de ti" },
  { icon: Monitor, title: "Proceso guiado y digital", desc: "Todo el flujo es online: recibe, inspecciona, reporta" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Vendedores */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <BadgeRodado />
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Vende tu camper como un profesional.{" "}
              <span className="text-secondary">Sin intermediarios.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Obtén inspección técnica verificada, contenido generado con IA y tu propia ficha de
              venta enlazable desde cualquier plataforma.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link to="/registro/vendedor">Quiero vender mi camper</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative gradient */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-1/3 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-secondary/20 blur-3xl" />
        </div>
      </section>

      {/* Steps */}
      <section className="bg-muted/50 py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            Cómo funciona
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="animate-fade-in text-center"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-6 w-6" />
                </div>
                <p className="mt-1 text-xs font-semibold text-secondary">Paso {i + 1}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pack includes */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
            Qué incluye el pack
          </h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {packItems.map((item, i) => (
              <div
                key={i}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-secondary/40 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Price */}
      <section className="bg-primary py-20">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl">
            Todo esto por
          </h2>
          <p className="mt-6 font-display text-6xl font-bold text-secondary md:text-7xl">349 €</p>
          <p className="mt-4 text-sm text-primary-foreground/60">
            Pago próximamente disponible online — contacta para reservar tu plaza
          </p>
          <div className="mt-8">
            <Button variant="hero" size="xl" asChild>
              <Link to="/registro/vendedor">Quiero vender mi camper</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Talleres */}
      <section className="py-20" id="talleres">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 flex justify-center">
              <Zap className="h-8 w-8 text-secondary" />
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Forma parte de la red Rodado
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Recibe encargos de inspección en tu zona sin esfuerzo comercial. Tú solo inspeccionas y
              reportas.
            </p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {tallerBenefits.map((b, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <b.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/registro/taller">Unirme como taller verificado</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
