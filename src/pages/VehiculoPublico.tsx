import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SelloRodado } from "@/components/SelloRodado";
import { VehiculoGallery, type Photo, type PhotoCategory } from "@/components/vehiculo/VehiculoGallery";
import { VehiculoContactModal } from "@/components/vehiculo/VehiculoContactModal";
import { VehiculoInspeccion } from "@/components/vehiculo/VehiculoInspeccion";
import { Button } from "@/components/ui/button";
import {
  Truck, MapPin, Gauge, CarFront, Shield, Fuel, Cog, Ruler,
  Weight, Users, BedDouble, UtensilsCrossed, Bath, Sun, Thermometer,
  Droplets, Star, CheckCircle, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  publicUrl: string;
}

const VehiculoPublico = () => {
  const { slug } = useParams<{ slug: string }>();
  const [ficha, setFicha] = useState<any>(null);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [informe, setInforme] = useState<any>(null);
  const [inspeccion, setInspeccion] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [tallerNombre, setTallerNombre] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      const { data: f } = await supabase.from("fichas").select("*").eq("slug", slug).eq("activa", true).maybeSingle();
      if (!f) { setLoading(false); return; }
      setFicha(f);

      const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", f.solicitud_id).single();
      setSolicitud(sol);

      // Photos
      const { data: allFotos } = await supabase.from("fotos_solicitud").select("id, url, tipo").eq("solicitud_id", f.solicitud_id).order("created_at", { ascending: true });
      const procesadas = (allFotos || []).filter((fo: any) => fo.tipo === "procesada");
      const originales = (allFotos || []).filter((fo: any) => fo.tipo === "original");
      const fotosToShow = procesadas.length > 0 ? procesadas : originales;
      const resolvedPhotos: Photo[] = fotosToShow.map((fo: any) => {
        if (fo.url.startsWith("http")) return { id: fo.id, publicUrl: fo.url };
        const { data } = supabase.storage.from("solicitud-fotos").getPublicUrl(fo.url);
        return { id: fo.id, publicUrl: data.publicUrl };
      });
      setPhotos(resolvedPhotos);

      // Checklist (legacy)
      const { data: cl } = await supabase.from("checklist_items").select("*").eq("solicitud_id", f.solicitud_id);
      setChecklistItems(cl || []);

      // Informe
      const { data: inf } = await supabase.from("informes").select("*").eq("solicitud_id", f.solicitud_id).maybeSingle();
      setInforme(inf);

      // Inspeccion detalle (new)
      const { data: insp } = await (supabase as any).from("inspeccion_detalle").select("*").eq("solicitud_id", f.solicitud_id).maybeSingle();
      setInspeccion(insp);

      // Vendedor
      if (sol) {
        const { data: v } = await supabase.from("usuarios").select("nombre, telefono, email").eq("id", sol.vendedor_id).single();
        setVendedor(v);
        if (sol.taller_id) {
          const { data: t } = await supabase.from("talleres").select("nombre_taller").eq("id", sol.taller_id).maybeSingle();
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
      if (!tag) { tag = document.createElement("meta"); tag.setAttribute(name.startsWith("og:") ? "property" : "name", name); document.head.appendChild(tag); }
      tag.setAttribute("content", content);
    };
    const descText = ficha.descripcion_generada && ficha.descripcion_generada !== "Descripción pendiente de revisión"
      ? ficha.descripcion_generada : solicitud.descripcion || "";
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
  const description = ficha.descripcion_generada && ficha.descripcion_generada !== "Descripción pendiente de revisión"
    ? ficha.descripcion_generada : solicitud.descripcion;

  // Equipment pills from extras_verificados or puntos_positivos fallback
  const extras: string[] = inspeccion?.extras_verificados?.length > 0
    ? inspeccion.extras_verificados
    : informe?.puntos_positivos
      ? informe.puntos_positivos.split(/[,.\n;]+/).map((s: string) => s.trim()).filter((s: string) => s.length > 3 && s.length < 60)
      : [];

  // Technical specs from inspeccion_detalle
  const techSpecs: [string, string | null][] = [
    ["Tipo de vehículo", solicitud.tipo_vehiculo],
    ["Marca", solicitud.marca],
    ["Modelo", solicitud.modelo],
    ["Año", String(solicitud.anio)],
    ["Kilómetros", `${solicitud.km?.toLocaleString("es-ES")} km`],
    ["Ubicación", solicitud.provincia],
  ];
  if (inspeccion) {
    if (inspeccion.combustible) techSpecs.push(["Combustible", capitalize(inspeccion.combustible)]);
    if (inspeccion.potencia_cv) techSpecs.push(["Potencia", `${inspeccion.potencia_cv} CV${inspeccion.potencia_kw ? ` (${inspeccion.potencia_kw} kW)` : ""}`]);
    if (inspeccion.cilindrada) techSpecs.push(["Cilindrada", `${inspeccion.cilindrada} cc`]);
    if (inspeccion.transmision) techSpecs.push(["Transmisión", capitalize(inspeccion.transmision)]);
    if (inspeccion.traccion) techSpecs.push(["Tracción", capitalize(inspeccion.traccion)]);
    if (inspeccion.plazas) techSpecs.push(["Plazas", String(inspeccion.plazas)]);
    if (inspeccion.longitud_mm) techSpecs.push(["Longitud", `${(inspeccion.longitud_mm / 1000).toFixed(2)} m`]);
    if (inspeccion.mma_kg) techSpecs.push(["MMA", `${inspeccion.mma_kg} kg`]);
    if (inspeccion.peso_vacio_kg) techSpecs.push(["Peso en vacío", `${inspeccion.peso_vacio_kg} kg`]);
    if (inspeccion.capacidad_deposito_l) techSpecs.push(["Depósito", `${inspeccion.capacidad_deposito_l} L`]);
  }

  // Habitáculo features
  const habitaculoFeatures: { icon: React.ReactNode; label: string }[] = [];
  if (inspeccion) {
    if (inspeccion.cama_fija) habitaculoFeatures.push({ icon: <BedDouble className="h-4 w-4" />, label: "Cama fija" });
    if (inspeccion.dinette) habitaculoFeatures.push({ icon: <Users className="h-4 w-4" />, label: "Dinette" });
    if (inspeccion.cocina_fuegos > 0) habitaculoFeatures.push({ icon: <UtensilsCrossed className="h-4 w-4" />, label: `Cocina ${inspeccion.cocina_fuegos} fuegos` });
    if (inspeccion.cocina_horno) habitaculoFeatures.push({ icon: <UtensilsCrossed className="h-4 w-4" />, label: "Horno" });
    if (inspeccion.frigorifico_tipo && inspeccion.frigorifico_tipo !== "no_tiene") habitaculoFeatures.push({ icon: <Thermometer className="h-4 w-4" />, label: `Frigorífico ${capitalize(inspeccion.frigorifico_tipo)}` });
    if (inspeccion.banio_completo) habitaculoFeatures.push({ icon: <Bath className="h-4 w-4" />, label: "Baño completo" });
    if (inspeccion.ducha_separada) habitaculoFeatures.push({ icon: <Droplets className="h-4 w-4" />, label: "Ducha separada" });
    if (inspeccion.wc_tipo && inspeccion.wc_tipo !== "no_tiene") habitaculoFeatures.push({ icon: <Bath className="h-4 w-4" />, label: `WC ${capitalize(inspeccion.wc_tipo)}` });
    if (inspeccion.ac_tiene) habitaculoFeatures.push({ icon: <Thermometer className="h-4 w-4" />, label: `AC${inspeccion.ac_marca ? ` ${inspeccion.ac_marca}` : ""}` });
    if (inspeccion.calefaccion_marca) habitaculoFeatures.push({ icon: <Thermometer className="h-4 w-4" />, label: `Calefacción ${inspeccion.calefaccion_marca}` });
    if (inspeccion.panel_solar_tiene) habitaculoFeatures.push({ icon: <Sun className="h-4 w-4" />, label: `Panel solar${inspeccion.panel_solar_w ? ` ${inspeccion.panel_solar_w}W` : ""}` });
    if (inspeccion.toldo_tiene) habitaculoFeatures.push({ icon: <Ruler className="h-4 w-4" />, label: `Toldo${inspeccion.toldo_tipo ? ` ${inspeccion.toldo_tipo}` : ""}` });
    if (inspeccion.agua_deposito_limpia_l) habitaculoFeatures.push({ icon: <Droplets className="h-4 w-4" />, label: `${inspeccion.agua_deposito_limpia_l}L agua limpia` });
    if (inspeccion.inversor_tiene) habitaculoFeatures.push({ icon: <Cog className="h-4 w-4" />, label: `Inversor${inspeccion.inversor_w ? ` ${inspeccion.inversor_w}W` : ""}` });
    if (inspeccion.bateria_servicio_tipo) habitaculoFeatures.push({ icon: <Fuel className="h-4 w-4" />, label: `Batería ${inspeccion.bateria_servicio_tipo.toUpperCase()}${inspeccion.bateria_servicio_ah ? ` ${inspeccion.bateria_servicio_ah}Ah` : ""}` });
  }

  // Recommendation badge
  const recomendacion = inspeccion?.recomendacion;
  const puntuacion = inspeccion?.puntuacion_general;

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
        {/* ===== MOBILE LAYOUT ===== */}
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

          {/* Recommendation badge mobile */}
          {recomendacion && puntuacion && (
            <RecommendationBadge recomendacion={recomendacion} puntuacion={puntuacion} />
          )}

          {/* Mobile price + CTA */}
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            {precio ? (
              <p className="font-display text-3xl font-bold text-ocre">{precio.toLocaleString("es-ES")} <span className="text-lg">€</span></p>
            ) : (
              <p className="font-display text-2xl font-bold text-ocre">Consultar precio</p>
            )}
            <div className="mt-4 space-y-2.5">
              <VehiculoContactModal vendedor={vendedor} vehicleName={vehicleName} />
              {showTransport && <TransportButton vendedor={vendedor} vehicleName={vehicleName} />}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-5 text-center">
            <div className="flex justify-center mb-3"><SelloRodado size="lg" /></div>
            <p className="font-display text-sm font-semibold text-forest">Inspección verificada</p>
            <p className="mt-0.5 text-xs text-muted-foreground">por la red de talleres Rodado</p>
          </div>
        </div>

        {/* ===== DESKTOP TWO-COLUMN ===== */}
        <div className="flex flex-col gap-10 lg:flex-row">
          {/* Left 62% */}
          <div className="w-full lg:w-[62%] space-y-10">
            {/* Title desktop */}
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

            {/* Recommendation badge desktop */}
            {recomendacion && puntuacion && (
              <div className="hidden lg:block">
                <RecommendationBadge recomendacion={recomendacion} puntuacion={puntuacion} />
              </div>
            )}

            {/* Description */}
            {description && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Descripción</h2>
                <div className="mt-4 whitespace-pre-line text-foreground/85 leading-[1.85] text-[15px]">{description}</div>
              </div>
            )}

            {/* Habitáculo features */}
            {habitaculoFeatures.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Habitáculo y equipamiento</h2>
                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {habitaculoFeatures.map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-2 rounded-[20px] bg-sand px-3.5 py-2 text-sm font-medium text-forest">
                      {f.icon} {f.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extras verificados */}
            {extras.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Equipamiento verificado</h2>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {extras.map((pill: string, i: number) => (
                    <span key={i} className="rounded-[20px] bg-sand px-3.5 py-2 text-sm font-medium text-forest capitalize">{pill}</span>
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
                    {techSpecs.filter(([_, v]) => v).map(([label, value], i) => (
                      <tr key={label as string} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-white" : "bg-muted/15")}>
                        <td className="px-5 py-3.5 font-medium text-muted-foreground">{label}</td>
                        <td className="px-5 py-3.5 font-semibold text-foreground capitalize">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Documentación verificada */}
            {inspeccion && (inspeccion.itv_fecha_caducidad || inspeccion.historial_mantenimiento !== "no_disponible") && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Documentación verificada</h2>
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-sm">
                    <tbody>
                      {inspeccion.itv_fecha_caducidad && (
                        <tr className="border-b border-border bg-white">
                          <td className="px-5 py-3.5 font-medium text-muted-foreground">ITV válida hasta</td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">{new Date(inspeccion.itv_fecha_caducidad).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</td>
                        </tr>
                      )}
                      {inspeccion.historial_mantenimiento && inspeccion.historial_mantenimiento !== "no_disponible" && (
                        <tr className="border-b border-border bg-muted/15">
                          <td className="px-5 py-3.5 font-medium text-muted-foreground">Historial mantenimiento</td>
                          <td className="px-5 py-3.5 font-semibold text-foreground capitalize">{inspeccion.historial_mantenimiento}</td>
                        </tr>
                      )}
                      {inspeccion.num_propietarios && (
                        <tr className="border-b border-border bg-white">
                          <td className="px-5 py-3.5 font-medium text-muted-foreground">Propietarios anteriores</td>
                          <td className="px-5 py-3.5 font-semibold text-foreground">{inspeccion.num_propietarios}</td>
                        </tr>
                      )}
                      <tr className="bg-muted/15">
                        <td className="px-5 py-3.5 font-medium text-muted-foreground">Cargas/Embargos</td>
                        <td className="px-5 py-3.5 font-semibold text-foreground">{inspeccion.cargas_embargos ? "Sí" : "No"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inspection report */}
            <VehiculoInspeccion checklistItems={checklistItems} informe={informe} inspeccion={inspeccion} fotosDesperfectos={inspeccion?.fotos_desperfectos_urls || []} />
          </div>

          {/* Right 38% sticky desktop */}
          <div className="hidden lg:block w-[38%]">
            <div className="sticky top-20 space-y-6">
              {/* Price + Contact */}
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
                  {showTransport && <TransportButton vendedor={vendedor} vehicleName={vehicleName} />}
                </div>
              </div>

              {/* Sello Rodado */}
              <div className="rounded-2xl border border-border bg-white p-6 text-center">
                <div className="flex justify-center mb-4"><SelloRodado size="xl" /></div>
                <p className="font-display text-sm font-bold text-forest">Inspección verificada</p>
                <p className="mt-1 text-xs text-muted-foreground">por la red de talleres Rodado</p>
                {informe?.created_at && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Fecha: {new Date(informe.created_at).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
                {tallerNombre && <p className="mt-1 text-xs text-muted-foreground">Taller: {tallerNombre}</p>}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-border bg-forest py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <Link to="/" className="font-display text-xl font-bold text-white">Rodado</Link>
          <p className="mt-2 text-sm text-white/50">Vende tu autocaravana como merece ser vendida.</p>
        </div>
      </footer>
    </div>
  );
};

// ─── Sub-components ────────────────────────────────────

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

const RecommendationBadge = ({ recomendacion, puntuacion }: { recomendacion: string; puntuacion: number }) => {
  const config = {
    recomendado: { bg: "bg-green-50 border-green-200", text: "text-green-800", icon: <CheckCircle className="h-5 w-5 text-green-600" />, label: "Recomendado" },
    recomendado_con_reservas: { bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-800", icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />, label: "Con reservas" },
    no_recomendado: { bg: "bg-red-50 border-red-200", text: "text-red-800", icon: <AlertTriangle className="h-5 w-5 text-red-600" />, label: "No recomendado" },
  }[recomendacion] || { bg: "bg-muted", text: "text-foreground", icon: <Star className="h-5 w-5" />, label: recomendacion };

  return (
    <div className={cn("flex items-center gap-4 rounded-2xl border p-5", config.bg)}>
      {config.icon}
      <div>
        <div className="flex items-baseline gap-2">
          <span className={cn("font-display text-2xl font-bold", config.text)}>{puntuacion}/10</span>
          <span className={cn("text-sm font-semibold", config.text)}>— {config.label}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">Valoración del taller verificador</p>
      </div>
    </div>
  );
};

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default VehiculoPublico;
