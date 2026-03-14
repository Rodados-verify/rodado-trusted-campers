
CREATE TABLE public.analisis_precio (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  veredicto text,
  diferencia_porcentaje numeric,
  precio_recomendado_min integer,
  precio_recomendado_max integer,
  precio_medio_mercado integer,
  analisis text,
  consejo text,
  num_comparables integer,
  comparables jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.analisis_precio ENABLE ROW LEVEL SECURITY;

-- Vendedores can read their own analysis
CREATE POLICY "Vendedores can read own analisis"
ON public.analisis_precio
FOR SELECT
TO authenticated
USING (
  solicitud_id IN (
    SELECT s.id FROM solicitudes s
    JOIN usuarios u ON u.id = s.vendedor_id
    WHERE u.user_id = auth.uid()
  )
);

-- Admins can manage all
CREATE POLICY "Admins can manage analisis_precio"
ON public.analisis_precio
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Edge function inserts via service role, so no insert policy needed for users
