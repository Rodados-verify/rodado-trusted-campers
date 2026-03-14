import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SelloRodado } from "@/components/SelloRodado";
import { VehiculoGallery } from "@/components/vehiculo/VehiculoGallery";
import { VehiculoContactModal } from "@/components/vehiculo/VehiculoContactModal";
import { VehiculoInspeccion } from "@/components/vehiculo/VehiculoInspeccion";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Gauge, CarFront, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  publicUrl: string;
}

const VehiculoPublico = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [ficha, setFicha] = useState<any>(null);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [informe, setInforme] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [tallerNombre, setTallerNombre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      // 1. Fetch ficha
      const { data: f } = await supabase
        .from("fichas")
        .select("*")
        .eq("slug", slug)
        .eq("activa", true)
        .maybeSingle();

      if (!f) {
        setLoading(false);
        return;
      }
      setFicha(f);

      // 2. Fetch solicitud
      const { data: sol } = await supabase
        .from("solicitudes")
        .select("*")
        .eq("id", f.solicitud_id)
        .single();
      setSolicitud(sol);

      // 3. Fetch ALL photos, ordered by creation
      const { data: allFotos } = await supabase
        .from("fotos_solicitud")
        .select("id, url, tipo")
        .eq("solicitud_id", f.solicitud_id)
        .order("created_at", { ascending: true });

      const procesadas = (allFotos || []).filter((fo: any) => fo.tipo === "procesada");
      const originales = (allFotos || []).filter((fo: any) => fo.tipo === "original");
      const fotosToShow = procesadas.length > 0 ? procesadas : originales;

      // Convert relative paths to public URLs via Supabase Storage
      const resolvedPhotos: Photo[] = fotosToShow.map((fo: any) => {
        // If the URL is already absolute (https://...), use it directly
        if (fo.url.startsWith("http")) {
          return { id: fo.id, publicUrl: fo.url };
        }
        // Otherwise, resolve via storage bucket
        const { data } = supabase.storage.from("solicitud-fotos").getPublicUrl(fo.url);
        return { id: fo.id, publicUrl: data.publicUrl };
      });
      setPhotos(resolvedPhotos);

      // 4. Checklist
      const { data: cl } = await supabase
        .from("checklist_items")
        .select("*")
        .eq("solicitud_id", f.solicitud_id);
      setChecklistItems(cl || []);

      // 5. Informe
      const { data: inf } = await supabase
        .from("informes")
        .select("*")
        .eq("solicitud_id", f.solicitud_id)
        .maybeSingle();
      setInforme(inf);

      // 6. Vendedor
      if (sol) {
        const { data: v } = await supabase
          .from("usuarios")
          .select("nombre, telefono, email")
          .eq("id", sol.vendedor_id)
          .single();
        setVendedor(v);

        // 7. Taller name
        if (sol.taller_id) {
          const { data: t } = await supabase
            .from("talleres")
            .select("nombre_taller")
            .eq("id", sol.taller_id)
            .maybeSingle();
          if (t) setTallerNombre(t.nombre_taller);
        }
      }

      setLoading(false);
    };
    load();
  }, [slug]);

  // SEO meta tags
  useEffect(() => {
    if (!solicitud || !ficha) return;
    const title = `${solicitud.marca} ${solicitud.modelo} ${solicitud.anio} — Rodado`;
    document.title = title;

    const setMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(name.startsWith("og:") ? "property" : "name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    const descText = ficha.descripcion_generada && ficha.descripcion_generada !== "Descripción pendiente de revisión"
      ? ficha.descripcion_generada
      : solicitud.descripcion || "";
    const desc = descText.substring(0, 160) || `${solicitud.marca} ${solicitud.modelo} ${solicitud.anio} — Vehículo inspeccionado por la red Rodado`;
    
    setMeta("description", desc);
    setMeta("og:title", title);
    setMeta("og:description", desc);
    setMeta("og:type", "product");
    if (photos.length > 0) setMeta("og:image", photos[0].publicUrl);

    return () => { document.title = "Rodado"; };
  }, [solicitud, ficha, photos]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ocre border-t-transparent" />
      </div>
    );
  }

  if (!ficha || !solicitud) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <h1 className="font-display text-3xl font-bold text-foreground">Ficha no encontrada</h1>
        <p className="text-muted-foreground">Este vehículo no está disponible o ha sido retirado.</p>
        <Link to="/" className="text-sm font-medium text-ocre hover:underline">Volver a Rodado</Link>
      </div>
    );
  }

  const vehicleName = `${solicitud.marca} ${solicitud.modelo}`;
  const precio = ficha.precio_final ? Number(ficha.precio_final) : solicitud.precio_venta ? Number(solicitud.precio_venta) : null;
  const showTransport = ficha.incluye_transporte_final || solicitud.incluye_transporte;

  // Description: generated first, fallback to seller's
  const description = ficha.descripcion_generada && ficha.descripcion_generada !== "Descripción pendiente de revisión"
    ? ficha.descripcion_generada
    : solicitud.descripcion;

  // Equipment pills from puntos_positivos
  const equipmentPills = informe?.puntos_positivos
    ? informe.puntos_positivos.split(/[,.\n;]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3 && s.length < 60)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="font-display text-xl font-bold text-forest">Rodado</Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-ocre" />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Vehículo verificado</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">

        {/* ===== MOBILE LAYOUT: title + price first ===== */}
        <div className="lg:hidden space-y-5 mb-6">
          <div>
            <h1 className="font-display text-[28px] font-bold text-foreground leading-tight capitalize">
              {solicitud.marca} {solicitud.modelo}
            </h1>
            <p className="mt-1 text-base text-muted-foreground">{solicitud.anio}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DataPill icon={<Gauge className="h-3.5 w-3.5" />} text={`${solicitud.km?.toLocaleString("es-ES")} km`} />
            <DataPill icon={<MapPin className="h-3.5 w-3.5" />} text={solicitud.provincia} />
            <DataPill icon={<CarFront className="h-3.5 w-3.5" />} text={solicitud.tipo_vehiculo} />
          </div>
          {/* Mobile sticky price + CTA */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            {precio ? (
              <p className="font-display text-3xl font-bold text-ocre">
                {precio.toLocaleString("es-ES")} <span className="text-lg">€</span>
              </p>
            ) : (
              <p className="font-display text-2xl font-bold text-ocre">Consultar precio</p>
            )}
            <div className="mt-4 space-y-2.5">
              <VehiculoContactModal vendedor={vendedor} vehicleName={vehicleName} />
              {showTransport && (
                <TransportButton vendedor={vendedor} vehicleName={vehicleName} />
              )}
            </div>
          </div>
          {/* Mobile sello */}
          <div className="rounded-2xl border border-border bg-white p-5 text-center">
            <div className="flex justify-center mb-3">
              <SelloRodado size="lg" />
            </div>
            <p className="font-display text-sm font-semibold text-forest">Inspección verificada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">por la red de talleres Rodado</p>
          </div>
        </div>

        {/* ===== DESKTOP TWO-COLUMN LAYOUT ===== */}
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Left column — 62% */}
          <div className="w-full lg:w-[62%] space-y-10">
            {/* Title (desktop) */}
            <div className="hidden lg:block">
              <h1 className="font-display text-4xl font-bold text-foreground leading-tight capitalize">
                {solicitud.marca} {solicitud.modelo}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">{solicitud.anio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <DataPill icon={<Gauge className="h-3.5 w-3.5" />} text={`${solicitud.km?.toLocaleString("es-ES")} km`} />
                <DataPill icon={<MapPin className="h-3.5 w-3.5" />} text={solicitud.provincia} />
                <DataPill icon={<CarFront className="h-3.5 w-3.5" />} text={solicitud.tipo_vehiculo} />
              </div>
            </div>

            {/* Gallery */}
            <VehiculoGallery photos={photos} vehicleName={vehicleName} />

            {/* Description */}
            {description && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Descripción</h2>
                <div className="mt-4 whitespace-pre-line text-foreground/85 leading-[1.85] text-[15px]">
                  {description}
                </div>
              </div>
            )}

            {/* Equipment pills */}
            {equipmentPills.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Equipamiento destacado</h2>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {equipmentPills.map((pill: string, i: number) => (
                    <span
                      key={i}
                      className="rounded-[20px] bg-sand px-3.5 py-2 text-sm font-medium text-forest capitalize"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Technical specs */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Datos técnicos</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Tipo de vehículo", solicitud.tipo_vehiculo],
                      ["Marca", solicitud.marca],
                      ["Modelo", solicitud.modelo],
                      ["Año de matriculación", solicitud.anio],
                      ["Kilómetros", `${solicitud.km?.toLocaleString("es-ES")} km`],
                      ["Ubicación", solicitud.provincia],
                    ].map(([label, value], i) => (
                      <tr key={label as string} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-white" : "bg-muted/15")}>
                        <td className="px-5 py-3.5 font-medium text-muted-foreground">{label}</td>
                        <td className="px-5 py-3.5 font-semibold text-foreground capitalize">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspection report */}
            <VehiculoInspeccion checklistItems={checklistItems} informe={informe} />
          </div>

          {/* Right column — 38% sticky (desktop only) */}
          <div className="hidden lg:block w-[38%]">
            <div className="sticky top-20 space-y-6">
              {/* Card 1: Price + Contact */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                {precio ? (
                  <p className="font-display text-[42px] font-bold text-ocre leading-none">
                    {precio.toLocaleString("es-ES")} <span className="text-2xl">€</span>
                  </p>
                ) : (
                  <p className="font-display text-3xl font-bold text-ocre">Consultar precio</p>
                )}

                <div className="mt-6 space-y-3">
                  <VehiculoContactModal vendedor={vendedor} vehicleName={vehicleName} />
                  {showTransport && (
                    <TransportButton vendedor={vendedor} vehicleName={vehicleName} />
                  )}
                </div>
              </div>

              {/* Card 2: Sello Rodado */}
              <div className="rounded-2xl border border-border bg-white p-6 text-center">
                <div className="flex justify-center mb-4">
                  <SelloRodado size="xl" />
                </div>
                <p className="font-display text-sm font-bold text-forest">Inspección verificada</p>
                <p className="mt-1 text-xs text-muted-foreground">por la red de talleres Rodado</p>
                {informe?.created_at && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Fecha: {new Date(informe.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {tallerNombre && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Taller: {tallerNombre}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-border bg-forest py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Link to="/" className="font-display text-xl font-bold text-white">Rodado</Link>
          <p className="mt-2 text-sm text-white/50">Vende tu autocaravana como merece ser vendida.</p>
        </div>
      </footer>
    </div>
  );
};

// --- Sub-components ---

const DataPill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3.5 py-1.5 text-sm font-medium text-forest capitalize">
    {icon} {text}
  </span>
);

const TransportButton = ({ vendedor, vehicleName }: { vendedor: any; vehicleName: string }) => {
  const handleClick = () => {
    const phone = vendedor?.telefono?.replace(/\D/g, "");
    const url = phone
      ? `https://wa.me/34${phone}?text=${encodeURIComponent(`Hola, me interesa el transporte a domicilio para el ${vehicleName} publicado en Rodado.`)}`
      : `mailto:${vendedor?.email}?subject=${encodeURIComponent(`Transporte a domicilio — ${vehicleName}`)}`;
    window.open(url, "_blank");
  };
  return (
    <Button variant="outline" size="lg" className="w-full" onClick={handleClick}>
      <Truck className="mr-2 h-4 w-4" /> Solicitar transporte a domicilio
    </Button>
  );
};

export default VehiculoPublico;
