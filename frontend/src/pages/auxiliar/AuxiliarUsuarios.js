import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AuxiliarUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const limite = 100;

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

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const textoBusqueda = busqueda.toLowerCase().trim();
    return (
      !textoBusqueda ||
      (usuario.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.apellido || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.documento || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.email || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.telefono || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.direccion || '').toLowerCase().includes(textoBusqueda)
    );
  });

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Usuarios (solo lectura)</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="cards-grid">
        {usuariosFiltrados.map((usuario) => (
          <div key={usuario.id} className="service-card">
            <h3>{usuario.nombre} {usuario.apellido || ''}</h3>
            <p><strong>Tipo Doc:</strong> {usuario.tipo_documento || 'N/A'}</p>
            <p><strong>Documento:</strong> {usuario.documento || 'N/A'}</p>
            <p><strong>Email:</strong> {usuario.email}</p>
            <p><strong>Teléfono:</strong> {usuario.telefono || 'N/A'}</p>
            <p><strong>Dirección:</strong> {usuario.direccion || 'N/A'}</p>
            <p><strong>Rol:</strong> {usuario.rol}</p>
            <p>
              <span className={`badge ${usuario.activo ? 'badge-success' : 'badge-danger'}`}>
                {usuario.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

