import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AuxiliarCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCategoria, setNewCategoria] = useState({ nombre: '', descripcion: '', tipo: 'producto' });

  const loadCategorias = async () => {
    try {
      const response = await apiRequest('/admin/categorias');
      setCategorias(response?.data?.categorias || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar categorías');
    }
  };

  useEffect(() => {
    loadCategorias();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await apiRequest('/admin/categorias', {
        method: 'POST',
        body: JSON.stringify(newCategoria),
      });
      setSuccess('Categoría creada correctamente');
      setNewCategoria({ nombre: '', descripcion: '', tipo: 'producto' });
      setIsFormOpen(false);
      await loadCategorias();
    } catch (err) {
      setError(err.message || 'No se pudo crear la categoría');
    }
  };

  const handleToggle = async (id) => {
    try {
      setError('');
      await apiRequest(`/admin/categorias/${id}/toggle`, { method: 'PATCH' });
      await loadCategorias();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Categorías</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nueva Categoría'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Crear Categoría</h2>
          <form onSubmit={handleCrear}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={newCategoria.nombre}
                onChange={(e) => setNewCategoria({ ...newCategoria, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                rows="3"
                value={newCategoria.descripcion}
                onChange={(e) => setNewCategoria({ ...newCategoria, descripcion: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select
                value={newCategoria.tipo}
                onChange={(e) => setNewCategoria({ ...newCategoria, tipo: e.target.value })}
              >
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Guardar</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cat) => (
              <tr key={cat.id}>
                <td>{cat.nombre}</td>
                <td>{cat.tipo || 'producto'}</td>
                <td>
                  <span className={`badge ${cat.activo ? 'badge-success' : 'badge-warning'}`}>
                    {cat.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(cat.id)}>
                    {cat.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
