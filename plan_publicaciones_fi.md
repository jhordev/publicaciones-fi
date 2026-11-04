# Plan de Desarrollo — Sistema de Publicaciones Científicas FI

**Institución:** Facultad de Ingeniería — UCSS  
**Proyecto:** Repositorio de Publicaciones Científicas  
**URL pública obligatoria:** `http://190.119.171.251:8080/publicacionesfi/`  
**Servidor:** Ubuntu Server  
**Stack:** React + Vite, Node.js + Express, MySQL  
**Estado:** Documento de planificación funcional y técnica

---

## 1. Objetivo general

Desarrollar una plataforma web institucional para registrar, organizar, administrar, consultar y difundir las publicaciones académicas y científicas elaboradas por estudiantes, docentes, egresados y colaboradores de la Facultad de Ingeniería.

El sistema centralizará información de artículos publicados en revistas científicas. Funcionará como **repositorio institucional de difusión**; no reemplazará los procesos editoriales ni de revisión por pares de las revistas externas.

### 1.1. Tipos iniciales de publicaciones

- **Artículo de aporte:** contribución académica o investigación original.
- **Artículo de revisión de literatura:** análisis, comparación y síntesis de investigaciones previas.

La clasificación será administrable para incorporar nuevos tipos en el futuro.

### 1.2. Resultados esperados

- Catálogo público de publicaciones de la Facultad.
- Búsqueda por título, autor, revista, palabras clave y año.
- Fichas de artículos con referencias bibliográficas completas.
- Acceso al DOI, enlace oficial y PDF cuando esté autorizada su difusión.
- Panel administrativo con permisos por rol.
- Estadísticas y exportación de información para reportes académicos.

## 2. Arquitectura tecnológica

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| Frontend | React + Vite | Interfaz pública y panel administrativo |
| Estilos | Tailwind CSS | Diseño responsivo e institucional |
| Enrutamiento | React Router | Navegación bajo la subruta obligatoria |
| Backend | Node.js + Express | API REST, autenticación, reglas de negocio |
| Acceso a datos | Prisma ORM | Consultas, relaciones y migraciones |
| Base de datos | MySQL | Persistencia de información estructurada |
| Servidor web | Nginx | Publicación del frontend y proxy inverso de la API |
| Ejecución backend | systemd | Servicio activo y reinicio automático |
| Sistema operativo | Ubuntu Server | Ambiente de producción |

**Flujo:** Navegador → Nginx (`:8080/publicacionesfi/`) → React / API Node.js → MySQL.

React nunca se conectará directamente a MySQL. Las credenciales de base de datos permanecerán exclusivamente en el backend.

## 3. Módulos funcionales

### 3.1. Portal público

- Cabecera institucional con logotipo y navegación principal.
- Sección de bienvenida, buscador y artículos destacados.
- Indicadores generales: publicaciones, autores y revistas.
- Últimas publicaciones registradas y acceso al catálogo.
- Diseño adaptado a computadoras, tabletas y celulares.

### 3.2. Catálogo de publicaciones

- Tarjetas o listado de artículos con título, autores, revista, año y tipo.
- Buscador por título, autor, resumen y palabras clave.
- Filtros por año, tipo, revista y programa académico.
- Ordenamiento por fecha y título.
- Paginación de resultados.

### 3.3. Ficha de publicación

- Título, resumen, idioma y palabras clave.
- Lista completa de autores en el orden correspondiente.
- Afiliaciones, ORCID y autor de correspondencia si están disponibles.
- Revista, ISSN, volumen, número, páginas y fecha de publicación.
- DOI enlazado a su dirección oficial.
- Enlace externo a la publicación original.
- PDF descargable o visualizable solo cuando se cuente con autorización.

### 3.4. Administración

- Inicio de sesión protegido.
- Panel de indicadores y resumen de actividad.
- Registro, edición, revisión, publicación y archivado de artículos.
- Administración de autores, revistas, tipos de publicación, programas y líneas de investigación.
- Carga y gestión de archivos autorizados.
- Gestión de usuarios y roles por administradores.
- Registro de operaciones relevantes en bitácora.

### 3.5. Estadísticas y reportes

- Número de publicaciones por año.
- Distribución por tipo de artículo.
- Producción por programa académico y revista.
- Autores con publicaciones registradas.
- Exportación a CSV o Excel.

## 4. Modelo de datos en MySQL

**Nombre propuesto de la base de datos:** `publicaciones_fi`.

### 4.1. Tablas propuestas

