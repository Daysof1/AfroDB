import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faBell,
  faCalendar,
  faClipboardList,
  faTags,
  faSitemap,
} from '@fortawesome/free-solid-svg-icons';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AuxiliarDashboard() {
  const [stats, setStats] = useState({
    totalProductos: 0,
    totalServicios: 0,
    totalCitas: 0,
    totalPedidos: 0,
    totalCategorias: 0,
    totalSubcategorias: 0,
  });
  const [actividades, setActividades] = useState([]);
  const [error, setError] = useState('');

  const formatRelativeTime = (dateValue) => {
    if (!dateValue) return 'Sin fecha';

    const now = new Date();
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';

    const diffMs = now.getTime() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMs / 3600000);
    const days = Math.floor(diffMs / 86400000);

    if (minutes < 1) return 'Hace unos segundos';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} d`;
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [
          productosRes,
          serviciosRes,
          citasRes,
          pedidosRes,
          categoriasStatsRes,
          subcategoriasStatsRes,
        ] = await Promise.all([
          apiRequest('/admin/productos'),
          apiRequest('/admin/servicios'),
          apiRequest('/admin/citas'),
          apiRequest('/admin/pedidos'),
          apiRequest('/admin/categorias/estadisticas'),
          apiRequest('/admin/subcategorias/estadisticas'),
        ]);

        const productos = productosRes?.data?.productos || [];
        const citas = citasRes?.data?.citas || [];
        const pedidos = pedidosRes?.data?.pedidos || [];
        const servicios = serviciosRes?.data?.servicios || [];

        setStats({
          totalProductos: productos.length,
          totalServicios: servicios.length,
          totalCitas: citas.length,
          totalPedidos: pedidos.length,
          totalCategorias: categoriasStatsRes?.data?.data?.total || 0,
          totalSubcategorias: subcategoriasStatsRes?.data?.data?.total || 0,
        });

        const actividadProductos = productos.slice(0, 5).map((producto) => ({
          tipo: 'Producto',
          mensaje: `Producto registrado: ${producto.nombre || `#${producto.id}`}`,
          fecha: producto.createdAt || producto.updatedAt || null,
        }));

        const actividadServicios = servicios.slice(0, 5).map((servicio) => ({
          tipo: 'Servicio',
          mensaje: `Servicio actualizado: ${servicio.nombre || `#${servicio.id}`}`,
          fecha: servicio.updatedAt || servicio.createdAt || null,
        }));

        const actividadCitas = citas.slice(0, 5).map((cita) => ({
          tipo: 'Cita',
          mensaje: `Cita ${String(cita.estado || 'creada').toLowerCase()} de ${cita?.cliente?.nombre || 'cliente sin nombre'}`,
          fecha: cita.createdAt || cita.updatedAt || cita.fecha || null,
        }));

        const actividadPedidos = pedidos.slice(0, 5).map((pedido) => ({
          tipo: 'Pedido',
          mensaje: `Pedido #${pedido.id} en estado ${String(pedido.estado || 'pendiente').toLowerCase()}`,
          fecha: pedido.createdAt || pedido.updatedAt || null,
        }));

        const actividadOrdenada = [...actividadProductos, ...actividadServicios, ...actividadCitas, ...actividadPedidos]
          .sort((a, b) => {
            const dateA = a.fecha ? new Date(a.fecha).getTime() : 0;
            const dateB = b.fecha ? new Date(b.fecha).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 6);

        setActividades(actividadOrdenada);
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
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faTags} /></div>
          <div className="stat-info">
            <h3>Categorías</h3>
            <p className="stat-number">{stats.totalCategorias}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FontAwesomeIcon icon={faSitemap} /></div>
          <div className="stat-info">
            <h3>Subcategorías</h3>
            <p className="stat-number">{stats.totalSubcategorias}</p>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h2>Acciones Rápidas</h2>
        <div className="action-buttons">
          <Link className="action-btn btn-primary" to="/auxiliar/productos">➕ Nuevo Producto</Link>
          <Link className="action-btn btn-primary" to="/auxiliar/servicios">➕ Nuevo Servicio</Link>
          <Link className="action-btn btn-secondary" to="/auxiliar/citas">📋 Ver Citas</Link>
          <Link className="action-btn btn-secondary" to="/auxiliar/usuarios">⚙️ Ver Usuarios</Link>
        </div>
      </div>


      <div className="admin-section">
        <h2>Últimas Actividades</h2>
        <div className="activity-list">
          {actividades.length === 0 ? (
            <div className="activity-item">
              <span className="activity-badge">Sistema</span>
              <p>No hay actividades recientes para mostrar.</p>
              <small>Actualiza la página más tarde</small>
            </div>
          ) : (
            actividades.map((actividad, index) => (
              <div className="activity-item" key={`${actividad.tipo}-${index}`}>
                <span className="activity-badge">{actividad.tipo}</span>
                <p>{actividad.mensaje}</p>
                <small>{formatRelativeTime(actividad.fecha)}</small>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

