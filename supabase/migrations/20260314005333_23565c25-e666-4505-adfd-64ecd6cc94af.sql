
-- Cascade delete function for solicitudes (admin only)
CREATE OR REPLACE FUNCTION public.delete_solicitud_cascade(_solicitud_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admins
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Delete related records in correct order
  DELETE FROM fichas WHERE solicitud_id = _solicitud_id;
  DELETE FROM checklist_items WHERE solicitud_id = _solicitud_id;
  DELETE FROM inspeccion_detalle WHERE solicitud_id = _solicitud_id;
  DELETE FROM informes WHERE solicitud_id = _solicitud_id;
  DELETE FROM fotos_solicitud WHERE solicitud_id = _solicitud_id;
  DELETE FROM solicitudes WHERE id = _solicitud_id;
END;
$$;
