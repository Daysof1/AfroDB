/**
 * ============================================
 * CONTROLLER CITA
 * ============================================
 * Maneja la lógica principal del sistema:
 * - creación de citas
 * - asignación de servicios
 * - cálculo de total y duración
 * - asignación de profesional
 */

const { Op } = require('sequelize');

const {
  Cita,
  Servicio,
  CitaServicio,
  Usuario
} = require('../models');


// ==========================================
// 📅 CREAR CITA
// ==========================================

exports.crearCita = async (req, res) => {
  try {
    const {
      usuarioId,
      servicios, // array de IDs
      fecha,
      hora,
      profesionalId // opcional
    } = req.body;

    // Validar usuario
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuario no existe' });
    }

    // 🔥 VALIDAR SERVICIOS
    const serviciosDB = await Servicio.findAll({
      where: {
        id: servicios,
        activo: true
      }
    });

    if (serviciosDB.length !== servicios.length) {
      return res.status(400).json({ msg: 'Uno o más servicios no son válidos' });
    }

    // 🔥 CALCULAR DURACIÓN TOTAL
    const duracionTotal = serviciosDB.reduce(
      (sum, s) => sum + s.duracion,
      0
    );

    // 🔥 ASIGNAR PROFESIONAL
    let profesionalAsignado = profesionalId;

    if (!profesionalAsignado) {
      const profesional = await Usuario.findOne({
        where: { rol: 'profesional' }
      });

      if (!profesional) {
        return res.status(400).json({ msg: 'No hay profesionales disponibles' });
      }

      profesionalAsignado = profesional.id;
    }

    // 🔥 VALIDAR DISPONIBILIDAD (básico)
    const citaExistente = await Cita.findOne({
      where: {
        profesionalId: profesionalAsignado,
        fecha,
        hora
      }
    });

    if (citaExistente) {
      return res.status(400).json({ msg: 'El profesional ya tiene una cita en ese horario' });
    }

    // ==========================================
    // CREAR CITA
    // ==========================================

    const nuevaCita = await Cita.create({
      usuarioId,
      profesionalId: profesionalAsignado,
      fecha,
      hora,
      duracionTotal,
      estado: 'pendiente'
    });

    // ==========================================
    // GUARDAR SERVICIOS (TABLA INTERMEDIA)
    // ==========================================

    for (const servicio of serviciosDB) {
      await CitaServicio.create({
        citaId: nuevaCita.id,
        servicioId: servicio.id
      });
    }

    res.status(201).json({
      msg: 'Cita creada correctamente',
      cita: nuevaCita
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Error al crear la cita' });
  }
};


// ==========================================
// 📄 LISTAR CITAS
// ==========================================

exports.listarCitas = async (req, res) => {
  try {

    const citas = await Cita.findAll({
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
          attributes: ['id', 'nombre', 'precio'],
          through: { attributes: [] }
        }
      ]
    });

    res.json(citas);

  } catch (error) {
    res.status(500).json({ msg: 'Error al listar citas' });
  }
};


// ==========================================
// 🔍 OBTENER CITA
// ==========================================

exports.obtenerCita = async (req, res) => {
  try {

    const { id } = req.params;

    const cita = await Cita.findByPk(id, {
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
          through: {
            attributes: ['precio', 'duracion', 'cantidad']
          }
        }
      ]
    });

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    res.json(cita);

  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener cita' });
  }
};


// ==========================================
// ❌ CANCELAR CITA
// ==========================================

exports.cancelarCita = async (req, res) => {
  try {

    const { id } = req.params;

    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    await cita.update({ estado: 'cancelada' });

    res.json({ msg: 'Cita cancelada correctamente' });

  } catch (error) {
    res.status(500).json({ msg: 'Error al cancelar cita' });
  }
};


// ==========================================
// 💸 CALCULAR TOTAL DE LA CITA
// ==========================================

exports.calcularTotalCita = async (req, res) => {
  try {

    const { id } = req.params;

    const detalles = await CitaServicio.findAll({
      where: { citaId: id }
    });

    const total = detalles.reduce(
      (sum, d) => sum + (parseFloat(d.precio) * d.cantidad),
      0
    );

    res.json({ total });

  } catch (error) {
    res.status(500).json({ msg: 'Error al calcular total' });
  }
};