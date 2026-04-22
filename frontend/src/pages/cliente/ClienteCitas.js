import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import '../Cliente.css';
import { apiRequest } from '../../api/client.js';

const normalizarTexto = (texto = '') =>
  String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export default function ClienteCitas() {
  const location = useLocation();
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [formData, setFormData] = useState({ profesionalId: '', profesionalesIds: [], servicioIds: [], fecha: '', hora: '' });
  const [usarSeleccionMultiple, setUsarSeleccionMultiple] = useState(false);
  const [reprogramandoId, setReprogramandoId] = useState(null);
  const [reprogramacionData, setReprogramacionData] = useState({ fecha: '', hora: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);

  const servicioPreseleccionadoId = useMemo(() => {
    const servicioIdDesdeState = location?.state?.servicioId;
    if (servicioIdDesdeState !== undefined && servicioIdDesdeState !== null && servicioIdDesdeState !== '') {
      return Number(servicioIdDesdeState);
    }

    const params = new URLSearchParams(location.search);
    const servicioIdDesdeQuery = params.get('servicio');
    if (!servicioIdDesdeQuery) {
      return null;
    }

    return Number(servicioIdDesdeQuery);
  }, [location.search, location.state]);

  const profesionalPreseleccionadoId = useMemo(() => {
    const profesionalIdDesdeState = location?.state?.profesionalId;
    if (profesionalIdDesdeState !== undefined && profesionalIdDesdeState !== null && profesionalIdDesdeState !== '') {
      return String(profesionalIdDesdeState);
    }

    const params = new URLSearchParams(location.search);
    const profesionalIdDesdeQuery = params.get('profesional');
    if (!profesionalIdDesdeQuery) {
      return null;
    }

    return String(profesionalIdDesdeQuery);
  }, [location.search, location.state]);

  const nombresEspecialidadesRequeridas = Array.from(new Set(
    servicios
      .filter((servicio) => formData.servicioIds.includes(servicio.id))
      .map((servicio) => servicio?.subcategoria?.nombre)
      .filter(Boolean)
      .map(normalizarTexto)
  ));

  const profesionalesCompatiblesIds = new Set(
    profesionales
      .filter((profesional) => {
        if (nombresEspecialidadesRequeridas.length === 0) {
          return true;
        }

        const especialidadesProfesional = new Set(
          (profesional.especialidades || []).map((esp) => normalizarTexto(esp.nombre))
        );

        return nombresEspecialidadesRequeridas.every((nombre) => especialidadesProfesional.has(nombre));
      })
      .map((profesional) => Number(profesional.id))
  );

  const profesionalesPorId = useMemo(() => {
    const map = new Map();
    profesionales.forEach((profesional) => {
      map.set(Number(profesional.id), profesional.nombre || `Profesional ${profesional.id}`);
    });
    return map;
  }, [profesionales]);

  const toggleServicio = (servicioId) => {
    setFormData((prev) => {
      const yaSeleccionado = prev.servicioIds.includes(servicioId);
      if (yaSeleccionado) {
        return {
          ...prev,
          servicioIds: prev.servicioIds.filter((id) => id !== servicioId),
        };
      }

      return {
        ...prev,
        servicioIds: [...prev.servicioIds, servicioId],
      };
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [citasRes, serviciosRes, profesionalesRes] = await Promise.all([
        apiRequest('/cliente/citas'),
        apiRequest('/servicios?activo=true'),
        apiRequest('/profesionales'),
      ]);
      setCitas(citasRes?.data?.citas || []);
      setServicios(serviciosRes?.data?.servicios || []);
      setProfesionales(profesionalesRes?.data?.profesionales || []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la información de citas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const hasServicioPrefill = Number.isFinite(servicioPreseleccionadoId)
      && servicios.some((servicio) => Number(servicio.id) === Number(servicioPreseleccionadoId));

    const hasProfesionalPrefill = !!profesionalPreseleccionadoId
      && profesionales.some((profesional) => String(profesional.id) === String(profesionalPreseleccionadoId));

    if (!hasServicioPrefill && !hasProfesionalPrefill) {
      return;
    }

    setIsFormOpen(true);
    setFormData((prev) => {
      const next = { ...prev };

      if (hasServicioPrefill) {
        next.servicioIds = prev.servicioIds.includes(servicioPreseleccionadoId)
          ? prev.servicioIds
          : [...prev.servicioIds, servicioPreseleccionadoId];
      }

      if (hasProfesionalPrefill) {
        next.profesionalId = String(profesionalPreseleccionadoId);
        next.profesionalesIds = prev.profesionalesIds.includes(Number(profesionalPreseleccionadoId))
          ? prev.profesionalesIds
          : [...prev.profesionalesIds, Number(profesionalPreseleccionadoId)];
      }

      return next;
    });

    if (location.search || location.state?.servicioId || location.state?.profesionalId) {
      navigate('/cliente/citas', { replace: true });
    }
  }, [
    servicioPreseleccionadoId,
    profesionalPreseleccionadoId,
    servicios,
    profesionales,
    location.search,
    location.state,
    navigate,
  ]);

  const formatEstado = (estado) => {
    const value = (estado || '').toLowerCase();
    if (value === 'confirmada') return 'Confirmada';
    if (value === 'pendiente') return 'Pendiente';
    if (value === 'cancelada') return 'Cancelada';
    if (value === 'completada') return 'Completada';
    return estado || 'Sin estado';
  };

  const handleCrearCita = async (e) => {
    e.preventDefault();
    try {
      if (!formData.servicioIds.length) {
        setError('Debes seleccionar al menos un servicio');
        return;
      }

      await apiRequest('/cliente/citas', {
        method: 'POST',
        body: JSON.stringify({
          profesionalId: usarSeleccionMultiple ? undefined : (formData.profesionalId || undefined),
          profesionalesIds: usarSeleccionMultiple && formData.profesionalesIds.length > 0
            ? formData.profesionalesIds
            : undefined,
          servicios: formData.servicioIds,
          fecha: formData.fecha,
          hora: formData.hora,
        }),
      });
      setFormData({ profesionalId: '', profesionalesIds: [], servicioIds: [], fecha: '', hora: '' });
      setUsarSeleccionMultiple(false);
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo crear la cita');
    }
  };

  const handleCancelarCita = async (id) => {
    try {
      await apiRequest(`/cliente/citas/${id}/cancelar`, { method: 'PUT' });
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo cancelar la cita');
    }
  };

  const abrirReprogramacion = (cita) => {
    setError('');
    setReprogramandoId(cita.id);
    setReprogramacionData({
      fecha: cita.fecha || '',
      hora: (cita.hora || '').slice(0, 5),
    });
  };

  const cancelarReprogramacion = () => {
    setReprogramandoId(null);
    setReprogramacionData({ fecha: '', hora: '' });
  };

  const handleReprogramarCita = async (id) => {
    try {
      if (!reprogramacionData.fecha || !reprogramacionData.hora) {
        setError('Debes elegir una nueva fecha y hora para reprogramar');
        return;
      }

      await apiRequest(`/cliente/citas/${id}/reprogramar`, {
        method: 'PUT',
        body: JSON.stringify({
          fecha: reprogramacionData.fecha,
          hora: reprogramacionData.hora,
        }),
      });

      cancelarReprogramacion();
      await loadData();
    } catch (err) {
      setError(err.message || 'No se pudo reprogramar la cita');
    }
  };

  return (
    <div className="cliente-page">
      <div className="page-header">
        <h1><FontAwesomeIcon icon={faCalendar} /> Mis Citas</h1>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancelar' : '➕ Agendar Nueva Cita'}
        </button>
      </div>

      {loading && <p>Cargando citas...</p>}
      {error && <div className="alert alert-error">{error}</div>}

      {isFormOpen && (
        <div className="form-container">
          <h2>Agendar Nueva Cita</h2>
          <form onSubmit={handleCrearCita}>
            <div className="form-group">
              <label>Profesional</label>
              <select
                value={formData.profesionalId}
                onChange={(e) => setFormData({ ...formData, profesionalId: e.target.value })}
                disabled={usarSeleccionMultiple}
              >
                <option value="">Asignación automática por servicio</option>
                {profesionales.map((prof) => (
                  <option key={prof.id} value={prof.id}>{prof.nombre}</option>
                ))}
              </select>
              <small>
                Si no seleccionas profesional, el sistema asigna uno o varios según especialidad por servicio.
              </small>
              {formData.profesionalId && formData.servicioIds.length > 0 && !profesionalesCompatiblesIds.has(Number(formData.profesionalId)) && (
                <small>
                  El profesional elegido no cubre todos los servicios; los faltantes se asignarán automáticamente.
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="selector-multiple-toggle">
                <input
                  type="checkbox"
                  checked={usarSeleccionMultiple}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUsarSeleccionMultiple(checked);
                    if (checked) {
                      setFormData((prev) => ({
                        ...prev,
                        profesionalId: '',
                      }));
                    } else {
                      setFormData((prev) => ({
                        ...prev,
                        profesionalesIds: [],
                      }));
                    }
                  }}
                />
                <span>Quiero escoger varios profesionales (opcional)</span>
              </label>

              {usarSeleccionMultiple && (
                <>
                  <div className="servicios-selector-grid">
                    {profesionales.map((profesional) => {
                      const selected = formData.profesionalesIds.includes(Number(profesional.id));

                      return (
                        <label
                          key={profesional.id}
                          className={`servicio-selector-item ${selected ? 'selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              setFormData((prev) => {
                                const id = Number(profesional.id);
                                const yaSeleccionado = prev.profesionalesIds.includes(id);

                                if (yaSeleccionado) {
                                  return {
                                    ...prev,
                                    profesionalesIds: prev.profesionalesIds.filter((pid) => pid !== id),
                                  };
                                }

                                return {
                                  ...prev,
                                  profesionalesIds: [...prev.profesionalesIds, id],
                                };
                              });
                            }}
                          />
                          <span>{profesional.nombre}</span>
                        </label>
                      );
                    })}
                  </div>
                  <small>
                    {formData.profesionalesIds.length} profesional(es) seleccionado(s). Si no cubren todos los servicios, la cita no se podrá crear.
                  </small>
                </>
              )}
            </div>
            <div className="form-group">
              <label>Servicios</label>
              <div className="servicios-selector-grid">
                {servicios.map((servicio) => {
                  const checked = formData.servicioIds.includes(servicio.id);
                  return (
                    <label
                      key={servicio.id}
                      className={`servicio-selector-item ${checked ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleServicio(servicio.id)}
                      />
                      <span>{servicio.nombre}</span>
                    </label>
                  );
                })}
              </div>
              <small>{formData.servicioIds.length} servicio(s) seleccionado(s)</small>
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Hora</label>
              <input type="time" value={formData.hora} onChange={(e) => setFormData({ ...formData, hora: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary">Agendar Cita</button>
          </form>
        </div>
      )}

      <div className="citas-container">
        {citas.length === 0 ? (
          <div className="empty-state">
            <p>No tienes citas agendadas</p>
          </div>
        ) : (
          <div className="citas-grid">
            {citas.map((cita) => (
              <div key={cita.id} className="cita-card">
                <div className="cita-header">
                  <h3>{(cita.Servicios || []).map((s) => s.nombre).join(', ') || 'Cita'}</h3>
                  <span className={`badge ${(cita.estado || '').toLowerCase() === 'confirmada' ? 'badge-success' : 'badge-warning'}`}>
                    {formatEstado(cita.estado)}
                  </span>
                </div>

                <div className="cita-info">
                  <p><strong>Profesional:</strong> {cita?.profesional?.nombre || 'Sin asignar'}</p>
                  <p><strong>Fecha:</strong> {cita.fecha}</p>
                  <p><strong>Hora:</strong> {cita.hora}</p>
                  <p><strong>Duración total:</strong> {Number(cita.duracionTotal || 0)} min</p>
                  <p><strong>Total:</strong> ${Number(cita.total || 0).toLocaleString()}</p>
                  <p><strong>Notas:</strong> {cita.notas || 'Sin notas'}</p>
                  {!!(cita.Servicios || []).length && (
                    <div className="cita-servicios-detalle">
                      <strong>Asignación por servicio:</strong>
                      <ul>
                        {(cita.Servicios || []).map((servicio) => {
                          const profesionalAsignadoId = Number(servicio?.CitaServicio?.profesionalId || 0);
                          const nombreProfesional = profesionalesPorId.get(profesionalAsignadoId)
                            || cita?.profesional?.nombre
                            || 'Sin asignar';

                          return (
                            <li key={`${cita.id}-${servicio.id}`}>
                              {servicio.nombre}: {nombreProfesional}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="cita-actions">
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => (reprogramandoId === cita.id ? cancelarReprogramacion() : abrirReprogramacion(cita))}
                  >
                    {reprogramandoId === cita.id ? 'Cerrar' : 'Reprogramar'}
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleCancelarCita(cita.id)}>Cancelar</button>
                </div>

                {reprogramandoId === cita.id && (
                  <div className="cita-reprogramar-box">
                    <div className="form-group">
                      <label>Nueva fecha</label>
                      <input
                        type="date"
                        value={reprogramacionData.fecha}
                        onChange={(e) => setReprogramacionData({ ...reprogramacionData, fecha: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Nueva hora</label>
                      <input
                        type="time"
                        value={reprogramacionData.hora}
                        onChange={(e) => setReprogramacionData({ ...reprogramacionData, hora: e.target.value })}
                        required
                      />
                    </div>
                    <div className="cita-reprogramar-actions">
                      <button className="btn btn-sm btn-primary" onClick={() => handleReprogramarCita(cita.id)}>
                        Guardar nueva fecha
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={cancelarReprogramacion}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

