/**
 * administra la funciones del usurario
 * activa desactiva y eliminar desde el panel del admin
 */

import api from '../api/apiClient';

//activa un usuario
export async function activarUsuario(id) {
    // El backend usa un único endpoint toggle para activar/desactivar
    const res = await api.patch(`/admin/usuarios/${id}/toggle`);
    return res.data;
}


//desactiva un usuario
export async function desactivarUsuario(id) {
    // El backend usa un único endpoint toggle para activar/desactivar
    const res = await api.patch(`/admin/usuarios/${id}/toggle`);
    return res.data;
}

//elimina un usuario
export async function deleteUsuario(id) {
    const res = await api.delete(`/admin/usuarios/${id}`);
    return res.data;
}