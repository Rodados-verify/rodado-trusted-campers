import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Download, AlertTriangle } from "lucide-react";

interface ChecklistItem {
  id: string;
  seccion: string;
  item: string;
  estado: string;
  observacion: string | null;
}

interface Informe {
  observaciones_generales?: string | null;
  puntos_positivos?: string | null;
  url_pdf?: string | null;
  created_at?: string;
}

interface VehiculoInspeccionProps {
  checklistItems: ChecklistItem[];
  informe: Informe | null;
}

const SECCIONES = ["Mecánica", "Carrocería", "Habitáculo", "Instalaciones", "Documentación"];

export const VehiculoInspeccion = ({ checklistItems, informe }: VehiculoInspeccionProps) => {
  if (checklistItems.length === 0) return null;

  const totalCorrect = checklistItems.filter(i => i.estado === "correcto").length;
  const totalItems = checklistItems.length;
  const withObservations = checklistItems.filter(i => i.estado === "con_observaciones").length;
  const allCorrect = totalCorrect === totalItems;

  return (
    <div className="space-y-6">
      {/* Header with badge */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">Informe de inspección</h2>
        {allCorrect ? (
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">100% correcto</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-700">{withObservations} punto{withObservations !== 1 ? "s" : ""} a revisar</span>
          </div>
        )}
      </div>

      {/* Section cards */}
      <div className="space-y-3">
        {SECCIONES.map(seccion => {
          const items = checklistItems.filter(i => i.seccion === seccion);
          if (items.length === 0) return null;
          const correct = items.filter(i => i.estado === "correcto").length;

          return (
            <div key={seccion} className="rounded-xl border border-border bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display text-base font-semibold text-foreground">{seccion}</h4>
                <span className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold",
                  correct === items.length ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                )}>
                  {correct}/{items.length}
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-start gap-2.5">
                    <span className={cn(
                      "mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full",
                      item.estado === "correcto" ? "bg-green-500" : item.estado === "con_observaciones" ? "bg-yellow-500" : "bg-muted-foreground/20"
                    )} />
                    <div>
                      <span className="text-sm text-foreground">{item.item}</span>
                      {item.observacion && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.observacion}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Observaciones generales */}
      {informe?.observaciones_generales && (
        <div className="rounded-xl border border-border bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-display text-base font-semibold text-foreground">Observaciones generales</h4>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{informe.observaciones_generales}</p>
        </div>
      )}

      {/* Puntos positivos */}
      {informe?.puntos_positivos && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h4 className="font-display text-base font-semibold text-green-800">Puntos destacados</h4>
          </div>
          <p className="text-sm leading-relaxed text-green-700">{informe.puntos_positivos}</p>
        </div>
      )}

      {/* PDF download */}
      {informe?.url_pdf && (
        <a
          href={informe.url_pdf}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
        >
          <Download className="h-4 w-4" /> Descargar informe completo (PDF)
        </a>
      )}

      <p className="text-xs text-muted-foreground italic">
        Inspección realizada por taller verificado de la red Rodado.
      </p>
    </div>
  );
};
