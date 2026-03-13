
-- Add checklist_items table for taller inspections
CREATE TYPE public.checklist_estado AS ENUM ('correcto', 'con_observaciones', 'no_aplica');

CREATE TABLE public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  seccion text NOT NULL,
  item text NOT NULL,
  estado checklist_estado NOT NULL DEFAULT 'correcto',
  observacion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Talleres can manage checklist items"
ON public.checklist_items FOR ALL TO authenticated
USING (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN talleres t ON t.id = s.taller_id JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()))
WITH CHECK (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN talleres t ON t.id = s.taller_id JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Admins can manage checklist items"
ON public.checklist_items FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendedores can read checklist items"
ON public.checklist_items FOR SELECT TO authenticated
USING (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN usuarios u ON u.id = s.vendedor_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Public can read checklist of published"
ON public.checklist_items FOR SELECT
USING (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN fichas f ON f.solicitud_id = s.id WHERE f.activa = true));

ALTER TABLE public.informes ADD COLUMN IF NOT EXISTS puntos_positivos text;
ALTER TABLE public.informes ADD COLUMN IF NOT EXISTS observaciones_generales text;
ALTER TABLE public.informes ADD COLUMN IF NOT EXISTS borrador boolean NOT NULL DEFAULT false;

ALTER TABLE public.fichas ADD COLUMN IF NOT EXISTS precio_final numeric;
ALTER TABLE public.fichas ADD COLUMN IF NOT EXISTS incluye_transporte_final boolean NOT NULL DEFAULT false;

CREATE POLICY "Talleres can insert fotos"
ON public.fotos_solicitud FOR INSERT TO authenticated
WITH CHECK (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN talleres t ON t.id = s.taller_id JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Talleres can read fotos"
ON public.fotos_solicitud FOR SELECT TO authenticated
USING (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN talleres t ON t.id = s.taller_id JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Talleres can insert informes"
ON public.informes FOR INSERT TO authenticated
WITH CHECK (taller_id IN (SELECT t.id FROM talleres t JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Talleres can update own informes"
ON public.informes FOR UPDATE TO authenticated
USING (taller_id IN (SELECT t.id FROM talleres t JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Talleres can read own informes"
ON public.informes FOR SELECT TO authenticated
USING (taller_id IN (SELECT t.id FROM talleres t JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Talleres can update assigned solicitudes"
ON public.solicitudes FOR UPDATE TO authenticated
USING (taller_id IN (SELECT t.id FROM talleres t JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()))
WITH CHECK (taller_id IN (SELECT t.id FROM talleres t JOIN usuarios u ON u.id = t.usuario_id WHERE u.user_id = auth.uid()));

CREATE POLICY "Admins can insert fotos"
ON public.fotos_solicitud FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read fotos of published solicitudes"
ON public.fotos_solicitud FOR SELECT
USING (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN fichas f ON f.solicitud_id = s.id WHERE f.activa = true));

CREATE POLICY "Public can read informes of published"
ON public.informes FOR SELECT
USING (solicitud_id IN (SELECT s.id FROM solicitudes s JOIN fichas f ON f.solicitud_id = s.id WHERE f.activa = true));
