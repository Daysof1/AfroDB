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

      <div className="pedidos-container">
        {pedidos.length === 0 ? (
          <div className="empty-state">
            <p>No tienes pedidos aún</p>
            <a href="/cliente/catalogo" className="btn btn-primary">Hacer mi Primer Compra</a>
          </div>
        ) : (
          <div className="pedidos-grid">
            {pedidos.map((pedido) => (
              <div key={pedido.id} className="pedido-card">
                {/** Resumen corto por defecto */}
                <div className="pedido-header">
                  <h3>Pedido #{pedido.id}</h3>
                  <span className={`badge ${(pedido.estado || '').toLowerCase() === 'entregado' ? 'badge-success' : 'badge-warning'}`}>
                    {formatEstado(pedido.estado)}
                  </span>
                </div>

                <div className="pedido-info">
                  <p><strong>Fecha:</strong> {String(pedido.createdAt || '').slice(0, 10)}</p>
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
                      <p><strong>Pago:</strong> {pedido.fechaPago ? new Date(pedido.fechaPago).toLocaleString() : 'Pendiente'}</p>
                      <p><strong>Envío:</strong> {pedido.fechaEnvio ? new Date(pedido.fechaEnvio).toLocaleString() : 'Pendiente'}</p>
                      <p><strong>Entrega:</strong> {pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleString() : 'Pendiente'}</p>
                    </div>

                    <div className="pedido-items">
                      <h4>Productos:</h4>
                      <ul>
                        {(pedido.detalles || []).map((detalle) => (
                          <li key={detalle.id}>✓ {detalle?.producto?.nombre || 'Producto'}</li>
                        ))}
                      </ul>
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
                  {(pedido.estado || '').toLowerCase() === 'entregado' && (
                    <button className="btn btn-sm btn-primary">⭐ Calificar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

