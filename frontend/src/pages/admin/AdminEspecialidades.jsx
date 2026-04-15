import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AdminEspecialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newEspecialidad, setNewEspecialidad] = useState({ nombre: '', descripcion: '' });

  const loadEspecialidades = async () => {
    try {
      const response = await apiRequest('/admin/especialidades');
      setEspecialidades(response?.data?.especialidades || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar especialidades');
    }
  };

  useEffect(() => {
    loadEspecialidades();
  }, []);

  const handleCrear = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await apiRequest('/admin/especialidades', {
        method: 'POST',
        body: JSON.stringify(newEspecialidad),
      });
      setSuccess('Especialidad creada correctamente');
      setNewEspecialidad({ nombre: '', descripcion: '' });
      setIsFormOpen(false);
      await loadEspecialidades();
    } catch (err) {
      setError(err.message || 'No se pudo crear la especialidad');
    }
  };

  const handleToggle = async (id) => {
    try {
      await apiRequest(`/admin/especialidades/${id}/toggle`, { method: 'PATCH' });
      await loadEspecialidades();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/admin/especialidades/${id}`, { method: 'DELETE' });
      await loadEspecialidades();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la especialidad');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Especialidades</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nueva Especialidad'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Crear Especialidad</h2>
          <form onSubmit={handleCrear}>
            <div className="form-group"><label>Nombre</label><input value={newEspecialidad.nombre} onChange={(e) => setNewEspecialidad({ ...newEspecialidad, nombre: e.target.value })} required /></div>
            <div className="form-group"><label>Descripción</label><textarea value={newEspecialidad.descripcion} onChange={(e) => setNewEspecialidad({ ...newEspecialidad, descripcion: e.target.value })} /></div>
            <button type="submit" className="btn btn-primary">Guardar Especialidad</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {especialidades.map((especialidad) => (
              <tr key={especialidad.id}>
                <td>{especialidad.nombre}</td>
                <td>{especialidad.descripcion || 'Sin descripción'}</td>
                <td><span className={`badge ${especialidad.activo ? 'badge-success' : 'badge-warning'}`}>{especialidad.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(especialidad.id)}>{especialidad.activo ? 'Desactivar' : 'Activar'}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(especialidad.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}