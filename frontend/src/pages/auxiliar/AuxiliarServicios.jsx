import { useEffect, useState } from 'react';
import '../Admin.css';
import { apiRequest } from '../../api/client';

export default function AuxiliarServicios() {
  const [servicios, setServicios] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingServicioId, setEditingServicioId] = useState(null);
  const [newServicio, setNewServicio] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracion: '',
    categoriaId: '',
    subcategoriaId: '',
    profesionalId: '',
  });

  const resetForm = () => {
    setEditingServicioId(null);
    setNewServicio({ nombre: '', descripcion: '', precio: '', duracion: '', categoriaId: '', subcategoriaId: '', profesionalId: '' });
    setSubcategorias([]);
  };

  const loadServicios = async () => {
    try {
      const response = await apiRequest('/admin/servicios');
      setServicios(response?.data?.servicios || []);
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

  const loadProfesionales = async () => {
    try {
      const response = await apiRequest('/admin/profesionales');
      setProfesionales(response?.data?.profesionales || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar profesionales');
    }
  };

  useEffect(() => {
    loadServicios();
    loadCategorias();
    loadProfesionales();
  }, []);

  const handleCrearServicio = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      const isEditing = Boolean(editingServicioId);
      await apiRequest(isEditing ? `/admin/servicios/${editingServicioId}` : '/admin/servicios', {
        method: isEditing ? 'PUT' : 'POST',
        body: JSON.stringify({
          nombre: newServicio.nombre,
          descripcion: newServicio.descripcion,
          precio: Number(newServicio.precio),
          duracion: Number(newServicio.duracion),
          categoriaId: Number(newServicio.categoriaId),
          subcategoriaId: Number(newServicio.subcategoriaId),
          profesionalId: Number(newServicio.profesionalId),
        }),
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
      profesionalId: String(servicio.profesionalId ?? ''),
    });
    if (servicio.categoriaId) {
      loadSubcategorias(servicio.categoriaId);
    }
    setIsFormOpen(true);
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
              <label>Profesional</label>
              <select value={newServicio.profesionalId} onChange={(e) => setNewServicio({ ...newServicio, profesionalId: e.target.value })} required>
                <option value="">Selecciona profesional</option>
                {profesionales.map((profesional) => (
                  <option key={profesional.id} value={profesional.id}>{profesional.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              {editingServicioId ? 'Actualizar Servicio' : 'Guardar Servicio'}
            </button>
          </form>
        </div>
      )}

      <div className="cards-grid">
        {servicios.map((servicio) => (
          <div key={servicio.id} className="service-card">
            <h3>{servicio.nombre}</h3>
            <p>{servicio.descripcion}</p>
            <p className="price">${Number(servicio.precio || 0).toLocaleString()}</p>
            <div className="card-actions">
              <button className="btn btn-sm btn-secondary" onClick={() => handleEditarServicio(servicio)}>✏️ Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
