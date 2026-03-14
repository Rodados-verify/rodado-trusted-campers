import { CheckCircle } from "lucide-react";

interface SelloRodadoProps {
  size?: "sm" | "md" | "lg" | "xl";
}

export const SelloRodado = ({ size = "md" }: SelloRodadoProps) => {
  const sizeMap = {
    sm: { container: "h-16 w-16", icon: "h-3 w-3", text: "text-[7px]" },
    md: { container: "h-24 w-24", icon: "h-4 w-4", text: "text-[9px]" },
    lg: { container: "h-32 w-32", icon: "h-5 w-5", text: "text-[11px]" },
    xl: { container: "h-[200px] w-[200px]", icon: "h-8 w-8", text: "text-sm" },
  };

  const s = sizeMap[size];

  return (
    <div className={`${s.container} relative flex flex-col items-center justify-center rounded-full border-[2.5px] border-ocre`}>
      {/* Inner double border */}
      <div className="absolute inset-[3px] rounded-full border-[1.5px] border-ocre/50" />
      <CheckCircle className={`${s.icon} text-ocre mb-0.5`} />
      <span className={`${s.text} font-display font-bold tracking-[0.2em] uppercase text-ocre leading-tight`}>
        Vehículo
      </span>
      <span className={`${s.text} font-display font-bold tracking-[0.2em] uppercase text-ocre leading-tight`}>
        Rodado
      </span>
    </div>
  );
};
