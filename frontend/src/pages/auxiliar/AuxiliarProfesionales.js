import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AuxiliarProfesionales() {
  const [profesionales, setProfesionales] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');

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

  const profesionalesFiltrados = profesionales.filter((profesional) => {
    const textoBusqueda = busqueda.toLowerCase().trim();
    const coincideBusqueda =
    !textoBusqueda ||
      !textoBusqueda ||
      (profesional.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (profesional.apellido || '').toLowerCase().includes(textoBusqueda) ||
      (profesional.documento || '').toLowerCase().includes(textoBusqueda) ||
      (profesional.email || '').toLowerCase().includes(textoBusqueda) ||
      (profesional.telefono || '').toLowerCase().includes(textoBusqueda);

   const coincideEstado =
    filtro === 'Todos' ||
    (filtro === 'True' && profesional.activo) ||
    (filtro === 'False' && !profesional.activo);

  return coincideBusqueda && coincideEstado;
});

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Profesionales</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar profesionales..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-input"
        />
        <button
            className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`}
            onClick={() => setFiltro('Todos')}
          >
            Todas ({profesionales.length})
          </button>
          <button
            className={`filter-btn ${filtro === 'True' ? 'active' : ''}`}
            onClick={() => setFiltro('True')}
          >
            Activas ({profesionales.filter((p) => p.activo === true).length})
          </button>

          <button
            className={`filter-btn ${filtro === 'False' ? 'active' : ''}`}
            onClick={() => setFiltro('False')}
          >
            Inactivas ({profesionales.filter((p) => p.activo === false).length})
          </button>
      </div>


      <div className="cards-grid">
        {profesionalesFiltrados.map((profesional) => (
          <div key={profesional.id} className="service-card">
            <h3>{profesional.nombre} {profesional.apellido || ''}</h3>
            <p><strong>Tipo Doc:</strong> {profesional.tipo_documento || 'N/A'}</p>
            <p><strong>Documento:</strong> {profesional.documento || 'N/A'}</p>
            <p><strong>Nombre:</strong> {profesional.nombre}</p>
            <p><strong>Apellido:</strong> {profesional.apellido || 'N/A'}</p>
            <p><strong>Email:</strong> {profesional.email}</p>
            <p><strong>Teléfono:</strong> {profesional.telefono || 'N/A'}</p>
            <p><strong>Dirección:</strong> {profesional.direccion || 'N/A'}</p>
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

