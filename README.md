# 🚐 Rodado — Vende tu camper sin ceder un euro

**Rodado** es la plataforma que ayuda a particulares a vender su autocaravana o camper con la presentación y garantías de un profesional, sin ceder el margen a intermediarios como Clicars o Autohero. El vendedor sigue controlando su venta y publicando donde quiera (Wallapop, Milanuncios, grupos de Facebook), pero Rodado le proporciona todo lo necesario para hacerlo como un profesional.

---

## 🎯 Modelo de negocio

El servicio tiene tres actores principales:

- **Vendedor particular** — contrata el pack (499€) y recibe todo el servicio
- **Taller verificado** — inspecciona el vehículo y documenta su estado
- **Admin Rodado** — coordina el proceso, genera el contenido y publica la ficha

El pack (499€) incluye: inspección técnica de +80 puntos por taller especializado, informe de estado documentado, sello "Vehículo Rodado" verificado, galería de fotos con watermark de marca, descripción de venta generada automáticamente, ficha pública con URL propia enlazable desde cualquier plataforma, y transporte a domicilio opcional.

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend y lógica | React + Vite + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Enrutado | React Router DOM v6 |
| Estado del servidor | TanStack Query (React Query) |
| Backend y base de datos | Supabase (PostgreSQL) |
| Autenticación | Supabase Auth con roles (vendedor / taller / admin) |
| Storage | Supabase Storage (bucket `fotos-vehiculos` con carpetas `original/` y `procesada/`) |
| IA generación de contenido | Google Gemini 1.5 Flash vía Edge Functions |
| Scraping análisis de precios | Apify (`louisdeconinck/wallapop-scraper`, `lexis-solutions/milanuncios-cars-scraper`) |
| Email transaccional | Resend |
| Watermark en fotos | Sharp vía Edge Function |
| Generación de ZIPs | jszip vía Edge Function |
| PDFs documentación | Gemini + Deno |
| Gestor de paquetes | Bun |
| Testing | Vitest + Playwright |

---

## 🗄️ Estructura de base de datos

### Tablas principales

- **`usuarios`** — id, email, nombre, telefono, rol (vendedor/taller/admin), estado, created_at
- **`solicitudes`** — id, vendedor_id, taller_id, tipo_vehiculo, marca, modelo, año, km, provincia, descripcion, estado (`pendiente` / `asignado` / `en_inspeccion` / `contenido_generado` / `publicado` / `vendido`), incluye_transporte, precio_venta, estado_venta, created_at
- **`talleres`** — id, usuario_id, nombre_taller, direccion, provincia, descripcion, activo, created_at
- **`fotos_solicitud`** — id, solicitud_id, url, tipo (original/procesada), created_at
- **`informes`** — id, solicitud_id, taller_id, url_pdf, observaciones, created_at
- **`inspeccion_detalle`** — checklist completo (mecánica, carrocería, habitáculo, instalaciones, documentación, datos técnicos, extras verificados, valoración final, URLs fotos de protocolo)
- **`fichas`** — id, solicitud_id, slug, descripcion_generada, activa, created_at
- **`analisis_precio`** — id, solicitud_id, veredicto, diferencia_porcentaje, precio_recomendado_min/max, precio_medio_mercado, analisis, consejo, comparables (jsonb), created_at
- **`kit_publicacion`** — textos por plataforma (wallapop, milanuncios, cochesnet, whatsapp), created_at
- **`documentos_venta`** — id, solicitud_id, tipo (contrato/señal/guia_post_venta), url_pdf, datos_comprador (jsonb), created_at
- **`checklist_documentos`** — estado de cada documento (permiso_circulacion, ficha_tecnica, itv_vigor, historial_mantenimiento, informe_cargas, dos_llaves)

---

## 🖥️ Portales y funcionalidad

### Landing pública
Orientada al vendedor particular. Hero asimétrico con mockup de ficha, bloque del problema vs. con Rodado, sección del sello Rodado como protagonista, cómo funciona en 4 pasos, qué incluye el pack (499€), y sección para talleres interesados en unirse a la red.

### Portal del vendedor (`/vendedor`)
- **Mi solicitud** — formulario multipaso (tipo vehículo → descripción → fotos → confirmar) + stepper de estado en tiempo real (5 estados)
- **Mi ficha** — preview embebido cuando está publicada, botones de compartir
- **Analizar mi precio** — scraping de Wallapop y Milanuncios vía Apify, análisis con Gemini, veredicto (caro/en mercado/barato), gráfico comparativo y lista de comparables con enlaces
- **Kit de publicación** — fotos con watermark descargables en ZIP, textos adaptados por plataforma (Wallapop / Milanuncios / Coches.net) generados con Gemini, botones de compartir por WhatsApp
- **Documentación y cierre** — checklist de documentos previos, generador de contrato de compraventa en PDF, generador de recibo de señal, calculadora de ITP por comunidad autónoma, guía post-venta paso a paso con checklist interactivo
- **Mi cuenta** — datos editables, cambio de contraseña

