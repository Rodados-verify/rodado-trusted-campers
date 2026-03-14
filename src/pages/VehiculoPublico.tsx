import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SelloRodado } from "@/components/SelloRodado";
import { VehiculoGallery } from "@/components/vehiculo/VehiculoGallery";
import { VehiculoContactModal } from "@/components/vehiculo/VehiculoContactModal";
import { VehiculoInspeccion } from "@/components/vehiculo/VehiculoInspeccion";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Gauge, Calendar, CarFront, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const VehiculoPublico = () => {
  const { slug } = useParams<{ slug: string }>();
  const [ficha, setFicha] = useState<any>(null);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [informe, setInforme] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: f } = await supabase.from("fichas").select("*").eq("slug", slug).eq("activa", true).maybeSingle();
      if (!f) { setLoading(false); return; }
      setFicha(f);

      const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", f.solicitud_id).single();
      setSolicitud(sol);

      // Photos: procesadas first, then originales
      const { data: fp } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", f.solicitud_id).eq("tipo", "procesada");
      const { data: fo } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", f.solicitud_id).eq("tipo", "original");
      const allPhotos = [...(fp || []), ...(fo || [])];
      // Deduplicate by URL (procesadas may be copies of originals)
      const seen = new Set<string>();
      const deduped = allPhotos.filter(p => { if (seen.has(p.url)) return false; seen.add(p.url); return true; });
      setPhotos(deduped);

      const { data: cl } = await supabase.from("checklist_items").select("*").eq("solicitud_id", f.solicitud_id);
      setChecklistItems(cl || []);

      const { data: inf } = await supabase.from("informes").select("*").eq("solicitud_id", f.solicitud_id).maybeSingle();
      setInforme(inf);

      if (sol) {
        const { data: v } = await supabase.from("usuarios").select("nombre, telefono, email").eq("id", sol.vendedor_id).single();
        setVendedor(v);
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
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(name.startsWith("og:") ? "property" : "name", name); document.head.appendChild(tag); }
      tag.setAttribute("content", content);
    };

    const desc = ficha.descripcion_generada?.substring(0, 155) || `${solicitud.marca} ${solicitud.modelo} ${solicitud.anio} — ${solicitud.km?.toLocaleString("es-ES")} km — Vehículo inspeccionado por la red Rodado`;
    setMeta("description", desc);
    setMeta("og:title", title);
    setMeta("og:description", desc);
    setMeta("og:type", "product");
    if (photos.length > 0) setMeta("og:image", photos[0].url);

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

  // Equipment pills from puntos_positivos
  const equipmentPills = informe?.puntos_positivos
    ? informe.puntos_positivos.split(/[,.\n;]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3 && s.length < 60)
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="font-display text-xl font-bold text-forest">Rodado</Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-ocre" />
            <span className="text-xs font-medium text-muted-foreground">Vehículo verificado</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
        {/* Mobile: Title + Price first */}
        <div className="lg:hidden mb-6">
          <h1 className="font-display text-3xl font-bold text-foreground leading-tight">
            {solicitud.marca} {solicitud.modelo}
          </h1>
          <p className="mt-1 text-lg text-muted-foreground">{solicitud.anio}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <DataPill icon={<Gauge className="h-3.5 w-3.5" />} text={`${solicitud.km?.toLocaleString("es-ES")} km`} />
            <DataPill icon={<MapPin className="h-3.5 w-3.5" />} text={solicitud.provincia} />
            <DataPill icon={<CarFront className="h-3.5 w-3.5" />} text={solicitud.tipo_vehiculo} />
            <DataPill icon={<Calendar className="h-3.5 w-3.5" />} text={String(solicitud.anio)} />
          </div>
          {/* Mobile price + CTA */}
          <div className="mt-4 rounded-xl border border-border bg-white p-4">
            {precio && (
              <p className="font-display text-3xl font-bold text-ocre">
                {precio.toLocaleString("es-ES")} <span className="text-xl">€</span>
              </p>
            )}
            <div className="mt-3">
              <VehiculoContactModal vendedor={vendedor} vehicleName={vehicleName} />
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          {/* Left column - 65% */}
          <div className="w-full lg:w-[65%] space-y-10">
            {/* Gallery */}
            <VehiculoGallery photos={photos} vehicleName={vehicleName} />

            {/* Desktop Title */}
            <div className="hidden lg:block">
              <h1 className="font-display text-4xl font-bold text-foreground leading-tight">
                {solicitud.marca} {solicitud.modelo}
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">{solicitud.anio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <DataPill icon={<Gauge className="h-3.5 w-3.5" />} text={`${solicitud.km?.toLocaleString("es-ES")} km`} />
                <DataPill icon={<MapPin className="h-3.5 w-3.5" />} text={solicitud.provincia} />
                <DataPill icon={<CarFront className="h-3.5 w-3.5" />} text={solicitud.tipo_vehiculo} />
                <DataPill icon={<Calendar className="h-3.5 w-3.5" />} text={String(solicitud.anio)} />
              </div>
            </div>

            {/* Description */}
            {ficha.descripcion_generada && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Descripción</h2>
                <div className="mt-4 whitespace-pre-line text-foreground/85 leading-[1.8] text-[15px]">
                  {ficha.descripcion_generada}
                </div>
              </div>
            )}

            {/* Equipment pills */}
            {equipmentPills.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Equipamiento y características</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {equipmentPills.map((pill: string, i: number) => (
                    <span key={i} className="rounded-full bg-sand px-4 py-2 text-sm font-medium text-forest capitalize">
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

          {/* Right column - 35% sticky (desktop only) */}
          <div className="hidden lg:block w-[35%]">
            <div className="sticky top-20 space-y-6">
              {/* Price card */}
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                {precio && (
                  <p className="font-display text-4xl font-bold text-ocre">
                    {precio.toLocaleString("es-ES")} <span className="text-2xl">€</span>
                  </p>
                )}
                {!precio && <p className="font-display text-2xl font-bold text-ocre">Consultar precio</p>}

                <div className="mt-6 space-y-3">
                  <VehiculoContactModal vendedor={vendedor} vehicleName={vehicleName} />
                  {showTransport && (
                    <Button variant="outline" size="lg" className="w-full" onClick={() => {
                      const whatsappUrl = vendedor?.telefono
                        ? `https://wa.me/34${vendedor.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, me interesa el transporte a domicilio para el ${vehicleName} publicado en Rodado.`)}`
                        : `mailto:${vendedor?.email}?subject=${encodeURIComponent(`Transporte a domicilio — ${vehicleName}`)}`;
                      window.open(whatsappUrl, "_blank");
                    }}>
                      <Truck className="mr-2 h-4 w-4" /> Solicitar transporte
                    </Button>
                  )}
                </div>
              </div>

              {/* Trust badge */}
              <div className="rounded-2xl border border-border bg-white p-6 text-center">
                <div className="mx-auto mb-4 flex justify-center">
                  <SelloRodado size="lg" />
                </div>
                <p className="font-display text-sm font-semibold text-foreground">Inspección verificada</p>
                <p className="mt-1 text-xs text-muted-foreground">por la red de talleres Rodado</p>
                {informe?.created_at && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Fecha: {new Date(informe.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
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

const DataPill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3.5 py-1.5 text-sm font-medium text-forest">
    {icon} {text}
  </span>
);

export default VehiculoPublico;
