
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('vendedor', 'taller', 'admin');

-- Create enum for user status
CREATE TYPE public.user_status AS ENUM ('pendiente', 'activo', 'rechazado');

-- Create enum for solicitud status
CREATE TYPE public.solicitud_status AS ENUM ('pendiente', 'asignado', 'en_inspeccion', 'contenido_generado', 'publicado');

-- Create enum for foto type
CREATE TYPE public.foto_tipo AS ENUM ('original', 'procesada');

-- Create user_roles table (security best practice - roles separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Usuarios table (profiles)
CREATE TABLE public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT,
  estado user_status NOT NULL DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Talleres table
CREATE TABLE public.talleres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  nombre_taller TEXT NOT NULL,
  direccion TEXT NOT NULL,
  provincia TEXT NOT NULL,
  descripcion TEXT,
  activo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.talleres ENABLE ROW LEVEL SECURITY;

-- Solicitudes table
CREATE TABLE public.solicitudes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendedor_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE NOT NULL,
  taller_id UUID REFERENCES public.talleres(id),
  tipo_vehiculo TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL,
  km INTEGER NOT NULL,
  provincia TEXT NOT NULL,
  descripcion TEXT,
  estado solicitud_status NOT NULL DEFAULT 'pendiente',
  incluye_transporte BOOLEAN NOT NULL DEFAULT false,
  precio_venta NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- Fotos solicitud table
CREATE TABLE public.fotos_solicitud (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  tipo foto_tipo NOT NULL DEFAULT 'original',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fotos_solicitud ENABLE ROW LEVEL SECURITY;

-- Informes table
CREATE TABLE public.informes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE NOT NULL,
  taller_id UUID REFERENCES public.talleres(id) NOT NULL,
  url_pdf TEXT,
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.informes ENABLE ROW LEVEL SECURITY;

-- Fichas table
CREATE TABLE public.fichas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE NOT NULL,
  slug TEXT UNIQUE,
  descripcion_generada TEXT,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.fichas ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- user_roles: users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- user_roles: admins can manage all roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- usuarios: users can read own profile
CREATE POLICY "Users can read own profile" ON public.usuarios
  FOR SELECT USING (auth.uid() = user_id);

-- usuarios: users can insert own profile
CREATE POLICY "Users can insert own profile" ON public.usuarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- usuarios: users can update own profile
CREATE POLICY "Users can update own profile" ON public.usuarios
  FOR UPDATE USING (auth.uid() = user_id);

-- usuarios: admins can read all
CREATE POLICY "Admins can read all usuarios" ON public.usuarios
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- usuarios: admins can update all
CREATE POLICY "Admins can update all usuarios" ON public.usuarios
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- talleres: owners can read own
CREATE POLICY "Taller owners can read own" ON public.talleres
  FOR SELECT USING (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

-- talleres: owners can insert own
CREATE POLICY "Taller owners can insert own" ON public.talleres
  FOR INSERT WITH CHECK (
    usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

-- talleres: admins can manage all talleres
CREATE POLICY "Admins can manage talleres" ON public.talleres
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- solicitudes: vendedores can read own
CREATE POLICY "Vendedores can read own solicitudes" ON public.solicitudes
  FOR SELECT USING (
    vendedor_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

-- solicitudes: vendedores can insert own
CREATE POLICY "Vendedores can insert own solicitudes" ON public.solicitudes
  FOR INSERT WITH CHECK (
    vendedor_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
  );

-- solicitudes: admins can manage all
CREATE POLICY "Admins can manage solicitudes" ON public.solicitudes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- solicitudes: talleres can read assigned
CREATE POLICY "Talleres can read assigned solicitudes" ON public.solicitudes
  FOR SELECT USING (
    taller_id IN (SELECT id FROM public.talleres WHERE usuario_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid()))
  );

-- fotos: follow solicitud access
CREATE POLICY "Users can read fotos of own solicitudes" ON public.fotos_solicitud
  FOR SELECT USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes WHERE vendedor_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage fotos" ON public.fotos_solicitud
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- informes: follow solicitud access
CREATE POLICY "Users can read own informes" ON public.informes
  FOR SELECT USING (
    solicitud_id IN (
      SELECT id FROM public.solicitudes WHERE vendedor_id IN (SELECT id FROM public.usuarios WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can manage informes" ON public.informes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- fichas: public read for active fichas
CREATE POLICY "Public can read active fichas" ON public.fichas
  FOR SELECT USING (activa = true);

CREATE POLICY "Admins can manage fichas" ON public.fichas
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _estado user_status;
  _nombre TEXT;
  _telefono TEXT;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'vendedor');
  _nombre := COALESCE(NEW.raw_user_meta_data->>'nombre', '');
  _telefono := NEW.raw_user_meta_data->>'telefono';
  
  IF _role = 'taller' THEN
    _estado := 'pendiente';
  ELSE
    _estado := 'activo';
  END IF;

  INSERT INTO public.usuarios (user_id, email, nombre, telefono, estado)
  VALUES (NEW.id, NEW.email, _nombre, _telefono, _estado);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  IF _role = 'taller' THEN
    INSERT INTO public.talleres (usuario_id, nombre_taller, direccion, provincia, descripcion)
    VALUES (
      (SELECT id FROM public.usuarios WHERE user_id = NEW.id),
      COALESCE(NEW.raw_user_meta_data->>'nombre_taller', ''),
      COALESCE(NEW.raw_user_meta_data->>'direccion', ''),
      COALESCE(NEW.raw_user_meta_data->>'provincia', ''),
      NEW.raw_user_meta_data->>'descripcion_taller'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
