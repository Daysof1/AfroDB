import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { apiRequest, saveSession, normalizeRole, getAssetUrl } from '../api/client.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const emailNormalizado = email.trim().toLowerCase();
    
    if (!emailNormalizado || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailNormalizado, password }),
      });

      const usuario = response?.data?.usuario;
      const token = response?.data?.token;

      if (!usuario || !token) {
        throw new Error('Respuesta inválida del servidor');
      }

      saveSession({ token, usuario });
      window.dispatchEvent(new Event('authChange'));

      const role = normalizeRole(usuario.rol);
      if (role === 'admin') {
        navigate('/admin/dashboard');
      } else if (role === 'auxiliar') {
        navigate('/auxiliar/dashboard');
      } else if (role === 'profesional') {
        navigate('/profesional/dashboard');
      } else {
        navigate('/cliente/catalogo');
      }
    } catch (err) {
      setError(err.message || 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="login-illustration">
            <div className="illustration-circle"><img src={getAssetUrl('/uploads/AfroDB.png')} alt="AfroDB Logo" className="logo-image" /></div>
            <h2>Bienvenido a AfroDB</h2>
            <p>Tu plataforma de belleza y bienestar</p>
          </div>

          <div className="login-form-wrapper">
            <h1>Iniciar Sesión</h1>
            
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="tu@email.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-login" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <div className="login-footer">
              <p><Link to="/forgot-password">¿Olvidaste tu contraseña?</Link></p>
              <p>¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link></p>
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
                El sistema reconocerá automáticamente tu rol
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
