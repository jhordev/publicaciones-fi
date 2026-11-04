/** Cliente HTTP de la API. Todas las rutas son relativas a la subruta pública. */
export const API_BASE = `${import.meta.env.BASE_URL}api`;

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function api(path, { method = 'GET', body, form, signal } = {}) {
  const headers = { 'X-Requested-With': 'fetch' };
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload, credentials: 'same-origin', signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : null;
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('pubfi:sesion-expirada'));
    throw new ApiError(res.status, data?.error || 'Ocurrió un error inesperado', data?.details);
  }
  return data;
}

/** Construye una query string ignorando valores vacíos. */
export function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const urlArchivoPublico = (id, descargar) => `${API_BASE}/public/archivos/${id}${descargar ? '?descargar=1' : ''}`;
export const urlArchivoAdmin = (id, descargar) => `${API_BASE}/admin/archivos/${id}${descargar ? '?descargar=1' : ''}`;
