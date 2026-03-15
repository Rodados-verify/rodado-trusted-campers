-- Extend solicitudes with estado_venta
ALTER TABLE public.solicitudes ADD COLUMN IF NOT EXISTS estado_venta TEXT DEFAULT 'en_venta';

-- Extend usuarios with DNI and Direccion if they don't exist
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS direccion TEXT;

-- Create checklist_documentos table
CREATE TABLE IF NOT EXISTS public.checklist_documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE NOT NULL,
  permiso_circulacion TEXT DEFAULT 'pendiente', -- tengo / no_tengo / no_se
  ficha_tecnica TEXT DEFAULT 'pendiente',
  itv_vigor TEXT DEFAULT 'pendiente',
  historial_mantenimiento TEXT DEFAULT 'pendiente',
  informe_cargas TEXT DEFAULT 'pendiente',
  dos_llaves TEXT DEFAULT 'pendiente',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(solicitud_id)
);

-- Create documentos_venta table
CREATE TABLE IF NOT EXISTS public.documentos_venta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT, -- contrato / señal / guia_post_venta
  url_pdf TEXT,
  datos_comprador JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checklist_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_venta ENABLE ROW LEVEL SECURITY;

-- Policies for checklist_documentos
CREATE POLICY "Vendedores can manage own checklist_documentos" ON public.checklist_documentos
  FOR ALL USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes WHERE vendedor_id IN (
        SELECT id FROM public.usuarios WHERE user_id = auth.uid()
      )
    )
  );

-- Policies for documentos_venta
CREATE POLICY "Vendedores can read own documentos_venta" ON public.documentos_venta
  FOR SELECT USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes WHERE vendedor_id IN (
        SELECT id FROM public.usuarios WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Vendedores can insert own documentos_venta" ON public.documentos_venta
  FOR INSERT WITH CHECK (
    solicitud_id IN (
      SELECT id FROM public.solicitudes WHERE vendedor_id IN (
        SELECT id FROM public.usuarios WHERE user_id = auth.uid()
      )
    )
  );

-- Create storage bucket for documentos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documentos', 'documentos', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for public access to documentos (simplified for this environment)
-- Note: In a production environment, you would restrict this more.
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'documentos');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');
