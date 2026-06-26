// Página: ProfesionalCitas.js. gesti?n de citas para profesionales.
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';
import { apiRequest } from '../../api/client.js';

// Renderiza la vista principal de este componente.
export default function ProfesionalCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

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

  const citasFiltradas = citas.filter((cita) => {
  const textoBusqueda = busqueda.toLowerCase().trim();

  const coincideBusqueda =
    !textoBusqueda ||
    (cita?.cliente?.nombre || '').toLowerCase().includes(textoBusqueda) ||
    (cita?.profesional?.nombre || '').toLowerCase().includes(textoBusqueda) ||
    (cita?.estado || '').toLowerCase().includes(textoBusqueda) ||
    (cita.fecha || '').toLowerCase().includes(textoBusqueda) ||
    (cita.hora || '').toLowerCase().includes(textoBusqueda) ||
    (cita.notas || '').toLowerCase().includes(textoBusqueda);

  const coincideEstado =
    filtro === 'Todos' ||
    (cita.estado || '').toLowerCase() === filtro.toLowerCase();

  return coincideBusqueda && coincideEstado;
});

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
        <input
          type="text"
          placeholder="Buscar citas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-input"
        />

        <button
          className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`}
          onClick={() => setFiltro('Todos')}
        >
          Todas ({citas.length})
        </button>
         <button
          className={`filter-btn ${filtro === 'Pendiente' ? 'active' : ''}`}
          onClick={() => setFiltro('Pendiente')}
        >
          Pendientes ({citas.filter((c) => (c.estado || '').toLowerCase() === 'pendiente').length})
        </button>

        <button
          className={`filter-btn ${filtro === 'Confirmada' ? 'active' : ''}`}
          onClick={() => setFiltro('Confirmada')}
        >
          Confirmadas ({citas.filter((c) => (c.estado || '').toLowerCase() === 'confirmada').length})
        </button>

         <button
          className={`filter-btn ${filtro === 'Completada' ? 'active' : ''}`}
          onClick={() => setFiltro('Completada')}
        >
          Completadas ({citas.filter((c) => (c.estado || '').toLowerCase() === 'completada').length})
        </button>

         <button
          className={`filter-btn ${filtro === 'Cancelada' ? 'active' : ''}`}
          onClick={() => setFiltro('Cancelada')}
        >
          Canceladas ({citas.filter((c) => (c.estado || '').toLowerCase() === 'cancelada').length})
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
                </div>

                <div className="cita-info-prof">
                  <p><strong>Servicio:</strong> {(cita.Servicios || []).map((servicio) => servicio.nombre).join(', ') || 'Servicio'}</p>
                  <p><strong>Profesional:</strong> {cita?.profesional?.nombre || 'Profesional'}</p>
                  <p><strong>Fecha:</strong> {cita.fecha}</p>
                  <p><strong>Hora:</strong> {cita.hora}</p>
                  <p><strong>Duración:</strong> {Number(cita.duracionTotal || 0)} min</p>
                  <p><strong>Total:</strong> ${Number(cita.total || 0).toLocaleString()}</p>
                  <p><strong>Notas:</strong> {cita.notas || 'Sin notas'}</p>
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

