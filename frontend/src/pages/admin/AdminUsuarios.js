import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';
import { exportarUsuariosAPDF, exportarUsuariosAExcel } from '../../utils/exportUtils.js';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');
  const [showExportOptions, setShowExportOptions] = useState(false);
  const limite = 100;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUsuarioId, setEditingUsuarioId] = useState(null);
  const [newUsuario, setNewUsuario] = useState({
    tipo_documento: '',
    documento: '',
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'cliente',
    telefono: '',
    direccion: '',
  });

  const loadUsuarios = async () => {
    try {
      const response = await apiRequest(`/admin/usuarios?limite=${limite}`);
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

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const isEditing = Boolean(editingUsuarioId);
      const payload = isEditing
        ? (({ tipo_documento, documento, nombre, apellido, rol, telefono, direccion }) => ({ tipo_documento, documento, nombre, apellido, rol, telefono, direccion }))(newUsuario)
        : newUsuario;

      // Normalizar el tipo de documento al formato que espera el backend (ENUM exacto)
      const normalizeTipoDocumento = (raw) => {
        if (!raw) return 'C.C.';
        const v = String(raw).toUpperCase().replace(/\s+/g, '');
        if (v.includes('CC')) return 'C.C.';
        if (v.includes('TI')) return 'T.I.';
        if (v.includes('CE')) return 'C.E.';
        if (v.includes('PA')) return 'P.A.';
        return 'otro';
      };

      if (payload.tipo_documento !== undefined) payload.tipo_documento = normalizeTipoDocumento(payload.tipo_documento);

      await apiRequest(isEditing ? `/admin/usuarios/${editingUsuarioId}` : '/admin/usuarios', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setSuccess(isEditing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
      setEditingUsuarioId(null);
      setNewUsuario({
        tipo_documento: 'C.C.',
        documento: '',
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: 'cliente',
        telefono: '',
        direccion: '',
      });
      setIsFormOpen(false);
      await loadUsuarios();
    } catch (err) {
      setError(err.message || 'No se pudo crear el usuario');
    }
  };

  const handleEditUsuario = (usuario) => {
    setError('');
    setSuccess('');
    setEditingUsuarioId(usuario.id);
    setNewUsuario({
      tipo_documento: usuario.tipo_documento || 'C.C.',
      documento: usuario.documento || '',
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      email: usuario.email || '',
      password: '',
      rol: usuario.rol || 'cliente',
      telefono: usuario.telefono || '',
      direccion: usuario.direccion || '',
    });
    setIsFormOpen(true);
  };

  const handleCancelForm = () => {
    setIsFormOpen(false);
    setEditingUsuarioId(null);
    setNewUsuario({
      tipo_documento: 'C.C.',
      documento: '',
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      rol: 'cliente',
      telefono: '',
      direccion: '',
    });
  };

  const handleToggle = async (id) => {
    try {
      setError('');
      await apiRequest(`/admin/usuarios/${id}/toggle`, { method: 'PATCH' });
      await loadUsuarios();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado del usuario');
    }
  };

  const handleDelete = async (id) => {
    try {
      setError('');
      await apiRequest(`/admin/usuarios/${id}`, { method: 'DELETE' });
      await loadUsuarios();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el usuario');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>

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
                      exportarUsuariosAPDF(usuarios);
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
                      await exportarUsuariosAExcel(usuarios);
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

        <button className="btn btn-primary" onClick={() => (isFormOpen ? handleCancelForm() : setIsFormOpen(true))}>
          {isFormOpen ? 'Cancelar' : '➕ Nuevo Usuario'}
        </button>
      </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
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

      {isFormOpen && (
        <div className="form-container">
          <h2>{editingUsuarioId ? 'Editar Usuario' : 'Crear Usuario'}</h2>
          <form onSubmit={handleCrearUsuario}>
            <div className="form-group">
              <label>Tipo Documento</label>
              <select value={newUsuario.tipo_documento} onChange={(e) => setNewUsuario({ ...newUsuario, tipo_documento: e.target.value })}>
                <option value="C.C.">C.C.</option>
                <option value="T.I.">T.I.</option>
                <option value="C.E.">C.E.</option>
                <option value="P.A.">P.A.</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div className="form-group"><label>Documento</label><input value={newUsuario.documento} onChange={(e) => setNewUsuario({ ...newUsuario, documento: e.target.value })} required /></div>
            <div className="form-group"><label>Nombre</label><input value={newUsuario.nombre} onChange={(e) => setNewUsuario({ ...newUsuario, nombre: e.target.value })} required /></div>
            <div className="form-group"><label>Apellido</label><input value={newUsuario.apellido} onChange={(e) => setNewUsuario({ ...newUsuario, apellido: e.target.value })} required /></div>
            <div className="form-group"><label>Email</label><input type="email" value={newUsuario.email} onChange={(e) => setNewUsuario({ ...newUsuario, email: e.target.value })} disabled={editingUsuarioId} required={!editingUsuarioId} /></div>
            {!editingUsuarioId && (
              <div className="form-group"><label>Contraseña</label><input type="password" value={newUsuario.password} onChange={(e) => setNewUsuario({ ...newUsuario, password: e.target.value })} required /></div>
            )}
            <div className="form-group">
              <label>Rol</label>
              <select value={newUsuario.rol} onChange={(e) => setNewUsuario({ ...newUsuario, rol: e.target.value })}>
                <option value="cliente">Cliente</option>
                <option value="profesional">Profesional</option>
                <option value="auxiliar">Auxiliar</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
            <div className="form-group"><label>Teléfono</label><input value={newUsuario.telefono} onChange={(e) => setNewUsuario({ ...newUsuario, telefono: e.target.value })} /></div>
            <div className="form-group"><label>Dirección</label><textarea value={newUsuario.direccion} onChange={(e) => setNewUsuario({ ...newUsuario, direccion: e.target.value })} /></div>
            <button type="submit" className="btn btn-primary">{editingUsuarioId ? 'Actualizar Usuario' : 'Guardar Usuario'}</button>
          </form>
        </div>
      )}

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
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEditUsuario(usuario)}>✏️ Editar</button>
              <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(usuario.id)}>{usuario.activo ? '⊘ Desactivar' : '✓ Activar'}</button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(usuario.id)}>🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
