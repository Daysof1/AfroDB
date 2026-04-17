import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faScissors } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl } from '../../api/client.js';

export default function ClienteProfesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadProfesionales = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/profesionales');
        setProfesionales(response?.data?.profesionales || []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los profesionales');
      } finally {
        setLoading(false);
      }
    };

    loadProfesionales();
  }, []);

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faScissors} /> Nuestros Profesionales</h1>
      </div>

      {loading && <p>Cargando profesionales...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="profesionales-grid">
        {profesionales.map((prof) => (
          <div key={prof.id} className="profesional-card">
            <div className="prof-image">
              <img className="cliente-card-img" src={getAssetUrl(prof.imagen)} alt={prof.nombre} />
            </div>

            <div className="prof-info">
              <h3>{prof.nombre}</h3>
              <p className="especialidad">{(prof.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidades'}</p>
              
              <div className="prof-details">
                <span>⭐ 5.0</span>
                <span>💼 Profesional</span>
              </div>

              <p className="descripcion">Especialista en atención profesional y personalizada.</p>

              <div className="prof-actions">
                <button className="btn btn-secondary">👁️ Ver Perfil</button>
                <button className="btn btn-primary"><FontAwesomeIcon icon={faCalendar} /> Agendar Cita</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

