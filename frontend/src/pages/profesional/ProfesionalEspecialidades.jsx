import { useState } from 'react';
import '../Profesional.css';

export default function ProfesionalEspecialidades() {
  const [especialidades, setEspecialidades] = useState([
    { id: 1, nombre: 'Consulta Capilar', descripcion: 'Diagnóstico de cabello' },
    { id: 2, nombre: 'Tratamiento Intensivo', descripcion: 'Tratamiento profundo' },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newEsp, setNewEsp] = useState({ nombre: '', descripcion: '' });

  const handleAddEspecialidad = () => {
    if (newEsp.nombre && newEsp.descripcion) {
      setEspecialidades([...especialidades, { ...newEsp, id: Date.now() }]);
      setNewEsp({ nombre: '', descripcion: '' });
      setIsFormOpen(false);
    }
  };

  const handleDeleteEspecialidad = (id) => {
    setEspecialidades(especialidades.filter(e => e.id !== id));
  };

  return (
    <div className="profesional-page">
      <div className="page-header">
        <h1>⭐ Mis Especialidades</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Agregar Especialidad'}
        </button>
      </div>

      {isFormOpen && (
        <div className="form-container">
          <h2>Agregar Nueva Especialidad</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleAddEspecialidad(); }}>
            <div className="form-group">
              <label>Nombre de la Especialidad</label>
              <input
                type="text"
                value={newEsp.nombre}
                onChange={(e) => setNewEsp({ ...newEsp, nombre: e.target.value })}
                placeholder="Ej: Tratamiento Capilar Premium"
              />
            </div>

            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={newEsp.descripcion}
                onChange={(e) => setNewEsp({ ...newEsp, descripcion: e.target.value })}
                placeholder="Describe tu especialidad"
                rows="3"
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">Guardar Especialidad</button>
          </form>
        </div>
      )}

      <div className="especialidades-grid">
        {especialidades.map(esp => (
          <div key={esp.id} className="esp-card">
            <div className="esp-header">
              <h3>{esp.nombre}</h3>
            </div>
            <p>{esp.descripcion}</p>
            <div className="esp-actions">
              <button className="btn btn-sm btn-secondary">✏️ Editar</button>
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteEspecialidad(esp.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {especialidades.length === 0 && !isFormOpen && (
        <div className="empty-state">
          <p>No tienes especialidades registradas</p>
          <p>Agrega tus especialidades para que los clientes puedan conocer tus servicios</p>
        </div>
      )}
    </div>
  );
}
