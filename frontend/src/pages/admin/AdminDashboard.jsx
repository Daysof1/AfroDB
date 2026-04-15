import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faBox, faBell, faChalkboard } from '@fortawesome/free-solid-svg-icons';
import '../Admin.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalServicios: 0,
    totalCitas: 0,
    totalUsuarios: 0,
  });

  useEffect(() => {
    // TODO: Hacer llamada a API para obtener estadísticas
    setStats({
      totalProductos: 45,
      totalServicios: 12,
      totalCitas: 28,
      totalUsuarios: 156,
    });
  }, []);

  return (
    <div className="admin-page">
      <h1>Dashboard Administrativo</h1>
      
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
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>Usuarios</h3>
            <p className="stat-number">{stats.totalUsuarios}</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Acciones Rápidas</h2>
        <div className="action-buttons">
          <button className="action-btn btn-primary">➕ Nuevo Producto</button>
          <button className="action-btn btn-primary">➕ Nuevo Servicio</button>
          <button className="action-btn btn-secondary"><FontAwesomeIcon icon={faChalkboard} /> Reportes</button>
          <button className="action-btn btn-secondary">⚙️ Configuración</button>
        </div>
      </div>

      <div className="admin-section">
        <h2>Últimas Actividades</h2>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-badge">Nuevo</span>
            <p>Se agregó producto: Shampoo Orgánico</p>
            <small>Hace 2 horas</small>
          </div>
          <div className="activity-item">
            <span className="activity-badge">Actualizado</span>
            <p>Cita confirmada para María González</p>
            <small>Hace 4 horas</small>
          </div>
          <div className="activity-item">
            <span className="activity-badge">Pedido</span>
            <p>Nuevo pedido #1204 completado</p>
            <small>Hace 6 horas</small>
          </div>
        </div>
      </div>
    </div>
  );
}
