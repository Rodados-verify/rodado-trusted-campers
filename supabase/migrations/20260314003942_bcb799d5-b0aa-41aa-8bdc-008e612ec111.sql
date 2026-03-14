
CREATE TABLE public.inspeccion_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id uuid NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Datos técnicos
  combustible text,
  potencia_cv integer,
  potencia_kw integer,
  cilindrada integer,
  transmision text,
  traccion text,
  plazas integer,
  longitud_mm integer,
  mma_kg integer,
  peso_vacio_kg integer,
  capacidad_deposito_l integer,

  -- Estado mecánico
  motor_estado text DEFAULT 'correcto',
  motor_obs text,
  transmision_mec_estado text DEFAULT 'correcto',
  transmision_mec_obs text,
  frenos_estado text DEFAULT 'correcto',
  frenos_obs text,
  suspension_estado text DEFAULT 'correcto',
  suspension_obs text,
  direccion_estado text DEFAULT 'correcto',
  direccion_obs text,
  neumaticos_estado text DEFAULT 'correcto',
  neumaticos_obs text,
  neumaticos_marca text,
  neumaticos_dot text,
  neumaticos_profundidad_mm integer,
  escape_estado text DEFAULT 'correcto',
  escape_obs text,
  bateria_arranque_estado text DEFAULT 'correcto',
  bateria_arranque_obs text,
  niveles_estado text DEFAULT 'correcto',
  niveles_obs text,

  -- Carrocería
  carroceria_estado text DEFAULT 'correcto',
  carroceria_obs text,
  golpes_estado text DEFAULT 'correcto',
  golpes_obs text,
  repintados_estado text DEFAULT 'correcto',
  repintados_obs text,
  oxidacion_estado text DEFAULT 'correcto',
  oxidacion_obs text,
  sellados_estado text DEFAULT 'correcto',
  sellados_obs text,
  bajos_estado text DEFAULT 'correcto',
  bajos_obs text,
  cristales_estado text DEFAULT 'correcto',
  cristales_obs text,

  -- Habitáculo camper
  habitaculo_estado text DEFAULT 'correcto',
  habitaculo_obs text,
  humedades_estado text DEFAULT 'correcto',
  humedades_obs text,
  tapiceria_estado text DEFAULT 'correcto',
  tapiceria_obs text,
  cama_fija boolean DEFAULT false,
  cama_estado text,
  dinette boolean DEFAULT false,
  dinette_estado text,
  cocina_fuegos integer DEFAULT 0,
  cocina_horno boolean DEFAULT false,
  cocina_microondas boolean DEFAULT false,
  cocina_estado text,
  frigorifico_tipo text DEFAULT 'no_tiene',
  frigorifico_estado text,
  banio_completo boolean DEFAULT false,
  ducha_separada boolean DEFAULT false,
  wc_tipo text DEFAULT 'no_tiene',
  wc_estado text,
  persianas_estado text DEFAULT 'correcto',
  iluminacion_estado text DEFAULT 'correcto',
  calefaccion_marca text,
  calefaccion_tipo text,
  calefaccion_estado text,
  ac_tiene boolean DEFAULT false,
  ac_marca text,
  ac_estado text,

  -- Instalaciones
  electrica_estado text DEFAULT 'correcto',
  electrica_obs text,
  bateria_servicio_tipo text,
  bateria_servicio_ah integer,
  bateria_servicio_anio integer,
  bateria_servicio_estado text,
  panel_solar_tiene boolean DEFAULT false,
  panel_solar_w integer,
  panel_solar_estado text,
  toma_220v_estado text DEFAULT 'correcto',
  inversor_tiene boolean DEFAULT false,
  inversor_w integer,
  gas_estado text DEFAULT 'correcto',
  gas_obs text,
  agua_deposito_limpia_l integer,
  agua_deposito_grises_l integer,
  agua_estado text DEFAULT 'correcto',
  calefaccion_webasto_tiene boolean DEFAULT false,
  calefaccion_webasto_modelo text,
  toldo_tiene boolean DEFAULT false,
  toldo_tipo text,
  toldo_estado text,

  -- Extras verificados
  extras_verificados text[] DEFAULT '{}',

  -- Documentación
  itv_fecha_caducidad date,
  historial_mantenimiento text DEFAULT 'no_disponible',
  num_propietarios integer,
  cargas_embargos boolean DEFAULT false,

  -- Valoración global
  puntuacion_general integer,
  recomendacion text DEFAULT 'recomendado',
  observaciones_generales text,
  puntos_destacados text,

  -- Fotos protocolo
  foto_frontal_url text,
  foto_lateral_izq_url text,
  foto_lateral_der_url text,
  foto_trasera_url text,
  foto_34_frontal_url text,
  foto_34_trasero_url text,
  foto_interior_conduccion_url text,
  foto_dinette_url text,
  foto_cocina_url text,
  foto_banio_url text,
  foto_cama_url text,
  foto_habitaculo_url text,
  foto_motor_url text,
  foto_bajos_url text,
  foto_neumaticos_url text,
  foto_cuadro_electrico_url text,
  foto_panel_solar_url text,
  fotos_adicionales_urls text[] DEFAULT '{}'
);

ALTER TABLE public.inspeccion_detalle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage inspeccion_detalle"
ON public.inspeccion_detalle FOR ALL TO public
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Talleres can manage own inspeccion_detalle"
ON public.inspeccion_detalle FOR ALL TO authenticated
USING (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN talleres t ON t.id = s.taller_id
  JOIN usuarios u ON u.id = t.usuario_id
  WHERE u.user_id = auth.uid()
))
WITH CHECK (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN talleres t ON t.id = s.taller_id
  JOIN usuarios u ON u.id = t.usuario_id
  WHERE u.user_id = auth.uid()
));

CREATE POLICY "Public can read inspeccion of published"
ON public.inspeccion_detalle FOR SELECT TO public
USING (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN fichas f ON f.solicitud_id = s.id
  WHERE f.activa = true
));

CREATE POLICY "Vendedores can read own inspeccion"
ON public.inspeccion_detalle FOR SELECT TO authenticated
USING (solicitud_id IN (
  SELECT s.id FROM solicitudes s
  JOIN usuarios u ON u.id = s.vendedor_id
  WHERE u.user_id = auth.uid()
));
