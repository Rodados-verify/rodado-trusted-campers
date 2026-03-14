import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PdfLeadCaptureModalProps {
  solicitudId: string;
  pdfUrl: string | null;
  vehicleName: string;
}

export const PdfLeadCaptureModal = ({ solicitudId, pdfUrl, vehicleName }: PdfLeadCaptureModalProps) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSending(true);
    try {
      // Save lead
      await supabase.from("leads").insert({
        solicitud_id: solicitudId,
        email: email.trim(),
        nombre: nombre.trim() || null,
        origen: "descarga_pdf",
      } as any);

      // Open PDF in new tab for download
      if (pdfUrl) {
        window.open(pdfUrl, "_blank");
      }

      setSent(true);
      toast({ title: "Informe enviado", description: "Se ha abierto el PDF de inspección." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (!pdfUrl) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full gap-2">
          <Download className="h-4 w-4" />
          Descargar informe de inspección (PDF)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Informe de inspección</DialogTitle>
          <DialogDescription>
            Descarga el informe completo de inspección del {vehicleName}. Introduce tu email para recibirlo.
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <p className="font-display text-lg font-semibold text-foreground">¡Listo!</p>
            <p className="text-sm text-muted-foreground">
              El informe se ha abierto en una nueva pestaña. Si no lo ves, revisa tu bloqueador de pop-ups.
            </p>
            <Button variant="outline" onClick={() => { if (pdfUrl) window.open(pdfUrl, "_blank"); }}>
              <Download className="mr-2 h-4 w-4" /> Abrir PDF de nuevo
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="lead-email">Email *</Label>
              <Input
                id="lead-email"
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="lead-nombre">Nombre (opcional)</Label>
              <Input
                id="lead-nombre"
                placeholder="Tu nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tu email nos permite informarte sobre este vehículo y facilitarte la compra. No spam.
            </p>
            <Button type="submit" variant="ocre" className="w-full" disabled={sending}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Descargar informe
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
