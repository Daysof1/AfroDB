/**
 * ============================================
 * CONTROLADOR DE CITAS - VISTA PROFESIONAL
 * ============================================
 * Gestiona las citas desde la perspectiva del profesional.
 * El profesional puede ver sus citas y cambiar su estado.
 */

const Cita = require('../models/Cita');
const CitaServicio = require('../models/CitaServicio');
const Servicio = require('../models/Servicio');
const Usuario = require('../models/Usuario');

// ==========================================
// 📅 VER TODAS LAS CITAS DEL PROFESIONAL
// ==========================================
/**
 * GET /api/profesional/citas
 * Obtiene todas las citas del profesional autenticado
 * Filtro opcional: ?estado=pendiente|confirmada|completada|cancelada
 */
exports.getMisCitas = async (req, res) => {
  try {
    const { estado } = req.query;
    const profesionalId = req.usuario.id;

    // Construir objeto where con filtros
    const where = { profesionalId };
    if (estado) {
      where.estado = estado;
    }

    // Obtener citas del profesional
    const citas = await Cita.findAll({
      where,
      include: [
        {
          model: CitaServicio,
          include: [
            {
              model: Servicio,
              attributes: ['id', 'nombre', 'descripcion', 'precio', 'duracion']
            }
          ]
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'email', 'telefono']
        }
      ],
      order: [['fecha', 'ASC'], ['hora', 'ASC']]
    });

    res.json({
      success: true,
      message: 'Citas obtenidas correctamente',
      total: citas.length,
      data: citas
    });
  } catch (error) {
    console.error('Error al obtener citas del profesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
};

// ==========================================
// 📅 VER DETALLE DE UNA CITA
// ==========================================
/**
 * GET /api/profesional/citas/:id
 * Obtiene el detalle completo de una cita específica
 */
exports.getDetalleCita = async (req, res) => {
  try {
    const { id } = req.params;
    const profesionalId = req.usuario.id;

    const cita = await Cita.findOne({
      where: {
        id,
        profesionalId  // Verifica que la cita pertenezca al profesional
      },
      include: [
        {
          model: CitaServicio,
          include: [
            {
              model: Servicio,
              attributes: ['id', 'nombre', 'descripcion', 'precio', 'duracion']
            }
          ]
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'email', 'telefono', 'direccion']
        }
      ]
    });

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o no tienes permisos'
      });
    }

    res.json({
      success: true,
      message: 'Detalle de cita obtenido',
      data: cita
    });
  } catch (error) {
    console.error('Error al obtener detalle de cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener cita',
      error: error.message
    });
  }
};

// ==========================================
// 📅 ACTUALIZAR ESTADO DE LA CITA
// ==========================================
/**
 * PUT /api/profesional/citas/:id/estado
 * Actualiza el estado de una cita (confirmar, completar, cancelar)
 * Body: { estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' }
 */
exports.actualizarEstadoCita = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { estado } = req.body;
    const profesionalId = req.usuario.id;

    // Validar que el estado sea válido
    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
      });
    }

    // Obtener la cita
    const cita = await Cita.findOne({
      where: {
        id,
        profesionalId  // Verifica que sea del profesional autenticado
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

    // Validar transiciones de estado válidas
    const transicionesValidas = {
      'pendiente': ['confirmada', 'cancelada'],
      'confirmada': ['completada', 'cancelada'],
      'completada': [],  // No se puede cambiar desde completada
      'cancelada': []    // No se puede cambiar desde cancelada
    };

    if (!transicionesValidas[cita.estado].includes(estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar de '${cita.estado}' a '${estado}'`,
        estadoActual: cita.estado,
        transicionesPermitidas: transicionesValidas[cita.estado]
      });
    }

    // Actualizar estado
    cita.estado = estado;
    cita.fechaActualizacion = new Date();
    await cita.save({ transaction: t });

    await t.commit();

    // Obtener cita actualizada con detalles
    const citaActualizada = await Cita.findOne({
      where: { id },
      include: [
        {
          model: CitaServicio,
          include: [
            {
              model: Servicio,
              attributes: ['id', 'nombre', 'precio', 'duracion']
            }
          ]
        },
        {
          model: Usuario,
          attributes: ['id', 'nombre', 'email', 'telefono']
        }
      ]
    });

    res.json({
      success: true,
      message: `Estado de cita actualizado a ${estado}`,
      data: citaActualizada
    });
  } catch (error) {
    await t.rollback();
    console.error('Error al actualizar estado de cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de cita',
      error: error.message
    });
  }
};
