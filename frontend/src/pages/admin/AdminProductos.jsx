import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest, fetchImageAsFile, getAssetUrl } from '../../api/client';

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingOriginal, setEditingOriginal] = useState(null);
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoriaId: '',
    subcategoriaId: '',
    imagen: null,
    imagenUrl: '',
  });

  const resetForm = () => {
    setEditingProductId(null);
    setEditingOriginal(null);
    setNewProduct({ nombre: '', descripcion: '', precio: '', stock: '', categoriaId: '', subcategoriaId: '', imagen: null, imagenUrl: '' });
    setSubcategorias([]);
  };

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

      const formData = new FormData();
      formData.append('nombre', newProduct.nombre);
      formData.append('descripcion', newProduct.descripcion || '');
      formData.append('precio', newProduct.precio);
      formData.append('stock', newProduct.stock);
      const isEditing = Boolean(editingProductId);
      const categoriaChanged = String(newProduct.categoriaId) !== String(editingOriginal?.categoriaId ?? '');
      const subcategoriaChanged = String(newProduct.subcategoriaId) !== String(editingOriginal?.subcategoriaId ?? '');
      const imagenFile = newProduct.imagen || (newProduct.imagenUrl ? await fetchImageAsFile(newProduct.imagenUrl, newProduct.nombre || 'producto') : null);

      if (!isEditing || categoriaChanged) {
        formData.append('categoriaId', newProduct.categoriaId);
      }
      if (!isEditing || subcategoriaChanged) {
        formData.append('subcategoriaId', newProduct.subcategoriaId);
      }
      if (imagenFile) {
        formData.append('imagen', imagenFile);
      }

      await apiRequest(isEditing ? `/admin/productos/${editingProductId}` : '/admin/productos', {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
      });
      setSuccess(isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente');
      resetForm();
      setIsFormOpen(false);
      await loadProductos();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto');
    }
  };

  const handleEditProduct = (producto) => {
    setError('');
    setSuccess('');
    setEditingProductId(producto.id);
    setEditingOriginal({
      categoriaId: String(producto.categoriaId ?? ''),
      subcategoriaId: String(producto.subcategoriaId ?? ''),
    });
    setNewProduct({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: String(producto.precio ?? ''),
      stock: String(producto.stock ?? ''),
      categoriaId: String(producto.categoriaId ?? ''),
      subcategoriaId: String(producto.subcategoriaId ?? ''),
      imagen: null,
        imagenUrl: '',
    });
    if (producto.categoriaId) {
      loadSubcategorias(producto.categoriaId);
    }
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await apiRequest(`/admin/productos/${id}`, { method: 'DELETE' });
      await loadProductos();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el producto');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gestión de Productos</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (isFormOpen) {
              resetForm();
            }
            setIsFormOpen(!isFormOpen);
          }}
        >
          {isFormOpen ? 'Cancelar' : '➕ Nuevo Producto'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>{editingProductId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
          <form onSubmit={handleAddProduct}>
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                value={newProduct.nombre}
                onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                placeholder="Nombre del producto"
                required
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={newProduct.descripcion}
                onChange={(e) => setNewProduct({ ...newProduct, descripcion: e.target.value })}
                placeholder="Descripción"
              ></textarea>
            </div>
            <div className="form-group">
              <label>Precio</label>
              <input
                type="number"
                value={newProduct.precio}
                onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
                placeholder="Precio"
                min="1"
                required
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                placeholder="Cantidad en stock"
                min="0"
                required
              />
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
              <select
                value={newProduct.subcategoriaId}
                onChange={(e) => setNewProduct({ ...newProduct, subcategoriaId: e.target.value })}
                required
              >
                <option value="">Selecciona subcategoría</option>
                {subcategorias.map((subcategoria) => (
                  <option key={subcategoria.id} value={subcategoria.id}>{subcategoria.nombre}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Imagen</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewProduct({ ...newProduct, imagen: e.target.files?.[0] || null, imagenUrl: '' })}
              />
            </div>
            <div className="form-group">
              <label>O pegar URL de imagen</label>
              <input
                type="url"
                value={newProduct.imagenUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imagenUrl: e.target.value, imagen: null })}
                placeholder="https://..."
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingProductId ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
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
            {productos.map((producto) => (
              <tr key={producto.id}>
                <td><img src={getAssetUrl(producto.imagen)} alt={producto.nombre} className="table-img" /></td>
                <td>{producto.nombre}</td>
                <td>${Number(producto.precio || 0).toLocaleString()}</td>
                <td>{Number(producto.stock || 0)}</td>
                <td>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEditProduct(producto)}>✏️ Editar</button>
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
