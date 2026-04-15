import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faBell, faCalendar, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AuxiliarDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalServicios: 0,
    totalCitas: 0,
    totalPedidos: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [productosRes, serviciosRes, citasRes, pedidosRes] = await Promise.all([
          apiRequest('/admin/productos'),
          apiRequest('/admin/servicios'),
          apiRequest('/admin/citas'),
          apiRequest('/admin/pedidos'),
        ]);

        setStats({
          totalProductos: (productosRes?.data?.productos || []).length,
          totalServicios: (serviciosRes?.data?.servicios || []).length,
          totalCitas: (citasRes?.data?.citas || []).length,
          totalPedidos: (pedidosRes?.data?.pedidos || []).length,
        });
      } catch (err) {
        setError(err.message || 'No se pudieron cargar las estadísticas');
      }
    };

    loadStats();
  }, []);

  return (
    <div className="admin-page">
      <h1>Panel Auxiliar</h1>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faBox} /></div>
          <div className="stat-info">
            <h3>Productos</h3>
            <p className="stat-number">{stats.totalProductos}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faBell} /></div>
          <div className="stat-info">
            <h3>Servicios</h3>
            <p className="stat-number">{stats.totalServicios}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faCalendar} /></div>
          <div className="stat-info">
            <h3>Citas</h3>
            <p className="stat-number">{stats.totalCitas}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faClipboardList} /></div>
          <div className="stat-info">
            <h3>Pedidos</h3>
            <p className="stat-number">{stats.totalPedidos}</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Gestiones permitidas para auxiliar</h2>
        <div className="action-buttons">
          <Link className="action-btn btn-primary" to="/auxiliar/productos">Gestionar Productos</Link>
          <Link className="action-btn btn-primary" to="/auxiliar/servicios">Gestionar Servicios</Link>
          <Link className="action-btn btn-primary" to="/auxiliar/categorias">Gestionar Categorías</Link>
          <Link className="action-btn btn-primary" to="/auxiliar/subcategorias">Gestionar Subcategorías</Link>
          <Link className="action-btn btn-secondary" to="/auxiliar/especialidades">Gestionar Especialidades</Link>
          <Link className="action-btn btn-secondary" to="/auxiliar/profesionales">Gestionar Profesionales</Link>
          <Link className="action-btn btn-secondary" to="/auxiliar/usuarios">Ver Usuarios</Link>
          <Link className="action-btn btn-secondary" to="/auxiliar/citas">Gestionar Citas</Link>
          <Link className="action-btn btn-secondary" to="/auxiliar/pedidos">Gestionar Pedidos</Link>
        </div>
      </div>
    </div>
  );
}
