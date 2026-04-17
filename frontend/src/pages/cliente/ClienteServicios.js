import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faBell, faClock, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl, normalizeRole } from '../../api/client.js';

export default function ClienteServicios() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleAgendarCita = () => {
    const userRole = normalizeRole(localStorage.getItem('userRole'));

    // Si está autenticado como cliente, va a agendar cita
    if (userRole === 'cliente') {
      navigate('/cliente/citas');
    } else {
      // Si no está autenticado, lo lleva al login
      navigate('/login');
    }
  };

  useEffect(() => {
    const loadServicios = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/servicios?activo=true');
        setServicios(response?.data?.servicios || []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los servicios');
      } finally {
        setLoading(false);
      }
    };

    loadServicios();
  }, []);

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faBell} /> Nuestros Servicios</h1>
      </div>

      {loading && <p>Cargando servicios...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="servicios-grid">
        {servicios.map((servicio) => (
          <div key={servicio.id} className="servicio-card">
            <div className="cliente-image-frame cliente-image-frame-servicio">
              {servicio.imagen ? (
                <img className="cliente-card-img" src={getAssetUrl(servicio.imagen)} alt={servicio.nombre} />
              ) : (
                <span>✨</span>
              )}
            </div>
            <h3>{servicio.nombre}</h3>
            <p className="servicio-desc">{servicio.descripcion}</p>

            <div className="servicio-details">
              <span><FontAwesomeIcon icon={faClock} /> {servicio.duracion} min</span>
              <span><FontAwesomeIcon icon={faSackDollar} /> ${Number(servicio.precio || 0).toLocaleString()}</span>
            </div>

            <button onClick={handleAgendarCita} className="btn btn-primary"><FontAwesomeIcon icon={faCalendar} /> Agendar Cita</button>
          </div>
        ))}
      </div>
    </div>
  );
}

