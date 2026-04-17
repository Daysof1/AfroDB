/**
 * ============================================
 * CONTROLADOR DE PROFESIONALES
 * ============================================
 * Gestiona profesionales (usuarios con rol 'profesional')
 * y sus especialidades.
 * 
 * Funciones:
 * - ADMIN: ver todos, asignar especialidades
 * - PROFESIONAL: ver y actualizar su perfil
 */

const Usuario = require('../models/Usuario');
const Especialidad = require('../models/Especialidades');
const ProfesionalEspecialidad = require('../models/ProfesionalEspecialidad');
const Servicio = require('../models/Servicio');

/**
 * Obtener todos los profesionales (ADMIN)
 * 
 * GET /api/admin/profesionales
 */
const getProfesionales = async (req, res) => {
  try {
    const { activo } = req.query;
    const where = { rol: 'profesional' };
    if (activo !== undefined) {
      where.activo = activo === 'true';
    }

    const profesionales = await Usuario.findAll({
      where,
      include: [{
        model: Especialidad,
        as: 'especialidades',
        attributes: ['id', 'nombre'],
        through: { attributes: [] }, // Oculta tabla intermedia
        required: false
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: profesionales.length,
      data: { profesionales }
    });

  } catch (error) {
    console.error('Error en getProfesionales:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesionales',
      error: error.message
    });
  }
};

/**
 * Obtener un profesional por ID
 * 
 * GET /api/profesionales/:id
 */
const getProfesionalById = async (req, res) => {
  try {
    const { id } = req.params;

    const profesional = await Usuario.findOne({
      where: { id, rol: 'profesional', activo: true },
      include: [{
        model: Especialidad,
        as: 'especialidades',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
        required: false
      }]
    });

    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    res.json({
      success: true,
      data: { profesional }
    });

  } catch (error) {
    console.error('Error en getProfesionalById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener profesional',
      error: error.message
    });
  }
};

/**
 * Obtener mi perfil como profesional
 * 
 * GET /api/profesional/perfil
 */
const getMiPerfilProfesional = async (req, res) => {
  try {
    const profesional = await Usuario.findByPk(req.usuario.id, {
      include: [{
        model: Especialidad,
        as: 'especialidades',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
        required: false
      }]
    });

    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    res.json({
      success: true,
      data: { profesional }
    });

  } catch (error) {
    console.error('Error en getMiPerfilProfesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

const getMisEspecialidades = async (req, res) => {
  try {
    const profesional = await Usuario.findByPk(req.usuario.id, {
      include: [{
        model: Especialidad,
        as: 'especialidades',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
        required: false
      }]
    });

    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    res.json({
      success: true,
      data: { especialidades: profesional.especialidades }
    });

  } catch (error) {
    console.error('Error en getMisEspecialidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidades',
      error: error.message
    });
  }
};

const agregarEspecialidad = async (req, res) => {
  try {
    const { especialidadId } = req.body;

    if (!especialidadId) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar el id de la especialidad'
      });
    }

    const profesional = await Usuario.findByPk(req.usuario.id);
    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const especialidad = await Especialidad.findByPk(especialidadId);
    if (!especialidad) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    const already = await ProfesionalEspecialidad.findOne({
      where: {
        usuarioId: profesional.id,
        especialidadId
      }
    });

    if (already) {
      return res.status(400).json({
        success: false,
        message: 'Especialidad ya asignada'
      });
    }

    await profesional.addEspecialidades(especialidad);

    res.json({
      success: true,
      message: 'Especialidad agregada correctamente'
    });

  } catch (error) {
    console.error('Error en agregarEspecialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar especialidad',
      error: error.message
    });
  }
};

const removerEspecialidad = async (req, res) => {
  try {
    const { especialidadId } = req.params;

    if (!especialidadId) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar el id de la especialidad'
      });
    }

    const profesional = await Usuario.findByPk(req.usuario.id);
    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    await profesional.removeEspecialidades(especialidadId);

    res.json({
      success: true,
      message: 'Especialidad removida correctamente'
    });

  } catch (error) {
    console.error('Error en removerEspecialidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al remover especialidad',
      error: error.message
    });
  }
};

/**
 * Asignar especialidades a un profesional (ADMIN)
 * 
 * POST /api/admin/profesionales/:id/especialidades
 * Body: { especialidadesIds: [1,2,3] }
 */
