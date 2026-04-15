import { useState } from 'react';
import '../Admin.css';

export default function AdminProductos() {
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Shampoo Orgánico', precio: 25000, stock: 50, imagen: '/uploads/shampoo.jfif' },
    { id: 2, nombre: 'Aceite Nutritivo', precio: 35000, stock: 30, imagen: '/uploads/aceite.jfif' },
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ nombre: '', precio: '', stock: '', imagen: '' });

  const handleAddProduct = () => {
    if (newProduct.nombre && newProduct.precio && newProduct.stock) {
      setProductos([...productos, { ...newProduct, id: Date.now(), precio: parseInt(newProduct.precio), stock: parseInt(newProduct.stock) }]);
      setNewProduct({ nombre: '', precio: '', stock: '', imagen: '' });
      setIsFormOpen(false);
    }
  };

  const handleDeleteProduct = (id) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Productos</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nuevo Producto'}
        </button>
      </div>

      {isFormOpen && (
        <div className="form-container">
          <h2>Agregar Nuevo Producto</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleAddProduct(); }}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={newProduct.nombre}
                onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                placeholder="Nombre del producto"
              />
            </div>
            <div className="form-group">
              <label>Precio</label>
              <input
                type="number"
                value={newProduct.precio}
                onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
                placeholder="Precio"
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="Cantidad en stock"
              />
            </div>
            <button type="submit" className="btn btn-primary">Guardar Producto</button>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map(producto => (
              <tr key={producto.id}>
                <td><img src={producto.imagen} alt={producto.nombre} className="table-img" /></td>
                <td>{producto.nombre}</td>
                <td>${producto.precio.toLocaleString()}</td>
                <td>{producto.stock}</td>
                <td>
                  <button className="btn btn-sm btn-secondary">✏️ Editar</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(producto.id)}>🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
