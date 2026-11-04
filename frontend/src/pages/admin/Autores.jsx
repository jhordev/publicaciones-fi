import { useState } from 'react';
import { Camera, ExternalLink } from 'lucide-react';
import CrudCatalogo from '../../components/CrudCatalogo.jsx';
import { Avatar, SubirImagen } from '../../components/Imagenes.jsx';
import { Modal } from '../../components/ui.jsx';
import { CAMPOS_AUTOR } from '../../lib/catalogos.js';
import { TIPOS_AUTOR } from '../../lib/format.js';
import { useTitulo } from '../../lib/hooks.js';
import { Encabezado } from './AdminLayout.jsx';

/** Modal para gestionar la foto de un investigador. */
function FotoAutor({ autor, onCerrar, onCambio }) {
  const [foto, setFoto] = useState(autor?.foto ?? null);
  if (!autor) return null;
  return (
    <Modal abierto titulo={`Foto de ${autor.nombres} ${autor.apellidos}`} onCerrar={onCerrar} ancho="max-w-xl">
      <SubirImagen tipo="autores" endpoint={`/admin/autores/${autor.id}/foto`} valor={foto} autor={autor}
        onCambio={(nueva) => { setFoto(nueva); onCambio(); }} />
    </Modal>
  );
}

export default function Autores() {
  useTitulo('Autores');
  const [fotoDe, setFotoDe] = useState(null);
  return (
    <>
      <Encabezado titulo="Autores" descripcion="Estudiantes, docentes, egresados y autores externos" />
      <CrudCatalogo
        ruta="/admin/autores"
        singular="autor"
        campos={CAMPOS_AUTOR}
        renderFiltros={(f, setF) => (
          <select className="input w-auto" value={f.tipoAutor ?? ''} onChange={(e) => setF({ ...f, tipoAutor: e.target.value })} aria-label="Filtrar por tipo">
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS_AUTOR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        acciones={(r, recargar) => (
          <button className="btn-ghost btn-sm" title="Foto del investigador" aria-label="Gestionar foto"
            onClick={() => setFotoDe({ autor: r, recargar })}>
            <Camera className="h-4 w-4" />
          </button>
        )}
        columnas={[
          {
            titulo: 'Autor',
            valor: (r) => (
              <div className="flex items-center gap-3">
                <Avatar autor={r} px={40} />
                <div>
                  <p className="font-medium text-slate-800">{r.apellidos}, {r.nombres}</p>
                  {r.correo && <p className="text-xs text-slate-500">{r.correo}</p>}
                </div>
              </div>
            ),
          },
          { titulo: 'Tipo', valor: (r) => TIPOS_AUTOR[r.tipoAutor] },
          { titulo: 'Programa', clase: 'hidden md:table-cell', valor: (r) => r.programa?.nombre ?? <span className="text-slate-400">—</span> },
          {
            titulo: 'ORCID', clase: 'hidden lg:table-cell',
            valor: (r) => r.orcid ? <a className="link inline-flex items-center gap-1" href={`https://orcid.org/${r.orcid}`} target="_blank" rel="noopener noreferrer">{r.orcid}<ExternalLink className="h-3 w-3" /></a> : <span className="text-slate-400">—</span>,
          },
          { titulo: 'Publicaciones', clase: 'text-center', valor: (r) => r._count?.publicaciones ?? 0 },
        ]}
      />
      {fotoDe && <FotoAutor autor={fotoDe.autor} onCerrar={() => setFotoDe(null)} onCambio={fotoDe.recargar} />}
    </>
  );
}
