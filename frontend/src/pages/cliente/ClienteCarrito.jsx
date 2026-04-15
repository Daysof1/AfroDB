import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl } from '../../api/client';

export default function ClienteCarrito() {
  const navigate = useNavigate();
  const [carrito, setCarrito] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkoutData, setCheckoutData] = useState({
    direccionEnvio: '',
    telefono: '',
    metodoPago: 'efectivo',
    notasAdicionales: '',
  });
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

  const loadCarrito = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiRequest('/cliente/carrito');
      setCarrito(response?.data?.items || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar el carrito');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCarrito();
  }, []);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const response = await apiRequest('/auth/me');
        const usuario = response?.data?.usuario || {};
        setCheckoutData((prev) => ({
          ...prev,
          direccionEnvio: usuario.direccion || prev.direccionEnvio,
          telefono: usuario.telefono || prev.telefono,
        }));
      } catch {
        // El checkout sigue funcionando aunque no podamos precargar datos.
      }
    };

    loadProfileData();
  }, []);

  const total = carrito.reduce((sum, item) => sum + (Number(item.precioUnitario || 0) * Number(item.cantidad || 0)), 0);

  const handleActualizarCantidad = async (id, nuevaCantidad) => {
    try {
      if (nuevaCantidad <= 0) {
        await apiRequest(`/cliente/carrito/${id}`, { method: 'DELETE' });
      } else {
        await apiRequest(`/cliente/carrito/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ cantidad: nuevaCantidad }),
        });
      }
      await loadCarrito();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el carrito');
    }
  };

  const handleEliminar = async (id) => {
    try {
      await apiRequest(`/cliente/carrito/${id}`, { method: 'DELETE' });
      await loadCarrito();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el item');
    }
  };

  const handleCheckoutChange = (field, value) => {
    setCheckoutData((prev) => ({ ...prev, [field]: value }));
    setError('');
    setPaymentMessage('');
  };

  const handleGenerarPago = async () => {
    if (!checkoutData.direccionEnvio.trim()) {
      setError('La dirección de envío es obligatoria para generar el pago');
      return;
    }

    if (!checkoutData.telefono.trim()) {
      setError('El teléfono es obligatorio para generar el pago');
      return;
    }

    try {
      setProcessingPayment(true);
      setError('');
      setPaymentMessage('');

      const response = await apiRequest('/cliente/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          direccionEnvio: checkoutData.direccionEnvio,
          telefono: checkoutData.telefono,
          metodoPago: checkoutData.metodoPago,
          notasAdicionales: checkoutData.notasAdicionales.trim() || undefined,
        }),
      });

      const pedidoId = response?.data?.pedido?.id;
      setCarrito([]);
      setPaymentMessage(
        pedidoId
          ? `Pago generado correctamente. Pedido #${pedidoId} creado.`
          : 'Pago generado correctamente. Tu pedido fue creado.',
      );
      navigate('/cliente/pedidos');
    } catch (err) {
      setError(err.message || 'No se pudo generar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faCartShopping} /> Mi Carrito</h1>
      </div>

      {loading && <p>Cargando carrito...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {carrito.length === 0 ? (
        <div className="empty-state">
          <p>Tu carrito está vacío</p>
          <Link to="/cliente/catalogo" className="btn btn-primary">Ir al Catálogo</Link>
        </div>
      ) : (
        <div className="carrito-container">
          <div className="carrito-items">
            <table className="carrito-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Precio</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {carrito.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="carrito-product">
                        <img src={getAssetUrl(item?.producto?.imagen)} alt={item?.producto?.nombre || 'Producto'} />
                        <span>{item?.producto?.nombre || 'Producto'}</span>
                      </div>
                    </td>
                    <td>${Number(item.precioUnitario || 0).toLocaleString()}</td>
                    <td>
                      <div className="cantidad-control">
                        <button onClick={() => handleActualizarCantidad(item.id, item.cantidad - 1)}>-</button>
                        <input type="number" value={item.cantidad} readOnly />
                        <button onClick={() => handleActualizarCantidad(item.id, item.cantidad + 1)}>+</button>
                      </div>
                    </td>
                    <td>${(Number(item.precioUnitario || 0) * Number(item.cantidad || 0)).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(item.id)}>🗑️ Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="carrito-resumen">
            <h2>Resumen</h2>
            {paymentMessage && <div className="alert alert-success">{paymentMessage}</div>}
            <div className="resumen-item">
              <span>Subtotal:</span>
              <span>${total.toLocaleString()}</span>
            </div>
            <div className="resumen-item">
              <span>Envío:</span>
              <span>Gratis</span>
            </div>
            <div className="resumen-total">
              <span>Total:</span>
              <span>${total.toLocaleString()}</span>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Dirección de envío</label>
              <input
                type="text"
                className="form-input"
                value={checkoutData.direccionEnvio}
                onChange={(e) => handleCheckoutChange('direccionEnvio', e.target.value)}
                placeholder="Ingresa tu dirección"
              />
            </div>

            <div className="form-group">
              <label>Teléfono de contacto</label>
              <input
                type="text"
                className="form-input"
                value={checkoutData.telefono}
                onChange={(e) => handleCheckoutChange('telefono', e.target.value)}
                placeholder="Ingresa tu teléfono"
              />
            </div>

            <div className="form-group">
              <label>Método de pago</label>
              <select
                className="form-input"
                value={checkoutData.metodoPago}
                onChange={(e) => handleCheckoutChange('metodoPago', e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notas adicionales (opcional)</label>
              <textarea
                className="form-input"
                value={checkoutData.notasAdicionales}
                onChange={(e) => handleCheckoutChange('notasAdicionales', e.target.value)}
                placeholder="Ej: entregar en portería"
                rows={3}
              />
            </div>

            <button className="btn btn-primary btn-block" onClick={handleGenerarPago} disabled={processingPayment}>
              {processingPayment ? 'Generando pago...' : 'Generar Pago'}
            </button>
            <Link to="/cliente/catalogo" className="btn btn-secondary btn-block">Continuar Comprando</Link>
          </div>
        </div>
      )}
    </div>
  );
}
