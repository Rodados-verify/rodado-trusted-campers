import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SelloRodado } from "@/components/SelloRodado";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MessageCircle, Truck, ExternalLink } from "lucide-react";

const VehiculoPublico = () => {
  const { slug } = useParams<{ slug: string }>();
  const [ficha, setFicha] = useState<any>(null);
  const [solicitud, setSolicitud] = useState<any>(null);
  const [fotosProcesadas, setFotosProcesadas] = useState<any[]>([]);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [informe, setInforme] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!slug) return;
      const { data: f } = await supabase.from("fichas").select("*").eq("slug", slug).eq("activa", true).maybeSingle();
      if (!f) { setLoading(false); return; }
      setFicha(f);

      const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", f.solicitud_id).single();
      setSolicitud(sol);

      // Fotos procesadas first, fallback to originales
      const { data: fp } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", f.solicitud_id).eq("tipo", "procesada");
      if (fp && fp.length > 0) {
        setFotosProcesadas(fp);
      } else {
        const { data: fo } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", f.solicitud_id).eq("tipo", "original");
        setFotosProcesadas(fo || []);
      }

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
    fetch();
  }, [slug]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-muted-foreground">Cargando ficha…</p></div>;
  if (!ficha || !solicitud) return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Ficha no encontrada</h1>
        <Link to="/" className="mt-4 inline-block text-sm text-forest hover:underline">Volver a Rodado</Link>
      </div>
    </div>
  );

  const whatsappUrl = vendedor?.telefono
    ? `https://wa.me/34${vendedor.telefono.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, me interesa tu ${solicitud.marca} ${solicitud.modelo} publicado en Rodado.`)}`
    : `mailto:${vendedor?.email}?subject=${encodeURIComponent(`Interés en ${solicitud.marca} ${solicitud.modelo}`)}`

  return (
    <div className="min-h-screen bg-background">
      {/* Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedPhoto(null)}>
          <img src={selectedPhoto} alt="" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link to="/" className="font-display text-xl font-bold text-forest">Rodado</Link>
        </div>
      </header>

      <div className="container mx-auto py-8 lg:py-12">
        {/* Ficha header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <SelloRodado size="sm" />
              <span className="text-sm font-medium text-ocre">Vehículo inspeccionado</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground lg:text-4xl">
              {solicitud.marca} {solicitud.modelo}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {solicitud.anio} · {solicitud.km?.toLocaleString("es-ES")} km · {solicitud.provincia}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-bold text-ocre lg:text-4xl">
              {ficha.precio_final ? Number(ficha.precio_final).toLocaleString("es-ES") : solicitud.precio_venta ? Number(solicitud.precio_venta).toLocaleString("es-ES") : "Consultar"} €
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="ocre" size="lg" asChild>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> Contactar
                </a>
              </Button>
              {(ficha.incluye_transporte_final || solicitud.incluye_transporte) && (
                <Button variant="outline" size="lg" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <Truck className="mr-2 h-4 w-4" /> Transporte a domicilio
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Gallery */}
        {fotosProcesadas.length > 0 && (
          <div className="mt-8">
            {/* Hero photo */}
            <div className="overflow-hidden rounded-xl border border-border cursor-pointer" onClick={() => setSelectedPhoto(fotosProcesadas[0].url)}>
              <img src={fotosProcesadas[0].url} alt={`${solicitud.marca} ${solicitud.modelo}`} className="aspect-[16/9] w-full object-cover hover:opacity-95 transition-opacity" />
            </div>
            {/* Grid */}
            {fotosProcesadas.length > 1 && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {fotosProcesadas.slice(1).map(f => (
                  <div key={f.id} className="cursor-pointer overflow-hidden rounded-lg border border-border" onClick={() => setSelectedPhoto(f.url)}>
                    <img src={f.url} alt="" className="aspect-[4/3] w-full object-cover hover:opacity-90 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Description + specs */}
          <div className="lg:col-span-2 space-y-8">
            {ficha.descripcion_generada && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Descripción</h2>
                <div className="mt-4 whitespace-pre-line text-foreground leading-relaxed">{ficha.descripcion_generada}</div>
              </div>
            )}

            {/* Technical specs */}
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Datos técnicos</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Tipo", solicitud.tipo_vehiculo],
                      ["Marca", solicitud.marca],
                      ["Modelo", solicitud.modelo],
                      ["Año", solicitud.anio],
                      ["Kilómetros", `${solicitud.km?.toLocaleString("es-ES")} km`],
                      ["Provincia", solicitud.provincia],
                    ].map(([label, value], i) => (
                      <tr key={label as string} className={cn("border-b border-border last:border-0", i % 2 === 0 ? "bg-white" : "bg-muted/20")}>
                        <td className="px-4 py-3 font-medium text-muted-foreground capitalize">{label}</td>
                        <td className="px-4 py-3 font-medium capitalize">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inspection report */}
            {checklistItems.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Informe de inspección</h2>
                <div className="mt-4 space-y-4">
                  {["Mecánica", "Carrocería", "Habitáculo", "Instalaciones", "Documentación"].map(seccion => {
                    const items = checklistItems.filter(i => i.seccion === seccion);
                    if (items.length === 0) return null;
                    const correctCount = items.filter(i => i.estado === "correcto").length;
                    return (
                      <div key={seccion} className="rounded-xl border border-border bg-white p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{seccion}</h4>
                          <span className="text-sm text-muted-foreground">{correctCount}/{items.length} correctos</span>
                        </div>
                        <div className="mt-3 space-y-1.5">
                          {items.map(item => (
                            <div key={item.id} className="flex items-start gap-2 text-sm">
                              <span className={cn("mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full", item.estado === "correcto" ? "bg-green-500" : item.estado === "con_observaciones" ? "bg-yellow-500" : "bg-muted-foreground/30")} />
                              <div>
                                <span>{item.item}</span>
                                {item.observacion && <p className="text-xs text-muted-foreground">{item.observacion}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {informe?.observaciones_generales && (
                  <div className="mt-4 rounded-xl border border-border bg-white p-4">
                    <h4 className="font-medium">Observaciones generales</h4>
                    <p className="mt-2 text-sm text-muted-foreground">{informe.observaciones_generales}</p>
                  </div>
                )}

                {informe?.puntos_positivos && (
                  <div className="mt-4 rounded-xl border border-forest/20 bg-forest/5 p-4">
                    <h4 className="font-medium text-forest">Puntos destacados</h4>
                    <p className="mt-2 text-sm">{informe.puntos_positivos}</p>
                  </div>
                )}

                <p className="mt-4 text-xs text-muted-foreground italic">
                  Inspección realizada por taller verificado de la red Rodado.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-8 space-y-6">
              <div className="rounded-xl border border-border bg-white p-6 text-center">
                <div className="mx-auto mb-4"><SelloRodado size="lg" /></div>
                <p className="font-display text-xl font-bold text-foreground">
                  {ficha.precio_final ? Number(ficha.precio_final).toLocaleString("es-ES") : solicitud.precio_venta ? Number(solicitud.precio_venta).toLocaleString("es-ES") : "Consultar"} €
                </p>
                <Button variant="ocre" size="lg" className="mt-4 w-full" asChild>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Contactar con el vendedor
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-border bg-forest py-8">
        <div className="container mx-auto text-center">
          <Link to="/" className="font-display text-xl font-bold text-white">Rodado</Link>
          <p className="mt-2 text-sm text-white/60">Vende tu autocaravana como merece ser vendida.</p>
        </div>
      </footer>
    </div>
  );
};

export default VehiculoPublico;
