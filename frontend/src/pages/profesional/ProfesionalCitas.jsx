import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';

export default function ProfesionalCitas() {
  const [citas, setCitas] = useState([
    {
      id: 1,
      cliente: 'María González',
      servicio: 'Consulta Capilar',
      fecha: '2026-04-18',
      hora: '14:00',
      estado: 'Confirmada',
      telefono: '+57 3001234567'
    },
    {
      id: 2,
      cliente: 'Ana Pérez',
      servicio: 'Tratamiento Facial',
      fecha: '2026-04-18',
      hora: '15:30',
      estado: 'Confirmada',
      telefono: '+57 3009876543'
    },
    {
      id: 3,
      cliente: 'Carlos López',
      servicio: 'Consulta Capilar',
      fecha: '2026-04-19',
      hora: '10:00',
      estado: 'Pendiente',
      telefono: '+57 3005555555'
    },
  ]);

  const [filtro, setFiltro] = useState('Todos');

  const citasFiltradas = filtro === 'Todos' 
    ? citas 
    : citas.filter(c => c.estado === filtro);

  const handleActualizarEstado = (id, nuevoEstado) => {
    setCitas(citas.map(c =>
      c.id === id ? { ...c, estado: nuevoEstado } : c
    ));
  };

  return (
    <div className="profesional-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faCalendar} /> Mis Citas</h1>
      </div>

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
          Confirmadas ({citas.filter(c => c.estado === 'Confirmada').length})
        </button>
        <button
          className={`filter-btn ${filtro === 'Pendiente' ? 'active' : ''}`}
          onClick={() => setFiltro('Pendiente')}
        >
          Pendientes ({citas.filter(c => c.estado === 'Pendiente').length})
        </button>
      </div>

      <div className="citas-container">
        {citasFiltradas.length === 0 ? (
          <div className="empty-state">
            <p>No hay citas en esta categoría</p>
          </div>
        ) : (
          <div className="citas-grid">
            {citasFiltradas.map(cita => (
              <div key={cita.id} className="cita-card-prof">
                <div className="cita-header-prof">
                  <h3>{cita.cliente}</h3>
                  <span className={`badge ${cita.estado === 'Confirmada' ? 'badge-success' : 'badge-warning'}`}>
                    {cita.estado}
                  </span>
                </div>

                <div className="cita-info-prof">
                  <p><strong>Servicio:</strong> {cita.servicio}</p>
                  <p><strong>Fecha:</strong> {cita.fecha}</p>
                  <p><strong>Hora:</strong> {cita.hora}</p>
                  <p><strong>Teléfono:</strong> {cita.telefono}</p>
                </div>

                <div className="cita-actions-prof">
                  {cita.estado === 'Pendiente' && (
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
                  {cita.estado === 'Confirmada' && (
                    <button className="btn btn-sm btn-secondary">
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
