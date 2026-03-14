export const ProblemaSection = () => (
  <section className="section-padding bg-background">
    <div className="container">
      <h2 className="text-center font-display text-3xl md:text-4xl lg:text-5xl font-bold text-forest">
        ¿Cuánto estás perdiendo
        <br className="hidden sm:block" />
        por vender mal tu camper?
      </h2>

      <div className="mt-16 md:mt-20 grid md:grid-cols-2 gap-12 md:gap-16 max-w-4xl mx-auto">
        <div>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-body">
            Si vendes a Clicars, Autohero o cualquier intermediario, puedes perder entre{" "}
            <span className="font-semibold text-foreground">5.000 y 15.000 €</span> respecto al precio de mercado.
            Si vendes tú mismo sin una presentación profesional, puedes tardar meses y acabar bajando el precio igualmente.
          </p>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-body mt-4">
            Y si vendes por tu cuenta sin preparación, el problema no es solo el precio — es el tiempo. Coordinar visitas, responder las mismas preguntas una y otra vez, recibir ofertas de gente que ni siquiera ha visto el vehículo bien. Semanas o meses perdidos.
          </p>
        </div>
        <div>
          <p className="text-base md:text-lg text-foreground leading-relaxed font-body">
            Rodado te da la presentación de un profesional sin que cedas el vehículo ni el margen.
            Inspeccionamos, documentamos, fotografiamos y publicamos tu ficha.{" "}
            <span className="font-semibold text-forest">
              El comprador llega informado y con confianza. La venta se cierra antes y al precio que merece.
            </span>
          </p>
        </div>
      </div>
    </div>
  </section>
);
