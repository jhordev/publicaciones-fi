import { useMemo } from 'react';
import CrudCatalogo from '../../components/CrudCatalogo.jsx';
import { useApi, useTitulo } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { fechaHora } from '../../lib/format.js';
import { Encabezado } from './AdminLayout.jsx';
import { EstadoActivo } from './Revistas.jsx';

export default function Usuarios() {
  useTitulo('Usuarios');
  const { user } = useAuth();
  const { data: roles } = useApi('/admin/roles');

  const campos = useMemo(() => [
    { nombre: 'nombres', label: 'Nombres', requerido: true },
    { nombre: 'apellidos', label: 'Apellidos', requerido: true },
    { nombre: 'correo', label: 'Correo', tipo: 'email', requerido: true, ancho: 'completo' },
    {
      nombre: 'rolId', label: 'Rol', tipo: 'select', requerido: true,
      opciones: (roles ?? []).map((r) => ({ value: r.id, label: r.nombre })),
    },
    {
      nombre: 'estado', label: 'Estado', tipo: 'select', requerido: true, defecto: 'activo',
      opciones: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }],
    },
    {
      nombre: 'password', label: 'Contraseña', tipo: 'password', ancho: 'completo',
      ayuda: 'Mínimo 8 caracteres. Al editar, déjela vacía para mantener la actual.',
    },
  ], [roles]);

  return (
    <>
      <Encabezado titulo="Usuarios y roles" descripcion="Cuentas con acceso al panel administrativo" />
      {roles && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {roles.map((r) => (
            <div key={r.id} className="card p-4">
              <p className="font-semibold text-marino">{r.nombre} <span className="text-sm font-normal text-slate-400">· {r._count.usuarios} usuario(s)</span></p>
              <p className="mt-1 text-sm text-slate-500">{r.descripcion}</p>
            </div>
          ))}
        </div>
      )}
      <CrudCatalogo
        ruta="/admin/usuarios"
        singular="usuario"
        campos={campos}
        columnas={[
          {
            titulo: 'Usuario',
            valor: (r) => <><p className="font-medium text-slate-800">{r.nombres} {r.apellidos} {r.id === user.id && <span className="badge bg-naranja-50 text-naranja-600">Usted</span>}</p><p className="text-xs text-slate-500">{r.correo}</p></>,
          },
          { titulo: 'Rol', valor: (r) => r.rol.nombre },
          { titulo: 'Estado', valor: (r) => <EstadoActivo estado={r.estado} /> },
          { titulo: 'Último acceso', clase: 'hidden md:table-cell whitespace-nowrap text-slate-500', valor: (r) => fechaHora(r.ultimoAcceso) || 'Nunca' },
        ]}
      />
    </>
  );
}
