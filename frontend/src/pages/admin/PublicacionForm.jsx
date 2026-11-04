import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Archive, CheckCircle2, Eye, FileText, Loader2, Lock, Mail, Plus, Save, Send, Trash2, Unlock, Upload, UserPlus, X,
} from 'lucide-react';
import { api, qs, urlArchivoAdmin } from '../../api/client.js';
import { useApi, useDebounce, useTitulo } from '../../lib/hooks.js';
import { useToast } from '../../context/ToastContext.jsx';
import { CAMPOS_AUTOR, CAMPOS_REVISTA } from '../../lib/catalogos.js';
import { ESTADOS, IDIOMAS, TIPOS_AUTOR, tamano } from '../../lib/format.js';
import { FormularioRegistro } from '../../components/CrudCatalogo.jsx';
import { Avatar, SubirImagen } from '../../components/Imagenes.jsx';
import { Campo, Confirmar, ErrorCaja, EstadoBadge, Spinner, erroresPorCampo } from '../../components/ui.jsx';

const VACIO = {
  titulo: '', resumen: '', idioma: 'es', tipoPublicacionId: '', revistaId: '', programaId: '', anioPublicacion: String(new Date().getFullYear()),
  fechaPublicacion: '', volumen: '', numero: '', paginas: '', doi: '', urlPublicacion: '', destacado: false,
  autores: [], palabrasClave: [], lineas: [],
};

function desdeApi(p) {
  return {
    titulo: p.titulo, resumen: p.resumen ?? '', idioma: p.idioma, tipoPublicacionId: String(p.tipo.id),
    revistaId: p.revista ? String(p.revista.id) : '', programaId: p.programa ? String(p.programa.id) : '',
    anioPublicacion: String(p.anioPublicacion), fechaPublicacion: p.fechaPublicacion ? p.fechaPublicacion.slice(0, 10) : '',
    volumen: p.volumen ?? '', numero: p.numero ?? '', paginas: p.paginas ?? '', doi: p.doi ?? '', urlPublicacion: p.urlPublicacion ?? '',
    destacado: p.destacado,
    autores: p.autores.map((a) => ({ id: a.id, nombres: a.nombres, apellidos: a.apellidos, tipoAutor: a.tipoAutor, foto: a.foto, esAutorCorrespondencia: a.esAutorCorrespondencia })),
    palabrasClave: p.palabrasClave.map((k) => k.nombre),
    lineas: p.lineas.map((l) => l.id),
  };
}

