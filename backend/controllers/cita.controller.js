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

const normalizarTexto = (texto = '') =>
  String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();


// ==========================================
// 📅 CREAR CITA - CLIENTE
// ==========================================

const crearCita = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();

  try {
    const { fecha, hora, servicios, profesionalId, profesionalesIds } = req.body;

    // VALIDACIÓN 0: fecha y hora obligatorias y en futuro
    if (!fecha || !hora) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe indicar fecha y hora para agendar la cita'
      });
    }

    const fechaHoraSeleccionada = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(fechaHoraSeleccionada.getTime())) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'La fecha u hora ingresada no es válida'
      });
    }

    const ahora = new Date();
    if (fechaHoraSeleccionada <= ahora) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede agendar una cita en una fecha u hora que ya pasó'
      });
    }

    // VALIDACIÓN 1: servicios obligatorios
    if (!servicios || servicios.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos un servicio'
      });
    }

    // VALIDACIÓN 2: obtener servicios
    const serviciosDB = await Servicio.findAll({
      where: { id: servicios, activo: true },
      include: [
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre']
        }
      ],
      transaction: t
    });

    if (serviciosDB.length !== servicios.length) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Uno o más servicios no son válidos'
      });
    }

    // 🔥 CALCULAR DURACIÓN Y TOTAL
    let duracionTotal = 0;
    let total = 0;

    for (const s of serviciosDB) {
      duracionTotal += s.duracion;
      total += parseFloat(s.precio);
    }

    const nombresRequeridos = Array.from(new Set(
      serviciosDB
        .map((s) => s?.subcategoria?.nombre)
        .filter(Boolean)
    ));

    const especialidadesActivas = await Especialidad.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre'],
      transaction: t
    });

    const especialidadesPorNombre = new Map(
      especialidadesActivas.map((esp) => [normalizarTexto(esp.nombre), esp])
    );

    const especialidadesRequeridas = [];
    const sinEspecialidadConfigurada = [];

    for (const nombre of nombresRequeridos) {
      const especialidad = especialidadesPorNombre.get(normalizarTexto(nombre));
      if (!especialidad) {
        sinEspecialidadConfigurada.push(nombre);
      } else {
        especialidadesRequeridas.push(especialidad);
      }
    }

    if (sinEspecialidadConfigurada.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Falta configurar especialidades para: ${sinEspecialidadConfigurada.join(', ')}`
      });
    }

    const idsEspecialidadesRequeridas = especialidadesRequeridas.map((esp) => esp.id);

    // 🔥 ASIGNACIÓN DE PROFESIONALES
    // Una cita puede incluir varios servicios y cada servicio puede quedar con profesional distinto.
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

    if (Array.isArray(profesionalesIds) && profesionalesIds.length > 0) {
      const idsUnicos = Array.from(new Set(profesionalesIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)));

      profesionalesPreferidos = idsUnicos
        .map((id) => profesionalesPorId.get(id))
        .filter(Boolean);

      if (profesionalesPreferidos.length !== idsUnicos.length) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Uno o más profesionales seleccionados no existen o están inactivos'
        });
      }
    }

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

    const serviciosAsignados = [];

    const profesionalTieneEspecialidad = (profesional, especialidadId) => {
      const idsEspecialidades = new Set((profesional.especialidades || []).map((esp) => esp.id));
      return idsEspecialidades.has(especialidadId);
    };

    for (const servicio of serviciosDB) {
      const nombreSubcategoria = servicio?.subcategoria?.nombre;
      const especialidad = especialidadPorNombreNormalizado.get(normalizarTexto(nombreSubcategoria));

      let profesionalParaServicio = null;

      if (profesionalesPreferidos.length > 0 && especialidad) {
        profesionalParaServicio = profesionalesPreferidos.find((p) => profesionalTieneEspecialidad(p, especialidad.id)) || null;
      }

      if (profesionalSeleccionado && especialidad && profesionalTieneEspecialidad(profesionalSeleccionado, especialidad.id)) {
        profesionalParaServicio = profesionalSeleccionado;
      } else if (especialidad) {
        // Si el cliente seleccionó una lista de profesionales, se respeta esa lista.
        if (!profesionalParaServicio) {
          const candidatos = profesionalesPreferidos.length > 0 ? profesionalesPreferidos : profesionalesDisponibles;
          profesionalParaServicio = candidatos.find((p) => profesionalTieneEspecialidad(p, especialidad.id)) || null;
        }
      }

      if (!profesionalParaServicio) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `No hay profesional disponible con la especialidad requerida para el servicio: ${servicio.nombre}`
        });
      }

      serviciosAsignados.push({
        servicio,
        profesionalId: profesionalParaServicio.id
      });
    }

    const profesionalesAsignadosIds = Array.from(new Set(serviciosAsignados.map((s) => s.profesionalId)));

    for (const profesionalAsignadoId of profesionalesAsignadosIds) {
      const citaExistente = await Cita.findOne({
        where: {
          profesionalId: profesionalAsignadoId,
          fecha,
          hora
        },
        transaction: t
      });

      if (citaExistente) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Uno de los profesionales asignados ya tiene una cita en ese horario'
        });
      }

      const detalleOcupado = await CitaServicio.findOne({
        where: { profesionalId: profesionalAsignadoId },
        include: [{
          model: Cita,
          where: { fecha, hora },
          attributes: ['id'],
          required: true
        }],
        transaction: t
      });

      if (detalleOcupado) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'Uno de los profesionales asignados ya tiene una cita en ese horario'
        });
      }
    }

    // ==========================================
    // CREAR CITA
    // ==========================================

    const cita = await Cita.create({
      usuarioId: req.usuario.id,
      profesionalId: profesionalSeleccionado ? profesionalSeleccionado.id : profesionalesAsignadosIds[0],
      fecha,
      hora,
      duracionTotal,
      total,
      estado: 'pendiente'
    }, { transaction: t });

    // ==========================================
    // CREAR DETALLES (CitaServicio)
    // ==========================================

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
      where: { usuarioId: req.usuario.id }, /////
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

    res.json({
      success: true,
      data: { citas }
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
  try {
    const { id } = req.params;
    const { fecha, hora } = req.body;

    if (!fecha || !hora) {
      return res.status(400).json({
        success: false,
        message: 'Debe indicar fecha y hora para reprogramar la cita'
      });
    }

    const fechaHoraSeleccionada = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(fechaHoraSeleccionada.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha u hora ingresada no es válida'
      });
    }

    const ahora = new Date();
    if (fechaHoraSeleccionada <= ahora) {
      return res.status(400).json({
        success: false,
        message: 'No se puede reprogramar una cita a una fecha u hora que ya pasó'
      });
    }

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

    if (!['pendiente', 'confirmada', 'cancelada'].includes(cita.estado)) {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden reprogramar citas pendientes, confirmadas o canceladas'
      });
    }

    const detalles = await CitaServicio.findAll({
      where: { citaId: cita.id },
      attributes: ['profesionalId']
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

    for (const profesionalId of profesionalesAsignados) {
      const citaExistente = await Cita.findOne({
        where: {
          profesionalId,
          fecha,
          hora,
          id: { [Op.ne]: cita.id }
        }
      });

      if (citaExistente) {
        return res.status(400).json({
          success: false,
          message: 'Uno de los profesionales asignados ya tiene una cita en ese horario'
        });
      }

      const detalleOcupado = await CitaServicio.findOne({
        where: { profesionalId },
        include: [{
          model: Cita,
          where: {
            fecha,
            hora,
            id: { [Op.ne]: cita.id }
          },
          attributes: ['id'],
          required: true
        }]
      });

      if (detalleOcupado) {
        return res.status(400).json({
          success: false,
          message: 'Uno de los profesionales asignados ya tiene una cita en ese horario'
        });
      }
    }

    cita.fecha = fecha;
    cita.hora = hora;
    if (cita.estado === 'cancelada') {
      cita.estado = 'pendiente';
    }
    await cita.save();

    res.json({
      success: true,
      message: 'Cita reprogramada exitosamente',
      data: { cita }
    });
  } catch (error) {
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
          as: 'cliente'
        },
        {
          model: Usuario,
          as: 'profesional'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { citas }
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
// 📅 CITAS DEL PROFESIONAL
// ==========================================

const getCitasProfesional = async (req, res) => {
  try {
    const rol = (req.usuario?.rol || '').toLowerCase().trim();
    const where = {};

    // Profesional: solo ve sus propias citas.
    if (rol === 'profesional') {
      where.profesionalId = req.usuario.id;
    }

    // Admin/Auxiliar: puede filtrar por profesionalId opcionalmente.
    if (['administrador', 'auxiliar'].includes(rol) && req.query.profesionalId) {
      where.profesionalId = req.query.profesionalId;
    }

    const citas = await Cita.findAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ],
      order: [['fecha', 'DESC']]
    });

    res.json({
      success: true,
      data: { citas }
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