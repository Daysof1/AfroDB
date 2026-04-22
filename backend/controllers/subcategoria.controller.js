/**
 * ============================================
 * CONTROLADOR DE SUBCATEGORÍAS (Admin)
 * ============================================
 * CRUD completo de subcategorías.
 * Ahora soporta:
 * - Productos
 * - Servicios
 */

const Subcategoria = require('../models/Subcategoria');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');
const Servicio = require('../models/Servicio'); // 🔥 NUEVO

/**
 * ============================================
 * OBTENER SUBCATEGORÍAS
 * ============================================
 * GET /api/admin/subcategorias
 */
const getSubcategorias = async (req, res) => {
  try {
    const { categoriaId, activo } = req.query;

    const where = {};
    if (categoriaId) where.categoriaId = categoriaId;
    if (activo !== undefined) where.activo = activo === 'true';

    const subcategorias = await Subcategoria.findAll({
      where,
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre', 'activo']
      }],
      order: [['nombre', 'ASC']]
    });

    res.json({
      success: true,
      count: subcategorias.length,
      data: { subcategorias }
    });

  } catch (error) {
    console.error('Error en getSubcategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategorías',
      error: error.message
    });
  }
};

/**
 * ============================================
 * OBTENER SUBCATEGORÍA POR ID
 * ============================================
 */
const getSubcategoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategoria = await Subcategoria.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Producto, as: 'productos', attributes: ['id'] },
        { model: Servicio, as: 'servicios', attributes: ['id'] } // 🔥 NUEVO
      ]
    });

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }

    const data = subcategoria.toJSON();

    data.totalProductos = data.productos.length;
    data.totalServicios = data.servicios.length;

    delete data.productos;
    delete data.servicios;

    res.json({
      success: true,
      data: { subcategoria: data }
    });

  } catch (error) {
    console.error('Error en getSubcategoriaById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CREAR SUBCATEGORÍA
 * ============================================
 */
const crearSubcategoria = async (req, res) => {
  try {
    const { nombre, descripcion, categoriaId, tipo } = req.body;

    if (!nombre || !categoriaId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y categoría son obligatorios'
      });
    }

    // Validar categoría
    const categoria = await Categoria.findByPk(categoriaId);
    if (!categoria || !categoria.activo) {
      return res.status(400).json({
        success: false,
        message: 'Categoría inválida o inactiva'
      });
    }

    const subcategoriaTipo = tipo ? tipo.toLowerCase() : categoria.tipo;

    if (!['producto', 'servicio'].includes(subcategoriaTipo)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de subcategoría debe ser producto o servicio'
      });
    }

    const subcategoria = await Subcategoria.create({
      nombre,
      descripcion,
      categoriaId,
      tipo: subcategoriaTipo,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Subcategoría creada',
      data: { subcategoria }
    });

  } catch (error) {
    console.error('Error en crearSubcategoria:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una subcategoría con ese nombre en esta categoría'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear subcategoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ACTUALIZAR SUBCATEGORÍA
 * ============================================
 */
const actualizarSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategoria = await Subcategoria.findByPk(id);

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }

    const campos = ['nombre', 'descripcion', 'categoriaId', 'activo'];

    for (const campo of campos) {
      if (req.body[campo] !== undefined) {
        subcategoria[campo] = req.body[campo];
      }
    }

    await subcategoria.save();

    res.json({
      success: true,
      message: 'Subcategoría actualizada',
      data: { subcategoria }
    });

  } catch (error) {
    console.error('Error en actualizarSubcategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar subcategoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * TOGGLE SUBCATEGORÍA
 * ============================================
 */
const toggleSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategoria = await Subcategoria.findByPk(id);

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }

    subcategoria.activo = !subcategoria.activo;
    await subcategoria.save();

    const productos = await Producto.count({
      where: { subcategoriaId: id }
    });

    const servicios = await Servicio.count({
      where: { subcategoriaId: id }
    });

    res.json({
      success: true,
      message: `Subcategoría ${subcategoria.activo ? 'activada' : 'desactivada'}`,
      data: {
        subcategoria,
        afectados: {
          productos,
          servicios
        }
      }
    });

  } catch (error) {
    console.error('Error en toggleSubcategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ELIMINAR SUBCATEGORÍA
 * ============================================
 */
const eliminarSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategoria = await Subcategoria.findByPk(id);

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }

    const productos = await Producto.count({
      where: { subcategoriaId: id }
    });

    if (productos > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiene productos asociados'
      });
    }

    const servicios = await Servicio.count({
      where: { subcategoriaId: id }
    });

    if (servicios > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiene servicios asociados'
      });
    }

    await subcategoria.destroy();

    res.json({
      success: true,
      message: 'Subcategoría eliminada'
    });

  } catch (error) {
    console.error('Error en eliminarSubcategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar subcategoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ESTADÍSTICAS GENERALES DE SUBCATEGORÍAS
 * ============================================
 */
const getEstadisticasSubcategorias = async (req, res) => {
  try {
    const totalSubcategorias = await Subcategoria.count();
    const subcategoriasActivas = await Subcategoria.count({ where: { activo: true } });

    res.json({
      success: true,
      data: {
        total: totalSubcategorias,
        activas: subcategoriasActivas,
        inactivas: totalSubcategorias - subcategoriasActivas,
      },
    });
  } catch (error) {
    console.error('Error en getEstadisticasSubcategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de subcategorías',
      error: error.message,
    });
  }
};

module.exports = {
  getSubcategorias,
  getSubcategoriaById,
  crearSubcategoria,
  actualizarSubcategoria,
  toggleSubcategoria,
  eliminarSubcategoria,
  getEstadisticasSubcategorias,
};