### Portal del taller (`/taller`)
Solo accesible si `rol=taller` y `estado=activo`.
- **Mis encargos** — lista con pestañas (pendientes / en curso / completados) y vista detalle
- **Formulario de inspección** — 9 secciones: datos técnicos, fotos de protocolo (16 slots etiquetados), estado mecánico, carrocería, habitáculo camper, instalaciones, extras verificados, documentación, valoración final. Sistema de guardado por sección. Botón "Completar inspección" habilitado solo cuando las secciones obligatorias están completas.
- **Mi perfil** — datos editables del taller

### Panel de admin (`/admin`)
Solo accesible para `rol=admin`.
- **Solicitudes** — lista filtrable por estado, vista detalle completa, galería de fotos originales, asignación de taller, visualización del informe, editor de descripción, subida de fotos procesadas, botón "Publicar ficha"
- **Talleres** — lista con opciones activar/rechazar y historial de encargos
- **Usuarios** — lista de consulta

### Ficha pública (`/vehiculo/[slug]`)
Solo visible si `ficha.activa=true`. Layout dos columnas (62/38): galería con lightbox, descripción generada por Gemini, equipamiento verificado en pills, datos técnicos en tabla, informe de inspección por secciones con puntuación, descarga de PDF. Columna derecha sticky con precio, botón contactar (WhatsApp), sello Rodado y datos del taller verificador. SEO con meta tags y og:image. Todas las fotos llevan watermark (banda inferior semitransparente verde oscuro con logo Rodado).

---

## ⚡ Edge Functions de Supabase

| Función | Descripción |
|---|---|
| `generar-descripcion` | Construye prompt con datos del vehículo e inspección, llama a Gemini 1.5 Flash, guarda en `fichas.descripcion_generada`, activa la ficha y notifica al vendedor |
| `analizar-precio` | Llama a Apify con marca/modelo/año, filtra comparables, analiza con Gemini, guarda en `analisis_precio` |
| `procesar-foto` | Se dispara al subir foto; aplica watermark SVG con Sharp, guarda versión procesada en `procesada/` |
| `generar-zip-fotos` | Empaqueta todas las fotos procesadas de una solicitud en ZIP con jszip |
| `generar-contrato` | Construye prompt para Gemini con datos de vendedor/comprador/vehículo, genera PDF del contrato o recibo de señal, guarda en `documentos_venta` |

---

## 📧 Notificaciones email (vía Resend)

- Al vendedor cuando se le asigna un taller
- Al taller cuando recibe un nuevo encargo
- Al admin cuando el taller completa la inspección
- Al vendedor cuando su ficha está publicada

---

## 💻 Configuración local

**1. Clonar el repositorio**
```bash
git clone https://github.com/Rodados-verify/rodado-trusted-campers.git
cd rodado-trusted-campers
```

**2. Instalar dependencias**
```bash
bun install
```

**3. Variables de entorno**

Crea un archivo `.env` en la raíz:
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Variables adicionales para las Edge Functions (configurar en Supabase Dashboard):
```
GEMINI_API_KEY=
APIFY_TOKEN=
RESEND_API_KEY=
```

**4. Arrancar servidor de desarrollo**
```bash
bun dev
```

---

## 🏗️ Estructura del proyecto

```
src/
├── components/     # UI, layouts y componentes específicos por rol
├── contexts/       # Contexto de autenticación y otros globales
├── hooks/          # Custom hooks para lógica reutilizable
├── integrations/   # Configuración de Supabase y clientes externos
├── lib/            # Utilidades y configuración de librerías
├── pages/          # Vistas principales organizadas por funcionalidad
└── supabase/
    ├── functions/  # Edge Functions (generar-descripcion, analizar-precio, etc.)
    └── migrations/ # Migraciones de base de datos
```

---

## 🎨 Diseño

| Token | Valor | Uso |
|---|---|---|
| Fondo | `#F7F4EF` | Fondo general (crema) |
| Verde oscuro | `#1C3A2E` | Sidebar, headers, textos principales |
| Ocre | `#C47B2A` | Precio, CTAs, acentos |
| Arena | `#E8DFD0` | Fondos secundarios |
| Gris | `#6B6560` | Textos secundarios |

Tipografía: **Playfair Display** para títulos, **Inter** para cuerpo. Responsive con prioridad móvil.

El **Sello Rodado** se representa como un círculo con doble borde ocre e icono de verificación central.

---

## 🚀 Roadmap — Próximas fases

- FAQ automático del vehículo generado con IA
- Inbox centralizado de compradores
- Alertas de visitas a la ficha
- Transporte a domicilio gestionado
- Gestión de reserva económica (escrow)
- Mapa de cobertura de talleres
- Valoraciones de talleres verificados
- Pagos automáticos a talleres con Stripe Connect
- Asignación automática de taller por proximidad geográfica
- Dashboard de métricas para admin
- Integración de Stripe para cobrar los 499€ al vendedor

---

*Desarrollado con ❤️ para amantes de la ruta.*
