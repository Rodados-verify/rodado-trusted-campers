# 🚐 Rodado — Confianza en cada Kilómetro

**Rodado** es la plataforma líder en la verificación y venta de autocaravanas y campers. Nuestro ecosistema conecta a vendedores particulares con compradores exigentes a través de una red de talleres especializados que garantizan el estado real de cada vehículo.

## 🚀 Propósito del Proyecto

El objetivo de Rodado es profesionalizar el mercado de segunda mano de vehículos vivienda, eliminando la incertidumbre mediante el **Sello Rodado**: una certificación técnica exhaustiva que cubre desde la mecánica hasta la habitabilidad.

## 👥 Usuarios y Funcionalidades

### 🏠 Landing Page & Público
- **Buscador de Vehículos**: Exposición de fichas públicas con fotos categorizadas.
- **Sello Rodado**: Visualización de informes técnicos y puntuaciones de inspección.
- **Lead Capture**: Descarga de informes detallados tras registro.

### 👤 Área del Vendedor
- **Panel de Gestión**: Seguimiento de solicitudes de inspección.
- **Kit de Publicación**: Herramientas para mejorar la visibilidad del anuncio.
- **Análisis de Precios**: Herramienta para valorar el vehículo según mercado.

### 🛠️ Red de Talleres
- **Dashboard de Inspección**: Gestión de encargos asignados.
- **Checklist Técnico**: Registro de puntos de inspección (motor, habitáculo, estanqueidad, etc.).
- **Gestoría Multimedia**: Subida de fotos originales para procesado automático.

### ⚙️ Administración
- **Control Total**: Gestión de usuarios, talleres y validación de solicitudes.
- **Auditoría**: Supervisión de los informes generados por los talleres.

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Lenguaje**: [TypeScript](https://www.typescriptlang.org/)
- **Estilos**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Gestión de Estado**: [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Enrutado**: [React Router DOM v6](https://reactrouter.com/)

### Backend & Servicios
- **Base de Datos & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Almacenamiento**: Supabase Storage para gestión de imágenes de alta resolución.
- **Edge Functions**: Lógica de servidor y procesado de datos en el borde.

### Herramientas de Desarrollo
- **Gestor de Paquetes**: [Bun](https://bun.sh/)
- **Linter**: ESLint
- **Testing**: Vitest & Playwright

## 💻 Configuración Local

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Rodados-verify/rodado-trusted-campers.git
   cd rodado-trusted-campers
   ```

2. **Instalar dependencias**:
   ```bash
   bun install
   # o npm install
   ```

3. **Variables de Entorno**:
   Crea un archivo `.env` en la raíz con tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=tu_url_de_supabase
   VITE_SUPABASE_ANON_KEY=tu_anon_key
   ```

4. **Arrancar servidor de desarrollo**:
   ```bash
   bun dev
   # o npm run dev
   ```

## 🏗️ Estructura del Proyecto

```text
src/
├── components/     # UI, Layouts y componentes específicos por rol
├── contexts/       # Contexto de Autenticación y otros globales
├── hooks/          # Custom hooks para lógica reutilizable
├── integrations/   # Configuración de Supabase y clientes externos
├── lib/            # Utilidades y configuración de librerías
├── pages/          # Vistas principales organizadas por funcionalidad
└── supabase/       # Migraciones y Edge Functions
```

---
*Desarrollado con ❤️ para amantes de la ruta.*
