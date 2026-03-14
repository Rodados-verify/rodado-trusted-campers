import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  publicUrl: string;
}

interface VehiculoGalleryProps {
  photos: Photo[];
  vehicleName: string;
}

export const VehiculoGallery = ({ photos, vehicleName }: VehiculoGalleryProps) => {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const goTo = useCallback((i: number) => {
    if (photos.length === 0) return;
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

  // Placeholder when no photos
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

  return (
    <>
      {/* Main photo — fixed 480px height */}
      <div
        className="relative cursor-pointer overflow-hidden rounded-xl border border-border group"
        onClick={() => setLightbox(true)}
      >
        <img
          src={photos[current].publicUrl}
          alt={`${vehicleName} - Foto ${current + 1}`}
          className="h-[480px] w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {/* Counter top-right */}
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          {current + 1} / {photos.length}
        </div>
        {/* Nav arrows */}
        {photos.length > 1 && (
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

      {/* Thumbnails — horizontal scrollable, 100x70px each */}
      {photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {photos.map((photo, i) => (
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

      {/* Lightbox — full screen */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            className="absolute right-5 top-5 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            <X className="h-7 w-7" />
          </button>
          {/* Counter */}
          <div className="absolute left-5 top-5 z-10 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white">
            {current + 1} / {photos.length}
          </div>
          {/* Arrows */}
          {photos.length > 1 && (
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
            src={photos[current].publicUrl}
            alt={`${vehicleName} - Foto ${current + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
