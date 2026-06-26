// Página: AuxiliarPedidos.js. gesti?n de pedidos por auxiliar.
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import '../Admin.css';
import { apiRequest } from '../../api/client.js';
import { exportarPedidosAPDF, exportarPedidosAExcel } from '../../utils/exportUtils.js';

// Renderiza la vista principal de este componente.
export default function AuxiliarPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [estado, setEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [pedidoExpandidoId, setPedidoExpandidoId] = useState(null);

  const [filtro, setFiltro] = useState('Todos');
  const [showExportOptions, setShowExportOptions] = useState(false);

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
    const coincideBusqueda =
      !textoBusqueda ||
      String(pedido.id).includes(textoBusqueda) ||
      (pedido?.usuario?.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (pedido?.usuario?.apellido || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.direccionEnvio || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.telefono || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.metodoPago || '').toLowerCase().includes(textoBusqueda) ||
      (pedido.estado || '').toLowerCase().includes(textoBusqueda);

      const coincideEstado =
    filtro === 'Todos' ||
    (pedido.estado || '').toLowerCase() === filtro.toLowerCase();

  return coincideBusqueda && coincideEstado;
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
        <h1>Auxiliar - Pedidos</h1>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setShowExportOptions(!showExportOptions)}
            >
              📊 Exportar
            </button>
            {showExportOptions && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                zIndex: 10,
                minWidth: '150px',
                marginTop: '5px'
              }}>
                <button 
                  className="btn btn-sm"
                  onClick={() => {
                    exportarPedidosAPDF(pedidosFiltrados);
                    setShowExportOptions(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 15px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📄 Exportar a PDF
                </button>
                <button 
                  className="btn btn-sm"
                  onClick={async () => {
                    await exportarPedidosAExcel(pedidosFiltrados);
                    setShowExportOptions(false);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 15px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📊 Exportar a Excel
                </button>
              </div>
            )}
          </div>
        </div>
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
          Pendientes ({pedidos.filter((c) => (c.estado || '').toLowerCase() === 'pendiente').length})
        </button>

        <button
          className={`filter-btn ${filtro === 'Enviado' ? 'active' : ''}`}
          onClick={() => setFiltro('Enviado')}
        >
          Enviados ({pedidos.filter((c) => (c.estado || '').toLowerCase() === 'enviado').length})
        </button>

         <button
          className={`filter-btn ${filtro === 'Entregado' ? 'active' : ''}`}
          onClick={() => setFiltro('Entregado')}
        >
          Entregados ({pedidos.filter((c) => (c.estado || '').toLowerCase() === 'entregado').length})
        </button>

         <button
          className={`filter-btn ${filtro === 'Cancelado' ? 'active' : ''}`}
          onClick={() => setFiltro('Cancelado')}
        >
          Cancelados ({pedidos.filter((c) => (c.estado || '').toLowerCase() === 'cancelado').length})
        </button>
        </div>

        <div className="pedidos-container">
        {pedidosFiltrados.length === 0 ? (
          <div className="empty-state">
            <p>No hay pedidos en esta categoría</p>
          </div>
        ) : (
          <div className="cards-grid">
            {pedidosFiltrados.map((pedido) => (
              <div key={pedido.id} className="cita-card-prof">
                <div className="cita-header-prof">
                  {/** Resumen corto por defecto */}
                  <h3>{pedido?.usuario?.nombre || 'Cliente'}</h3>
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

               <div className="cita-info-prof">
                <p><strong>Fecha:</strong> {pedido.createdAt ? new Date(pedido.createdAt).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Total:</strong> ${Number(pedido.total || 0).toLocaleString()}</p>
                <p><strong>Productos:</strong> {(pedido.detalles || []).length}</p>
              </div>

              {pedidoExpandidoId === pedido.id && (
                <>
                <div className="cita-info-prof">
                <p><strong>Dirección:</strong> {pedido.direccionEnvio || 'Sin dirección'}</p>
                <p><strong>Teléfono:</strong> {pedido.telefono || 'Sin teléfono'}</p>
                <p><strong>Método de Pago:</strong> {pedido.metodoPago || 'efectivo'}</p>
                <p><strong>Notas:</strong> {pedido.notas || 'Sin notas'}</p>
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
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setPedidoExpandidoId(pedidoExpandidoId === pedido.id ? null : pedido.id)}
                >
                  <FontAwesomeIcon icon={faEye} /> {pedidoExpandidoId === pedido.id ? 'Ocultar Detalles' : 'Ver Detalles'}
                </button>
                <button className="btn btn-secondary" onClick={() => handleEdit(pedido)}>Editar Estado</button>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
    </div>
    </div>
  );
};
