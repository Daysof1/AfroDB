import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import { clearSession } from './api/client.js';

// Componentes compartidos
import Navbar from './components/Navbar.js';
import Sidebar from './components/Sidebar.js';
import Footer from './components/Footer.js';

// Páginas públicas
import Home from './pages/Home.js';
import Login from './pages/Login.js';
import Register from './pages/Register.js';

// Páginas Admin
import AdminDashboard from './pages/admin/AdminDashboard.js';
import AdminProductos from './pages/admin/AdminProductos.js';
import AdminServicios from './pages/admin/AdminServicios.js';
import AdminCategorias from './pages/admin/AdminCategorias.js';
import AdminSubcategorias from './pages/admin/AdminSubcategorias.js';
import AdminEspecialidades from './pages/admin/AdminEspecialidades.js';
import AdminProfesionales from './pages/admin/AdminProfesionales.js';
import AdminUsuarios from './pages/admin/AdminUsuarios.js';
import AdminCitas from './pages/admin/AdminCitas.js';
import AdminPedidos from './pages/admin/AdminPedidos.js';

// Páginas Cliente
import ClienteCatalogo from './pages/cliente/ClienteCatalogo.js';
import ClienteCarrito from './pages/cliente/ClienteCarrito.js';
import ClientePedidos from './pages/cliente/ClientePedidos.js';
import ClienteProfesionales from './pages/cliente/ClienteProfesionales.js';
import ClienteServicios from './pages/cliente/ClienteServicios.js';
import ClienteCitas from './pages/cliente/ClienteCitas.js';

