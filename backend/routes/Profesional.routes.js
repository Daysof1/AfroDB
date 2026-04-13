/**
 * ============================================
 * RUTAS DEL CLIENTE (cliente.routes.js)
 * ============================================
 * Define las rutas que usan los clientes del e-commerce.
 * Prefijo base: /api (configurado en server.js → app.use('/api', clienteRoutes))
 * 
 * Este archivo tiene DOS tipos de rutas:
 * 
 * 1. RUTAS PÚBLICAS (sin autenticación):
 *    /api/catalogo/productos          → Ver productos disponibles
 *    /api/catalogo/productos/:id      → Ver detalle de un producto
 *    /api/catalogo/categorias         → Ver categorías activas
 *    /api/catalogo/categorias/:id/subcategorias → Ver subcategorías de una categoría
 *    /api/catalogo/destacados         → Ver productos destacados/recientes
 * 
 * 2. RUTAS PROTEGIDAS (requieren token JWT):
 *    /api/cliente/carrito             → Gestión del carrito de compras
 *    /api/cliente/pedidos             → Gestión de pedidos del cliente
 */

// Importa express desde el paquete npm 'express'
// express es el framework web que maneja las peticiones HTTP
const express = require('express');

// Crea una instancia de Router de Express
// Router agrupa rutas relacionadas y se monta en server.js con app.use('/api', clienteRoutes)
// Esto significa que todas las rutas aquí se prefijan con /api
const router = express.Router();

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES
// ==========================================

// Importa verificarAuth desde middleware/auth.js
// verificarAuth → verifica que la petición tenga un token JWT válido en el header Authorization
// Decodifica el token y guarda los datos del usuario en req.usuario (id, rol, etc.)
// Se usa en las rutas de carrito y pedidos (que requieren usuario autenticado)
const { verificarAuth } = require('../middleware/auth');

// Importa esCliente desde middleware/checkRole.js
// esCliente → verifica que el usuario autenticado tenga rol 'cliente'
// NOTA: En este archivo no se usa actualmente (las rutas protegidas permiten cualquier rol autenticado)
const { esCliente } = require('../middleware/checkRole');

// ==========================================
// IMPORTACIÓN DE CONTROLADORES
// ==========================================

// Controlador de catálogo → desde controllers/catalogo.controller.js
// Maneja las consultas públicas del catálogo de productos (no requiere autenticación)
// Funciones: getProductos, getProductoById, getCategorias, getSubcategoriasPorCategoria, getProductosDestacados
const catalogoController = require('../controllers/catalogo.controller');

// Controlador de carrito → desde controllers/carrito.controller.js
// Maneja todas las operaciones del carrito de compras (requiere autenticación)
// Funciones: getCarrito, agregarAlCarrito, actualizarItemCarrito, eliminarItemCarrito, vaciarCarrito
const carritoController = require('../controllers/carrito.controller');

// Controlador de pedidos → desde controllers/pedido.controller.js
// Maneja la creación y consulta de pedidos del cliente (requiere autenticación)
// Funciones: crearPedido, getMisPedidos, getPedidoById, cancelarPedido
const pedidoController = require('../controllers/pedido.controller');

// ============================================
// RUTAS PÚBLICAS - CATÁLOGO (/api/catalogo/...)
// ============================================
// Estas rutas NO requieren autenticación → cualquier visitante puede ver el catálogo
// No llevan middleware verificarAuth → acceso libre

// GET /api/catalogo/productos → Obtiene la lista de productos activos con filtros y paginación
// El frontend usa esta ruta para mostrar la página del catálogo
// Query params opcionales: ?categoriaId=1&subcategoriaId=2&buscar=laptop&pagina=1&limite=12
// Controlador: getProductos → solo retorna productos activos con stock, incluye categoría y subcategoría
router.get('/catalogo/productos', catalogoController.getProductos);

// GET /api/catalogo/productos/:id → Obtiene el detalle de UN producto específico
// :id es un parámetro dinámico → se accede como req.params.id
// El frontend usa esta ruta cuando el usuario hace clic en un producto
// Controlador: getProductoById → retorna el producto con su categoría y subcategoría
router.get('/catalogo/productos/:id', catalogoController.getProductoById);

// GET /api/catalogo/categorias → Obtiene todas las categorías activas
// El frontend usa esta ruta para mostrar el menú de categorías y los filtros del catálogo
// Controlador: getCategorias → retorna categorías activas con sus subcategorías activas
router.get('/catalogo/categorias', catalogoController.getCategorias);

