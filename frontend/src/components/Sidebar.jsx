import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faShoppingBag, faCartShopping, faBox, faBell, faFolder, faScissors, faUser, faChalkboard, faStar } from '@fortawesome/free-solid-svg-icons';
import './Sidebar.css';

export default function Sidebar({ userRole, onToggle }) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleSidebar = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const adminLinks = [
    { icon: 'dashboard', label: 'Dashboard', href: '/admin/dashboard' },
    { icon: 'box', label: 'Productos', href: '/admin/productos' },
    { icon: 'bell', label: 'Servicios', href: '/admin/servicios' },
    { icon: 'folder', label: 'Categorías', href: '/admin/categorias' },
    { icon: 'calendar', label: 'Citas', href: '/admin/citas' },
  ];

  const clienteLinks = [
    { icon: 'shopping', label: 'Catálogo', href: '/cliente/catalogo' },
    { icon: 'cart', label: 'Carrito', href: '/cliente/carrito' },
    { icon: 'box', label: 'Mis Pedidos', href: '/cliente/pedidos' },
    { icon: 'bell', label: 'Servicios', href: '/cliente/servicios' },
    { icon: 'calendar', label: 'Mis Citas', href: '/cliente/citas' },
    { icon: 'professionals', label: 'Profesionales', href: '/cliente/profesionales' },
  ];

  const profesionalLinks = [
    { icon: 'dashboard', label: 'Dashboard', href: '/profesional/dashboard' },
    { icon: 'calendar', label: 'Mis Citas', href: '/profesional/citas' },
    { icon: 'profile', label: 'Mi Perfil', href: '/profesional/perfil' },
    { icon: 'specialties', label: 'Especialidades', href: '/profesional/especialidades' },
  ];

  let links = [];
  let section = '';

  // Función para renderizar el icono correcto
  const renderIcon = (label, icon) => {
    if (icon === 'calendar') {
      return <FontAwesomeIcon icon={faCalendar} className="fa-icon" />;
    }
    if (icon === 'shopping') {
      return <FontAwesomeIcon icon={faShoppingBag} className="fa-icon" />;
    }
    if (icon === 'cart') {
      return <FontAwesomeIcon icon={faCartShopping} className="fa-icon" />;
    }
    if (icon === 'box') {
      return <FontAwesomeIcon icon={faBox} className="fa-icon" />;
    }
    if (icon === 'bell') {
      return <FontAwesomeIcon icon={faBell} className="fa-icon" />;
    }
    if (icon === 'folder') {
      return <FontAwesomeIcon icon={faFolder} className="fa-icon" />;
    }
    if (icon === 'professionals') {
      return <FontAwesomeIcon icon={faScissors} className="fa-icon" />;
    }
    if (icon === 'profile') {
      return <FontAwesomeIcon icon={faUser} className="fa-icon" />;
    }
    if (icon === 'dashboard') {
      return <FontAwesomeIcon icon={faChalkboard} className="fa-icon" />;
    }
    if (icon === 'specialties') {
      return <FontAwesomeIcon icon={faStar} className="fa-icon" />;
    }
    return <span className="emoji-icon">{icon}</span>;
  };

  if (userRole === 'admin') {
    links = adminLinks;
    section = 'Administración';
  } else if (userRole === 'cliente') {
    links = clienteLinks;
    section = 'Mi Cuenta';
  } else if (userRole === 'profesional') {
    links = profesionalLinks;
    section = 'Mi Espacio';
  }

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="sidebar-toggle" onClick={toggleSidebar} title={isOpen ? 'Cerrar menú' : 'Abrir menú'}>
        {isOpen ? '✕' : '☰'}
      </button>

      <div className="sidebar-content">
        {isOpen && <h3 className="sidebar-title">{section}</h3>}
        
        <ul className="sidebar-links">
          {links.map((link, index) => (
            <li key={index}>
              <Link to={link.href} title={link.label} className="sidebar-link">
                <span className="icon">{renderIcon(link.label, link.icon)}</span>
                <span className="label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
