import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faBell, faClock, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';

export default function ClienteServicios() {
  const [servicios] = useState([
    {
      id: 1,
      nombre: 'Consulta Capilar',
      descripcion: 'Diagnóstico y plan de cuidado personalizado para tu tipo de cabello',
      precio: 50000,
      duracion: '30 min',
      icono: '/uploads/Corte_en_capas.webp'
    },
    {
      id: 2,
      nombre: 'Tratamiento Facial Premium',
      descripcion: 'Limpieza profunda, exfoliación y mascarilla restauradora',
      precio: 75000,
      duracion: '60 min',
      icono: '/uploads/Mascarilla_Hidratante.jpg'
    },
    {
      id: 3,
      nombre: 'Masaje Relajante',
      descripcion: 'Masaje terapéutico con aceites naturales',
      precio: 60000,
      duracion: '45 min',
      icono: '/uploads/MasajeFacial.png'
    },
  ]);

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faBell} /> Nuestros Servicios</h1>
      </div>

      <div className="servicios-grid">
        {servicios.map(servicio => (
          <div key={servicio.id} className="servicio-card">
            <div className="servicio-icon">
              {servicio.icono.startsWith('/') ? (
                <img src={servicio.icono} alt={servicio.nombre} />
              ) : (
                servicio.icono
              )}
            </div>
            <h3>{servicio.nombre}</h3>
            <p className="servicio-desc">{servicio.descripcion}</p>

            <div className="servicio-details">
              <span><FontAwesomeIcon icon={faClock} /> {servicio.duracion}</span>
              <span><FontAwesomeIcon icon={faSackDollar} /> ${servicio.precio.toLocaleString()}</span>
            </div>

            <button className="btn btn-primary"><FontAwesomeIcon icon={faCalendar} /> Agendar Cita</button>
          </div>
        ))}
      </div>
    </div>
  );
}
