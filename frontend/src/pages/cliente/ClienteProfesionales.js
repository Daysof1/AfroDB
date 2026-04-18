import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faScissors } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl } from '../../api/client.js';

export default function ClienteProfesionales() {
  const navigate = useNavigate();
  const [profesionales, setProfesionales] = useState([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleAgendarCita = (profesionalId) => {
    navigate(`/cliente/citas?profesional=${profesionalId}`, {
      state: { profesionalId },
    });
  };

  const handleVerPerfil = async (profesionalId) => {
    try {
      setLoadingPerfil(true);
      setErrorPerfil('');
      const response = await apiRequest(`/profesionales/${profesionalId}`);
      setPerfilSeleccionado(response?.data?.profesional || null);
    } catch (err) {
      setErrorPerfil(err.message || 'No se pudo cargar el perfil del profesional');
    } finally {
      setLoadingPerfil(false);
    }
  };

  const cerrarPerfil = () => {
    setPerfilSeleccionado(null);
    setErrorPerfil('');
  };

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

              <div className="prof-actions">
                <button className="btn btn-secondary" onClick={() => handleVerPerfil(prof.id)}>👁️ Ver Perfil</button>
                <button className="btn btn-primary" onClick={() => handleAgendarCita(prof.id)}><FontAwesomeIcon icon={faCalendar} /> Agendar Cita</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(loadingPerfil || perfilSeleccionado || errorPerfil) && (
        <div className="perfil-modal-overlay" onClick={cerrarPerfil}>
          <div className="perfil-modal" onClick={(e) => e.stopPropagation()}>
            <div className="perfil-modal-header">
              <h2>Perfil Profesional</h2>
              <button type="button" className="btn btn-secondary" onClick={cerrarPerfil}>Cerrar</button>
            </div>

            {loadingPerfil && <p>Cargando perfil...</p>}
            {errorPerfil && <div className="alert alert-error">{errorPerfil}</div>}

            {perfilSeleccionado && (
              <div className="perfil-modal-body">
                <div className="perfil-modal-image">
                  <img
                    className="cliente-card-img"
                    src={getAssetUrl(perfilSeleccionado.imagen)}
                    alt={perfilSeleccionado.nombre}
                  />
                </div>

                <div className="perfil-modal-info">
                  <h3>{perfilSeleccionado.nombre} {perfilSeleccionado.apellido || ''}</h3>
                  <p className="especialidad">
                    {(perfilSeleccionado.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidades'}
                  </p>

                  <div className="perfil-modal-grid perfil-modal-grid-publica">
                    <div>
                      <strong>Especialidades:</strong> {(perfilSeleccionado.especialidades || []).length}
                    </div>
                    <div>
                      <strong>Perfil:</strong> Profesional verificado de AfroDB
                    </div>
                    <div className="perfil-modal-col-full">
                      <strong>Enfoque:</strong> Atención profesional y personalizada según los servicios seleccionados.
                    </div>
                  </div>

                  <div className="perfil-modal-actions">
                    <button className="btn btn-primary" onClick={() => handleAgendarCita(perfilSeleccionado.id)}>
                      <FontAwesomeIcon icon={faCalendar} /> Agendar Cita con este profesional
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

