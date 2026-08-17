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

const normalizeSafeText = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim();

  return text || fallback;
};

const normalizePositiveInteger = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    return fallback;
  }

  return parsed;
};

const normalizeNonNegativeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }

  return parsed;
};

export function sanitizeProductForCart(producto) {
  if (!producto || typeof producto !== 'object') {
    return null;
  }

  const rawId = producto?.id ?? producto?.productoId ?? '';
  const productoId = normalizeSafeText(rawId, '').replace(/^local-/, '');

  if (!productoId) {
    return null;
  }

  const nombre = normalizeSafeText(producto?.nombre, 'Producto');
  const imagen = normalizeSafeText(producto?.imagen, '');
  const descripcion = normalizeSafeText(producto?.descripcion, '');
  const precio = normalizeNonNegativeNumber(producto?.precio ?? producto?.precioUnitario ?? 0, 0);

  return {
    id: productoId,
    productoId,
    nombre,
    imagen,
    descripcion,
    precio,
  };
}

function sanitizeCartItemForStorage(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const productoId = normalizeSafeText(item?.productoId ?? item?.producto?.id ?? item?.id ?? '', '').replace(/^local-/, '');
  if (!productoId) {
    return null;
  }

  const cantidad = normalizePositiveInteger(item?.cantidad ?? item?.producto?.cantidad ?? 1, 1);
  const precioUnitario = normalizeNonNegativeNumber(item?.precioUnitario ?? item?.producto?.precio ?? item?.producto?.precioUnitario ?? 0, 0);

  if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
    return null;
  }

  const nombre = normalizeSafeText(item?.producto?.nombre ?? item?.nombre ?? 'Producto', 'Producto');
  const imagen = normalizeSafeText(item?.producto?.imagen ?? item?.imagen ?? '', '');
  const descripcion = normalizeSafeText(item?.producto?.descripcion ?? item?.descripcion ?? '', '');

  const cleanedItem = {
    id: `local-${productoId}`,
    productoId,
    cantidad,
    precioUnitario,
    producto: {
      id: productoId,
      nombre,
      imagen,
      descripcion,
    },
  };

  return Object.keys(cleanedItem).length > 0 ? cleanedItem : null;
}

function readLocalCart() {
  try {
    const raw = localStorage.getItem(LOCAL_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const safeItems = Array.isArray(parsed)
      ? parsed.map((item) => sanitizeCartItemForStorage(item)).filter(Boolean)
      : [];
    return safeItems;
  } catch {
    return [];
  }
}

function writeLocalCart(items) {
  const safeItems = Array.isArray(items)
    ? items.map((item) => sanitizeCartItemForStorage(item)).filter(Boolean)
    : [];

  localStorage.setItem(LOCAL_CART_STORAGE_KEY, JSON.stringify(safeItems));
}

function buildLocalCartItem(producto, cantidad = 1) {
  const safeProducto = sanitizeProductForCart(producto);
  if (!safeProducto) {
    return null;
  }

  const productoId = String(safeProducto.productoId || safeProducto.id || '');
  if (!productoId) {
    return null;
  }

  const cantidadFinal = normalizePositiveInteger(cantidad, 1);
  const precioUnitario = normalizeNonNegativeNumber(safeProducto.precio, 0);

  return {
    id: `local-${productoId}`,
    productoId,
    cantidad: cantidadFinal,
    precioUnitario,
    producto: {
      id: productoId,
      nombre: normalizeSafeText(safeProducto.nombre, 'Producto'),
      imagen: normalizeSafeText(safeProducto.imagen, ''),
      descripcion: normalizeSafeText(safeProducto.descripcion, ''),
    },
  };
}

export function getLocalCartItems() {
  return readLocalCart();
}

export function addItemToLocalCart(producto, cantidad = 1) {
  const safeProducto = sanitizeProductForCart(producto);
  const productoId = String(safeProducto?.productoId ?? safeProducto?.id ?? '');
  if (!productoId) return readLocalCart();

  const items = readLocalCart();
  const existingIndex = items.findIndex((item) => item?.productoId === productoId);
  const nextItem = buildLocalCartItem(safeProducto, cantidad);

  if (!nextItem) {
    return items;
  }

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      ...nextItem,
      cantidad: Number(items[existingIndex]?.cantidad || 0) + Number(nextItem.cantidad || 1),
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
  let extension = 'jpg';
  if (contentType.includes('png')) {
    extension = 'png';
  } else if (contentType.includes('gif')) {
    extension = 'gif';
  } else if (contentType.includes('webp')) {
    extension = 'webp';
  }
  let safeName = String(fileNameHint).replace(/[^a-z0-9_-]/gi, '_');

  // Eliminar _ del inicio
  while (safeName.startsWith('_')) {
    safeName = safeName.substring(1);
  }

  // Eliminar _ del final
  while (safeName.endsWith('_')) {
    safeName = safeName.substring(0, safeName.length - 1);
  }

  safeName = safeName || 'imagen';

  return new File([blob], `${safeName}.${extension}`, { type: contentType });
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const buildHeaders = (options, token, isFormData) => {
  const headers = {
    ...(options.headers ? options.headers : {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const createSafePayload = (data) => {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return null;
  }

  return {
    success: typeof data.success === 'boolean' ? data.success : false,
    message: typeof data.message === 'string' ? data.message : '',
    data: data.data ?? null,
    errors: Array.isArray(data.errors) ? data.errors : null,
    token: typeof data.token === 'string' ? data.token : null,
  };
};

const parseResponsePayload = async (response) => {
  try {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return null;
    }

    const data = await response.json();  // ✅ Esto está correcto
    return createSafePayload(data);

  } catch {
    return null;
  }
};

const handleHttpError = (response, payload, hadToken, isAuthAction) => {
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
};

// ==========================================
// FUNCIÓN PRINCIPAL (REFACTORIZADA)
// ==========================================

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const hadToken = Boolean(token);
  const isAuthAction = path.startsWith('/auth/login') || path.startsWith('/auth/register');
  const isFormData = options.body instanceof FormData;

  const headers = buildHeaders(options, token, isFormData);

  // Validar que path solo contenga caracteres permitidos
  const sanitizedPath = path.replace(/[^a-zA-Z0-9/_-]/g, '');
  if (sanitizedPath !== path) {
    console.warn(`⚠️ Path inválido detectado: ${path}`);
    throw new ApiError('Path inválido', 400, null);
  }
  const response = await fetch(`${API_BASE_URL}${sanitizedPath}`, {
    ...options,
    headers,
  });

  const payload = await parseResponsePayload(response);

  if (!response.ok || payload?.success === false) {
    handleHttpError(response, payload, hadToken, isAuthAction);
  }

  return payload;
}