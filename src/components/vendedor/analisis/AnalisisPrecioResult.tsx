import { useState } from "react";
import { ArrowUp, ArrowDown, Check, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AnalisisData } from "@/pages/VendedorAnalisisPrecio";
import PriceRangeChart from "./PriceRangeChart";

interface Props {
  analisis: AnalisisData;
  precioVenta: number | null;
  onUpdatePrecio: (precio: number) => Promise<void>;
  onRefresh: () => void;
}

const verdictConfig = {
  caro: {
    bg: "bg-[hsl(0,70%,96%)]",
    border: "border-[hsl(0,60%,85%)]",
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    icon: ArrowUp,
    title: "Tu precio está por encima del mercado",
    badgeBg: "bg-destructive/15 text-destructive border-destructive/30",
  },
  en_mercado: {
    bg: "bg-[hsl(100,40%,93%)]",
    border: "border-[hsl(100,30%,80%)]",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    icon: Check,
    title: "Tu precio está bien situado",
    badgeBg: "bg-primary/15 text-primary border-primary/30",
  },
  barato: {
    bg: "bg-[hsl(32,80%,94%)]",
    border: "border-[hsl(32,60%,80%)]",
    iconBg: "bg-ocre/10",
    iconColor: "text-ocre",
    icon: ArrowDown,
    title: "Tu precio está por debajo del mercado",
    badgeBg: "bg-ocre/15 text-ocre border-ocre/30",
  },
};

const AnalisisPrecioResult = ({ analisis, precioVenta, onUpdatePrecio, onRefresh }: Props) => {
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState(precioVenta?.toString() || "");
  const [saving, setSaving] = useState(false);

  const config = verdictConfig[analisis.veredicto as keyof typeof verdictConfig] || verdictConfig.en_mercado;
  const Icon = config.icon;

  const precios = (analisis.comparables || []).map((c) => c.precio).filter(Boolean);
  const precioMin = precios.length ? Math.min(...precios) : analisis.precio_medio_mercado * 0.7;
  const precioMax = precios.length ? Math.max(...precios) : analisis.precio_medio_mercado * 1.3;

  const badgeText =
    analisis.veredicto === "en_mercado"
      ? "En línea con el mercado"
      : `${analisis.diferencia_porcentaje > 0 ? "+" : ""}${Math.round(analisis.diferencia_porcentaje)}% ${analisis.veredicto === "caro" ? "sobre" : "bajo"} el precio medio`;

  const handleSavePrice = async () => {
    const num = parseInt(newPrice);
    if (!num || num < 1000) return;
    setSaving(true);
    await onUpdatePrecio(num);
    setSaving(false);
    setShowPriceModal(false);
  };

  const createdDate = new Date(analisis.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const fuenteColors: Record<string, string> = {
    milanuncios: "bg-[hsl(210,60%,93%)] text-[hsl(210,60%,35%)]",
    wallapop: "bg-[hsl(160,50%,92%)] text-[hsl(160,50%,30%)]",
    coches: "bg-[hsl(32,60%,92%)] text-[hsl(32,60%,35%)]",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">Análisis de precio</h1>

      {/* Bloque 1 — Veredicto */}
      <div className={`rounded-xl border ${config.border} ${config.bg} p-6`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.iconBg}`}>
            <Icon className={`h-6 w-6 ${config.iconColor}`} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">{config.title}</h2>
            <Badge variant="outline" className={`mt-2 ${config.badgeBg}`}>
              {badgeText}
            </Badge>
            <p className="mt-4 text-sm text-muted-foreground">{analisis.analisis}</p>
            <p className="mt-2 text-sm font-semibold text-primary">{analisis.consejo}</p>
          </div>
        </div>
      </div>

      {/* Bloque 2 — Comparativa visual */}
      <div className="rounded-xl border border-border bg-white p-6">
        <h3 className="font-display text-lg font-semibold mb-6">Comparativa de precios</h3>
        <PriceRangeChart
          precioMin={precioMin}
          precioMax={precioMax}
          precioMedio={analisis.precio_medio_mercado}
          precioVendedor={precioVenta || 0}
          precioRecomendadoMin={analisis.precio_recomendado_min}
          precioRecomendadoMax={analisis.precio_recomendado_max}
        />
        <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="text-muted-foreground">Mínimo en mercado</p>
            <p className="font-semibold">{precioMin.toLocaleString("es-ES")} €</p>
          </div>
          <div>
            <p className="text-muted-foreground">Precio medio</p>
            <p className="font-bold text-lg">{analisis.precio_medio_mercado.toLocaleString("es-ES")} €</p>
          </div>
          <div>
            <p className="text-muted-foreground">Máximo en mercado</p>
            <p className="font-semibold">{precioMax.toLocaleString("es-ES")} €</p>
          </div>
        </div>
      </div>

      {/* Bloque 3 — Comparables */}
      {analisis.comparables && analisis.comparables.length > 0 && (
        <div className="rounded-xl border border-border bg-white p-6">
          <h3 className="font-display text-lg font-semibold">
            Basado en {analisis.num_comparables} vehículos similares encontrados
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {analisis.comparables.map((comp, i) => (
              <div key={i} className="rounded-lg border border-border p-4 flex flex-col justify-between">
                <div>
                  <p className="text-sm font-medium line-clamp-2">{comp.titulo || "Vehículo similar"}</p>
                  <p className="mt-2 text-xl font-bold text-ocre">
                    {comp.precio ? comp.precio.toLocaleString("es-ES") : "—"} €
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {comp.km && `${comp.km}`}
                    {comp.km && comp.anio && " · "}
                    {comp.anio && `${comp.anio}`}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      fuenteColors[comp.fuente] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {comp.fuente}
                  </span>
                  {comp.url && (
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-ocre hover:underline flex items-center gap-1"
                    >
                      Ver anuncio <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bloque 4 — Acciones */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ocre" onClick={() => setShowPriceModal(true)}>
          Actualizar mi precio de venta
        </Button>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar análisis
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Análisis realizado el {createdDate}. Los precios del mercado cambian — actualiza el análisis periódicamente.
      </p>

      {/* Modal cambiar precio */}
      <Dialog open={showPriceModal} onOpenChange={setShowPriceModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Actualizar precio de venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Rango recomendado: {analisis.precio_recomendado_min.toLocaleString("es-ES")} € –{" "}
              {analisis.precio_recomendado_max.toLocaleString("es-ES")} €
            </p>
            <Input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Nuevo precio en €"
              min={1000}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPriceModal(false)}>
              Cancelar
            </Button>
            <Button variant="ocre" onClick={handleSavePrice} disabled={saving}>
              {saving ? "Guardando…" : "Guardar precio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnalisisPrecioResult;
