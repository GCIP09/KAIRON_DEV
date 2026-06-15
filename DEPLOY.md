# Guía de Despliegue de KAIRON

Esta guía contiene los pasos específicos para publicar Kairon en producción utilizando una base de datos PostgreSQL, un servidor en la nube (ej. Railway o Render) y hosting de archivos estáticos (ej. Vercel o Netlify) para el frontend.

---

## 📋 Arquitectura de Producción

1.  **Base de Datos (PostgreSQL):** Almacenamiento seguro en la nube (ej. [Neon.tech](https://neon.tech/)).
2.  **API Backend (Fastify + Prisma):** Desplegado en [Railway.app](https://railway.app/) o [Render.com](https://render.com/).
3.  **POS & Panel Admin (React SPA):** Desplegado en [Vercel](https://vercel.com/) (configurado con redirección de rutas).
4.  **Catálogo Público (Astro):** Desplegado en Vercel o Netlify.

---

## 🚀 Paso 1: Configurar la Base de Datos PostgreSQL

1.  Crea una cuenta gratuita en **Neon.tech** (o usa el addon de PostgreSQL en Railway).
2.  Crea un nuevo proyecto/base de datos y copia la cadena de conexión (`Connection String`), que se verá parecida a esto:
    ```text
    postgresql://usuario:contraseña@ep-cool-shadow-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
    ```
3.  Esta URL será tu variable de entorno `DATABASE_URL`.

---

## 💻 Paso 2: Preparar y Desplegar el Backend

El backend de Kairon ya está configurado para producción, escuchando en el puerto que asigne el hosting (`process.env.PORT`) y en la dirección `0.0.0.0` para admitir tráfico externo.

### Pasos en Railway o Render:
1.  Sube tu código a un repositorio de **GitHub**.
2.  Crea un nuevo servicio en tu plataforma de hosting apuntando a este repositorio.
3.  Establece la **Ruta Raíz** o Root Directory del servicio a: `backend/`.
4.  Configura las siguientes **Variables de Entorno** (Environment Variables):
    *   `DATABASE_URL` = *(La URL de tu PostgreSQL en el Paso 1)*
    *   `PORT` = `8000` *(o el puerto por defecto de la plataforma)*
5.  **Comando de Compilación / Build Command:**
    ```bash
    pnpm install && pnpm prisma:generate && pnpm build
    ```
6.  **Comando de Inicio / Start Command:**
    ```bash
    pnpm prisma:migrate deploy && pnpm start
    ```
    *(Esto ejecutará las migraciones de base de datos automáticamente en cada despliegue antes de iniciar el servidor).*

7.  **Inicializar Datos (Opcional - Seed):**
    Si deseas poblar la base de datos con los datos iniciales de demostración, ejecuta localmente (apuntando la variable temporalmente a tu base de datos de producción) o mediante la consola de la plataforma:
    ```bash
    npx prisma db seed
    ```

---

## 🖥️ Paso 3: Desplegar el Panel de Administración (React SPA)

El panel de administración se compila como archivos estáticos. Ya se configuró el archivo `admin/vercel.json` para evitar problemas de rutas de React Router al refrescar el navegador.

### Pasos en Vercel:
1.  Crea un nuevo proyecto en Vercel conectado a tu repositorio de GitHub.
2.  Establece el **Root Directory** a: `admin/`.
3.  **Framework Preset:** Elige `Vite` o déjalo en `Other`.
4.  **Build Command:** `pnpm build`
5.  **Output Directory:** `dist`
6.  Vercel publicará la aplicación y te dará una URL (ej: `https://kairon-admin.vercel.app`).

---

## 🌐 Paso 4: Desplegar el Catálogo Público (Astro)

Astro genera páginas estáticas óptimas que se distribuyen por red global (CDN).

### Pasos en Vercel o Netlify:
1.  Crea un nuevo proyecto conectado al repositorio.
2.  Establece el **Root Directory** a: `catalog/`.
3.  **Framework Preset:** Astro.
4.  **Build Command:** `pnpm build`
5.  **Output Directory:** `dist`
6.  Vercel generará el catálogo estático y te dará una URL (ej: `https://kairon-catalog.vercel.app`).

---

## 🔗 Paso 5: Enlazar el Cliente con la API de Producción

Para que la app de administración y el catálogo se comuniquen con la API en producción en lugar del servidor local, las peticiones HTTP dinámicas se resuelven en base al dominio actual o apuntan al host público del servidor backend desplegado en el **Paso 2**.

*   El backend y catálogo ya resuelven la URL del backend dinámicamente mediante `window.location.hostname`, por lo que si se accede en la misma red o dominio, el ruteo es automático.
*   Si despliegas la API en un dominio diferente (ej. Railway) y los clientes en otro (ej. Vercel), asegúrate de que el backend tenga configurados los encabezados CORS para aceptar peticiones de tus dominios de producción (el archivo `backend/src/server.ts` ya tiene habilitado CORS por defecto).
