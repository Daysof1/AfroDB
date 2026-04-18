import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faBell, faClock, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest, getAssetUrl, normalizeRole } from '../../api/client.js';

export default function ClienteServicios() {
  const navigate = useNavigate();
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('Todas');
  const limite = 9;

  const handleAgendarCita = (servicioId) => {
    const userRole = normalizeRole(localStorage.getItem('userRole'));

    // Si está autenticado como cliente, va a agendar cita
    if (userRole === 'cliente') {
      navigate(`/cliente/citas?servicio=${servicioId}`, {
        state: { servicioId },
      });
    } else {
      // Si no está autenticado, lo lleva al login
      navigate('/login');
    }
  };

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const response = await apiRequest('/catalogo/categorias');
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
    const loadServicios = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set('activo', 'true');
        params.set('pagina', String(pagina));
        params.set('limite', String(limite));
        if (busqueda.trim()) params.set('buscar', busqueda.trim());
        if (filtroCategoria !== 'Todas') params.set('categoriaId', filtroCategoria);
        if (filtroSubcategoria !== 'Todas') params.set('subcategoriaId', filtroSubcategoria);

        const response = await apiRequest(`/servicios?${params.toString()}`);
        setServicios(response?.data?.servicios || []);
        setTotalPaginas(response?.data?.paginacion?.totalPaginas || 1);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los servicios');
      } finally {
        setLoading(false);
      }
    };

    loadServicios();
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

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faBell} /> Nuestros Servicios</h1>
      </div>

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar servicios..."
          value={busqueda}
          onChange={onChangeBusqueda}
          className="search-input"
        />
        <select
          value={filtroCategoria}
          onChange={onChangeCategoria}
          className="search-input"
        >
          <option value="Todas">Categoria: Todas</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={String(categoria.id)}>
              Categoria: {categoria.nombre}
            </option>
          ))}
        </select>
        <select
          value={filtroSubcategoria}
          onChange={onChangeSubcategoria}
          className="search-input"
          disabled={filtroCategoria === 'Todas'}
        >
          <option value="Todas">Subcategoria: Todas</option>
          {subcategorias.map((subcategoria) => (
            <option key={subcategoria.id} value={String(subcategoria.id)}>
              Subcategoria: {subcategoria.nombre}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Cargando servicios...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="servicios-grid">
        {servicios.map((servicio) => (
          <div key={servicio.id} className="servicio-card">
            <div className="cliente-image-frame cliente-image-frame-servicio">
              {servicio.imagen ? (
                <img className="cliente-card-img" src={getAssetUrl(servicio.imagen)} alt={servicio.nombre} />
              ) : (
                <span>✨</span>
              )}
            </div>
            <h3>{servicio.nombre}</h3>
            <p className="servicio-desc">{servicio.descripcion}</p>

            <div className="servicio-details">
              <span><FontAwesomeIcon icon={faClock} /> {servicio.duracion} min</span>
              <span><FontAwesomeIcon icon={faSackDollar} /> ${Number(servicio.precio || 0).toLocaleString()}</span>
            </div>

            <button onClick={() => handleAgendarCita(servicio.id)} className="btn btn-primary"><FontAwesomeIcon icon={faCalendar} /> Agendar Cita</button>
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
    </div>
  );
}

