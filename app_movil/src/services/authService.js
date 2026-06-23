/**
 * Centraliza todas las operaciones relacionadas con la autenticacion
 * inicia sesion guarda token/usuario en almacenamiento local
 * cierra sesion elimina datos
 * restaura la sesion guardada
 * actualiza el perfil del usuario autenticado
*/

import apiClient from '../api/apiClient';
import { STORAGE_KEYS } from '../utils/constants';
import { storageGetItem, storageMultiRemove, storageSetItem } from '../utils/storage';

const authService = {
    //envia credenciales al backend y persiste token + usuario si son validos
    login: async (email, password) => {
        const response = await apiClient.post('/auth/login', { email, password});
        const payload = response.data?.data || response.data;

        if (payload?.token){
            await storageSetItem(STORAGE_KEYS.token, payload.token);
        }

        if (payload?.usuario){
            await storageSetItem(STORAGE_KEYS.user, JSON.stringify(payload.usuario));
        }

        return response.data;

    },

    //Registra un nuevo usuario en el sistema
    register: async (data) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },

    //cierra sesion eliminando del storage las claves persistidas
    logout: async () => {
        await storageMultiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
    },

    //lee el almacenamiento local la sesion previamente guardada
    getSession: async () => {
        const token = await storageGetItem(STORAGE_KEYS.token);
        const userRaw = await storageGetItem(STORAGE_KEYS.user);
        let user = null;

        if (userRaw) {
            try {
                user = JSON.parse(userRaw);
            } catch {
                user = null;
            }
        }

        return { token, user };
    },

    //Actualiza el perfil del usuario autenticado
    updatePerfil: async (data) => {
        const response = await apiClient.put('/auth/me', data);
        const payload = response.data?.data || response.data;
        const usuario = payload?.usuario || null;
        if (usuario) {
            await storageSetItem(STORAGE_KEYS.user, JSON.stringify(usuario));
        }
        return usuario;
    },

};

export default authService;

