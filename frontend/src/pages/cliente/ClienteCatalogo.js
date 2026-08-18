// Página: ClienteCatalogo.js. p?gina del cat?logo de productos para clientes.
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import '../Cliente.css';
import {
  apiRequest,
  addItemToLocalCart,
  getAssetUrl,
  isAuthenticated,
} from '../../api/client.js';

// Renderiza la vista principal de este componente.
export default function ClienteCatalogo() {
  const authenticated = isAuthenticated();
  const useServerCart = authenticated;
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 9;

  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const response = await apiRequest('/catalogo/categorias?tipo=producto');
        setCategorias(response?.data?.categorias || []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar categorías');
      }
    };

    loadCategorias();
  }, []);

  useEffect(() => {
    const loadSubcategorias = async () => {
      if (filtroCategoria === 'Todas') {
        setSubcategorias([]);
        setFiltroSubcategoria('Todas');
        return;
      }

      try {
        const response = await apiRequest(`/catalogo/categorias/${filtroCategoria}/subcategorias`);
        setSubcategorias(response?.data?.subcategorias || []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar subcategorías');
      }
    };

    loadSubcategorias();
  }, [filtroCategoria]);

  useEffect(() => {
    const loadProductos = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set('pagina', String(pagina));
        params.set('limite', String(limite));
        if (busqueda.trim()) params.set('buscar', busqueda.trim());
        if (filtroCategoria !== 'Todas') params.set('categoriaId', filtroCategoria);
        if (filtroSubcategoria !== 'Todas') params.set('subcategoriaId', filtroSubcategoria);

        const response = await apiRequest(`/catalogo/productos?${params.toString()}`);
        setProductos(response?.data?.productos || []);
        setTotalPaginas(response?.data?.paginacion?.totalPaginas || 1);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar productos');
      } finally {
        setLoading(false);
      }
    };

    loadProductos();
  }, [pagina, busqueda, filtroCategoria, filtroSubcategoria]);

  const onChangeBusqueda = (event) => {
    setPagina(1);
    setBusqueda(event.target.value);
  };

  const onChangeCategoria = (event) => {
    setPagina(1);
    setFiltroCategoria(event.target.value);
    setFiltroSubcategoria('Todas');
  };

  const onChangeSubcategoria = (event) => {
    setPagina(1);
    setFiltroSubcategoria(event.target.value);
  };

 const handleAgregarAlCarrito = async (productoId) => {
  try {
    // ✅ Validar que el ID sea válido
    const id = Number(productoId);
    if (Number.isNaN(id) || id <= 0) {
      setError('Producto inválido');
      return;
    }

    const producto = productos.find((item) => String(item.id) === String(id));
    if (!producto) {
      setError('Producto no encontrado');
      return;
    }

    if (useServerCart) {
      await apiRequest('/cliente/carrito', {
        method: 'POST',
        body: JSON.stringify({ productoId: id, cantidad: 1 }),
      });
    } else {
      // ✅ Sanitizar el producto antes de guardarlo en localStorage
      const safeProducto = {
        id: Number(producto.id),
        nombre: String(producto.nombre || 'Producto'),
        precio: Number(producto.precio || 0),
        imagen: String(producto.imagen || ''),
        descripcion: String(producto.descripcion || ''),
        stock: Number(producto.stock || 0),
      };
      addItemToLocalCart(safeProducto, 1);
    }

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
          onChange={onChangeBusqueda}
          className="search-input"
        />


        {/* FILTRO CATEGORÍA */}
        <Select
          value={
            categorias
              .map((categoria) => ({
                value: String(categoria.id),
                label: `Categoría: ${categoria.nombre}`
              }))
              .find(
                (opcion) => opcion.value === filtroCategoria
              ) || {
                value: "Todas",
                label: "Categoría: Todas"
              }
          }

          onChange={(opcion) => {
            onChangeCategoria({
              target: {
                value: opcion.value
              }
            });
          }}

          options={[
            {
              value: "Todas",
              label: "Categoría: Todas"
            },

            ...categorias.map((categoria) => ({
              value: String(categoria.id),
              label: `Categoría: ${categoria.nombre}`
            }))
          ]}

          className="search-input"
          placeholder="Filtrar categoría..."
          isSearchable
        />


        {/* FILTRO SUBCATEGORÍA */}
        <Select
          value={
            subcategorias
              .map((subcategoria) => ({
                value: String(subcategoria.id),
                label: `Subcategoría: ${subcategoria.nombre}`
              }))
              .find(
                (opcion) => opcion.value === filtroSubcategoria
              ) || {
                value: "Todas",
                label: "Subcategoría: Todas"
              }
          }


          onChange={(opcion) => {
            onChangeSubcategoria({
              target: {
                value: opcion.value
              }
            });
          }}


          options={[
            {
              value: "Todas",
              label: "Subcategoría: Todas"
            },

            ...subcategorias.map((subcategoria) => ({
              value: String(subcategoria.id),
              label: `Subcategoría: ${subcategoria.nombre}`
            }))
          ]}


          className="search-input"
          placeholder="Filtrar subcategoría..."
          isSearchable
          isDisabled={filtroCategoria === "Todas"}
        />

      </div>

      {loading && <p>Cargando productos...</p>}
      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="productos-grid">
        {productos.map((producto) => (
          <div key={producto.id} className="producto-card">
            <div className="cliente-image-frame cliente-image-frame-producto">
              <img className="cliente-card-img" src={getAssetUrl(producto.imagen)} alt={producto.nombre} />
            </div>
            <h3>{producto.nombre}</h3>
            <p className="descripcion">{producto.descripcion || 'Sin descripción'}</p>
            <p className="precio">${Number(producto.precio || 0).toLocaleString()}</p>
            <div className="card-actions">
              <button type="button" className="btn btn-secondary" onClick={() => handleAgregarAlCarrito(producto.id)}>
                <FontAwesomeIcon icon={faCartShopping} /> Agregar al Carrito
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="pagination">
          <button
            type="button"
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
            type="button"
            disabled={pagina === totalPaginas}
            onClick={() => setPagina(pagina + 1)}
            className="btn btn-secondary"
          >
            Siguiente →
          </button>
        </div>
      )}

      {productos.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}

