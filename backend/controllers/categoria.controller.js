/**
 * ============================================
 * CONTROLADOR DE CATEGORÍAS (Admin)
 * ============================================
 * CRUD completo de categorías, estadísticas y toggle activar/desactivar.
 * Solo accesible por administradores (protegido por middleware checkRole).
 * Las rutas están definidas en routes/admin.routes.js
 */

// Importa el modelo Categoria desde models/Categoria.js
// Representa la tabla 'Categoria' en la BD.
const Categoria = require('../models/Categoria');

// Importa el modelo Subcategoria desde models/Subcategoria.js
// Representa la tabla 'Subcategoria' en la BD.
const Subcategoria = require('../models/Subcategoria');

// Importa el modelo Producto desde models/Producto.js
// Representa la tabla 'Producto' en la BD.
const Producto = require('../models/Producto');

/**
 * Obtener todas las categorías (admin)
 * 
 * Ruta: GET /api/admin/categorias
 * Query params opcionales:
 * - activo: 'true'/'false' → filtrar por estado
 * - incluirSubcategorias: 'true' → incluir subcategorías en la respuesta
 */
const getCategorias = async (req, res) => {
  try {
    // Extrae los query params de la URL (?activo=true&incluirSubcategorias=true)
    const { activo, incluirSubcategorias } = req.query;
    
    // Objeto de opciones para la consulta Sequelize.
    // order define el ORDER BY en SQL → orden alfabético A-Z
    const opciones = {
      order: [['nombre', 'ASC']]
    };
    
    // Si se envió el parámetro 'activo', agrega filtro WHERE.
    // activo === 'true' convierte el string a booleano (query params siempre son strings)
    if (activo !== undefined) {
      opciones.where = { activo: activo === 'true' };
    }
    
    // Si se pidió incluir subcategorías, agrega un JOIN con la tabla Subcategoria
    if (incluirSubcategorias === 'true') {
      opciones.include = [{
        model: Subcategoria,          // Modelo a unir (JOIN)
        as: 'subcategorias',          // Alias de la relación (definido en el modelo)
        attributes: ['id', 'nombre', 'descripcion', 'activo']  // Solo estos campos
      }];
    }
    
    // Ejecuta SELECT * FROM Categoria con las opciones armadas arriba
    const categorias = await Categoria.findAll(opciones);
    
    // Responde con las categorías encontradas
    res.json({
      success: true,
      count: categorias.length,       // Cantidad total de categorías
      data: {
        categorias
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
 * Obtener una categoría por ID (admin)
 * 
 * Ruta: GET /api/admin/categorias/:id
 * Incluye subcategorías y cuenta de productos asociados.
 */
const getCategoriaById = async (req, res) => {
  try {
    // Obtiene el ID de la categoría de los parámetros de ruta
    const { id } = req.params;
    
    // findByPk() busca por Primary Key (clave primaria = id).
    // include hace JOINs con Subcategoria y Producto.
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
          attributes: ['id']   // Solo traemos el id para contar
        }
      ]
    });
    
    // Si no existe la categoría con ese ID
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Convierte la instancia Sequelize a un objeto JavaScript plano
    const categoriaJSON = categoria.toJSON();
    // Agrega un campo totalProductos contando los productos incluidos
    categoriaJSON.totalProductos = categoriaJSON.productos.length;
    // Elimina el array de productos para no enviar la lista completa, solo el contador
    delete categoriaJSON.productos;
    
    // Responde con la categoría y sus subcategorías
    res.json({
      success: true,
      data: {
        categoria: categoriaJSON
      }
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
 * Crear nueva categoría (admin)
 * 
 * Ruta: POST /api/admin/categorias
 * Body JSON: { nombre, descripcion }
 */
const crearCategoria = async (req, res) => {
  try {
    // Extrae nombre y descripcion del cuerpo de la petición (JSON enviado por el frontend)
    const { nombre, descripcion } = req.body;
    
    // VALIDACIÓN 1: El nombre es obligatorio
    if (!nombre) {
      return res.status(400).json({     // 400 = Bad Request
        success: false,
        message: 'El nombre de la categoría es requerido'
      });
    }
    
    // VALIDACIÓN 2: Verifica que no exista otra categoría con el mismo nombre.
    // findOne() busca UN registro que coincida con el WHERE.
    const categoriaExistente = await Categoria.findOne({ 
      where: { nombre } 
    });
    
    // Si ya existe una con ese nombre, rechaza la creación
    if (categoriaExistente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una categoría con el nombre "${nombre}"`
      });
    }
    
    // Crea el registro en la tabla Categoria (INSERT INTO Categoria ...)
    const nuevaCategoria = await Categoria.create({
      nombre,                          // Nombre de la categoría
      descripcion: descripcion || null, // Descripción opcional, null si no se envía
      activo: true                      // Se crea como activa por defecto
    });
    
    // 201 = Created. Indica que se creó un recurso nuevo exitosamente.
    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        categoria: nuevaCategoria
      }
    });
    
  } catch (error) {
    console.error('Error en crearCategoria:', error);
    
    // Captura errores de validación del modelo Sequelize (validaciones definidas en el modelo)
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        // Extrae solo los mensajes de error de cada validación fallida
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear categoría',
      error: error.message
    });
  }
};

/**
 * Actualizar categoría existente (admin)
 * 
 * Ruta: PUT /api/admin/categorias/:id
 * Body JSON: { nombre, descripcion, activo }
 */
const actualizarCategoria = async (req, res) => {
  try {
    // ID de la categoría desde la URL, campos a actualizar desde el body
    const { id } = req.params;
    const { nombre, descripcion, activo } = req.body;
    
    // Busca la categoría por su clave primaria
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // VALIDACIÓN: Si se quiere cambiar el nombre, verifica que el nuevo nombre no exista ya
    if (nombre && nombre !== categoria.nombre) {
      const categoriaConMismoNombre = await Categoria.findOne({
        where: { nombre }
      });
      
      if (categoriaConMismoNombre) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una categoría con el nombre "${nombre}"`
        });
      }
    }
    
    // Actualiza SOLO los campos que se enviaron (si no se envían, no cambian).
    // !== undefined verifica que el campo fue incluido en el body.
    if (nombre !== undefined) categoria.nombre = nombre;
    if (descripcion !== undefined) categoria.descripcion = descripcion;
    if (activo !== undefined) categoria.activo = activo;
    
    // save() ejecuta un UPDATE en la BD con los campos modificados.
    // También dispara los hooks del modelo (ej: afterUpdate para cascada).
    await categoria.save();
    
    // Responde con la categoría actualizada
    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: {
        categoria
      }
    });
    
  } catch (error) {
    console.error('Error en actualizarCategoria:', error);
    
    // Captura errores de validación del modelo Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar categoría',
      error: error.message
    });
  }
};

