import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';

// Componentes compartidos
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Páginas públicas
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// Páginas Admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductos from './pages/admin/AdminProductos';
import AdminServicios from './pages/admin/AdminServicios';
import AdminCategorias from './pages/admin/AdminCategorias';
import AdminCitas from './pages/admin/AdminCitas';

// Páginas Cliente
import ClienteCatalogo from './pages/cliente/ClienteCatalogo';
import ClienteCarrito from './pages/cliente/ClienteCarrito';
import ClientePedidos from './pages/cliente/ClientePedidos';
import ClienteProfesionales from './pages/cliente/ClienteProfesionales';
import ClienteServicios from './pages/cliente/ClienteServicios';
import ClienteCitas from './pages/cliente/ClienteCitas';

// Páginas Profesional
import ProfesionalDashboard from './pages/profesional/ProfesionalDashboard';
import ProfesionalCitas from './pages/profesional/ProfesionalCitas';
import ProfesionalPerfil from './pages/profesional/ProfesionalPerfil';
import ProfesionalEspecialidades from './pages/profesional/ProfesionalEspecialidades';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [authChanged, setAuthChanged] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  const isAuthenticated = userRole !== null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    setUserRole(null);
  };

  return (
    <Router>
      <div className="app-container">
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
                  <Route path="/login" element={<Navigate to={userRole === 'admin' ? '/admin/dashboard' : userRole === 'profesional' ? '/profesional/dashboard' : '/cliente/catalogo'} />} />
                  <Route path="/register" element={<Navigate to={userRole === 'admin' ? '/admin/dashboard' : userRole === 'profesional' ? '/profesional/dashboard' : '/cliente/catalogo'} />} />
                </>
              )}

              {/* RUTAS ADMIN - Protegidas */}
              {isAuthenticated && userRole === 'admin' && (
                <>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/productos" element={<AdminProductos />} />
                  <Route path="/admin/servicios" element={<AdminServicios />} />
                  <Route path="/admin/categorias" element={<AdminCategorias />} />
                  <Route path="/admin/citas" element={<AdminCitas />} />
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

              {/* REDIRECCIONAMIENTOS POR DEFECTO */}
              {isAuthenticated && userRole === 'admin' && <Route path="*" element={<Navigate to="/admin/dashboard" />} />}
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
