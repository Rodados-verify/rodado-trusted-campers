interface Props {
  precioMin: number;
  precioMax: number;
  precioMedio: number;
  precioVendedor: number;
  precioRecomendadoMin: number;
  precioRecomendadoMax: number;
}

const PriceRangeChart = ({
  precioMin,
  precioMax,
  precioMedio,
  precioVendedor,
  precioRecomendadoMin,
  precioRecomendadoMax,
}: Props) => {
  const padding = 0.05;
  const allPrices = [precioMin, precioMax, precioMedio, precioVendedor, precioRecomendadoMin, precioRecomendadoMax].filter(Boolean);
  const absMin = Math.min(...allPrices);
  const absMax = Math.max(...allPrices);
  const range = absMax - absMin || 1;
  const chartMin = absMin - range * padding;
  const chartMax = absMax + range * padding;
  const chartRange = chartMax - chartMin;

  const toPercent = (val: number) => ((val - chartMin) / chartRange) * 100;

  const recMinPct = toPercent(precioRecomendadoMin);
  const recMaxPct = toPercent(precioRecomendadoMax);
  const medioPct = toPercent(precioMedio);
  const vendedorPct = toPercent(precioVendedor);

  return (
    <div className="relative h-16">
      {/* Track */}
      <div className="absolute left-0 right-0 top-6 h-3 rounded-full bg-muted" />

      {/* Market range */}
      <div
        className="absolute top-6 h-3 rounded-full bg-border"
        style={{ left: `${toPercent(precioMin)}%`, width: `${toPercent(precioMax) - toPercent(precioMin)}%` }}
      />

      {/* Recommended range */}
      <div
        className="absolute top-5 h-5 rounded-full bg-primary/20 border border-primary/30"
        style={{ left: `${recMinPct}%`, width: `${recMaxPct - recMinPct}%` }}
      />

      {/* Medio line */}
      <div
        className="absolute top-3 h-9 w-0.5 bg-muted-foreground/50"
        style={{ left: `${medioPct}%` }}
      />
      <span
        className="absolute top-0 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap"
        style={{ left: `${medioPct}%` }}
      >
        Medio
      </span>

      {/* Vendor price dot */}
      <div
        className="absolute top-4 -translate-x-1/2 flex flex-col items-center"
        style={{ left: `${vendedorPct}%` }}
      >
        <span className="text-[10px] font-bold text-ocre whitespace-nowrap mb-0.5">Tu precio</span>
        <div className="h-5 w-5 rounded-full bg-ocre border-2 border-white shadow-md" />
      </div>
    </div>
  );
};

export default PriceRangeChart;
