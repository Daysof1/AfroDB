const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';
const API_BASE_URL = process.env.REACT_APP_API_URL || `${API_HOST}/api`;

class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function normalizeRole(rawRole) {
  const role = (rawRole || '').toLowerCase().trim();
  if (role === 'administrador' || role === 'admin') {
    return 'admin';
  }
  if (role === 'auxiliar') {
    return 'auxiliar';
  }
  if (role === 'cliente') {
    return 'cliente';
  }
  if (role === 'profesional') {
    return 'profesional';
  }
  return role || null;
}

export function getToken() {
  return localStorage.getItem('token');
}

export function saveSession({ token, usuario }) {
  const role = normalizeRole(usuario?.rol);
  if (token) localStorage.setItem('token', token);
  if (role) localStorage.setItem('userRole', role);
  if (usuario?.email) localStorage.setItem('userEmail', usuario.email);
  if (usuario?.id !== undefined) localStorage.setItem('userId', String(usuario.id));
  localStorage.setItem('rawUserRole', usuario?.rol || '');
}

export function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('userRole');
  localStorage.removeItem('rawUserRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userId');
}

export function getAssetUrl(path) {
  if (!path) return '/uploads/icono_DB.png';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${API_HOST}${path}`;
  return `${API_HOST}/${path}`;
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const hadToken = Boolean(token);
  const isAuthAction = path.startsWith('/auth/login') || path.startsWith('/auth/register');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.success === false) {
    let message = payload?.message || `Error HTTP ${response.status}`;

    if ((response.status === 401 || response.status === 403) && hadToken && !isAuthAction) {
      clearSession();
      window.dispatchEvent(new Event('authChange'));
      message = 'Tu sesion expiro o no tienes permisos. Inicia sesion nuevamente.';
      window.dispatchEvent(
        new CustomEvent('sessionExpired', {
          detail: { message },
        }),
      );
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload;
}
