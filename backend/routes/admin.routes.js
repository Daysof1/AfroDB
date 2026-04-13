/**
 * ============================================
 * RUTAS DEL ADMINISTRADOR (admin.routes.js)
 * ============================================
 */

const express = require('express');
const router = express.Router();

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES
// ==========================================

const { verificarAuth } = require('../middleware/auth');
const { esAdministrador, esAdminOAuxiliar, soloAdministrador } = require('../middleware/checkRole');
const { upload } = require('../config/multer');

// ==========================================
// IMPORTACIÓN DE CONTROLADORES
// ==========================================

const categoriaController = require('../controllers/categoria.controller');
const subcategoriaController = require('../controllers/subcategoria.controller');
const productoController = require('../controllers/producto.controller');
const usuarioController = require('../controllers/usuario.controller');
const pedidoController = require('../controllers/pedido.controller');

// 🔥 NUEVOS CONTROLADORES
const especialidadController = require('../controllers/especialidad.controller');
const profesionalController = require('../controllers/profesional.controller');

// ==========================================
// MIDDLEWARE GLOBAL
// ==========================================

router.use(verificarAuth, esAdminOAuxiliar);

// ==========================================
// CATEGORÍAS
// ==========================================

router.get('/categorias', categoriaController.getCategorias);
router.get('/categorias/:id', categoriaController.getCategoriaById);
router.get('/categorias/:id/stats', categoriaController.getEstadisticasCategoria);
router.post('/categorias', categoriaController.crearCategoria);
router.put('/categorias/:id', categoriaController.actualizarCategoria);
router.patch('/categorias/:id/toggle', categoriaController.toggleCategoria);
router.delete('/categorias/:id', soloAdministrador, categoriaController.eliminarCategoria);

// ==========================================
// SUBCATEGORÍAS
// ==========================================

router.get('/subcategorias', subcategoriaController.getSubcategorias);
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriaById);
router.get('/subcategorias/:id/stats', subcategoriaController.getEstadisticasSubcategoria);
router.post('/subcategorias', subcategoriaController.crearSubcategoria);
router.put('/subcategorias/:id', subcategoriaController.actualizarSubcategoria);
router.patch('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);
router.delete('/subcategorias/:id', soloAdministrador, subcategoriaController.eliminarSubcategoria);

// ==========================================
// PRODUCTOS
// ==========================================

router.get('/productos', productoController.getProductos);
router.get('/productos/:id', productoController.getProductoById);
router.post('/productos', upload.single('imagen'), productoController.crearProducto);
router.put('/productos/:id', upload.single('imagen'), productoController.actualizarProducto);
router.patch('/productos/:id/toggle', productoController.toggleProducto);
router.patch('/productos/:id/stock', productoController.actualizarStock);
router.delete('/productos/:id', soloAdministrador, productoController.eliminarProducto);

// ==========================================
// USUARIOS
// ==========================================

router.get('/usuarios/stats', usuarioController.getEstadisticasUsuarios);
router.get('/usuarios', usuarioController.getUsuarios);
router.get('/usuarios/:id', usuarioController.getUsuarioById);
router.post('/usuarios', soloAdministrador, usuarioController.crearUsuario);
router.put('/usuarios/:id', soloAdministrador, usuarioController.actualizarUsuario);
router.patch('/usuarios/:id/toggle', soloAdministrador, usuarioController.toggleUsuario);
router.delete('/usuarios/:id', soloAdministrador, usuarioController.eliminarUsuario);

// ==========================================
// PEDIDOS
// ==========================================

router.get('/pedidos/estadisticas', pedidoController.getEstadisticasPedidos);
router.get('/pedidos', pedidoController.getAllPedidos);
router.get('/pedidos/:id', pedidoController.getPedidoById);
router.put('/pedidos/:id/estado', pedidoController.actualizarEstadoPedido);

// ==========================================
// 🔥 ESPECIALIDADES
// ==========================================

router.get('/especialidades', especialidadController.getEspecialidades);
router.get('/especialidades/:id', especialidadController.getEspecialidadById);
router.post('/especialidades', especialidadController.crearEspecialidad);
router.put('/especialidades/:id', especialidadController.actualizarEspecialidad);
router.delete('/especialidades/:id', soloAdministrador, especialidadController.eliminarEspecialidad);

// ==========================================
// 🔥 PROFESIONALES
// ==========================================

router.get('/profesionales', profesionalController.getProfesionales);
router.get('/profesionales/:id', profesionalController.getProfesionalById);
router.put('/profesionales/:id', profesionalController.actualizarProfesional);
router.delete('/profesionales/:id', soloAdministrador, profesionalController.eliminarProfesional);

// ==========================================
// EXPORTAR
// ==========================================

module.exports = router;