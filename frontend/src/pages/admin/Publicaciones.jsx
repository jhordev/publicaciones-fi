import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Archive, CheckCircle2, Eye, FilePen, Pencil, Plus, RotateCcw, Search, Send, Star, Trash2 } from 'lucide-react';
import { api, qs } from '../../api/client.js';
import { useApi, useTitulo } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { ESTADOS, fecha, listaAutoresCorta } from '../../lib/format.js';
import { Confirmar, ErrorCaja, EstadoBadge, Paginacion, Spinner, Vacio } from '../../components/ui.jsx';
import { Encabezado } from './AdminLayout.jsx';

/** Acciones de cambio de estado disponibles según el estado actual. */
const ACCIONES = {
  borrador: [
    { estado: 'revision', label: 'Enviar a revisión', icono: Send },
    { estado: 'publicado', label: 'Publicar', icono: CheckCircle2 },
    { estado: 'archivado', label: 'Archivar', icono: Archive },
  ],
  revision: [
    { estado: 'publicado', label: 'Publicar', icono: CheckCircle2 },
    { estado: 'borrador', label: 'Devolver a borrador', icono: FilePen },
    { estado: 'archivado', label: 'Archivar', icono: Archive },
  ],
  publicado: [
    { estado: 'revision', label: 'Retirar a revisión', icono: RotateCcw },
    { estado: 'archivado', label: 'Archivar', icono: Archive },
  ],
  archivado: [
    { estado: 'publicado', label: 'Volver a publicar', icono: CheckCircle2 },
    { estado: 'borrador', label: 'Pasar a borrador', icono: FilePen },
  ],
};

const MENSAJES = {
  publicado: 'La publicación será visible para todos en el catálogo público.',
  archivado: 'La publicación dejará de mostrarse en el portal, pero se conservará su historial.',
  revision: 'La publicación quedará pendiente de revisión y no será visible en el portal.',
  borrador: 'La publicación volverá a estado borrador y no será visible en el portal.',
};

