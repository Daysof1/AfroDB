import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { apiRequest, saveSession, normalizeRole, getAssetUrl } from '../api/client.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
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
      setDebugInfo('');

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

  const handleDiagnosticarLogin = () => {
    const emailNormalizado = email.trim().toLowerCase();
    const payloadSeguro = {
      endpoint: '/api/auth/login',
      method: 'POST',
      body: {
        email: emailNormalizado,
        passwordLength: password.length,
      },
      validaciones: {
        emailVacio: !emailNormalizado,
        passwordVacio: !password,
        passwordMenorA6: password.length < 6,
      },
      nota: 'La contraseña real no se muestra por seguridad.',
    };

    setDebugInfo(JSON.stringify(payloadSeguro, null, 2));
    setError('');
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

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDiagnosticarLogin}
                style={{ marginTop: '0.75rem', width: '100%' }}
              >
                Diagnosticar Login
              </button>
            </form>

            {debugInfo && (
              <div className="alert" style={{ marginTop: '1rem', background: '#f6f1e9', border: '1px solid #d7c4ad' }}>
                <strong>Diagnóstico:</strong>
                <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{debugInfo}</pre>
              </div>
            )}

            <div className="login-footer">
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
