/**
 * ============================================
 * CONTROLADOR DE CITAS
 * ============================================
 * Gestiona el agendamiento de citas.
 * Funciones de CLIENTE: crear cita, ver mis citas, cancelar.
 * Funciones de ADMIN: ver todas, cambiar estado, estadísticas.
 */

const Cita = require('../models/Cita');
const Servicio = require('../models/Servicio');
const CitaServicio = require('../models/CitaServicio');
const Usuario = require('../models/Usuario');
const Subcategoria = require('../models/Subcategoria');
const Especialidad = require('../models/Especialidades');
const { Op } = require('sequelize');

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

const normalizarTexto = (texto = '') =>
  String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const validarFechaHoraCita = (fecha, hora) => {
  if (!fecha || !hora) {
    return { valid: false, message: 'Debe indicar fecha y hora para agendar la cita' };
  }

  const fechaHoraSeleccionada = new Date(`${fecha}T${hora}`);
  if (Number.isNaN(fechaHoraSeleccionada.getTime())) {
    return { valid: false, message: 'La fecha u hora ingresada no es válida' };
  }

  const ahora = new Date();
  if (fechaHoraSeleccionada <= ahora) {
    return { valid: false, message: 'No se puede agendar una cita en una fecha u hora que ya pasó' };
  }

  const añoActual = ahora.getFullYear();
  const fechaSeleccionada = new Date(fecha);
  if (fechaSeleccionada.getFullYear() !== añoActual) {
    return { valid: false, message: `La cita debe agendarse en el año actual (${añoActual})` };
  }

  const [horaNum, minutoNum] = hora.split(':').map(Number);
  if (horaNum < 8 || horaNum > 20 || (horaNum === 20 && minutoNum > 0)) {
    return { valid: false, message: 'Las citas solo se pueden agendar entre las 08:00 a.m. y las 08:00 p.m.' };
  }

  return { valid: true, fechaHoraSeleccionada };
};

const validarServicios = async (servicios, transaction) => {
  if (!servicios || servicios.length === 0) {
    return { valid: false, message: 'Debe seleccionar al menos un servicio' };
  }

  const serviciosDB = await Servicio.findAll({
    where: { id: servicios, activo: true },
    include: [{ model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] }],
    transaction
  });

  if (serviciosDB.length !== servicios.length) {
    return { valid: false, message: 'Uno o más servicios no son válidos' };
  }

  return { valid: true, serviciosDB };
};

const calcularDuracionYTotal = (serviciosDB) => {
  let duracionTotal = 0;
  let total = 0;
  for (const s of serviciosDB) {
    duracionTotal += s.duracion;
    total += Number.parseFloat(s.precio);
  }
  return { duracionTotal, total };
};

const validarHorarioFin = (fecha, hora, duracionTotal) => {
  const inicioCita = new Date(`${fecha}T${hora}`);
  const finCita = new Date(inicioCita);
  finCita.setMinutes(finCita.getMinutes() + duracionTotal);

  const horaFin = finCita.getHours();
  const minutoFin = finCita.getMinutes();

  if (horaFin > 20 || (horaFin === 20 && minutoFin > 0)) {
    return { valid: false, message: 'La cita finaliza fuera del horario permitido (8:00 p.m.)' };
  }
  return { valid: true, inicioCita, finCita };
};

const verificarDisponibilidadProfesional = async (profesionalesIds, fecha, inicioNueva, finNueva, transaction, citaId = null) => {
  for (const profesionalId of profesionalesIds) {
    const detallesProfesional = await CitaServicio.findAll({
      where: { profesionalId: profesionalId },
      attributes: ['citaId'],
      transaction
    });

    const citaIds = detallesProfesional.map((detalle) => detalle.citaId);
    if (citaIds.length === 0) continue;

    const whereClause = {
      id: citaIds,
      fecha: fecha,
      estado: { [Op.in]: ['confirmada'] }
    };

    if (citaId) {
      whereClause.id = { [Op.ne]: citaId };
    }

    const citasExistentes = await Cita.findAll({
      where: whereClause,
      attributes: ['hora', 'duracionTotal'],
      transaction
    });

    for (const citaExistente of citasExistentes) {
      const inicioExistente = new Date(`${fecha}T${citaExistente.hora}`);
      const finExistente = new Date(inicioExistente);
      finExistente.setMinutes(finExistente.getMinutes() + citaExistente.duracionTotal);

      const hayCruce = inicioNueva < finExistente && finNueva > inicioExistente;
      if (hayCruce) {
        return { valid: false, message: 'Uno de los profesionales asignados ya tiene una cita en ese horario' };
      }
    }
  }
  return { valid: true };
};

// ==========================================
// 📅 CREAR CITA - CLIENTE
// ==========================================

