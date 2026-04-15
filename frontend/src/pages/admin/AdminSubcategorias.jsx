import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AdminSubcategorias() {
  const [subcategorias, setSubcategorias] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
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
      await apiRequest('/admin/subcategorias', {
        method: 'POST',
        body: JSON.stringify(newSubcategoria),
      });
      setSuccess('Subcategoría creada correctamente');
      setNewSubcategoria({ nombre: '', descripcion: '', categoriaId: '', tipo: 'producto' });
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo crear la subcategoría');
    }
  };

  const handleToggle = async (id) => {
    try {
      await apiRequest(`/admin/subcategorias/${id}/toggle`, { method: 'PATCH' });
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/admin/subcategorias/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la subcategoría');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Subcategorías</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nueva Subcategoría'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Crear Subcategoría</h2>
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
            <button type="submit" className="btn btn-primary">Guardar Subcategoría</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subcategorias.map((subcategoria) => (
              <tr key={subcategoria.id}>
                <td>{subcategoria.nombre}</td>
                <td>{subcategoria?.categoria?.nombre || 'Sin categoría'}</td>
                <td>{subcategoria.tipo || 'producto'}</td>
                <td><span className={`badge ${subcategoria.activo ? 'badge-success' : 'badge-warning'}`}>{subcategoria.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(subcategoria.id)}>{subcategoria.activo ? 'Desactivar' : 'Activar'}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(subcategoria.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}