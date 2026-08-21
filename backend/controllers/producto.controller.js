/**
 * ============================================
 * CONTROLADOR DE PRODUCTOS (Admin)
 * ============================================
 * CRUD completo de productos con subida de imágenes (Multer).
 * Incluye: listar, ver, crear, actualizar, toggle, eliminar, gestión de stock.
 * Solo accesible por administradores (protegido por middleware checkRole).
 * Las rutas están definidas en routes/admin.routes.js
 */

const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const path = require('node:path');
const fs = require('node:fs').promises;
const { downloadImage, deleteFile, safeLog } = require('../config/multer');

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────

const validarUrlImagen = (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error('URL inválida');
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error(`URL inválida: ${error.message}`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Protocolo no permitido');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const blockedHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
  if (blockedHosts.has(hostname)) {
    throw new Error('Acceso a localhost no permitido');
  }

  const privateIpRegex = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/;
  if (privateIpRegex.test(hostname)) {
    throw new Error('Acceso a IP privada no permitido');
  }

  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const pathname = parsedUrl.pathname.toLowerCase();
  const tieneExtension = pathname.includes('.') && pathname.lastIndexOf('.') > pathname.lastIndexOf('/');
  if (tieneExtension && !validExtensions.some(ext => pathname.endsWith(ext))) {
    throw new Error('La URL no apunta a una imagen con extensión válida');
  }

  return url;
};

const buildProductoWhere = (filtros) => {
  const { Op } = require('sequelize');
  const { categoriaId, subcategoriaId, activo, conStock, buscar } = filtros;
  
  const where = {};
  if (categoriaId) where.categoriaId = categoriaId;
  if (subcategoriaId) where.subcategoriaId = subcategoriaId;
  if (activo !== undefined) where.activo = activo === 'true';
  if (conStock === 'true') where.stock = { [Op.gt]: 0 };
  
  if (buscar) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { descripcion: { [Op.like]: `%${buscar}%` } }
    ];
  }
  
  return where;
};

const getPaginacionParams = (pagina, limite) => {
  const pageNum = Number.parseInt(pagina, 10);
  const limitNum = Number.parseInt(limite, 10);
  const offset = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, offset };
};

const validarCategoria = async (categoriaId, categoriaActual) => {
  if (categoriaId === undefined || categoriaId === '') {
    return undefined;
  }

  const parsedCategoriaId = Number.parseInt(categoriaId, 10);
  if (parsedCategoriaId === categoriaActual) {
    return parsedCategoriaId;
  }

  const categoria = await Categoria.findByPk(parsedCategoriaId);
  if (!categoria?.activo) {
    throw new Error('Categoría inválida o inactiva');
  }

  return parsedCategoriaId;
};

const validarSubcategoria = async (subcategoriaId, categoriaId, categoriaActual, subcategoriaActual) => {
  if (subcategoriaId === undefined || subcategoriaId === '') {
    return undefined;
  }

  const parsedSubcategoriaId = Number.parseInt(subcategoriaId, 10);
  if (parsedSubcategoriaId === subcategoriaActual) {
    return parsedSubcategoriaId;
  }

  const subcategoria = await Subcategoria.findByPk(parsedSubcategoriaId);
  if (!subcategoria?.activo) {
    throw new Error('Subcategoría inválida o inactiva');
  }

  const catId = categoriaId !== undefined && categoriaId !== '' 
    ? Number.parseInt(categoriaId, 10) 
    : categoriaActual;
    
  if (subcategoria.categoriaId !== catId) {
    throw new Error('La subcategoría no pertenece a la categoría seleccionada');
  }

  return parsedSubcategoriaId;
};

const validarPrecio = (precio) => {
  const precioNum = Number.parseFloat(precio);
  if (precioNum <= 0) {
    throw new Error('El precio debe ser mayor a 0');
  }
  return precioNum;
};

const validarStock = (stock) => {
  const stockNum = Number.parseInt(stock, 10);
  if (stockNum < 0) {
    throw new Error('El stock no puede ser negativo');
  }
  return stockNum;
};

