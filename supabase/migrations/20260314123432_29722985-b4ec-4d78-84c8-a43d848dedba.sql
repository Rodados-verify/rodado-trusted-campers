
-- Kit de publicación table
CREATE TABLE public.kit_publicacion (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id uuid REFERENCES solicitudes(id) ON DELETE CASCADE NOT NULL,
  wallapop_titulo text,
  wallapop_descripcion text,
  milanuncios_titulo text,
  milanuncios_descripcion text,
  cochesnet_titulo text,
  cochesnet_descripcion text,
  whatsapp_texto text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.kit_publicacion ENABLE ROW LEVEL SECURITY;

-- Vendedores can read their own kit
CREATE POLICY "Vendedores can read own kit"
  ON public.kit_publicacion FOR SELECT
  TO authenticated
  USING (solicitud_id IN (
    SELECT s.id FROM solicitudes s
    JOIN usuarios u ON u.id = s.vendedor_id
    WHERE u.user_id = auth.uid()
  ));

-- Admins can manage kit
CREATE POLICY "Admins can manage kit_publicacion"
  ON public.kit_publicacion FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role inserts from edge functions (no RLS needed for service role)