| N.º | Tabla | Finalidad |
|---|---|---|
| 1 | `roles` | Roles de usuario |
| 2 | `usuarios` | Cuentas administrativas |
| 3 | `programas` | Programas académicos |
| 4 | `autores` | Estudiantes, docentes, egresados y autores externos |
| 5 | `tipos_publicacion` | Categorías de artículos |
| 6 | `revistas` | Datos de las revistas científicas |
| 7 | `publicaciones` | Registro principal de artículos |
| 8 | `publicaciones_autores` | Relación varios-a-varios entre artículos y autores |
| 9 | `palabras_clave` | Catálogo de términos |
| 10 | `publicaciones_palabras_clave` | Etiquetas asociadas a artículos |
| 11 | `lineas_investigacion` | Áreas y líneas de investigación |
| 12 | `publicaciones_lineas` | Líneas relacionadas con cada artículo |
| 13 | `archivos_publicacion` | Metadatos y rutas de PDF u otros archivos |
| 14 | `bitacora` | Registro de acciones administrativas |

### 4.2. Campos principales por tabla

#### `roles`

- `id` — Clave primaria.
- `nombre` — Administrador, Editor, etc.
- `descripcion`.
- `created_at`, `updated_at`.

#### `usuarios`

- `id` — Clave primaria.
- `nombres`, `apellidos`.
- `correo` — Único.
- `password_hash` — Contraseña protegida con un algoritmo adecuado.
- `rol_id` — Clave foránea a `roles`.
- `estado` — Activo o inactivo.
- `ultimo_acceso`.
- `created_at`, `updated_at`.

#### `programas`

- `id`, `nombre`, `codigo`, `descripcion`, `estado`.
- `created_at`, `updated_at`.

#### `autores`

- `id`, `nombres`, `apellidos`.
- `tipo_autor` — Estudiante, docente, egresado o externo.
- `correo`, `orcid`, `institucion`.
- `programa_id` — Opcional, cuando corresponda.
- `created_at`, `updated_at`.

#### `tipos_publicacion`

- `id`, `nombre`, `descripcion`, `estado`.
- Registros iniciales: «Artículo de aporte» y «Artículo de revisión de literatura».

#### `revistas`

- `id`, `nombre`, `editorial`.
- `issn_impreso`, `issn_electronico`.
- `pais`, `url_revista`, `indexacion`, `descripcion`, `estado`.
- `created_at`, `updated_at`.

#### `publicaciones` (tabla central)

- `id` — Clave primaria.
- `titulo`, `slug` — Identificador legible y único para URL.
- `resumen`, `idioma`.
- `tipo_publicacion_id` — Clave foránea.
- `revista_id` — Clave foránea.
- `programa_id` — Clave foránea.
- `anio_publicacion`, `fecha_publicacion`.
- `volumen`, `numero`, `paginas`.
- `doi` — Único cuando exista; opcional.
- `url_publicacion` — Enlace a la publicación original.
- `estado` — `borrador`, `revision`, `publicado` o `archivado`.
- `destacado` — Indicador de artículo destacado.
- `creado_por` — Clave foránea a `usuarios`.
- `created_at`, `updated_at`.

#### `publicaciones_autores`

- `id`, `publicacion_id`, `autor_id`.
- `orden_autoria` — Posición del autor en la publicación.
- `es_autor_correspondencia` — Indicador opcional.
- Restricción de unicidad por `(publicacion_id, autor_id)`.

#### `palabras_clave`

- `id`, `nombre`, `slug`.

#### `publicaciones_palabras_clave`

- `publicacion_id`, `palabra_clave_id` — Clave primaria compuesta.

#### `lineas_investigacion`

- `id`, `nombre`, `descripcion`, `estado`.

#### `publicaciones_lineas`

- `publicacion_id`, `linea_id` — Clave primaria compuesta.

#### `archivos_publicacion`

- `id`, `publicacion_id`.
- `nombre_original`, `ruta_archivo`, `tipo_mime`, `tamano`.
- `tipo_archivo` — PDF, portada u otro tipo permitido.
- `created_at`.

#### `bitacora`

- `id`, `usuario_id`, `accion`, `entidad`, `registro_id`.
- `detalle`, `created_at`.

### 4.3. Relaciones y reglas

- Un **rol** tiene muchos usuarios; cada usuario tiene un rol.
- Un **programa académico** tiene muchos autores y publicaciones.
- Un **tipo de publicación** clasifica muchas publicaciones.
- Una **revista** contiene muchas publicaciones.
- Una **publicación** puede tener varios autores y viceversa, mediante `publicaciones_autores`.
- Una **publicación** puede tener varias palabras clave y varias líneas de investigación.
- Una **publicación** puede tener varios archivos asociados.
- Las claves foráneas preservarán la consistencia referencial.
- Se agregarán índices para título, año, estado, revista y búsquedas frecuentes.
- El DOI será opcional, evitando duplicados en los registros que lo contengan.
- La eliminación de registros con relaciones debe controlarse; se privilegiará archivar las publicaciones para conservar el historial.

