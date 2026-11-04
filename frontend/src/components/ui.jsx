import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from 'lucide-react';
import { ESTADOS } from '../lib/format.js';

export function Spinner({ texto = 'Cargando…', className = '' }) {
  return (
    <div className={`flex animate-aparecer-tarde items-center justify-center gap-2 py-12 text-sm text-slate-500 ${className}`} role="status">
      <Loader2 className="h-5 w-5 animate-spin text-naranja" /> {texto}
    </div>
  );
}

export function Vacio({ titulo = 'Sin resultados', texto, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <Inbox className="mb-3 h-10 w-10 text-slate-300" />
      <p className="font-semibold text-slate-700">{titulo}</p>
      {texto && <p className="mt-1 max-w-md text-sm text-slate-500">{texto}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function ErrorCaja({ error, onReintentar }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-red-500" />
      <p className="text-sm text-slate-600">{error?.message || 'No se pudo cargar la información.'}</p>
      {onReintentar && <button className="btn-outline btn-sm" onClick={onReintentar}>Reintentar</button>}
    </div>
  );
}

export function EstadoBadge({ estado }) {
  const e = ESTADOS[estado] ?? { label: estado, clase: 'bg-slate-100' };
  return <span className={`badge ${e.clase}`}>{e.label}</span>;
}

export function Paginacion({ page, pages, total, onChange }) {
  if (!pages || pages <= 1) return total ? <p className="text-sm text-slate-500">{total} resultado(s)</p> : null;
  const nums = [];
  const ini = Math.max(1, page - 2);
  const fin = Math.min(pages, page + 2);
  for (let i = ini; i <= fin; i++) nums.push(i);
  return (
    <nav className="flex flex-wrap items-center justify-between gap-3" aria-label="Paginación">
      <p className="text-sm text-slate-500">{total} resultado(s) · página {page} de {pages}</p>
      <div className="flex items-center gap-1">
        <button className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {ini > 1 && <span className="px-1 text-slate-400">…</span>}
        {nums.map((n) => (
          <button key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}
            className={`btn-sm btn ${n === page ? 'bg-marino text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
            {n}
          </button>
        ))}
        {fin < pages && <span className="px-1 text-slate-400">…</span>}
        <button className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}

export function Modal({ abierto, titulo, onCerrar, children, ancho = 'max-w-lg', pie }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector('input,select,textarea,button')?.focus(), 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [abierto, onCerrar]);
  if (!abierto) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-marino/50 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="modal-titulo"
        className={`flex max-h-[92vh] w-full ${ancho} flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="modal-titulo" className="text-lg font-semibold text-marino">{titulo}</h2>
          <button type="button" onClick={onCerrar} className="btn-ghost btn-sm" aria-label="Cerrar"><X className="h-5 w-5" /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">{pie}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Confirmar({ abierto, titulo = 'Confirmar', mensaje, textoConfirmar = 'Confirmar', peligro, cargando, onConfirmar, onCerrar }) {
  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCerrar} ancho="max-w-md"
      pie={<>
        <button type="button" className="btn-outline" onClick={onCerrar} disabled={cargando}>Cancelar</button>
        <button type="button" className={peligro ? 'btn-danger' : 'btn-dark'} onClick={onConfirmar} disabled={cargando}>
          {cargando && <Loader2 className="h-4 w-4 animate-spin" />} {textoConfirmar}
        </button>
      </>}>
      <p className="text-sm text-slate-600">{mensaje}</p>
    </Modal>
  );
}

/** Campo de formulario con etiqueta y mensaje de error. */
export function Campo({ label, error, requerido, ayuda, children, className = '' }) {
  return (
    <div className={className}>
      {label && <span className="label">{label}{requerido && <span className="text-red-600"> *</span>}</span>}
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

/** Convierte los detalles de validación del backend en { campo: mensaje }. */
export function erroresPorCampo(err) {
  const out = {};
  (err?.details ?? []).forEach((d) => { if (!out[d.campo]) out[d.campo] = d.mensaje; });
  return out;
}
