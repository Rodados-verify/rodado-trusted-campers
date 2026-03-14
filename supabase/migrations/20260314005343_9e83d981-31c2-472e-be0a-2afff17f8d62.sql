
-- Allow admin DELETE on all related tables
CREATE POLICY "Admins can delete solicitudes" ON public.solicitudes FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete checklist_items" ON public.checklist_items FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete informes" ON public.informes FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete fotos_solicitud" ON public.fotos_solicitud FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete fichas" ON public.fichas FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete inspeccion_detalle" ON public.inspeccion_detalle FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
