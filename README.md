# Rux

Rux es una red social visual desarrollada con Vue 3, Vite y Supabase. Permite publicar imágenes, interactuar con publicaciones, guardar contenido, comentar y enviar mensajes privados.

## Stack

- Vue 3 + Vite
- Vue Router para navegación
- Pinia para la sesión de usuario
- Supabase Auth, Database, Storage y Realtime
- Tailwind CSS para estilos
- GSAP para animaciones puntuales

## Arquitectura

```txt
views
  ↓
components + estado de pantalla
  ↓
api
  ↓
Supabase Auth / Database / Storage / Realtime
```

Las vistas coordinan la pantalla, los componentes se encargan de la presentación y los módulos de `src/api/` encapsulan las consultas a Supabase. Las respuestas de la base se transforman a los DTO definidos en `src/types.js` antes de llegar a la interfaz.

## Estructura principal

```txt
src/
├── api/              # Acceso a Supabase y mapeo de datos
├── components/       # Componentes reutilizables de interfaz
├── mocks/             # Contenido demo separado del backend real
├── motion/            # Animaciones y composables de movimiento
├── router/            # Rutas y protección de páginas privadas
├── stores/            # Estado global, principalmente autenticación
├── styles/            # Tema y estilos globales
├── views/             # Pantallas de la aplicación
└── types.js           # Contratos DTO compartidos
```

## Configuración local

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Copia `.env.example` a `.env` y agrega las variables públicas de tu proyecto Supabase.

3. Ejecuta en Supabase:

   - `supabase/schema.sql`
   - `supabase/realtime.sql`
   - `supabase/notes.sql`
   - `supabase/note-replies.sql`
   - `supabase/follows.sql`

4. Inicia el proyecto:

   ```bash
   npm run dev
   ```

## Contenido demo

El Home conserva imágenes demo para que la interfaz no se vea vacía mientras se agregan publicaciones reales. Se controlan con:

```env
VITE_SHOW_DEMO_CONTENT=true
```

Para mostrar únicamente publicaciones guardadas en Supabase, cambia el valor a `false`.

## Seguridad

- El frontend usa únicamente la publishable key de Supabase.
- La autorización de publicaciones, comentarios, likes, guardados y mensajes depende de RLS.
- Las imágenes públicas se sirven desde Storage, pero las subidas y eliminaciones están limitadas a la carpeta del usuario.
- Nunca se debe colocar una `service_role` key en `.env` del frontend.

## Comandos

```bash
npm run dev       # desarrollo
npm run build     # compilación de producción
npm run lint      # validación de código
```
