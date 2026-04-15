import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faCartShopping, faEye } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl } from '../../api/client';

export default function ClienteCatalogo() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const loadProductos = async () => {
      try {
        setLoading(true);
        const response = await apiRequest('/catalogo/productos');
        setProductos(response?.data?.productos || []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar productos');
      } finally {
        setLoading(false);
      }
    };

    loadProductos();
  }, []);

  const categorias = useMemo(() => {
    const unique = new Set(
      productos
        .map((p) => p?.categoria?.nombre || 'Sin categoría')
        .filter(Boolean),
    );
    return ['Todos', ...Array.from(unique)];
  }, [productos]);

  const productosFiltrados = productos.filter((p) => {
    const categoriaNombre = p?.categoria?.nombre || 'Sin categoría';
    return (
      (filtro === 'Todos' || categoriaNombre === filtro) &&
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
        <div className="filter-buttons">
          {categorias.map((categoria) => (
            <button
              key={categoria}
              className={`filter-btn ${filtro === categoria ? 'active' : ''}`}
              onClick={() => setFiltro(categoria)}
            >
              {categoria}
            </button>
          ))}
        </div>
      </div>

      {loading && <p>Cargando productos...</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="productos-grid">
        {productosFiltrados.map((producto) => (
          <div key={producto.id} className="producto-card">
            <img src={getAssetUrl(producto.imagen)} alt={producto.nombre} />
            <h3>{producto.nombre}</h3>
            <p className="categoria">{producto?.categoria?.nombre || 'Sin categoría'}</p>
            <p className="precio">${Number(producto.precio || 0).toLocaleString()}</p>
            <div className="card-actions">
              <button className="btn btn-primary"><FontAwesomeIcon icon={faEye} /> Ver Detalles</button>
              <button className="btn btn-secondary" onClick={() => handleAgregarAlCarrito(producto.id)}>
                <FontAwesomeIcon icon={faCartShopping} /> Agregar al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>

      {productosFiltrados.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}
