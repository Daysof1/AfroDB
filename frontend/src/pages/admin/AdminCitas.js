import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AdminCitas() {
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

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

  const citasFiltradas = citas.filter((cita) => {
    const textoBusqueda = busqueda.toLowerCase().trim();
    return (
      !textoBusqueda ||
      (cita?.cliente?.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (cita?.profesional?.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (cita?.estado || '').toLowerCase().includes(textoBusqueda) ||
      (cita.fecha || '').toLowerCase().includes(textoBusqueda) ||
      (cita.hora || '').toLowerCase().includes(textoBusqueda) ||
      (cita.notas || '').toLowerCase().includes(textoBusqueda)
    );
  });

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
        <h1>Gestión de Citas</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar citas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="cards-grid">
        {citasFiltradas.map((cita) => (
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
              <span
                className={`badge ${
                  (cita.estado || '').toLowerCase() === 'pendiente'
                  ? 'badge-warning'
                  : (cita.estado || '').toLowerCase() === 'confirmada'
                  ? 'badge-info'
                  : (cita.estado || '').toLowerCase() === 'completada'
                  ? 'badge-success'
                  : (cita.estado || '').toLowerCase() === 'cancelada'
                  ? 'badge-danger'
                  : 'badge-secondary'
                }`}
              >
              {cita.estado}
              </span>
            </p>
            <div className="card-actions">
              {(cita.estado || '').toLowerCase() === 'pendiente' && (
                    <>
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleActualizarEstado(cita.id, 'Confirmada')}
                      >
                        ✅ Confirmar
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleActualizarEstado(cita.id, 'Cancelada')}
                      >
                        ❌ Cancelar
                      </button>
                    </>
                  )}
                  {(cita.estado || '').toLowerCase() === 'confirmada' && (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleActualizarEstado(cita.id, 'Completada')}>
                      ✓ Completada
                    </button>
                  )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

