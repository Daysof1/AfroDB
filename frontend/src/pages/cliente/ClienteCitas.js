import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest } from '../../api/client.js';

export default function ClienteCitas() {
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [formData, setFormData] = useState({ profesionalId: '', servicioIds: [], fecha: '', hora: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [citasRes, serviciosRes, profesionalesRes] = await Promise.all([
        apiRequest('/cliente/citas'),
        apiRequest('/servicios?activo=true'),
        apiRequest('/profesionales'),
      ]);
      setCitas(citasRes?.data?.citas || []);
      setServicios(serviciosRes?.data?.servicios || []);
      setProfesionales(profesionalesRes?.data?.profesionales || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información de citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatEstado = (estado) => {
    const value = (estado || '').toLowerCase();
    if (value === 'confirmada') return 'Confirmada';
    if (value === 'pendiente') return 'Pendiente';
    if (value === 'cancelada') return 'Cancelada';
    if (value === 'completada') return 'Completada';
    return estado || 'Sin estado';
  };

  const handleCrearCita = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/cliente/citas', {
        method: 'POST',
        body: JSON.stringify({
          profesionalId: formData.profesionalId || undefined,
          servicios: formData.servicioIds.map((id) => Number(id)),
          fecha: formData.fecha,
          hora: formData.hora,
        }),
      });
      setFormData({ profesionalId: '', servicioIds: [], fecha: '', hora: '' });
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo crear la cita');
    }
  };

  const handleCancelarCita = async (id) => {
    try {
      await apiRequest(`/cliente/citas/${id}/cancelar`, { method: 'PUT' });
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la cita');
    }
  };

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faCalendar} /> Mis Citas</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Agendar Nueva Cita'}
        </button>
      </div>

      {loading && <p>Cargando citas...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Agendar Nueva Cita</h2>
          <form onSubmit={handleCrearCita}>
            <div className="form-group">
              <label>Profesional</label>
              <select value={formData.profesionalId} onChange={(e) => setFormData({ ...formData, profesionalId: e.target.value })}>
                <option value="">Selecciona un profesional</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>{prof.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Servicios</label>
              <select
                multiple
                size="5"
                value={formData.servicioIds}
                onChange={(e) => setFormData({
                  ...formData,
                  servicioIds: Array.from(e.target.selectedOptions, (option) => option.value),
                })}
                required
              >
                <option value="" disabled>Selecciona uno o más servicios</option>
                {servicios.map((servicio) => (
                  <option key={servicio.id} value={servicio.id}>{servicio.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input type="time" value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary">Agendar Cita</button>
          </form>
        </div>
      )}

      <div className="citas-container">
        {citas.length === 0 ? (
          <div className="empty-state">
            <p>No tienes citas agendadas</p>
          </div>
        ) : (
          <div className="citas-grid">
            {citas.map((cita) => (
              <div key={cita.id} className="cita-card">
                <div className="cita-header">
                  <h3>{(cita.Servicios || []).map((s) => s.nombre).join(', ') || 'Cita'}</h3>
                  <span className={`badge ${(cita.estado || '').toLowerCase() === 'confirmada' ? 'badge-success' : 'badge-warning'}`}>
                    {formatEstado(cita.estado)}
                  </span>
                </div>

                <div className="cita-info">
                  <p><strong>Profesional:</strong> {cita?.profesional?.nombre || 'Sin asignar'}</p>
                  <p><strong>Fecha:</strong> {cita.fecha}</p>
                  <p><strong>Hora:</strong> {cita.hora}</p>
                  <p><strong>Duración total:</strong> {Number(cita.duracionTotal || 0)} min</p>
                  <p><strong>Total:</strong> ${Number(cita.total || 0).toLocaleString()}</p>
                  <p><strong>Notas:</strong> {cita.notas || 'Sin notas'}</p>
                </div>

                <div className="cita-actions">
                  <button className="btn btn-sm btn-secondary">Reprogramar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleCancelarCita(cita.id)}>Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

