/** 
 * Encapsula  las operaciones del panel administrativo sobre productos
 * crea, edita, elimina, activa/desactiva productos
 * tdas las funciones usan el cliente http central para incuir el token y manejo de errores
*/

import api from '../api/apiClient';

//crea un producto en el backend usando el payload del formulario del admin
export async function createProduct(data) {
    const res = await api.post('/admin/productos', data);
    return res.data;
}

//Actualiza un producto en el backend usando el payload del formulario del admin
export async function updateProduct(id, data) {
    const res = await api.put(`/admin/productos/${id}`, data);
    return res.data;
}

//Elimina un producto del backend
export async function deleteProduct(id) {
    const res = await api.delete(`/admin/productos/${id}`);
    return res.data;
}

//Marca un producto como activo
export async function activarProducto(id) {
    // El backend expone un endpoint toggle que invierte el estado 'activo'
    const res = await api.patch(`/admin/productos/${id}/toggle`);
    return res.data;
}

//Marca un producto como innactivo
export async function desactivarProducto(id) {
    // Usa el mismo endpoint toggle; el servidor invierte el valor actual
    const res = await api.patch(`/admin/productos/${id}/toggle`);
    return res.data;
}
//categorias
export async function updateCategoria(id, data) {
    const res = await api.put(`/admin/categorias/${id}`, data);
    return res.data;
}

//subcategorias
export async function updateSubcategoria(id, data) {
    const res = await api.put(`/admin/subcategorias/${id}`, data);
    return res.data;
}

//servicios

//crea un servicio en el backend usando el payload del formulario del admin
export async function createService(data) {
    const res = await api.post('/admin/servicios', data);
    return res.data;
}

//Actualiza un producto en el backend usando el payload del formulario del admin
export async function updateService(id, data) {
    const res = await api.put(`/admin/servicios/${id}`, data);
    return res.data;
}

//Elimina un producto del backend
export async function deleteService(id) {
    const res = await api.delete(`/admin/servicios/${id}`);
    return res.data;
}

//Marca un producto como activo
export async function activarServicio(id) {
    // El backend expone un endpoint toggle que invierte el estado 'activo'
    const res = await api.patch(`/admin/servicios/${id}/toggle`);
    return res.data;
}

//Marca un producto como innactivo
export async function desactivarServicio(id) {
    // Usa el mismo endpoint toggle; el servidor invierte el valor actual
    const res = await api.patch(`/admin/servicios/${id}/toggle`);
    return res.data;
}