const crearCita = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();

  try {
    const { fecha, hora, servicios, profesionalId, profesionalesIds, notas } = req.body;

    // VALIDACIÓN DE FECHA Y HORA
    const fechaValid = validarFechaHoraCita(fecha, hora);
    if (!fechaValid.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: fechaValid.message });
    }

    // VALIDACIÓN DE SERVICIOS
    const serviciosValid = await validarServicios(servicios, t);
    if (!serviciosValid.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: serviciosValid.message });
    }

    const { serviciosDB } = serviciosValid;

    // CALCULAR DURACIÓN Y TOTAL
    const { duracionTotal, total } = calcularDuracionYTotal(serviciosDB);

    // VALIDACIÓN DE HORA DE FINALIZACIÓN
    const horarioValid = validarHorarioFin(fecha, hora, duracionTotal);
    if (!horarioValid.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: horarioValid.message });
    }

    // OBTENER ESPECIALIDADES REQUERIDAS
    const especialidadesResult = await obtenerEspecialidadesRequeridas(serviciosDB, t);
    if (!especialidadesResult.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: especialidadesResult.message });
    }

    const especialidadesRequeridas = especialidadesResult.especialidadesRequeridas;

    // ASIGNACIÓN DE PROFESIONALES
    const profesionalesDisponibles = await Usuario.findAll({
      where: { rol: 'profesional', activo: true },
      include: [{
        model: Especialidad,
        as: 'especialidades',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
        required: false
      }],
      transaction: t
    });

    const profesionalesPorId = new Map(
      profesionalesDisponibles.map((p) => [p.id, p])
    );

    const especialidadPorNombreNormalizado = new Map(
      especialidadesRequeridas.map((esp) => [normalizarTexto(esp.nombre), esp])
    );

    let profesionalSeleccionado = null;
    let profesionalesPreferidos = [];

    if (profesionalId) {
      profesionalSeleccionado = profesionalesPorId.get(Number(profesionalId)) || null;
      if (!profesionalSeleccionado) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado o inactivo'
        });
      }
    }

    const preferidosResult = await obtenerProfesionalesPreferidos(profesionalesIds, profesionalesPorId, t);
    if (!preferidosResult.valid) {
      await t.rollback();
      return res.status(404).json({ success: false, message: preferidosResult.message });
    }
    profesionalesPreferidos = preferidosResult.profesionalesPreferidos;

    // ASIGNAR PROFESIONALES A SERVICIOS
    const asignacionResult = await asignarProfesionalesAServicios(
      serviciosDB,
      especialidadPorNombreNormalizado,
      profesionalSeleccionado,
      profesionalesPreferidos,
      profesionalesDisponibles,
      t
    );
    if (!asignacionResult.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: asignacionResult.message });
    }

    const serviciosAsignados = asignacionResult.serviciosAsignados;
    const profesionalesAsignadosIds = Array.from(new Set(serviciosAsignados.map((s) => s.profesionalId)));

    const { inicioCita: inicioNueva, finCita: finNueva } = horarioValid;

    // VERIFICAR DISPONIBILIDAD DE PROFESIONALES
    const disponibilidad = await verificarDisponibilidadProfesional(
      profesionalesAsignadosIds,
      fecha,
      inicioNueva,
      finNueva,
      t
    );
    if (!disponibilidad.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: disponibilidad.message });
    }

    // CREAR CITA
    const cita = await Cita.create({
      usuarioId: req.usuario.id,
      profesionalId: profesionalSeleccionado ? profesionalSeleccionado.id : profesionalesAsignadosIds[0],
      fecha,
      hora,
      duracionTotal,
      total,
      estado: 'pendiente',
      notas: typeof notas === 'string' ? notas.trim() : (notas || null)
    }, { transaction: t });

    // CREAR DETALLES (CitaServicio)
    for (const asignacion of serviciosAsignados) {
      const s = asignacion.servicio;
      await CitaServicio.create({
        citaId: cita.id,
        servicioId: s.id,
        profesionalId: asignacion.profesionalId,
        precio: s.precio,
        duracion: s.duracion,
        cantidad: 1
      }, { transaction: t });
    }

    await t.commit();

    await cita.reload({
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre']
        },
        {
          model: Usuario,
          as: 'profesional',
          attributes: ['id', 'nombre']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: { cita }
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en crearCita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cita',
      error: error.message
    });
  }
};

// ==========================================
// 📄 MIS CITAS - CLIENTE
// ==========================================

const getMisCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll({
      where: { usuarioId: req.usuario.id },
      include: [
        {
          model: Usuario,
          as: 'profesional',
          attributes: ['id', 'nombre']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ],
      order: [['fecha', 'DESC']]
    });

    const citasConServiciosCompletos = citas.map(cita => {
      const servicios = cita.Servicios.map(servicio => {
        return {
          ...servicio.toJSON(),
          UsuarioId: cita.usuarioId,
          profesionalId: servicio.CitaServicio.profesionalId
        };
      });
      return {
        ...cita.toJSON(),
        Servicios: servicios
      };
    });

    res.json({
      success: true,
      data: { citas: citasConServiciosCompletos }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
};

// ==========================================
// 🔍 OBTENER CITA
// ==========================================

const getCitaById = async (req, res) => {
  try {
    const { id } = req.params;

    const where = { id };

    if (req.usuario.rol !== 'administrador') {
      where.usuarioId = req.usuario.id;
    }

    const cita = await Cita.findOne({
      where,
      include: [
        {
          model: Usuario,
          as: 'cliente'
        },
        {
          model: Usuario,
          as: 'profesional'
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ]
    });

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      data: { cita }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cita',
      error: error.message
    });
  }
};

// ==========================================
// ❌ CANCELAR CITA - CLIENTE
// ==========================================

const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const cita = await Cita.findOne({
      where: {
        id,
        usuarioId: req.usuario.id
      }
    });

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (cita.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden cancelar citas pendientes'
      });
    }

    cita.estado = 'cancelada';
    await cita.save();

    res.json({
      success: true,
      message: 'Cita cancelada'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cancelar cita',
      error: error.message
    });
  }
};

