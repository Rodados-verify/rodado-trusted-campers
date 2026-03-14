
-- Create leads table for buyer email capture
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  telefono TEXT,
  origen TEXT DEFAULT 'ficha_publica',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anyone can insert leads (public page, no auth required)
CREATE POLICY "Anyone can insert leads" ON public.leads FOR INSERT TO public WITH CHECK (true);

-- Admins can manage all leads
CREATE POLICY "Admins can manage leads" ON public.leads FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));

-- Vendedores can read leads for their own solicitudes
CREATE POLICY "Vendedores can read own leads" ON public.leads FOR SELECT TO authenticated
USING (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN usuarios u ON u.id = s.vendedor_id
  WHERE u.user_id = auth.uid()
));

-- Create storage bucket for generated PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('informes-pdf', 'informes-pdf', true);

-- Storage policy: anyone can read public PDFs
CREATE POLICY "Public can read informes pdf" ON storage.objects FOR SELECT TO public
USING (bucket_id = 'informes-pdf');

-- Service role / edge functions can insert PDFs (via service_role key in edge function)
CREATE POLICY "Service can insert informes pdf" ON storage.objects FOR INSERT TO public
WITH CHECK (bucket_id = 'informes-pdf');
