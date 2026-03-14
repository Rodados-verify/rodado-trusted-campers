import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AnalisisPrecioEmpty from "@/components/vendedor/analisis/AnalisisPrecioEmpty";
import AnalisisPrecioLoading from "@/components/vendedor/analisis/AnalisisPrecioLoading";
import AnalisisPrecioResult from "@/components/vendedor/analisis/AnalisisPrecioResult";

export interface AnalisisData {
  id: string;
  solicitud_id: string;
  veredicto: string;
  diferencia_porcentaje: number;
  precio_recomendado_min: number;
  precio_recomendado_max: number;
  precio_medio_mercado: number;
  analisis: string;
  consejo: string;
  num_comparables: number;
  comparables: Comparable[];
  created_at: string;
}

export interface Comparable {
  titulo: string;
  precio: number;
  km: string;
  anio: string;
  url: string;
  fuente: string;
}

const VendedorAnalisisPrecio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analisis, setAnalisis] = useState<AnalisisData | null>(null);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);
  const [precioVenta, setPrecioVenta] = useState<number | null>(null);
  const [eligible, setEligible] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (!usuario) { setLoading(false); return; }

    const { data: solicitud } = await supabase
      .from("solicitudes")
      .select("id, estado, precio_venta")
      .eq("vendedor_id", usuario.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!solicitud) { setLoading(false); return; }

    const isEligible = ["contenido_generado", "publicado"].includes(solicitud.estado);
    setEligible(isEligible);
    setSolicitudId(solicitud.id);
    setPrecioVenta(solicitud.precio_venta ? Number(solicitud.precio_venta) : null);

    if (isEligible) {
      // Fetch existing analysis
      const { data: existingAnalisis } = await supabase
        .from("analisis_precio")
        .select("*")
        .eq("solicitud_id", solicitud.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingAnalisis) {
        setAnalisis(existingAnalisis as unknown as AnalisisData);
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAnalysis = async () => {
    if (!solicitudId) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analizar-precio", {
        body: { solicitud_id: solicitudId },
      });

      if (error) throw error;

      if (data?.success === false && data?.error === "insufficient_data") {
        toast({
          title: "Datos insuficientes",
          description: data.message,
          variant: "destructive",
        });
        setAnalyzing(false);
        return;
      }

      if (data?.success && data?.data) {
        setAnalisis(data.data as AnalisisData);
        toast({ title: "Análisis completado" });
      } else {
        throw new Error(data?.message || "Error en el análisis");
      }
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error al analizar",
        description: "Ha ocurrido un error. Inténtalo de nuevo más tarde.",
        variant: "destructive",
      });
    }
    setAnalyzing(false);
  };

  const updatePrecio = async (nuevoPrecio: number) => {
    if (!solicitudId) return;
    const { error } = await supabase
      .from("solicitudes")
      .update({ precio_venta: nuevoPrecio })
      .eq("id", solicitudId);
    if (error) {
      console.error("Error updating solicitud price:", error);
      toast({ title: "Error al actualizar precio", variant: "destructive" });
      return;
    }
    // Also sync the price to the public ficha if it exists
    const { error: fichaError } = await supabase
      .from("fichas")
      .update({ precio_final: nuevoPrecio })
      .eq("solicitud_id", solicitudId)
      .eq("activa", true);
    if (fichaError) {
      console.error("Error updating ficha price:", fichaError);
    }
    setPrecioVenta(nuevoPrecio);
    toast({ title: "Precio actualizado correctamente" });
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
        <h1 className="font-display text-2xl font-bold text-foreground">Analizar mi precio</h1>
        <p className="mt-4 text-muted-foreground">
          Esta herramienta estará disponible una vez que tu vehículo haya sido inspeccionado y el contenido esté generado.
        </p>
      </div>
    );
  }

  if (analyzing) {
    return <AnalisisPrecioLoading />;
  }

  if (!analisis) {
    return <AnalisisPrecioEmpty precioVenta={precioVenta} onAnalyze={runAnalysis} />;
  }

  return (
    <AnalisisPrecioResult
      analisis={analisis}
      precioVenta={precioVenta}
      onUpdatePrecio={updatePrecio}
      onRefresh={runAnalysis}
    />
  );
};

export default VendedorAnalisisPrecio;
