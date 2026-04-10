/**
 * ============================================
 * CONTROLADOR DE CATÁLOGO PÚBLICO
 * ============================================
 * Endpoints públicos para que cualquier visitante vea productos y categorías.
 * NO requieren autenticación (no necesitan token JWT).
 * Es usado por las rutas definidas en routes/auth.routes.js (rutas públicas).
 */

// Importa el modelo Producto desde models/Producto.js.
// Representa la tabla 'Producto' en la BD.
const Producto = require('../models/Producto');

// Importa el modelo Categoria desde models/Categoria.js.
// Representa la tabla 'Categoria' en la BD.
const Categoria = require('../models/Categoria');

// Importa el modelo Subcategoria desde models/Subcategoria.js.
// Representa la tabla 'Subcategoria' en la BD.
const Subcategoria = require('../models/Subcategoria');

/**
 * Obtener catálogo de productos (público)
 * 
 * Ruta: GET /api/catalogo/productos
 * Query params opcionales (se envían en la URL como ?parametro=valor):
 * - categoriaId: Filtrar por categoría
 * - subcategoriaId: Filtrar por subcategoría
 * - buscar: Texto para buscar en nombre o descripción
 * - precioMin, precioMax: Rango de precios
 * - orden: 'precio_asc' | 'precio_desc' | 'nombre' | 'reciente'
 * - pagina, limite: Paginación
 * 
 * Solo muestra productos activos que tengan stock > 0
 */
