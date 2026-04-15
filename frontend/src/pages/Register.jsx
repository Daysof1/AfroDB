import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Obtener usuarios registrados
  const getRegisteredUsers = () => {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Verificar si el email ya está registrado
    const registeredUsers = getRegisteredUsers();
    if (registeredUsers.some(user => user.email.toLowerCase() === email.toLowerCase())) {
      setError('Este correo ya está registrado');
      return;
    }

    // Asignar rol automáticamente según el email
    let assignedRole = 'cliente'; // Por defecto
    const emailLower = email.toLowerCase();
    
    if (emailLower.includes('admin')) {
      assignedRole = 'admin';
    } else if (emailLower.includes('prof') || emailLower.includes('doctor') || emailLower.includes('especialista')) {
      assignedRole = 'profesional';
    } else if (emailLower.includes('auxiliar')) {
      assignedRole = 'auxiliar';
    }

    // Registrar nuevo usuario
    const newUser = {
      email: email.toLowerCase(),
      password,
      role: assignedRole,
    };

    registeredUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    setSuccess('¡Registro exitoso! Redirigiendo a iniciar sesión...');

    // Redirigir a login después de 1.5 segundos
    setTimeout(() => {
      navigate('/login');
    }, 1500);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-content">
          <div className="register-illustration">
            <div className="illustration-circle"><img src="/uploads/icono_DB.png" alt="AfroDB Logo" className="logo-image" /></div>
            <h2>Únete a AfroDB</h2>
            <p>Tu plataforma de belleza y bienestar</p>
            <div className="help-text">
              <p><strong>¿Cómo funciona?</strong></p>
              <p>1. Completa tu email y contraseña</p>
              <p>2. El sistema asignará tu rol automáticamente</p>
              <p>3. Inicia sesión para acceder</p>
            </div>
          </div>

          <div className="register-form-wrapper">
            <h1>Crear Cuenta</h1>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleRegister}>
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
                <small>El sistema asignará tu rol basado en tu email</small>
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
                <small>Mínimo 6 caracteres</small>
              </div>

              <div className="form-group">
                <label>Confirmar Contraseña</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn-register">
                Crear Cuenta
              </button>
            </form>

            <div className="register-footer">
              <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link></p>
              <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '1rem' }}>
                Al registrarte aceptas nuestros términos de servicio
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
