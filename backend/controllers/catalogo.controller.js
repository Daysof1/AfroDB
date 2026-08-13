/**
 * ============================================
 * CONTROLADOR DE CATÁLOGO PÚBLICO
 * ============================================
 * Endpoints públicos para que cualquier visitante vea productos y categorías.
 * NO requieren autenticación (no necesitan token JWT).
 * Es usado por las rutas definidas en routes/auth.routes.js (rutas públicas).
 */

const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Servicio = require('../models/Servicio');

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES (extraídas para reducir complejidad)
// ─────────────────────────────────────────────────────────────

/**
 * Construye los filtros WHERE para la búsqueda de productos
 */
const buildProductoFilters = (query) => {
  const { Op } = require('sequelize');
  const {
    categoriaId,
    subcategoriaId,
    buscar,
    precioMin,
    precioMax
  } = query;

  const where = {
    activo: true,
    stock: { [Op.gt]: 0 }
  };

  if (categoriaId) where.categoriaId = categoriaId;
  if (subcategoriaId) where.subcategoriaId = subcategoriaId;

  if (buscar) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { descripcion: { [Op.like]: `%${buscar}%` } }
    ];
  }

  if (precioMin || precioMax) {
    where.precio = {};
    if (precioMin) where.precio[Op.gte] = Number.parseFloat(precioMin);
    if (precioMax) where.precio[Op.lte] = Number.parseFloat(precioMax);
  }

  return where;
};

/**
 * Define el ordenamiento para productos
 */
const buildProductoOrder = (orden) => {
  switch (orden) {
    case 'precio_asc':
      return [['precio', 'ASC']];
    case 'precio_desc':
      return [['precio', 'DESC']];
    case 'nombre':
      return [['nombre', 'ASC']];
    case 'reciente':
    default:
      return [['createdAt', 'DESC']];
  }
};

/**
 * Construye los filtros WHERE para servicios
 */
const buildServicioFilters = (query) => {
  const { Op } = require('sequelize');
  const {
    subcategoriaId,
    buscar,
    precioMin,
    precioMax
  } = query;

  const where = { activo: true };

  if (subcategoriaId) where.subcategoriaId = subcategoriaId;

  if (buscar) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { descripcion: { [Op.like]: `%${buscar}%` } }
    ];
  }

  if (precioMin || precioMax) {
    where.precio = {};
    if (precioMin) where.precio[Op.gte] = Number.parseFloat(precioMin);
    if (precioMax) where.precio[Op.lte] = Number.parseFloat(precioMax);
  }

  return where;
};

/**
 * Define el ordenamiento para servicios
 */
const buildServicioOrder = (orden) => {
  switch (orden) {
    case 'precio_asc':
      return [['precio', 'ASC']];
    case 'precio_desc':
      return [['precio', 'DESC']];
    case 'nombre':
      return [['nombre', 'ASC']];
    default:
      return [['createdAt', 'DESC']];
  }
};

// ─────────────────────────────────────────────────────────────
// ENDPOINTS DE PRODUCTOS
// ─────────────────────────────────────────────────────────────

/**
 * Obtener catálogo de productos (público)
 * Ruta: GET /api/catalogo/productos
 */
