import { useEffect, useMemo, useState } from 'react';
import '../Admin.css';
import { apiRequest, fetchImageAsFile, getAssetUrl } from '../../api/client.js';

export default function AuxiliarServicios() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServicioId, setEditingServicioId] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');
  const [filtroSubcategoria, setFiltroSubcategoria] = useState('Todas');
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const limite = 10;
  const [newServicio, setNewServicio] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion: '',
    categoriaId: '',
    subcategoriaId: '',
    imagenUrl: '',
  });

  const resetForm = () => {
    setEditingServicioId(null);
    setNewServicio({ nombre: '', descripcion: '', precio: '', duracion: '', categoriaId: '', subcategoriaId: '', imagenUrl: '' });
    setSubcategorias([]);
  };

  const loadServicios = async () => {
    try {
      const response = await apiRequest(`/admin/servicios?pagina=${pagina}&limite=${limite}`);
      setServicios(response?.data?.servicios || []);
      setTotalPaginas(response?.data?.paginacion?.totalPaginas || 1);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar servicios');
    }
  };

  const loadCategorias = async () => {
    try {
      const response = await apiRequest('/admin/categorias?activo=true');
      const data = response?.data?.categorias || [];
      setCategorias(data.filter((item) => (item.tipo || 'servicio') === 'servicio'));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar categorías de servicio');
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
    loadServicios();
    loadCategorias();
  }, [pagina]);

  const categoriasFiltro = useMemo(() => {
    const unique = new Set(
      servicios
        .map((servicio) => servicio?.categoria?.nombre || 'Sin categoria')
        .filter(Boolean),
    );
    return ['Todos', ...Array.from(unique)];
  }, [servicios]);

  const subcategoriasFiltro = useMemo(() => {
    const unique = new Set(
      servicios
        .filter((servicio) => {
          const categoriaNombre = servicio?.categoria?.nombre || 'Sin categoria';
          return filtroCategoria === 'Todos' || categoriaNombre === filtroCategoria;
        })
        .map((servicio) => servicio?.subcategoria?.nombre || 'Sin subcategoria')
        .filter(Boolean),
    );

    return ['Todas', ...Array.from(unique)];
  }, [servicios, filtroCategoria]);

  useEffect(() => {
    if (!subcategoriasFiltro.includes(filtroSubcategoria)) {
      setFiltroSubcategoria('Todas');
    }
  }, [subcategoriasFiltro, filtroSubcategoria]);

  const serviciosFiltrados = servicios.filter((servicio) => {
    const categoriaNombre = servicio?.categoria?.nombre || 'Sin categoria';
    const subcategoriaNombre = servicio?.subcategoria?.nombre || 'Sin subcategoria';
    const textoBusqueda = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !textoBusqueda ||
      (servicio.nombre || '').toLowerCase().includes(textoBusqueda) ||
      (servicio.descripcion || '').toLowerCase().includes(textoBusqueda);

    return (
      (filtroCategoria === 'Todos' || categoriaNombre === filtroCategoria) &&
      (filtroSubcategoria === 'Todas' || subcategoriaNombre === filtroSubcategoria) &&
      coincideBusqueda
    );
  });

  const handleCrearServicio = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const isEditing = Boolean(editingServicioId);
      const formData = new FormData();
      formData.append('nombre', newServicio.nombre);
      formData.append('descripcion', newServicio.descripcion || '');
      formData.append('precio', String(Number(newServicio.precio)));
      formData.append('duracion', String(Number(newServicio.duracion)));
      formData.append('categoriaId', String(Number(newServicio.categoriaId)));
      formData.append('subcategoriaId', String(Number(newServicio.subcategoriaId)));
      const imagenFile = newServicio.imagenUrl
        ? await fetchImageAsFile(newServicio.imagenUrl, newServicio.nombre || 'servicio')
        : null;
      if (imagenFile) {
        formData.append('imagen', imagenFile);
      }

      await apiRequest(isEditing ? `/admin/servicios/${editingServicioId}` : '/admin/servicios', {
        method: isEditing ? 'PUT' : 'POST',
        body: formData,
      });
      setSuccess(isEditing ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente');
      resetForm();
      setIsFormOpen(false);
      await loadServicios();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el servicio');
    }
  };

  const handleEditarServicio = (servicio) => {
    setError('');
    setSuccess('');
    setEditingServicioId(servicio.id);
    setNewServicio({
      nombre: servicio.nombre || '',
      descripcion: servicio.descripcion || '',
      precio: String(servicio.precio ?? ''),
      duracion: String(servicio.duracion ?? ''),
      categoriaId: String(servicio.categoriaId ?? ''),
      subcategoriaId: String(servicio.subcategoriaId ?? ''),
      imagenUrl: '',
    });
    if (servicio.categoriaId) {
      loadSubcategorias(servicio.categoriaId);
    }
    setIsFormOpen(true);
  };

  const handleToggleServicio = async (id, activoActual) => {
    try {
      setError('');
      setSuccess('');
      const response = await apiRequest(`/admin/servicios/${id}/toggle`, { method: 'PATCH' });
      setSuccess(response?.message || `Servicio ${!activoActual ? 'activado' : 'desactivado'} correctamente`);
      await loadServicios();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el estado del servicio');
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Auxiliar - Servicios</h1>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (isFormOpen) {
              resetForm();
            }
            setIsFormOpen(!isFormOpen);
          }}
        >
          {isFormOpen ? 'Cancelar' : '➕ Nuevo Servicio'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filtros">
        <input
          type="text"
          placeholder="Buscar servicios..."
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
          <h2>{editingServicioId ? 'Editar Servicio' : 'Agregar Nuevo Servicio'}</h2>
          <form onSubmit={handleCrearServicio}>
            <div className="form-group"><label>Nombre</label><input value={newServicio.nombre} onChange={(e) => setNewServicio({ ...newServicio, nombre: e.target.value })} required /></div>
            <div className="form-group"><label>Descripción</label><textarea rows="4" value={newServicio.descripcion} onChange={(e) => setNewServicio({ ...newServicio, descripcion: e.target.value })} /></div>
            <div className="form-group"><label>Precio</label><input type="number" min="1" value={newServicio.precio} onChange={(e) => setNewServicio({ ...newServicio, precio: e.target.value })} required /></div>
            <div className="form-group"><label>Duración (min)</label><input type="number" min="1" value={newServicio.duracion} onChange={(e) => setNewServicio({ ...newServicio, duracion: e.target.value })} required /></div>
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={newServicio.categoriaId}
                onChange={(e) => {
                  const categoriaId = e.target.value;
                  setNewServicio({ ...newServicio, categoriaId, subcategoriaId: '' });
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
              <select value={newServicio.subcategoriaId} onChange={(e) => setNewServicio({ ...newServicio, subcategoriaId: e.target.value })} required>
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
                placeholder="https://..."
                value={newServicio.imagenUrl}
                onChange={(e) => setNewServicio({ ...newServicio, imagenUrl: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingServicioId ? 'Actualizar Servicio' : 'Guardar Servicio'}
            </button>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {serviciosFiltrados.map((servicio) => (
          <div key={servicio.id} className="service-card">
            <div className="card-image-frame">
              <img
                src={getAssetUrl(servicio.imagen)}
                alt={servicio.nombre}
                className="table-img"
              />
            </div>
            <h3>{servicio.nombre}</h3>
            <p>{servicio.descripcion || 'Sin descripcion'}</p>
            <p><strong>Categoria:</strong> {servicio?.categoria?.nombre || 'Sin categoria'}</p>
            <p><strong>Subcategoria:</strong> {servicio?.subcategoria?.nombre || 'Sin subcategoria'}</p>
            <p><strong>Duracion:</strong> {Number(servicio.duracion || 0)} min</p>
            <p className="price">${Number(servicio.precio || 0).toLocaleString()}</p>
            <p>
              <span className={`badge ${servicio.activo ? 'badge-success' : 'badge-danger'}`}>
                {servicio.activo ? '✓ Activo' : '✗ Inactivo'}
              </span>
            </p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEditarServicio(servicio)}>✏️ Editar</button>
              <button
                className={`btn btn-sm ${servicio.activo ? 'btn-warning' : 'btn-success'}`}
                onClick={() => handleToggleServicio(servicio.id, servicio.activo)}
                title={servicio.activo ? 'Desactivar' : 'Activar'}
              >
                {servicio.activo ? '⊘ Desactivar' : '✓ Activar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {serviciosFiltrados.length === 0 && (
        <div className="empty-state">
          <p>No se encontraron servicios con esos filtros</p>
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
