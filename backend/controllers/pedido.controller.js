/**
 * ============================================
 * CONTROLADOR DE PEDIDOS
 * ============================================
 * Gestiona el proceso de compra (checkout), consulta y cancelación de pedidos.
 * Funciones de CLIENTE: crear pedido, ver mis pedidos, cancelar.
 * Funciones de ADMIN: ver todos los pedidos, cambiar estado, estadísticas.
 * Requiere autenticación (token JWT en todas las rutas).
 */

const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────

const METODOS_PAGO_VALIDOS = ['efectivo', 'tarjeta', 'transferencia'];
const ESTADOS_VALIDOS = ['pendiente', 'en_proceso', 'enviado', 'entregado', 'cancelado'];

const validarMetodoPago = (metodoPago) => {
  return METODOS_PAGO_VALIDOS.includes(metodoPago);
};

const validarEstado = (estado) => {
  return ESTADOS_VALIDOS.includes(estado);
};

const calcularTotalPedido = (items) => {
  let total = 0;
  for (const item of items) {
    total += Number.parseFloat(item.precioUnitario) * item.cantidad;
  }
  return total;
};

const validarItemsCarrito = (items) => {
  const errores = [];
  for (const item of items) {
    const producto = item.producto;
    if (!producto.activo) {
      errores.push(`${producto.nombre} ya no está disponible`);
      continue;
    }
    if (item.cantidad > producto.stock) {
      errores.push(
        `${producto.nombre}: stock insuficiente (disponible: ${producto.stock}, solicitado: ${item.cantidad})`
      );
    }
  }
  return errores;
};

const getPaginacionParams = (pagina, limite) => {
  const pageNum = Number.parseInt(pagina, 10);
  const limitNum = Number.parseInt(limite, 10);
  const offset = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, offset };
};

// ─────────────────────────────────────────────────────────────
// CREAR PEDIDO (CLIENTE)
// ─────────────────────────────────────────────────────────────

