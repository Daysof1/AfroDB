import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AuxiliarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');

  const loadPedidos = async () => {
    try {
      const response = await apiRequest('/admin/pedidos');
      setPedidos(response?.data?.pedidos || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar pedidos');
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  const handleCambiarEstado = async (id, estado) => {
    try {
      setError('');
      await apiRequest(`/admin/pedidos/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      await loadPedidos();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del pedido');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Pedidos</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>{pedido.id}</td>
                <td>{pedido?.usuario?.nombre || 'Cliente'}</td>
                <td>${Number(pedido.total || 0).toLocaleString()}</td>
                <td>{pedido.estado}</td>
                <td>{pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                  <select
                    value={pedido.estado || 'pendiente'}
                    onChange={(e) => handleCambiarEstado(pedido.id, e.target.value)}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="procesando">Procesando</option>
                    <option value="enviado">Enviado</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
