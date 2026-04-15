import { useState } from 'react';
import '../Admin.css';

export default function AdminServicios() {
  const [servicios, setServicios] = useState([
    { id: 1, nombre: 'Consulta Capilar', descripcion: 'Diagnóstico y recomendación', precio: 50000 },
    { id: 2, nombre: 'Tratamiento Facial', descripcion: 'Limpieza profunda de piel', precio: 75000 },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Servicios</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nuevo Servicio'}
        </button>
      </div>

      {isFormOpen && (
        <div className="form-container">
          <h2>Agregar Nuevo Servicio</h2>
          <form>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" placeholder="Nombre del servicio" />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea placeholder="Descripción del servicio" rows="4"></textarea>
            </div>
            <div className="form-group">
              <label>Precio</label>
              <input type="number" placeholder="Precio" />
            </div>
            <button type="submit" className="btn btn-primary">Guardar Servicio</button>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {servicios.map(servicio => (
          <div key={servicio.id} className="service-card">
            <h3>{servicio.nombre}</h3>
            <p>{servicio.descripcion}</p>
            <p className="price">${servicio.precio.toLocaleString()}</p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary">✏️ Editar</button>
              <button className="btn btn-sm btn-danger">🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
