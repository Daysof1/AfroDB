/**
 * ============================================
 * CONTROLADOR DE CARRITO DE COMPRAS
 * ============================================
 * Gestiona el carrito de compras de cada cliente.
 * Todas las funciones requieren autenticación (middleware verificarAuth).
 * Es usado por las rutas definidas en routes/cliente.routes.js.
 */

const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

// ==========================================
// FUNCIÓN AUXILIAR PARA CALCULAR TOTAL
// ==========================================

/**
 * Calcula el total del carrito sumando (precioUnitario * cantidad) de cada item
 */
const calcularTotalCarrito = (items) => {
  let total = 0;
  items.forEach(item => {
    total += Number.parseFloat(item.precioUnitario) * item.cantidad;
  });
  return total;
};

/**
 * Función auxiliar para validar cantidad
 */
const validarCantidad = (cantidad) => {
  const cantidadNum = Number.parseInt(cantidad, 10);
  if (Number.isNaN(cantidadNum) || cantidadNum < 1) {
    return { valid: false, value: null, error: 'La cantidad debe ser un número mayor o igual a 1' };
  }
  return { valid: true, value: cantidadNum, error: null };
};

// ==========================================
// GET: Obtener carrito del usuario
// ==========================================

/**
 * Obtener carrito del usuario autenticado
 * Ruta: GET /api/cliente/carrito
 */
const getCarrito = async (req, res) => {
  try {
    const itemsCarrito = await Carrito.findAll({
      where: { usuarioId: req.usuario.id },
      include: [
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
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
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });
    
    const total = calcularTotalCarrito(itemsCarrito);
    
    res.json({
      success: true,
      data: {
        items: itemsCarrito,
        resumen: {
          totalItems: itemsCarrito.length,
          cantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
          total: total.toFixed(2)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito',
      error: error.message
    });
  }
};

// ==========================================
// POST: Agregar producto al carrito
// ==========================================

/**
 * Agregar producto al carrito
 * Ruta: POST /api/cliente/carrito
 * Body: { productoId, cantidad }
 */
const agregarAlCarrito = async (req, res) => {
  try {
    const { productoId, cantidad = 1 } = req.body;
    
    // Validar productoId
    if (!productoId) {
      return res.status(400).json({
        success: false,
        message: 'El productoId es requerido'
      });
    }
    
    // Validar cantidad
    const cantidadValidation = validarCantidad(cantidad);
    if (!cantidadValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cantidadValidation.error
      });
    }
    
    const cantidadNum = cantidadValidation.value;
    
    // Buscar producto
    const producto = await Producto.findByPk(productoId);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    if (!producto.activo) {
      return res.status(400).json({
        success: false,
        message: 'El producto no está disponible'
      });
    }
    
    // Verificar si el producto ya está en el carrito
    const itemExistente = await Carrito.findOne({
      where: {
        usuarioId: req.usuario.id,
        productoId
      }
    });
    
    // Si ya existe, actualizar cantidad
    if (itemExistente) {
      const nuevaCantidad = itemExistente.cantidad + cantidadNum;
      
      if (nuevaCantidad > producto.stock) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Disponible: ${producto.stock}, En carrito: ${itemExistente.cantidad}`
        });
      }
      
      itemExistente.cantidad = nuevaCantidad;
      await itemExistente.save();
      
      await itemExistente.reload({
        include: [{
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
        }]
      });
      
      return res.json({
        success: true,
        message: 'Cantidad actualizada en el carrito',
        data: { item: itemExistente }
      });
    }
    
    // Verificar stock para nuevo item
    if (cantidadNum > producto.stock) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${producto.stock}`
      });
    }
    
    // Crear nuevo item
    const nuevoItem = await Carrito.create({
      usuarioId: req.usuario.id,
      productoId,
      cantidad: cantidadNum,
      precioUnitario: producto.precio
    });
    
    await nuevoItem.reload({
      include: [{
        model: Producto,
        as: 'producto',
        attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
      }]
    });
    
    res.status(201).json({
      success: true,
      message: 'Producto agregado al carrito',
      data: { item: nuevoItem }
    });
    
  } catch (error) {
    console.error('Error en agregarAlCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto al carrito',
      error: error.message
    });
  }
};

// ==========================================
// PUT: Actualizar cantidad de un item
// ==========================================

/**
 * Actualizar cantidad de un item del carrito
 * Ruta: PUT /api/cliente/carrito/:id
 * Body: { cantidad }
 */
const actualizarItemCarrito = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;
    
    const cantidadValidation = validarCantidad(cantidad);
    if (!cantidadValidation.valid) {
      return res.status(400).json({
        success: false,
        message: cantidadValidation.error
      });
    }
    
    const cantidadNum = cantidadValidation.value;
    
    const item = await Carrito.findOne({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      include: [{
        model: Producto,
        as: 'producto',
        attributes: ['id', 'nombre', 'precio', 'stock']
      }]
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }
    
    if (cantidadNum > item.producto.stock) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${item.producto.stock}`
      });
    }
    
    item.cantidad = cantidadNum;
    await item.save();
    
    res.json({
      success: true,
      message: 'Cantidad actualizada',
      data: { item }
    });
    
  } catch (error) {
    console.error('Error en actualizarItemCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar item del carrito',
      error: error.message
    });
  }
};

// ==========================================
// DELETE: Eliminar un item del carrito
// ==========================================

/**
 * Eliminar un item del carrito
 * Ruta: DELETE /api/cliente/carrito/:id
 */
const eliminarItemCarrito = async (req, res) => {
  try {
    const { id } = req.params;
    
    const item = await Carrito.findOne({
      where: {
        id,
        usuarioId: req.usuario.id
      }
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }
    
    await item.destroy();
    
    res.json({
      success: true,
      message: 'Producto eliminado del carrito'
    });
    
  } catch (error) {
    console.error('Error en eliminarItemCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar item del carrito',
      error: error.message
    });
  }
};

// ==========================================
// DELETE: Vaciar el carrito
// ==========================================

/**
 * Vaciar el carrito
 * Ruta: DELETE /api/cliente/carrito
 */
const vaciarCarrito = async (req, res) => {
  try {
    const itemsEliminados = await Carrito.destroy({
      where: { usuarioId: req.usuario.id }
    });
    
    res.json({
      success: true,
      message: 'Carrito vaciado',
      data: {
        itemsEliminados
      }
    });
    
  } catch (error) {
    console.error('Error en vaciarCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito',
      error: error.message
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getCarrito,
  agregarAlCarrito,
  actualizarItemCarrito,
  eliminarItemCarrito,
  vaciarCarrito
};