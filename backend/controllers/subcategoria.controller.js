/**
 * ============================================
 * CONTROLADOR DE SUBCATEGORÍAS (Admin)
 * ============================================
 * CRUD completo de subcategorías, toggle activar/desactivar y estadísticas.
 * Solo accesible por administradores (protegido por middleware checkRole).
 * Las rutas están definidas en routes/admin.routes.js
 */

// Importa el modelo Subcategoria desde models/Subcategoria.js → tabla 'Subcategoria'
const Subcategoria = require('../models/Subcategoria');

// Importa el modelo Categoria desde models/Categoria.js → tabla 'Categoria'
// Se usa para validar que la categoría padre exista y esté activa.
const Categoria = require('../models/Categoria');

// Importa el modelo Producto desde models/Producto.js → tabla 'Producto'
// Se usa para contar productos, calcular estadísticas y validar antes de eliminar.
const Producto = require('../models/Producto');

/**
 * Obtener todas las subcategorías (admin)
 * 
 * Ruta: GET /api/admin/subcategorias
 * Query params opcionales:
 * - categoriaId: filtrar por categoría padre
 * - activo: 'true'/'false'
 * - incluirCategoria: 'true' → incluir datos de la categoría padre
 */
const getSubcategorias = async (req, res) => {
  try {
    // Extrae los query params de la URL
    const { categoriaId, activo, incluirCategoria } = req.query;
    
    // Opciones base de la consulta: ordenar alfabéticamente A-Z
    const opciones = {
      order: [['nombre', 'ASC']]
    };
    
    // Construye filtros dinámicamente según lo que se reciba
    const where = {};
    if (categoriaId) where.categoriaId = categoriaId;         // Filtra por categoría padre
    if (activo !== undefined) where.activo = activo === 'true'; // Convierte string a boolean
    
    // Solo agrega WHERE si hay al menos un filtro.
    // Object.keys() retorna las llaves del objeto como array. Si está vacío, length es 0.
    if (Object.keys(where).length > 0) {
      opciones.where = where;
    }
    
    // Si se pidió incluir la categoría padre, agrega el JOIN
    if (incluirCategoria === 'true') {
      opciones.include = [{
        model: Categoria,
        as: 'categoria',               // Alias de la relación (definido en el modelo)
        attributes: ['id', 'nombre', 'activo']
      }];
    }
    
    // Ejecuta la consulta SELECT con las opciones armadas
    const subcategorias = await Subcategoria.findAll(opciones);
    
    // Responde con las subcategorías encontradas
    res.json({
      success: true,
      count: subcategorias.length,     // Cantidad total
      data: {
        subcategorias
      }
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
 * Obtener una subcategoría por ID (admin)
 * 
 * Ruta: GET /api/admin/subcategorias/:id
 * Retorna la subcategoría con su categoría padre y conteo de productos.
 */
const getSubcategoriaById = async (req, res) => {
  try {
    const { id } = req.params;   // ID de la subcategoría desde la URL
    
    // findByPk busca por Primary Key.
    // include hace JOINs con Categoria (padre) y Producto (hijos).
    const subcategoria = await Subcategoria.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre', 'activo']
        },
        {
          model: Producto,
          as: 'productos',
          attributes: ['id']     // Solo trae el ID para contar
        }
      ]
    });
    
    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }
    
    // Convierte a objeto plano y agrega el contador de productos
    const subcategoriaJSON = subcategoria.toJSON();
    subcategoriaJSON.totalProductos = subcategoriaJSON.productos.length;
    // Elimina el array de productos para no enviar la lista, solo el número
    delete subcategoriaJSON.productos;
    
    // Responde con la subcategoría
    res.json({
      success: true,
      data: {
        subcategoria: subcategoriaJSON
      }
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
 * Crear nueva subcategoría (admin)
 * 
 * Ruta: POST /api/admin/subcategorias
 * Body JSON: { nombre, descripcion, categoriaId }
 */
const crearSubcategoria = async (req, res) => {
  try {
    // Extrae los campos del body JSON
    const { nombre, descripcion, categoriaId } = req.body;
    
    // VALIDACIÓN 1: nombre y categoriaId son obligatorios
    if (!nombre || !categoriaId) {
      return res.status(400).json({
        success: false,
        message: 'El nombre y categoriaId son requeridos'
      });
    }
    
    // VALIDACIÓN 2: Verifica que la categoría padre exista
    const categoria = await Categoria.findByPk(categoriaId);
    
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: `No existe una categoría con ID ${categoriaId}`
      });
    }
    
    // VALIDACIÓN 3: La categoría padre debe estar activa
    if (!categoria.activo) {
      return res.status(400).json({
        success: false,
        message: `La categoría "${categoria.nombre}" está inactiva. Actívala primero`
      });
    }
    
    // VALIDACIÓN 4: No puede haber otra subcategoría con el mismo nombre en la misma categoría.
    // findOne busca si ya existe una con ese nombre Y categoriaId.
    const subcategoriaExistente = await Subcategoria.findOne({
      where: { nombre, categoriaId }
    });
    
    if (subcategoriaExistente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una subcategoría con el nombre "${nombre}" en esta categoría`
      });
    }
    
    // Crea el registro en la tabla Subcategoria (INSERT INTO Subcategoria ...)
    const nuevaSubcategoria = await Subcategoria.create({
      nombre,
      descripcion: descripcion || null,  // Null si no se envía
      categoriaId,                        // FK a la tabla Categoria
      activo: true                        // Se crea activa por defecto
    });
    
    // Recarga la subcategoría recién creada con los datos de su categoría padre
    const subcategoriaConCategoria = await Subcategoria.findByPk(nuevaSubcategoria.id, {
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre']
      }]
    });
    
    // 201 = Created
    res.status(201).json({
      success: true,
      message: 'Subcategoría creada exitosamente',
      data: {
        subcategoria: subcategoriaConCategoria
      }
    });
    
  } catch (error) {
    console.error('Error en crearSubcategoria:', error);
    
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
      message: 'Error al crear subcategoría',
      error: error.message
    });
  }
};

/**
 * Actualizar subcategoría existente (admin)
 * 
 * Ruta: PUT /api/admin/subcategorias/:id
 * Body JSON: { nombre, descripcion, categoriaId, activo }
 */
const actualizarSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;   // ID desde la URL
    const { nombre, descripcion, categoriaId, activo } = req.body;
    
    // Busca la subcategoría por su ID
    const subcategoria = await Subcategoria.findByPk(id);
    
    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }
    
    // VALIDACIÓN: Si se cambia la categoría padre, verifica que la nueva exista y esté activa
    if (categoriaId && categoriaId !== subcategoria.categoriaId) {
      const nuevaCategoria = await Categoria.findByPk(categoriaId);
      
      if (!nuevaCategoria) {
        return res.status(404).json({
          success: false,
          message: `No existe una categoría con ID ${categoriaId}`
        });
      }
      
      if (!nuevaCategoria.activo) {
        return res.status(400).json({
          success: false,
          message: `La categoría "${nuevaCategoria.nombre}" está inactiva`
        });
      }
    }
    
    // VALIDACIÓN: Si se cambia el nombre, verifica que no exista otra con ese nombre en la categoría.
    // Usa la nueva categoría si se envió, o la actual.
    if (nombre && nombre !== subcategoria.nombre) {
      const categoriaFinal = categoriaId || subcategoria.categoriaId;
      
      const subcategoriaConMismoNombre = await Subcategoria.findOne({
        where: { 
          nombre,
          categoriaId: categoriaFinal
        }
      });
      
      if (subcategoriaConMismoNombre) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una subcategoría con el nombre "${nombre}" en esta categoría`
        });
      }
    }
    
    // Actualiza SOLO los campos que se enviaron
    if (nombre !== undefined) subcategoria.nombre = nombre;
    if (descripcion !== undefined) subcategoria.descripcion = descripcion;
    if (categoriaId !== undefined) subcategoria.categoriaId = categoriaId;
    if (activo !== undefined) subcategoria.activo = activo;
    
    // save() ejecuta UPDATE en la BD. También dispara hooks del modelo.
    await subcategoria.save();
    
    // Recarga con los datos de la categoría padre actualizados
    await subcategoria.reload({
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre']
      }]
    });
    
    // Responde con la subcategoría actualizada
    res.json({
      success: true,
      message: 'Subcategoría actualizada exitosamente',
      data: {
        subcategoria
      }
    });
    
  } catch (error) {
    console.error('Error en actualizarSubcategoria:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar subcategoría',
      error: error.message
    });
  }
};

