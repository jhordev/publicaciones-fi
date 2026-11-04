import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Search, X } from 'lucide-react';
import { useApi, useTitulo } from '../lib/hooks.js';
import { qs } from '../api/client.js';
import PublicacionCard from '../components/PublicacionCard.jsx';
import { ErrorCaja, Paginacion, Spinner, Vacio } from '../components/ui.jsx';

const FILTROS = ['anio', 'tipo', 'revista', 'programa', 'linea'];

function Select({ id, label, value, onChange, opciones, todos = 'Todos' }) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{todos}</option>
        {opciones.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export default function Catalogo() {
  useTitulo('Catálogo de publicaciones');
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') ?? '');
  const [verFiltros, setVerFiltros] = useState(false);
  const params = Object.fromEntries(sp.entries());
  const { data: filtros } = useApi('/public/filtros');
  const { data, cargando, error, recargar } = useApi(`/public/publicaciones${qs({ ...params, limit: 12 })}`);

  useEffect(() => { setQ(sp.get('q') ?? ''); }, [sp]);

  const actualizar = (cambios) => {
    const next = new URLSearchParams(sp);
    Object.entries(cambios).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in cambios)) next.delete('page');
    setSp(next);
  };
  const buscar = (e) => { e.preventDefault(); actualizar({ q: q.trim() }); };
  const limpiar = () => { setQ(''); setSp({}); };
  const activos = FILTROS.filter((f) => sp.get(f)).length + (sp.get('q') ? 1 : 0);

  const panel = (
    <div className="space-y-4">
      <Select id="f-anio" label="Año" value={sp.get('anio') ?? ''} onChange={(v) => actualizar({ anio: v })}
        opciones={(filtros?.anios ?? []).map((a) => ({ value: a.anio, label: `${a.anio} (${a.total})` }))} />
      <Select id="f-tipo" label="Tipo de artículo" value={sp.get('tipo') ?? ''} onChange={(v) => actualizar({ tipo: v })}
        opciones={(filtros?.tipos ?? []).map((t) => ({ value: t.id, label: t.nombre }))} />
      <Select id="f-revista" label="Revista" value={sp.get('revista') ?? ''} onChange={(v) => actualizar({ revista: v })} todos="Todas"
        opciones={(filtros?.revistas ?? []).map((t) => ({ value: t.id, label: t.nombre }))} />
      <Select id="f-programa" label="Programa académico" value={sp.get('programa') ?? ''} onChange={(v) => actualizar({ programa: v })}
        opciones={(filtros?.programas ?? []).map((t) => ({ value: t.id, label: t.nombre }))} />
      {filtros?.lineas?.length > 0 && (
        <Select id="f-linea" label="Línea de investigación" value={sp.get('linea') ?? ''} onChange={(v) => actualizar({ linea: v })} todos="Todas"
          opciones={filtros.lineas.map((t) => ({ value: t.id, label: t.nombre }))} />
      )}
      {activos > 0 && <button className="btn-ghost w-full" onClick={limpiar}><X className="h-4 w-4" /> Limpiar filtros</button>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-serif text-3xl font-bold text-marino">Catálogo de publicaciones</h1>
      <p className="mt-1 text-slate-500">Busque y filtre los artículos científicos de la Facultad de Ingeniería.</p>

      <form onSubmit={buscar} className="mt-6 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Buscar</label>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="q" type="search" className="input h-11 pl-9" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Título, autor, resumen, revista o palabra clave" />
        </div>
        <button className="btn-dark h-11">Buscar</button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <button className="btn-outline w-full lg:hidden" onClick={() => setVerFiltros(!verFiltros)} aria-expanded={verFiltros}>
            <Filter className="h-4 w-4" /> Filtros {activos > 0 && <span className="badge bg-naranja text-white">{activos}</span>}
          </button>
          <div className={`${verFiltros ? 'mt-3 block' : 'hidden'} card p-4 lg:sticky lg:top-24 lg:mt-0 lg:block`}>
            <p className="mb-3 hidden text-sm font-semibold uppercase tracking-wide text-slate-500 lg:block">Filtros</p>
            {panel}
          </div>
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {data ? <><strong className="text-marino">{data.total}</strong> publicación(es) encontrada(s)</> : ' '}
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="orden" className="text-sm text-slate-500">Ordenar por</label>
              <select id="orden" className="input w-auto py-1.5" value={sp.get('orden') ?? 'reciente'} onChange={(e) => actualizar({ orden: e.target.value })}>
                <option value="reciente">Más recientes</option>
                <option value="antiguo">Más antiguas</option>
                <option value="titulo_asc">Título (A–Z)</option>
                <option value="titulo_desc">Título (Z–A)</option>
              </select>
            </div>
          </div>
          {error ? <ErrorCaja error={error} onReintentar={recargar} /> : cargando && !data ? <Spinner /> : data?.items.length ? (
            <>
              <div className={`grid gap-4 md:grid-cols-2 ${cargando ? 'opacity-60' : ''}`}>
                {data.items.map((p) => <PublicacionCard key={p.id} p={p} />)}
              </div>
              <div className="mt-6">
                <Paginacion page={data.page} pages={data.pages} total={data.total}
                  onChange={(page) => { actualizar({ page: String(page) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </div>
            </>
          ) : (
            <div className="card">
              <Vacio titulo="No se encontraron publicaciones" texto="Pruebe con otros términos de búsqueda o quite algunos filtros.">
                {activos > 0 && <button className="btn-outline" onClick={limpiar}>Limpiar búsqueda</button>}
              </Vacio>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
