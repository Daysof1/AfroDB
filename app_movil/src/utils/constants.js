// utils/constants.js

// Detectar si estamos en desarrollo
const IS_DEV = __DEV__ || process.env.NODE_ENV === 'development';

export const API_TIMEOUT_MS = 15000; // 15 segundos

/**
 * URL base de la API
 * - Desarrollo: permite HTTP para emulador/dispositivo
 * - Producción: fuerza HTTPS
 */
export const API_BASE_URL = (() => {
  // En desarrollo, podemos usar HTTP
  if (IS_DEV) {
    // Android emulador accede al localhost de mi pc mediante 10.0.2.2
    // Si usas dispositivo físico cambia por la IP LAN o local
    return 'http://10.0.2.2:5000/api';
    // Para dispositivo físico, cambiar a:
    // return 'http://192.168.X.X:5000/api';
  }
  
  // En producción, siempre usar HTTPS
  return 'https://tu-dominio.com/api';
})();

/**
 * Origen de la API (sin /api) para construir URLs de imágenes
 */
export const API_ORIGIN = API_BASE_URL
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');

export const STORAGE_KEYS = {
    token: 'token',
    user: 'user',
    carritoLocal: 'carritoLocal',
};