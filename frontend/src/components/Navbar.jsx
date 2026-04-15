import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';

export default function Navbar({ userRole, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    // Disparar evento personalizado
    window.dispatchEvent(new Event('authChange'));
    navigate('/');
  };

  const handleAgendarCita = () => {
    // Si está autenticado como cliente, va a agendar cita
    if (userRole === 'cliente') {
      navigate('/cliente/citas');
    } else {
      // Si no está autenticado, lo lleva al login
      navigate('/login');
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        <div className="navbar-logo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img src="/uploads/icono_DB.png" alt="AfroDB" className="logo-image" />
            <span className="logo-text">AfroDB</span>
          </Link>
        </div>

        <div className="navbar-menu">
          {/* SI NO ESTÁ AUTENTICADO */}
          {!userRole && (
            <>
              <Link to="/">Inicio</Link>
              <button onClick={handleAgendarCita} className="btn-nav btn-primary">
                <FontAwesomeIcon icon={faCalendar} /> Agendar Cita
              </button>
              <Link to="/login" className="btn-nav btn-primary">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-nav btn-primary">
                 Registrarse
              </Link>
            </>
          )}

          {/* SI ESTÁ AUTENTICADO COMO ADMIN */}
          {userRole === 'admin' && (
            <>
              <Link to="/admin/dashboard">Dashboard</Link>
              <Link to="/admin/productos">Productos</Link>
              <Link to="/admin/servicios">Servicios</Link>
              <Link to="/admin/categorias">Categorías</Link>
              <Link to="/admin/citas">Citas</Link>
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </>
          )}

          {/* SI ESTÁ AUTENTICADO COMO CLIENTE */}
          {userRole === 'cliente' && (
            <>
              <Link to="/cliente/catalogo">Catálogo</Link>
              <Link to="/cliente/servicios">Servicios</Link>
              <Link to="/cliente/profesionales">Profesionales</Link>
              <Link to="/cliente/carrito">Carrito</Link>
              <Link to="/cliente/pedidos">Pedidos</Link>
              <Link to="/cliente/citas" className="btn-nav btn-secondary">
                <FontAwesomeIcon icon={faCalendar} /> Mis Citas
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </>
          )}

          {/* SI ESTÁ AUTENTICADO COMO PROFESIONAL */}
          {userRole === 'profesional' && (
            <>
              <Link to="/profesional/dashboard">Dashboard</Link>
              <Link to="/profesional/citas">Mis Citas</Link>
              <Link to="/profesional/perfil">Mi Perfil</Link>
              <Link to="/profesional/especialidades">Especialidades</Link>
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

          {userRole === 'admin' && (
            <>
              <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/admin/productos" onClick={() => setIsMenuOpen(false)}>Productos</Link>
              <Link to="/admin/servicios" onClick={() => setIsMenuOpen(false)}>Servicios</Link>
              <Link to="/admin/categorias" onClick={() => setIsMenuOpen(false)}>Categorías</Link>
              <Link to="/admin/citas" onClick={() => setIsMenuOpen(false)}>Citas</Link>
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </>
          )}

          {userRole === 'cliente' && (
            <>
              <Link to="/cliente/catalogo" onClick={() => setIsMenuOpen(false)}>Catálogo</Link>
              <Link to="/cliente/servicios" onClick={() => setIsMenuOpen(false)}>Servicios</Link>
              <Link to="/cliente/profesionales" onClick={() => setIsMenuOpen(false)}>Profesionales</Link>
              <Link to="/cliente/carrito" onClick={() => setIsMenuOpen(false)}>Carrito</Link>
              <Link to="/cliente/pedidos" onClick={() => setIsMenuOpen(false)}>Pedidos</Link>
              <Link to="/cliente/citas" className="btn-nav btn-secondary" onClick={() => setIsMenuOpen(false)}>
                <FontAwesomeIcon icon={faCalendar} /> Mis Citas
              </Link>
              <button onClick={handleLogout} className="btn-logout">
                Cerrar Sesión
              </button>
            </>
          )}

          {userRole === 'profesional' && (
            <>
              <Link to="/profesional/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              <Link to="/profesional/citas" onClick={() => setIsMenuOpen(false)}>Mis Citas</Link>
              <Link to="/profesional/perfil" onClick={() => setIsMenuOpen(false)}>Mi Perfil</Link>
              <Link to="/profesional/especialidades" onClick={() => setIsMenuOpen(false)}>Especialidades</Link>
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
