import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';

export default function ClienteCarrito() {
  const [carrito, setCarrito] = useState([
    { id: 1, nombre: 'Shampoo Orgánico', precio: 25000, cantidad: 2, imagen: '/uploads/shampoo.jfif' },
    { id: 2, nombre: 'Aceite Nutritivo', precio: 35000, cantidad: 1, imagen: '/uploads/aceite.jfif' },
  ]);

  const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

  const handleActualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      setCarrito(carrito.filter(item => item.id !== id));
    } else {
      setCarrito(carrito.map(item =>
        item.id === id ? { ...item, cantidad: nuevaCantidad } : item
      ));
    }
  };

  const handleEliminar = (id) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faCartShopping} /> Mi Carrito</h1>
      </div>

      {carrito.length === 0 ? (
        <div className="empty-state">
          <p>Tu carrito está vacío</p>
          <a href="/cliente/catalogo" className="btn btn-primary">Ir al Catálogo</a>
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
                {carrito.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="carrito-product">
                        <img src={item.imagen} alt={item.nombre} />
                        <span>{item.nombre}</span>
                      </div>
                    </td>
                    <td>${item.precio.toLocaleString()}</td>
                    <td>
                      <div className="cantidad-control">
                        <button onClick={() => handleActualizarCantidad(item.id, item.cantidad - 1)}>-</button>
                        <input type="number" value={item.cantidad} readOnly />
                        <button onClick={() => handleActualizarCantidad(item.id, item.cantidad + 1)}>+</button>
                      </div>
                    </td>
                    <td>${(item.precio * item.cantidad).toLocaleString()}</td>
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
            <button className="btn btn-primary btn-block">Proceder al Pago</button>
            <a href="/cliente/catalogo" className="btn btn-secondary btn-block">Continuar Comprando</a>
          </div>
        </div>
      )}
    </div>
  );
}
