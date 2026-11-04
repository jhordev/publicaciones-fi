import { Link } from 'react-router-dom';
import { Archive, CheckCircle2, Clock, FilePen, FileText, Library, Paperclip, Plus, Users } from 'lucide-react';
import { useApi, useTitulo } from '../../lib/hooks.js';
import { fechaHora, listaAutoresCorta } from '../../lib/format.js';
import { EstadoBadge, ErrorCaja, Spinner, Vacio } from '../../components/ui.jsx';
import { Encabezado } from './AdminLayout.jsx';

function Tarjeta({ icono: Icono, valor, etiqueta, color, to }) {
  const contenido = (
    <div className="card flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
      <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${color}`}><Icono className="h-5 w-5" /></span>
      <div>
        <p className="text-2xl font-bold text-marino">{valor}</p>
        <p className="text-sm text-slate-500">{etiqueta}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{contenido}</Link> : contenido;
}

export default function Dashboard() {
  useTitulo('Panel');
  const { data, cargando, error, recargar } = useApi('/admin/dashboard');
  if (cargando) return <Spinner />;
  if (error) return <ErrorCaja error={error} onReintentar={recargar} />;
  const e = data.estados;

  return (
    <>
      <Encabezado titulo="Dashboard" descripcion="Resumen del repositorio de publicaciones">
        <Link to="/admin/publicaciones/nueva" className="btn-primary"><Plus className="h-4 w-4" /> Registrar publicación</Link>
      </Encabezado>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta icono={CheckCircle2} valor={e.publicado} etiqueta="Publicadas" color="bg-emerald-100 text-emerald-700" to="/admin/publicaciones?estado=publicado" />
        <Tarjeta icono={Clock} valor={e.revision} etiqueta="En revisión" color="bg-amber-100 text-amber-700" to="/admin/publicaciones?estado=revision" />
        <Tarjeta icono={FilePen} valor={e.borrador} etiqueta="Borradores" color="bg-slate-100 text-slate-700" to="/admin/publicaciones?estado=borrador" />
        <Tarjeta icono={Archive} valor={e.archivado} etiqueta="Archivadas" color="bg-zinc-200 text-zinc-700" to="/admin/publicaciones?estado=archivado" />
        <Tarjeta icono={FileText} valor={data.totalPublicaciones} etiqueta="Total de registros" color="bg-marino-50 text-marino" to="/admin/publicaciones" />
        <Tarjeta icono={Users} valor={data.autores} etiqueta="Autores" color="bg-naranja-50 text-naranja-600" to="/admin/autores" />
        <Tarjeta icono={Library} valor={data.revistas} etiqueta="Revistas" color="bg-sky-100 text-sky-700" to="/admin/revistas" />
        <Tarjeta icono={Paperclip} valor={data.archivos} etiqueta="Archivos" color="bg-violet-100 text-violet-700" />
      </div>

      <div className={`mt-6 grid gap-6 ${data.actividad ? 'xl:grid-cols-[1fr_380px]' : ''}`}>
        <section className="card">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-marino">Actualizadas recientemente</h2>
            <Link to="/admin/publicaciones" className="text-sm font-medium text-naranja-600 hover:underline">Ver todas</Link>
          </div>
          {data.recientes.length ? (
            <ul className="divide-y divide-slate-100">
              {data.recientes.map((p) => (
                <li key={p.id}>
                  <Link to={`/admin/publicaciones/${p.id}`} className="flex flex-col gap-1 px-5 py-3 hover:bg-fondo sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">{p.titulo}</p>
                      <p className="truncate text-xs text-slate-500">{listaAutoresCorta(p.autores, 2)} · {p.anioPublicacion}</p>
                    </div>
                    <EstadoBadge estado={p.estado} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Vacio titulo="Sin publicaciones" texto="Registre la primera publicación del repositorio.">
              <Link to="/admin/publicaciones/nueva" className="btn-primary"><Plus className="h-4 w-4" /> Registrar</Link>
            </Vacio>
          )}
        </section>

        {data.actividad && (
          <section className="card">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-semibold text-marino">Actividad reciente</h2>
              <Link to="/admin/bitacora" className="text-sm font-medium text-naranja-600 hover:underline">Bitácora</Link>
            </div>
            <ul className="divide-y divide-slate-100">
              {data.actividad.map((a) => (
                <li key={a.id} className="px-5 py-3 text-sm">
                  <p className="text-slate-700">
                    <span className="font-medium">{a.usuario ? `${a.usuario.nombres} ${a.usuario.apellidos}` : 'Sistema'}</span>{' '}
                    <span className="text-slate-500">{a.accion.replace(/_/g, ' ')}</span>{' '}
                    <span className="text-slate-500">· {a.entidad}</span>
                  </p>
                  {a.detalle && <p className="truncate text-xs text-slate-500">{a.detalle}</p>}
                  <p className="text-xs text-slate-400">{fechaHora(a.createdAt)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