/**
 * Activar/Desactivar subcategoría (toggle) (admin)
 * 
 * Ruta: PATCH /api/admin/subcategorias/:id/toggle
 * 
 * IMPORTANTE: Al desactivar, el hook afterUpdate del modelo
 * desactiva en cascada todos los productos de esta subcategoría.
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
    
    // Invierte el estado activo: true → false, false → true
    const nuevoEstado = !subcategoria.activo;
    subcategoria.activo = nuevoEstado;
    
    // save() guarda y dispara el hook afterUpdate que desactiva productos en cascada
    await subcategoria.save();
    
    // Cuenta cuántos productos fueron afectados por el cambio
    const productosAfectados = await Producto.count({
      where: { subcategoriaId: id }
    });
    
    // Responde indicando el nuevo estado y productos afectados
    res.json({
      success: true,
      message: `Subcategoría ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
      data: {
        subcategoria,
        productosAfectados       // Cantidad de productos que cambiaron de estado
      }
    });
    
  } catch (error) {
    console.error('Error en toggleSubcategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de la subcategoría',
      error: error.message
    });
  }
};

/**
 * Eliminar subcategoría (admin)
 * 
 * Ruta: DELETE /api/admin/subcategorias/:id
 * Solo se puede eliminar si NO tiene productos asociados.
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
    
    // VALIDACIÓN: Cuenta productos asociados (integridad referencial)
    const productos = await Producto.count({
      where: { subcategoriaId: id }
    });
    
    // Si tiene productos, no se puede eliminar
    if (productos > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la subcategoría porque tiene ${productos} producto(s) asociado(s)`,
        sugerencia: 'Usa PATCH /api/admin/subcategorias/:id/toggle para desactivarla'
      });
    }
    
    // destroy() ejecuta DELETE FROM Subcategoria WHERE id = :id
    await subcategoria.destroy();
    
    res.json({
      success: true,
      message: 'Subcategoría eliminada exitosamente'
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
 * Obtener estadísticas de una subcategoría (admin)
 * 
 * Ruta: GET /api/admin/subcategorias/:id/stats
 * Retorna: productos (activos/inactivos), stock total y valor del inventario.
 */
const getEstadisticasSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca la subcategoría con su categoría padre
    const subcategoria = await Subcategoria.findByPk(id, {
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['id', 'nombre']
      }]
    });
    
    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: 'Subcategoría no encontrada'
      });
    }
    
    // Cuenta TODOS los productos de esta subcategoría
    const totalProductos = await Producto.count({
      where: { subcategoriaId: id }
    });
    
    // Cuenta solo los productos ACTIVOS
    const productosActivos = await Producto.count({
      where: { subcategoriaId: id, activo: true }
    });
    
    // Obtiene precio y stock de cada producto para calcular estadísticas de inventario
    const productos = await Producto.findAll({
      where: { subcategoriaId: id },
      attributes: ['precio', 'stock']    // Solo estos 2 campos
    });
    
    // Variables acumuladoras para las estadísticas
    let valorTotalInventario = 0;   // Suma de (precio × stock) de cada producto
    let stockTotal = 0;              // Suma de todo el stock
    
    // Recorre cada producto sumando al acumulador
    productos.forEach(producto => {
      valorTotalInventario += parseFloat(producto.precio) * producto.stock;
      stockTotal += producto.stock;
    });
    
    // Responde con todas las estadísticas calculadas
    res.json({
      success: true,
      data: {
        subcategoria: {
          id: subcategoria.id,
          nombre: subcategoria.nombre,
          activo: subcategoria.activo,
          categoria: subcategoria.categoria     // Datos de la categoría padre
        },
        estadisticas: {
          productos: {
            total: totalProductos,
            activos: productosActivos,
            inactivos: totalProductos - productosActivos
          },
          inventario: {
            stockTotal,
            // toFixed(2) formatea a 2 decimales
            valorTotal: valorTotalInventario.toFixed(2)
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getEstadisticasSubcategoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// Exporta todas las funciones del controlador para usarlas en las rutas de admin.
module.exports = {
  getSubcategorias,             // GET    /api/admin/subcategorias - Listar todas
  getSubcategoriaById,          // GET    /api/admin/subcategorias/:id - Ver una
  crearSubcategoria,            // POST   /api/admin/subcategorias - Crear nueva
  actualizarSubcategoria,       // PUT    /api/admin/subcategorias/:id - Actualizar
  toggleSubcategoria,           // PATCH  /api/admin/subcategorias/:id/toggle - Activar/Desactivar
  eliminarSubcategoria,         // DELETE /api/admin/subcategorias/:id - Eliminar
  getEstadisticasSubcategoria   // GET    /api/admin/subcategorias/:id/stats - Estadísticas
};
