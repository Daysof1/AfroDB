import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AuxiliarCitas() {
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');

  const loadCitas = async () => {
    try {
      const response = await apiRequest('/admin/citas');
      setCitas(response?.data?.citas || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar citas');
    }
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const handleCancelar = async (id) => {
    try {
      await apiRequest(`/admin/citas/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado: 'cancelada' }),
      });
      await loadCitas();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar la cita');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Citas</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Profesional</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.map((cita) => (
              <tr key={cita.id}>
                <td>{cita?.cliente?.nombre || 'Cliente'}</td>
                <td>{cita?.profesional?.nombre || 'Profesional'}</td>
                <td>{(cita.Servicios || []).map((servicio) => servicio.nombre).join(', ') || 'Servicio'}</td>
                <td>{cita.fecha}</td>
                <td>
                  <span className={`badge ${(cita.estado || '').toLowerCase() === 'confirmada' ? 'badge-success' : 'badge-warning'}`}>
                    {cita.estado}
                  </span>
                </td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => handleCancelar(cita.id)}>Cancelar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
