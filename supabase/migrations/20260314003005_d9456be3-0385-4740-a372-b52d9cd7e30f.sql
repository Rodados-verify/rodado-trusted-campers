CREATE POLICY "Public can read talleres of published fichas"
ON public.talleres
FOR SELECT
TO public
USING (
  id IN (
    SELECT s.taller_id FROM solicitudes s
    JOIN fichas f ON f.solicitud_id = s.id
    WHERE f.activa = true AND s.taller_id IS NOT NULL
  )
);