import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Mail, X } from "lucide-react";

interface VehiculoContactModalProps {
  vendedor: { nombre: string; telefono?: string | null; email?: string } | null;
  vehicleName: string;
}

export const VehiculoContactModal = ({ vendedor, vehicleName }: VehiculoContactModalProps) => {
  const [open, setOpen] = useState(false);

  if (!vendedor) return null;

  const phone = vendedor.telefono?.replace(/\D/g, "") || "";
  const whatsappUrl = phone
    ? `https://wa.me/34${phone}?text=${encodeURIComponent(`Hola, me interesa tu ${vehicleName} publicado en Rodado.`)}`
    : null;
  const phoneUrl = phone ? `tel:+34${phone}` : null;
  const emailUrl = `mailto:${vendedor.email}?subject=${encodeURIComponent(`Interés en ${vehicleName} — Rodado`)}`;

  return (
    <>
      <Button variant="ocre" size="lg" className="w-full text-base" onClick={() => setOpen(true)}>
        <MessageCircle className="mr-2 h-5 w-5" /> Contactar con el vendedor
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="relative w-full max-w-sm rounded-2xl border border-border bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setOpen(false)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h3 className="font-display text-xl font-bold text-foreground">Contactar con el vendedor</h3>
            <p className="mt-1 text-sm text-muted-foreground">{vendedor.nombre}</p>
            <div className="mt-6 space-y-3">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25d366]/10 text-[#25d366]">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Abrir en WhatsApp</p>
                    <p className="text-xs text-muted-foreground">Respuesta rápida</p>
                  </div>
                </a>
              )}
              {phoneUrl && (
                <a href={phoneUrl} className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Llamar</p>
                    <p className="text-xs text-muted-foreground">+34 {vendedor.telefono}</p>
                  </div>
                </a>
              )}
              <a href={emailUrl} className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-muted/30">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ocre/10 text-ocre">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">{vendedor.email}</p>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
