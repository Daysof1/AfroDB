/**
 * ============================================
 * CONTROLADOR DE SERVICIOS - VISTA PROFESIONAL
 * ============================================
 * Gestiona los servicios de un profesional.
 * El profesional puede ver, actualizar y cambiar estado de sus servicios.
 */

const Servicio = require('../models/Servicio');
const ProfesionalEspecialidad = require('../models/ProfesionalEspecialidad');
const Especialidad = require('../models/Especialidad');

// ==========================================
// 🎯 VER SERVICIOS DEL PROFESIONAL
// ==========================================
/**
 * GET /api/profesional/servicios
 * Obtiene todos los servicios que ofrece el profesional autenticado
 */
exports.getMisServicios = async (req, res) => {
  try {
    const profesionalId = req.usuario.id;

    // Obtener especialidades asociadas al profesional
    const especialidades = await ProfesionalEspecialidad.findAll({
      where: { profesionalId },
      include: [
        {
          model: Especialidad,
          attributes: ['id', 'nombre', 'descripcion']
        }
      ]
    });

    // Extraer IDs de especialidades
    const especialidadIds = especialidades.map(e => e.especialidadId);

    // Obtener servicios relacionados a esas especialidades
    const servicios = await Servicio.findAll({
      where: { 
        especialidadId: especialidadIds
      },
      include: [
        {
          model: Especialidad,
          attributes: ['id', 'nombre', 'descripcion']
        }
      ],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      message: 'Servicios obtenidos correctamente',
      total: servicios.length,
      data: servicios
    });
  } catch (error) {
    console.error('Error al obtener servicios del profesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

// ==========================================
// 🎯 VER DETALLE DE UN SERVICIO
// ==========================================
/**
 * GET /api/profesional/servicios/:id
 * Obtiene el detalle completo de un servicio específico
 */
exports.getDetalleServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const profesionalId = req.usuario.id;

    // Obtener el servicio
    const servicio = await Servicio.findByPk(id, {
      include: [
        {
          model: Especialidad,
          attributes: ['id', 'nombre', 'descripcion']
        }
      ]
    });

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Verificar que el profesional esté asociado a esta especialidad
    const especialidad = await ProfesionalEspecialidad.findOne({
      where: {
        profesionalId,
        especialidadId: servicio.especialidadId
      }
    });

    if (!especialidad) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a este servicio'
      });
    }

    res.json({
      success: true,
      message: 'Detalle del servicio obtenido',
      data: servicio
    });
  } catch (error) {
    console.error('Error al obtener detalle de servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicio',
      error: error.message
    });
  }
};

// ==========================================
// 🎯 ACTUALIZAR INFORMACIÓN DEL SERVICIO
// ==========================================
/**
 * PUT /api/profesional/servicios/:id/actualizar
 * Actualiza información del servicio (nombre, descripción, precio, duración)
 * Body: { nombre?, descripcion?, precio?, duracion? }
 */
exports.actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, duracion } = req.body;
    const profesionalId = req.usuario.id;

    // Obtener el servicio
    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Verificar que el profesional tenga acceso a este servicio
    const especialidad = await ProfesionalEspecialidad.findOne({
      where: {
        profesionalId,
        especialidadId: servicio.especialidadId
      }
    });

    if (!especialidad) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este servicio'
      });
    }

    // Validaciones
    if (nombre && typeof nombre !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'El nombre debe ser un texto'
      });
    }

    if (precio && (isNaN(precio) || parseFloat(precio) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número mayor a 0'
      });
    }

    if (duracion && (isNaN(duracion) || parseInt(duracion) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser un número mayor a 0'
      });
    }

    // Actualizar solo los campos enviados
    if (nombre) servicio.nombre = nombre;
    if (descripcion) servicio.descripcion = descripcion;
    if (precio) servicio.precio = precio;
    if (duracion) servicio.duracion = duracion;

    await servicio.save();

    // Obtener servicio actualizado con especialidad
    const servicioActualizado = await Servicio.findByPk(id, {
      include: [
        {
          model: Especialidad,
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Servicio actualizado correctamente',
      data: servicioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio',
      error: error.message
    });
  }
};

// ==========================================
// 🎯 ACTIVAR / DESACTIVAR SERVICIO
// ==========================================
/**
 * PUT /api/profesional/servicios/:id/estado
 * Activa o desactiva un servicio
 * Body: { activo: true | false }
 */
exports.actualizarEstadoServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const profesionalId = req.usuario.id;

    // Validar que activo sea un booleano
    if (typeof activo !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El campo "activo" debe ser un booleano (true o false)'
      });
    }

    // Obtener el servicio
    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    // Verificar que el profesional tenga acceso a este servicio
    const especialidad = await ProfesionalEspecialidad.findOne({
      where: {
        profesionalId,
        especialidadId: servicio.especialidadId
      }
    });

    if (!especialidad) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cambiar el estado de este servicio'
      });
    }

    // Actualizar estado
    servicio.activo = activo;
    await servicio.save();

    // Obtener servicio actualizado
    const servicioActualizado = await Servicio.findByPk(id, {
      include: [
        {
          model: Especialidad,
          attributes: ['id', 'nombre']
        }
      ]
    });

    res.json({
      success: true,
      message: `Servicio ${activo ? 'activado' : 'desactivado'} correctamente`,
      data: servicioActualizado
    });
  } catch (error) {
    console.error('Error al actualizar estado del servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del servicio',
      error: error.message
    });
  }
};
