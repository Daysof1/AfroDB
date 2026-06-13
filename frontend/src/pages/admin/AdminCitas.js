import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AdminCitas() {
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [filtro, setFiltro] = useState('Todos');

  // Mapa de profesionales por ID
  const profesionalesPorId = profesionales.reduce((map, prof) => {
    map[prof.id] = prof.nombre;
    return map;
  }, {});

  const loadCitas = async () => {
    try {
      const [citasRes, profesionalesRes] = await Promise.all([
        apiRequest('/admin/citas'),
        apiRequest('/profesionales')
      ]);
      
      const citasIniciales = citasRes?.data?.citas || [];
      const profesionalesData = profesionalesRes?.data?.profesionales || [];
      setProfesionales(profesionalesData);
      
      console.log('Citas iniciales:', citasIniciales);
      
      // Cargar servicios para cada cita usando el endpoint /cliente/citas/:id
      const citasConServicios = await Promise.all(
        citasIniciales.map(async (cita) => {
          try {
            console.log(`Cargando detalles de cita ${cita.id}`);
            const citaCompleta = await apiRequest(`/cliente/citas/${cita.id}`);
            console.log(`Cita ${cita.id} completa:`, citaCompleta);
            return {
              ...cita,
              Servicios: citaCompleta?.data?.cita?.Servicios || []
            };
          } catch (err) {
            console.warn(`No se pudieron cargar servicios para cita ${cita.id}:`, err.message);
            return cita;
          }
        })
      );
      
      console.log('Citas con servicios:', citasConServicios);
      setCitas(citasConServicios);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar citas');
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

  // Función para obtener todos los profesionales únicos de una cita
  const getProfesionalesUnicos = (cita) => {
    const profesionalesSet = new Set();
    
    // Agregar profesional principal si existe
    if (cita?.profesional?.nombre) {
      profesionalesSet.add(cita.profesional.nombre);
    }
    
    // Agregar profesionales de cada servicio
    if (Array.isArray(cita.Servicios)) {
      cita.Servicios.forEach(servicio => {
        const profesionalId = servicio?.profesionalId || servicio?.CitaServicio?.profesionalId;
        if (profesionalId && profesionalesPorId[profesionalId]) {
          profesionalesSet.add(profesionalesPorId[profesionalId]);
        }
      });
    }
    
    const profesionalesArray = Array.from(profesionalesSet);
    return profesionalesArray.length > 0 ? profesionalesArray.join(', ') : 'Profesional';
  };

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
                  <p><strong>Servicio:</strong> {Array.isArray(cita.Servicios) && cita.Servicios.length > 0 ? cita.Servicios.map((s) => s.nombre).join(', ') : 'Sin servicios especificados'}</p>
                  <p><strong>Profesional:</strong> {getProfesionalesUnicos(cita)}</p>
                  <p><strong>Fecha:</strong> {cita.fecha}</p>
                  <p><strong>Hora:</strong> {cita.hora}</p>
                  <p><strong>Duración:</strong> {Number(cita.duracionTotal || 0)} min</p>
                  <p><strong>Total:</strong> ${Number(cita.total || 0).toLocaleString()}</p>
                  <p><strong>Notas:</strong> {cita.notas || 'Sin notas'}</p>
                  <p><strong>Teléfono:</strong> {cita?.cliente?.telefono || 'N/A'}</p>
                </div>

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
        )}
      </div>
    </div>
  );
}

