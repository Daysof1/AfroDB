/**
 * ============================================
 * CONTROLADOR DE ESPECIALIDADES
 * ============================================
 * Gestiona el CRUD de especialidades.
 * 
 * Ejemplos:
 * - "Psicología"
 * - "Fisioterapia"
 * - "Nutrición"
 * 
 * Relación:
 * Especialidad ←→ Profesional (N:M)
 * 
 * Acceso:
 * - ADMIN: crear, actualizar, eliminar
 * - GENERAL: consultar
 */

const Especialidad = require('../models/Especialidades');
const Usuario = require('../models/Usuario'); 

/**
 * Obtener todas las especialidades
 * 
 * GET /api/especialidades
 */
const getEspecialidades = async (req, res) => {
  try {
    const especialidades = await Especialidad.findAll({
      where: { activo: true },
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      count: especialidades.length,
      data: { especialidades }
    });

  } catch (error) {
    console.error('Error en getEspecialidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidades',
      error: error.message
    });
  }
};

/**
 * Obtener especialidad por ID
 * 
 * GET /api/especialidades/:id
 */
const getEspecialidadById = async (req, res) => {
  try {
    const { id } = req.params;

    const especialidad = await Especialidad.findByPk(id, {
      include: [{
        model: Usuario,
        as: 'profesionales',
        where: { rol: 'profesional' },
        required: false,
        attributes: ['id', 'nombre'],
        through: { attributes: [] }
      }]
    });

    if (!especialidad) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    res.json({
      success: true,
      data: { especialidad }
    });

  } catch (error) {
    console.error('Error en getEspecialidadById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidad',
      error: error.message
    });
  }
};

/**
 * Crear especialidad (ADMIN)
 * 
 * POST /api/admin/especialidades
 * Body: { nombre, descripcion }
 */
const crearEspecialidad = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }

    const existe = await Especialidad.findOne({
      where: { nombre }
    });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: `Ya existe la especialidad "${nombre}"`
      });
    }

    const nuevaEspecialidad = await Especialidad.create({
      nombre,
      descripcion: descripcion || null,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Especialidad creada',
      data: { especialidad: nuevaEspecialidad }
    });

  } catch (error) {
    console.error('Error en crearEspecialidad:', error);

    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map(e => e.message)
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear especialidad',
      error: error.message
    });
  }
};

/**
 * Actualizar especialidad (ADMIN)
 * 
 * PUT /api/admin/especialidades/:id
 */
const actualizarEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;

    const especialidad = await Especialidad.findByPk(id);

    if (!especialidad) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    // Validar nombre único
    if (nombre && nombre !== especialidad.nombre) {
      const existe = await Especialidad.findOne({ where: { nombre } });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: `Ya existe la especialidad "${nombre}"`
        });
      }
    }

    if (nombre !== undefined) especialidad.nombre = nombre;
    if (descripcion !== undefined) especialidad.descripcion = descripcion;
    if (activo !== undefined) especialidad.activo = activo;

    await especialidad.save();

    res.json({
      success: true,
      message: 'Especialidad actualizada',
      data: { especialidad }
    });

  } catch (error) {
    console.error('Error en actualizarEspecialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar especialidad',
      error: error.message
    });
  }
};

/**
 * Activar / Desactivar especialidad (ADMIN)
 * 
 * PATCH /api/admin/especialidades/:id/toggle
 */
const toggleEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;

    const especialidad = await Especialidad.findByPk(id);

    if (!especialidad) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    especialidad.activo = !especialidad.activo;
    await especialidad.save();

    res.json({
      success: true,
      message: `Especialidad ${especialidad.activo ? 'activada' : 'desactivada'}`,
      data: { especialidad }
    });

  } catch (error) {
    console.error('Error en toggleEspecialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};

/**
 * Eliminar especialidad (ADMIN)
 * 
 * DELETE /api/admin/especialidades/:id
 */
const eliminarEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;

    const especialidad = await Especialidad.findByPk(id);

    if (!especialidad) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    // Verificar si tiene profesionales asociados
    const profesionales = await especialidad.countProfesionales();

    if (profesionales > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar porque tiene profesionales asociados',
        sugerencia: 'Usa toggle en lugar de eliminar'
      });
    }

    await especialidad.destroy();

    res.json({
      success: true,
      message: 'Especialidad eliminada'
    });

  } catch (error) {
    console.error('Error en eliminarEspecialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar especialidad',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de especialidad (ADMIN)
 * 
 * GET /api/admin/especialidades/:id/stats
 */
const getEstadisticasEspecialidad = async (req, res) => {
  try {
    const { id } = req.params;

    const especialidad = await Especialidad.findByPk(id);

    if (!especialidad) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    const totalProfesionales = await especialidad.countProfesionales();

    res.json({
      success: true,
      data: {
        especialidad: {
          id: especialidad.id,
          nombre: especialidad.nombre,
          activo: especialidad.activo
        },
        estadisticas: {
          totalProfesionales
        }
      }
    });

  } catch (error) {
    console.error('Error en getEstadisticasEspecialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  getEspecialidades,
  getEspecialidadById,
  crearEspecialidad,
  actualizarEspecialidad,
  toggleEspecialidad,
  eliminarEspecialidad,
  getEstadisticasEspecialidad
};