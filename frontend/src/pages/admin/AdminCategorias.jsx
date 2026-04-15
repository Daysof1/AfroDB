import { useState } from 'react';
import '../Admin.css';

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([
    { id: 1, nombre: 'Cuidado Capilar', productos: 12, estado: 'Activo' },
    { id: 2, nombre: 'Cuidado Facial', productos: 8, estado: 'Activo' },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Categorías</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nueva Categoría'}
        </button>
      </div>

      {isFormOpen && (
        <div className="form-container">
          <h2>Agregar Nueva Categoría</h2>
          <form>
            <div className="form-group">
              <label>Nombre de la Categoría</label>
              <input type="text" placeholder="Nombre" />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea placeholder="Descripción de la categoría" rows="3"></textarea>
            </div>
            <button type="submit" className="btn btn-primary">Guardar Categoría</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map(cat => (
              <tr key={cat.id}>
                <td>{cat.nombre}</td>
                <td>{cat.productos}</td>
                <td><span className="badge badge-success">{cat.estado}</span></td>
                <td>
                  <button className="btn btn-sm btn-secondary">✏️ Editar</button>
                  <button className="btn btn-sm btn-danger">🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
