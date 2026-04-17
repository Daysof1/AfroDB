import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Register.css';
import { apiRequest, getAssetUrl } from '../api/client.js';

export default function Register() {
  const [tipoDocumento, setTipoDocumento] = useState('C.C.');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validaciones
    if (!tipoDocumento || !nombre || !apellido || !documento || !email || !password || !confirmPassword) {
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

    try {
      setLoading(true);
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          tipo_documento: tipoDocumento,
          documento,
          nombre,
          apellido,
          email,
          password,
          telefono: telefono.trim() || undefined,
          direccion: direccion.trim() || undefined,
        }),
      });

      setSuccess('¡Registro exitoso! Redirigiendo a iniciar sesión...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'No se pudo registrar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-content">
          <div className="register-illustration">
            <div className="illustration-circle"><img src={getAssetUrl('/uploads/AfroDB.png')} alt="AfroDB Logo" className="logo-image" /></div>
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
                <label>Tipo de Documento</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => {
                    setTipoDocumento(e.target.value);
                    setError('');
                  }}
                  className="form-input"
                >
                  <option value="C.C.">C.C.</option>
                  <option value="T.I.">T.I.</option>
                  <option value="C.E.">C.E.</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>

              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setError('');
                  }}
                  placeholder="Tu nombre"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Apellido</label>
                <input
                  type="text"
                  value={apellido}
                  onChange={(e) => {
                    setApellido(e.target.value);
                    setError('');
                  }}
                  placeholder="Tu apellido"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Documento</label>
                <input
                  type="text"
                  value={documento}
                  onChange={(e) => {
                    setDocumento(e.target.value);
                    setError('');
                  }}
                  placeholder="Número de documento"
                  className="form-input"
                />
              </div>

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
                <small>Tu cuenta se crea como cliente</small>
              </div>

              <div className="form-group">
                <label>Teléfono (opcional)</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setError('');
                  }}
                  placeholder="3001234567"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Dirección (opcional)</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => {
                    setDireccion(e.target.value);
                    setError('');
                  }}
                  placeholder="Tu dirección de envío"
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

              <button type="submit" className="btn-register" disabled={loading}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
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