// ==========================================
// 🔁 REPROGRAMAR CITA - CLIENTE
// ==========================================

const reprogramarCita = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { fecha, hora } = req.body;

    // VALIDACIÓN DE FECHA Y HORA
    const fechaValid = validarFechaHoraCita(fecha, hora);
    if (!fechaValid.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: fechaValid.message });
    }

    const cita = await Cita.findOne({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      transaction: t
    });

    if (!cita) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (!['pendiente', 'confirmada', 'cancelada'].includes(cita.estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden reprogramar citas pendientes, confirmadas o canceladas'
      });
    }

    const detalles = await CitaServicio.findAll({
      where: { citaId: cita.id },
      attributes: ['profesionalId'],
      transaction: t
    });

    const profesionalesAsignados = new Set();
    if (cita.profesionalId) {
      profesionalesAsignados.add(Number(cita.profesionalId));
    }

    for (const detalle of detalles) {
      if (detalle.profesionalId) {
        profesionalesAsignados.add(Number(detalle.profesionalId));
      }
    }

    // VALIDACIÓN DE HORA DE FINALIZACIÓN
    const horarioValid = validarHorarioFin(fecha, hora, cita.duracionTotal);
    if (!horarioValid.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: horarioValid.message });
    }

    const { inicioCita: inicioNueva, finCita: finNueva } = horarioValid;

    // VERIFICAR DISPONIBILIDAD DE PROFESIONALES
    const disponibilidad = await verificarDisponibilidadProfesional(
      Array.from(profesionalesAsignados),
      fecha,
      inicioNueva,
      finNueva,
      t,
      cita.id
    );
    if (!disponibilidad.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: disponibilidad.message });
    }

    cita.fecha = fecha;
    cita.hora = hora;
    if (cita.estado === 'cancelada') {
      cita.estado = 'pendiente';
    }
    await cita.save({ transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Cita reprogramada exitosamente',
      data: { cita }
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      success: false,
      message: 'Error al reprogramar cita',
      error: error.message
    });
  }
};

// ==========================================
// 📊 TODAS LAS CITAS - ADMIN
// ==========================================

const getAllCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll({
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: Usuario,
          as: 'profesional',
          attributes: ['id', 'nombre']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const citasConServicios = citas.map((cita) => {
      const servicios = (cita.Servicios || []).map((servicio) => ({
        ...servicio.toJSON(),
        UsuarioId: cita.usuarioId,
        profesionalId: servicio.CitaServicio?.profesionalId ?? cita.profesionalId
      }));

      return {
        ...cita.toJSON(),
        Servicios: servicios
      };
    });

    res.json({
      success: true,
      data: { citas: citasConServicios }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
};

// ==========================================
// 🔄 CAMBIAR ESTADO - ADMIN
// ==========================================

const actualizarEstadoCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido: ${estadosValidos.join(', ')}`
      });
    }

    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    cita.estado = estado;
    await cita.save();

    res.json({
      success: true,
      message: 'Estado actualizado',
      data: { cita }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// ==========================================
// 🗓️ CITAS DEL PROFESIONAL
// ==========================================

const getCitasProfesional = async (req, res) => {
  try {
    const citas = await Cita.findAll({
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Servicio,
          through: { attributes: ['profesionalId', 'precio', 'duracion'] },
          required: true
        },
        {
          model: CitaServicio,
          where: { profesionalId: req.usuario.id },
          attributes: [],
          required: true
        }
      ],
      order: [['fecha', 'DESC'], ['hora', 'DESC']],
      distinct: true
    });

    const citasTransformadas = citas.map(cita => {
      const serviciosTransformados = cita.Servicios.map(servicio => {
        const profesionalIdDelServicio = servicio.CitaServicio.profesionalId;

        return {
          ...servicio.toJSON(),
          UsuarioId: cita.usuarioId,
          profesionalId: profesionalIdDelServicio
        };
      });

      return {
        ...cita.toJSON(),
        Servicios: serviciosTransformados
      };
    });

    res.json({
      success: true,
      data: { citas: citasTransformadas }
    });

  } catch (error) {
    console.error('Error al obtener las citas del profesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas del profesional',
      error: error.message
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // CLIENTE
  crearCita,
  getMisCitas,
  getCitaById,
  cancelarCita,
  reprogramarCita,

  // ADMIN
  getAllCitas,
  actualizarEstadoCita,
  getCitasProfesional
};