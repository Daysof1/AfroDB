// Página: ProfesionalDashboard.js. panel principal del profesional.
import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChalkboard, faStar, faUsers, faCheck, faGear } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';
import { apiRequest } from '../../api/client.js';

// Renderiza la vista principal de este componente.
export default function ProfesionalDashboard() {

  const [proximasCitas, setProximasCitas] = useState([]);
  const [error, setError] = useState('');
  const loadProximasCitas = async () => {
    try {
      const response = await apiRequest('/citas');
      setProximasCitas(response.data.citas || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las próximas citas');
    }
  };

  useEffect(() => {
    loadProximasCitas();
  }, []);

  return (
    <div className="profesional-page">
      <h1>Dashboard - Mi Espacio Profesional</h1>
      {error && <div className="alert alert-error">{error}</div>}

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
   </div> 
  );
}

