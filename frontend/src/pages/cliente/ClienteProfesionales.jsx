import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faScissors } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';

export default function ClienteProfesionales() {
  const [profesionales] = useState([
    {
      id: 1,
      nombre: 'Dr. Juan García',
      especialidad: 'Cuidado Capilar',
      foto: '/uploads/shampoo.jfif',
      calificacion: 4.8,
      experiencia: '5 años',
      descripcion: 'Especialista en tratamientos capilares naturales'
    },
    {
      id: 2,
      nombre: 'Dra. Sofia López',
      especialidad: 'Cuidado Facial',
      foto: '/uploads/facial%20care.jfif',
      calificacion: 4.9,
      experiencia: '8 años',
      descripcion: 'Experta en skincare y tratamientos faciales'
    },
    {
      id: 3,
      nombre: 'Mg. María Rodríguez',
      especialidad: 'Tratamientos Integrales',
      foto: '/uploads/tratamiento.jfif',
      calificacion: 4.7,
      experiencia: '6 años',
      descripcion: 'Tratamientos holísticos y naturales'
    },
  ]);

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faScissors} /> Nuestros Profesionales</h1>
      </div>

      <div className="profesionales-grid">
        {profesionales.map(prof => (
          <div key={prof.id} className="profesional-card">
            <div className="prof-image">
              <img src={prof.foto} alt={prof.nombre} />
            </div>

            <div className="prof-info">
              <h3>{prof.nombre}</h3>
              <p className="especialidad">{prof.especialidad}</p>
              
              <div className="prof-details">
                <span>⭐ {prof.calificacion}</span>
                <span>💼 {prof.experiencia}</span>
              </div>

              <p className="descripcion">{prof.descripcion}</p>

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