const limpiarImagenEnError = async (filename) => {
  if (filename) {
    try {
      deleteFile(filename);
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
    }
  }
};

const manejarImagenProducto = async (req, producto, imagenAnterior) => {
  let downloadedNewImage = null;

  if (req.file) {
    producto.imagen = req.file.filename;
    if (imagenAnterior && imagenAnterior !== producto.imagen) {
      await limpiarImagenEnError(imagenAnterior);
    }
  } else if (req.body?.imagenUrl) {
    try {
      const imagenUrlStr = String(req.body.imagenUrl || '');
      if (!imagenAnterior || !imagenUrlStr.includes(imagenAnterior)) {
        const imagenUrl = validarUrlImagen(imagenUrlStr);
        const filename = await downloadImage(imagenUrl, producto.nombre || 'imagen');
        downloadedNewImage = filename;
        producto.imagen = filename;
        if (imagenAnterior && imagenAnterior !== filename) {
          await limpiarImagenEnError(imagenAnterior);
        }
      }
    } catch (err) {
      console.error('Error al descargar imagen remota:', safeLog(err.message));
      // Continuar sin imagen (no lanzar error)
    }
  }

  return downloadedNewImage;
};

const actualizarCamposProducto = (producto, campos) => {
  const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId, activo } = campos;
  
  if (nombre !== undefined) producto.nombre = nombre;
  if (descripcion !== undefined) producto.descripcion = descripcion;
  if (precio !== undefined) producto.precio = precio;
  if (stock !== undefined) producto.stock = stock;
  if (categoriaId !== undefined) producto.categoriaId = categoriaId;
  if (subcategoriaId !== undefined) producto.subcategoriaId = subcategoriaId;
  if (activo !== undefined) producto.activo = activo;
};

// ─────────────────────────────────────────────────────────────
// GET: Obtener todos los productos
// ─────────────────────────────────────────────────────────────

