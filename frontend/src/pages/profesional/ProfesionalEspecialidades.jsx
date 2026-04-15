import { useEffect, useMemo, useState } from 'react';
import '../Profesional.css';
import { apiRequest } from '../../api/client';

export default function ProfesionalEspecialidades() {
  const [especialidades, setEspecialidades] = useState([]);
  const [catalogoEspecialidades, setCatalogoEspecialidades] = useState([]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newEsp, setNewEsp] = useState({ especialidadId: '' });
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [misEspRes, catalogoRes] = await Promise.all([
        apiRequest('/mis-especialidades'),
        apiRequest('/especialidades'),
      ]);
      setEspecialidades(misEspRes?.data?.especialidades || []);
      setCatalogoEspecialidades(catalogoRes?.data?.especialidades || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las especialidades');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const disponibles = useMemo(() => {
    const selectedIds = new Set(especialidades.map((e) => e.id));
    return catalogoEspecialidades.filter((e) => !selectedIds.has(e.id));
  }, [catalogoEspecialidades, especialidades]);

  const handleAddEspecialidad = async () => {
    if (!newEsp.especialidadId) return;

    try {
      await apiRequest('/mis-especialidades', {
        method: 'POST',
        body: JSON.stringify({ especialidadId: Number(newEsp.especialidadId) }),
      });
      setNewEsp({ especialidadId: '' });
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo agregar especialidad');
    }
  };

  const handleDeleteEspecialidad = async (id) => {
    try {
      await apiRequest(`/mis-especialidades/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar especialidad');
    }
  };

  return (
    <div className="profesional-page">
      <div className="page-header">
        <h1>⭐ Mis Especialidades</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Agregar Especialidad'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Agregar Nueva Especialidad</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleAddEspecialidad(); }}>
            <div className="form-group">
              <label>Selecciona una especialidad</label>
              <select
                value={newEsp.especialidadId}
                onChange={(e) => setNewEsp({ especialidadId: e.target.value })}
              >
                <option value="">Selecciona</option>
                {disponibles.map((esp) => (
                  <option key={esp.id} value={esp.id}>{esp.nombre}</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary">Guardar Especialidad</button>
          </form>
        </div>
      )}

      <div className="especialidades-grid">
        {especialidades.map(esp => (
          <div key={esp.id} className="esp-card">
            <div className="esp-header">
              <h3>{esp.nombre}</h3>
            </div>
            <p>{esp.descripcion || 'Sin descripción'}</p>
            <div className="esp-actions">
              <button 
                className="btn btn-sm btn-danger"
                onClick={() => handleDeleteEspecialidad(esp.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {especialidades.length === 0 && !isFormOpen && (
        <div className="empty-state">
          <p>No tienes especialidades registradas</p>
          <p>Agrega tus especialidades para que los clientes puedan conocer tus servicios</p>
        </div>
      )}
    </div>
  );
}
