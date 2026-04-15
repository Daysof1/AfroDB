import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AuxiliarProfesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [error, setError] = useState('');

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

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Profesionales</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Especialidades</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {profesionales.map((profesional) => (
              <tr key={profesional.id}>
                <td>{profesional.nombre}</td>
                <td>{profesional.email}</td>
                <td>{profesional.telefono || 'N/A'}</td>
                <td>{(profesional.especialidades || []).map((e) => e.nombre).join(', ') || 'Sin especialidades'}</td>
                <td><span className={`badge ${profesional.activo ? 'badge-success' : 'badge-warning'}`}>{profesional.activo ? 'Activo' : 'Inactivo'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
