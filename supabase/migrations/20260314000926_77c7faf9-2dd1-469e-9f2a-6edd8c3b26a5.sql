-- Drop the recursive policies
DROP POLICY IF EXISTS "Public can read solicitudes of published fichas" ON public.solicitudes;
DROP POLICY IF EXISTS "Public can read vendedor of published fichas" ON public.usuarios;

-- Create SECURITY DEFINER functions to break recursion
CREATE OR REPLACE FUNCTION public.is_published_solicitud(_solicitud_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM fichas WHERE solicitud_id = _solicitud_id AND activa = true
  )
$$;

CREATE OR REPLACE FUNCTION public.is_vendedor_of_published(_usuario_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM solicitudes s
    JOIN fichas f ON f.solicitud_id = s.id
    WHERE s.vendedor_id = _usuario_id AND f.activa = true
  )
$$;

-- Recreate policies using the functions
CREATE POLICY "Public can read solicitudes of published fichas"
ON public.solicitudes
FOR SELECT
TO public
USING (public.is_published_solicitud(id));

CREATE POLICY "Public can read vendedor of published fichas"
ON public.usuarios
FOR SELECT
TO public
USING (public.is_vendedor_of_published(id));