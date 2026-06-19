import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';
import { exportarUsuariosAPDF, exportarUsuariosAExcel } from '../../utils/exportUtils.js';

export default function AuxiliarUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [showExportOptions, setShowExportOptions] = useState(false);
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
    const coincideBusqueda =
    !textoBusqueda ||
      !textoBusqueda ||
      !textoBusqueda ||
      (usuario.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.apellido || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.documento || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.email || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.telefono || '').toLowerCase().includes(textoBusqueda) ||
      (usuario.direccion || '').toLowerCase().includes(textoBusqueda);

      const coincideEstado =
    filtro === 'Todos' ||
    (filtro === 'True' && usuario.activo) ||
    (filtro === 'False' && !usuario.activo);

  return coincideBusqueda && coincideEstado;
});

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Usuarios (solo lectura)</h1>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowExportOptions(!showExportOptions)}
            >
              📊 Exportar
            </button>
            {showExportOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 10,
                minWidth: '150px',
                marginTop: '5px'
              }}>
                <button 
                  className="btn btn-sm"
                  onClick={() => {
                    exportarUsuariosAPDF(usuariosFiltrados);
                    setShowExportOptions(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 15px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📄 Exportar a PDF
                </button>
                <button 
                  className="btn btn-sm"
                  onClick={async () => {
                    await exportarUsuariosAExcel(usuariosFiltrados);
                    setShowExportOptions(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 15px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📊 Exportar a Excel
                </button>
              </div>
            )}
          </div>
        </div>
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

        <button
          className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`}
          onClick={() => setFiltro('Todos')}
        >
          Todos ({usuarios.length})
        </button>
        <button
          className={`filter-btn ${filtro === 'True' ? 'active' : ''}`}
          onClick={() => setFiltro('True')}
        >
          Activos ({usuarios.filter((u) => u.activo === true).length})
        </button>

        <button
          className={`filter-btn ${filtro === 'False' ? 'active' : ''}`}
          onClick={() => setFiltro('False')}
        >
          Inactivos ({usuarios.filter((u) => u.activo === false).length})
        </button>
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

