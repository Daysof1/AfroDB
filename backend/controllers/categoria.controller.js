/**
 * ============================================
 * CONTROLADOR DE CATEGORÍAS (Admin)
 * ============================================
 * CRUD completo de categorías, estadísticas y toggle activar/desactivar.
 * Ahora soporta:
 * - Productos (e-commerce)
 * - Servicios (citas)
 */

const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Producto = require('../models/Producto');
const Servicio = require('../models/Servicio'); // 🔥 NUEVO

/**
 * ============================================
 * OBTENER TODAS LAS CATEGORÍAS
 * ============================================
 */
const getCategorias = async (req, res) => {
  try {
    const { activo, incluirSubcategorias } = req.query;

    const opciones = {
      order: [['nombre', 'ASC']]
    };

    if (activo !== undefined) {
      opciones.where = { activo: activo === 'true' };
    }

    if (incluirSubcategorias === 'true') {
      opciones.include = [{
        model: Subcategoria,
        as: 'subcategorias',
        attributes: ['id', 'nombre', 'descripcion', 'activo']
      }];
    }

    const categorias = await Categoria.findAll(opciones);

    res.json({
      success: true,
      count: categorias.length,
      data: { categorias }
    });

  } catch (error) {
    console.error('Error en getCategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

/**
 * ============================================
 * OBTENER CATEGORÍA POR ID
 * ============================================
 */
const getCategoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id, {
      include: [
        {
          model: Subcategoria,
          as: 'subcategorias',
          attributes: ['id', 'nombre', 'descripcion', 'activo']
        },
        {
          model: Producto,
          as: 'productos',
          attributes: ['id']
        },
        {
          model: Servicio, // 🔥 NUEVO
          as: 'servicios',
          attributes: ['id']
        }
      ]
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const categoriaJSON = categoria.toJSON();

    categoriaJSON.totalProductos = categoriaJSON.productos.length;
    categoriaJSON.totalServicios = categoriaJSON.servicios.length;

    delete categoriaJSON.Productos;
    delete categoriaJSON.Servicios;

    res.json({
      success: true,
      data: { categoria: categoriaJSON }
    });

  } catch (error) {
    console.error('Error en getCategoriaById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * CREAR CATEGORÍA
 * ============================================
 */
const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion, tipo } = req.body;

    if (!nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }

    const categoriaTipo = tipo ? tipo.toLowerCase() : 'producto';

    if (!['producto', 'servicio'].includes(categoriaTipo)) {
      return res.status(400).json({
        success: false,
        message: 'El tipo de categoría debe ser producto o servicio'
      });
    }

    const existe = await Categoria.findOne({ where: { nombre } });

    if (existe) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una categoría con el nombre "${nombre}"`
      });
    }

    const categoria = await Categoria.create({
      nombre,
      descripcion,
      tipo: categoriaTipo,
      activo: true
    });

    res.status(201).json({
      success: true,
      message: 'Categoría creada',
      data: { categoria }
    });

  } catch (error) {
    console.error('Error en crearCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ACTUALIZAR CATEGORÍA
 * ============================================
 */
const actualizarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, activo, tipo } = req.body;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    if (nombre && nombre !== categoria.nombre) {
      const existe = await Categoria.findOne({ where: { nombre } });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una categoría con el nombre "${nombre}"`
        });
      }
    }

    if (nombre !== undefined) categoria.nombre = nombre;
    if (descripcion !== undefined) categoria.descripcion = descripcion;
    if (activo !== undefined) categoria.activo = activo;
    if (tipo !== undefined) {
      const categoriaTipo = tipo.toLowerCase();
      if (!['producto', 'servicio'].includes(categoriaTipo)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo de categoría debe ser producto o servicio'
        });
      }
      categoria.tipo = categoriaTipo;
    }

    await categoria.save();

    res.json({
      success: true,
      message: 'Categoría actualizada',
      data: { categoria }
    });

  } catch (error) {
    console.error('Error en actualizarCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * TOGGLE CATEGORÍA
 * ============================================
 */
const toggleCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    categoria.activo = !categoria.activo;
    await categoria.save();

    const subcategorias = await Subcategoria.count({ where: { categoriaId: id } });
    const productos = await Producto.count({ where: { categoriaId: id } });
    const servicios = await Servicio.count({ where: { categoriaId: id } }); // 🔥 NUEVO

    res.json({
      success: true,
      message: `Categoría ${categoria.activo ? 'activada' : 'desactivada'}`,
      data: {
        categoria,
        afectados: {
          subcategorias,
          productos,
          servicios
        }
      }
    });

  } catch (error) {
    console.error('Error en toggleCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ELIMINAR CATEGORÍA
 * ============================================
 */
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const subcategorias = await Subcategoria.count({ where: { categoriaId: id } });
    if (subcategorias > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiene subcategorías asociadas'
      });
    }

    const productos = await Producto.count({ where: { categoriaId: id } });
    if (productos > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiene productos asociados'
      });
    }

    const servicios = await Servicio.count({ where: { categoriaId: id } }); // 🔥 NUEVO
    if (servicios > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tiene servicios asociados'
      });
    }

    await categoria.destroy();

    res.json({
      success: true,
      message: 'Categoría eliminada'
    });

  } catch (error) {
    console.error('Error en eliminarCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar categoría',
      error: error.message
    });
  }
};

/**
 * ============================================
 * ESTADÍSTICAS GENERALES DE CATEGORÍAS
 * ============================================
 */
const getEstadisticasCategorias = async (req, res) => {
  try {
    const totalCategorias = await Categoria.count();
    const categoriasActivas = await Categoria.count({ where: { activo: true } });
    const totalProductos = await Producto.count();
    const totalServicios = await Servicio.count();

    res.json({
      success: true,
      data: {
        total: totalCategorias,
        activas: categoriasActivas,
        inactivas: totalCategorias - categoriasActivas,
        totalProductos,
        totalServicios,
      },
    });
  } catch (error) {
    console.error('Error en getEstadisticasCategorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de categorías',
      error: error.message,
    });
  }
};

module.exports = {
  getCategorias,
  getCategoriaById,
  crearCategoria,
  actualizarCategoria,
  toggleCategoria,
  eliminarCategoria,
  getEstadisticasCategorias,
};