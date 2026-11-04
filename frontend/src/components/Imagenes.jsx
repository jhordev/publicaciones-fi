import { useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2, UserRound } from 'lucide-react';
import { api, API_BASE } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

/** Tamaños generados por el servidor (deben coincidir con backend/src/lib/imagenes.js). */
export const ANCHOS = { publicaciones: [640, 1280, 1920], autores: [96, 256, 512], portada: [768, 1280, 1920, 2560] };

export const urlMedia = (tipo, id, ancho) => `${API_BASE}/media/${tipo}/${id}-${ancho}.webp`;
export const srcSet = (tipo, id) => ANCHOS[tipo].map((w) => `${urlMedia(tipo, id, w)} ${w}w`).join(', ');

/**
 * Imagen principal de una publicación (16:9, WebP responsivo).
 * sizes: ancho con que se muestra, para que el navegador descargue solo el tamaño necesario.
 */
export function ImagenPublicacion({ id, alt = '', sizes = '100vw', className = '', prioridad = false }) {
  return (
    <img
      src={urlMedia('publicaciones', id, 1280)}
      srcSet={srcSet('publicaciones', id)}
      sizes={sizes}
      alt={alt}
      width={1280}
      height={720}
      loading={prioridad ? 'eager' : 'lazy'}
      fetchPriority={prioridad ? 'high' : 'auto'}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}

const COLORES = ['bg-marino text-white', 'bg-naranja text-white', 'bg-sky-700 text-white', 'bg-emerald-700 text-white', 'bg-violet-700 text-white'];
const iniciales = (a) => `${a.nombres?.[0] ?? ''}${a.apellidos?.[0] ?? ''}`.toUpperCase();

/**
 * Foto del investigador. `px` es el tamaño visual; el srcset entrega 96/256/512 según
 * la densidad de pantalla (un avatar de 40px usa la de 96; un perfil de 224px usa la de 512 en retina).
 */
export function Avatar({ autor, px = 40, className = '' }) {
  const estilo = { width: px, height: px };
  if (!autor?.foto) {
    const color = COLORES[(autor?.id ?? 0) % COLORES.length];
    return (
      <span className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${color} ${className}`}
        style={{ ...estilo, fontSize: Math.max(11, px * 0.36) }} aria-hidden="true">
        {iniciales(autor ?? {}) || <UserRound className="h-1/2 w-1/2" />}
      </span>
    );
  }
  return (
    <img
      src={urlMedia('autores', autor.foto, px <= 48 ? 96 : px <= 128 ? 256 : 512)}
      srcSet={srcSet('autores', autor.foto)}
      sizes={`${px}px`}
      width={px}
      height={px}
      alt={`Foto de ${autor.nombres} ${autor.apellidos}`}
      loading="lazy"
      decoding="async"
      className={`shrink-0 rounded-full bg-slate-200 object-cover ${className}`}
      style={estilo}
    />
  );
}

/**
 * Carga de imagen para el panel: sube el archivo original y el servidor genera las versiones WebP.
 * tipo: 'publicaciones' | 'autores'
 */
export function SubirImagen({ tipo, endpoint, valor, autor, onCambio }) {
  const toast = useToast();
  const input = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const esFoto = tipo === 'autores';

  const subir = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Seleccione una imagen (JPG, PNG, WEBP o AVIF)');
    if (file.size > 12 * 1024 * 1024) return toast.error('La imagen supera los 12 MB');
    const form = new FormData();
    form.append('imagen', file);
    setSubiendo(true);
    try {
      const r = await api(endpoint, { method: 'POST', form });
      toast.ok(esFoto ? 'Foto actualizada' : 'Imagen principal actualizada');
      onCambio(r[esFoto ? 'foto' : 'imagen']);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = '';
    }
  };

  const quitar = async () => {
    setSubiendo(true);
    try {
      await api(endpoint, { method: 'DELETE' });
      toast.ok(esFoto ? 'Foto eliminada' : 'Imagen eliminada');
      onCambio(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className={`flex gap-5 ${esFoto ? 'flex-col items-center sm:flex-row' : 'flex-col'}`}>
      <div className="relative">
        {esFoto ? (
          <Avatar autor={{ ...autor, foto: valor }} px={128} className="ring-4 ring-white shadow" />
        ) : valor ? (
          <ImagenPublicacion id={valor} sizes="(min-width: 1024px) 640px, 100vw" className="aspect-video w-full rounded-lg" />
        ) : (
          <button type="button" onClick={() => input.current?.click()}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-fondo text-slate-500 hover:border-naranja hover:text-naranja">
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-medium">Agregar imagen principal</span>
          </button>
        )}
        {subiendo && (
          <div className={`absolute inset-0 flex items-center justify-center bg-white/70 ${esFoto ? 'rounded-full' : 'rounded-lg'}`}>
            <Loader2 className="h-6 w-6 animate-spin text-naranja" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-dark" disabled={subiendo} onClick={() => input.current?.click()}>
            <Camera className="h-4 w-4" /> {valor ? 'Cambiar' : esFoto ? 'Subir foto' : 'Subir imagen'}
          </button>
          {valor && (
            <button type="button" className="btn-outline text-red-600" disabled={subiendo} onClick={quitar}>
              <Trash2 className="h-4 w-4" /> Quitar
            </button>
          )}
        </div>
        <p className="max-w-sm text-xs text-slate-500">
          {esFoto
            ? 'JPG, PNG, WEBP o AVIF hasta 12 MB. Se recorta en cuadrado centrado en el rostro y se optimiza a WebP en 3 tamaños (96, 256 y 512 px).'
            : 'JPG, PNG, WEBP o AVIF hasta 12 MB (ideal 1920×1080 o más). Se recorta a 16:9 y se optimiza a WebP en 3 tamaños (640, 1280 y 1920 px).'}
        </p>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
        onChange={(e) => subir(e.target.files?.[0])} aria-label={esFoto ? 'Seleccionar foto' : 'Seleccionar imagen'} />
    </div>
  );
}
