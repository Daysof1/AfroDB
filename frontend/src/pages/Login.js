// Página: Login.js. p?gina de inicio de sesión para autenticar usuarios.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { apiRequest, saveSession, normalizeRole, getAssetUrl, getLocalCartItems, clearLocalCart } from '../api/client.js';

// Renderiza la vista principal de este componente.
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();


  // ==========================================
// FUNCIONES AUXILIARES
// ==========================================

  const validateLoginForm = (email, password) => {
    const emailNormalizado = email.trim().toLowerCase();
    
    if (!emailNormalizado || !password) {
      return { valid: false, error: 'Por favor completa todos los campos', emailNormalizado };
    }

    if (password.length < 6) {
      return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres', emailNormalizado };
    }

    return { valid: true, error: '', emailNormalizado };
  };

  const migrateLocalCart = async () => {
    const localItems = getLocalCartItems();
    if (!Array.isArray(localItems) || localItems.length === 0) {
      return;
    }

    for (const item of localItems) {
      try {
        await apiRequest('/cliente/carrito', {
          method: 'POST',
          body: JSON.stringify({ productoId: item.productoId, cantidad: item.cantidad }),
        });
      } catch (err) {
        console.warn('No se pudo migrar item al carrito:', item, err.message || err);
      }
    }
  };

  const redirectByRole = (role, navigate) => {
    const normalizedRole = normalizeRole(role);
    
    switch (normalizedRole) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'auxiliar':
        navigate('/auxiliar/dashboard');
        break;
      case 'profesional':
        navigate('/profesional/dashboard');
        break;
      default:
        navigate('/cliente/catalogo');
    }
  };

// ==========================================
// HANDLE LOGIN (REFACTORIZADO)
// ==========================================

const handleLogin = async (e) => {
  e.preventDefault();
  
  const validation = validateLoginForm(email, password);
  if (!validation.valid) {
    setError(validation.error);
    return;
  }

  setLoading(true);
  setError('');

  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: validation.emailNormalizado, password }),
    });

    const usuario = response?.data?.usuario;
    const token = response?.data?.token;

    if (!usuario || !token) {
      throw new Error('Respuesta inválida del servidor');
    }

    saveSession({ token, usuario });

    // Migrar carrito local
    try {
      await migrateLocalCart();
    } catch (err) {
      console.warn('Error migrando carrito local:', err.message || err);
    } finally {
      clearLocalCart();
    }

    window.dispatchEvent(new Event('authChange'));

    redirectByRole(usuario.rol, navigate);

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
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  id="email"
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
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
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
