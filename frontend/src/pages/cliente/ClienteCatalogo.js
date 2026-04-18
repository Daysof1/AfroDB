import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl } from '../../api/client.js';

export default function ClienteCatalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 9;

  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const loadProductos = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(`/catalogo/productos?pagina=${pagina}&limite=${limite}`);
        setProductos(response?.data?.productos || []);
        setTotalPaginas(response?.data?.paginacion?.totalPaginas || 1);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar productos');
      } finally {
        setLoading(false);
      }
    };

    loadProductos();
  }, [pagina]);

  const categorias = useMemo(() => {
    const unique = new Set(
      productos
        .map((p) => p?.categoria?.nombre || 'Sin categoría')
        .filter(Boolean),
    );
    return ['Todos', ...Array.from(unique)];
  }, [productos]);

  const subcategorias = useMemo(() => {
    const unique = new Set(
      productos
        .filter((p) => {
          const categoriaNombre = p?.categoria?.nombre || 'Sin categoría';
          return filtroCategoria === 'Todos' || categoriaNombre === filtroCategoria;
        })
        .map((p) => p?.subcategoria?.nombre || 'Sin subcategoría')
        .filter(Boolean),
    );

    return ['Todas', ...Array.from(unique)];
  }, [productos, filtroCategoria]);

  useEffect(() => {
    if (!subcategorias.includes(filtroSubcategoria)) {
      setFiltroSubcategoria('Todas');
    }
  }, [subcategorias, filtroSubcategoria]);

  const productosFiltrados = productos.filter((p) => {
    const categoriaNombre = p?.categoria?.nombre || 'Sin categoría';
    const subcategoriaNombre = p?.subcategoria?.nombre || 'Sin subcategoría';
    return (
      (filtroCategoria === 'Todos' || categoriaNombre === filtroCategoria) &&
      (filtroSubcategoria === 'Todas' || subcategoriaNombre === filtroSubcategoria) &&
      p.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  });

  const handleAgregarAlCarrito = async (productoId) => {
    try {
      await apiRequest('/cliente/carrito', {
        method: 'POST',
        body: JSON.stringify({ productoId, cantidad: 1 }),
      });
      setMessage('Producto agregado al carrito');
      setTimeout(() => setMessage(''), 1800);
    } catch (err) {
      setError(err.message || 'No se pudo agregar al carrito');
    }
  };

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faShoppingBag} /> Catálogo de Productos</h1>
      </div>

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
          {categorias.map((categoria) => (
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
          {subcategorias.map((subcategoria) => (
            <option key={subcategoria} value={subcategoria}>
              Subcategoria: {subcategoria}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Cargando productos...</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="productos-grid">
        {productosFiltrados.map((producto) => (
          <div key={producto.id} className="producto-card">
            <div className="cliente-image-frame cliente-image-frame-producto">
              <img className="cliente-card-img" src={getAssetUrl(producto.imagen)} alt={producto.nombre} />
            </div>
            <h3>{producto.nombre}</h3>
            <p className="descripcion">{producto.descripcion || 'Sin descripción'}</p>
            <p className="precio">${Number(producto.precio || 0).toLocaleString()}</p>
            <div className="card-actions">
              <button className="btn btn-secondary" onClick={() => handleAgregarAlCarrito(producto.id)}>
                <FontAwesomeIcon icon={faCartShopping} /> Agregar al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>

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

      {productosFiltrados.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}

