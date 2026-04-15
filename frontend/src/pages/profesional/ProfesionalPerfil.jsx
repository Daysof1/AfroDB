import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';

export default function ProfesionalPerfil() {
  const [perfil, setPerfil] = useState({
    nombre: 'Dr. Juan García',
    especialidad: 'Cuidado Capilar',
    email: 'juan@afrodb.com',
    telefono: '+57 3001234567',
    experiencia: '5 años',
    descripcion: 'Especialista en tratamientos capilares naturales con amplia experiencia',
    foto: '/uploads/shampoo.jfif',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(perfil);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    setPerfil(formData);
    setIsEditing(false);
  };

  return (
    <div className="profesional-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faUser} /> Mi Perfil Profesional</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancelar' : '✏️ Editar'}
        </button>
      </div>

      {!isEditing ? (
        <div className="perfil-container">
          <div className="perfil-card">
            <div className="perfil-foto">
              <img src={perfil.foto} alt={perfil.nombre} />
            </div>

            <div className="perfil-info">
              <h2>{perfil.nombre}</h2>
              <p className="especialidad">{perfil.especialidad}</p>
              
              <div className="info-grid">
                <div className="info-item">
                  <label>Email:</label>
                  <p>{perfil.email}</p>
                </div>
                <div className="info-item">
                  <label>Teléfono:</label>
                  <p>{perfil.telefono}</p>
                </div>
                <div className="info-item">
                  <label>Experiencia:</label>
                  <p>{perfil.experiencia}</p>
                </div>
                <div className="info-item">
                  <label>Descripción Profesional:</label>
                  <p>{perfil.descripcion}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="estadisticas-perfil">
            <h3>Mis Estadísticas</h3>
            <div className="stats-mini">
              <div className="stat-mini">
                <p className="stat-number">156</p>
                <p>Clientes Totales</p>
              </div>
              <div className="stat-mini">
                <p className="stat-number">4.8</p>
                <p>Calificación Promedio</p>
              </div>
              <div className="stat-mini">
                <p className="stat-number">89%</p>
                <p>Tasa de Satisfacción</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="form-container">
          <h2>Editar Mi Perfil</h2>
          <form>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Especialidad</label>
              <input
                type="text"
                name="especialidad"
                value={formData.especialidad}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Años de Experiencia</label>
              <input
                type="text"
                name="experiencia"
                value={formData.experiencia}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Descripción Profesional</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                rows="4"
              ></textarea>
            </div>

            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Guardar Cambios
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