const getProductos = async (req, res) => {
  try {
    // Extrae los query params de la URL.
    // req.query contiene los parámetros después del ? en la URL.
    // Ejemplo: /productos?categoriaId=1&orden=precio_asc
    // Los valores con = son valores por defecto si no se envían.
    const {
      categoriaId,
      subcategoriaId,
      buscar,
      precioMin,
      precioMax,
      orden = 'reciente',     // Si no viene, ordena por más recientes
      pagina = 1,             // Página actual, por defecto la primera
      limite = 12             // Productos por página, por defecto 12
    } = req.query;

    // Importa Op (Operadores) de Sequelize.
    // Op provee operadores SQL como: Op.gt (>), Op.lt (<), Op.like (LIKE), Op.or (OR)
    const { Op } = require('sequelize');
    
    // Filtros base: SIEMPRE filtra productos activos con stock > 0.
    // where es el objeto que Sequelize traduce a la cláusula WHERE de SQL.
    const where = {
      activo: true,                    // Solo productos activos
      stock: { [Op.gt]: 0 }           // Op.gt = greater than (mayor que). Stock > 0
    };
    
    // Agrega filtros opcionales SOLO si el usuario los envió en la URL
    if (categoriaId) where.categoriaId = categoriaId;         // Filtra por categoría
    if (subcategoriaId) where.subcategoriaId = subcategoriaId; // Filtra por subcategoría
    
    // Búsqueda por texto en nombre O descripción del producto
    if (buscar) {
      // Op.or: busca donde se cumpla CUALQUIERA de las condiciones (OR en SQL)
      // Op.like: equivale a LIKE en SQL. %texto% busca el texto en cualquier posición
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },      // Busca en el nombre
        { descripcion: { [Op.like]: `%${buscar}%` } }   // O en la descripción
      ];
    }
    
    // Filtro por rango de precios (mínimo y/o máximo)
    if (precioMin || precioMax) {
      where.precio = {};  // Crea el objeto para filtrar precio
      // Op.gte = greater than or equal (>=). Precio >= precioMin
      if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
      // Op.lte = less than or equal (<=). Precio <= precioMax
      if (precioMax) where.precio[Op.lte] = parseFloat(precioMax);
    }
    
    // Define el ordenamiento según el parámetro 'orden'
    // order es un array de arrays: [['campo', 'dirección']]
    let order;
    switch (orden) {
      case 'precio_asc':                    // Precio de menor a mayor
        order = [['precio', 'ASC']];
        break;
      case 'precio_desc':                   // Precio de mayor a menor
        order = [['precio', 'DESC']];
        break;
      case 'nombre':                        // Nombre alfabéticamente A-Z
        order = [['nombre', 'ASC']];
        break;
      case 'reciente':                      // Más recientes primero
      default:
        order = [['createdAt', 'DESC']];
        break;
    }
    
    // Calcula el offset (cuántos registros saltar) para la paginación.
    // Ejemplo: página 3 con límite 12 -> offset = (3-1) * 12 = 24 (salta los primeros 24)
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    
    // Consulta productos con paginación.
    // findAndCountAll() retorna { count: total, rows: registros }
    // count = total de registros que coinciden (para calcular páginas)
    // rows = solo los registros de la página actual
    const { count, rows: productos } = await Producto.findAndCountAll({
      where,                      // Filtros definidos arriba
      include: [                  // JOINs con tablas relacionadas
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }    // Solo categorías activas
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }    // Solo subcategorías activas
        }
      ],
      limit: parseInt(limite),    // Máximo de registros a retornar
      offset,                     // Registros a saltar
      order                       // Ordenamiento
    });
    
    // Responde con los productos y la info de paginación
    res.json({
      success: true,
      data: {
        productos,                 // Array de productos de esta página
        paginacion: {
          total: count,            // Total de productos que coinciden con los filtros
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          // Math.ceil redondea hacia arriba: 25/12 = 2.08 -> 3 páginas
          totalPaginas: Math.ceil(count / parseInt(limite))
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
 * 
 * Ruta: GET /api/catalogo/productos/:id
 * Solo retorna el producto si está activo.
 */
const getProductoById = async (req, res) => {
  try {
    // Obtiene el ID del producto de los parámetros de la URL
    const { id } = req.params;
    
    // Busca UN producto que cumpla: tener ese ID y estar activo.
    // findOne() retorna un solo registro o null.
    const producto = await Producto.findOne({
      where: { 
        id,                // ID del producto
        activo: true       // Solo si está activo
      },
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }      // Categoría debe estar activa
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre'],
          where: { activo: true }      // Subcategoría debe estar activa
        }
      ]
    });
    
    // Si no encontró el producto (no existe, está inactivo, o su categoría/subcategoría está inactiva)
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o no disponible'
      });
    }
    
    // Responde con el producto encontrado
    res.json({
      success: true,
      data: {
        producto
      }
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
 * 
 * Ruta: GET /api/catalogo/categorias
 * Solo categorías activas, con contador de productos disponibles en cada una.
 */
const getCategorias = async (req, res) => {
  try {
    // Importa Op de Sequelize para usar operadores
    const { Op } = require('sequelize');
    
    // Obtiene todas las categorías activas, ordenadas alfabéticamente
    const categorias = await Categoria.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]     // A-Z por nombre
    });
    
    // Para cada categoría, cuenta cuántos productos activos con stock tiene.
    // Promise.all() ejecuta múltiples promesas en paralelo y espera que todas terminen.
    // .map() transforma cada categoría en una promesa que agrega el contador.
    const categoriasConContador = await Promise.all(
      categorias.map(async (categoria) => {
        // Cuenta los productos activos con stock > 0 en esta categoría
        const totalProductos = await Producto.count({
          where: {
            categoriaId: categoria.id,   // De esta categoría
            activo: true,                // Activos
            stock: { [Op.gt]: 0 }        // Con stock > 0
          }
        });
        
        // Retorna la categoría como objeto plano + el campo totalProductos
        // El spread operator (...) copia todas las propiedades del objeto
        return {
          ...categoria.toJSON(),
          totalProductos
        };
      })
    );
    
    // Responde con las categorías y sus contadores
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
 * 
 * Ruta: GET /api/catalogo/categorias/:id/subcategorias
 * Retorna las subcategorías activas de la categoría indicada.
 */
const getSubcategoriasPorCategoria = async (req, res) => {
  try {
    // Obtiene el ID de la categoría desde la URL
    const { id } = req.params;
    const { Op } = require('sequelize');
    
    // Verifica que la categoría exista y esté activa
    const categoria = await Categoria.findOne({
      where: { id, activo: true }
    });
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Obtiene las subcategorías activas de esta categoría
    const subcategorias = await Subcategoria.findAll({
      where: {
        categoriaId: id,    // Que pertenezcan a esta categoría
        activo: true         // Solo activas
      },
      attributes: ['id', 'nombre', 'descripcion'],
      order: [['nombre', 'ASC']]
    });
    
    // Cuenta productos disponibles por cada subcategoría
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
    
    // Responde con la categoría y sus subcategorías
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
 * 
 * Ruta: GET /api/catalogo/destacados
 * Query: ?limite=8 (cantidad de productos a mostrar)
 * Retorna los productos más recientes que estén activos y con stock.
 */
const getProductosDestacados = async (req, res) => {
  try {
    // Obtiene el límite de productos a mostrar (por defecto 8)
    const { limite = 8 } = req.query;
    const { Op } = require('sequelize');
    
    // Busca los productos más recientes que estén activos y con stock
    const productos = await Producto.findAll({
      where: {
        activo: true,
        stock: { [Op.gt]: 0 }     // Stock mayor que 0
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
      limit: parseInt(limite),        // Máximo de productos a retornar
      order: [['createdAt', 'DESC']]  // Los más recientes primero
    });
    
    // Responde con los productos destacados
    res.json({
      success: true,
      data: {
        productos
      }
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

// Exporta las funciones del controlador para usarlas en las rutas públicas.
module.exports = {
  getProductos,                  // GET /api/catalogo/productos - Catálogo con filtros
  getProductoById,               // GET /api/catalogo/productos/:id - Detalle de producto
  getCategorias,                 // GET /api/catalogo/categorias - Listar categorías
  getSubcategoriasPorCategoria,  // GET /api/catalogo/categorias/:id/subcategorias
  getProductosDestacados         // GET /api/catalogo/destacados - Productos recientes
};
