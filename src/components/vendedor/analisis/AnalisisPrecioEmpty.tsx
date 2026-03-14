import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  precioVenta: number | null;
  onAnalyze: () => void;
}

const AnalisisPrecioEmpty = ({ precioVenta, onAnalyze }: Props) => (
  <div className="mx-auto max-w-lg text-center py-16">
    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-ocre/10">
      <TrendingUp className="h-8 w-8 text-ocre" />
    </div>
    <h1 className="font-display text-3xl font-bold text-foreground">
      ¿Tu precio está en el mercado?
    </h1>
    <p className="mt-4 text-muted-foreground">
      Analizamos vehículos similares en Milanuncios, Wallapop y Coches.net para decirte si tu precio de venta está bien situado, es demasiado alto o tienes margen para pedir más.
    </p>
    {precioVenta && (
      <p className="mt-6 text-4xl font-bold text-foreground">
        {precioVenta.toLocaleString("es-ES")} €
      </p>
    )}
    <Button variant="ocre" size="lg" className="mt-8" onClick={onAnalyze}>
      Analizar mi precio ahora
    </Button>
  </div>
);

export default AnalisisPrecioEmpty;
