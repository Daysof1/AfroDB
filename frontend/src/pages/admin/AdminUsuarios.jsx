import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newUsuario, setNewUsuario] = useState({
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

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await apiRequest('/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify(newUsuario),
      });
      setSuccess('Usuario creado correctamente');
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
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nuevo Usuario'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Crear Usuario</h2>
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
            <div className="form-group"><label>Email</label><input type="email" value={newUsuario.email} onChange={(e) => setNewUsuario({ ...newUsuario, email: e.target.value })} required /></div>
            <div className="form-group"><label>Contraseña</label><input type="password" value={newUsuario.password} onChange={(e) => setNewUsuario({ ...newUsuario, password: e.target.value })} required /></div>
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
            <button type="submit" className="btn btn-primary">Guardar Usuario</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nombre} {usuario.apellido}</td>
                <td>{usuario.email}</td>
                <td>{usuario.rol}</td>
                <td><span className={`badge ${usuario.activo ? 'badge-success' : 'badge-warning'}`}>{usuario.activo ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleToggle(usuario.id)}>{usuario.activo ? 'Desactivar' : 'Activar'}</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(usuario.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}