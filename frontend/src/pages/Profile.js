import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest, getToken, getAssetUrl } from '../api/client.js';
import './Profile.css'; // CSS específico para el perfil

export default function Profile() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [editData, setEditData] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await apiRequest('/auth/me', { method: 'GET' });
        if (response.success) {
          const usuario = response.data.usuario;
          setUserData(usuario);
          setEditData(usuario);
          setPhotoPreview(usuario.imagen ? getAssetUrl(`/uploads/${usuario.imagen}`) : null);
        } else {
          setError(response.message || 'Error al obtener datos del perfil');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveEdit = async () => {
    setError('');
    setMessage('');

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('nombre', editData.nombre || '');
      formData.append('apellido', editData.apellido || '');
      formData.append('telefono', editData.telefono || '');
      formData.append('direccion', editData.direccion || '');
      if (editData.tipo_documento) {
        formData.append('tipo_documento', editData.tipo_documento);
      }
      if (photoFile) {
        formData.append('foto', photoFile);
      }

      const response = await apiRequest('/auth/me', {
        method: 'PUT',
        body: formData,
      });

      if (response.success) {
        const updatedUser = response.data.usuario;
        setUserData(updatedUser);
        setEditData(updatedUser);
        setPhotoFile(null);
        setPhotoPreview(updatedUser.imagen ? getAssetUrl(`/uploads/${updatedUser.imagen}`) : null);
        setMessage('Perfil actualizado exitosamente.');
        setIsEditing(false);
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(response.message || 'Error al actualizar el perfil');
      }
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      setError(err.message || 'No se pudo actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData(userData);
    setIsEditing(false);
    setError('');
    setPhotoFile(null);
    setPhotoPreview(userData?.imagen ? getAssetUrl(`/uploads/${userData.imagen}`) : null);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-loading">
            <h2>Cargando perfil...</h2>
            <div style={{ fontSize: '2rem', marginTop: '1rem' }}>⏳</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="profile-error">
            <h2>❌ Error</h2>
            <p>{error}</p>
            <Link to="/" className="btn-profile btn-secondary">
              🏠 Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h2>👤 Mi Perfil</h2>
          <div className="profile-avatar">
            {photoPreview ? (
              <img src={photoPreview} alt="Foto de perfil" className="profile-avatar-image" />
            ) : (
              <span>{userData.nombre?.charAt(0)?.toUpperCase() || '👤'}</span>
            )}
          </div>
          {isEditing && userData?.rol === 'profesional' && (
            <div className="profile-avatar-upload">
              <label htmlFor="profile-photo-upload" className="file-upload-label">
                📷 Subir foto
              </label>
              <input
                id="profile-photo-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="file-upload-input"
                onChange={handlePhotoChange}
              />
              {photoFile && <div className="profile-upload-note">{photoFile.name}</div>}
            </div>
          )}
        </div>

        <div className="profile-content">
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}

          <div className="profile-data">
            <div className="profile-card">
              <div className="card-header">
                <h3>Información Personal</h3>
                {!isEditing && (
                  <button 
                    type="button"
                    className="btn-edit-icon"
                    onClick={() => setIsEditing(true)}
                    title="Editar perfil"
                  >
                    ✏️
                  </button>
                )}
              </div>
              {isEditing ? (
                <>
                  <div className="form-group">
                    <label htmlFor="nombre">Nombre</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={editData.nombre || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="apellido">Apellido</label>
                    <input
                      type="text"
                      id="apellido"
                      name="apellido"
                      value={editData.apellido || ''}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="tipo_documento">Tipo de Documento</label>
                    <select
                      id="tipo_documento"
                      name="tipo_documento"
                      value={editData.tipo_documento || ''}
                      onChange={handleEditChange}
                    >
                      <option value="C.C.">C.C.</option>
                      <option value="T.I.">T.I.</option>
                      <option value="C.E.">C.E.</option>
                      <option value="P.A.">P.A.</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="documento">Documento</label>
                    <input
                      type="text"
                      id="documento"
                      name="documento"
                      value={editData.documento || ''}
                      disabled
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Nombre</span>
                    <span className="profile-info-value">{userData.nombre}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Apellido</span>
                    <span className="profile-info-value">{userData.apellido}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Tipo de Documento</span>
                    <span className="profile-info-value">{userData.tipo_documento}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Documento</span>
                    <span className="profile-info-value">{userData.documento}</span>
                  </div>
                </>
              )}
            </div>

            <div className="profile-card">
              <h3>Contacto</h3>
              {isEditing ? (
                <>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={editData.email || ''}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      type="text"
                      id="telefono"
                      name="telefono"
                      value={editData.telefono || ''}
                      onChange={handleEditChange}
                      placeholder="Ej: +57 123 456 7890"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="direccion">Dirección</label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      value={editData.direccion || ''}
                      onChange={handleEditChange}
                      placeholder="Ej: Calle 123 #456"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Email</span>
                    <span className="profile-info-value">{userData.email}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Teléfono</span>
                    <span className="profile-info-value">
                      {userData.telefono || <span className="empty">No especificado</span>}
                    </span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-info-label">Dirección</span>
                    <span className="profile-info-value">
                      {userData.direccion || <span className="empty">No especificada</span>}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="profile-actions">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="btn-profile btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? '💾 Guardando...' : '💾 Guardar Cambios'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-profile btn-secondary"
                  disabled={isSaving}
                >
                  ❌ Cancelar
                </button>
              </>
            ) : (
              <>
                <Link to="/change-password" className="btn-profile btn-primary">
                  🔐 Cambiar Contraseña
                </Link>
                <Link to="/" className="btn-profile btn-secondary">
                  🏠 Volver al Inicio
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
