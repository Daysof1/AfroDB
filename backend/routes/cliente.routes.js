/**
 * ============================================
 * RUTAS DEL CLIENTE (cliente.routes.js)
 * ============================================
 * (TODO TU CÓDIGO ORIGINAL SE MANTIENE IGUAL)
 */

const express = require('express');
const router = express.Router();

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES
// ==========================================
const { verificarAuth } = require('../middleware/auth');
const { esCliente, esProfesional } = require('../middleware/checkRole'); // 👈 agregado esProfesional

// ==========================================
// IMPORTACIÓN DE CONTROLADORES
// ==========================================
const catalogoController = require('../controllers/catalogo.controller');
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');

// 🆕 NUEVOS CONTROLADORES
const profesionalController = require('../controllers/profesional.controller');
const especialidadController = require('../controllers/especialidades.controller');
const citaController = require('../controllers/cita.controller');

// ============================================
// RUTAS PÚBLICAS - CATÁLOGO (/api/catalogo/...)
// ============================================

router.get('/catalogo/productos', catalogoController.getProductos);
router.get('/catalogo/productos/:id', catalogoController.getProductoById);
router.get('/catalogo/categorias', catalogoController.getCategorias);
router.get('/catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);
router.get('/catalogo/destacados', catalogoController.getProductosDestacados);

// ============================================
// 🆕 RUTAS PÚBLICAS - PROFESIONALES Y ESPECIALIDADES
// ============================================

// GET /api/profesionales → listar profesionales disponibles
router.get('/profesionales', profesionalController.getProfesionales);

// GET /api/profesionales/:id → detalle de un profesional
router.get('/profesionales/:id', profesionalController.getProfesionalById);

// GET /api/especialidades → listar especialidades
router.get('/especialidades', especialidadController.getEspecialidades);

// ============================================
// RUTAS DE CARRITO (/api/cliente/carrito)
// ============================================

router.get('/cliente/carrito', verificarAuth, carritoController.getCarrito);
router.post('/cliente/carrito', verificarAuth, carritoController.agregarAlCarrito);
router.put('/cliente/carrito/:id', verificarAuth, carritoController.actualizarItemCarrito);
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);
router.delete('/cliente/carrito', verificarAuth, carritoController.vaciarCarrito);

// ============================================
// RUTAS DE PEDIDOS - CLIENTE (/api/cliente/pedidos)
// ============================================

router.post('/cliente/pedidos', verificarAuth, pedidoController.crearPedido);
router.get('/cliente/pedidos', verificarAuth, pedidoController.getMisPedidos);
router.get('/cliente/pedidos/:id', verificarAuth, pedidoController.getPedidoById);
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);

// ============================================
// 🆕 RUTAS DE CITAS - CLIENTE (/api/cliente/citas)
// ============================================

// Crear cita
router.post('/cliente/citas', verificarAuth, esCliente, citaController.crearCita);

// Ver mis citas
router.get('/cliente/citas', verificarAuth, esCliente, citaController.getMisCitas);

// Ver detalle de cita
router.get('/cliente/citas/:id', verificarAuth, esCliente, citaController.getCitaById);

// Cancelar cita
router.put('/cliente/citas/:id/cancelar', verificarAuth, esCliente, citaController.cancelarCita);

// ============================================
// 🆕 RUTAS DE PROFESIONAL (/api/profesional/...)
// ============================================

// Ver citas asignadas al profesional
router.get('/profesional/citas', verificarAuth, esProfesional, citaController.getCitasProfesional);

// Actualizar estado de cita
router.put('/profesional/citas/:id/estado', verificarAuth, esProfesional, citaController.actualizarEstadoCita);

// ==========================================
// EXPORTAR ROUTER
// ==========================================
module.exports = router;