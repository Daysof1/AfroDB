// Página: ClienteProfesionales.js. página de profesionales disponibles.
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faScissors, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl, getStoredRole, isAuthenticated } from '../../api/client.js';

// Renderiza la vista principal de este componente.
export default function ClienteProfesionales() {
  const navigate = useNavigate();
  const [profesionales, setProfesionales] = useState([]);
  const [perfilSeleccionado, setPerfilSeleccionado] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [errorPerfil, setErrorPerfil] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Ref para el modal (para manejar el foco)
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  const handleAgendarCita = (profesionalId) => {
    const userRole = getStoredRole();

    if (isAuthenticated() && ['cliente', 'admin', 'auxiliar', 'profesional'].includes(userRole)) {
      navigate(`/agenda/citas?profesional=${profesionalId}`, {
        state: { profesionalId },
      });
      return;
    }

    navigate('/login');
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
    // Devolver el foco al botón que abrió el modal
    if (modalRef.current) {
      modalRef.current.focus();
    }
  };

  // Manejar tecla Escape para cerrar el modal
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && perfilSeleccionado) {
      cerrarPerfil();
    }
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
    
    // Agregar listener para tecla Escape
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
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
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => handleVerPerfil(prof.id)}
                >
                  👁️ Ver Perfil
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => handleAgendarCita(prof.id)}
                >
                  <FontAwesomeIcon icon={faCalendar} /> Agendar Cita
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de perfil - Usando <dialog> nativo en lugar de div con role="dialog" */}
      {(loadingPerfil || perfilSeleccionado || errorPerfil) && (
        <dialog
          className="perfil-modal-overlay"
          open
          ref={modalRef}
          aria-labelledby="perfil-modal-title"
          onClick={(e) => {
            // Cerrar si se hace clic en el backdrop (fuera del contenido del modal)
            if (e.target === e.currentTarget) {
              cerrarPerfil();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              cerrarPerfil();
            }
          }}
        >
          <div 
            className="perfil-modal"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <div className="perfil-modal-header">
              <h2 id="perfil-modal-title">Perfil Profesional</h2>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={cerrarPerfil}
                aria-label="Cerrar perfil"
              >
                <FontAwesomeIcon icon={faTimes} /> Cerrar
              </button>
            </div>

            {loadingPerfil && <p>Cargando perfil...</p>}
            {errorPerfil && <div className="alert alert-error">{errorPerfil}</div>}

            {perfilSeleccionado && (
              <div className="perfil-modal-body">
                <div className="perfil-modal-image">
                  <img
                    className="cliente-card-img"
                    src={getAssetUrl(perfilSeleccionado.imagen)}
                    alt={`Foto de ${perfilSeleccionado.nombre}`}
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
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => handleAgendarCita(perfilSeleccionado.id)}
                    >
                      <FontAwesomeIcon icon={faCalendar} /> Agendar Cita con este profesional
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </dialog>
      )}
    </div>
  );
}