const getProductos = async (req, res) => {
  try {
    const {
      orden = 'reciente',
      pagina = 1,
      limite = 12
    } = req.query;

    const where = buildProductoFilters(req.query);
    const order = buildProductoOrder(orden);

    const pageNum = Number.parseInt(pagina, 10);
    const limitNum = Number.parseInt(limite, 10);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: productos } = await Producto.findAndCountAll({
      where,
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre', 'tipo'],
          where: { activo: true }
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre', 'tipo'],
          where: { activo: true }
        }
      ],
      limit: limitNum,
      offset,
      order
    });

    res.json({
      success: true,
      data: {
        productos,
        paginacion: {
          total: count,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(count / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error en getProductos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

/**
 * Obtener un producto por ID (público)
 * Ruta: GET /api/catalogo/productos/:id
 */
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findOne({
      where: {
        id,
        activo: true
      },
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }
        }
      ]
    });

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o no disponible'
      });
    }

    res.json({
      success: true,
      data: { producto }
    });

  } catch (error) {
    console.error('Error en getProductoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

/**
 * Obtener todas las categorías (público)
 * Ruta: GET /api/catalogo/categorias
 */
const getCategorias = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const { tipo } = req.query;

    const where = { activo: true };
    if (tipo) {
      if (tipo === 'producto') {
        where[Op.or] = [
          { tipo: 'producto' },
          { tipo: null }
        ];
      } else if (tipo === 'servicio') {
        where.tipo = 'servicio';
      }
    }

    const categorias = await Categoria.findAll({
      where,
      attributes: ['id', 'nombre', 'descripcion', 'tipo'],
      order: [['nombre', 'ASC']]
    });

    const categoriasConContador = await Promise.all(
      categorias.map(async (categoria) => {
        const totalProductos = await Producto.count({
          where: {
            categoriaId: categoria.id,
            activo: true,
            stock: { [Op.gt]: 0 }
          }
        });

        return {
          ...categoria.toJSON(),
          totalProductos
        };
      })
    );

    res.json({
      success: true,
      data: {
        categorias: categoriasConContador
      }
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
 * Obtener subcategorías de una categoría (público)
 * Ruta: GET /api/catalogo/categorias/:id/subcategorias
 */
const getSubcategoriasPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { Op } = require('sequelize');

    const categoria = await Categoria.findOne({
      where: { id, activo: true }
    });

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    const subcategorias = await Subcategoria.findAll({
      where: {
        categoriaId: id,
        activo: true,
        tipo: categoria.tipo
      },
      attributes: ['id', 'nombre', 'descripcion', 'tipo'],
      order: [['nombre', 'ASC']]
    });

    const subcategoriasConContador = await Promise.all(
      subcategorias.map(async (subcategoria) => {
        const totalProductos = await Producto.count({
          where: {
            subcategoriaId: subcategoria.id,
            activo: true,
            stock: { [Op.gt]: 0 }
          }
        });

        return {
          ...subcategoria.toJSON(),
          totalProductos
        };
      })
    );

    res.json({
      success: true,
      data: {
        categoria: {
          id: categoria.id,
          nombre: categoria.nombre
        },
        subcategorias: subcategoriasConContador
      }
    });

  } catch (error) {
    console.error('Error en getSubcategoriasPorCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener subcategorías',
      error: error.message
    });
  }
};

/**
 * Obtener productos destacados/recientes (público)
 * Ruta: GET /api/catalogo/destacados
 */
const getProductosDestacados = async (req, res) => {
  try {
    const { limite = 8 } = req.query;
    const { Op } = require('sequelize');

    const limitNum = Number.parseInt(limite, 10);

    const productos = await Producto.findAll({
      where: {
        activo: true,
        stock: { [Op.gt]: 0 }
      },
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }
        }
      ],
      limit: limitNum,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { productos }
    });

  } catch (error) {
    console.error('Error en getProductosDestacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos destacados',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// ENDPOINTS DE SERVICIOS
// ─────────────────────────────────────────────────────────────

/**
 * Obtener servicios (público)
 * Ruta: GET /api/catalogo/servicios
 */
const getServicios = async (req, res) => {
  try {
    const { orden = 'reciente' } = req.query;

    const where = buildServicioFilters(req.query);
    const order = buildServicioOrder(orden);

    const servicios = await Servicio.findAll({
      where,
      include: [
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }
        }
      ],
      order
    });

    res.json({
      success: true,
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
 * Obtener un servicio por ID (público)
 * Ruta: GET /api/catalogo/servicios/:id
 */
const getServicioById = async (req, res) => {
  try {
    const { id } = req.params;

    const servicio = await Servicio.findOne({
      where: {
        id,
        activo: true
      },
      include: [
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }
        }
      ]
    });

    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado o no disponible'
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
 * Obtener servicios destacados/recientes (público)
 * Ruta: GET /api/catalogo/servicios/destacados
 */
const getServiciosDestacados = async (req, res) => {
  try {
    const { limite = 8 } = req.query;
    const limitNum = Number.parseInt(limite, 10);

    const servicios = await Servicio.findAll({
      where: { activo: true },
      include: [
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }
        }
      ],
      limit: limitNum,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { servicios }
    });

  } catch (error) {
    console.error('Error en getServiciosDestacados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios destacados',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  // Productos
  getProductos,
  getProductoById,
  getCategorias,
  getSubcategoriasPorCategoria,
  getProductosDestacados,

  // Servicios
  getServicios,
  getServicioById,
  getServiciosDestacados
};