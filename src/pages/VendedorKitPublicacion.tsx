import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Download,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Share2,
  MessageCircle,
  Link2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KitData {
  id: string;
  solicitud_id: string;
  wallapop_titulo: string;
  wallapop_descripcion: string;
  milanuncios_titulo: string;
  milanuncios_descripcion: string;
  cochesnet_titulo: string;
  cochesnet_descripcion: string;
  whatsapp_texto: string;
  created_at: string;
}

interface SolicitudInfo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  precio_venta: number | null;
  estado: string;
}

interface FotoInfo {
  id: string;
  url: string;
  tipo: string;
}

// ─── Copy button component ───
const CopyButton = ({ text, label }: { text: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
        copied
          ? "bg-green-100 text-green-700"
          : "bg-secondary/10 text-secondary hover:bg-secondary/20"
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "¡Copiado!" : label || "Copiar"}
    </button>
  );
};

// ─── Copyable field component ───
const CopyableField = ({ label, content }: { label: string; content: string }) => (
  <div className="relative rounded-lg border border-border bg-white p-4">
    <div className="mb-2 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <CopyButton text={content} />
    </div>
    <p className="whitespace-pre-wrap text-sm text-foreground">{content}</p>
  </div>
);

// ─── Platform tab component ───
const PlatformTab = ({
  platform,
  titulo,
  descripcion,
  instructions,
  note,
  precioVenta,
}: {
  platform: string;
  titulo: string;
  descripcion: string;
  instructions: string[];
  note?: string;
  precioVenta: number | null;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg bg-muted/50 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
          Cómo publicar en {platform}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2 rounded-lg bg-muted/30 p-4">
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
            {instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>

      <CopyableField label="Título" content={titulo} />
      <CopyableField label="Descripción" content={descripcion} />

      {precioVenta && (
        <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-4">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Precio sugerido:</span>{" "}
            {precioVenta.toLocaleString("es-ES")}€
          </p>
        </div>
      )}

      {note && (
        <p className="text-xs text-muted-foreground italic">{note}</p>
      )}
    </div>
  );
};

// ─── Main page component ───
const VendedorKitPublicacion = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [eligible, setEligible] = useState(false);
  const [solicitud, setSolicitud] = useState<SolicitudInfo | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [fotos, setFotos] = useState<FotoInfo[]>([]);
  const [showAllFotos, setShowAllFotos] = useState(false);
  const [kit, setKit] = useState<KitData | null>(null);
  const [generatingKit, setGeneratingKit] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!usuario) { setLoading(false); return; }

    const { data: sol } = await supabase
      .from("solicitudes")
      .select("id, marca, modelo, anio, km, precio_venta, estado")
      .eq("vendedor_id", usuario.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sol || sol.estado !== "publicado") {
      setLoading(false);
      return;
    }

    setEligible(true);
    setSolicitud(sol as SolicitudInfo);

    // Fetch ficha slug
    const { data: ficha } = await supabase
      .from("fichas")
      .select("slug")
      .eq("solicitud_id", sol.id)
      .eq("activa", true)
      .maybeSingle();
    if (ficha?.slug) setSlug(ficha.slug);

    // Fetch photos (prefer procesada)
    const { data: allFotos } = await supabase
      .from("fotos_solicitud")
      .select("id, url, tipo")
      .eq("solicitud_id", sol.id)
      .order("created_at", { ascending: true });

    const procesadas = (allFotos || []).filter((f: any) => f.tipo === "procesada");
    const originales = (allFotos || []).filter((f: any) => f.tipo === "original");
    setFotos(procesadas.length > 0 ? procesadas : originales);

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load or generate kit when eligible
  useEffect(() => {
    if (!eligible || !solicitud) return;
    loadKit(false);
  }, [eligible, solicitud]);

  const loadKit = async (regenerar: boolean) => {
    if (!solicitud) return;
    setGeneratingKit(true);
    try {
      const { data, error } = await supabase.functions.invoke("generar-kit-publicacion", {
        body: { solicitud_id: solicitud.id, regenerar },
      });
      if (error) throw error;
      if (data?.success && data?.data) {
        setKit(data.data as KitData);
        if (regenerar) toast({ title: "Textos regenerados correctamente" });
      } else {
        throw new Error(data?.error || "Error al generar kit");
      }
    } catch (e: any) {
      console.error("Kit error:", e);
      if (!regenerar) {
        // Silent fail on first load
      } else {
        toast({ title: "Error al regenerar textos", variant: "destructive" });
      }
    }
    setGeneratingKit(false);
  };

  const downloadZip = async () => {
    if (!solicitud) return;
    setDownloadingZip(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generar-zip-fotos`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ solicitud_id: solicitud.id }),
        }
      );

      if (!response.ok) throw new Error("Error descargando ZIP");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const marca = solicitud.marca.toLowerCase().replace(/\s+/g, "-");
      const modelo = solicitud.modelo.toLowerCase().replace(/\s+/g, "-");
      a.download = `rodado-${marca}-${modelo}-${solicitud.anio}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "ZIP descargado correctamente" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error al descargar", variant: "destructive" });
    }
    setDownloadingZip(false);
  };

  const fichaUrl = slug ? `rodado.es/vehiculo/${slug}` : "";
  const fichaFullUrl = slug ? `https://rodado-trusted-campers.lovable.app/vehiculo/${slug}` : "";

  const shareWhatsApp = () => {
    const text = kit?.whatsapp_texto || `Vendo ${solicitud?.marca} ${solicitud?.modelo} ${solicitud?.anio}. Ver ficha completa: ${fichaFullUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const copyFichaLink = async () => {
    await navigator.clipboard.writeText(fichaFullUrl);
    toast({ title: "Enlace copiado al portapapeles" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="mx-auto max-w-lg text-center py-16">
        <h1 className="font-display text-2xl font-bold text-foreground">Publicar mi anuncio</h1>
        <p className="mt-4 text-muted-foreground">
          Esta herramienta estará disponible una vez que tu vehículo esté publicado.
        </p>
      </div>
    );
  }

  const visibleFotos = showAllFotos ? fotos : fotos.slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Tu anuncio listo para publicar
        </h1>
        <p className="mt-2 text-muted-foreground">
          Hemos preparado todo el contenido adaptado a cada plataforma. Solo tienes que copiar, pegar y subir las fotos.
        </p>
      </div>

      {/* Block 1 — Photos */}
      <Card className="border-secondary/20 bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-secondary" />
            Tus fotos con sello Rodado
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Todas las fotos llevan el sello de vehículo verificado. Úsalas en todos tus anuncios.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
            {visibleFotos.map((foto) => (
              <div
                key={foto.id}
                className="aspect-square overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={foto.url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          {fotos.length > 6 && !showAllFotos && (
            <button
              onClick={() => setShowAllFotos(true)}
              className="mt-3 text-sm font-medium text-secondary hover:underline"
            >
              Ver todas ({fotos.length} fotos)
            </button>
          )}
          <div className="mt-4">
            <Button
              onClick={downloadZip}
              disabled={downloadingZip}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {downloadingZip ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingZip ? "Generando ZIP…" : "Descargar todas las fotos (ZIP)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Block 2 — Platform content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Contenido por plataforma</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadKit(true)}
              disabled={generatingKit}
            >
              {generatingKit ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerar textos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {generatingKit && !kit ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Generando textos adaptados a cada plataforma…
              </p>
            </div>
          ) : kit ? (
            <Tabs defaultValue="wallapop">
              <TabsList className="w-full bg-muted/50">
                <TabsTrigger
                  value="wallapop"
                  className="flex-1 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-secondary"
                >
                  Wallapop
                </TabsTrigger>
                <TabsTrigger
                  value="milanuncios"
                  className="flex-1 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-secondary"
                >
                  Milanuncios
                </TabsTrigger>
                <TabsTrigger
                  value="cochesnet"
                  className="flex-1 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-secondary"
                >
                  Coches.net
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wallapop" className="mt-4">
                <PlatformTab
                  platform="Wallapop"
                  titulo={kit.wallapop_titulo}
                  descripcion={kit.wallapop_descripcion}
                  precioVenta={solicitud?.precio_venta ?? null}
                  instructions={[
                    'Ve a wallapop.com o abre la app',
                    'Pulsa "Vender" → "Motor" → "Autocaravanas y Caravanas"',
                    "Copia el título y la descripción de abajo",
                    "Sube las fotos del ZIP que has descargado",
                    "Introduce el precio y tu ubicación",
                  ]}
                />
              </TabsContent>

              <TabsContent value="milanuncios" className="mt-4">
                <PlatformTab
                  platform="Milanuncios"
                  titulo={kit.milanuncios_titulo}
                  descripcion={kit.milanuncios_descripcion}
                  precioVenta={solicitud?.precio_venta ?? null}
                  instructions={[
                    "Ve a milanuncios.com",
                    'Pulsa "Publicar anuncio" → "Motor" → "Autocaravanas"',
                    "Copia el título y la descripción de abajo",
                    "Sube las fotos del ZIP que has descargado",
                    "Completa el formulario con los datos del vehículo",
                  ]}
                  note="En Milanuncios puedes publicar en la categoría Motor → Autocaravanas"
                />
              </TabsContent>

              <TabsContent value="cochesnet" className="mt-4">
                <PlatformTab
                  platform="Coches.net"
                  titulo={kit.cochesnet_titulo}
                  descripcion={kit.cochesnet_descripcion}
                  precioVenta={solicitud?.precio_venta ?? null}
                  instructions={[
                    "Ve a coches.net",
                    'Pulsa "Vender" y selecciona tu tipo de vehículo',
                    "Copia el título y la descripción de abajo",
                    "Sube las fotos del ZIP que has descargado",
                    "Completa todos los datos técnicos del formulario",
                  ]}
                  note="Coches.net es ideal para compradores que buscan vehículos con datos técnicos completos"
                />
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No se pudieron generar los textos.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => loadKit(true)}
              >
                Intentar de nuevo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Block 3 — Community sharing */}
      <Card className="border-0 bg-primary text-primary-foreground">
        <CardContent className="py-8">
          <div className="flex items-start gap-3">
            <Share2 className="mt-1 h-6 w-6 flex-shrink-0 text-secondary" />
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">
                  Llega a la comunidad camper directamente
                </h3>
                <p className="mt-1 text-sm text-primary-foreground/80">
                  Los grupos de Facebook y foros especializados son donde están los compradores
                  más serios. Comparte tu ficha directamente.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={shareWhatsApp}
                  className="bg-[#25D366] text-white hover:bg-[#25D366]/90"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Compartir en WhatsApp
                </Button>
                <Button
                  onClick={copyFichaLink}
                  variant="outline"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Copiar enlace de la ficha
                </Button>
              </div>

              <p className="text-xs text-primary-foreground/50">
                Comparte este enlace en grupos de Facebook de compraventa de autocaravanas,
                foros especializados o directamente a interesados por WhatsApp. La ficha incluye
                el informe de inspección completo y genera confianza inmediata.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendedorKitPublicacion;
