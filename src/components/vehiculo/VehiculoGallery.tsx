import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  tipo: string;
}

interface VehiculoGalleryProps {
  photos: Photo[];
  vehicleName: string;
}

export const VehiculoGallery = ({ photos, vehicleName }: VehiculoGalleryProps) => {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const goTo = useCallback((i: number) => {
    setCurrent(((i % photos.length) + photos.length) % photos.length);
  }, [photos.length]);

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

  if (photos.length === 0) return null;

  return (
    <>
      {/* Main photo */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-foreground/5 cursor-pointer group" onClick={() => setLightbox(true)}>
        <img
          src={photos[current].url}
          alt={`${vehicleName} - Foto ${current + 1}`}
          className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {/* Counter */}
        <div className="absolute bottom-3 right-3 rounded-full bg-foreground/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {current + 1} / {photos.length}
        </div>
        {/* Nav arrows on main */}
        {photos.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              onClick={() => setCurrent(i)}
              className={cn(
                "shrink-0 overflow-hidden rounded-lg border-2 transition-all duration-200",
                i === current ? "border-ocre ring-1 ring-ocre/30" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img
                src={photo.url}
                alt=""
                className="h-16 w-24 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95" onClick={() => setLightbox(false)}>
          <button className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20" onClick={() => setLightbox(false)}>
            <X className="h-6 w-6" />
          </button>
          <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
            {current + 1} / {photos.length}
          </div>
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current - 1); }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(current + 1); }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}
          <img
            src={photos[current].url}
            alt={`${vehicleName} - Foto ${current + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
