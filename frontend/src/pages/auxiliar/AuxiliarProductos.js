import { useEffect, useMemo, useState } from 'react';
import '../Admin.css';
import { apiRequest, fetchImageAsFile, getAssetUrl } from '../../api/client.js';

export default function AuxiliarProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingOriginal, setEditingOriginal] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [newProduct, setNewProduct] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    stock: '',
    categoriaId: '',
    subcategoriaId: '',
    imagenUrl: '',
  });

  const resetForm = () => {
    setEditingProductId(null);
    setEditingOriginal(null);
    setNewProduct({ nombre: '', descripcion: '', precio: '', stock: '', categoriaId: '', subcategoriaId: '', imagenUrl: '' });
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

  const categoriasFiltro = useMemo(() => {
    const unique = new Set(
      productos
        .map((producto) => producto?.categoria?.nombre || 'Sin categoría')
        .filter(Boolean),
    );
    return ['Todos', ...Array.from(unique)];
  }, [productos]);

  const subcategoriasFiltro = useMemo(() => {
    const unique = new Set(
      productos
        .filter((producto) => {
          const categoriaNombre = producto?.categoria?.nombre || 'Sin categoría';
          return filtroCategoria === 'Todos' || categoriaNombre === filtroCategoria;
        })
        .map((producto) => producto?.subcategoria?.nombre || 'Sin subcategoría')
        .filter(Boolean),
    );

    return ['Todas', ...Array.from(unique)];
  }, [productos, filtroCategoria]);

  useEffect(() => {
    if (!subcategoriasFiltro.includes(filtroSubcategoria)) {
      setFiltroSubcategoria('Todas');
    }
  }, [subcategoriasFiltro, filtroSubcategoria]);

  const productosFiltrados = productos.filter((producto) => {
    const categoriaNombre = producto?.categoria?.nombre || 'Sin categoría';
    const subcategoriaNombre = producto?.subcategoria?.nombre || 'Sin subcategoría';
    const textoBusqueda = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !textoBusqueda ||
      (producto.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (producto.descripcion || '').toLowerCase().includes(textoBusqueda);

    return (
      (filtroCategoria === 'Todos' || categoriaNombre === filtroCategoria) &&
      (filtroSubcategoria === 'Todas' || subcategoriaNombre === filtroSubcategoria) &&
      coincideBusqueda
    );
  });

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const isEditing = Boolean(editingProductId);
      const categoriaChanged = String(newProduct.categoriaId) !== String(editingOriginal?.categoriaId ?? '');
      const subcategoriaChanged = String(newProduct.subcategoriaId) !== String(editingOriginal?.subcategoriaId ?? '');
      const imagenFile = newProduct.imagenUrl ? await fetchImageAsFile(newProduct.imagenUrl, newProduct.nombre || 'producto') : null;

      if (!isEditing || categoriaChanged) {
        // se envía abajo
      }
      if (!isEditing || subcategoriaChanged) {
        // se envía abajo
      }

      const formData = new FormData();
      formData.append('nombre', newProduct.nombre);
      formData.append('descripcion', newProduct.descripcion || '');
      formData.append('precio', String(Number(newProduct.precio)));
      formData.append('stock', String(Number(newProduct.stock)));
      if (!isEditing || categoriaChanged) formData.append('categoriaId', String(Number(newProduct.categoriaId)));
      if (!isEditing || subcategoriaChanged) formData.append('subcategoriaId', String(Number(newProduct.subcategoriaId)));
      if (imagenFile) formData.append('imagen', imagenFile);

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
      imagenUrl: '',
    });
    if (producto.categoriaId) {
      loadSubcategorias(producto.categoriaId);
    }
    setIsFormOpen(true);
  };

  const handleToggleProducto = async (id, activoActual) => {
    try {
      setError('');
      setSuccess('');
      const response = await apiRequest(`/admin/productos/${id}/toggle`, { method: 'PATCH' });
      setSuccess(response?.message || `Producto ${!activoActual ? 'activado' : 'desactivado'} correctamente`);
      await loadProductos();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado del producto');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Productos</h1>
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

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="search-input"
        />
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="search-input"
        >
          {categoriasFiltro.map((categoria) => (
            <option key={categoria} value={categoria}>
              Categoria: {categoria}
            </option>
          ))}
        </select>
        <select
          value={filtroSubcategoria}
          onChange={(e) => setFiltroSubcategoria(e.target.value)}
          className="search-input"
        >
          {subcategoriasFiltro.map((subcategoria) => (
            <option key={subcategoria} value={subcategoria}>
              Subcategoria: {subcategoria}
            </option>
          ))}
        </select>
      </div>

      {isFormOpen && (
        <div className="form-container">
          <h2>{editingProductId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
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
            <div className="form-group">
              <label>URL de imagen</label>
              <input
                type="url"
                value={newProduct.imagenUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imagenUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingProductId ? 'Actualizar Producto' : 'Guardar Producto'}
            </button>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {productosFiltrados.map((producto) => (
          <div key={producto.id} className="service-card">
            <div className="card-image-frame">
              <img
                src={getAssetUrl(producto.imagen)}
                alt={producto.nombre}
                className="table-img"
              />
            </div>
            <h3>{producto.nombre}</h3>
            <p>{producto.descripcion || 'Sin descripción'}</p>
            <p><strong>Categoría:</strong> {producto?.categoria?.nombre || 'Sin categoría'}</p>
            <p><strong>Subcategoría:</strong> {producto?.subcategoria?.nombre || 'Sin subcategoría'}</p>
            <p><strong>Precio:</strong> ${Number(producto.precio || 0).toLocaleString()}</p>
            <p><strong>Stock:</strong> {Number(producto.stock || 0)}</p>
            <p>
              <span className={`badge ${producto.activo ? 'badge-success' : 'badge-danger'}`}>
                {producto.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEditProduct(producto)}>✏️ Editar</button>
              <button
                className={`btn btn-sm ${producto.activo ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleProducto(producto.id, producto.activo)}
                title={producto.activo ? 'Desactivar' : 'Activar'}
              >
                {producto.activo ? '⊘ Desactivar' : '✓ Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron productos con esos filtros</p>
        </div>
      )}
    </div>
  );
}