const getProductos = async (req, res) => {
  try {
    const { 
      categoriaId, 
      subcategoriaId, 
      activo, 
      conStock,
      buscar,
      pagina = 1,
      limite = 100
    } = req.query;
    
    const where = buildProductoWhere({ categoriaId, subcategoriaId, activo, conStock, buscar });
    const { pageNum, limitNum, offset } = getPaginacionParams(pagina, limite);
    
    const { count, rows: productos } = await Producto.findAndCountAll({
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
      limit: limitNum,
      offset,
      order: [['nombre', 'ASC']]
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

// ─────────────────────────────────────────────────────────────
// GET: Obtener producto por ID
// ─────────────────────────────────────────────────────────────

const getProductoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await Producto.findByPk(id, {
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre', 'activo']
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre', 'activo']
        }
      ]
    });
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
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

// ─────────────────────────────────────────────────────────────
// POST: Crear producto
// ─────────────────────────────────────────────────────────────

const crearProducto = async (req, res) => {
  let downloadedImagen = null;
  
  try {
    const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;
    
    if (!nombre || !precio || !categoriaId || !subcategoriaId) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, precio, categoriaId y subcategoriaId'
      });
    }
    
    validarCategoria(categoriaId);
    validarSubcategoria(subcategoriaId, categoriaId);
    const precioNum = validarPrecio(precio);
    const stockNum = validarStock(stock);
    
    let imagen = null;
    if (req.file) {
      imagen = req.file.filename;
    } else if (req.body?.imagenUrl) {
      try {
        const imagenUrl = validarUrlImagen(req.body.imagenUrl);
        downloadedImagen = await downloadImage(imagenUrl, nombre);
        imagen = downloadedImagen;
      } catch (err) {
        throw new Error(`No se pudo descargar la imagen remota: ${safeLog(err.message)}`);
      }
    }
    
    const nuevoProducto = await Producto.create({
      nombre,
      descripcion: descripcion || null,
      precio: precioNum,
      stock: stockNum,
      categoriaId: Number.parseInt(categoriaId, 10),
      subcategoriaId: Number.parseInt(subcategoriaId, 10),
      imagen,
      activo: true
    });
    
    await nuevoProducto.reload({
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
        { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: { producto: nuevoProducto }
    });
    
  } catch (error) {
    console.error('Error en crearProducto:', error);
    
    if (req.file) {
      await limpiarImagenEnError(req.file.filename);
    }
    if (downloadedImagen) {
      await limpiarImagenEnError(downloadedImagen);
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
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT: Actualizar producto
// ─────────────────────────────────────────────────────────────

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId, activo } = req.body;
    
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Validar categoría y subcategoría
    try {
      const parsedCategoriaId = await validarCategoria(categoriaId, producto.categoriaId);
      const parsedSubcategoriaId = await validarSubcategoria(
        subcategoriaId, 
        categoriaId, 
        producto.categoriaId, 
        producto.subcategoriaId
      );
      
      // Validar precio y stock
      let precioNum, stockNum;
      if (precio !== undefined) {
        precioNum = validarPrecio(precio);
      }
      if (stock !== undefined) {
        stockNum = validarStock(stock);
      }

      const imagenAnterior = producto.imagen;
      
      // Manejar imagen
      await manejarImagenProducto(req, producto, imagenAnterior);
      
      // Actualizar campos
      actualizarCamposProducto(producto, {
        nombre,
        descripcion,
        precio: precioNum,
        stock: stockNum,
        categoriaId: parsedCategoriaId,
        subcategoriaId: parsedSubcategoriaId,
        activo
      });
      
      await producto.save();
      
      await producto.reload({
        include: [
          { model: Categoria, as: 'categoria', attributes: ['id', 'nombre'] },
          { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre'] }
        ]
      });
      
      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: { producto }
      });

    } catch (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError.message
      });
    }
    
  } catch (error) {
    console.error('Error en actualizarProducto:', error);
    
    if (req.file) {
      await limpiarImagenEnError(req.file.filename);
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

// ─────────────────────────────────────────────────────────────
// PATCH: Toggle producto
// ─────────────────────────────────────────────────────────────

const toggleProducto = async (req, res) => {
  try {
    const { id } = req.params;
    
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    producto.activo = !producto.activo;
    await producto.save();
    
    res.json({
      success: true,
      message: `Producto ${producto.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: { producto }
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

// ─────────────────────────────────────────────────────────────
// DELETE: Eliminar producto
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// PATCH: Actualizar stock
// ─────────────────────────────────────────────────────────────

const actualizarStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad, operacion } = req.body;
    
    if (!cantidad || !operacion) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere cantidad y operación'
      });
    }
    
    const cantidadNum = Number.parseInt(cantidad, 10);
    if (cantidadNum < 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad no puede ser negativa'
      });
    }
    
    const producto = await Producto.findByPk(id);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    let nuevoStock;
    let mensajeOperacion;
    
    switch (operacion) {
      case 'aumentar':
        nuevoStock = producto.aumentarStock(cantidadNum);
        mensajeOperacion = 'aumentado';
        break;
      case 'reducir':
        if (cantidadNum > producto.stock) {
          return res.status(400).json({
            success: false,
            message: `No hay suficiente stock. Stock actual: ${producto.stock}`
          });
        }
        nuevoStock = producto.reducirStock(cantidadNum);
        mensajeOperacion = 'reducido';
        break;
      case 'establecer':
        nuevoStock = cantidadNum;
        mensajeOperacion = 'establecido';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Operación inválida. Usa: aumentar, reducir o establecer'
        });
    }
    
    producto.stock = nuevoStock;
    await producto.save();
    
    let stockAnterior;
    if (operacion === 'establecer') {
      stockAnterior = null;
    } else if (operacion === 'aumentar') {
      stockAnterior = producto.stock - cantidadNum;
    } else {
      stockAnterior = producto.stock + cantidadNum;
    }
    
    res.json({
      success: true,
      message: `Stock ${mensajeOperacion} exitosamente`,
      data: {
        productoId: producto.id,
        nombre: producto.nombre,
        stockAnterior,
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

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  getProductos,
  getProductoById,
  crearProducto,
  actualizarProducto,
  toggleProducto,
  eliminarProducto,
  actualizarStock
};