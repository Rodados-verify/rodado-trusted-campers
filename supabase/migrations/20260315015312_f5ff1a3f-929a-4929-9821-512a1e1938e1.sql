
-- Create documentos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to documentos bucket
CREATE POLICY "Public can read documentos" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'documentos');

-- Allow authenticated users to upload to documentos bucket
CREATE POLICY "Authenticated can upload documentos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documentos');

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role full access documentos" ON storage.objects
FOR ALL TO service_role
USING (bucket_id = 'documentos');

-- Create documentos_venta table
CREATE TABLE public.documentos_venta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  url_pdf text NOT NULL,
  datos_comprador jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documentos_venta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendedores can read own documentos_venta" ON public.documentos_venta
FOR SELECT TO authenticated
USING (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN usuarios u ON u.id = s.vendedor_id
  WHERE u.user_id = auth.uid()
));

CREATE POLICY "Admins can manage documentos_venta" ON public.documentos_venta
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert documentos_venta" ON public.documentos_venta
FOR INSERT TO service_role
WITH CHECK (true);
