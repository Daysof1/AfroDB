/**
 * ============================================
 * CONTROLADOR DE PRODUCTOS (Admin)
 * ============================================
 * CRUD completo de productos con subida de imágenes (Multer).
 * Incluye: listar, ver, crear, actualizar, toggle, eliminar, gestión de stock.
 * Solo accesible por administradores (protegido por middleware checkRole).
 * Las rutas están definidas en routes/admin.routes.js
 */

// Importa el modelo Producto desde models/Producto.js → tabla 'Producto'
const Producto = require('../models/Producto');

// Importa el modelo Categoria desde models/Categoria.js → tabla 'Categoria'
const Categoria = require('../models/Categoria');

// Importa el modelo Subcategoria desde models/Subcategoria.js → tabla 'Subcategoria'
const Subcategoria = require('../models/Subcategoria');

// 'path' es un módulo nativo de Node.js para manejar rutas de archivos.
// Se usa para construir la ruta completa de las imágenes en el disco.
const path = require('path');

// 'fs.promises' es el módulo nativo de Node.js para manejar archivos de forma asíncrona.
// Se usa para eliminar imágenes del disco (unlink).
const fs = require('fs').promises;

/**
 * Obtener todos los productos (admin)
 * 
 * Ruta: GET /api/admin/productos
 * Query params opcionales:
 * - categoriaId, subcategoriaId: Filtrar por categoría/subcategoría
 * - activo: 'true'/'false'
 * - conStock: 'true' → solo productos con stock > 0
 * - buscar: texto para buscar en nombre o descripción
 * - pagina, limite: Paginación
 */
const getProductos = async (req, res) => {
  try {
    // Extrae todos los filtros y datos de paginación de los query params
    const { 
      categoriaId, 
      subcategoriaId, 
      activo, 
      conStock,
      buscar,
      pagina = 1,       // Página actual (default: 1)
      limite = 100       // Registros por página (default: 100)
    } = req.query;
    
    // Construye el objeto WHERE dinámicamente según los filtros recibidos
    const where = {};
    if (categoriaId) where.categoriaId = categoriaId;           // Filtra por categoría
    if (subcategoriaId) where.subcategoriaId = subcategoriaId;  // Filtra por subcategoría
    if (activo !== undefined) where.activo = activo === 'true';  // Convierte string a boolean
    // Op.gt = greater than (>). stock > 0
    if (conStock === 'true') where.stock = { [require('sequelize').Op.gt]: 0 };
    
    // Búsqueda por texto en nombre o descripción
    if (buscar) {
      const { Op } = require('sequelize');
      // Op.or: busca en nombre O descripción
      // Op.like: equivale a LIKE en SQL
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { descripcion: { [Op.like]: `%${buscar}%` } }
      ];
    }
    
    // Calcula el offset para paginación (cuántos registros saltar)
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    
    // Opciones completas de la consulta Sequelize
    const opciones = {
      where,                    // Filtros construidos arriba
      include: [                // JOINs con tablas relacionadas
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']     // Solo trae id y nombre de la categoría
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre']     // Solo trae id y nombre de la subcategoría
        }
      ],
      limit: parseInt(limite),  // Máximo de registros
      offset,                   // Registros a saltar
      order: [['nombre', 'ASC']]  // Ordenar alfabéticamente A-Z
    };
    
    // findAndCountAll retorna { count: total, rows: registros de esta página }
    const { count, rows: productos } = await Producto.findAndCountAll(opciones);
    
    // Responde con los productos y la información de paginación
    res.json({
      success: true,
      data: {
        productos,
        paginacion: {
          total: count,                     // Total de productos que coinciden
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(count / parseInt(limite))  // Redondea hacia arriba
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
 * Obtener un producto por ID (admin)
 * 
 * Ruta: GET /api/admin/productos/:id
 * Retorna el producto con su categoría y subcategoría.
 */
const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;  // ID del producto desde la URL
    
    // findByPk busca por Primary Key (clave primaria = id)
    // include hace JOINs con Categoria y Subcategoria
    const producto = await Producto.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre', 'activo']   // Incluye si está activa
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre', 'activo']
        }
      ]
    });
    
    // Si no existe el producto
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
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
 * Crear nuevo producto (admin)
 * 
 * Ruta: POST /api/admin/productos
 * Body (multipart/form-data) porque puede incluir imagen:
 * - nombre (requerido), descripcion, precio (requerido), stock (requerido)
 * - categoriaId (requerido), subcategoriaId (requerido)
 * - imagen (archivo opcional - procesado por Multer middleware)
 */
