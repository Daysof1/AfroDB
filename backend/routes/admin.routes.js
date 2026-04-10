/**
 * ============================================
 * RUTAS DEL ADMINISTRADOR (admin.routes.js)
 * ============================================
 * Agrupa TODAS las rutas del panel de administración.
 * Prefijo base: /api/admin (configurado en server.js → app.use('/api/admin', adminRoutes))
 * 
 * Acceso: Solo usuarios autenticados con rol 'administrador' o 'auxiliar'.
 * El middleware global router.use() aplica verificarAuth + esAdminOAuxiliar a TODAS las rutas.
 * Las rutas de eliminación (DELETE) y gestión de usuarios requieren rol 'administrador' exclusivo.
 * 
 * Recursos que gestiona:
 *   - /categorias     → CRUD de categorías de productos
 *   - /subcategorias  → CRUD de subcategorías
 *   - /productos      → CRUD de productos (con subida de imágenes)
 *   - /usuarios       → CRUD de usuarios del sistema
 *   - /pedidos        → Consulta y gestión de pedidos
 */

// Importa express desde el paquete npm 'express'
// express es el framework web que maneja las peticiones HTTP del servidor
const express = require('express');

// Crea una instancia de Router de Express
// Router permite agrupar rutas en un módulo separado (en vez de definirlas en server.js)
// Funciona como un "mini-servidor" que se monta en una ruta base
const router = express.Router();

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES
// ==========================================

// Importa verificarAuth desde middleware/auth.js
// verificarAuth → verifica que el usuario envíe un token JWT válido en el header Authorization
// Si el token es válido, guarda los datos del usuario en req.usuario
const { verificarAuth } = require('../middleware/auth');

// Importa funciones de verificación de rol desde middleware/checkRole.js
// esAdministrador → solo permite acceso a usuarios con rol 'administrador'
// esAdminOAuxiliar → permite acceso a 'administrador' y 'auxiliar'
// soloAdministrador → bloquea auxiliares, solo pasa administradores (usado en DELETE y gestión de usuarios)
const { esAdministrador, esAdminOAuxiliar, soloAdministrador } = require('../middleware/checkRole');

// Importa la configuración de multer desde config/multer.js
// upload → instancia de multer configurada para guardar imágenes en la carpeta 'uploads/'
// Se usa como middleware en las rutas POST/PUT de productos para recibir archivos
const { upload } = require('../config/multer');

// ==========================================
// IMPORTACIÓN DE CONTROLADORES
// ==========================================
// Cada controlador contiene las funciones que procesan la lógica de negocio
// Los controladores reciben (req, res) y retornan respuestas JSON

// Controlador de categorías → desde controllers/categoria.controller.js
// Funciones: getCategorias, getCategoriaById, getEstadisticasCategoria, crearCategoria, actualizarCategoria, toggleCategoria, eliminarCategoria
const categoriaController = require('../controllers/categoria.controller');

// Controlador de subcategorías → desde controllers/subcategoria.controller.js
// Funciones: getSubcategorias, getSubcategoriaById, getEstadisticasSubcategoria, crearSubcategoria, actualizarSubcategoria, toggleSubcategoria, eliminarSubcategoria
const subcategoriaController = require('../controllers/subcategoria.controller');

// Controlador de productos → desde controllers/producto.controller.js
// Funciones: getProductos, getProductoById, crearProducto, actualizarProducto, toggleProducto, actualizarStock, eliminarProducto
const productoController = require('../controllers/producto.controller');

// Controlador de usuarios → desde controllers/usuario.controller.js
// Funciones: getUsuarios, getUsuarioById, getEstadisticasUsuarios, crearUsuario, actualizarUsuario, toggleUsuario, eliminarUsuario
const usuarioController = require('../controllers/usuario.controller');

// Controlador de pedidos → desde controllers/pedido.controller.js
// Funciones: getAllPedidos, getPedidoById, getEstadisticasPedidos, actualizarEstadoPedido
const pedidoController = require('../controllers/pedido.controller');