/**
 * Activar/Desactivar categoría (toggle) (admin)
 * 
 * Ruta: PATCH /api/admin/categorias/:id/toggle
 * 
 * IMPORTANTE: Al desactivar una categoría, el hook afterUpdate
 * del modelo desactiva en cascada todas sus subcategorías y productos.
 */
const toggleCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca la categoría por su ID
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Invierte el estado activo: si era true pasa a false y viceversa
    const nuevoEstado = !categoria.activo;
    categoria.activo = nuevoEstado;
    
    // save() guarda el cambio y dispara el hook afterUpdate del modelo.
    // Ese hook se encarga de desactivar/activar subcategorías y productos en cascada.
    await categoria.save();
    
    // Cuenta subcategorías y productos afectados por el cambio en cascada
    const subcategoriasAfectadas = await Subcategoria.count({
      where: { categoriaId: id }
    });
    
    const productosAfectados = await Producto.count({
      where: { categoriaId: id }
    });
    
    // Responde indicando el nuevo estado y cuántos registros se afectaron
    res.json({
      success: true,
      // Ternario: si nuevoEstado es true → 'activada', si es false → 'desactivada'
      message: `Categoría ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
      data: {
        categoria,
        afectados: {
          subcategorias: subcategoriasAfectadas,   // Subcategorías afectadas
          productos: productosAfectados             // Productos afectados
        }
      }
    });
    
  } catch (error) {
    console.error('Error en toggleCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de la categoría',
      error: error.message
    });
  }
};

/**
 * Eliminar categoría (admin)
 * 
 * Ruta: DELETE /api/admin/categorias/:id
 * 
 * Solo se puede eliminar si NO tiene subcategorías ni productos asociados.
 * Si tiene registros hijos, se recomienda desactivar en vez de eliminar.
 */
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca la categoría por ID
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // VALIDACIÓN 1: Cuenta subcategorías asociadas a esta categoría
    const subcategorias = await Subcategoria.count({
      where: { categoriaId: id }
    });
    
    // Si tiene subcategorías, no se puede eliminar (integridad referencial)
    if (subcategorias > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${subcategorias} subcategoría(s) asociada(s)`,
        sugerencia: 'Usa PATCH /api/admin/categorias/:id/toggle para desactivarla en lugar de eliminarla'
      });
    }
    
    // VALIDACIÓN 2: Cuenta productos asociados a esta categoría
    const productos = await Producto.count({
      where: { categoriaId: id }
    });
    
    // Si tiene productos, no se puede eliminar
    if (productos > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoría porque tiene ${productos} producto(s) asociado(s)`,
        sugerencia: 'Usa PATCH /api/admin/categorias/:id/toggle para desactivarla en lugar de eliminarla'
      });
    }
    
    // destroy() ejecuta DELETE FROM Categoria WHERE id = :id
    await categoria.destroy();
    
    // Responde confirmando la eliminación
    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
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
 * Obtener estadísticas de una categoría (admin)
 * 
 * Ruta: GET /api/admin/categorias/:id/stats
 * Retorna: subcategorías (activas/inactivas), productos (activos/inactivos),
 *          stock total y valor total del inventario.
 */
const getEstadisticasCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verifica que la categoría existe
    const categoria = await Categoria.findByPk(id);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }
    
    // Cuenta TODAS las subcategorías de esta categoría
    const totalSubcategorias = await Subcategoria.count({
      where: { categoriaId: id }
    });
    
    // Cuenta solo las subcategorías ACTIVAS
    const subcategoriasActivas = await Subcategoria.count({
      where: { categoriaId: id, activo: true }
    });
    
    // Cuenta TODOS los productos de esta categoría
    const totalProductos = await Producto.count({
      where: { categoriaId: id }
    });
    
    // Cuenta solo los productos ACTIVOS
    const productosActivos = await Producto.count({
      where: { categoriaId: id, activo: true }
    });
    
    // Obtiene precio y stock de cada producto para calcular estadísticas de inventario
    const productos = await Producto.findAll({
      where: { categoriaId: id },
      attributes: ['precio', 'stock']    // Solo trae estos 2 campos
    });
    
    // Variables para acumular las estadísticas
    let valorTotalInventario = 0;  // Suma de (precio × stock) de cada producto
    let stockTotal = 0;            // Suma de todo el stock
    
    // Recorre cada producto sumando al acumulador
    productos.forEach(producto => {
      // parseFloat convierte el precio (puede venir como string DECIMAL) a número
      valorTotalInventario += parseFloat(producto.precio) * producto.stock;
      stockTotal += producto.stock;
    });
    
    // Responde con todas las estadísticas calculadas
    res.json({
      success: true,
      data: {
        categoria: {
          id: categoria.id,
          nombre: categoria.nombre,
          activo: categoria.activo
        },
        estadisticas: {
          subcategorias: {
            total: totalSubcategorias,
            activas: subcategoriasActivas,
            // Calcula inactivas restando activas del total
            inactivas: totalSubcategorias - subcategoriasActivas
          },
          productos: {
            total: totalProductos,
            activos: productosActivos,
            inactivos: totalProductos - productosActivos
          },
          inventario: {
            stockTotal,
            // toFixed(2) formatea a 2 decimales. Ej: 1234.5 → "1234.50"
            valorTotal: valorTotalInventario.toFixed(2)
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getEstadisticasCategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Exporta todas las funciones del controlador para usarlas en las rutas de admin.
module.exports = {
  getCategorias,               // GET    /api/admin/categorias - Listar todas
  getCategoriaById,            // GET    /api/admin/categorias/:id - Ver una
  crearCategoria,              // POST   /api/admin/categorias - Crear nueva
  actualizarCategoria,         // PUT    /api/admin/categorias/:id - Actualizar
  toggleCategoria,             // PATCH  /api/admin/categorias/:id/toggle - Activar/Desactivar
  eliminarCategoria,           // DELETE /api/admin/categorias/:id - Eliminar
  getEstadisticasCategoria     // GET    /api/admin/categorias/:id/stats - Estadísticas
};