function Seccion({ numero, titulo, descripcion, children }) {
  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marino text-xs font-bold text-white">{numero}</span>
        <div>
          <h2 className="font-semibold text-marino">{titulo}</h2>
          {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Selector de autores con búsqueda, orden de autoría y autor de correspondencia. */
function SelectorAutores({ autores, onChange, error }) {
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const qDeb = useDebounce(q, 250);
  const { data } = useApi(qDeb.trim().length >= 2 ? `/admin/autores${qs({ q: qDeb.trim(), limit: 8 })}` : null, { enabled: qDeb.trim().length >= 2 });
  const ids = new Set(autores.map((a) => a.id));

  const agregar = (a) => {
    if (!ids.has(a.id)) onChange([...autores, { id: a.id, nombres: a.nombres, apellidos: a.apellidos, tipoAutor: a.tipoAutor, foto: a.foto, esAutorCorrespondencia: false }]);
    setQ('');
    setAbierto(false);
  };
  const mover = (i, d) => {
    const arr = [...autores];
    [arr[i], arr[i + d]] = [arr[i + d], arr[i]];
    onChange(arr);
  };
  const actualizar = (i, cambios) => onChange(autores.map((a, j) => (j === i ? { ...a, ...cambios } : a)));

  return (
    <div>
      {autores.length > 0 && (
        <ol className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {autores.map((a, i) => (
            <li key={a.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-marino-50 text-xs font-bold text-marino">{i + 1}</span>
              <Avatar autor={a} px={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{a.apellidos}, {a.nombres}</p>
                <p className="text-xs text-slate-500">{TIPOS_AUTOR[a.tipoAutor]}</p>
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-600">
                <input type="checkbox" className="checkbox" checked={a.esAutorCorrespondencia} onChange={(e) => actualizar(i, { esAutorCorrespondencia: e.target.checked })} />
                <Mail className="h-3.5 w-3.5" /> Correspondencia
              </label>
              <div className="flex gap-0.5">
                <button type="button" className="btn-ghost btn-sm" disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" className="btn-ghost btn-sm" disabled={i === autores.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => onChange(autores.filter((_, j) => j !== i))} aria-label="Quitar autor"><X className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input type="search" className="input" aria-invalid={error ? true : undefined} placeholder="Buscar autor por nombre, apellido u ORCID (mín. 2 letras)"
            value={q} onChange={(e) => { setQ(e.target.value); setAbierto(true); }} onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)} aria-label="Buscar autor" />
          {abierto && qDeb.trim().length >= 2 && data && (
            <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {data.items.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">Sin coincidencias. Puede registrar un nuevo autor.</li>}
              {data.items.map((a) => (
                <li key={a.id}>
                  <button type="button" disabled={ids.has(a.id)} onMouseDown={(e) => e.preventDefault()} onClick={() => agregar(a)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-fondo disabled:opacity-40">
                    <Avatar autor={a} px={28} />
                    <span className="flex-1">{a.apellidos}, {a.nombres} <span className="text-xs text-slate-400">· {TIPOS_AUTOR[a.tipoAutor]}{a.programa ? ` · ${a.programa.nombre}` : ''}</span></span>
                    {ids.has(a.id) ? <span className="text-xs">Agregado</span> : <Plus className="h-4 w-4 text-naranja" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="btn-outline" onClick={() => setNuevo(true)}><UserPlus className="h-4 w-4" /> Nuevo autor</button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <FormularioRegistro abierto={nuevo} ruta="/admin/autores" campos={CAMPOS_AUTOR} titulo="Registrar nuevo autor"
        onGuardado={(a) => { setNuevo(false); agregar(a); }} onCerrar={() => setNuevo(false)} />
    </div>
  );
}

function PalabrasClave({ valores, onChange }) {
  const [texto, setTexto] = useState('');
  const agregar = () => {
    const nuevas = texto.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const existentes = new Set(valores.map((v) => v.toLowerCase()));
    onChange([...valores, ...nuevas.filter((n) => !existentes.has(n.toLowerCase()))].slice(0, 30));
    setTexto('');
  };
  return (
    <div>
      <div className="flex gap-2">
        <input className="input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escriba y presione Enter (o separe con comas)"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }} aria-label="Palabra clave" />
        <button type="button" className="btn-outline" onClick={agregar} disabled={!texto.trim()}>Agregar</button>
      </div>
      {valores.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {valores.map((k) => (
            <span key={k} className="badge bg-marino-50 py-1 text-marino">
              {k}
              <button type="button" onClick={() => onChange(valores.filter((v) => v !== k))} aria-label={`Quitar ${k}`} className="hover:text-red-600"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Archivos({ publicacionId, archivos, onCambio }) {
  const toast = useToast();
  const input = useRef(null);
  const [archivo, setArchivo] = useState(null);
  const [tipoArchivo, setTipoArchivo] = useState('pdf');
  const [autorizado, setAutorizado] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [eliminar, setEliminar] = useState(null);

  const subir = async () => {
    const form = new FormData();
    form.append('tipoArchivo', tipoArchivo);
    form.append('autorizadoPublico', autorizado ? 'true' : 'false');
    form.append('archivo', archivo);
    setSubiendo(true);
    try {
      await api(`/admin/publicaciones/${publicacionId}/archivos`, { method: 'POST', form });
      toast.ok('Archivo subido');
      setArchivo(null);
      setAutorizado(false);
      if (input.current) input.current.value = '';
      onCambio();
    } catch (err) { toast.error(err.message); } finally { setSubiendo(false); }
  };
  const alternar = async (f) => {
    try {
      await api(`/admin/archivos/${f.id}`, { method: 'PATCH', body: { autorizadoPublico: !f.autorizadoPublico } });
      toast.ok(f.autorizadoPublico ? 'El archivo ya no es público' : 'Archivo autorizado para difusión pública');
      onCambio();
    } catch (err) { toast.error(err.message); }
  };
  const borrar = async () => {
    try {
      await api(`/admin/archivos/${eliminar.id}`, { method: 'DELETE' });
      toast.ok('Archivo eliminado');
      onCambio();
    } catch (err) { toast.error(err.message); } finally { setEliminar(null); }
  };

  return (
    <div>
      {archivos.length > 0 && (
        <ul className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {archivos.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm">
              <FileText className="h-5 w-5 text-naranja" />
              <div className="min-w-0 flex-1">
                <a href={urlArchivoAdmin(f.id)} target="_blank" rel="noopener" className="block truncate font-medium text-slate-800 hover:underline">{f.nombreOriginal}</a>
                <p className="text-xs text-slate-500">{f.tipoArchivo.toUpperCase()} · {tamano(f.tamano)}</p>
              </div>
              <span className={`badge ${f.autorizadoPublico ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                {f.autorizadoPublico ? 'Público' : 'Privado'}
              </span>
              <div className="flex gap-0.5">
                <a href={urlArchivoAdmin(f.id)} target="_blank" rel="noopener" className="btn-ghost btn-sm" title="Ver"><Eye className="h-4 w-4" /></a>
                <button type="button" className="btn-ghost btn-sm" onClick={() => alternar(f)} title={f.autorizadoPublico ? 'Restringir (privado)' : 'Autorizar difusión pública'}>
                  {f.autorizadoPublico ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
                <button type="button" className="btn-ghost btn-sm text-red-600" onClick={() => setEliminar(f)} title="Eliminar"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-lg border border-dashed border-slate-300 bg-fondo p-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            className="input" aria-label="Seleccionar archivo" />
          <select className="input" value={tipoArchivo} onChange={(e) => setTipoArchivo(e.target.value)} aria-label="Tipo de archivo">
            <option value="pdf">PDF del artículo</option>
            <option value="portada">Portada (imagen)</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-600">
          <input type="checkbox" className="checkbox mt-0.5" checked={autorizado} onChange={(e) => setAutorizado(e.target.checked)} />
          Se cuenta con autorización para su difusión pública (licencia abierta o permiso de la revista/autores).
        </label>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-500">PDF, JPG, PNG o WEBP. Sin autorización, el archivo solo será visible en el panel.</p>
          <button type="button" className="btn-dark" disabled={!archivo || subiendo} onClick={subir}>
            {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Subir
          </button>
        </div>
      </div>
      <Confirmar abierto={!!eliminar} titulo="Eliminar archivo" mensaje={`Se eliminará «${eliminar?.nombreOriginal}». Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar" peligro onConfirmar={borrar} onCerrar={() => setEliminar(null)} />
    </div>
  );
}

export default function PublicacionForm() {
  const { id } = useParams();
  const esNueva = !id;
  const navigate = useNavigate();
  const toast = useToast();
  useTitulo(esNueva ? 'Nueva publicación' : 'Editar publicación');

  const { data: pub, cargando, error, recargar } = useApi(esNueva ? null : `/admin/publicaciones/${id}`, { enabled: !esNueva });
  const { data: tipos } = useApi('/admin/tipos?todos=1');
  const { data: revistas, recargar: recargarRevistas } = useApi('/admin/revistas?todos=1');
  const { data: programas } = useApi('/admin/programas?todos=1');
  const { data: lineas } = useApi('/admin/lineas?todos=1');

  const [f, setF] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [duplicados, setDuplicados] = useState([]);
  const [nuevaRevista, setNuevaRevista] = useState(false);
  const [cambioEstado, setCambioEstado] = useState(null);
  const [sucio, setSucio] = useState(false);

  useEffect(() => { if (pub) { setF(desdeApi(pub)); setSucio(false); } }, [pub]);

  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); setSucio(true); };
  const inp = (k) => ({ id: `f-${k}`, className: 'input', 'aria-invalid': errores[k] ? true : undefined, value: f[k], onChange: (e) => set(k, e.target.value) });

  const verificarDuplicados = async () => {
    if (!f.titulo.trim() && !f.doi.trim()) return setDuplicados([]);
    try {
      setDuplicados(await api(`/admin/publicaciones/duplicados${qs({ titulo: f.titulo.trim(), doi: f.doi.trim(), excluir: id })}`));
    } catch { /* no bloquea el formulario */ }
  };

  const guardar = async (e) => {
    e?.preventDefault();
    setGuardando(true);
    setErrores({});
    const body = {
      ...f,
      autores: f.autores.map((a) => ({ autorId: a.id, esAutorCorrespondencia: a.esAutorCorrespondencia })),
    };
    try {
      if (esNueva) {
        const r = await api('/admin/publicaciones', { method: 'POST', body });
        toast.ok('Publicación registrada como borrador. Ya puede agregar la imagen principal y archivos.');
        setSucio(false);
        navigate(`/admin/publicaciones/${r.id}`, { replace: true });
      } else {
        await api(`/admin/publicaciones/${id}`, { method: 'PUT', body });
        toast.ok('Cambios guardados');
        setSucio(false);
        recargar();
      }
    } catch (err) {
      const errs = erroresPorCampo(err);
      setErrores(errs);
      toast.error(err.details ? 'Revise los campos marcados en el formulario' : err.message);
      const primero = Object.keys(errs)[0];
      if (primero) document.getElementById(`f-${primero.split('.')[0]}`)?.focus();
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async () => {
    try {
      if (sucio) await api(`/admin/publicaciones/${id}`, {
        method: 'PUT',
        body: { ...f, autores: f.autores.map((a) => ({ autorId: a.id, esAutorCorrespondencia: a.esAutorCorrespondencia })) },
      });
      await api(`/admin/publicaciones/${id}/estado`, { method: 'PATCH', body: { estado: cambioEstado } });
      toast.ok(`Estado actualizado: ${ESTADOS[cambioEstado].label}`);
      setCambioEstado(null);
      recargar();
    } catch (err) {
      setErrores(erroresPorCampo(err));
      toast.error(err.message);
      setCambioEstado(null);
    }
  };

  if (!esNueva && cargando && !pub) return <Spinner />;
  if (error) return <ErrorCaja error={error} onReintentar={recargar} />;

  const anioMax = new Date().getFullYear() + 1;
  const botonesEstado = pub && {
    borrador: [['revision', 'Enviar a revisión', Send], ['publicado', 'Publicar', CheckCircle2]],
    revision: [['publicado', 'Publicar', CheckCircle2], ['borrador', 'Devolver a borrador', ArrowLeft]],
    publicado: [['archivado', 'Archivar', Archive]],
    archivado: [['publicado', 'Volver a publicar', CheckCircle2]],
  }[pub.estado];

  return (
    <form onSubmit={guardar} noValidate className="mx-auto max-w-5xl">
      <Link to="/admin/publicaciones" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-marino">
        <ArrowLeft className="h-4 w-4" /> Publicaciones
      </Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-marino">{esNueva ? 'Registrar publicación' : 'Editar publicación'}</h1>
          {pub && <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">Estado: <EstadoBadge estado={pub.estado} /></div>}
        </div>
        {pub && (
          <div className="flex flex-wrap gap-2">
            {pub.estado === 'publicado' && <Link to={`/publicaciones/${pub.slug}`} target="_blank" className="btn-outline"><Eye className="h-4 w-4" /> Ver en portal</Link>}
            {botonesEstado.map(([estado, label, Icono]) => (
              <button key={estado} type="button" className={estado === 'publicado' ? 'btn-primary' : 'btn-outline'} onClick={() => setCambioEstado(estado)}>
                <Icono className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {duplicados.length > 0 && (
        <div className="mb-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Posible duplicado: ya existe una publicación con el mismo título o DOI.</p>
            <ul className="mt-1 list-disc pl-5">
              {duplicados.map((d) => <li key={d.id}><Link className="underline" to={`/admin/publicaciones/${d.id}`}>{d.titulo}</Link> ({ESTADOS[d.estado].label})</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <Seccion numero="1" titulo="Datos generales">
          <div className="grid gap-4 sm:grid-cols-6">
            <Campo className="sm:col-span-6" label="Título" requerido error={errores.titulo}>
              <textarea rows={2} {...inp('titulo')} onBlur={verificarDuplicados} />
            </Campo>
            <Campo className="sm:col-span-6" label="Resumen" error={errores.resumen}>
              <textarea rows={6} {...inp('resumen')} />
            </Campo>
            <Campo className="sm:col-span-3" label="Tipo de publicación" requerido error={errores.tipoPublicacionId}>
              <select {...inp('tipoPublicacionId')}>
                <option value="">Seleccione…</option>
                {tipos?.items.filter((t) => t.estado === 'activo' || String(t.id) === f.tipoPublicacionId).map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </Campo>
            <Campo className="sm:col-span-3" label="Idioma" error={errores.idioma}>
              <select {...inp('idioma')}>{Object.entries(IDIOMAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </Campo>
            <Campo className="sm:col-span-3" label="Año de publicación" requerido error={errores.anioPublicacion}>
              <input type="number" min="1950" max={anioMax} {...inp('anioPublicacion')} />
            </Campo>
            <Campo className="sm:col-span-3" label="Fecha de publicación" error={errores.fechaPublicacion} ayuda="Opcional">
              <input type="date" {...inp('fechaPublicacion')} onChange={(e) => {
                set('fechaPublicacion', e.target.value);
                if (e.target.value) set('anioPublicacion', e.target.value.slice(0, 4));
              }} />
            </Campo>
          </div>
        </Seccion>

        <Seccion numero="2" titulo="Revista" descripcion="Datos de la revista científica donde se publicó el artículo">
          <div className="grid gap-4 sm:grid-cols-6">
            <Campo className="sm:col-span-6" label="Revista" error={errores.revistaId}>
              <div className="flex gap-2">
                <select {...inp('revistaId')}>
                  <option value="">— Sin revista —</option>
                  {revistas?.items.filter((r) => r.estado === 'activo' || String(r.id) === f.revistaId).map((r) => (
                    <option key={r.id} value={r.id}>{r.nombre}{r.issnElectronico || r.issnImpreso ? ` (ISSN ${r.issnElectronico || r.issnImpreso})` : ''}</option>
                  ))}
                </select>
                <button type="button" className="btn-outline shrink-0" onClick={() => setNuevaRevista(true)}><Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nueva</span></button>
              </div>
            </Campo>
            <Campo className="sm:col-span-2" label="Volumen" error={errores.volumen}><input {...inp('volumen')} /></Campo>
            <Campo className="sm:col-span-2" label="Número" error={errores.numero}><input {...inp('numero')} /></Campo>
            <Campo className="sm:col-span-2" label="Páginas" error={errores.paginas}><input placeholder="45-62" {...inp('paginas')} /></Campo>
          </div>
        </Seccion>

        <Seccion numero="3" titulo="Autores" descripcion="Agregue los autores en el orden en que aparecen en el artículo">
          <SelectorAutores autores={f.autores} onChange={(v) => set('autores', v)} error={errores.autores} />
        </Seccion>

        <Seccion numero="4" titulo="Clasificación">
          <div className="grid gap-4">
            <Campo label="Programa académico" error={errores.programaId}>
              <select {...inp('programaId')}>
                <option value="">— Ninguno —</option>
                {programas?.items.filter((p) => p.estado === 'activo' || String(p.id) === f.programaId).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
            </Campo>
            <div>
              <span className="label">Líneas de investigación</span>
              {lineas?.items.length ? (
                <div className="flex flex-wrap gap-2">
                  {lineas.items.filter((l) => l.estado === 'activo' || f.lineas.includes(l.id)).map((l) => {
                    const activo = f.lineas.includes(l.id);
                    return (
                      <button type="button" key={l.id} aria-pressed={activo}
                        onClick={() => set('lineas', activo ? f.lineas.filter((x) => x !== l.id) : [...f.lineas, l.id])}
                        className={`badge py-1.5 ring-1 ${activo ? 'bg-marino text-white ring-marino' : 'bg-white text-slate-600 ring-slate-300 hover:ring-marino'}`}>
                        {l.nombre}
                      </button>
                    );
                  })}
                </div>
              ) : <p className="text-sm text-slate-500">No hay líneas registradas. <Link className="link" to="/admin/catalogos?tab=lineas">Agregar líneas</Link></p>}
            </div>
            <div>
              <span className="label">Palabras clave</span>
              <PalabrasClave valores={f.palabrasClave} onChange={(v) => set('palabrasClave', v)} />
            </div>
          </div>
        </Seccion>

        <Seccion numero="5" titulo="Enlaces">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="DOI" error={errores.doi} ayuda="Ej.: 10.1234/abcd.2024.001 (también se acepta la URL https://doi.org/…)">
              <input {...inp('doi')} onBlur={verificarDuplicados} />
            </Campo>
            <Campo label="Enlace a la publicación original" error={errores.urlPublicacion}>
              <input type="url" placeholder="https://" {...inp('urlPublicacion')} />
            </Campo>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 sm:col-span-2">
              <input type="checkbox" role="switch" className="switch" checked={f.destacado} onChange={(e) => set('destacado', e.target.checked)} />
              Mostrar como artículo destacado en la página de inicio
            </label>
          </div>
        </Seccion>

        <Seccion numero="6" titulo="Imagen principal" descripcion="Se muestra como portada en la ficha del artículo y en las tarjetas del catálogo.">
          {esNueva ? (
            <p className="rounded-lg bg-fondo p-4 text-sm text-slate-600">Guarde la publicación para poder agregar la imagen principal.</p>
          ) : (
            <div className="max-w-2xl">
              <SubirImagen tipo="publicaciones" endpoint={`/admin/publicaciones/${id}/imagen`} valor={pub?.imagen} onCambio={recargar} />
            </div>
          )}
        </Seccion>

        <Seccion numero="7" titulo="Archivos" descripcion="PDF u otros archivos. Solo se muestran al público si se autoriza su difusión.">
          {esNueva ? (
            <p className="rounded-lg bg-fondo p-4 text-sm text-slate-600">Guarde la publicación para poder adjuntar archivos.</p>
          ) : (
            <Archivos publicacionId={id} archivos={pub?.archivos ?? []} onCambio={recargar} />
          )}
        </Seccion>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex justify-end gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <Link to="/admin/publicaciones" className="btn-outline">Cancelar</Link>
        <button className="btn-dark" disabled={guardando}>
          {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {esNueva ? 'Guardar borrador' : 'Guardar cambios'}
        </button>
      </div>

      <FormularioRegistro abierto={nuevaRevista} ruta="/admin/revistas" campos={CAMPOS_REVISTA} titulo="Registrar nueva revista"
        onGuardado={(r) => { setNuevaRevista(false); recargarRevistas(); set('revistaId', String(r.id)); }} onCerrar={() => setNuevaRevista(false)} />
      <Confirmar abierto={!!cambioEstado} titulo={cambioEstado ? `Cambiar a «${ESTADOS[cambioEstado].label}»` : ''}
        mensaje={cambioEstado === 'publicado'
          ? 'La publicación será visible en el catálogo público. Verifique la exactitud bibliográfica y los permisos de difusión.'
          : cambioEstado === 'archivado'
            ? 'La publicación dejará de mostrarse en el portal, pero se conservará su historial.'
            : 'La publicación no será visible en el portal mientras esté en este estado.'}
        textoConfirmar="Confirmar" onConfirmar={cambiarEstado} onCerrar={() => setCambioEstado(null)} />
    </form>
  );
}
