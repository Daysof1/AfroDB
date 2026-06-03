import apiClient from '../api/apiClient';

const mapPayload = (response) => response.data?.data || response.data || {};

const citaService = {
  agendarCita: async (payload) => {
    // payload: { fecha: 'YYYY-MM-DD', hora: 'HH:MM', servicios: [id], profesionalId?, profesionalesIds? }
    const response = await apiClient.post('/cliente/citas', payload);
    return mapPayload(response).cita || null;
  },
};

export default citaService;
