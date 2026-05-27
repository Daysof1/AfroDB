const API_HOST = process.env.REACT_APP_API_HOST || 'http://localhost:5000';
const API_BASE_URL = process.env.REACT_APP_API_URL || `${API_HOST}/api`;
const LOCAL_CART_STORAGE_KEY = 'afrodb_anonymous_cart';

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

export function getStoredRole() {
  return normalizeRole(localStorage.getItem('userRole'));
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function isClientRole() {
  return getStoredRole() === 'cliente';
}

function readLocalCart() {
  try {
    const raw = localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(items));
}

function buildLocalCartItem(producto, cantidad = 1) {
  const productoId = String(producto?.id ?? producto?.productoId ?? '');

  return {
    id: `local-${productoId}`,
    productoId,
    cantidad: Number(cantidad) || 1,
    precioUnitario: Number(producto?.precio ?? producto?.precioUnitario ?? 0),
    producto: {
      id: producto?.id ?? producto?.productoId ?? null,
      nombre: producto?.nombre || 'Producto',
      imagen: producto?.imagen || '',
      descripcion: producto?.descripcion || '',
    },
  };
}

export function getLocalCartItems() {
  return readLocalCart();
}

export function addItemToLocalCart(producto, cantidad = 1) {
  const productoId = String(producto?.id ?? producto?.productoId ?? '');
  if (!productoId) return readLocalCart();

  const items = readLocalCart();
  const existingIndex = items.findIndex((item) => item?.productoId === productoId);
  const nextItem = buildLocalCartItem(producto, cantidad);

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      ...nextItem,
      cantidad: Number(items[existingIndex]?.cantidad || 0) + Number(cantidad || 1),
    };
  } else {
    items.push(nextItem);
  }

  writeLocalCart(items);
  return items;
}

export function updateLocalCartItemCantidad(itemId, nuevaCantidad) {
  const items = readLocalCart()
    .map((item) => {
      if (item?.id !== itemId) return item;
      return {
        ...item,
        cantidad: Number(nuevaCantidad),
      };
    })
    .filter((item) => Number(item?.cantidad) > 0);

  writeLocalCart(items);
  return items;
}

export function removeLocalCartItem(itemId) {
  const items = readLocalCart().filter((item) => item?.id !== itemId);
  writeLocalCart(items);
  return items;
}

export function clearLocalCart() {
  localStorage.removeItem(LOCAL_CART_STORAGE_KEY);
}

export function isLocalCartItem(itemId) {
  return String(itemId || '').startsWith('local-');
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
  if (path.startsWith('/uploads/')) return `${API_HOST}${path}`;
  if (path.startsWith('/')) return `${API_HOST}/uploads${path}`;
  return `${API_HOST}/uploads/${path}`;
}

export async function fetchImageAsFile(imageUrl, fileNameHint = 'imagen') {
  if (!imageUrl) return null;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new ApiError('No se pudo cargar la imagen desde la URL indicada', response.status, null);
  }

  const blob = await response.blob();
  const contentType = blob.type || response.headers.get('content-type') || 'image/jpeg';
  const extension = contentType.includes('png')
    ? 'png'
    : contentType.includes('gif')
      ? 'gif'
      : contentType.includes('webp')
        ? 'webp'
        : 'jpg';
  const safeName = String(fileNameHint).replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '') || 'imagen';

  return new File([blob], `${safeName}.${extension}`, { type: contentType });
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const hadToken = Boolean(token);
  const isAuthAction = path.startsWith('/auth/login') || path.startsWith('/auth/register');
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(options.headers || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

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

    if (response.status === 401 && hadToken && !isAuthAction) {
      clearSession();
      window.dispatchEvent(new Event('authChange'));
      message = 'Tu sesion expiro. Inicia sesion nuevamente.';
      window.dispatchEvent(
        new CustomEvent('sessionExpired', {
          detail: { message },
        }),
      );
    } else if (response.status === 403) {
      message = payload?.message || 'No tienes permisos para realizar esta accion.';
    }

    throw new ApiError(message, response.status, payload);
  }

  return payload;
}