const crearProducto = async (req, res) => {
  try {
    // Extrae los campos del body. Con multipart/form-data (por Multer), los campos
    // de texto vienen en req.body y el archivo en req.file.
    const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;
    
    // VALIDACIÓN 1: Verifica que todos los campos obligatorios estén presentes
    if (!nombre || !precio || !categoriaId || !subcategoriaId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, precio, categoriaId y subcategoriaId'
      });
    }
    
    // VALIDACIÓN 2: Verifica que la categoría exista y esté activa
    const categoria = await Categoria.findByPk(categoriaId);
    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: `No existe una categoría con ID ${categoriaId}`
      });
    }
    if (!categoria.activo) {
      return res.status(400).json({
        success: false,
        message: `La categoría "${categoria.nombre}" está inactiva`
      });
    }
    
    // VALIDACIÓN 3: Verifica que la subcategoría exista, esté activa y pertenezca a la categoría
    const subcategoria = await Subcategoria.findByPk(subcategoriaId);
    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: `No existe una subcategoría con ID ${subcategoriaId}`
      });
    }
    if (!subcategoria.activo) {
      return res.status(400).json({
        success: false,
        message: `La subcategoría "${subcategoria.nombre}" está inactiva`
      });
    }
    // Verifica que la subcategoría pertenezca a la categoría seleccionada
    if (subcategoria.categoriaId !== parseInt(categoriaId)) {
      return res.status(400).json({
        success: false,
        message: `La subcategoría "${subcategoria.nombre}" no pertenece a la categoría seleccionada`
      });
    }
    
    // VALIDACIÓN 4: Precio debe ser mayor a 0
    if (parseFloat(precio) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }
    // Stock no puede ser negativo
    if (parseInt(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      });
    }
    
    // Si se subió una imagen, Multer la guarda en uploads/ y pone los datos en req.file.
    // req.file.filename es el nombre generado por Multer (ej: "producto_1719344567890_abc12.jpg")
    const imagen = req.file ? req.file.filename : null;
    
    // Crea el registro en la tabla Producto (INSERT INTO Producto ...)
    const nuevoProducto = await Producto.create({
      nombre,
      descripcion: descripcion || null,            // Null si no se envía
      precio: parseFloat(precio),                   // Convierte a número decimal
      stock: parseInt(stock) || 0,                  // Convierte a entero, default 0
      categoriaId: parseInt(categoriaId),           // FK a la tabla Categoria
      subcategoriaId: parseInt(subcategoriaId),     // FK a la tabla Subcategoria
      imagen,                                       // Nombre del archivo o null
      activo: true                                   // Se crea activo por defecto
    });
    
    // Recarga el producto con sus relaciones (categoría y subcategoría)
    await nuevoProducto.reload({
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] }
      ]
    });
    
    // 201 = Created
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        producto: nuevoProducto
      }
    });
    
  } catch (error) {
    console.error('Error en crearProducto:', error);
    
    // Si ocurrió un error y se había subido una imagen, la elimina del disco
    // para no dejar archivos huérfanos.
    if (req.file) {
      // path.join() construye la ruta completa: __dirname (directorio actual) + ../uploads + nombre
      const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
      try {
        await fs.unlink(rutaImagen);    // Elimina el archivo del disco
      } catch (err) {
        console.error('Error al eliminar imagen:', err);
      }
    }
    
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
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

/**
 * Actualizar producto existente (admin)
 * 
 * Ruta: PUT /api/admin/productos/:id
 * Body (multipart/form-data):
 * - nombre, descripcion, precio, stock, categoriaId, subcategoriaId, activo
 * - imagen (archivo opcional - si se envía, reemplaza la anterior)
 */
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;   // ID del producto desde la URL
    const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId, activo } = req.body;
    
    // Busca el producto existente por su ID
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // VALIDACIÓN: Si se cambia la categoría, verifica que exista y esté activa
    if (categoriaId && categoriaId !== producto.categoriaId) {
      const categoria = await Categoria.findByPk(categoriaId);
      if (!categoria || !categoria.activo) {
        return res.status(400).json({
          success: false,
          message: 'Categoría inválida o inactiva'
        });
      }
    }
    
    // VALIDACIÓN: Si se cambia la subcategoría, verifica que exista, esté activa
    // y pertenezca a la categoría (nueva o actual)
    if (subcategoriaId && subcategoriaId !== producto.subcategoriaId) {
      const subcategoria = await Subcategoria.findByPk(subcategoriaId);
      if (!subcategoria || !subcategoria.activo) {
        return res.status(400).json({
          success: false,
          message: 'Subcategoría inválida o inactiva'
        });
      }
      
      // Usa la nueva categoría si se envió, o la actual del producto
      const catId = categoriaId || producto.categoriaId;
      if (subcategoria.categoriaId !== parseInt(catId)) {
        return res.status(400).json({
          success: false,
          message: 'La subcategoría no pertenece a la categoría seleccionada'
        });
      }
    }
    
    // Validaciones de precio y stock
    if (precio && parseFloat(precio) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }
    if (stock && parseInt(stock) < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock no puede ser negativo'
      });
    }
    
    // Si se subió una nueva imagen, reemplaza la anterior
    if (req.file) {
      // Si el producto ya tenía una imagen, la elimina del disco
      if (producto.imagen) {
        const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen);
        try {
          await fs.unlink(rutaImagenAnterior);   // Elimina el archivo anterior
        } catch (err) {
          console.error('Error al eliminar imagen anterior:', err);
        }
      }
      // Asigna el nombre de la nueva imagen
      producto.imagen = req.file.filename;
    }
    
    // Actualiza SOLO los campos que se enviaron (si no se envían, no cambian)
    if (nombre !== undefined) producto.nombre = nombre;
    if (descripcion !== undefined) producto.descripcion = descripcion;
    if (precio !== undefined) producto.precio = parseFloat(precio);
    if (stock !== undefined) producto.stock = parseInt(stock);
    if (categoriaId !== undefined) producto.categoriaId = parseInt(categoriaId);
    if (subcategoriaId !== undefined) producto.subcategoriaId = parseInt(subcategoriaId);
    if (activo !== undefined) producto.activo = activo;
    
    // save() ejecuta UPDATE en la BD
    await producto.save();
    
    // Recarga el producto con sus relaciones actualizadas
    await producto.reload({
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] }
      ]
    });
    
    // Responde con el producto actualizado
    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        producto
      }
    });
    
  } catch (error) {
    console.error('Error en actualizarProducto:', error);
    
    // Si hubo error y se subió una nueva imagen, la elimina para no dejar archivos huérfanos
    if (req.file) {
      const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
      try {
        await fs.unlink(rutaImagen);
      } catch (err) {
        console.error('Error al eliminar imagen:', err);
      }
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

/**
 * Activar/Desactivar producto (toggle) (admin)
 * 
 * Ruta: PATCH /api/admin/productos/:id/toggle
 * Invierte el estado activo del producto.
 */
const toggleProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Busca el producto por ID
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Invierte el estado: true → false, false → true
    producto.activo = !producto.activo;
    await producto.save();
    
    // Responde indicando el nuevo estado
    res.json({
      success: true,
      message: `Producto ${producto.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        producto
      }
    });
    
  } catch (error) {
    console.error('Error en toggleProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del producto',
      error: error.message
    });
  }
};

/**
 * Eliminar producto (admin)
 * 
 * Ruta: DELETE /api/admin/productos/:id
 * Elimina el producto de la BD. El hook beforeDestroy del modelo
 * se encarga de eliminar la imagen del disco automáticamente.
 */
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // destroy() ejecuta DELETE FROM Producto WHERE id = :id
    // El hook beforeDestroy del modelo elimina la imagen del disco automáticamente.
    await producto.destroy();
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en eliminarProducto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

/**
 * Actualizar stock de un producto (admin)
 * 
 * Ruta: PATCH /api/admin/productos/:id/stock
 * Body JSON: { cantidad, operacion: 'aumentar' | 'reducir' | 'establecer' }
 * 
 * - aumentar: suma la cantidad al stock actual
 * - reducir: resta la cantidad del stock actual
 * - establecer: reemplaza el stock con la cantidad dada
 */
const actualizarStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, operacion } = req.body;   // Datos del body JSON
    
    // Valida que se enviaron ambos campos
    if (!cantidad || !operacion) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere cantidad y operación'
      });
    }
    
    // Convierte la cantidad a número entero
    const cantidadNum = parseInt(cantidad);
    if (cantidadNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad no puede ser negativa'
      });
    }
    
    // Busca el producto por ID
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    let nuevoStock;   // Variable para almacenar el stock resultante
    
    // Según la operación, calcula el nuevo stock
    switch (operacion) {
      case 'aumentar':
        // aumentarStock() es un método del modelo Producto que suma cantidades
        nuevoStock = producto.aumentarStock(cantidadNum);
        break;
      case 'reducir':
        // Verifica que haya suficiente stock antes de reducir
        if (cantidadNum > producto.stock) {
          return res.status(400).json({
            success: false,
            message: `No hay suficiente stock. Stock actual: ${producto.stock}`
          });
        }
        // reducirStock() es un método del modelo Producto que resta cantidades
        nuevoStock = producto.reducirStock(cantidadNum);
        break;
      case 'establecer':
        // Simplemente establece el valor directamente
        nuevoStock = cantidadNum;
        break;
      default:
        // Si la operación no es válida
        return res.status(400).json({
          success: false,
          message: 'Operación inválida. Usa: aumentar, reducir o establecer'
        });
    }
    
    // Asigna el nuevo stock y guarda en la BD
    producto.stock = nuevoStock;
    await producto.save();
    
    // Responde con el resultado de la operación
    res.json({
      success: true,
      // Ternario anidado para personalizar el mensaje según la operación
      message: `Stock ${operacion === 'aumentar' ? 'aumentado' : operacion === 'reducir' ? 'reducido' : 'establecido'} exitosamente`,
      data: {
        productoId: producto.id,
        nombre: producto.nombre,
        // Calcula el stock anterior según la operación realizada (null para 'establecer')
        stockAnterior: operacion === 'establecer' ? null : (operacion === 'aumentar' ? producto.stock - cantidadNum : producto.stock + cantidadNum),
        stockNuevo: producto.stock
      }
    });
    
  } catch (error) {
    console.error('Error en actualizarStock:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar stock',
      error: error.message
    });
  }
};

// Exporta todas las funciones del controlador para usarlas en las rutas de admin.
module.exports = {
  getProductos,          // GET    /api/admin/productos - Listar todos
  getProductoById,       // GET    /api/admin/productos/:id - Ver uno
  crearProducto,         // POST   /api/admin/productos - Crear nuevo
  actualizarProducto,    // PUT    /api/admin/productos/:id - Actualizar
  toggleProducto,        // PATCH  /api/admin/productos/:id/toggle - Activar/Desactivar
  eliminarProducto,      // DELETE /api/admin/productos/:id - Eliminar
  actualizarStock        // PATCH  /api/admin/productos/:id/stock - Gestionar stock
};
