CREATE POLICY "Vendedores can update precio on own fichas"
ON public.fichas
FOR UPDATE
TO authenticated
USING (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN usuarios u ON u.id = s.vendedor_id
  WHERE u.user_id = auth.uid()
))
WITH CHECK (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN usuarios u ON u.id = s.vendedor_id
  WHERE u.user_id = auth.uid()
));