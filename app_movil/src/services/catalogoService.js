/**
 * Gestiona las consultas públicas del catálogo
 * Obtener categorías, subcategorías, productos con filtros
 * Construir la URL válidas para imágenes del backend
 */

import apiClient from '../api/apiClient';
import { API_BASE_URL } from '../utils/constants';

/**
 * Convierte una URL a HTTPS de forma segura
 * @param {string} url - URL a convertir
 * @returns {string} - URL en HTTPS
 */
const ensureHttps = (url) => {
  if (!url) return url;
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Deriva el origen a partir de API_BASE_URL y fuerza HTTPS
const origin = ensureHttps(
  (typeof API_BASE_URL === 'string' ? API_BASE_URL : 'https://10.0.2.2:5000')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '')
);

// Constante para imágenes por defecto (usando HTTPS)
const DEFAULT_IMAGE_URL = 'https://via.placeholder.com/300/200.png?text=Producto';

// Lista de dominios seguros para imágenes
const SAFE_IMAGE_DOMAINS = [
  'via.placeholder.com',
  'images.unsplash.com',
  'cdn.',
  'storage.',
  'placehold.co',
  'imgur.com',
  'i.imgur.com'
];

/**
 * Verifica si una URL es de un dominio seguro
 * @param {string} url - URL a verificar
 * @returns {boolean} - true si es seguro
 */
const isSafeImageDomain = (url) => {
  return SAFE_IMAGE_DOMAINS.some(domain => url.includes(domain));
};

const catalogoService = {
    // Consulta la lista de categorías disponibles para filtros de navegación
    getCategorias: async () => {
        const response = await apiClient.get('/catalogo/categorias');
        const payload = response.data?.data || response.data || {};
        return payload.categorias || [];
    },

    // Obtiene las subcategorías de una categoría específica
    getSubcategoriasPorCategoria: async (categoriaId) => {
        const response = await apiClient.get(`/catalogo/categorias/${categoriaId}/subcategorias`);
        const payload = response.data?.data || response.data || {};
        return payload.subcategorias || [];
    },

    // Consulta productos del catálogo y acepta filtros de búsqueda
    getProductos: async (params = {}) => {
        const response = await apiClient.get('/catalogo/productos', { params });
        const payload = response.data?.data || response.data || {};
        const productos = payload.productos || [];
        return productos; 
    },

    // Consulta servicios públicos disponibles para mostrarlos sin iniciar sesión
    getServicios: async (params = {}) => {
        const response = await apiClient.get('/servicios', { params });
        const payload = response.data?.data || response.data || {};
        return payload.servicios || [];
    },

    /**
     * Convierte una ruta relativa del backend en URL completa usable para imágenes
     * @param {string} path - Ruta de la imagen (relativa o absoluta)
     * @returns {string} - URL completa de la imagen (siempre HTTPS)
     */
    buildImageUrl: (path) => {
        // Si no hay path, retornar imagen por defecto con HTTPS
        if (!path) {
            return DEFAULT_IMAGE_URL;
        }

        // Normalizar el path: eliminar espacios y barras iniciales
        const trimmedPath = path.trim();
        
        // Si ya es una URL absoluta
        if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
            // Si es HTTP, convertir a HTTPS
            if (trimmedPath.startsWith('http://')) {
                const httpsUrl = trimmedPath.replace('http://', 'https://');
                // Verificar si es un dominio seguro
                if (isSafeImageDomain(httpsUrl)) {
                    return httpsUrl;
                }
                // Si no podemos asegurar HTTPS, devolvemos la imagen por defecto
                console.warn(`URL HTTP no segura: ${trimmedPath}, usando imagen por defecto`);
                return DEFAULT_IMAGE_URL;
            }
            return trimmedPath;
        }

        // Normaliza la ruta: si el backend retorna solo el nombre de archivo
        let cleaned = trimmedPath.replace(/^\//, '');
        if (!cleaned.startsWith('uploads/')) {
            cleaned = `uploads/${cleaned}`;
        }
        
        // Construir URL y asegurar HTTPS
        const imageUrl = `${origin}/${cleaned}`;
        return ensureHttps(imageUrl);
    },
};

export default catalogoService;