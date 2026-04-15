import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faEye } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest } from '../../api/client';

export default function ClientePedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                <div className="pedido-header">
                  <h3>Pedido #{pedido.id}</h3>
                  <span className={`badge ${(pedido.estado || '').toLowerCase() === 'entregado' ? 'badge-success' : 'badge-warning'}`}>
                    {formatEstado(pedido.estado)}
                  </span>
                </div>

                <div className="pedido-info">
                  <p><strong>Fecha:</strong> {String(pedido.createdAt || '').slice(0, 10)}</p>
                  <p><strong>Total:</strong> ${Number(pedido.total || 0).toLocaleString()}</p>
                </div>

                <div className="pedido-items">
                  <h4>Productos:</h4>
                  <ul>
                    {(pedido.detalles || []).map((detalle) => (
                      <li key={detalle.id}>✓ {detalle?.producto?.nombre || 'Producto'}</li>
                    ))}
                  </ul>
                </div>

                <div className="pedido-actions">
                  <button className="btn btn-sm btn-secondary"><FontAwesomeIcon icon={faEye} /> Ver Detalles</button>
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