## 5. Roles y permisos

| Acción | Administrador | Editor / Coordinación | Visitante |
|---|:---:|:---:|:---:|
| Consultar publicaciones públicas | Sí | Sí | Sí |
| Registrar publicaciones | Sí | Sí | No |
| Editar publicaciones | Sí | Sí | No |
| Revisar y publicar | Sí | Sí | No |
| Administrar catálogos | Sí | Sí | No |
| Gestionar usuarios y roles | Sí | No | No |
| Consultar bitácora | Sí | No | No |
| Generar reportes | Sí | Sí | No |

**Ampliación futura:** rol Estudiante para proponer registros sujetos a revisión interna antes de aparecer en el repositorio.

## 6. Diseño de interfaz

### 6.1. Identidad visual

- **Naranja institucional:** `#FD8401`.
- **Azul marino:** `#122B4A`.
- **Fondo:** `#F4F6F9`.
- **Tarjetas:** blanco, bordes suaves y jerarquía tipográfica clara.
- Componentes responsivos y accesibles: contraste adecuado, navegación por teclado y estados visibles.

### 6.2. Página de inicio

1. Encabezado con logotipo de la Facultad, navegación y acceso administrativo.
2. Hero con el título «Repositorio de Publicaciones Científicas».
3. Buscador central de artículos, autores y revistas.
4. Indicadores de publicaciones, autores y revistas.
5. Publicaciones recientes y destacadas.
6. Pie de página con información institucional.

### 6.3. Catálogo de artículos

- Escritorio: filtros a la izquierda y resultados en el área principal.
- Celular: filtros desplegables, tarjetas apiladas y botones de fácil lectura.
- Cada tarjeta mostrará título, tipo, autores, revista, año y enlace «Ver detalle».

### 6.4. Ficha de artículo

- Título y categoría en la parte superior.
- Autores con afiliación y enlaces ORCID disponibles.
- Resumen completo y palabras clave.
- Metadatos de la publicación.
- Botones «Ver artículo original», «Abrir DOI» y «Ver PDF» cuando existan.

### 6.5. Panel administrativo

- Menú lateral: Dashboard, Publicaciones, Autores, Revistas, Catálogos, Reportes, Usuarios y Bitácora.
- Tabla de publicaciones con filtros por estado y acciones controladas por permisos.
- Formulario de registro dividido en secciones: datos generales, revista, autores, clasificación, enlaces y archivos.
- Confirmaciones antes de operaciones que modifiquen estados o archiven artículos.

## 7. Despliegue en Ubuntu y subruta obligatoria

### 7.1. Dirección pública

La dirección de entrada será permanentemente:

`http://190.119.171.251:8080/publicacionesfi/`

No deberá redirigir al usuario a la raíz `/` del servidor ni romper recursos estáticos por utilizar rutas absolutas incorrectas.

### 7.2. Estructura física propuesta

```text
/var/www/publicacionesfi/
├── public/                   # Build compilado de React (único frontend servido)
│   ├── index.html
│   └── assets/
├── frontend/                 # Código fuente React
│   ├── src/
│   ├── vite.config.js
│   └── package.json
├── backend/                  # API Node.js + Express
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env                   # No exponer públicamente
└── storage/                  # PDFs y documentos protegidos
```

El código del backend, el archivo `.env` y los documentos privados **no estarán dentro de `public/`**.

### 7.3. Rutas planificadas

| Servicio | Ruta pública |
|---|---|
| Portada | `/publicacionesfi/` |
| Catálogo | `/publicacionesfi/publicaciones` |
| Detalle de artículo | `/publicacionesfi/publicaciones/:slug` |
| Inicio de sesión | `/publicacionesfi/login` |
| Panel | `/publicacionesfi/admin` |
| API | `/publicacionesfi/api/` |

### 7.4. Configuración necesaria

**React / Vite**

- Ajustar `base` a `/publicacionesfi/` al compilar.
- Configurar React Router con `basename="/publicacionesfi"`.
- Utilizar rutas relativas a la subruta correcta en los enlaces y recursos.
- Compilar el frontend y publicar su contenido en `/var/www/publicacionesfi/public/`.

**Node.js / Express**

- Backend ejecutado como servicio interno, por ejemplo en `127.0.0.1:3001`.
- Endpoints internos agrupados en `/api/`.
- Variables de entorno para base de datos, sesiones y configuración.
- API no expuesta directamente a Internet; acceso mediante proxy inverso.

