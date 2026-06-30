// Página: ClienteServicios.js. p?gina de servicios disponibles para clientes.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faBell, faClock, faSackDollar } from '@fortawesome/free-solid-svg-icons';
import Select from "react-select";
import '../Cliente.css';
import { apiRequest, getAssetUrl, getStoredRole, isAuthenticated } from '../../api/client.js';

// Renderiza la vista principal de este componente.
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
    const userRole = getStoredRole();

    // Clientes, admin, auxiliar y profesionales autenticados pueden agendar citas
    if (isAuthenticated() && ['cliente', 'admin', 'auxiliar', 'profesional'].includes(userRole)) {
      navigate(`/agenda/citas?servicio=${servicioId}`, {
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
        const response = await apiRequest('/catalogo/categorias?tipo=servicio');
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

        {/* FILTRO CATEGORÍA */}
        <Select
          value={
            categorias
            .map((categoria) => ({
              value: String(categoria.id),
              label: `Categoria: ${categoria.nombre}`
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
              label: "Categoria: Todas"
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