const asignarEspecialidades = async (req, res) => {
  try {
    const { id } = req.params;
    const { especialidadesIds } = req.body;

    // Validación
    if (!Array.isArray(especialidadesIds) || especialidadesIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe enviar un array de especialidades'
      });
    }

    const profesional = await Usuario.findByPk(id);

    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    // Verificar que existan las especialidades
    const especialidades = await Especialidad.findAll({
      where: { id: especialidadesIds }
    });

    if (especialidades.length !== especialidadesIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Una o más especialidades no existen'
      });
    }

    // Asignación (reemplaza todas)
    await profesional.setEspecialidades(especialidadesIds);

    res.json({
      success: true,
      message: 'Especialidades asignadas correctamente'
    });

  } catch (error) {
    console.error('Error en asignarEspecialidades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al asignar especialidades',
      error: error.message
    });
  }
};

/**
 * Actualizar perfil profesional
 * 
 * PUT /api/profesional/perfil
 */
const actualizarMiPerfil = async (req, res) => {
  try {
    const { nombre, telefono, tipo_documento, documento, email, direccion } = req.body;

    const profesional = await Usuario.findByPk(req.usuario.id);

    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    if(tipo_documento !== undefined) profesional.tipo_documento = tipo_documento;
    if(documento !== undefined) profesional.documento = documento;
    if (nombre !== undefined) profesional.nombre = nombre;
    if (telefono !== undefined) profesional.telefono = telefono;
    if (email !== undefined) profesional.email = email;
    if (direccion !== undefined) profesional.direccion = direccion;

    await profesional.save();

    res.json({
      success: true,
      message: 'Perfil actualizado',
      data: { profesional }
    });

  } catch (error) {
    console.error('Error en actualizarMiPerfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

/**
 * Eliminar especialidad de un profesional (ADMIN)
 * 
 * DELETE /api/admin/profesionales/:id/especialidades/:especialidadId
 */
const eliminarEspecialidad = async (req, res) => {
  try {
    const { id, especialidadId } = req.params;

    const profesional = await Usuario.findByPk(id);

    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    await ProfesionalEspecialidad.destroy({
      where: {
        usuarioId: id,
        especialidadId
      }
    });

    res.json({
      success: true,
      message: 'Especialidad eliminada del profesional'
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
 * Actualizar profesional (ADMIN)
 * 
 * PUT /api/admin/profesionales/:id
 */
const actualizarProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento, documento, nombre, apellido, email, telefono, direccion, activo } = req.body;

    const profesional = await Usuario.findByPk(id);

    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    if (tipo_documento !== undefined) profesional.tipo_documento = tipo_documento;
    if (documento !== undefined) profesional.documento = documento;
    if (nombre !== undefined) profesional.nombre = nombre;
    if (apellido !== undefined) profesional.apellido = apellido;
    if (email !== undefined) profesional.email = email;
    if (telefono !== undefined) profesional.telefono = telefono;
    if (direccion !== undefined) profesional.direccion = direccion;
    if (activo !== undefined) profesional.activo = activo;

    await profesional.save();

    res.json({
      success: true,
      message: 'Profesional actualizado correctamente',
      data: { profesional }
    });

  } catch (error) {
    console.error('Error en actualizarProfesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar profesional',
      error: error.message
    });
  }
};

/**
 * Eliminar profesional (ADMIN)
 * 
 * DELETE /api/admin/profesionales/:id
 */
const eliminarProfesional = async (req, res) => {
  try {
    const { id } = req.params;

    const profesional = await Usuario.findByPk(id);

    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(404).json({
        success: false,
        message: 'Profesional no encontrado'
      });
    }

    // Si el profesional tiene servicios asignados, no puede eliminarse por restricción FK.
    const serviciosAsignados = await Servicio.count({
      where: { profesionalId: id }
    });

    if (serviciosAsignados > 0) {
      return res.status(409).json({
        success: false,
        message: 'No se puede eliminar el profesional porque tiene servicios asignados. Reasigna o elimina esos servicios primero.',
        data: { serviciosAsignados }
      });
    }

    // Eliminar especialidades asociadas
    await ProfesionalEspecialidad.destroy({
      where: { usuarioId: id }
    });

    // Eliminar el profesional
    await profesional.destroy();

    res.json({
      success: true,
      message: 'Profesional eliminado correctamente'
    });

  } catch (error) {
    console.error('Error en eliminarProfesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar profesional',
      error: error.message
    });
  }
};

module.exports = {
  getProfesionales,
  getProfesionalById,
  getMiPerfilProfesional,
  getMisEspecialidades,
  agregarEspecialidad,
  removerEspecialidad,
  asignarEspecialidades,
  actualizarMiPerfil,
  eliminarEspecialidad,
  actualizarProfesional,
  eliminarProfesional
};