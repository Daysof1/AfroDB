import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChalkboard, faStar, faUsers, faCheck, faGear } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';

export default function ProfesionalDashboard() {
  const [stats, setStats] = useState({
    citasHoy: 3,
    citasConfirmadas: 12,
    clientesAtendidos: 45,
    calificacion: 4.8,
  });

  const [proximasCitas, setProximasCitas] = useState([
    { id: 1, cliente: 'María González', servicio: 'Consulta Capilar', hora: '14:00', estado: 'Confirmada' },
    { id: 2, cliente: 'Ana Pérez', servicio: 'Tratamiento Facial', hora: '15:30', estado: 'Confirmada' },
  ]);

  return (
    <div className="profesional-page">
      <h1>Dashboard - Mi Espacio Profesional</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faCalendar} /></div>
          <div className="stat-info">
            <h3>Citas Hoy</h3>
            <p className="stat-number">{stats.citasHoy}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faCheck} /></div>
          <div className="stat-info">
            <h3>Confirmadas</h3>
            <p className="stat-number">{stats.citasConfirmadas}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faUsers} /></div>
          <div className="stat-info">
            <h3>Clientes Atendidos</h3>
            <p className="stat-number">{stats.clientesAtendidos}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faStar} /></div>
          <div className="stat-info">
            <h3>Calificación</h3>
            <p className="stat-number">{stats.calificacion}</p>
          </div>
        </div>
      </div>

      <div className="profesional-section">
        <h2>Próximas Citas</h2>
        <div className="citas-timeline">
          {proximasCitas.map(cita => (
            <div key={cita.id} className="timeline-item">
              <div className="timeline-time">{cita.hora}</div>
              <div className="timeline-content">
                <h4>{cita.cliente}</h4>
                <p>{cita.servicio}</p>
                <span className="badge badge-success">{cita.estado}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="profesional-section">
        <h2>Acciones Rápidas</h2>
        <div className="action-buttons">
          <button className="action-btn btn-secondary"><FontAwesomeIcon icon={faCalendar} /> Ver Horario</button>
          <button className="action-btn btn-secondary"><FontAwesomeIcon icon={faChalkboard} /> Ver Reportes</button>
          <button className="action-btn btn-secondary"><FontAwesomeIcon icon={faGear} /> Configuración</button>
        </div>
      </div>
    </div>
  );
}
