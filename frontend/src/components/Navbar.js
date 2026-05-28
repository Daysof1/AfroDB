import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faBell, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import { getAssetUrl } from '../api/client.js';

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
    if (['cliente', 'admin', 'auxiliar'].includes(userRole)) {
      navigate('/agenda/citas');
      return;
    }
    navigate('/login');
  };

  const showCatalogAndServices = ['admin', 'auxiliar', 'profesional'].includes(userRole);

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
              <Link to="/cliente/carrito">Carrito</Link>
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
              {showCatalogAndServices && (
                <>
                  <Link to="/cliente/catalogo">Catálogo</Link>
                  <Link to="/cliente/servicios">Servicios</Link>
                </>
              )}
              <Link to="/profile">Mi Perfil</Link>

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
              <Link to="/cliente/carrito" onClick={() => setIsMenuOpen(false)}>Carrito</Link>
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
              {showCatalogAndServices && (
                <>
                  <Link to="/cliente/catalogo" onClick={() => setIsMenuOpen(false)}>
                    <FontAwesomeIcon icon={faShoppingBag} /> Catálogo
                  </Link>
                  <Link to="/cliente/servicios" onClick={() => setIsMenuOpen(false)}>
                    <FontAwesomeIcon icon={faBell} /> Servicios
                  </Link>
                </>
              )}

              <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                Mi Perfil
              </Link>

              {['cliente', 'admin', 'auxiliar'].includes(userRole) && (
                <button
                  onClick={() => {
                    handleAgendarCita();
                    setIsMenuOpen(false);
                  }}
                  className="btn-nav btn-secondary"
                >
                  <FontAwesomeIcon icon={faCalendar} /> Agendar Cita
                </button>
              )}

              {dashboardRoute && (
                <Link to={dashboardRoute} onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="btn-logout"
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

