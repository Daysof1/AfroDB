import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import '../Profesional.css';
import { apiRequest } from '../../api/client.js';

export default function ProfesionalPerfil() {
  const [perfil, setPerfil] = useState({
    nombre: '',
    especialidad: '',
    email: '',
    telefono: '',
    direccion: '',
    tipo_documento: 'C.C.',
    documento: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(perfil);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadPerfil = async () => {
      try {
        const response = await apiRequest('/perfil');
        const profesional = response?.data?.profesional;
        if (profesional) {
          const mapped = {
            ...perfil,
            nombre: profesional.nombre || '',
            email: profesional.email || '',
            telefono: profesional.telefono || '',
            direccion: profesional.direccion || '',
            tipo_documento: profesional.tipo_documento || 'C.C.',
            documento: profesional.documento || '',
            especialidad: (profesional.especialidades || []).map((e) => e.nombre).join(', '),
          };
          setPerfil(mapped);
          setFormData(mapped);
        }
      } catch (err) {
        setError(err.message || 'No se pudo cargar el perfil');
      }
    };

    loadPerfil();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');
      const response = await apiRequest('/perfil', {
        method: 'PUT',
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          direccion: formData.direccion,
          tipo_documento: formData.tipo_documento,
          documento: formData.documento,
        }),
      });
      const profesional = response?.data?.profesional;
      const updated = {
        ...formData,
        especialidad: (profesional?.especialidades || []).map((e) => e.nombre).join(', ') || formData.especialidad,
      };
      setPerfil(updated);
      setFormData(updated);
      setSuccess('Perfil actualizado correctamente');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el perfil');
    }
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

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {!isEditing ? (
        <div className="perfil-container">
          <div className="perfil-card">
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
                  <label>Dirección:</label>
                  <p>{perfil.direccion || 'No registrada'}</p>
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
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tipo Documento</label>
              <input
                type="text"
                name="tipo_documento"
                value={formData.tipo_documento}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Documento</label>
              <input
                type="text"
                name="documento"
                value={formData.documento}
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
              <label>Dirección</label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
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

            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Guardar Cambios
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

