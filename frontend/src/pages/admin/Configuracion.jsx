import { useRef, useState } from 'react';
import { BookOpenText, Camera, ImagePlus, Library, Loader2, Trash2, Users } from 'lucide-react';
import { api } from '../../api/client.js';
import { useApi, useTitulo } from '../../lib/hooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ErrorCaja, Spinner } from '../../components/ui.jsx';
import { Encabezado } from './AdminLayout.jsx';
import HeroFondo from '../../components/HeroFondo.jsx';

/** Vista previa en miniatura de los totales del hero. */
function VistaPreviaTotales({ activo }) {
  const items = [
    { icono: BookOpenText, etiqueta: 'Publicaciones' },
    { icono: Users, etiqueta: 'Autores' },
    { icono: Library, etiqueta: 'Revistas' },
  ];
  return (
    <div className={`mt-4 rounded-xl bg-marino p-3 transition-opacity duration-300 ${activo ? 'opacity-100' : 'opacity-40 grayscale'}`} aria-hidden="true">
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ icono: Icono, etiqueta }) => (
          <div key={etiqueta} className="flex items-center gap-2 rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-naranja/15 text-naranja">
              <Icono className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none text-white">00</p>
              <p className="truncate text-[10px] text-slate-300">{etiqueta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MAX_MB = 12;

/** Subida de la imagen de fondo del hero, con vista previa igual a la portada. */
function ImagenHero({ imagen, onCambio }) {
  const toast = useToast();
  const input = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const subir = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Seleccione una imagen (JPG, PNG, WEBP o AVIF)');
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`La imagen supera los ${MAX_MB} MB`);
    const form = new FormData();
    form.append('imagen', file);
    setSubiendo(true);
    try {
      onCambio(await api('/admin/configuracion/imagen-hero', { method: 'POST', form }));
      toast.ok('Imagen de portada actualizada');
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
      onCambio(await api('/admin/configuracion/imagen-hero', { method: 'DELETE' }));
      toast.ok('Imagen de portada eliminada');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  const soltar = (e) => {
    e.preventDefault();
    setArrastrando(false);
    if (!subiendo) subir(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="p-5">
      <p className="font-semibold text-slate-800">Imagen de fondo del hero</p>
      <p className="mt-1 text-sm text-slate-500">
        Se muestra detrás del título y el buscador de la portada, con un velo azul para que el texto se lea bien.
      </p>

      {/* Vista previa: mismo fondo y overlay que la portada */}
      <div
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={soltar}
        className={`relative isolate mt-4 aspect-[16/7] overflow-hidden rounded-xl bg-marino ring-2 transition-shadow ${arrastrando ? 'ring-naranja' : 'ring-transparent'}`}
      >
        <HeroFondo imagen={imagen} sizes="(min-width: 768px) 640px, 100vw" />
        <div className="flex h-full flex-col justify-center p-5 sm:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-naranja">Facultad de Ingeniería · UCSS</p>
          <p className="mt-1 max-w-[70%] font-serif text-lg font-bold leading-tight text-white sm:text-2xl">Repositorio de Publicaciones Científicas</p>
          <div className="mt-3 h-6 w-1/2 rounded-md bg-white/90 sm:h-8" />
        </div>
        {!imagen && !subiendo && (
          <button type="button" onClick={() => input.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-marino/40 text-white/90 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100">
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-medium">Haga clic o arrastre una imagen aquí</span>
          </button>
        )}
        {arrastrando && (
          <div className="absolute inset-0 flex items-center justify-center bg-marino/60 text-sm font-semibold text-white">Suelte la imagen para subirla</div>
        )}
        {subiendo && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-marino/70 text-sm text-white">
            <Loader2 className="h-5 w-5 animate-spin text-naranja" /> Optimizando imagen…
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" className="btn-dark" disabled={subiendo} onClick={() => input.current?.click()}>
          <Camera className="h-4 w-4" /> {imagen ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        {imagen && (
          <button type="button" className="btn-outline text-red-600" disabled={subiendo} onClick={quitar}>
            <Trash2 className="h-4 w-4" /> Quitar
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        JPG, PNG, WEBP o AVIF hasta {MAX_MB} MB. Ideal: horizontal, 2560×1440 px o más. Se optimiza a WebP en 4 tamaños
        (768, 1280, 1920 y 2560 px) y cada pantalla descarga solo el que necesita. Sin imagen, se usa el fondo azul institucional.
      </p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden"
        onChange={(e) => subir(e.target.files?.[0])} aria-label="Seleccionar imagen de portada" />
    </div>
  );
}

/** Fila de ajuste con interruptor. */
function AjusteSwitch({ id, titulo, descripcion, activo, guardando, onCambiar, children }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={id} className="cursor-pointer font-semibold text-slate-800">{titulo}</label>
          <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {guardando && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          <input id={id} type="checkbox" role="switch" className="switch" checked={activo} disabled={guardando}
            onChange={(e) => onCambiar(e.target.checked)} />
        </div>
      </div>
      {children}
    </div>
  );
}

export default function Configuracion() {
  useTitulo('Configuración');
  const toast = useToast();
  const { data, setData, cargando, error, recargar } = useApi('/admin/configuracion');
  const [guardando, setGuardando] = useState(null);

  const cambiar = async (clave, valor, mensaje) => {
    const anterior = data;
    setData({ ...data, [clave]: valor }); // cambio inmediato en pantalla
    setGuardando(clave);
    try {
      setData(await api('/admin/configuracion', { method: 'PUT', body: { [clave]: valor } }));
      toast.ok(mensaje);
    } catch (err) {
      setData(anterior); // se revierte si falla
      toast.error(err.message);
    } finally {
      setGuardando(null);
    }
  };

  return (
    <>
      <Encabezado titulo="Configuración" descripcion="Ajustes generales del portal público" />
      {cargando && !data ? <Spinner /> : error ? <ErrorCaja error={error} onReintentar={recargar} /> : (
        <div className="max-w-2xl space-y-6">
          <section className="card">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-marino">Portada</h2>
              <p className="text-sm text-slate-500">Qué se muestra en la página de inicio</p>
            </div>
            <AjusteSwitch
              id="ajuste-totales"
              titulo="Mostrar totales en el hero"
              descripcion="Muestra el número de publicaciones, autores y revistas debajo del buscador de la portada. Conviene activarlo cuando el repositorio tenga más contenido."
              activo={data.mostrarTotalesHero}
              guardando={guardando === 'mostrarTotalesHero'}
              onCambiar={(v) => cambiar('mostrarTotalesHero', v, v ? 'Totales visibles en la portada' : 'Totales ocultos en la portada')}
            >
              <VistaPreviaTotales activo={data.mostrarTotalesHero} />
            </AjusteSwitch>
            <div className="border-t border-slate-200">
              <ImagenHero imagen={data.imagenHero} onCambio={setData} />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
