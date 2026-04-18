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
const { deleteFile } = require('../config/multer');

const esNombreImagenValido = (imagen) => /\.(jpg|jpeg|png|gif)$/i.test(String(imagen || ''));

/**
 * ============================================
 * OBTENER SERVICIOS (PUBLICO / CLIENTE)
 * ============================================
 * GET /api/servicios
 * Query: ?categoriaId=&subcategoriaId=&activo=true&pagina=1&limite=100
 */
const getServicios = async (req, res) => {
  try {
    const { categoriaId, subcategoriaId, activo, buscar, pagina = 1, limite = 100} = req.query;
    const { Op } = require('sequelize');

    const where = {};

    if (categoriaId) where.categoriaId = categoriaId;
    if (subcategoriaId) where.subcategoriaId = subcategoriaId;
    if (activo !== undefined) where.activo = activo === 'true';
    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { descripcion: { [Op.like]: `%${buscar}%` } }
      ];
    }

    const offset = (parseInt(pagina) - 1) * parseInt(limite);

    const { count, rows: servicios } = await Servicio.findAndCountAll({
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
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limite),
      offset
    });

    res.json({
      success: true,
      data: {
        servicios,
        paginacion: {
          total: count,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(count / parseInt(limite))
        }
      }
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
        { model: Subcategoria, as: 'subcategoria' }
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
    } = req.body;
    const parsedPrecio = parseFloat(precio);
    const parsedDuracion = parseInt(duracion, 10);
    const parsedCategoriaId = parseInt(categoriaId, 10);
    const parsedSubcategoriaId = parseInt(subcategoriaId, 10);
    const imagen = req.file ? req.file.filename : null;

    // VALIDACIONES
    if (!nombre || !precio || !duracion || !categoriaId || !subcategoriaId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser enviados'
      });
    }

    if (Number.isNaN(parsedPrecio) || parsedPrecio <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (Number.isNaN(parsedDuracion) || parsedDuracion < 1) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser mayor a 0 minutos'
      });
    }

    const categoria = await Categoria.findByPk(parsedCategoriaId);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: `No existe una categoría con ID ${parsedCategoriaId}`
      });
    }
    if (!categoria.activo) {
      return res.status(400).json({
        success: false,
        message: `La categoría "${categoria.nombre}" está inactiva`
      });
    }

    const subcategoria = await Subcategoria.findByPk(parsedSubcategoriaId);
    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: `No existe una subcategoría con ID ${parsedSubcategoriaId}`
      });
    }
    if (!subcategoria.activo) {
      return res.status(400).json({
        success: false,
        message: `La subcategoría "${subcategoria.nombre}" está inactiva`
      });
    }
    if (subcategoria.categoriaId !== parsedCategoriaId) {
      return res.status(400).json({
        success: false,
        message: 'La subcategoría no pertenece a la categoría seleccionada'
      });
    }
    if (categoria.tipo !== 'servicio') {
      return res.status(400).json({
        success: false,
        message: 'La categoría no corresponde a servicios'
      });
    }
    if (subcategoria.tipo !== 'servicio') {
      return res.status(400).json({
        success: false,
        message: 'La subcategoría no corresponde a servicios'
      });
    }

    const servicio = await Servicio.create({
      nombre,
      descripcion,
      precio: parsedPrecio,
      duracion: parsedDuracion,
      categoriaId: parsedCategoriaId,
      subcategoriaId: parsedSubcategoriaId,
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
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map((e) => e.message)
      });
    }
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
    const { nombre, descripcion, precio, duracion, categoriaId, subcategoriaId, activo } = req.body;
    const parsedPrecio = precio !== undefined ? parseFloat(precio) : undefined;
    const parsedDuracion = duracion !== undefined ? parseInt(duracion, 10) : undefined;
    const parsedCategoriaId = categoriaId !== undefined && categoriaId !== '' ? parseInt(categoriaId, 10) : undefined;
    const parsedSubcategoriaId = subcategoriaId !== undefined && subcategoriaId !== '' ? parseInt(subcategoriaId, 10) : undefined;
    const parsedActivo = activo !== undefined ? activo === 'true' || activo === true : undefined;

    const servicio = await Servicio.findByPk(id);

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    if (parsedPrecio !== undefined && (Number.isNaN(parsedPrecio) || parsedPrecio <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (parsedDuracion !== undefined && (Number.isNaN(parsedDuracion) || parsedDuracion < 1)) {
      return res.status(400).json({
        success: false,
        message: 'La duración debe ser mayor a 0 minutos'
      });
    }

    if (parsedCategoriaId !== undefined) {
      const categoria = await Categoria.findByPk(parsedCategoriaId);
      if (!categoria) {
        return res.status(404).json({
          success: false,
          message: `No existe una categoría con ID ${parsedCategoriaId}`
        });
      }
      if (!categoria.activo) {
        return res.status(400).json({
          success: false,
          message: `La categoría "${categoria.nombre}" está inactiva`
        });
      }
      if (categoria.tipo !== 'servicio') {
        return res.status(400).json({
          success: false,
          message: 'La categoría no corresponde a servicios'
        });
      }
    }

    if (parsedSubcategoriaId !== undefined) {
      const subcategoria = await Subcategoria.findByPk(parsedSubcategoriaId);
      if (!subcategoria) {
        return res.status(404).json({
          success: false,
          message: `No existe una subcategoría con ID ${parsedSubcategoriaId}`
        });
      }
      if (!subcategoria.activo) {
        return res.status(400).json({
          success: false,
          message: `La subcategoría "${subcategoria.nombre}" está inactiva`
        });
      }
      const categoriaDeServicio = parsedCategoriaId !== undefined ? parsedCategoriaId : servicio.categoriaId;
      if (subcategoria.categoriaId !== categoriaDeServicio) {
        return res.status(400).json({
          success: false,
          message: 'La subcategoría no pertenece a la categoría seleccionada'
        });
      }
      if (subcategoria.tipo !== 'servicio') {
        return res.status(400).json({
          success: false,
          message: 'La subcategoría no corresponde a servicios'
        });
      }
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
    } else if (servicio.imagen && !esNombreImagenValido(servicio.imagen)) {
      servicio.imagen = null;
    }

    campos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        servicio[campo] = req.body[campo];
      }
    });

    if (nombre !== undefined) servicio.nombre = nombre;
    if (descripcion !== undefined) servicio.descripcion = descripcion;
    if (parsedPrecio !== undefined) servicio.precio = parsedPrecio;
    if (parsedDuracion !== undefined) servicio.duracion = parsedDuracion;
    if (parsedCategoriaId !== undefined) servicio.categoriaId = parsedCategoriaId;
    if (parsedSubcategoriaId !== undefined) servicio.subcategoriaId = parsedSubcategoriaId;
    if (parsedActivo !== undefined) servicio.activo = parsedActivo;

    await servicio.save();

    res.json({
      success: true,
      message: 'Servicio actualizado',
      data: { servicio }
    });

  } catch (error) {
    console.error('Error en actualizarServicio:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map((e) => e.message)
      });
    }
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