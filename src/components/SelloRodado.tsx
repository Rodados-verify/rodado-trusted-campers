import { CheckCircle } from "lucide-react";

export const SelloRodado = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "h-16 w-16 text-[8px]",
    md: "h-24 w-24 text-[10px]",
    lg: "h-32 w-32 text-xs",
  };

  return (
    <div
      className={`${sizeClasses[size]} relative flex flex-col items-center justify-center rounded-full border-2 border-ocre`}
      style={{ boxShadow: "inset 0 0 0 3px transparent, 0 0 0 1px hsl(var(--ocre) / 0.3)" }}
    >
      <div className="absolute inset-1 rounded-full border border-ocre/40" />
      <CheckCircle className="h-3.5 w-3.5 text-ocre mb-0.5" />
      <span className="font-display font-bold tracking-widest uppercase text-ocre leading-tight">
        Vehículo
      </span>
      <span className="font-display font-bold tracking-widest uppercase text-ocre leading-tight">
        Rodado
      </span>
    </div>
  );
};
