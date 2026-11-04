import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { API_BASE, qs } from '../../api/client.js';
import { useApi, useTitulo } from '../../lib/hooks.js';
import { TIPOS_AUTOR } from '../../lib/format.js';
import { ErrorCaja, Spinner, Vacio } from '../../components/ui.jsx';
import { Encabezado } from './AdminLayout.jsx';

function Barras({ titulo, datos, etiqueta = (d) => d.nombre }) {
  const max = Math.max(1, ...datos.map((d) => d.total));
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold text-marino">{titulo}</h2>
      {datos.length ? (
        <ul className="space-y-3">
          {datos.map((d, i) => (
            <li key={d.id ?? i}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate text-slate-700" title={etiqueta(d)}>{etiqueta(d)}</span>
                <span className="font-semibold tabular-nums text-marino">{d.total}</span>
              </div>
              <div className="h-2.5 rounded-full bg-fondo">
                <div className="h-2.5 rounded-full bg-naranja" style={{ width: `${(d.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Sin datos.</p>}
    </section>
  );
}

function PorAnio({ datos }) {
  const max = Math.max(1, ...datos.map((d) => d.total));
  return (
    <section className="card p-5">
      <h2 className="mb-4 font-semibold text-marino">Publicaciones por año</h2>
      {datos.length ? (
        <div className="flex h-52 items-end gap-2 overflow-x-auto pb-1" role="img"
          aria-label={datos.map((d) => `${d.anio}: ${d.total}`).join(', ')}>
          {datos.map((d) => (
            <div key={d.anio} className="flex min-w-10 flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs font-semibold tabular-nums text-marino">{d.total}</span>
              <div className="w-full max-w-14 rounded-t-md bg-marino" style={{ height: `${Math.max(4, (d.total / max) * 160)}px` }} />
              <span className="text-xs text-slate-500">{d.anio}</span>
            </div>
          ))}
        </div>
      ) : <p className="text-sm text-slate-500">Sin datos.</p>}
    </section>
  );
}

export default function Reportes() {
  useTitulo('Reportes');
  const [filtros, setFiltros] = useState({ estado: 'publicado', desde: '', hasta: '' });
  const query = qs(filtros);
  const { data, cargando, error, recargar } = useApi(`/admin/reportes/resumen${query}`);
  const exportar = (tipo, formato) => `${API_BASE}/admin/reportes/exportar${qs({ ...filtros, tipo, formato })}`;

  return (
    <>
      <Encabezado titulo="Estadísticas y reportes" descripcion="Producción científica de la Facultad">
        <a className="btn-outline" href={exportar('publicaciones', 'csv')}><Download className="h-4 w-4" /> CSV</a>
        <a className="btn-dark" href={exportar('publicaciones', 'xlsx')}><FileSpreadsheet className="h-4 w-4" /> Excel</a>
      </Encabezado>

      <div className="card mb-6 grid gap-3 p-4 sm:grid-cols-4">
        <div>
          <label htmlFor="r-estado" className="label">Estado</label>
          <select id="r-estado" className="input" value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}>
            <option value="publicado">Publicadas</option>
            <option value="todos">Todos los estados</option>
            <option value="revision">En revisión</option>
            <option value="borrador">Borradores</option>
            <option value="archivado">Archivadas</option>
          </select>
        </div>
        <div>
          <label htmlFor="r-desde" className="label">Desde (año)</label>
          <input id="r-desde" type="number" className="input" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} placeholder="2018" />
        </div>
        <div>
          <label htmlFor="r-hasta" className="label">Hasta (año)</label>
          <input id="r-hasta" type="number" className="input" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} placeholder={String(new Date().getFullYear())} />
        </div>
        <div className="flex items-end">
          <div className="w-full rounded-lg bg-marino px-4 py-2 text-white">
            <p className="text-xs text-slate-300">Total</p>
            <p className="text-2xl font-bold">{data?.total ?? '—'}</p>
          </div>
        </div>
      </div>

      {error ? <ErrorCaja error={error} onReintentar={recargar} /> : cargando && !data ? <Spinner /> : data.total === 0 ? (
        <div className="card"><Vacio titulo="Sin publicaciones para los filtros seleccionados" /></div>
      ) : (
        <div className={`grid gap-6 lg:grid-cols-2 ${cargando ? 'opacity-60' : ''}`}>
          <div className="lg:col-span-2"><PorAnio datos={data.porAnio} /></div>
          <Barras titulo="Por tipo de artículo" datos={data.porTipo} />
          <Barras titulo="Por programa académico" datos={data.porPrograma} />
          <Barras titulo="Por revista" datos={data.porRevista.slice(0, 15)} />
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-marino">Autores con publicaciones</h2>
              <div className="flex gap-1">
                <a className="btn-ghost btn-sm" href={exportar('autores', 'csv')} title="Exportar autores CSV"><Download className="h-4 w-4" /> CSV</a>
                <a className="btn-ghost btn-sm" href={exportar('autores', 'xlsx')} title="Exportar autores Excel"><FileSpreadsheet className="h-4 w-4" /> Excel</a>
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-fondo text-xs uppercase text-slate-500">
                  <tr><th className="px-4 py-2">Autor</th><th className="hidden px-4 py-2 sm:table-cell">Tipo</th><th className="px-4 py-2 text-right">Pub.</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.autores.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2"><p className="font-medium text-slate-800">{a.nombre}</p><p className="text-xs text-slate-500">{a.programa}</p></td>
                      <td className="hidden px-4 py-2 sm:table-cell">{TIPOS_AUTOR[a.tipoAutor]}</td>
                      <td className="px-4 py-2 text-right font-semibold tabular-nums text-marino">{a.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
