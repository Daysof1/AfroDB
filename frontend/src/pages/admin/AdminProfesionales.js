import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AdminProfesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo_documento: 'C.C.',
    documento: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    activo: true,
  });

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
      tipo_documento: profesional.tipo_documento || 'C.C.',
      documento: profesional.documento || '',
      nombre: profesional.nombre || '',
      apellido: profesional.apellido || '',
      email: profesional.email || '',
      telefono: profesional.telefono || '',
      direccion: profesional.direccion || '',
      activo: profesional.activo,
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      setError('');
      setSuccess('');
      await apiRequest(`/admin/profesionales/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });
      setSuccess('Profesional actualizado correctamente');
      setEditingId(null);
      setIsFormOpen(false);
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

  const handleToggleActivo = async (profesional) => {
    try {
      setError('');
      setSuccess('');
      await apiRequest(`/admin/profesionales/${profesional.id}`, {
        method: 'PUT',
        body: JSON.stringify({ activo: !profesional.activo }),
      });
      setSuccess(`Profesional ${profesional.activo ? 'desactivado' : 'activado'} correctamente`);
      await loadProfesionales();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado del profesional');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsFormOpen(false);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Profesionales</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Editar Profesional</h2>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Tipo de Documento</label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}
              >
                <option value="C.C.">C.C.</option>
                <option value="T.I.">T.I.</option>
                <option value="C.E.">C.E.</option>
                <option value="P.A.">P.A.</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group">
              <label>Documento</label>
              <input
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Nombre</label>
              <input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {profesionales.map((profesional) => (
          <div key={profesional.id} className="service-card">
            <h3>{profesional.nombre} {profesional.apellido || ''}</h3>
            <p><strong>Documento:</strong> {profesional.documento || 'N/A'}</p>
            <p><strong>Email:</strong> {profesional.email}</p>
            <p><strong>Teléfono:</strong> {profesional.telefono || 'N/A'}</p>
            <p><strong>Rol:</strong> {profesional.rol || 'profesional'}</p>
            <p><strong>Especialidades:</strong> {(profesional.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidades'}</p>
            <p>
              <span className={`badge ${profesional.activo ? 'badge-success' : 'badge-danger'}`}>
                {profesional.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(profesional)}>✏️ Editar</button>
              <button
                className={`btn btn-sm ${profesional.activo ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleActivo(profesional)}
              >
                {profesional.activo ? '⊘ Desactivar' : '✓ Activar'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(profesional.id)}>🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