**Nginx**

- Conservar el puerto público `8080` y coexistir con cualquier aplicación ya existente.
- Servir el frontend desde `/publicacionesfi/`.
- Enviar `/publicacionesfi/api/*` al backend interno como `/api/*`.
- Configurar el fallback de las rutas de React hacia el `index.html` de esta aplicación.
- Asegurar que `/publicacionesfi` redirija de forma consistente a `/publicacionesfi/`.
- Integrar la nueva ubicación en la configuración actual **sin sobrescribir servicios existentes**.

**MySQL**

- Base `publicaciones_fi` y usuario de aplicación con permisos mínimos.
- Acceso preferentemente por `localhost` o red privada.
- Migraciones administradas mediante Prisma.

**systemd**

- Servicio persistente para la API.
- Arranque automático con Ubuntu y reinicio ante fallos.
- Registro de logs y supervisión de errores.

### 7.5. Seguridad y operación

- Contraseñas almacenadas con hash seguro.
- Autenticación basada en sesiones seguras y autorización por rol.
- Validación de datos recibidos y archivos subidos.
- Restricción de tipos, tamaño y acceso de los PDFs.
- Protección contra intentos repetidos de inicio de sesión.
- Manejo de errores sin revelar datos internos.
- Respaldos programados de MySQL y de archivos.
- HTTPS recomendado y necesario para usar credenciales reales de forma segura; la URL inicial HTTP queda como referencia de despliegue, no como configuración de seguridad definitiva.
- Confirmar disponibilidad y configuración actual del puerto `8080` antes de introducir el sitio.

## 8. Flujo administrativo de una publicación

1. **Registrar:** agregar título, resumen, tipo, idioma, año y datos de la publicación.
2. **Vincular:** seleccionar revista, programa, autores, palabras clave y líneas de investigación.
3. **Adjuntar:** ingresar DOI, enlace oficial y archivos autorizados.
4. **Revisar:** verificar exactitud bibliográfica, duplicados y permisos de difusión.
5. **Publicar:** cambiar el estado a `publicado`, haciéndola visible en el catálogo.
6. **Actualizar o archivar:** conservar el historial cuando se requieran cambios posteriores.

La aprobación interna significa que la información puede mostrarse en el repositorio; no sustituye la aceptación de una revista científica.

## 9. Plan de desarrollo por etapas

| Etapa | Entregable |
|---|---|
| 1. Inicio | Estructura React, Node.js, MySQL y convenciones de proyecto |
| 2. Datos | Esquema de tablas, relaciones y migraciones |
| 3. Seguridad | Login, roles y permisos |
| 4. Administración | CRUD de artículos, autores, revistas y catálogos |
| 5. Portal | Inicio, buscador, filtros y ficha de publicación |
| 6. Complementos | Archivos, estadísticas y reportes |
| 7. Calidad | Pruebas de permisos, validaciones, carga, seguridad y navegación |
| 8. Producción | Build de React, Nginx, systemd, MySQL y respaldos |

## 10. Criterios de aceptación

El proyecto se considerará listo para su primera entrega cuando:

- El portal abra correctamente en `http://190.119.171.251:8080/publicacionesfi/`.
- Todas las rutas internas funcionen al navegar y al recargar la página.
- Los recursos estáticos carguen bajo `/publicacionesfi/`.
- La API responda bajo `/publicacionesfi/api/`.
- El administrador pueda registrar y publicar un artículo con varios autores.
- El visitante pueda buscar artículos y consultar su ficha sin autenticarse.
- Los documentos se muestren o descarguen solo cuando corresponda.
- Los usuarios sin permisos no accedan a operaciones administrativas.
- El servicio backend continúe activo tras reiniciar Ubuntu.
- La incorporación de este sistema no interrumpa otras aplicaciones del puerto `8080`.

## 11. Posibles mejoras futuras

- Portal de propuestas de publicaciones presentadas por estudiantes.
- Importación de metadatos desde DOI y otras fuentes bibliográficas.
- Exportación de referencias BibTeX y formatos de citación.
- Indicadores ampliados para informes de investigación y acreditación.
- Identificadores persistentes y perfiles académicos de autores.
- Búsqueda avanzada por texto completo cuando exista permiso para indexar el contenido.

---

**Conclusión:** Se plantea un repositorio web de publicaciones científicas administrable, responsivo y escalable, basado en React, Node.js y MySQL. Su despliegue utilizará Ubuntu y Nginx, manteniendo permanentemente la subruta `/publicacionesfi/` como raíz pública de la aplicación.
