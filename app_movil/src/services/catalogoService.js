/**
 * gestona las consultas publicas del catalogo
 * obtener categorias, subcategorias, productos con filtros
 * construir la url validas para imagenes del backend
 */

import apiClient from '../api/apiClient';
import { API_BASE_URL } from '../utils/constants';

// Deriva el origen a partir de API_BASE_URL (quita el sufijo /api si existe)
const origin = (typeof API_BASE_URL === 'string' ? API_BASE_URL : 'http://10.0.2.2:5000').replace(/\/api\/?$/, '').replace(/\/$/, '');

const catalogoService = {
    //consulta la lista de categorias disponibles para filtros de navegacion
    getCategorias: async () => {
        const response = await apiClient.get('/catalogo/categorias');
        const payload = response.data?.data || response.data || {};
        return payload.categorias || [];
    },

    //consulta productos del catalogo y acepta filtros de busqueda
    getProductos: async (params = {}) => {
        const response = await apiClient.get('/catalogo/productos', { params });
        const payload = response.data?.data || response.data || {};
        const productos = payload.productos || [];
        return productos; 
    },

    //consulta servicios públicos disponibles para mostrarlos sin iniciar sesión
    getServicios: async (params = {}) => {
        const response = await apiClient.get('/servicios', { params });
        const payload = response.data?.data || response.data || {};
        return payload.servicios || [];
    },

    //Convierte una ruta relativa del backend en url completa usable para imagenes

    buildImageUrl: (path) => {
        if (!path) {
            return 'https://via.placeholder.com/300/200.png?text=Producto';
        }

        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }

        // Normaliza la ruta: si el backend retorna solo el nombre de archivo
        // (por ejemplo 'imagen.jpg') añadimos 'uploads/' antes.
        let cleaned = path.replace(/^\//, '');
        if (!cleaned.startsWith('uploads/')) cleaned = `uploads/${cleaned}`;
        return `${origin}/${cleaned}`;
    },
};

export default catalogoService;