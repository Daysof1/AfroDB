// utils/constants.js

// Detectar si estamos en desarrollo
const IS_DEV = __DEV__ || process.env.NODE_ENV === 'development';

export const API_TIMEOUT_MS = 15000; // 15 segundos

/**
 * URL base de la API
 * - Desarrollo: utiliza la URL configurada en el entorno
 * - Producción: utiliza HTTPS
 */
export const API_BASE_URL = IS_DEV
  ? process.env.API_DEV_URL
  : 'https://tu-dominio.com/api';

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