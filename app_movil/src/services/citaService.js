import apiClient from '../api/apiClient';

const mapPayload = (response) => response.data?.data || response.data || {};

const citaService = {
  agendarCita: async (payload) => {
    // payload: { fecha: 'YYYY-MM-DD', hora: 'HH:MM', servicios: [id], profesionalId?, profesionalesIds? }
    const response = await apiClient.post('/cliente/citas', payload);
    return mapPayload(response).cita || null;
  },

  obtenerMisCitas: async () => {
    // Obtiene todas las citas del cliente autenticado
    const response = await apiClient.get('/cliente/citas');
    const data = mapPayload(response);
    return Array.isArray(data.citas) ? data.citas : [];
  },

  cancelarCita: async (id) => {
    const response = await apiClient.put(`/cliente/citas/${id}/cancelar`);
    const data = mapPayload(response);
    return data.cita || null;
  },

  reprogramarCita: async (id, payload) => {
    const response = await apiClient.put(`/cliente/citas/${id}/reprogramar`, payload);
    const data = mapPayload(response);
    return data.cita || null;
  }
};

export default citaService;
