import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type SolicitudStatus = "pendiente" | "asignado" | "en_inspeccion" | "contenido_generado" | "publicado";

interface Step {
  key: SolicitudStatus;
  title: string;
  description: string;
}

const steps: Step[] = [
  { key: "pendiente", title: "Solicitud recibida", description: "Tu solicitud ha sido registrada correctamente" },
  { key: "asignado", title: "Taller asignado", description: "Un taller de la red ha sido asignado a tu vehículo" },
  { key: "en_inspeccion", title: "En inspección", description: "El taller está revisando tu vehículo" },
  { key: "contenido_generado", title: "Presentación lista", description: "Tu galería y ficha de venta están preparadas" },
  { key: "publicado", title: "Publicado", description: "Tu ficha está activa y lista para compartir" },
];

const statusOrder: SolicitudStatus[] = ["pendiente", "asignado", "en_inspeccion", "contenido_generado", "publicado"];

interface SolicitudStepperProps {
  currentStatus: SolicitudStatus;
  createdAt?: string;
}

const SolicitudStepper = ({ currentStatus, createdAt }: SolicitudStepperProps) => {
  const isMobile = useIsMobile();
  const currentIndex = statusOrder.indexOf(currentStatus);

  if (isMobile) {
    return (
      <div className="space-y-0">
        {steps.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isActive = i === currentIndex;
          const isPending = i > currentIndex;
          return (
            <div key={step.key} className="flex gap-4">
              {/* Vertical line + circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                    isCompleted && "border-forest bg-forest text-white",
                    isActive && "border-ocre bg-ocre text-white",
                    isPending && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn("w-0.5 flex-1 min-h-[2rem]", isCompleted ? "bg-forest" : "bg-border")} />
                )}
              </div>
              {/* Content */}
              <div className="pb-6">
                <p className={cn("text-sm font-semibold", isPending && "text-muted-foreground")}>{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                {isActive && createdAt && i === 0 && (
                  <p className="mt-1 text-xs text-ocre">
                    {new Date(createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between">
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        const isPending = i > currentIndex;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center text-center">
            {/* Top line + circle */}
            <div className="flex w-full items-center">
              {i > 0 && <div className={cn("h-0.5 flex-1", i <= currentIndex ? "bg-forest" : "bg-border")} />}
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                  isCompleted && "border-forest bg-forest text-white",
                  isActive && "border-ocre bg-ocre text-white",
                  isPending && "border-border bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              {i < steps.length - 1 && <div className={cn("h-0.5 flex-1", i < currentIndex ? "bg-forest" : "bg-border")} />}
            </div>
            <p className={cn("mt-3 text-sm font-semibold", isPending && "text-muted-foreground")}>{step.title}</p>
            <p className="mt-0.5 max-w-[140px] text-xs text-muted-foreground">{step.description}</p>
          </div>
        );
      })}
    </div>
  );
};

export default SolicitudStepper;
