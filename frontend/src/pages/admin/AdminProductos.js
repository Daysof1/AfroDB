// Página: AdminProductos.js. gesti?n de productos del cat?logo.
import { useEffect, useMemo, useState } from 'react';
import '../Admin.css';
import { apiRequest, getAssetUrl } from '../../api/client.js';
import { exportarProductosAPDF, exportarProductosAExcel } from '../../utils/exportUtils.js';

// Renderiza la vista principal de este componente.
export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  // Este límite sólo se usa para traer cada lote desde el backend.
  const limite = 100;
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [showExportOptions, setShowExportOptions] = useState(false);

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
      const response = await apiRequest(`/admin/productos?pagina=${pagina}&limite=${limite}`);
      setProductos(response?.data?.productos || []);
      setTotalPaginas(response?.data?.paginacion?.totalPaginas || 1);
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
  }, [pagina]);

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
      (producto.descripcion || '').toLowerCase().includes(textoBusqueda) ||
      (producto?.categoria?.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (producto?.subcategoria?.nombre || '').toLowerCase().includes(textoBusqueda);

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
      const payload = {
        nombre: newProduct.nombre,
        descripcion: newProduct.descripcion || '',
        precio: Number(newProduct.precio),
        stock: Number(newProduct.stock),
        imagenUrl: newProduct.imagenUrl || '',
      };

      if (!isEditing || categoriaChanged) {
        payload.categoriaId = Number(newProduct.categoriaId);
      }
      if (!isEditing || subcategoriaChanged) {
        payload.subcategoriaId = Number(newProduct.subcategoriaId);
      }

      const response = await apiRequest(isEditing ? `/admin/productos/${editingProductId}` : '/admin/productos', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      setSuccess(isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente');

      const productoGuardado = response?.data?.producto || null;
      const imagenMostrada = newProduct.imagenUrl || productoGuardado?.imagen || '';
      const productoNormalizado = productoGuardado
        ? {
            ...productoGuardado,
            imagen: imagenMostrada,
          }
        : null;

      if (productoNormalizado) {
        setProductos((actuales) => {
          if (isEditing) {
            return actuales.map((producto) =>
              String(producto.id) === String(editingProductId)
                ? { ...producto, ...productoNormalizado, imagen: imagenMostrada }
                : producto,
            );
          }

          return [{ ...productoNormalizado, imagen: imagenMostrada }, ...actuales];
        });
      }

      resetForm();
      setIsFormOpen(false);
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
      imagenUrl: producto.imagen ? getAssetUrl(producto.imagen) : '',
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
        <h1>Gestión de Productos</h1>
        
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
                      exportarProductosAPDF(productosFiltrados);
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
                      await exportarProductosAExcel(productosFiltrados);
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
              <label>URL de imagen</label>
              <input
                type="url"
                value={newProduct.imagenUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imagenUrl: e.target.value })}
                placeholder="https://..."
              />
              {newProduct.imagenUrl && (
                <div className="card-image-frame" style={{ marginTop: '12px' }}>
                  <img
                    src={getAssetUrl(newProduct.imagenUrl)}
                    alt={newProduct.nombre || 'Vista previa del producto'}
                    className="table-img"
                  />
                </div>
              )}
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
              <button className="btn btn-sm btn-secondary" onClick={() => handleEditProduct(producto)}>✏️Editar </button>
              <button
                className={`btn btn-sm ${producto.activo ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleProducto(producto.id, producto.activo)}
                title={producto.activo ? 'Desactivar' : 'Activar'}
              >
                {producto.activo ? '⊘ Desactivar' : '✓ Activar'}
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteProduct(producto.id)}>🗑️ Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron productos con esos filtros</p>
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="pagination">
          <button
            disabled={pagina === 1}
            onClick={() => setPagina(pagina - 1)}
            className="btn btn-secondary"
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {pagina} de {totalPaginas}
          </span>
          <button
            disabled={pagina === totalPaginas}
            onClick={() => setPagina(pagina + 1)}
            className="btn btn-secondary"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

