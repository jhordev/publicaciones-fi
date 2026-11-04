import { TIPOS_AUTOR } from './format.js';

const ESTADO = {
  nombre: 'estado', label: 'Estado', tipo: 'select', requerido: true, defecto: 'activo',
  opciones: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }],
};

export const CAMPOS_AUTOR = [
  { nombre: 'nombres', label: 'Nombres', requerido: true },
  { nombre: 'apellidos', label: 'Apellidos', requerido: true },
  {
    nombre: 'tipoAutor', label: 'Tipo de autor', tipo: 'select', requerido: true, defecto: 'docente',
    opciones: Object.entries(TIPOS_AUTOR).map(([value, label]) => ({ value, label })),
  },
  { nombre: 'programaId', label: 'Programa académico', tipo: 'select', fuente: '/admin/programas?todos=1&estado=activo', vacio: '— Ninguno / externo —' },
  { nombre: 'correo', label: 'Correo', tipo: 'email' },
  { nombre: 'orcid', label: 'ORCID', placeholder: '0000-0000-0000-0000', ayuda: 'Se acepta también la URL https://orcid.org/…' },
  { nombre: 'institucion', label: 'Institución / afiliación', ancho: 'completo', placeholder: 'Universidad Católica Sedes Sapientiae' },
];

export const CAMPOS_REVISTA = [
  { nombre: 'nombre', label: 'Nombre de la revista', requerido: true, ancho: 'completo' },
  { nombre: 'editorial', label: 'Editorial' },
  { nombre: 'pais', label: 'País' },
  { nombre: 'issnImpreso', label: 'ISSN impreso', placeholder: '1234-567X' },
  { nombre: 'issnElectronico', label: 'ISSN electrónico', placeholder: '1234-567X' },
  { nombre: 'urlRevista', label: 'Sitio web', tipo: 'url', placeholder: 'https://', ancho: 'completo' },
  { nombre: 'indexacion', label: 'Indexación', placeholder: 'Scopus, WoS, SciELO, Latindex…' },
  ESTADO,
  { nombre: 'descripcion', label: 'Descripción', tipo: 'textarea' },
];

export const CAMPOS_TIPO = [
  { nombre: 'nombre', label: 'Nombre', requerido: true },
  ESTADO,
  { nombre: 'descripcion', label: 'Descripción', tipo: 'textarea' },
];

export const CAMPOS_PROGRAMA = [
  { nombre: 'nombre', label: 'Nombre', requerido: true, ancho: 'completo' },
  { nombre: 'codigo', label: 'Código' },
  ESTADO,
  { nombre: 'descripcion', label: 'Descripción', tipo: 'textarea' },
];

export const CAMPOS_LINEA = [
  { nombre: 'nombre', label: 'Nombre', requerido: true, ancho: 'completo' },
  ESTADO,
  { nombre: 'descripcion', label: 'Descripción', tipo: 'textarea' },
];

export const CAMPOS_PALABRA = [{ nombre: 'nombre', label: 'Palabra clave', requerido: true, ancho: 'completo' }];