// GET /api/catalogo/categorias/:id/subcategorias → Obtiene las subcategorías de una categoría
// :id es el ID de la categoría padre
// El frontend usa esta ruta cuando el usuario selecciona una categoría para filtrar
// Controlador: getSubcategoriasPorCategoria → retorna solo subcategorías activas de esa categoría
router.get('/catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);

// GET /api/catalogo/destacados → Obtiene productos destacados o más recientes
// El frontend usa esta ruta para la página de inicio (HomePage)
// Controlador: getProductosDestacados → retorna los productos más recientes con stock
router.get('/catalogo/destacados', catalogoController.getProductosDestacados);

// ============================================
// RUTAS DE CARRITO (/api/cliente/carrito)
// ============================================
// Todas requieren autenticación → el usuario debe estar logueado para tener carrito
// verificarAuth verifica el token JWT y pone req.usuario con los datos del usuario

// GET /api/cliente/carrito → Obtiene todos los items del carrito del usuario autenticado
// verificarAuth → verifica token, pone datos en req.usuario
// Controlador: getCarrito → usa Carrito.obtenerCarritoUsuario(req.usuario.id) para traer los items
// Retorna los items con los datos del producto (nombre, precio, imagen, stock disponible)
router.get('/cliente/carrito', verificarAuth, carritoController.getCarrito);

// POST /api/cliente/carrito → Agrega un producto al carrito del usuario
// verificarAuth → verifica token
// Body esperado: { productoId: 1, cantidad: 2 }
// Controlador: agregarAlCarrito → verifica stock, crea o actualiza el item en el carrito
// Si el producto ya está en el carrito, suma la cantidad
router.post('/cliente/carrito', verificarAuth, carritoController.agregarAlCarrito);

// PUT /api/cliente/carrito/:id → Actualiza la cantidad de un item del carrito
// :id es el ID del registro en la tabla 'carritos' (NO el ID del producto)
// verificarAuth → verifica token
// Body esperado: { cantidad: 3 }
// Controlador: actualizarItemCarrito → verifica stock disponible y actualiza la cantidad
router.put('/cliente/carrito/:id', verificarAuth, carritoController.actualizarItemCarrito);

// DELETE /api/cliente/carrito/:id → Elimina UN item específico del carrito
// :id es el ID del registro en la tabla 'carritos'
// verificarAuth → verifica token
// Controlador: eliminarItemCarrito → elimina el registro con Carrito.destroy()
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);

// DELETE /api/cliente/carrito → Vacía TODO el carrito del usuario
// SIN :id → usa la misma ruta base pero elimina TODOS los items
// verificarAuth → verifica token
// Controlador: vaciarCarrito → usa Carrito.vaciarCarrito(req.usuario.id) que hace DELETE WHERE usuarioId=X
router.delete('/cliente/carrito', verificarAuth, carritoController.vaciarCarrito);

// ============================================
// RUTAS DE PEDIDOS - CLIENTE (/api/cliente/pedidos)
// ============================================
// Todas requieren autenticación → solo usuarios logueados pueden hacer pedidos

// POST /api/cliente/pedidos → Crea un nuevo pedido desde el carrito (proceso de checkout)
// verificarAuth → verifica token
// Proceso interno en el controlador crearPedido:
//   1. Obtiene todos los items del carrito del usuario
//   2. Verifica stock de cada producto
//   3. Crea el pedido en tabla 'pedidos'
//   4. Crea los detalles en tabla 'detalle_pedidos' (un registro por producto)
//   5. Reduce el stock de cada producto
//   6. Vacía el carrito del usuario
//   7. Retorna el pedido creado con sus detalles
// Body opcional: { direccionEnvio: "..." } (puede usar la dirección del perfil)
router.post('/cliente/pedidos', verificarAuth, pedidoController.crearPedido);

// GET /api/cliente/pedidos → Obtiene el historial de pedidos del usuario autenticado
// verificarAuth → verifica token
// Controlador: getMisPedidos → busca pedidos WHERE usuarioId = req.usuario.id
// Retorna la lista de pedidos con su estado, fecha, total, etc.
router.get('/cliente/pedidos', verificarAuth, pedidoController.getMisPedidos);

// GET /api/cliente/pedidos/:id → Obtiene el detalle completo de UN pedido
// :id es el ID del pedido
// verificarAuth → verifica token
// Controlador: getPedidoById → verifica que el pedido pertenezca al usuario (seguridad)
// Retorna el pedido con todos sus detalles (productos, cantidades, precios, subtotales)
router.get('/cliente/pedidos/:id', verificarAuth, pedidoController.getPedidoById);

// PUT /api/cliente/pedidos/:id/cancelar → Cancela un pedido del usuario
// :id es el ID del pedido a cancelar
// verificarAuth → verifica token
// Controlador: cancelarPedido → verifica que el pedido esté en estado 'pendiente'
// Si el pedido ya fue pagado, enviado o entregado, NO se puede cancelar
// Al cancelar, restaura el stock de los productos que estaban en el pedido
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);

// ==========================================
// EXPORTAR ROUTER
// ==========================================
// Exporta el router para que server.js lo monte en la ruta /api
// Se importa como: const clienteRoutes = require('./routes/cliente.routes')
// Se usa como: app.use('/api', clienteRoutes)
module.exports = router;
