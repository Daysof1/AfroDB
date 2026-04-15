import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';

export default function ClienteCitas() {
  const [citas, setCitas] = useState([
    {
      id: 1,
      profesional: 'Dr. Juan García',
      servicio: 'Consulta Capilar',
      fecha: '2026-04-18',
      hora: '14:00',
      estado: 'Confirmada'
    },
    {
      id: 2,
      profesional: 'Dra. Sofia López',
      servicio: 'Tratamiento Facial',
      fecha: '2026-04-22',
      hora: '10:00',
      estado: 'Pendiente'
    },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faCalendar} /> Mis Citas</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Agendar Nueva Cita'}
        </button>
      </div>

      {isFormOpen && (
        <div className="form-container">
          <h2>Agendar Nueva Cita</h2>
          <form>
            <div className="form-group">
              <label>Profesional</label>
              <select>
                <option>Selecciona un profesional</option>
                <option>Dr. Juan García</option>
                <option>Dra. Sofia López</option>
                <option>Mg. María Rodríguez</option>
              </select>
            </div>
            <div className="form-group">
              <label>Servicio</label>
              <select>
                <option>Selecciona un servicio</option>
                <option>Consulta Capilar</option>
                <option>Tratamiento Facial</option>
                <option>Masaje Relajante</option>
              </select>
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input type="time" />
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
            {citas.map(cita => (
              <div key={cita.id} className="cita-card">
                <div className="cita-header">
                  <h3>{cita.servicio}</h3>
                  <span className={`badge ${cita.estado === 'Confirmada' ? 'badge-success' : 'badge-warning'}`}>
                    {cita.estado}
                  </span>
                </div>

                <div className="cita-info">
                  <p><strong>Profesional:</strong> {cita.profesional}</p>
                  <p><strong>Fecha:</strong> {cita.fecha}</p>
                  <p><strong>Hora:</strong> {cita.hora}</p>
                </div>

                <div className="cita-actions">
                  <button className="btn btn-sm btn-secondary">Reprogramar</button>
                  <button className="btn btn-sm btn-danger"> Cancelar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
