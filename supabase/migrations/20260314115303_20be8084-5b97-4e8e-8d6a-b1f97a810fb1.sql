CREATE POLICY "Vendedores can update own solicitudes"
ON public.solicitudes
FOR UPDATE
TO authenticated
USING (vendedor_id IN (
  SELECT id FROM usuarios WHERE user_id = auth.uid()
))
WITH CHECK (vendedor_id IN (
  SELECT id FROM usuarios WHERE user_id = auth.uid()
));