export default function Publicaciones() {
  useTitulo('Publicaciones');
  const toast = useToast();
  const { esAdmin } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [accion, setAccion] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const params = Object.fromEntries(sp.entries());
  const { data, cargando, error, recargar } = useApi(`/admin/publicaciones${qs(params)}`);

  const actualizar = (cambios) => {
    const next = new URLSearchParams(sp);
    Object.entries(cambios).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in cambios)) next.delete('page');
    setSp(next);
  };

  const ejecutar = async () => {
    setProcesando(true);
    try {
      if (accion.tipo === 'eliminar') {
        await api(`/admin/publicaciones/${accion.p.id}`, { method: 'DELETE' });
        toast.ok('Publicación eliminada');
      } else {
        await api(`/admin/publicaciones/${accion.p.id}/estado`, { method: 'PATCH', body: { estado: accion.estado } });
        toast.ok(`Estado actualizado: ${ESTADOS[accion.estado].label}`);
      }
      setAccion(null);
      recargar();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const destacar = async (p) => {
    try {
      await api(`/admin/publicaciones/${p.id}/destacado`, { method: 'PATCH', body: { destacado: !p.destacado } });
      recargar();
    } catch (err) { toast.error(err.message); }
  };

  const estadoActual = sp.get('estado') ?? '';
  const total = data ? Object.values(data.porEstado).reduce((a, b) => a + b, 0) : 0;

  return (
    <>
      <Encabezado titulo="Publicaciones" descripcion="Registro, revisión, publicación y archivo de artículos">
        <Link to="/admin/publicaciones/nueva" className="btn-primary"><Plus className="h-4 w-4" /> Nueva publicación</Link>
      </Encabezado>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {[['', 'Todas', total], ...Object.entries(ESTADOS).map(([k, v]) => [k, v.label, data?.porEstado[k] ?? 0])].map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={estadoActual === k} onClick={() => actualizar({ estado: k })}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2 text-sm font-medium ${estadoActual === k ? 'border-naranja text-marino' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {label} <span className="ml-1 text-xs text-slate-400">{data ? n : ''}</span>
          </button>
        ))}
      </div>

      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); actualizar({ q: q.trim() }); }}>
        <div className="relative flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" className="input pl-9" placeholder="Buscar por título, autor, DOI…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar publicaciones" />
        </div>
        <button className="btn-outline">Buscar</button>
      </form>

      <div className="card overflow-hidden">
        {error ? <ErrorCaja error={error} onReintentar={recargar} /> : cargando && !data ? <Spinner /> : !data.items.length ? (
          <Vacio titulo="No hay publicaciones" texto={sp.toString() ? 'Ninguna publicación coincide con los filtros.' : 'Registre la primera publicación.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-fondo text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Publicación</th>
                  <th className="hidden px-4 py-3 md:table-cell">Año</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="hidden px-4 py-3 lg:table-cell">Actualizado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((p) => (
                  <tr key={p.id} className="align-top hover:bg-fondo/60">
                    <td className="max-w-xl px-4 py-3">
                      <Link to={`/admin/publicaciones/${p.id}`} className="font-medium text-slate-800 hover:text-naranja-600">{p.titulo}</Link>
                      <p className="mt-0.5 text-xs text-slate-500">{listaAutoresCorta(p.autores, 3)}</p>
                      <p className="text-xs text-slate-400">{p.tipo.nombre}{p.revista ? ` · ${p.revista.nombre}` : ''}</p>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">{p.anioPublicacion}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={p.estado} /></td>
                    <td className="hidden whitespace-nowrap px-4 py-3 text-slate-500 lg:table-cell">{fecha(p.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <button onClick={() => destacar(p)} className={`btn-ghost btn-sm ${p.destacado ? 'text-amber-500' : 'text-slate-400'}`}
                          title={p.destacado ? 'Quitar de destacados' : 'Marcar como destacado'} aria-pressed={p.destacado}>
                          <Star className={`h-4 w-4 ${p.destacado ? 'fill-current' : ''}`} />
                        </button>
                        {p.estado === 'publicado' && (
                          <Link to={`/publicaciones/${p.slug}`} target="_blank" className="btn-ghost btn-sm" title="Ver en el portal"><Eye className="h-4 w-4" /></Link>
                        )}
                        <Link to={`/admin/publicaciones/${p.id}`} className="btn-ghost btn-sm" title="Editar"><Pencil className="h-4 w-4" /></Link>
                        {ACCIONES[p.estado].map((a) => (
                          <button key={a.estado} onClick={() => setAccion({ tipo: 'estado', p, ...a })} className="btn-ghost btn-sm" title={a.label}>
                            <a.icono className="h-4 w-4" />
                          </button>
                        ))}
                        {esAdmin && p.estado === 'borrador' && (
                          <button onClick={() => setAccion({ tipo: 'eliminar', p })} className="btn-ghost btn-sm text-red-600" title="Eliminar borrador">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && <div className="mt-4"><Paginacion page={data.page} pages={data.pages} total={data.total} onChange={(page) => actualizar({ page: String(page) })} /></div>}

      <Confirmar
        abierto={!!accion}
        titulo={accion?.tipo === 'eliminar' ? 'Eliminar borrador' : accion?.label}
        mensaje={accion && (accion.tipo === 'eliminar'
          ? `Se eliminará definitivamente «${accion.p.titulo}» y sus archivos. Esta acción no se puede deshacer.`
          : `«${accion.p.titulo}»: ${MENSAJES[accion.estado]}`)}
        textoConfirmar={accion?.tipo === 'eliminar' ? 'Eliminar' : accion?.label}
        peligro={accion?.tipo === 'eliminar'}
        cargando={procesando}
        onConfirmar={ejecutar}
        onCerrar={() => setAccion(null)}
      />
    </>
  );
}
