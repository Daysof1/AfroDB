import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faCartShopping, faEye } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';

export default function ClienteCatalogo() {
  const [productos, setProductos] = useState([
    { id: 1, nombre: 'Shampoo Orgánico', precio: 25000, imagen: '/uploads/shampoo.jfif', categoria: 'Cuidado Capilar' },
    { id: 2, nombre: 'Aceite Nutritivo', precio: 35000, imagen: '/uploads/aceite.jfif', categoria: 'Tratamientos' },
    { id: 3, nombre: 'Mascarilla Capilar', precio: 30000, imagen: '/uploads/Mascarilla%20Capilar.avif', categoria: 'Tratamientos' },
    { id: 4, nombre: 'Cuidado Facial', precio: 45000, imagen: '/uploads/facial%20care.jfif', categoria: 'Cuidado Facial' },
  ]);

  const [filtro, setFiltro] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  const productosFiltrados = productos.filter(p => 
    (filtro === 'Todos' || p.categoria === filtro) &&
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

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
          <button 
            className={`filter-btn ${filtro === 'Todos' ? 'active' : ''}`}
            onClick={() => setFiltro('Todos')}
          >
            Todos
          </button>
          <button 
            className={`filter-btn ${filtro === 'Cuidado Capilar' ? 'active' : ''}`}
            onClick={() => setFiltro('Cuidado Capilar')}
          >
            Cuidado Capilar
          </button>
          <button 
            className={`filter-btn ${filtro === 'Cuidado Facial' ? 'active' : ''}`}
            onClick={() => setFiltro('Cuidado Facial')}
          >
            Cuidado Facial
          </button>
          <button 
            className={`filter-btn ${filtro === 'Tratamientos' ? 'active' : ''}`}
            onClick={() => setFiltro('Tratamientos')}
          >
            Tratamientos
          </button>
        </div>
      </div>

      <div className="productos-grid">
        {productosFiltrados.map(producto => (
          <div key={producto.id} className="producto-card">
            <img src={producto.imagen} alt={producto.nombre} />
            <h3>{producto.nombre}</h3>
            <p className="categoria">{producto.categoria}</p>
            <p className="precio">${producto.precio.toLocaleString()}</p>
            <div className="card-actions">
              <button className="btn btn-primary"><FontAwesomeIcon icon={faEye} /> Ver Detalles</button>
              <button className="btn btn-secondary"><FontAwesomeIcon icon={faCartShopping} /> Agregar al Carrito</button>
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
