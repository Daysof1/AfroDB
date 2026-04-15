import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest, getAssetUrl } from '../../api/client';

export default function AuxiliarProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoriaId: '',
    subcategoriaId: '',
  });

  const loadProductos = async () => {
    try {
      const response = await apiRequest('/admin/productos');
      setProductos(response?.data?.productos || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar productos');
    }
  };

  const loadCategorias = async () => {
    try {
      const response = await apiRequest('/admin/categorias?activo=true');
      const data = response?.data?.categorias || [];
      setCategorias(data.filter((item) => (item.tipo || 'producto') === 'producto'));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar categorías');
    }
  };

  const loadSubcategorias = async (categoriaId) => {
    if (!categoriaId) {
      setSubcategorias([]);
      return;
    }
    try {
      const response = await apiRequest(`/admin/subcategorias?categoriaId=${categoriaId}&activo=true`);
      setSubcategorias(response?.data?.subcategorias || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar subcategorías');
    }
  };

  useEffect(() => {
    loadProductos();
    loadCategorias();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      await apiRequest('/admin/productos', {
        method: 'POST',
        body: JSON.stringify({
          nombre: newProduct.nombre,
          descripcion: newProduct.descripcion,
          precio: Number(newProduct.precio),
          stock: Number(newProduct.stock),
          categoriaId: Number(newProduct.categoriaId),
          subcategoriaId: Number(newProduct.subcategoriaId),
        }),
      });
      setSuccess('Producto creado correctamente');
      setNewProduct({ nombre: '', descripcion: '', precio: '', stock: '', categoriaId: '', subcategoriaId: '' });
      setSubcategorias([]);
      setIsFormOpen(false);
      await loadProductos();
    } catch (err) {
      setError(err.message || 'No se pudo crear el producto');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Productos</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Nuevo Producto'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Agregar Nuevo Producto</h2>
          <form onSubmit={handleAddProduct}>
            <div className="form-group">
              <label>Nombre</label>
              <input value={newProduct.nombre} onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea value={newProduct.descripcion} onChange={(e) => setNewProduct({ ...newProduct, descripcion: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Precio</label>
              <input type="number" min="1" value={newProduct.precio} onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input type="number" min="0" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={newProduct.categoriaId}
                onChange={(e) => {
                  const categoriaId = e.target.value;
                  setNewProduct({ ...newProduct, categoriaId, subcategoriaId: '' });
                  loadSubcategorias(categoriaId);
                }}
                required
              >
                <option value="">Selecciona categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Subcategoría</label>
              <select value={newProduct.subcategoriaId} onChange={(e) => setNewProduct({ ...newProduct, subcategoriaId: e.target.value })} required>
                <option value="">Selecciona subcategoría</option>
                {subcategorias.map((subcategoria) => (
                  <option key={subcategoria.id} value={subcategoria.id}>{subcategoria.nombre}</option>
                ))}
              </select>
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
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td><img src={getAssetUrl(producto.imagen)} alt={producto.nombre} className="table-img" /></td>
                <td>{producto.nombre}</td>
                <td>${Number(producto.precio || 0).toLocaleString()}</td>
                <td>{Number(producto.stock || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
