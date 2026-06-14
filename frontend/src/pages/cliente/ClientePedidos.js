import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faEye } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest } from '../../api/client.js';

export default function ClientePedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('Todos');

  useEffect(() => {
    const loadPedidos = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/cliente/pedidos');
        setPedidos(response?.data?.pedidos || []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadPedidos();
  }, []);

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const textoBusqueda = busqueda.toLowerCase().trim();
      const coincideBusqueda =
      !textoBusqueda ||
      String(pedido.id).includes(textoBusqueda) ||
      (pedido.detalles || []).some((detalle) =>
        (detalle?.producto?.nombre || '').toLowerCase().includes(textoBusqueda)
      ) ||
      (pedido.direccionEnvio || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.telefono || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.metodoPago || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.estado || '').toLowerCase().includes(textoBusqueda);

    const coincideEstado =
    filtro === 'Todos' ||
    (pedido.estado || '').toLowerCase() === filtro.toLowerCase();

  return coincideBusqueda && coincideEstado;
});

  const formatEstado = (estado) => {
    const value = (estado || '').toLowerCase();
    if (value === 'pendiente') return 'Pendiente';
    if (value === 'enviado') return 'En tránsito';
    if (value === 'entregado') return 'Entregado';
    if (value === 'cancelado') return 'Cancelado';
    return estado || 'Sin estado';
  };

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faBox} /> Mis Pedidos</h1>
      </div>

      {loading && <p>Cargando pedidos...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar pedidos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-input"
        />

        <button
          className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`}
          onClick={() => setFiltro('Todos')}
        >
          Todas ({pedidos.length})
        </button>
         <button
          className={`filter-btn ${filtro === 'Pendiente' ? 'active' : ''}`}
          onClick={() => setFiltro('Pendiente')}
        >
          Pendientes ({pedidos.filter((p) => (p.estado || '').toLowerCase() === 'pendiente').length})
        </button>

        <button
          className={`filter-btn ${filtro === 'Enviado' ? 'active' : ''}`}
          onClick={() => setFiltro('Enviado')}
        >
          Enviados ({pedidos.filter((p) => (p.estado || '').toLowerCase() === 'enviado').length})
        </button>

         <button
          className={`filter-btn ${filtro === 'Entregado' ? 'active' : ''}`}
          onClick={() => setFiltro('Entregado')}
        >
          Entregados ({pedidos.filter((p) => (p.estado || '').toLowerCase() === 'entregado').length})
        </button>

         <button
          className={`filter-btn ${filtro === 'Cancelado' ? 'active' : ''}`}
          onClick={() => setFiltro('Cancelado')}
        >
          Cancelados ({pedidos.filter((p) => (p.estado || '').toLowerCase() === 'cancelado').length})
        </button>
        </div>

      <div className="pedidos-container">
        {pedidosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>{pedidos.length === 0 ? 'No tienes pedidos aún' : 'No hay pedidos que coincidan con tu búsqueda'}</p>
            {pedidos.length === 0 && <a href="/cliente/catalogo" className="btn btn-primary">Hacer mi Primer Compra</a>}
          </div>
        ) : (
          <div className="pedidos-grid">
            {pedidosFiltrados.map((pedido) => (
              <div key={pedido.id} className="pedido-card">
                {/** Resumen corto por defecto */}
                <div className="pedido-header">
                  <h3>{(pedido.detalles || []).map((detalle) => ` ${detalle?.producto?.nombre || 'Producto'}`).join(', ')}</h3>
                  <span
                  className={`badge ${
                    (pedido.estado || '').toLowerCase() === 'pendiente'
                    ? 'badge-warning'
                    : (pedido.estado || '').toLowerCase() === 'enviado'
                    ? 'badge-info'
                    : (pedido.estado || '').toLowerCase() === 'entregado'
                    ? 'badge-success'
                    : (pedido.estado || '').toLowerCase() === 'cancelado'
                    ? 'badge-danger'
                    : 'badge-secondary'
                  }`}
                >
                {pedido.estado}
                </span>
                </div>

                <div className="pedido-info">
                  <p><strong>Fecha:</strong> {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Total:</strong> ${Number(pedido.total || 0).toLocaleString()}</p>
                  <p><strong>Productos:</strong> {(pedido.detalles || []).length}</p>
                </div>

                {pedidoExpandidoId === pedido.id && (
                  <>
                    <div className="pedido-info">
                      <p><strong>Dirección:</strong> {pedido.direccionEnvio || 'Sin dirección'}</p>
                      <p><strong>Teléfono:</strong> {pedido.telefono || 'Sin teléfono'}</p>
                      <p><strong>Método de pago:</strong> {pedido.metodoPago || 'efectivo'}</p>
                      <p><strong>Notas:</strong> {pedido.notas || 'Sin notas'}</p>
                      <p><strong>Envío:</strong> {pedido.fechaEnvio ? new Date(pedido.fechaEnvio).toLocaleString() : 'Pendiente'}</p>
                      <p><strong>Entrega:</strong> {pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleString() : 'Pendiente'}</p>
                    </div>

                  </>
                )}

                <div className="pedido-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setPedidoExpandidoId(pedidoExpandidoId === pedido.id ? null : pedido.id)}
                  >
                    <FontAwesomeIcon icon={faEye} /> {pedidoExpandidoId === pedido.id ? 'Ocultar Detalles' : 'Ver Detalles'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

