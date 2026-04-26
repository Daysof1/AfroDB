import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { apiRequest } from '../api/client.js';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    passwordActual: '',
    passwordNueva: '',
    confirmarPassword: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validaciones
    if (!formData.passwordActual.trim()) {
      setError('La contraseña actual es obligatoria.');
      return;
    }
    if (!formData.passwordNueva.trim()) {
      setError('La nueva contraseña es obligatoria.');
      return;
    }
    if (formData.passwordNueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (formData.passwordNueva !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          passwordActual: formData.passwordActual,
          passwordNueva: formData.passwordNueva
        }),
      });

      setMessage(response.message || 'Contraseña cambiada exitosamente.');
      setFormData({
        passwordActual: '',
        passwordNueva: '',
        confirmarPassword: ''
      });

      // Redirigir al perfil después de 2 segundos
      setTimeout(() => {
        navigate('/profile');
      }, 2000);

    } catch (err) {
      console.error('Error cambiando contraseña:', err);
      setError(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="login-illustration">
            <div className="illustration-circle"><span>🔒</span></div>
            <h2>Cambiar Contraseña</h2>
            <p>Actualiza tu contraseña de forma segura.</p>
          </div>
          <div className="login-form-wrapper">
            <h1>Cambiar Contraseña</h1>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="passwordActual">Contraseña Actual</label>
                <input
                  type="password"
                  id="passwordActual"
                  name="passwordActual"
                  value={formData.passwordActual}
                  onChange={handleChange}
                  placeholder="Contraseña actual"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="passwordNueva">Nueva Contraseña</label>
                <input
                  type="password"
                  id="passwordNueva"
                  name="passwordNueva"
                  value={formData.passwordNueva}
                  onChange={handleChange}
                  placeholder="Nueva contraseña (mín. 6 caracteres)"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmarPassword">Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  id="confirmarPassword"
                  name="confirmarPassword"
                  value={formData.confirmarPassword}
                  onChange={handleChange}
                  placeholder="Confirma la nueva contraseña"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
            </form>

            <div className="login-links">
              <Link to="/profile" className="btn-back">← Volver al perfil</Link>
            </div>
          </div>
          </div>
        </div>
      </div>
  );
}