import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MapPin, Users, Wrench, ArrowRight, CheckCircle2, Zap } from "lucide-react";

const LandingTalleres = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-forest text-sand selection:bg-ocre/20 font-body">
      <Navbar />

      {/* 1. HERO - Scarcity & Exclusivity */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-200 text-sm font-medium mb-8">
              <MapPin className="w-4 h-4" />
              Exclusividad local: Solo certificamos 1 taller por código postal.
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.05] tracking-tight mb-6">
              El marketing automotriz <span className="text-ocre italic">ha muerto.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-sand/80 max-w-2xl mx-auto mb-10 leading-relaxed">
              Rodado envía clientes pre-calificados directamente a tu elevador. Conviértete en nuestro taller oficial para realizar inspecciones pre-compra <strong className="text-ocre">pagadas desde el primer día</strong>, sin invertir un euro en publicidad ni pagar comisiones.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="xl" variant="ocre" className="w-full sm:w-auto text-lg px-8 h-14 shadow-xl shadow-ocre/20 hover:scale-105 transition-all text-white" asChild>
                <Link to="/registro/taller">Comprobar disponibilidad en tu zona</Link>
              </Button>
            </div>
            <p className="text-sm mt-5 text-sand/50">Proceso de certificación 100% gratuito. Sin cuotas mensuales.</p>
          </div>
        </div>
      </section>

      {/* 2. FRAMING & LOSS AVERSION */}
      <section className="py-24 bg-background text-foreground">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Visual Bento Box */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-forest/5 p-6 rounded-3xl border border-black/5 flex flex-col justify-center items-center text-center">
                <Users className="w-10 h-10 text-ocre mb-4" />
                <h3 className="font-bold text-3xl text-forest">Pagadas</h3>
                <p className="text-sm text-muted-foreground mt-2">Cobro garantizado por cada revisión de 80 puntos realizada.</p>
              </div>
              
              <div className="bg-ocre/10 p-6 rounded-3xl border border-ocre/20 flex flex-col justify-center items-center text-center">
                <Wrench className="w-10 h-10 text-forest mb-4" />
                <h3 className="font-bold text-3xl text-forest">+35%</h3>
                <p className="text-sm text-muted-foreground mt-2">Conversión a reparación post-inspección</p>
              </div>
              
              <div className="col-span-2 bg-gradient-to-br from-forest to-[#142921] p-8 rounded-3xl text-sand shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-ocre/20 blur-3xl rounded-full" />
                <h3 className="font-display font-bold text-2xl mb-2 relative z-10">La furgoneta del vecino.</h3>
                <p className="text-sand/80 relative z-10">
                  Si rechazas ser el Taller Oficial Rodado de tu barrio, tu competidor más cercano recibirá a todos los clientes de camper de la zona. Es matemática pura.
                </p>
              </div>
            </div>

            {/* Content */}
            <div>
              <h2 className="font-display text-4xl font-bold text-forest mb-6">
                Te traemos clientes que ya tienen la billetera en la mano.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Cuando un vendedor contrata el Sello Rodado, el sistema busca automáticamente el taller certificado más cercano y agenda la cita de inspección. 
                <br/><br/>
                No tienes que buscar al cliente, el cliente viene a ti con la orden prepagada.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Inspecciones estandarizadas desde tu móvil en 45 min",
                  "Cobras tu tarifa base garantizada por cada inspección pre-compra realizada",
                  "Cero comisiones ni suscripciones: nosotros le cobramos el pack al vendedor particular",
                  "Si el vehículo necesita arreglos para pasar la certificación, el presupuesto lo pasas tú"
                ].map((item, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <CheckCircle2 className="text-ocre w-6 h-6 shrink-0" />
                    <span className="font-medium text-foreground opacity-90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SOCIAL PROOF */}
      <section className="py-24 bg-forest text-sand">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-bold text-white mb-4">Talleres que ya están ganando</h2>
            <p className="text-sand/70">La red Rodado crece día a día. Mira lo que dicen nuestros partners.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm relative">
              <Zap className="absolute top-8 right-8 text-ocre opacity-20 w-12 h-12" />
              <p className="text-lg italic mb-6">"Entramos por curiosidad y ahora recibimos de 3 a 4 furgonetas semanales. Lo mejor es que en el 40% de los casos, les hacemos el cambio de aceite y filtros antes de que las vendan."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ocre/20 rounded-full flex items-center justify-center font-bold text-ocre">MG</div>
                <div>
                  <h4 className="font-bold text-white">Mecánica Gómez</h4>
                  <p className="text-sm text-sand/60">Madrid Sur (Código 28045) · Partner desde hace 6 meses</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-sm relative">
              <Zap className="absolute top-8 right-8 text-ocre opacity-20 w-12 h-12" />
              <p className="text-lg italic mb-6">"El software de revisión es ridículamente fácil de usar. Vas marcando el estado de frenos, chasis y motor desde la tablet. Nos lleva 40 minutos y es flujo limpio de caja."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-ocre/20 rounded-full flex items-center justify-center font-bold text-ocre">TC</div>
                <div>
                  <h4 className="font-bold text-white">Talleres Costas</h4>
                  <p className="text-sm text-sand/60">Valencia (Código 46020) · Partner desde hace 1 año</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CTA FINAL - Micro commitments */}
      <section className="py-24 bg-background text-center">
        <div className="container max-w-2xl">
          <h2 className="font-display text-4xl font-bold text-forest mb-6">¿Tu código postal está libre?</h2>
          <p className="text-lg text-muted-foreground mb-10">Rellena el formulario en 2 minutos. Revisaremos tus instalaciones y credenciales en 48 horas. Si pasas el corte, mañana mismo podrías recibir tu primer encargo.</p>
          
          <Button size="xl" variant="ocre" className="w-full sm:w-auto text-lg px-12 h-16 shadow-2xl hover:scale-105 transition-all text-white group" asChild>
            <Link to="/registro/taller" className="flex items-center gap-2">
              Solicitar mi plaza exclusiva
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingTalleres;
