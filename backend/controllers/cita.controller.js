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


// ==========================================
// 📅 CREAR CITA - CLIENTE
// ==========================================

const crearCita = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();

  try {
    const { fecha, hora, servicios, profesionalId } = req.body;

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

    // 🔥 ASIGNAR PROFESIONAL
    let profesionalAsignado = profesionalId;

    if (!profesionalAsignado) {
      const profesional = await Usuario.findOne({
        where: { rol: 'profesional' },
        transaction: t
      });

      if (!profesional) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: 'No hay profesionales disponibles'
        });
      }

      profesionalAsignado = profesional.id;
    }

    // VALIDAR DISPONIBILIDAD
    const citaExistente = await Cita.findOne({
      where: {
        profesionalId: profesionalAsignado,
        fecha,
        hora
      },
      transaction: t
    });

    if (citaExistente) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El profesional ya tiene una cita en ese horario'
      });
    }

    // ==========================================
    // CREAR CITA
    // ==========================================

    const cita = await Cita.create({
      usuarioId: req.usuario.id,
      profesionalId: profesionalAsignado,
      fecha,
      hora,
      duracionTotal,
      total,
      estado: 'pendiente'
    }, { transaction: t });

    // ==========================================
    // CREAR DETALLES (CitaServicio)
    // ==========================================

    for (const s of serviciosDB) {
      await CitaServicio.create({
        citaId: cita.id,
        servicioId: s.id,
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
          through: { attributes: ['precio', 'duracion'] }
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
          through: { attributes: ['precio', 'duracion'] }
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
          through: { attributes: ['precio', 'duracion'] }
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
    const citas = await Cita.findAll({
      where: { profesionalId: req.usuario.id },
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion'] }
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

  // ADMIN
  getAllCitas,
  actualizarEstadoCita,
  getCitasProfesional
};