// ==========================================
// MIDDLEWARE GLOBAL DEL ROUTER
// ==========================================
// router.use() aplica middlewares a TODAS las rutas definidas debajo
// Primero pasa por verificarAuth (verifica token JWT) → luego por esAdminOAuxiliar (verifica rol)
// Si alguno falla, retorna error 401/403 y NO llega al controlador
// Esto evita repetir estos middlewares en cada ruta individual
router.use(verificarAuth, esAdminOAuxiliar);

// ==========================================
// RUTAS DE CATEGORÍAS (/api/admin/categorias)
// ==========================================

// GET /api/admin/categorias → Obtiene TODAS las categorías (activas e inactivas)
// Controlador: getCategorias en categoria.controller.js
// Acceso: admin + auxiliar (por el middleware global)
router.get('/categorias', categoriaController.getCategorias);

// GET /api/admin/categorias/:id → Obtiene UNA categoría por su ID
// :id es un parámetro de ruta dinámico → se accede como req.params.id
// Controlador: getCategoriaById → busca con Categoria.findByPk(id)
router.get('/categorias/:id', categoriaController.getCategoriaById);

// GET /api/admin/categorias/:id/stats → Obtiene estadísticas de una categoría
// Estadísticas: cantidad de subcategorías, productos, productos activos, etc.
// Controlador: getEstadisticasCategoria
router.get('/categorias/:id/stats', categoriaController.getEstadisticasCategoria);

// POST /api/admin/categorias → Crea una nueva categoría
// Body esperado: { nombre: "Electrónica", descripcion: "Productos electrónicos" }
// Controlador: crearCategoria → hace Categoria.create(req.body)
router.post('/categorias', categoriaController.crearCategoria);

// PUT /api/admin/categorias/:id → Actualiza una categoría existente
// Body esperado: { nombre: "Nuevo nombre", descripcion: "Nueva descripción" }
// Controlador: actualizarCategoria → busca por PK y hace .update()
router.put('/categorias/:id', categoriaController.actualizarCategoria);

// PATCH /api/admin/categorias/:id/toggle → Activa o desactiva una categoría
// PATCH se usa para actualizaciones parciales (solo cambia el campo 'activo')
// Controlador: toggleCategoria → invierte el valor de 'activo' (true↔false)
// Si desactiva, el hook afterUpdate en Categoria.js desactiva subcategorías y productos en cascada
router.patch('/categorias/:id/toggle', categoriaController.toggleCategoria);

// DELETE /api/admin/categorias/:id → Elimina una categoría permanentemente
// soloAdministrador → middleware adicional que SOLO permite acceso al rol 'administrador'
// Los auxiliares NO pueden eliminar categorías (protección extra)
// Controlador: eliminarCategoria → solo si no tiene subcategorías ni productos
router.delete('/categorias/:id', soloAdministrador, categoriaController.eliminarCategoria);

// ==========================================
// RUTAS DE SUBCATEGORÍAS (/api/admin/subcategorias)
// ==========================================

// GET /api/admin/subcategorias → Obtiene TODAS las subcategorías
// Soporta filtros por query string: ?categoriaId=1&activo=true&incluirCategoria=true
// Controlador: getSubcategorias → aplica filtros con Sequelize where + include
router.get('/subcategorias', subcategoriaController.getSubcategorias);

// GET /api/admin/subcategorias/:id → Obtiene UNA subcategoría por ID
// Controlador: getSubcategoriaById → busca con findByPk e incluye la categoría padre
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriaById);

// GET /api/admin/subcategorias/:id/stats → Estadísticas de una subcategoría
// Controlador: getEstadisticasSubcategoria → cuenta productos activos/inactivos
router.get('/subcategorias/:id/stats', subcategoriaController.getEstadisticasSubcategoria);

// POST /api/admin/subcategorias → Crea una nueva subcategoría
// Body esperado: { nombre: "Celulares", descripcion: "...", categoriaId: 1 }
// Controlador: crearSubcategoria → valida que la categoría padre exista y esté activa
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

