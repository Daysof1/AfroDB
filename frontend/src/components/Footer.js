import './Footer.css';
import { getAssetUrl } from '../api/client.js';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo-section">
          <div className="footer-logo">
            <img src={getAssetUrl('/uploads/AfroDB.png')} alt="AfroDB Logo" />
            <h3>AfroDB</h3>
          </div>
        </div>
        <div className="footer-description-section">
          <p className="footer-description">
            Tu plataforma de belleza, bienestar y servicios profesionales con productos naturales.
          </p>
        </div>
        <div className="footer-contact-section">
          <div className="footer-contact">
            <p><strong>Contacto</strong></p>
            <p>info@afrodb.com</p>
            <p>+57 301 234 5678</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} AfroDB. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}

