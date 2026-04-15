import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AuxiliarUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');

  const loadUsuarios = async () => {
    try {
      const response = await apiRequest('/admin/usuarios');
      setUsuarios(response?.data?.usuarios || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar usuarios');
    }
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Usuarios (solo lectura)</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nombre} {usuario.apellido}</td>
                <td>{usuario.email}</td>
                <td>{usuario.rol}</td>
                <td><span className={`badge ${usuario.activo ? 'badge-success' : 'badge-warning'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
