import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, Shield, TrendingUp, AlertTriangle, Star, Check, Globe, Bot, ShieldCheck } from "lucide-react";
import { SelloRodado } from "@/components/SelloRodado";

const LandingVendedores = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-ocre/20">
      <Navbar />
      
      {/* 1. HERO - Value Proposition & Friction Reduction */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-forest/5 via-background to-background" />
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ocre/10 border border-ocre/20 text-ocre text-sm font-medium mb-8 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ocre opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-ocre"></span>
              </span>
              Plazas limitadas para inspección esta semana
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold text-forest leading-[1.05] tracking-tight mb-6">
              No malvendas tu camper. <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-ocre to-amber-600">
                Véndela por lo que vale.
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-body max-w-2xl mx-auto mb-10 leading-relaxed">
              Los concesionarios se quedan hasta 4.000€ de tu margen. Rodado te da las herramientas de un profesional para vender directamente al comprador, más rápido y al mejor precio.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="xl" variant="ocre" className="w-full sm:w-auto text-lg px-8 h-14 shadow-xl shadow-ocre/20 hover:scale-105 transition-transform" asChild>
                <Link to="/registro/vendedor">Obtener Sello Rodado por 499€</Link>
              </Button>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                Pago 100% seguro. Sin comisiones sorpresa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. LOSS AVERSION - Cognitive Bias */}
      <section className="py-20 bg-forest text-sand">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-4xl font-bold mb-6">
                Vender a un profesional es <span className="text-ocre">perder dinero</span>.
              </h2>
              <p className="text-lg opacity-80 mb-8 font-body leading-relaxed">
                El modelo tradicional está roto. Los compraventas te ofrecen un precio bajísimo porque necesitan margen. Si vendes por tu cuenta en wallapop sin certificar, atraes a compradores desconfiados que solo quieren regatear.
              </p>
              
              <div className="space-y-4">
                <div className="flex bg-background/5 p-4 rounded-xl border border-white/10 items-start gap-4">
                  <AlertTriangle className="text-red-400 w-6 h-6 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold">El "Regateo Agresivo"</h4>
                    <p className="text-sm opacity-70">Sin una auditoría técnica externa, tu comprador siempre inventará fallos para bajar tu precio.</p>
                  </div>
                </div>
                
                <div className="flex bg-background/5 p-4 rounded-xl border border-white/10 items-start gap-4">
                  <TrendingUp className="text-red-400 w-6 h-6 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold">Pérdida de margen</h4>
                    <p className="text-sm opacity-70">Un concesionario promedio recorta un 20% del valor real de mercado de tu autocaravana.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-sand text-forest p-8 rounded-2xl shadow-2xl relative z-10">
                <div className="absolute -top-4 -right-4 bg-ocre text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg transform rotate-3">
                  La solución Rodado
                </div>
                <h3 className="font-display font-bold text-2xl mb-6">El efecto: Transparencia</h3>
                <ul className="space-y-4">
                  {[
                    "Un informe técnico oficial elimina cualquier duda del comprador.",
                    "Fotos profesionales que enamoran a primera vista.",
                    "Sello Verificado que justifica tu precio de venta.",
                    "Ganas fuerza en la negociación. Se acabaron las excusas."
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3 items-start">
                      <CheckCircle className="text-ocre w-5 h-5 shrink-0 mt-0.5" />
                      <span className="font-medium font-body opacity-90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 THE PRO SUITE - Not just a seal */}
      <section className="py-24 bg-background border-t border-border/50">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold text-forest mb-4">Mucho más que un sello verificado.</h2>
            <p className="text-muted-foreground font-body text-lg">Tu cuenta de vendedor incluye un panel completo con herramientas dignas de un concesionario profesional y un roadmap de hipervelocidad.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-forest text-sand p-8 rounded-3xl relative overflow-hidden group shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-ocre/20 blur-3xl rounded-full" />
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 relative z-10">
                <Globe className="text-ocre w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl mb-3 relative z-10">Web Profesional Propia (Hoy)</h3>
              <p className="text-sand/80 text-sm leading-relaxed relative z-10">Te generamos una Landing Page exclusiva y profesional de tu vehículo. Perfecta para compartir el enlace en estados de WhatsApp, Facebook y responder a foros.</p>
            </div>

            <div className="bg-sand/30 border border-ocre/20 p-8 rounded-3xl relative overflow-hidden group hover:bg-sand/50 transition-colors">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <TrendingUp className="text-ocre w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-forest mb-3">Análisis de Precio IA (Hoy)</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Nuestra IA rastrea cientos de anuncios reales en Wallapop y Milanuncios diarios para decirte exactamente a qué precio debes publicar para vender rápido de verdad.</p>
            </div>

            <div className="bg-sand/30 border border-ocre/20 p-8 rounded-3xl relative overflow-hidden group hover:bg-sand/50 transition-colors">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <Star className="text-ocre w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-forest mb-3">Kit de Anuncios Mágico (Hoy)</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Olvídate de pensar textos persuasivos. Te generamos las descripciones perfectas para cada plataforma de venta y te blindamos las fotos con nuestra marca de agua.</p>
            </div>

            <div className="bg-sand/30 border border-ocre/20 p-8 rounded-3xl relative overflow-hidden group hover:bg-sand/50 transition-colors">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6">
                <Shield className="text-ocre w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-forest mb-3">Documentación Legal (Hoy)</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Se acabó el miedo al papeleo tramposo. Generamos tu contrato de compraventa y los recibos de señal en PDF en un solo clic, 100% legal y blindado para ambas partes.</p>
            </div>

            <div className="bg-background border-2 border-dashed border-border p-8 rounded-3xl relative overflow-hidden opacity-80">
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-ocre bg-ocre/10 px-2 py-1 rounded">Próximamente</span>
              <div className="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center mb-6">
                <Bot className="text-muted-foreground w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-muted-foreground mb-3">Filtro Anti-mareantes IA</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Un Bot entrenado con tu furgoneta contestará automáticamente por WhatsApp a las dudas técnicas y solo gestionará visitas de personas realmente cualificadas.</p>
            </div>

            <div className="bg-background border-2 border-dashed border-border p-8 rounded-3xl relative overflow-hidden opacity-80">
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest text-ocre bg-ocre/10 px-2 py-1 rounded">Próximamente</span>
              <div className="w-12 h-12 bg-background border border-border rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-muted-foreground w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl text-muted-foreground mb-3">Reserva Escrow y Transporte</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Ofrece transporte nacional al comprador final y el pago será custodiado en cuenta segura hasta la entrega para eliminar la fricción del pago a un desconocido.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF - Testimonials */}
      <section className="py-24 bg-[#F2EFE9]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold text-forest mb-4">Ventas récord en menos de 15 días</h2>
            <p className="text-muted-foreground font-body text-lg">Únete a los más de 300 particulares que han vendido su vehículo sin ceder ni un céntimo de su margen de beneficio.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Carlos M.",
                modelo: "Volkswagen California T6",
                tiempo: "Vendida en 8 días",
                text: "Me querían dar 42.000€ en el concesionario. Contraté Rodado, la llevé al taller asociado de mi zona al día siguiente y la acabé vendiendo a un particular por 48.500€. Los 499€ mejor invertidos de mi vida."
              },
              {
                name: "Laura y Dani",
                modelo: "Fiat Ducato Benimar",
                tiempo: "Vendida en 12 días",
                text: "Habíamos intentado venderla en Milanuncios durante semanas pero solo atraíamos mareantes que querían bajar el precio 5.000€. Con el Sello Rodado y la ficha verificada, el segundo que la vio la reservó. Cero regateo."
              },
              {
                name: "Marcos T.",
                modelo: "Mercedes Marco Polo",
                tiempo: "Vendida en 5 días",
                text: "Aporto confianza de profesional vendiendo como particular. El informe de 80 puntos dejó al comprador súper tranquilo. El proceso es comodísimo, el taller asociado me pillaba a solo 10 minutos."
              }
            ].map((review, i) => (
              <div key={i} className="bg-background rounded-2xl p-6 shadow-sm border border-black/5 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4 text-ocre">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="font-body text-foreground opacity-90 leading-relaxed mb-6 italic">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest/10 flex items-center justify-center text-forest font-bold">
                    {review.name[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">{review.name}</h4>
                    <p className="text-xs text-muted-foreground">{review.modelo} · <span className="text-ocre font-medium">{review.tiempo}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. AUTHORITY & EASE OF USE - How it works */}
      <section className="py-24">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="mx-auto lg:mx-0 shadow-2xl shadow-ocre/20 rounded-full w-fit">
                <SelloRodado size="lg" />
              </div>
            </div>
            
            <div className="flex-1 space-y-8">
              <h2 className="font-display text-4xl font-bold text-forest">Sube tu furgoneta al siguiente nivel en 3 pasos.</h2>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {[
                  { title: "Reserva tu Pack", desc: "Abona el pago único de 499€ para asegurar tu auditoría." },
                  { title: "Inspección en Taller Oficial", desc: "Acudes al taller certificado Rodado más cercano para revisar minuciosamente más de 80 puntos estructurales y mecánicos de tu camper." },
                  { title: "Recibe tu ficha y ¡a vender!", desc: "Te entregamos tu URL verificada, un dosier para enviar por WhatsApp y un reportaje fotográfico." }
                ].map((step, k) => (
                  <div key={k} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-ocre text-white font-bold z-10 shrink-0">
                      {k + 1}
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-background shadow-sm ml-4 md:ml-0 md:group-odd:mr-8 md:group-even:ml-8">
                      <h4 className="font-bold text-forest">{step.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA - Urgency */}
      <section className="py-24 bg-forest text-sand text-center">
        <div className="container max-w-3xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6">Toma el control de tu venta hoy.</h2>
          <p className="text-lg opacity-80 mb-10 font-body">Tu furgoneta es una inversión. Asegúrate de recuperar cada euro que vale. Empezar es tan fácil como agendar tu cita.</p>
          <Button size="xl" variant="ocre" className="w-full sm:w-auto text-lg px-12 h-16 shadow-2xl hover:scale-105 transition-all text-white" asChild>
            <Link to="/registro/vendedor">Comenzar mi proceso — 499€</Link>
          </Button>
          <div className="flex justify-center flex-wrap gap-6 mt-8 p-4 opacity-70">
            <span className="flex items-center gap-2 text-sm"><Check className="w-4 h-4"/> Pago único</span>
            <span className="flex items-center gap-2 text-sm"><Check className="w-4 h-4"/> Fotógrafo profesional incluido</span>
            <span className="flex items-center gap-2 text-sm"><Check className="w-4 h-4"/> Sin permanencia</span>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LandingVendedores;