// Páginas Profesional
import ProfesionalDashboard from './pages/profesional/ProfesionalDashboard.js';
import ProfesionalCitas from './pages/profesional/ProfesionalCitas.js';
import ProfesionalPerfil from './pages/profesional/ProfesionalPerfil.js';
import ProfesionalEspecialidades from './pages/profesional/ProfesionalEspecialidades.js';
import AuxiliarDashboard from './pages/auxiliar/AuxiliarDashboard.js';
import AuxiliarProductos from './pages/auxiliar/AuxiliarProductos.js';
import AuxiliarServicios from './pages/auxiliar/AuxiliarServicios.js';
import AuxiliarCategorias from './pages/auxiliar/AuxiliarCategorias.js';
import AuxiliarSubcategorias from './pages/auxiliar/AuxiliarSubcategorias.js';
import AuxiliarEspecialidades from './pages/auxiliar/AuxiliarEspecialidades.js';
import AuxiliarProfesionales from './pages/auxiliar/AuxiliarProfesionales.js';
import AuxiliarUsuarios from './pages/auxiliar/AuxiliarUsuarios.js';
import AuxiliarCitas from './pages/auxiliar/AuxiliarCitas.js';
import AuxiliarPedidos from './pages/auxiliar/AuxiliarPedidos.js';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [authChanged, setAuthChanged] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [globalNotice, setGlobalNotice] = useState('');

  useEffect(() => {
    // Verificar si hay usuario autenticado
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
    }
  }, [authChanged]); // Se ejecuta cuando authChanged cambia

  // Escuchar evento personalizado de cambio de autenticación
  useEffect(() => {
    const handleAuthChange = () => {
      const savedRole = localStorage.getItem('userRole');
      setUserRole(savedRole || null);
    };
    
    window.addEventListener('authChange', handleAuthChange);
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // Escuchar cambios en localStorage desde otra pestaña/ventana
  useEffect(() => {
    const handleStorageChange = () => {
      const savedRole = localStorage.getItem('userRole');
      setUserRole(savedRole || null);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleSessionExpired = (event) => {
      const message = event?.detail?.message || 'Tu sesion expiro. Inicia sesion nuevamente.';
      setGlobalNotice(message);
      window.setTimeout(() => setGlobalNotice(''), 4000);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, []);

  const isAuthenticated = userRole !== null;

  const getDefaultRouteByRole = () => {
    if (userRole === 'admin') return '/admin/dashboard';
    if (userRole === 'auxiliar') return '/auxiliar/dashboard';
    if (userRole === 'profesional') return '/profesional/dashboard';
    return '/cliente/catalogo';
  };

  const handleLogout = () => {
    clearSession();
    setUserRole(null);
  };

  return (
    <Router>
      <div className="app-container">
        {globalNotice && (
          <div className="global-notice" role="status" aria-live="polite">
            {globalNotice}
          </div>
        )}
        <Navbar userRole={userRole} onLogout={handleLogout} />
        
        <div className="main-content">
          {/* SIDEBAR SOLO CUANDO ESTÁ AUTENTICADO */}
          {isAuthenticated && <Sidebar userRole={userRole} onToggle={setSidebarOpen} />}
          
          <main className={`content ${isAuthenticated ? 'with-sidebar' : 'full-width'} ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <Routes>
              {/* RUTAS PÚBLICAS - Solo si no está autenticado */}
              {!isAuthenticated && (
                <>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                </>
              )}

              {/* Si está autenticado y trata de ir a /login o /register, redirecciona */}
              {isAuthenticated && (
                <>
                  <Route path="/login" element={<Navigate to={getDefaultRouteByRole()} />} />
                  <Route path="/register" element={<Navigate to={getDefaultRouteByRole()} />} />
                </>
              )}

              {/* RUTAS ADMIN - Protegidas */}
              {isAuthenticated && userRole === 'admin' && (
                <>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/productos" element={<AdminProductos />} />
                  <Route path="/admin/servicios" element={<AdminServicios />} />
                  <Route path="/admin/categorias" element={<AdminCategorias />} />
                  <Route path="/admin/subcategorias" element={<AdminSubcategorias />} />
                  <Route path="/admin/especialidades" element={<AdminEspecialidades />} />
                  <Route path="/admin/profesionales" element={<AdminProfesionales />} />
                  <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                  <Route path="/admin/citas" element={<AdminCitas />} />
                  <Route path="/admin/pedidos" element={<AdminPedidos />} />
                </>
              )}

              {/* RUTAS CLIENTE - Protegidas */}
              {isAuthenticated && userRole === 'cliente' && (
                <>
                  <Route path="/cliente/catalogo" element={<ClienteCatalogo />} />
                  <Route path="/cliente/carrito" element={<ClienteCarrito />} />
                  <Route path="/cliente/pedidos" element={<ClientePedidos />} />
                  <Route path="/cliente/profesionales" element={<ClienteProfesionales />} />
                  <Route path="/cliente/servicios" element={<ClienteServicios />} />
                  <Route path="/cliente/citas" element={<ClienteCitas />} />
                </>
              )}

              {/* RUTAS PROFESIONAL - Protegidas */}
              {isAuthenticated && userRole === 'profesional' && (
                <>
                  <Route path="/profesional/dashboard" element={<ProfesionalDashboard />} />
                  <Route path="/profesional/citas" element={<ProfesionalCitas />} />
                  <Route path="/profesional/perfil" element={<ProfesionalPerfil />} />
                  <Route path="/profesional/especialidades" element={<ProfesionalEspecialidades />} />
                </>
              )}

              {/* RUTAS AUXILIAR - Protegidas */}
              {isAuthenticated && userRole === 'auxiliar' && (
                <>
                  <Route path="/auxiliar/dashboard" element={<AuxiliarDashboard />} />
                  <Route path="/auxiliar/productos" element={<AuxiliarProductos />} />
                  <Route path="/auxiliar/servicios" element={<AuxiliarServicios />} />
                  <Route path="/auxiliar/categorias" element={<AuxiliarCategorias />} />
                  <Route path="/auxiliar/subcategorias" element={<AuxiliarSubcategorias />} />
                  <Route path="/auxiliar/especialidades" element={<AuxiliarEspecialidades />} />
                  <Route path="/auxiliar/profesionales" element={<AuxiliarProfesionales />} />
                  <Route path="/auxiliar/usuarios" element={<AuxiliarUsuarios />} />
                  <Route path="/auxiliar/citas" element={<AuxiliarCitas />} />
                  <Route path="/auxiliar/pedidos" element={<AuxiliarPedidos />} />
                </>
              )}

              {/* REDIRECCIONAMIENTOS POR DEFECTO */}
              {isAuthenticated && userRole === 'admin' && <Route path="*" element={<Navigate to="/admin/dashboard" />} />}
              {isAuthenticated && userRole === 'auxiliar' && <Route path="*" element={<Navigate to="/auxiliar/dashboard" />} />}
              {isAuthenticated && userRole === 'cliente' && <Route path="*" element={<Navigate to="/cliente/catalogo" />} />}
              {isAuthenticated && userRole === 'profesional' && <Route path="*" element={<Navigate to="/profesional/dashboard" />} />}
              
              {/* Si no está autenticado y trata de acceder a ruta privada, va a home */}
              {!isAuthenticated && <Route path="*" element={<Navigate to="/" />} />}
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;


