
-- Create a SECURITY DEFINER function to check if a taller is linked to a published ficha
CREATE OR REPLACE FUNCTION public.is_taller_of_published(_taller_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM solicitudes s
    JOIN fichas f ON f.solicitud_id = s.id
    WHERE s.taller_id = _taller_id AND f.activa = true
  )
$$;

-- Drop the recursive policy on talleres
DROP POLICY IF EXISTS "Public can read talleres of published fichas" ON public.talleres;

-- Recreate using the SECURITY DEFINER function
CREATE POLICY "Public can read talleres of published fichas"
ON public.talleres FOR SELECT TO public
USING (is_taller_of_published(id));
