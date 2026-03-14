import { useState, useCallback, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type PhotoCategory = "todas" | "exterior" | "interior" | "vivienda" | "desperfectos";

export interface Photo {
  id: string;
  publicUrl: string;
  category?: PhotoCategory;
}

interface VehiculoGalleryProps {
  photos: Photo[];
  vehicleName: string;
}

const FILTER_LABELS: { value: PhotoCategory; label: string; emoji: string }[] = [
  { value: "todas", label: "Todas", emoji: "📸" },
  { value: "exterior", label: "Exterior", emoji: "🚐" },
  { value: "interior", label: "Interior", emoji: "🪑" },
  { value: "vivienda", label: "Vivienda", emoji: "🏠" },
  { value: "desperfectos", label: "Desperfectos", emoji: "⚠️" },
];

export const VehiculoGallery = ({ photos, vehicleName }: VehiculoGalleryProps) => {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [activeFilter, setActiveFilter] = useState<PhotoCategory>("todas");

  // Determine which filters have photos
  const availableFilters = useMemo(() => {
    const cats = new Set(photos.map(p => p.category).filter(Boolean));
    return FILTER_LABELS.filter(
      f => f.value === "todas" || cats.has(f.value)
    );
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    if (activeFilter === "todas") return photos;
    return photos.filter(p => p.category === activeFilter);
  }, [photos, activeFilter]);

  // Reset current when filter changes
  useEffect(() => {
    setCurrent(0);
  }, [activeFilter]);

  const goTo = useCallback((i: number) => {
    if (filteredPhotos.length === 0) return;
    setCurrent(((i % filteredPhotos.length) + filteredPhotos.length) % filteredPhotos.length);
  }, [filteredPhotos.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") goTo(current + 1);
      if (e.key === "ArrowLeft") goTo(current - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, current, goTo]);

  if (photos.length === 0) {
    return (
      <div className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-muted/30">
        <div className="text-center">
          <ImageOff className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">Fotos próximamente</p>
        </div>
      </div>
    );
  }

  const showFilters = availableFilters.length > 2;

  return (
    <>
      {/* Category filters */}
      {showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: "none" }}>
          {availableFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-all",
                activeFilter === f.value
                  ? "bg-forest text-white shadow-md"
                  : "bg-sand text-forest hover:bg-sand/80"
              )}
            >
              <span>{f.emoji}</span>
              {f.label}
              {f.value !== "todas" && (
                <span className={cn(
                  "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  activeFilter === f.value ? "bg-white/20" : "bg-forest/10"
                )}>
                  {photos.filter(p => p.category === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main photo */}
      {filteredPhotos.length > 0 ? (
        <div
          className="relative cursor-pointer overflow-hidden rounded-xl border border-border group"
          onClick={() => setLightbox(true)}
        >
          <img
            src={filteredPhotos[current]?.publicUrl}
            alt={`${vehicleName} - Foto ${current + 1}`}
            className="h-[480px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            {current + 1} / {filteredPhotos.length}
          </div>
          {filteredPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
              >
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
              >
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex h-[480px] items-center justify-center rounded-xl border border-border bg-muted/30">
          <p className="text-sm text-muted-foreground">No hay fotos en esta categoría</p>
        </div>
      )}

      {/* Thumbnails */}
      {filteredPhotos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {filteredPhotos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setCurrent(i)}
              className={cn(
                "shrink-0 overflow-hidden rounded-lg transition-all duration-200",
                i === current
                  ? "border-2 border-ocre ring-2 ring-ocre/20"
                  : "border-2 border-transparent opacity-60 hover:opacity-100"
              )}
            >
              <img
                src={photo.publicUrl}
                alt=""
                className="h-[70px] w-[100px] object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && filteredPhotos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-7 w-7" />
          </button>
          <div className="absolute left-5 top-5 z-10 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
            {current + 1} / {filteredPhotos.length}
          </div>
          {filteredPhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
                className="absolute left-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-10 w-10" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
                className="absolute right-5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-4 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-10 w-10" />
              </button>
            </>
          )}
          <img
            src={filteredPhotos[current]?.publicUrl}
            alt={`${vehicleName} - Foto ${current + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