// PUT /api/admin/subcategorias/:id → Actualiza una subcategoría existente
// Body esperado: { nombre: "Nuevo nombre", descripcion: "...", categoriaId: 2 }
// Controlador: actualizarSubcategoria → busca por PK y hace .update()
router.put('/subcategorias/:id', subcategoriaController.actualizarSubcategoria);

// PATCH /api/admin/subcategorias/:id/toggle → Activa o desactiva una subcategoría
// Controlador: toggleSubcategoria → invierte el campo 'activo'
// Si desactiva, el hook afterUpdate en Subcategoria.js desactiva los productos en cascada
router.patch('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);

// DELETE /api/admin/subcategorias/:id → Elimina una subcategoría permanentemente
// soloAdministrador → solo el administrador puede eliminar
// Controlador: eliminarSubcategoria → solo si no tiene productos asociados
router.delete('/subcategorias/:id', soloAdministrador, subcategoriaController.eliminarSubcategoria);

// ==========================================
// RUTAS DE PRODUCTOS (/api/admin/productos)
// ==========================================

// GET /api/admin/productos → Obtiene todos los productos con filtros y paginación
// Query params: ?categoriaId=1&subcategoriaId=1&activo=true&conStock=true&buscar=texto&pagina=1&limite=10
// Controlador: getProductos → aplica filtros, paginación y ordena por fecha de creación
router.get('/productos', productoController.getProductos);

// GET /api/admin/productos/:id → Obtiene UN producto por su ID
// Controlador: getProductoById → incluye categoría y subcategoría con include
router.get('/productos/:id', productoController.getProductoById);

// POST /api/admin/productos → Crea un nuevo producto con imagen opcional
// upload.single('imagen') → middleware de multer que procesa UN archivo del campo 'imagen'
// El archivo se guarda en uploads/ y req.file contiene la info del archivo
// Content-Type debe ser multipart/form-data (no JSON) cuando se envía imagen
// Body: { nombre, descripcion, precio, stock, categoriaId, subcategoriaId, imagen(file) }
// Controlador: crearProducto → crea el producto y guarda la ruta de la imagen
router.post('/productos', upload.single('imagen'), productoController.crearProducto);

// PUT /api/admin/productos/:id → Actualiza un producto existente (con imagen opcional)
// upload.single('imagen') → si se envía nueva imagen, reemplaza la anterior
// Controlador: actualizarProducto → actualiza campos y opcionalmente la imagen
router.put('/productos/:id', upload.single('imagen'), productoController.actualizarProducto);

// PATCH /api/admin/productos/:id/toggle → Activa o desactiva un producto
// Controlador: toggleProducto → invierte el campo 'activo' (true↔false)
router.patch('/productos/:id/toggle', productoController.toggleProducto);

// PATCH /api/admin/productos/:id/stock → Actualiza el stock de un producto
// Body esperado: { cantidad: 10, operacion: 'aumentar' | 'reducir' | 'establecer' }
// Controlador: actualizarStock → suma, resta o establece el stock según la operación
router.patch('/productos/:id/stock', productoController.actualizarStock);

// DELETE /api/admin/productos/:id → Elimina un producto permanentemente
// soloAdministrador → solo el administrador puede eliminar productos
// Controlador: eliminarProducto → el hook beforeDestroy en Producto.js elimina la imagen del disco
router.delete('/productos/:id', soloAdministrador, productoController.eliminarProducto);

// ==========================================
// RUTAS DE USUARIOS (/api/admin/usuarios)
// ==========================================

// GET /api/admin/usuarios/stats → Obtiene estadísticas de usuarios del sistema
// IMPORTANTE: Esta ruta DEBE ir ANTES de /usuarios/:id
// Si fuera después, Express interpretaría "stats" como un :id y buscaría un usuario con id="stats"
// Controlador: getEstadisticasUsuarios → cuenta usuarios por rol, activos/inactivos, etc.
router.get('/usuarios/stats', usuarioController.getEstadisticasUsuarios);

// GET /api/admin/usuarios → Obtiene todos los usuarios del sistema
// Query params: ?rol=cliente&activo=true&buscar=texto&pagina=1&limite=10
// Controlador: getUsuarios → aplica filtros, paginación y excluye la contraseña (defaultScope)
router.get('/usuarios', usuarioController.getUsuarios);

// GET /api/admin/usuarios/:id → Obtiene UN usuario por su ID
// Controlador: getUsuarioById → busca con findByPk, excluye contraseña automáticamente
router.get('/usuarios/:id', usuarioController.getUsuarioById);

// POST /api/admin/usuarios → Crea un nuevo usuario (puede asignar cualquier rol)
// soloAdministrador → solo el administrador puede crear usuarios (especialmente con rol admin/auxiliar)
// Body: { nombre, apellido, email, password, rol, telefono, direccion }
// Controlador: crearUsuario → el hook beforeCreate en Usuario.js encripta la contraseña
router.post('/usuarios', soloAdministrador, usuarioController.crearUsuario);

// PUT /api/admin/usuarios/:id → Actualiza un usuario existente
// soloAdministrador → solo el administrador puede modificar usuarios
// Body: { nombre, apellido, telefono, direccion, rol }
// Controlador: actualizarUsuario → actualiza los campos permitidos
router.put('/usuarios/:id', soloAdministrador, usuarioController.actualizarUsuario);

// PATCH /api/admin/usuarios/:id/toggle → Activa o desactiva un usuario
// soloAdministrador → solo el administrador puede desactivar cuentas
// Controlador: toggleUsuario → invierte el campo 'activo' (si activo=false, no puede hacer login)
router.patch('/usuarios/:id/toggle', soloAdministrador, usuarioController.toggleUsuario);

// DELETE /api/admin/usuarios/:id → Elimina un usuario permanentemente
// soloAdministrador → solo el administrador puede eliminar usuarios
// Controlador: eliminarUsuario → RESTRICT en pedidos impide eliminar si tiene pedidos
router.delete('/usuarios/:id', soloAdministrador, usuarioController.eliminarUsuario);

// ==========================================
// RUTAS DE PEDIDOS - ADMIN (/api/admin/pedidos)
// ==========================================

// GET /api/admin/pedidos/estadisticas → Obtiene estadísticas globales de pedidos
// IMPORTANTE: Debe ir ANTES de /pedidos/:id (misma razón que /usuarios/stats)
// Controlador: getEstadisticasPedidos → cuenta pedidos por estado, calcula totales de ventas
router.get('/pedidos/estadisticas', pedidoController.getEstadisticasPedidos);

// GET /api/admin/pedidos → Obtiene TODOS los pedidos del sistema (de todos los usuarios)
// Query params: ?estado=pendiente&usuarioId=1&pagina=1&limite=20
// Controlador: getAllPedidos → incluye datos del usuario y detalles del pedido
router.get('/pedidos', pedidoController.getAllPedidos);

// GET /api/admin/pedidos/:id → Obtiene UN pedido específico con todos sus detalles
// Controlador: getPedidoById → incluye usuario, detalles y productos con include
router.get('/pedidos/:id', pedidoController.getPedidoById);

// PUT /api/admin/pedidos/:id/estado → Actualiza el estado de un pedido
// Body esperado: { estado: "pagado" | "enviado" | "entregado" | "cancelado" }
// Controlador: actualizarEstadoPedido → el hook afterUpdate en Pedido.js auto-establece fechas
router.put('/pedidos/:id/estado', pedidoController.actualizarEstadoPedido);

// ==========================================
// EXPORTAR ROUTER
// ==========================================
// Exporta el router para que server.js lo monte en la ruta /api/admin
// Se importa como: const adminRoutes = require('./routes/admin.routes')
// Se usa como: app.use('/api/admin', adminRoutes)
module.exports = router;
