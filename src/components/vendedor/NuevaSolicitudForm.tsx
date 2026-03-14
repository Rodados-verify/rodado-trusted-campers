import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Upload, X, Truck, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PROVINCIAS = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona",
  "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca",
  "Gerona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Islas Baleares",
  "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León", "Lérida", "Lugo", "Madrid", "Málaga",
  "Murcia", "Navarra", "Orense", "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife",
  "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid",
  "Vizcaya", "Zamora", "Zaragoza",
];

const VEHICLE_TYPES = [
  { value: "autocaravana", label: "Autocaravana", emoji: "🚐" },
  { value: "camper", label: "Camper", emoji: "🚌" },
  { value: "caravana", label: "Caravana", emoji: "🏕️" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => currentYear - i);

interface FormData {
  tipo_vehiculo: string;
  marca: string;
  modelo: string;
  anio: number;
  km: number;
  provincia: string;
  precio_venta: number | null;
  descripcion: string;
  incluye_transporte: boolean;
}

interface NuevaSolicitudFormProps {
  onCreated: () => void;
}

const NuevaSolicitudForm = ({ onCreated }: NuevaSolicitudFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [form, setForm] = useState<FormData>({
    tipo_vehiculo: "",
    marca: "",
    modelo: "",
    anio: currentYear,
    km: 0,
    provincia: "",
    precio_venta: null,
    descripcion: "",
    incluye_transporte: false,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotos = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 20 - photos.length;
    const toAdd = files.slice(0, remaining);
    setPhotos((prev) => [...prev, ...toAdd]);
    toAdd.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(f);
    });
  }, [photos.length]);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (step) {
      case 1: return form.tipo_vehiculo && form.marca && form.modelo && form.anio && form.km > 0 && form.provincia;
      case 2: return true;
      case 3: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    try {
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!usuario) throw new Error("Usuario no encontrado");

      const { data: solicitud, error } = await supabase
        .from("solicitudes")
        .insert({
          vendedor_id: usuario.id,
          tipo_vehiculo: form.tipo_vehiculo,
          marca: form.marca,
          modelo: form.modelo,
          anio: form.anio,
          km: form.km,
          provincia: form.provincia,
          precio_venta: form.precio_venta,
          descripcion: form.descripcion,
          incluye_transporte: form.incluye_transporte,
        })
        .select()
        .single();

      if (error) throw error;

      for (const photo of photos) {
        const ext = photo.name.split(".").pop();
        const path = `${user.id}/${solicitud.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("solicitud-fotos")
          .upload(path, photo);
        if (uploadError) { console.error("Photo upload error:", uploadError); continue; }
        const { data: urlData } = supabase.storage.from("solicitud-fotos").getPublicUrl(path);
        await supabase.from("fotos_solicitud").insert({
          solicitud_id: solicitud.id,
          url: urlData.publicUrl,
          tipo: "original",
        });
      }

      toast({ title: "¡Solicitud enviada!", description: "Nos pondremos en contacto contigo en 24 horas." });
      onCreated();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Paso {step} de {totalSteps}</span>
          <span>{["Tu vehículo", "Tus fotos", "Confirmar"][step - 1]}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1 - Everything basic */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">¿Qué vehículo quieres vender?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Solo los datos básicos. Nuestro verificador se encarga del resto.</p>
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium">Tipo de vehículo</Label>
            <div className="grid grid-cols-3 gap-3">
              {VEHICLE_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => updateField("tipo_vehiculo", t.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                    form.tipo_vehiculo === t.value
                      ? "border-ocre bg-ocre/5"
                      : "border-border hover:border-ocre/50"
                  )}
                >
                  <span className="text-3xl">{t.emoji}</span>
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input id="marca" placeholder="Ej. Fiat, Volkswagen..." value={form.marca} onChange={(e) => updateField("marca", e.target.value)} className="mt-1.5 bg-white" />
            </div>
            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Input id="modelo" placeholder="Ej. Ducato, California..." value={form.modelo} onChange={(e) => updateField("modelo", e.target.value)} className="mt-1.5 bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="anio">Año</Label>
              <select
                id="anio"
                value={form.anio}
                onChange={(e) => updateField("anio", Number(e.target.value))}
                className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="km">Kilómetros</Label>
              <Input id="km" type="number" placeholder="Ej. 85000" value={form.km || ""} onChange={(e) => updateField("km", Number(e.target.value))} className="mt-1.5 bg-white" />
            </div>
          </div>

          <div>
            <Label htmlFor="provincia">Provincia</Label>
            <select
              id="provincia"
              value={form.provincia}
              onChange={(e) => updateField("provincia", e.target.value)}
              className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecciona provincia</option>
              {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <Label htmlFor="precio">Precio de venta deseado (€)</Label>
            <Input id="precio" type="number" placeholder="Ej. 45000" value={form.precio_venta ?? ""} onChange={(e) => updateField("precio_venta", e.target.value ? Number(e.target.value) : null)} className="mt-1.5 bg-white" />
          </div>

          <div>
            <Label htmlFor="motivo">Motivo de venta</Label>
            <Textarea
              id="motivo"
              placeholder="¿Por qué vendes? Ej. Cambio a modelo más grande, poco uso..."
              value={form.descripcion}
              onChange={(e) => {
                if (e.target.value.length <= 300) updateField("descripcion", e.target.value);
              }}
              className="mt-1.5 min-h-[80px] bg-white"
              maxLength={300}
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">{form.descripcion.length}/300</p>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-white p-4">
            <Checkbox
              id="transporte"
              checked={form.incluye_transporte}
              onCheckedChange={(checked) => updateField("incluye_transporte", !!checked)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="transporte" className="cursor-pointer font-medium">
                  <Truck className="mr-1 inline h-4 w-4" />
                  Incluir transporte a domicilio
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px]">
                    <p>Si el comprador es de otra ciudad, nos encargamos de entregar el vehículo en su domicilio.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">Ofrece entrega a domicilio al comprador</p>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 - Photos */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Sube las fotos que tengas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              No hace falta que sean perfectas. Nuestro verificador hará las fotos profesionales durante la inspección.
            </p>
          </div>

          <div>
            <label
              htmlFor="photo-upload"
              className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ocre/40 bg-ocre/5 p-8 transition-colors hover:border-ocre/70"
            >
              <Upload className="h-8 w-8 text-ocre" />
              <span className="text-sm font-medium text-foreground">Pulsa para seleccionar fotos</span>
              <span className="text-xs text-muted-foreground">{photos.length}/20 fotos · JPG, PNG, WEBP</span>
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotos}
              disabled={photos.length >= 20}
            />
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photoPreviews.map((src, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border">
                  <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute right-1 top-1 rounded-full bg-foreground/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3 - Confirmation */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">Revisa tu solicitud</h2>
            <p className="mt-1 text-sm text-muted-foreground">Comprueba que todo está correcto antes de enviar</p>
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-white p-6">
            <div className="grid grid-cols-2 gap-y-3 text-sm">
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-medium capitalize">{form.tipo_vehiculo}</span>
              <span className="text-muted-foreground">Marca</span>
              <span className="font-medium">{form.marca}</span>
              <span className="text-muted-foreground">Modelo</span>
              <span className="font-medium">{form.modelo}</span>
              <span className="text-muted-foreground">Año</span>
              <span className="font-medium">{form.anio}</span>
              <span className="text-muted-foreground">Kilómetros</span>
              <span className="font-medium">{form.km.toLocaleString("es-ES")} km</span>
              <span className="text-muted-foreground">Provincia</span>
              <span className="font-medium">{form.provincia}</span>
              {form.precio_venta && (
                <>
                  <span className="text-muted-foreground">Precio deseado</span>
                  <span className="font-medium">{form.precio_venta.toLocaleString("es-ES")} €</span>
                </>
              )}
              <span className="text-muted-foreground">Fotos</span>
              <span className="font-medium">{photos.length} fotos</span>
              <span className="text-muted-foreground">Transporte</span>
              <span className="font-medium">{form.incluye_transporte ? "Sí" : "No"}</span>
            </div>
            {form.descripcion && (
              <div className="border-t border-border pt-3">
                <p className="text-sm text-muted-foreground">Motivo de venta</p>
                <p className="mt-1 text-sm">{form.descripcion}</p>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-ocre/30 bg-ocre/5 p-6 text-center">
            <p className="font-display text-3xl font-bold text-ocre">349 €</p>
            <p className="mt-2 text-sm text-muted-foreground">
              El pago se habilitará próximamente. Tu solicitud quedará registrada y nos pondremos en contacto contigo en 24 horas.
            </p>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Anterior
          </Button>
        ) : (
          <div />
        )}

        {step < totalSteps ? (
          <Button variant="ocre" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Siguiente <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button variant="ocre" size="lg" onClick={handleSubmit} disabled={submitting || !canProceed()}>
            {submitting ? "Enviando…" : "Enviar mi solicitud"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default NuevaSolicitudForm;
