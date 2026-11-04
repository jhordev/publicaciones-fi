import { useEffect, useState } from 'react';
import { Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, qs } from '../api/client.js';
import { useApi, useDebounce } from '../lib/hooks.js';
import { useToast } from '../context/ToastContext.jsx';
import { Campo, Confirmar, ErrorCaja, Modal, Paginacion, Spinner, Vacio, erroresPorCampo } from './ui.jsx';

/** Carga las opciones de los campos select que dependen de otro catálogo. */
function useOpciones(campos) {
  const [opciones, setOpciones] = useState({});
  const fuentes = campos.filter((c) => c.fuente).map((c) => c.fuente).join('|');
  useEffect(() => {
    campos.filter((c) => c.fuente).forEach((c) => {
      api(c.fuente).then((d) => setOpciones((o) => ({
        ...o,
        [c.nombre]: d.items.map((i) => ({ value: i.id, label: c.etiquetaOpcion ? c.etiquetaOpcion(i) : i.nombre })),
      }))).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuentes]);
  return opciones;
}

export function CamposFormulario({ campos, valores, setValores, errores }) {
  const opciones = useOpciones(campos);
  const set = (k, v) => setValores((x) => ({ ...x, [k]: v }));
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campos.map((c) => {
        const id = `campo-${c.nombre}`;
        const props = { id, className: 'input', value: valores[c.nombre] ?? '', onChange: (e) => set(c.nombre, e.target.value) };
        let control;
        if (c.tipo === 'textarea') control = <textarea rows={3} {...props} />;
        else if (c.tipo === 'select') {
          const ops = c.opciones ?? opciones[c.nombre] ?? [];
          control = (
            <select {...props}>
              {!c.requerido || c.vacio ? <option value="">{c.vacio ?? '— Ninguno —'}</option> : <option value="" disabled>Seleccione…</option>}
              {ops.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          );
        } else control = <input type={c.tipo ?? 'text'} placeholder={c.placeholder} {...props} />;
        return (
          <div key={c.nombre} className={c.ancho === 'completo' || c.tipo === 'textarea' ? 'sm:col-span-2' : ''}>
            <label htmlFor={id} className="label">{c.label}{c.requerido && <span className="text-red-600"> *</span>}</label>
            {control}
            {c.ayuda && !errores[c.nombre] && <p className="mt-1 text-xs text-slate-500">{c.ayuda}</p>}
            {errores[c.nombre] && <p className="mt-1 text-xs text-red-600">{errores[c.nombre]}</p>}
          </div>
        );
      })}
    </div>
  );
}

const valoresIniciales = (campos, registro) =>
  Object.fromEntries(campos.map((c) => [c.nombre, registro?.[c.nombre] ?? c.defecto ?? '']));

/** Modal de creación/edición de un registro de catálogo. */
export function FormularioRegistro({ abierto, ruta, campos, registro, titulo, onGuardado, onCerrar }) {
  const toast = useToast();
  const [valores, setValores] = useState(() => valoresIniciales(campos, registro));
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (abierto) {
      setValores(valoresIniciales(campos, registro));
      setErrores({});
      setError('');
    }
  }, [abierto, registro, campos]);

  const guardar = async (e) => {
    e.preventDefault();
    // Evita que el envío llegue a un formulario padre (el modal puede abrirse dentro de otro formulario)
    e.stopPropagation();
    setGuardando(true);
    setErrores({});
    setError('');
    try {
      const body = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
      const res = registro
        ? await api(`${ruta}/${registro.id}`, { method: 'PUT', body })
        : await api(ruta, { method: 'POST', body });
      toast.ok(registro ? 'Cambios guardados' : 'Registro creado');
      onGuardado(res);
    } catch (err) {
      setErrores(erroresPorCampo(err));
      setError(err.details ? 'Revise los campos marcados.' : err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={guardar} noValidate>
        <CamposFormulario campos={campos} valores={valores} setValores={setValores} errores={errores} />
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onCerrar}>Cancelar</button>
          <button className="btn-dark" disabled={guardando}>{guardando && <Loader2 className="h-4 w-4 animate-spin" />} Guardar</button>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Pantalla CRUD genérica para catálogos (autores, revistas, tipos, programas, líneas…).
 * columnas: [{ titulo, valor: (r) => node, clase }]
 */
export default function CrudCatalogo({ ruta, singular, campos, columnas, filtrosExtra, renderFiltros, acciones }) {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({});
  const [editando, setEditando] = useState(undefined); // undefined = cerrado, null = nuevo
  const [eliminar, setEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const qDeb = useDebounce(q);
  const { data, cargando, error, recargar } = useApi(`${ruta}${qs({ q: qDeb, page, ...filtrosExtra, ...filtros })}`);

  useEffect(() => { setPage(1); }, [qDeb, filtros]);

  const confirmarEliminar = async () => {
    setEliminando(true);
    try {
      await api(`${ruta}/${eliminar.id}`, { method: 'DELETE' });
      toast.ok('Registro eliminado');
      setEliminar(null);
      recargar();
    } catch (err) {
      toast.error(err.message);
      setEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type="search" className="input pl-9" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Buscar ${singular}`} />
          </div>
          {renderFiltros?.(filtros, setFiltros)}
        </div>
        <button className="btn-primary" onClick={() => setEditando(null)}><Plus className="h-4 w-4" /> Nuevo {singular}</button>
      </div>

      <div className="card overflow-hidden">
        {error ? <ErrorCaja error={error} onReintentar={recargar} /> : cargando && !data ? <Spinner /> : !data?.items.length ? (
          <Vacio titulo="Sin registros" texto={q ? 'Ningún registro coincide con la búsqueda.' : `Aún no hay ${singular}s registrados.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-fondo text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columnas.map((c) => <th key={c.titulo} className={`px-4 py-3 ${c.clase ?? ''}`}>{c.titulo}</th>)}
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((r) => (
                  <tr key={r.id} className="hover:bg-fondo/60">
                    {columnas.map((c) => <td key={c.titulo} className={`px-4 py-3 ${c.clase ?? ''}`}>{c.valor(r)}</td>)}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {acciones?.(r, recargar)}
                        <button className="btn-ghost btn-sm" onClick={() => setEditando(r)} title="Editar" aria-label={`Editar ${singular}`}><Pencil className="h-4 w-4" /></button>
                        <button className="btn-ghost btn-sm text-red-600" onClick={() => setEliminar(r)} title="Eliminar" aria-label={`Eliminar ${singular}`}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && <div className="mt-4"><Paginacion page={data.page} pages={data.pages} total={data.total} onChange={setPage} /></div>}

      <FormularioRegistro
        abierto={editando !== undefined}
        ruta={ruta}
        campos={campos}
        registro={editando}
        titulo={editando ? `Editar ${singular}` : `Nuevo ${singular}`}
        onGuardado={() => { setEditando(undefined); recargar(); }}
        onCerrar={() => setEditando(undefined)}
      />
      <Confirmar
        abierto={!!eliminar}
        titulo={`Eliminar ${singular}`}
        mensaje="¿Desea eliminar este registro? Si está relacionado con publicaciones no podrá eliminarse; en ese caso puede marcarlo como inactivo."
        textoConfirmar="Eliminar"
        peligro
        cargando={eliminando}
        onConfirmar={confirmarEliminar}
        onCerrar={() => setEliminar(null)}
      />
    </>
  );
}

export { Campo };
