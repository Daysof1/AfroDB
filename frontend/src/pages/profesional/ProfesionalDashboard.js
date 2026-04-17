import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChalkboard, faStar, faUsers, faCheck, faGear } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';
import { apiRequest } from '../../api/client.js';

export default function ProfesionalDashboard() {
  const [stats, setStats] = useState({
    citasHoy: 0,
    citasConfirmadas: 0,
    clientesAtendidos: 0,
    calificacion: 5.0,
  });

  const [proximasCitas, setProximasCitas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await apiRequest('/citas');
        const citas = response?.data?.citas || [];
        const today = new Date().toISOString().slice(0, 10);
        const citasHoy = citas.filter((cita) => String(cita.fecha).slice(0, 10) === today).length;
        const citasConfirmadas = citas.filter((cita) => (cita.estado || '').toLowerCase() === 'confirmada').length;
        const clientesAtendidos = new Set(citas.map((cita) => cita?.cliente?.id).filter(Boolean)).size;

        setStats({
          citasHoy,
          citasConfirmadas,
          clientesAtendidos,
          calificacion: 5.0,
        });
        setProximasCitas(citas.slice(0, 5));
      } catch (err) {
        setError(err.message || 'No se pudo cargar el dashboard');
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="profesional-page">
      <h1>Dashboard - Mi Espacio Profesional</h1>
      {error && <div className="alert alert-error">{error}</div>}

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
          {proximasCitas.map((cita) => (
            <div key={cita.id} className="timeline-item">
              <div className="timeline-time">{cita.hora}</div>
              <div className="timeline-content">
                <h4>{cita?.cliente?.nombre || 'Cliente'}</h4>
                <p>{(cita.Servicios || []).map((servicio) => servicio.nombre).join(', ') || 'Servicio'}</p>
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

