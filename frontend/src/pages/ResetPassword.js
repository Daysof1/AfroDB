import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './Login.css';
import { apiRequest } from '../api/client.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [passwordNueva, setPasswordNueva] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      setCheckingToken(true);
      try {
        await apiRequest(`/auth/reset-password/${token}`, {
          method: 'GET'
        });
        setTokenValid(true);
      } catch (err) {
        setError(err.message || 'Token inválido o expirado.');
      } finally {
        setCheckingToken(false);
      }
    };

    if (token) {
      validateToken();
    } else {
      setError('Token no proporcionado.');
      setCheckingToken(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!passwordNueva || passwordNueva.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`/auth/reset-password/${token}`, {
        method: 'POST',
        body: JSON.stringify({ passwordNueva })
      });

      setMessage(response.message || 'Contraseña restablecida correctamente.');
      setPasswordNueva('');
      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña.');
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
            <h2>Restablecer Contraseña</h2>
            <p>Elige una nueva contraseña segura para tu cuenta.</p>
          </div>
          <div className="login-form-wrapper">
            <h1>Restablecer Contraseña</h1>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-error">{error}</div>}

            {checkingToken ? (
              <p>Validando enlace...</p>
            ) : tokenValid ? (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => {
                      setPasswordNueva(e.target.value);
                      setError('');
                      setMessage('');
                    }}
                    placeholder="••••••••"
                    className="form-input"
                  />
                </div>

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </button>
              </form>
            ) : (
              <p>
                El enlace no es válido o ya expiró. <Link to="/forgot-password">Solicita uno nuevo</Link>.
              </p>
            )}

            <div className="login-footer">
              <p>¿Ya tienes tu contraseña? <Link to="/login">Inicia sesión aquí</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}