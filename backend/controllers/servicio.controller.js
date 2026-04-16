/**
 * ============================================
 * CONTROLADOR DE SERVICIOS
 * ============================================
 * Gestiona la creación, consulta, actualización y estado de servicios.
 * Los servicios son usados para agendar citas con profesionales.
 * 
 * - ADMIN: CRUD completo
 * - CLIENTE: ver servicios disponibles
 */

const Servicio = require('../models/Servicio');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Usuario = require('../models/Usuario'); // profesional
const { deleteFile } = require('../config/multer');

/**
 * ============================================
 * OBTENER SERVICIOS (PUBLICO / CLIENTE)
 * ============================================
 * GET /api/servicios
 * Query: ?categoriaId=&subcategoriaId=&profesionalId=&activo=true
 */
const getServicios = async (req, res) => {
  try {
    const { categoriaId, subcategoriaId, profesionalId, activo } = req.query;

    const where = {};

    if (categoriaId) where.categoriaId = categoriaId;
    if (subcategoriaId) where.subcategoriaId = subcategoriaId;
    if (profesionalId) where.profesionalId = profesionalId;
    if (activo !== undefined) where.activo = activo === 'true';

    const servicios = await Servicio.findAll({
      where,
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Usuario,
          as: 'profesional',
          attributes: ['id', 'nombre', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: servicios.length,
      data: { servicios }
    });

  } catch (error) {
    console.error('Error en getServicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

/**
 * ============================================
 * OBTENER SERVICIO POR ID
 * ============================================
 * GET /api/servicios/:id
 */
const getServicioById = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Subcategoria, as: 'subcategoria' },
        { model: Usuario, as: 'profesional', attributes: ['id', 'nombre', 'email'] }
      ]
    });

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: { servicio }
    });

  } catch (error) {
    console.error('Error en getServicioById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicio',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CREAR SERVICIO (ADMIN o PROFESIONAL)
 * ============================================
 * POST /api/servicios
 */
const crearServicio = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio,
      duracion,
      categoriaId,
      subcategoriaId,
      profesionalId
    } = req.body;
    const imagen = req.file ? req.file.filename : null;

    // VALIDACIONES
    if (!nombre || !precio || !duracion || !categoriaId || !subcategoriaId || !profesionalId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser enviados'
      });
    }

    // Validar profesional
    const profesional = await Usuario.findByPk(profesionalId);
    if (!profesional || profesional.rol !== 'profesional') {
      return res.status(400).json({
        success: false,
        message: 'El usuario no es un profesional válido'
      });
    }

    const servicio = await Servicio.create({
      nombre,
      descripcion,
      precio,
      duracion,
      categoriaId,
      subcategoriaId,
      profesionalId,
      imagen,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: { servicio }
    });

  } catch (error) {
    console.error('Error en crearServicio:', error);
    if (req.file) {
      deleteFile(req.file.filename);
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear servicio',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ACTUALIZAR SERVICIO
 * ============================================
 * PUT /api/servicios/:id
 */
const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    const campos = [
      'nombre',
      'descripcion',
      'precio',
      'duracion',
      'categoriaId',
      'subcategoriaId',
      'activo'
    ];

    if (req.file) {
      if (servicio.imagen) {
        deleteFile(servicio.imagen);
      }
      servicio.imagen = req.file.filename;
    }

    campos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        servicio[campo] = req.body[campo];
      }
    });

    await servicio.save();

    res.json({
      success: true,
      message: 'Servicio actualizado',
      data: { servicio }
    });

  } catch (error) {
    console.error('Error en actualizarServicio:', error);
    if (req.file) {
      deleteFile(req.file.filename);
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ACTIVAR / DESACTIVAR SERVICIO
 * ============================================
 * PATCH /api/servicios/:id/toggle
 */
const toggleServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    servicio.activo = !servicio.activo;
    await servicio.save();

    res.json({
      success: true,
      message: `Servicio ${servicio.activo ? 'activado' : 'desactivado'}`,
      data: { servicio }
    });

  } catch (error) {
    console.error('Error en toggleServicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del servicio',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ELIMINAR SERVICIO
 * ============================================
 * DELETE /api/servicios/:id
 */
const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    if (servicio.imagen) {
      deleteFile(servicio.imagen);
    }

    await servicio.destroy();

    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en eliminarServicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar servicio',
      error: error.message
    });
  }
};

module.exports = {
  getServicios,
  getServicioById,
  crearServicio,
  actualizarServicio,
  toggleServicio,
  eliminarServicio
};