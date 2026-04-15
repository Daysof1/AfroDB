import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AdminProfesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', activo: true });

  const loadProfesionales = async () => {
    try {
      const response = await apiRequest('/admin/profesionales');
      setProfesionales(response?.data?.profesionales || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar profesionales');
    }
  };

  useEffect(() => {
    loadProfesionales();
  }, []);

  const handleEdit = (profesional) => {
    setEditingId(profesional.id);
    setFormData({
      nombre: profesional.nombre || '',
      email: profesional.email || '',
      telefono: profesional.telefono || '',
      activo: profesional.activo,
    });
  };

  const handleSave = async (id) => {
    try {
      setError('');
      setSuccess('');
      await apiRequest(`/admin/profesionales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setSuccess('Profesional actualizado correctamente');
      setEditingId(null);
      await loadProfesionales();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el profesional');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/admin/profesionales/${id}`, { method: 'DELETE' });
      await loadProfesionales();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el profesional');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Profesionales</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Especialidades</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profesionales.map((profesional) => (
              <tr key={profesional.id}>
                <td>
                  {editingId === profesional.id ? (
                    <input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                  ) : (
                    profesional.nombre
                  )}
                </td>
                <td>
                  {editingId === profesional.id ? (
                    <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  ) : (
                    profesional.email
                  )}
                </td>
                <td>
                  {editingId === profesional.id ? (
                    <input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                  ) : (
                    profesional.telefono || 'N/A'
                  )}
                </td>
                <td>{(profesional.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidades'}</td>
                <td><span className={`badge ${profesional.activo ? 'badge-success' : 'badge-warning'}`}>{profesional.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  {editingId === profesional.id ? (
                    <button className="btn btn-sm btn-primary" onClick={() => handleSave(profesional.id)}>Guardar</button>
                  ) : (
                    <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(profesional)}>Editar</button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(profesional.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}