import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import InspeccionForm from "@/components/taller/InspeccionForm";

const TallerEncargoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [solicitud, setSolicitud] = useState<any>(null);
  const [vendedor, setVendedor] = useState<any>(null);
  const [fotosVendedor, setFotosVendedor] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tallerId, setTallerId] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const fetchAll = async () => {
      const { data: usuario } = await supabase.from("usuarios").select("id").eq("user_id", user.id).single();
      if (!usuario) { setLoading(false); return; }
      const { data: taller } = await supabase.from("talleres").select("id").eq("usuario_id", usuario.id).maybeSingle();
      if (taller) setTallerId(taller.id);

      const { data: sol } = await supabase.from("solicitudes").select("*").eq("id", id).single();
      if (!sol) { setLoading(false); return; }
      setSolicitud(sol);
      setIsCompleted(sol.estado === "contenido_generado" || sol.estado === "publicado");

      const { data: vend } = await supabase.from("usuarios").select("*").eq("id", sol.vendedor_id).single();
      setVendedor(vend);

      const { data: fotos } = await supabase.from("fotos_solicitud").select("*").eq("solicitud_id", id).eq("tipo", "original");
      setFotosVendedor(fotos || []);

      setLoading(false);
    };
    fetchAll();
  }, [id, user]);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Cargando…</p></div>;
  if (!solicitud) return <div className="py-20 text-center"><p>Encargo no encontrado</p></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild><Link to="/taller"><ArrowLeft className="mr-1 h-4 w-4" /> Volver</Link></Button>
        <div>
          <h1 className="font-display text-2xl font-bold">{solicitud.marca} {solicitud.modelo} · {solicitud.anio}</h1>
          <p className="text-sm text-muted-foreground">{solicitud.provincia} · {solicitud.km?.toLocaleString("es-ES")} km</p>
        </div>
      </div>

      {/* Vehicle info from vendor */}
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <h3 className="font-display text-lg font-semibold">Datos del vendedor</h3>
        <div className="grid grid-cols-2 gap-y-3 text-sm sm:grid-cols-3">
          <div><p className="text-muted-foreground">Tipo</p><p className="font-medium capitalize">{solicitud.tipo_vehiculo}</p></div>
          <div><p className="text-muted-foreground">Marca</p><p className="font-medium">{solicitud.marca}</p></div>
          <div><p className="text-muted-foreground">Modelo</p><p className="font-medium">{solicitud.modelo}</p></div>
          <div><p className="text-muted-foreground">Año</p><p className="font-medium">{solicitud.anio}</p></div>
          <div><p className="text-muted-foreground">Kilómetros</p><p className="font-medium">{solicitud.km?.toLocaleString("es-ES")} km</p></div>
          <div><p className="text-muted-foreground">Provincia</p><p className="font-medium">{solicitud.provincia}</p></div>
          {solicitud.precio_venta && (
            <div><p className="text-muted-foreground">Precio deseado</p><p className="font-medium">{Number(solicitud.precio_venta).toLocaleString("es-ES")} €</p></div>
          )}
        </div>
        {solicitud.descripcion && (
          <div className="border-t border-border pt-3">
            <p className="text-sm text-muted-foreground">Motivo de venta</p>
            <p className="mt-1 text-sm">{solicitud.descripcion}</p>
          </div>
        )}
        {vendedor && (
          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium">Contacto del vendedor</p>
            <p className="text-sm">{vendedor.nombre} · {vendedor.telefono || vendedor.email}</p>
          </div>
        )}
        {fotosVendedor.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Fotos del vendedor</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {fotosVendedor.map(f => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer" className="aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <img src={f.url} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inspection form or completed state */}
      {isCompleted ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-display text-lg font-bold text-green-800">Inspección completada ✓</p>
          <p className="mt-1 text-sm text-green-600">El equipo de Rodado está preparando la ficha del vehículo.</p>
        </div>
      ) : (
        <InspeccionForm
          solicitudId={id!}
          tallerId={tallerId}
          onComplete={() => {
            setIsCompleted(true);
            setSolicitud((prev: any) => ({ ...prev, estado: "contenido_generado" }));
          }}
        />
      )}
    </div>
  );
};

export default TallerEncargoDetalle;
