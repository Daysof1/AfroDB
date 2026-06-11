import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

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

  const pedidosFiltrados = pedidos.filter((pedido) => {
    const textoBusqueda = busqueda.toLowerCase().trim();
    return (
      !textoBusqueda ||
      String(pedido.id).includes(textoBusqueda) ||
      (pedido?.usuario?.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (pedido?.usuario?.apellido || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.direccionEnvio || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.telefono || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.metodoPago || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.estado || '').toLowerCase().includes(textoBusqueda)
    );
  });

  const handleEdit = (pedido) => {
    setEditingId(pedido.id);
    setEstado(pedido.estado || 'pendiente');
  };

  const handleSave = async (id) => {
    try {
      setError('');
      await apiRequest(`/admin/pedidos/${id}/estado`, {
        method: 'PUT',
        body: JSON.stringify({ estado }),
      });
      setEditingId(null);
      await loadPedidos();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del pedido');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Pedidos</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar pedidos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="cards-grid">
        {pedidosFiltrados.map((pedido) => (
          <div key={pedido.id} className="service-card">
            <h3>Pedido #{pedido.id}</h3>
            <p><strong>Cliente:</strong> {pedido?.usuario?.nombre || 'Cliente'}</p>
            <p><strong>Dirección:</strong> {pedido.direccionEnvio || 'Sin dirección'}</p>
            <p><strong>Teléfono:</strong> {pedido.telefono || 'Sin teléfono'}</p>
            <p><strong>Método de Pago:</strong> {pedido.metodoPago || 'efectivo'}</p>
            <p><strong>Total:</strong> ${Number(pedido.total || 0).toLocaleString()}</p>
            <p><strong>Notas:</strong> {pedido.notas || 'Sin notas'}</p>
            <p><strong>Pago:</strong> {pedido.fechaPago ? new Date(pedido.fechaPago).toLocaleString() : 'Pendiente'}</p>
            <p><strong>Envío:</strong> {pedido.fechaEnvio ? new Date(pedido.fechaEnvio).toLocaleString() : 'Pendiente'}</p>
            <p><strong>Entrega:</strong> {pedido.fechaEntrega ? new Date(pedido.fechaEntrega).toLocaleString() : 'Pendiente'}</p>
            <p><strong>Fecha:</strong> {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p>
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
            </p>
            {editingId === pedido.id ? (
              <div className="form-container">
                <div className="form-group">
                  <label>Cambiar Estado</label>
                  <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                    <option value="pendiente">Pendiente</option>
                    <option value="enviado">Enviado</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button className="btn btn-primary" onClick={() => handleSave(pedido.id)}>Guardar</button>
                  <button className="btn btn-secondary" onClick={handleCancel}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="card-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(pedido)}>Editar Estado</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
