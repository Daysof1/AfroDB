import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AuxiliarSubcategorias() {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubcategoriaId, setEditingSubcategoriaId] = useState(null);
  const [newSubcategoria, setNewSubcategoria] = useState({ nombre: '', descripcion: '', categoriaId: '', tipo: 'producto' });

  const loadData = async () => {
    try {
      const [subRes, catRes] = await Promise.all([
        apiRequest('/admin/subcategorias'),
        apiRequest('/admin/categorias?activo=true'),
      ]);
      setSubcategorias(subRes?.data?.subcategorias || []);
      setCategorias(catRes?.data?.categorias || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar subcategorías');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const isEditing = Boolean(editingSubcategoriaId);
      await apiRequest(isEditing ? `/admin/subcategorias/${editingSubcategoriaId}` : '/admin/subcategorias', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(newSubcategoria),
      });
      setSuccess(isEditing ? 'Subcategoría actualizada correctamente' : 'Subcategoría creada correctamente');
      setEditingSubcategoriaId(null);
      setNewSubcategoria({ nombre: '', descripcion: '', categoriaId: '', tipo: 'producto' });
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo crear la subcategoría');
    }
  };

  const handleToggle = async (id) => {
    try {
      setError('');
      await apiRequest(`/admin/subcategorias/${id}/toggle`, { method: 'PATCH' });
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado');
    }
  };

  const handleEdit = (subcategoria) => {
    setError('');
    setSuccess('');
    setEditingSubcategoriaId(subcategoria.id);
    setNewSubcategoria({
      nombre: subcategoria.nombre || '',
      descripcion: subcategoria.descripcion || '',
      categoriaId: String(subcategoria.categoriaId ?? ''),
      tipo: subcategoria.tipo || 'producto',
    });
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingSubcategoriaId(null);
    setNewSubcategoria({ nombre: '', descripcion: '', categoriaId: '', tipo: 'producto' });
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Subcategorías</h1>
        <button className="btn btn-primary" onClick={() => (isFormOpen ? handleCancelForm() : setIsFormOpen(true))}>
          {isFormOpen ? 'Cancelar' : '➕ Nueva Subcategoría'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>{editingSubcategoriaId ? 'Editar Subcategoría' : 'Crear Subcategoría'}</h2>
          <form onSubmit={handleCrear}>
            <div className="form-group"><label>Nombre</label><input value={newSubcategoria.nombre} onChange={(e) => setNewSubcategoria({ ...newSubcategoria, nombre: e.target.value })} required /></div>
            <div className="form-group"><label>Descripción</label><textarea value={newSubcategoria.descripcion} onChange={(e) => setNewSubcategoria({ ...newSubcategoria, descripcion: e.target.value })} /></div>
            <div className="form-group">
              <label>Categoría</label>
              <select value={newSubcategoria.categoriaId} onChange={(e) => setNewSubcategoria({ ...newSubcategoria, categoriaId: e.target.value })} required>
                <option value="">Selecciona categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={newSubcategoria.tipo} onChange={(e) => setNewSubcategoria({ ...newSubcategoria, tipo: e.target.value })}>
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">{editingSubcategoriaId ? 'Actualizar' : 'Guardar'}</button>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {subcategorias.map((subcategoria) => (
          <div key={subcategoria.id} className="service-card">
            <h3>{subcategoria.nombre}</h3>
            <p>{subcategoria.descripcion || 'Sin descripción'}</p>
            <p><strong>Categoría:</strong> {subcategoria?.categoria?.nombre || 'Sin categoría'}</p>
            <p><strong>Tipo:</strong> {subcategoria.tipo || 'producto'}</p>
            <p>
              <span className={`badge ${subcategoria.activo ? 'badge-success' : 'badge-danger'}`}>
                {subcategoria.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(subcategoria)}>Editar</button>
              <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(subcategoria.id)}>{subcategoria.activo ? 'Desactivar' : 'Activar'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

