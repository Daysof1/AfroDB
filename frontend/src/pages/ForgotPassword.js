import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Login.css';
import { apiRequest } from '../api/client.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const emailNormalizado = email.trim().toLowerCase();
    if (!emailNormalizado) {
      setError('Por favor ingresa tu correo electrónico.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: emailNormalizado }),
      });

      setMessage(response.message || 'Se ha enviado el enlace de recuperación si el email existe.');
      setEmail('');
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="login-illustration">
            <div className="illustration-circle"><span>?</span></div>
            <h2>Recuperar Contraseña</h2>
            <p>Ingresa tu correo y te enviaremos el enlace para restablecerla.</p>
          </div>
          <div className="login-form-wrapper">
            <h1>¿Olvidaste tu contraseña?</h1>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                    setMessage('');
                  }}
                  placeholder="tu@email.com"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
            </form>

            <div className="login-footer">
              <p>¿Recordaste tu contraseña? <Link to="/login">Inicia sesión aquí</Link></p>
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
                Si tu email está registrado, recibirás un enlace en los próximos minutos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
