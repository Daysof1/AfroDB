import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AdminCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoriaId, setEditingCategoriaId] = useState(null);
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

  const handleCrearCategoria = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const isEditing = Boolean(editingCategoriaId);
      await apiRequest(isEditing ? `/admin/categorias/${editingCategoriaId}` : '/admin/categorias', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(newCategoria),
      });
      setSuccess(isEditing ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente');
      setEditingCategoriaId(null);
      setNewCategoria({ nombre: '', descripcion: '', tipo: 'producto' });
      setIsFormOpen(false);
      await loadCategorias();
    } catch (err) {
      setError(err.message || 'No se pudo crear la categoría');
    }
  };

  const handleEliminarCategoria = async (id) => {
    try {
      setError('');
      setSuccess('');
      await apiRequest(`/admin/categorias/${id}`, { method: 'DELETE' });
      setSuccess('Categoría eliminada correctamente');
      await loadCategorias();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la categoría');
    }
  };

  const handleToggleCategoria = async (id) => {
    try {
      setError('');
      setSuccess('');
      await apiRequest(`/admin/categorias/${id}/toggle`, { method: 'PATCH' });
      setSuccess('Estado de la categoría actualizado');
      await loadCategorias();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado de la categoría');
    }
  };

  const handleEditCategoria = (categoria) => {
    setError('');
    setSuccess('');
    setEditingCategoriaId(categoria.id);
    setNewCategoria({
      nombre: categoria.nombre || '',
      descripcion: categoria.descripcion || '',
      tipo: categoria.tipo || 'producto',
    });
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingCategoriaId(null);
    setNewCategoria({ nombre: '', descripcion: '', tipo: 'producto' });
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Categorías</h1>
        <button className="btn btn-primary" onClick={() => (isFormOpen ? handleCancelForm() : setIsFormOpen(true))}>
          {isFormOpen ? 'Cancelar' : '➕ Nueva Categoría'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>{editingCategoriaId ? 'Editar Categoría' : 'Agregar Nueva Categoría'}</h2>
          <form onSubmit={handleCrearCategoria}>
            <div className="form-group">
              <label>Nombre de la Categoría</label>
              <input
                type="text"
                placeholder="Nombre"
                value={newCategoria.nombre}
                onChange={(e) => setNewCategoria({ ...newCategoria, nombre: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                placeholder="Descripción de la categoría"
                rows="3"
                value={newCategoria.descripcion}
                onChange={(e) => setNewCategoria({ ...newCategoria, descripcion: e.target.value })}
              ></textarea>
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
            <button type="submit" className="btn btn-primary">
              {editingCategoriaId ? 'Actualizar Categoría' : 'Guardar Categoría'}
            </button>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {categorias.map((cat) => (
          <div key={cat.id} className="service-card">
            <h3>{cat.nombre}</h3>
            <p>{cat.descripcion || 'Sin descripción'}</p>
            <p><strong>Tipo:</strong> {cat.tipo || 'producto'}</p>
            <p>
              <span className={`badge ${cat.activo ? 'badge-success' : 'badge-danger'}`}>
                {cat.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEditCategoria(cat)}>✏️ Editar</button>
              <button className="btn btn-sm btn-secondary" onClick={() => handleToggleCategoria(cat.id)}>{cat.activo ? '⊘ Desactivar' : '✓ Activar'}</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleEliminarCategoria(cat.id)}>🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

