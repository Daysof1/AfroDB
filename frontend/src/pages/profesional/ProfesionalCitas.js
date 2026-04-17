import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';
import { apiRequest } from '../../api/client.js';

export default function ProfesionalCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filtro, setFiltro] = useState('Todos');

  const loadCitas = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/citas');
      setCitas(response?.data?.citas || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const citasFiltradas = filtro === 'Todos' 
    ? citas 
    : citas.filter((c) => (c.estado || '').toLowerCase() === filtro.toLowerCase());

  const handleActualizarEstado = async (id, nuevoEstado) => {
    try {
      await apiRequest(`/citas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nuevoEstado.toLowerCase() }),
      });
      await loadCitas();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado');
    }
  };

  return (
    <div className="profesional-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faCalendar} /> Mis Citas</h1>
      </div>

      {loading && <p>Cargando citas...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filters">
        <button
          className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`}
          onClick={() => setFiltro('Todos')}
        >
          Todas ({citas.length})
        </button>
        <button
          className={`filter-btn ${filtro === 'Confirmada' ? 'active' : ''}`}
          onClick={() => setFiltro('Confirmada')}
        >
          Confirmadas ({citas.filter((c) => (c.estado || '').toLowerCase() === 'confirmada').length})
        </button>
        <button
          className={`filter-btn ${filtro === 'Pendiente' ? 'active' : ''}`}
          onClick={() => setFiltro('Pendiente')}
        >
          Pendientes ({citas.filter((c) => (c.estado || '').toLowerCase() === 'pendiente').length})
        </button>
      </div>

      <div className="citas-container">
        {citasFiltradas.length === 0 ? (
          <div className="empty-state">
            <p>No hay citas en esta categoría</p>
          </div>
        ) : (
          <div className="citas-grid">
            {citasFiltradas.map((cita) => (
              <div key={cita.id} className="cita-card-prof">
                <div className="cita-header-prof">
                  <h3>{cita?.cliente?.nombre || 'Cliente'}</h3>
                  <span className={`badge ${(cita.estado || '').toLowerCase() === 'confirmada' ? 'badge-success' : 'badge-warning'}`}>
                    {cita.estado}
                  </span>
                </div>

                <div className="cita-info-prof">
                  <p><strong>Servicio:</strong> {(cita.Servicios || []).map((servicio) => servicio.nombre).join(', ') || 'Servicio'}</p>
                  <p><strong>Fecha:</strong> {cita.fecha}</p>
                  <p><strong>Hora:</strong> {cita.hora}</p>
                  <p><strong>Teléfono:</strong> {cita?.cliente?.telefono || 'N/A'}</p>
                </div>

                <div className="cita-actions-prof">
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
        )}
      </div>
    </div>
  );
}

