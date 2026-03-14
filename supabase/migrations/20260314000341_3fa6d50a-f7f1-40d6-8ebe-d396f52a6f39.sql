-- Allow public to read solicitud data for published fichas
CREATE POLICY "Public can read solicitudes of published fichas"
ON public.solicitudes
FOR SELECT
TO public
USING (
  id IN (
    SELECT f.solicitud_id FROM fichas f WHERE f.activa = true
  )
);

-- Allow public to read vendedor contact info for published fichas
CREATE POLICY "Public can read vendedor of published fichas"
ON public.usuarios
FOR SELECT
TO public
USING (
  id IN (
    SELECT s.vendedor_id FROM solicitudes s
    JOIN fichas f ON f.solicitud_id = s.id
    WHERE f.activa = true
  )
);

-- Storage policy: allow authenticated users to upload to solicitud-fotos bucket
CREATE POLICY "Authenticated users can upload to solicitud-fotos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'solicitud-fotos');

-- Storage policy: allow public read from solicitud-fotos
CREATE POLICY "Public can read solicitud-fotos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'solicitud-fotos');