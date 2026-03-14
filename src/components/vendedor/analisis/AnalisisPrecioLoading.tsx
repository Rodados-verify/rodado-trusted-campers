import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const messages = [
  "Buscando vehículos similares en el mercado...",
  "Analizando precios...",
  "Preparando tu informe...",
];

const AnalisisPrecioLoading = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Loader2 className="h-10 w-10 animate-spin text-ocre" />
      <p className="mt-6 text-lg font-medium text-foreground animate-pulse">
        {messages[msgIndex]}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Esto puede tardar hasta 2 minutos
      </p>
    </div>
  );
};

export default AnalisisPrecioLoading;
