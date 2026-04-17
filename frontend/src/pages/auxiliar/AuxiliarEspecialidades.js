import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AuxiliarEspecialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEspecialidadId, setEditingEspecialidadId] = useState(null);
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
      const isEditing = Boolean(editingEspecialidadId);
      await apiRequest(isEditing ? `/admin/especialidades/${editingEspecialidadId}` : '/admin/especialidades', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(newEspecialidad),
      });
      setSuccess(isEditing ? 'Especialidad actualizada correctamente' : 'Especialidad creada correctamente');
      setEditingEspecialidadId(null);
      setNewEspecialidad({ nombre: '', descripcion: '' });
      setIsFormOpen(false);
      await loadEspecialidades();
    } catch (err) {
      setError(err.message || 'No se pudo crear la especialidad');
    }
  };

  const handleToggle = async (id) => {
    try {
      setError('');
      await apiRequest(`/admin/especialidades/${id}/toggle`, { method: 'PATCH' });
      await loadEspecialidades();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado');
    }
  };

  const handleEdit = (especialidad) => {
    setError('');
    setSuccess('');
    setEditingEspecialidadId(especialidad.id);
    setNewEspecialidad({
      nombre: especialidad.nombre || '',
      descripcion: especialidad.descripcion || '',
    });
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingEspecialidadId(null);
    setNewEspecialidad({ nombre: '', descripcion: '' });
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Especialidades</h1>
        <button className="btn btn-primary" onClick={() => (isFormOpen ? handleCancelForm() : setIsFormOpen(true))}>
          {isFormOpen ? 'Cancelar' : '➕ Nueva Especialidad'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>{editingEspecialidadId ? 'Editar Especialidad' : 'Crear Especialidad'}</h2>
          <form onSubmit={handleCrear}>
            <div className="form-group"><label>Nombre</label><input value={newEspecialidad.nombre} onChange={(e) => setNewEspecialidad({ ...newEspecialidad, nombre: e.target.value })} required /></div>
            <div className="form-group"><label>Descripción</label><textarea value={newEspecialidad.descripcion} onChange={(e) => setNewEspecialidad({ ...newEspecialidad, descripcion: e.target.value })} /></div>
            <button type="submit" className="btn btn-primary">{editingEspecialidadId ? 'Actualizar' : 'Guardar'}</button>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {especialidades.map((especialidad) => (
          <div key={especialidad.id} className="service-card">
            <h3>{especialidad.nombre}</h3>
            <p>{especialidad.descripcion || 'Sin descripción'}</p>
            <p>
              <span className={`badge ${especialidad.activo ? 'badge-success' : 'badge-danger'}`}>
                {especialidad.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(especialidad)}>Editar</button>
              <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(especialidad.id)}>{especialidad.activo ? 'Desactivar' : 'Activar'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

