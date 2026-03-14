import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const PrecioSection = () => (
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

      <p className="mt-8 text-base text-muted-foreground max-w-xl mx-auto font-body leading-relaxed">
        El intermediario medio cobra entre el 10 % y el 20 % del valor del vehículo. En una camper de 40.000 €, eso son entre{" "}
        <span className="font-semibold text-foreground">4.000 € y 8.000 €</span>. Nuestro servicio cuesta 349 €.
      </p>

      <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto font-body">
        El pago se habilitará próximamente online. Escríbenos para reservar tu plaza.
      </p>

      <div className="mt-10">
        <Button variant="ocre" size="xl" asChild>
          <Link to="/registro/vendedor">Quiero vender mi camper</Link>
        </Button>
      </div>
    </div>
  </section>
);
