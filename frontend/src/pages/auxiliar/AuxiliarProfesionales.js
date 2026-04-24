import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AuxiliarProfesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState(null);
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

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Profesionales</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="cards-grid">
        {profesionales.map((profesional) => (
          <div key={profesional.id} className="service-card">
            <h3>{profesional.nombre} {profesional.apellido || ''}</h3>
            <p><strong>Tipo Doc:</strong> {editingId === profesional.id ? (
              <select value={formData.tipo_documento} onChange={(e) => setFormData({ ...formData, tipo_documento: e.target.value })}>
                <option value="C.C.">C.C.</option>
                <option value="T.I.">T.I.</option>
                <option value="C.E.">C.E.</option>
                <option value="P.A.">P.A.</option>
                <option value="otro">Otro</option>
              </select>
            ) : (profesional.tipo_documento || 'N/A')}</p>
            <p><strong>Documento:</strong> {editingId === profesional.id ? (
              <input value={formData.documento} onChange={(e) => setFormData({ ...formData, documento: e.target.value })} />
            ) : (profesional.documento || 'N/A')}</p>
            <p><strong>Nombre:</strong> {editingId === profesional.id ? (
              <input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
            ) : profesional.nombre}</p>
            <p><strong>Apellido:</strong> {editingId === profesional.id ? (
              <input value={formData.apellido} onChange={(e) => setFormData({ ...formData, apellido: e.target.value })} />
            ) : (profesional.apellido || 'N/A')}</p>
            <p><strong>Email:</strong> {editingId === profesional.id ? (
              <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            ) : profesional.email}</p>
            <p><strong>Teléfono:</strong> {editingId === profesional.id ? (
              <input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
            ) : (profesional.telefono || 'N/A')}</p>
            <p><strong>Dirección:</strong> {editingId === profesional.id ? (
              <input value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
            ) : (profesional.direccion || 'N/A')}</p>
            <p><strong>Rol:</strong> {profesional.rol || 'profesional'}</p>
            <p><strong>Especialidades:</strong> {(profesional.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidades'}</p>
            <p>
              <span className={`badge ${profesional.activo ? 'badge-success' : 'badge-danger'}`}>
                {profesional.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

