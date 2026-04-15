import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // Credenciales de prueba
    const validCredentials = {
      'admin@email.com': { password: '123456', role: 'admin' },
      'profesional@email.com': { password: '123456', role: 'profesional' },
      'cliente@email.com': { password: '123456', role: 'cliente' },
    };

    let user = validCredentials[email.toLowerCase()];

    // Si no está en credenciales de prueba, buscar en usuarios registrados
    if (!user) {
      const registeredUsers = localStorage.getItem('registeredUsers');
      const users = registeredUsers ? JSON.parse(registeredUsers) : [];
      
      const registeredUser = users.find(u => u.email === email.toLowerCase());
      if (registeredUser) {
        user = { password: registeredUser.password, role: registeredUser.role };
      }
    }

    if (!user || user.password !== password) {
      setError('Correo o contraseña incorrectos');
      return;
    }

    // Credenciales válidas - guardar en localStorage
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('token', 'fake-token-' + Date.now());

    // Disparar evento personalizado para notificar a App.jsx
    window.dispatchEvent(new Event('authChange'));

    // Redirigir según el rol
    setTimeout(() => {
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (user.role === 'profesional') {
        navigate('/profesional/dashboard');
      } else if (user.role === 'cliente') {
        navigate('/cliente/catalogo');
      }
    }, 100);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-content">
          <div className="login-illustration">
            <div className="illustration-circle"><img src="/uploads/icono_DB.png" alt="AfroDB Logo" className="logo-image" /></div>
            <h2>Bienvenido a AfroDB</h2>
            <p>Tu plataforma de belleza y bienestar</p>
            <div className="help-text">
              <p><strong>Prueba con:</strong></p>
              <p>📧 admin@email.com | 🔑 123456</p>
              <p>📧 profesional@email.com | 🔑 123456</p>
              <p>📧 cliente@email.com | 🔑 123456</p>
            </div>
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

              <button type="submit" className="btn-login">
                Ingresar
              </button>
            </form>

            <div className="login-footer">
              <p>¿No tienes cuenta? <a href="#registro">Regístrate aquí</a></p>
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