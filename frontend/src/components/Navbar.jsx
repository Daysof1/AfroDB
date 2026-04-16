import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import { getAssetUrl } from '../api/client';

export default function Navbar({ userRole, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setIsMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
    // Disparar evento personalizado
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };


  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAgendarCita = () => {
    if (userRole === 'cliente') {
      navigate('/cliente/citas');
      return;
    }
    navigate('/login');
  };

  const getDashboardRoute = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'auxiliar') return '/auxiliar/dashboard';
    if (userRole === 'profesional') return '/profesional/dashboard';
    return null;
  };

  const dashboardRoute = getDashboardRoute();

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src={getAssetUrl('/uploads/AfroDB.png')} alt="AfroDB" className="logo-image" />
            <span className="logo-text">AfroDB</span>
          </Link>
        </div>

        <div className="navbar-menu">
          {/* SI NO ESTÁ AUTENTICADO */}
          {!userRole && (
            <>
              <Link to="/">Inicio</Link>
              <Link to="/login" className="btn-nav btn-primary">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-nav btn-primary">
                 Registrarse
              </Link>
            </>
          )}

          {/* SI ESTÁ AUTENTICADO: SOLO ACCIONES GLOBALES (NO DUPLICAR SIDEBAR) */}
          {userRole && (
            <>
              {dashboardRoute && <Link to={dashboardRoute}>Dashboard</Link>}
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </>
          )}
        </div>

        <div className="menu-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {isMenuOpen && (
        <div className="navbar-mobile">
          {!userRole && (
            <>
              <Link to="/" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
              <button onClick={() => { handleAgendarCita(); setIsMenuOpen(false); }} className="btn-nav btn-secondary">
                <FontAwesomeIcon icon={faCalendar} /> Agendar Cita
              </button>
              <Link to="/login" className="btn-nav btn-primary" onClick={() => setIsMenuOpen(false)}>
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-nav btn-secondary" onClick={() => setIsMenuOpen(false)}>
                Registrarse
              </Link>
            </>
          )}

          {userRole && (
            <>
              {dashboardRoute && (
                <Link to={dashboardRoute} onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
