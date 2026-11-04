<div align="center">

<img src="frontend/public/logo-ucss.png" alt="Universidad Católica Sedes Sapientiae" width="320" />

# Repositorio de Publicaciones Científicas

### Facultad de Ingeniería — UCSS

Plataforma web institucional para **registrar, organizar, consultar y difundir** los artículos científicos
de estudiantes, docentes, egresados y colaboradores de la Facultad de Ingeniería.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)

**URL pública:** `http://190.119.171.251:8080/publicacionesfi/`

</div>

---

## Contenido

- [Características](#características)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación local](#instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Roles y permisos](#roles-y-permisos)
- [Flujo de una publicación](#flujo-de-una-publicación)
- [Imágenes optimizadas](#imágenes-optimizadas)
- [Modelo de datos](#modelo-de-datos)
- [API REST](#api-rest)
- [Seguridad](#seguridad)
- [Despliegue en Ubuntu](#despliegue-en-ubuntu)
- [Respaldos](#respaldos)

---

## Características

### Portal público
- **Inicio:** buscador central, indicadores (publicaciones, autores, revistas), artículos destacados y recientes.
- **Catálogo:** búsqueda por título, autor, resumen, revista y palabras clave. Filtros por año, tipo, revista, programa y línea de investigación. Orden y paginación.
- **Ficha del artículo:** portada grande con imagen, autores con foto y ORCID, resumen, palabras clave, metadatos de la revista, DOI, enlace original, PDF autorizado y **cita APA 7 lista para copiar**.
- **Perfil del investigador:** foto ampliable, datos académicos y todas sus publicaciones.
- Diseño **responsivo** (computadora, tableta y celular) y accesible: navegación por teclado, contraste y foco visible.

### Panel administrativo
- **Dashboard** con estados de las publicaciones y actividad reciente.
- **Publicaciones:** formulario por secciones (datos generales, revista, autores ordenados, clasificación, enlaces, imagen principal y archivos). Avisa de **posibles duplicados** por título o DOI.
- **Flujo editorial:** borrador → revisión → publicado → archivado, con confirmaciones.
- **Autores** (con foto), **revistas** y **catálogos** (tipos, programas, líneas de investigación y palabras clave).
- **Reportes:** producción por año, tipo, programa, revista y autor. Exportación a **CSV** y **Excel**.
- **Usuarios y roles** y **bitácora** de operaciones (solo administradores).

---

## Arquitectura

```
Navegador ──► Nginx :8080 ──┬── /publicacionesfi/        ──► React (build estático)
                            └── /publicacionesfi/api/*   ──► Node.js + Express (127.0.0.1:3001)
                                                                  │
                                                                  ├── Prisma ──► MySQL (publicaciones_fi)
                                                                  └── storage/ (PDFs e imágenes WebP)
```

| Capa | Tecnología |
|---|---|
| Frontend | React 19 · Vite 6 · Tailwind CSS 4 · React Router 7 · Lucide Icons |
| Backend | Node.js · Express 4 · Prisma 6 · Zod · Multer · Sharp · ExcelJS |
| Base de datos | MySQL 8 (sesiones también en MySQL) |
| Producción | Ubuntu Server · Nginx · systemd |

React nunca se conecta a MySQL: las credenciales viven solo en el backend.

---

## Estructura del proyecto

```
proyecto-fi/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma         # Modelo de datos (14 tablas)
│   │   ├── migrations/           # Migraciones SQL versionadas
│   │   └── seed.js               # Roles, tipos, programas y administrador inicial
│   ├── src/
│   │   ├── app.js                # Configuración de Express, sesiones y rutas
│   │   ├── server.js             # Punto de entrada
│   │   ├── lib/                  # Configuración, consultas, archivos e imágenes
│   │   ├── middleware/           # Autenticación, roles y manejo de errores
│   │   └── routes/               # API pública, autenticación y administración
│   └── .env.example
├── frontend/
│   ├── public/                   # Logo y favicon
│   ├── src/
│   │   ├── pages/                # Portal público y panel (pages/admin)
│   │   ├── components/           # UI reutilizable, tarjetas, imágenes, CRUD genérico
│   │   ├── context/              # Sesión y notificaciones
│   │   ├── api/ · lib/           # Cliente HTTP, formatos y hooks
│   │   └── index.css             # Tema institucional (Tailwind)
│   └── vite.config.js            # base = /publicacionesfi/
├── deploy/                       # Nginx, systemd y script SQL de referencia
├── storage/                      # Archivos subidos (no versionados)
│   ├── archivos/                 # PDFs y documentos (privados)
│   └── imagenes/                 # Portadas y fotos en WebP (públicas)
└── plan_publicaciones_fi.md      # Plan funcional y técnico
```

---

## Instalación local

**Requisitos:** Node.js 20 o superior y MySQL 8.

### 1. Base de datos

Ejecute `deploy/crear_bd.sql` como root de MySQL, cambiando antes la contraseña del usuario `pubfi_app`:

```bash
mysql -u root -p < deploy/crear_bd.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # complete las contraseñas y SESSION_SECRET
npm install
npx prisma migrate deploy     # crea las tablas
npm run seed                  # datos iniciales y administrador
npm run dev                   # API en http://127.0.0.1:3001
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173/publicacionesfi/
```

En desarrollo, Vite reenvía `/publicacionesfi/api/*` a la API, igual que Nginx en producción.

| Página | URL local |
|---|---|
| Portal | http://localhost:5173/publicacionesfi/ |
| Catálogo | http://localhost:5173/publicacionesfi/publicaciones |
| Acceso administrativo | http://localhost:5173/publicacionesfi/login |

El administrador inicial se crea con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`. Cambie la contraseña desde el panel (icono 🔑) al primer ingreso.

---

## Variables de entorno

Archivo `backend/.env` (plantilla: `backend/.env.example`):

| Variable | Descripción | Ejemplo |
|---|---|---|
| `NODE_ENV` | Entorno | `production` |
| `HOST` / `PORT` | Dirección interna de la API | `127.0.0.1` / `3001` |
| `DATABASE_URL` | Conexión de Prisma | `mysql://pubfi_app:***@localhost:3306/publicaciones_fi` |
| `DB_HOST` `DB_PORT` `DB_USER` `DB_PASSWORD` `DB_NAME` | Conexión del almacén de sesiones | — |
| `SESSION_SECRET` | Cadena aleatoria larga para firmar la cookie | `openssl rand -hex 48` |
| `COOKIE_SECURE` | `true` cuando se use HTTPS | `false` |
| `BASE_PATH` | Subruta pública (la cookie solo viaja aquí) | `/publicacionesfi` |
| `STORAGE_DIR` | PDFs y documentos privados | `../storage/archivos` |
| `MEDIA_DIR` | Imágenes WebP públicas | `../storage/imagenes` |
| `MAX_UPLOAD_MB` | Tamaño máximo de archivos | `20` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Administrador inicial (solo para el seed) | — |

---

## Roles y permisos

| Acción | Administrador | Editor | Visitante |
|---|:-:|:-:|:-:|
| Consultar publicaciones públicas | ✅ | ✅ | ✅ |
| Registrar, editar, revisar y publicar | ✅ | ✅ | — |
| Imágenes, fotos y archivos | ✅ | ✅ | — |
| Administrar catálogos | ✅ | ✅ | — |
| Generar reportes | ✅ | ✅ | — |
| Eliminar borradores | ✅ | — | — |
| Gestionar usuarios y roles | ✅ | — | — |
| Consultar bitácora | ✅ | — | — |

Los permisos se aplican en el servidor, no solo se ocultan en la interfaz.

---

## Flujo de una publicación

```
 ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
 │ Borrador │ ─► │ Revisión  │ ─► │ Publicado │ ─► │ Archivado │
 └──────────┘    └───────────┘    └───────────┘    └───────────┘
      ▲               │                 │                │
      └───────────────┘                 └──── revisión ◄─┘ (se puede volver a publicar)
```

1. **Registrar** título, resumen, tipo, idioma y año.
2. **Vincular** revista, programa, autores (en orden), palabras clave y líneas.
3. **Adjuntar** DOI, enlace oficial, imagen principal y archivos autorizados.
4. **Revisar** la exactitud bibliográfica, los duplicados y los permisos de difusión.
5. **Publicar:** desde ese momento es visible en el portal.
6. **Archivar** para retirarla sin perder su historial. Solo los borradores pueden eliminarse.

> La aprobación interna indica que la información puede mostrarse en el repositorio. No reemplaza la revisión por pares de la revista.

---

## Imágenes optimizadas

Cada imagen subida (JPG, PNG, WEBP o AVIF, hasta 12 MB) se procesa con **Sharp**:

| Tipo | Recorte | Tamaños WebP generados | Uso |
|---|---|---|---|
| Imagen principal del artículo | 16:9 | 640 · 1280 · 1920 px | Tarjetas, ficha y pantallas grandes |
| Foto del investigador | 1:1, centrada en el rostro | 96 · 256 · 512 px | Avatares, tarjetas y perfil ampliado |

- El frontend usa `srcset` y `sizes`, así el navegador descarga **solo el tamaño necesario**.
- Se corrige la orientación EXIF y se **eliminan los metadatos** (GPS, cámara).
- Los nombres son UUID: se sirven con caché permanente (`immutable`, 1 año).
- Al reemplazar o quitar una imagen se borran todas sus versiones.

---

## Modelo de datos

Base `publicaciones_fi`, 14 tablas administradas con Prisma:

| Tabla | Finalidad |
|---|---|
| `roles`, `usuarios` | Cuentas administrativas y sus roles |
| `programas` | Programas académicos |
| `autores` | Estudiantes, docentes, egresados y externos (ORCID, foto) |
| `tipos_publicacion` | Artículo de aporte, revisión de literatura… |
| `revistas` | Revista, ISSN, indexación |
| `publicaciones` | Registro central (estado, DOI único, imagen) |
| `publicaciones_autores` | Autores con orden de autoría y autor de correspondencia |
| `palabras_clave`, `publicaciones_palabras_clave` | Etiquetas |
| `lineas_investigacion`, `publicaciones_lineas` | Líneas de investigación |
| `archivos_publicacion` | PDFs y archivos, con indicador de difusión autorizada |
| `bitacora` | Registro de acciones administrativas |

Las sesiones se guardan en la tabla `sesiones`, creada automáticamente.

---

## API REST

Base: `/publicacionesfi/api`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/public/estadisticas` | Indicadores del portal |
| `GET` | `/public/filtros` | Opciones de filtros del catálogo |
| `GET` | `/public/publicaciones` | Catálogo (`q`, `anio`, `tipo`, `revista`, `programa`, `linea`, `autor`, `orden`, `page`) |
| `GET` | `/public/publicaciones/:slug` | Ficha y publicaciones relacionadas |
| `GET` | `/public/autores/:id` | Perfil público del investigador |
| `GET` | `/public/archivos/:id` | Archivo (solo si está autorizado y publicado) |
| `GET` | `/media/:tipo/:id-:ancho.webp` | Imágenes optimizadas |
| `POST` | `/auth/login` · `/auth/logout` | Sesión |
| `GET` | `/auth/me` | Usuario actual |
| `*` | `/admin/publicaciones[/:id]` | CRUD, `PATCH /:id/estado`, `PATCH /:id/destacado` |
| `POST/DELETE` | `/admin/publicaciones/:id/imagen` | Imagen principal |
| `POST/DELETE` | `/admin/autores/:id/foto` | Foto del investigador |
| `*` | `/admin/{autores,revistas,tipos,programas,lineas,palabras-clave}` | Catálogos |
| `GET` | `/admin/reportes/resumen` · `/admin/reportes/exportar` | Estadísticas y exportación |
| `*` | `/admin/usuarios` · `GET /admin/bitacora` | Solo administradores |

Las peticiones que modifican datos requieren la cabecera `X-Requested-With: fetch` (protección CSRF).

---

## Seguridad

- Contraseñas con **bcrypt** (12 rondas). Sesiones en MySQL con cookie `httpOnly`, `SameSite=Lax`, limitada a `/publicacionesfi`.
- **Límite de intentos de inicio de sesión:** 10 fallos cada 15 minutos por IP.
- Validación de todos los datos con **Zod** y errores sin detalles internos.
- Los archivos se validan por su **contenido real** (firma binaria o decodificación), no por la extensión.
- PDFs **privados por defecto**: solo se publican si se marca la autorización de difusión.
- Cabeceras de seguridad con **Helmet**. La API solo escucha en `127.0.0.1`.
- La base de datos usa un usuario con permisos **solo sobre `publicaciones_fi`**.
- Se recomienda **HTTPS** en producción (`COOKIE_SECURE=true`).

---

## Despliegue en Ubuntu

Ruta propuesta: `/var/www/publicacionesfi/`.

```bash
# 1. Base de datos
mysql -u root -p < deploy/crear_bd.sql

# 2. Backend
cd /var/www/publicacionesfi/backend
cp .env.example .env               # NODE_ENV=production y credenciales
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
npm run seed

# 3. Frontend (genera /var/www/publicacionesfi/public)
cd ../frontend
npm ci && npm run build

# 4. Permisos de escritura para archivos e imágenes
sudo chown -R www-data:www-data /var/www/publicacionesfi/storage

# 5. Servicio systemd
sudo cp ../deploy/publicacionesfi-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now publicacionesfi-api

# 6. Nginx: incluir deploy/nginx-publicacionesfi.conf dentro del server del puerto 8080
sudo nginx -t && sudo systemctl reload nginx
```

- El fragmento de Nginx **se agrega** al `server` existente del puerto 8080, sin sobrescribir otras aplicaciones.
- Todas las rutas de React funcionan al recargar la página gracias a `try_files … /publicacionesfi/index.html`.
- Logs del servicio: `journalctl -u publicacionesfi-api -f`.

---

## Respaldos

```bash
# Base de datos
mysqldump -u root -p --single-transaction publicaciones_fi > respaldo_$(date +%F).sql

# Archivos e imágenes
tar czf storage_$(date +%F).tar.gz -C /var/www/publicacionesfi storage
```

Se recomienda programarlos con `cron` y guardarlos fuera del servidor.

---

<div align="center">

**Facultad de Ingeniería · Universidad Católica Sedes Sapientiae**

</div>