const crearPedido = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();
  
  try {
    const { direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;
    
    if (!direccionEnvio || direccionEnvio.trim() === '') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'La dirección de envío es requerida'
      });
    }
    
    if (!telefono || telefono.trim() === '') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El teléfono es requerido'
      });
    }
    
    if (!validarMetodoPago(metodoPago)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Método de pago inválido. Opciones: ${METODOS_PAGO_VALIDOS.join(', ')}`
      });
    }
    
    const itemsCarrito = await Carrito.findAll({
      where: { usuarioId: req.usuario.id },
      include: [{
        model: Producto,
        as: 'producto',
        attributes: ['id', 'nombre', 'precio', 'stock', 'activo']
      }],
      transaction: t
    });
    
    if (itemsCarrito.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }
    
    const erroresValidacion = validarItemsCarrito(itemsCarrito);
    const totalPedido = calcularTotalPedido(itemsCarrito);
    
    if (erroresValidacion.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Error en validación del carrito',
        errores: erroresValidacion
      });
    }
    
    const pedido = await Pedido.create({
      usuarioId: req.usuario.id,
      total: totalPedido,
      estado: 'pendiente',
      direccionEnvio,
      telefono,
      metodoPago,
      notas: notasAdicionales || null
    }, { transaction: t });
    
    for (const item of itemsCarrito) {
      const producto = item.producto;
      
      await DetallePedido.create({
        pedidoId: pedido.id,
        productoId: producto.id,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: Number.parseFloat(item.precioUnitario) * item.cantidad
      }, { transaction: t });
      
      producto.stock -= item.cantidad;
      await producto.save({ transaction: t });
    }
    
    await Carrito.destroy({
      where: { usuarioId: req.usuario.id },
      transaction: t
    });
    
    await t.commit();
    
    await pedido.reload({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'precio', 'imagen']
          }]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: { pedido }
    });
    
  } catch (error) {
    await t.rollback();
    console.error('Error en crearPedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear pedido',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// OBTENER MIS PEDIDOS (CLIENTE)
// ─────────────────────────────────────────────────────────────

const getMisPedidos = async (req, res) => {
  try {
    const { estado, pagina = 1, limite = 10 } = req.query;
    
    const where = { usuarioId: req.usuario.id };
    if (estado) where.estado = estado;
    
    const { pageNum, limitNum, offset } = getPaginacionParams(pagina, limite);
    
    const { count, rows: pedidos } = await Pedido.findAndCountAll({
      where,
      include: [
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'imagen']
          }]
        }
      ],
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        pedidos,
        paginacion: {
          total: count,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(count / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getMisPedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// OBTENER PEDIDO POR ID (CLIENTE / ADMIN)
// ─────────────────────────────────────────────────────────────

const getPedidoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const where = { id };
    if (req.usuario.rol !== 'administrador') {
      where.usuarioId = req.usuario.id;
    }
    
    const pedido = await Pedido.findOne({
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'descripcion', 'precio', 'imagen'],
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
          }]
        }
      ]
    });
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { pedido }
    });
    
  } catch (error) {
    console.error('Error en getPedidoById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// CANCELAR PEDIDO (CLIENTE)
// ─────────────────────────────────────────────────────────────

const cancelarPedido = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    const pedido = await Pedido.findOne({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      include: [{
        model: DetallePedido,
        as: 'detalles',
        include: [{
          model: Producto,
          as: 'producto'
        }]
      }],
      transaction: t
    });
    
    if (!pedido) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    if (pedido.estado !== 'pendiente') {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un pedido en estado '${pedido.estado}'`
      });
    }
    
    for (const detalle of pedido.detalles) {
      const producto = detalle.producto;
      producto.stock += detalle.cantidad;
      await producto.save({ transaction: t });
    }
    
    pedido.estado = 'cancelado';
    await pedido.save({ transaction: t });
    
    await t.commit();
    
    res.json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      data: { pedido }
    });
    
  } catch (error) {
    await t.rollback();
    console.error('Error en cancelarPedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// OBTENER TODOS LOS PEDIDOS (ADMIN)
// ─────────────────────────────────────────────────────────────

const getAllPedidos = async (req, res) => {
  try {
    const { estado, usuarioId, pagina = 1, limite = 20 } = req.query;
    
    const where = {};
    if (estado) where.estado = estado;
    if (usuarioId) where.usuarioId = usuarioId;
    
    const { pageNum, limitNum, offset } = getPaginacionParams(pagina, limite);
    
    const { count, rows: pedidos } = await Pedido.findAndCountAll({
      where,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: DetallePedido,
          as: 'detalles',
          include: [{
            model: Producto,
            as: 'producto',
            attributes: ['id', 'nombre', 'imagen']
          }]
        }
      ],
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        pedidos,
        paginacion: {
          total: count,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(count / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getAllPedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// ACTUALIZAR ESTADO DE PEDIDO (ADMIN)
// ─────────────────────────────────────────────────────────────

const actualizarEstadoPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!validarEstado(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Opciones: ${ESTADOS_VALIDOS.join(', ')}`
      });
    }
    
    const pedido = await Pedido.findByPk(id);
    
    if (!pedido) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }
    
    pedido.estado = estado;
    await pedido.save();
    
    await pedido.reload({
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre', 'email']
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Estado del pedido actualizado',
      data: { pedido }
    });
    
  } catch (error) {
    console.error('Error en actualizarEstadoPedido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del pedido',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// OBTENER ESTADÍSTICAS DE PEDIDOS (ADMIN)
// ─────────────────────────────────────────────────────────────

const getEstadisticasPedidos = async (req, res) => {
  try {
    const { Op, fn, col } = require('sequelize');
    
    const totalPedidos = await Pedido.count();
    
    const pedidosPorEstado = await Pedido.findAll({
      attributes: [
        'estado',
        [fn('COUNT', col('id')), 'cantidad'],
        [fn('SUM', col('total')), 'totalVentas']
      ],
      group: ['estado']
    });
    
    const ventasTotales = await Pedido.sum('total');
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const pedidosHoy = await Pedido.count({
      where: {
        createdAt: { [Op.gte]: hoy }
      }
    });
    
    res.json({
      success: true,
      data: {
        totalPedidos,
        pedidosHoy,
        ventasTotales: Number.parseFloat(ventasTotales || 0).toFixed(2),
        pedidosPorEstado: pedidosPorEstado.map(p => ({
          estado: p.estado,
          cantidad: Number.parseInt(p.getDataValue('cantidad'), 10),
          totalVentas: Number.parseFloat(p.getDataValue('totalVentas') || 0).toFixed(2)
        }))
      }
    });
    
  } catch (error) {
    console.error('Error en getEstadisticasPedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  crearPedido,
  getMisPedidos,
  getPedidoById,
  cancelarPedido,
  getAllPedidos,
  actualizarEstadoPedido,
  getEstadisticasPedidos
};