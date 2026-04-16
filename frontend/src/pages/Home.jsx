import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faLeaf, faShoppingBag, faBell, faScissors } from '@fortawesome/free-solid-svg-icons';
import ClienteCatalogo from './cliente/ClienteCatalogo';
import ClienteServicios from './cliente/ClienteServicios';
import { getAssetUrl } from '../api/client';
import './Home.css';

export default function Home() {
  const heroBackgroundImage = `url('${getAssetUrl('/uploads/fondo.png')}')`;

  return (
    <div className="home-page">
      <section className="hero-banner" style={{ '--hero-bg-image': heroBackgroundImage }}>
        <div className="hero-content">
          <h1> Bienvenido a AfroDB</h1>
          <p>Tu plataforma de belleza, bienestar y servicios profesionales</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary">
              Iniciar Sesión
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Registrarse
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <h2>¿Por qué elegir AfroDB?</h2>
        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon"><FontAwesomeIcon icon={faShoppingBag} /></div>
            <h3>Tienda Online</h3>
            <p>Compra productos de belleza naturales y de calidad</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon"><FontAwesomeIcon icon={faScissors} /></div>
            <h3>Profesionales Certificados</h3>
            <p>Especialistas en cuidado personal y belleza</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon"><FontAwesomeIcon icon={faCalendar} /></div>
            <h3>Agenda Citas Fácil</h3>
            <p>Reserva tus servicios de forma rápida y segura</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon"><FontAwesomeIcon icon={faLeaf} /></div>
            <h3>100% Natural</h3>
            <p>Productos y servicios con ingredientes naturales</p>
          </div>
        </div>
      </section>

      <section className="catalog-preview">
        <h2><FontAwesomeIcon icon={faShoppingBag} /> Nuestros Productos</h2>
        <p className="section-subtitle">Descubre nuestra colección de productos para el cuidado personal</p>
        <ClienteCatalogo />
      </section>

      <section className="services-preview">
        <h2><FontAwesomeIcon icon={faBell} /> Nuestros Servicios</h2>
        <p className="section-subtitle">Servicios profesionales ofrecidos por nuestros especialistas</p>
        <ClienteServicios />
      </section>
    </div>
  );
}
