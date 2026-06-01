import apiClient from '../api/apiClient';
import { STORAGE_KEYS } from '../utils/constants';
import { storageSetItem } from '../utils/storage';

const mapPayload = (response) => response.data?.data || response.data || {};

const profesionalService = {
  getMiPerfil: async () => {
    const response = await apiClient.get('/profesional/perfil');
    return mapPayload(response).profesional || null;
  },

  updateMiPerfil: async (data) => {
    const response = await apiClient.put('/profesional/perfil', data);
    const profesional = mapPayload(response).profesional || null;

    if (profesional) {
      await storageSetItem(STORAGE_KEYS.user, JSON.stringify(profesional));
    }

    return profesional;
  },

  getMisEspecialidades: async () => {
    const response = await apiClient.get('/profesional/mis-especialidades');
    return mapPayload(response).especialidades || [];
  },

  agregarEspecialidad: async (especialidadId) => {
    const response = await apiClient.post('/profesional/mis-especialidades', { especialidadId });
    return response.data;
  },

  removerEspecialidad: async (especialidadId) => {
    const response = await apiClient.delete(`/profesional/mis-especialidades/${especialidadId}`);
    return response.data;
  },

  getCitas: async () => {
    const response = await apiClient.get('/profesional/citas');
    return mapPayload(response).citas || [];
  },

  updateCitaEstado: async (id, estado) => {
    const response = await apiClient.put(`/citas/${id}/estado`, { estado });
    return mapPayload(response).cita || null;
  },

  getEspecialidadesDisponibles: async () => {
    const response = await apiClient.get('/especialidades');
    return mapPayload(response).especialidades || [];
  },
};

export default profesionalService;