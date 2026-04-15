import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faEye } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';

export default function ClientePedidos() {
  const [pedidos, setPedidos] = useState([
    {
      id: '1204',
      fecha: '2026-04-10',
      total: 85000,
      estado: 'Entregado',
      items: ['Shampoo Orgánico', 'Aceite Nutritivo']
    },
    {
      id: '1203',
      fecha: '2026-04-05',
      total: 45000,
      estado: 'En tránsito',
      items: ['Cuidado Facial']
    },
  ]);

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faBox} /> Mis Pedidos</h1>
      </div>

      <div className="pedidos-container">
        {pedidos.length === 0 ? (
          <div className="empty-state">
            <p>No tienes pedidos aún</p>
            <a href="/cliente/catalogo" className="btn btn-primary">Hacer mi Primer Compra</a>
          </div>
        ) : (
          <div className="pedidos-grid">
            {pedidos.map(pedido => (
              <div key={pedido.id} className="pedido-card">
                <div className="pedido-header">
                  <h3>Pedido #{pedido.id}</h3>
                  <span className={`badge ${pedido.estado === 'Entregado' ? 'badge-success' : 'badge-warning'}`}>
                    {pedido.estado}
                  </span>
                </div>

                <div className="pedido-info">
                  <p><strong>Fecha:</strong> {pedido.fecha}</p>
                  <p><strong>Total:</strong> ${pedido.total.toLocaleString()}</p>
                </div>

                <div className="pedido-items">
                  <h4>Productos:</h4>
                  <ul>
                    {pedido.items.map((item, idx) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                </div>

                <div className="pedido-actions">
                  <button className="btn btn-sm btn-secondary"><FontAwesomeIcon icon={faEye} /> Ver Detalles</button>
                  {pedido.estado === 'Entregado' && (
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
