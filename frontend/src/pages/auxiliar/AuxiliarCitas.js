import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AuxiliarCitas() {
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');

  const loadCitas = async () => {
    try {
      const response = await apiRequest('/admin/citas');
      setCitas(response?.data?.citas || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar citas');
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const handleCancelar = async (id) => {
    try {
      await apiRequest(`/admin/citas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'cancelada' }),
      });
      await loadCitas();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cita');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Citas</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="cards-grid">
        {citas.map((cita) => (
          <div key={cita.id} className="service-card">
            <h3>{(cita.Servicios || []).map((servicio) => servicio.nombre).join(', ') || 'Cita'}</h3>
            <p><strong>Cliente:</strong> {cita?.cliente?.nombre || 'Cliente'}</p>
            <p><strong>Profesional:</strong> {cita?.profesional?.nombre || 'Profesional'}</p>
            <p><strong>Fecha:</strong> {cita.fecha}</p>
            <p><strong>Hora:</strong> {cita.hora || 'N/A'}</p>
            <p><strong>Duración:</strong> {Number(cita.duracionTotal || 0)} min</p>
            <p><strong>Total:</strong> ${Number(cita.total || 0).toLocaleString()}</p>
            <p><strong>Notas:</strong> {cita.notas || 'Sin notas'}</p>
            <p>
              <span className={`badge ${(cita.estado || '').toLowerCase() === 'confirmada' ? 'badge-success' : 'badge-danger'}`}>
                {cita.estado || 'Sin estado'}
              </span>
            </p>
            <div className="card-actions">
              <button className="btn btn-sm btn-danger" onClick={() => handleCancelar(cita.id)}>Cancelar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

