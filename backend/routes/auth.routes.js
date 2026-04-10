/**
 * ============================================
 * RUTAS DE AUTENTICACIÓN (auth.routes.js)
 * ============================================
 * Define los endpoints para el sistema de autenticación del e-commerce.
 * Prefijo base: /api/auth (configurado en server.js → app.use('/api/auth', authRoutes))
 * 
 * Rutas públicas (sin token):
 *   POST /api/auth/register → Registrar nuevo cliente
 *   POST /api/auth/login    → Iniciar sesión (obtener token JWT)
 * 
 * Rutas protegidas (requieren token JWT en el header Authorization):
 *   GET  /api/auth/me              → Ver mi perfil
 *   PUT  /api/auth/me              → Actualizar mi perfil
 *   PUT  /api/auth/change-password → Cambiar mi contraseña
 * 
 * Flujo de autenticación:
 *   1. Usuario hace POST /login con email y password
 *   2. El servidor verifica credenciales y retorna un token JWT
 *   3. El frontend guarda el token y lo envía en cada petición protegida
 *   4. El middleware verificarAuth decodifica el token y pone los datos en req.usuario
 */

// Importa express desde el paquete npm 'express'
// express es el framework web que maneja las peticiones HTTP
const express = require('express');

// Crea una instancia de Router de Express
// Router permite agrupar rutas relacionadas en un archivo separado
// Este router se monta en server.js con: app.use('/api/auth', authRoutes)
const router = express.Router();

// ==========================================
// IMPORTACIÓN DE CONTROLADORES
// ==========================================
// Importa las funciones del controlador de autenticación desde controllers/auth.controller.js
// Usa desestructuración {} para importar solo las funciones necesarias
const {
  register,          // Función que registra un nuevo usuario cliente
  login,             // Función que autentica al usuario y retorna un token JWT
  getMe,             // Función que retorna los datos del usuario autenticado
  updateMe,          // Función que actualiza el perfil del usuario autenticado
  changePassword     // Función que permite cambiar la contraseña
} = require('../controllers/auth.controller');

// ==========================================
// IMPORTACIÓN DE MIDDLEWARES
// ==========================================
// Importa verificarAuth desde middleware/auth.js
// verificarAuth → verifica que la petición incluya un token JWT válido
// Si el token es válido, decodifica los datos y los guarda en req.usuario
// Si no hay token o es inválido, retorna error 401 (No autorizado)
const { verificarAuth } = require('../middleware/auth');

// ==========================================
// RUTAS PÚBLICAS (No requieren autenticación)
// ==========================================
// Estas rutas NO tienen middleware de autenticación
// Cualquier persona puede acceder sin token

// POST /api/auth/register → Registra un nuevo usuario con rol 'cliente'
// El frontend envía los datos del formulario de registro en req.body
// Body esperado (JSON):
//   {
//     "nombre": "Juan",               → Nombre del usuario (obligatorio)
//     "apellido": "Pérez",            → Apellido (si aplica)
//     "email": "juan@ejemplo.com",    → Email único (obligatorio, se valida formato)
//     "password": "password123",       → Contraseña (obligatorio, mín. 6 caracteres)
//     "telefono": "3001234567",       → Teléfono (opcional)
//     "direccion": "Calle 123 #45-67" → Dirección de envío (opcional)
//   }
// Respuesta exitosa (201 Created):
//   { success: true, data: { usuario: {...}, token: "eyJ..." } }
// El controlador register crea el usuario y retorna un token JWT para auto-login
router.post('/register', register);

// POST /api/auth/login → Autentica al usuario con email y contraseña
// El frontend envía las credenciales del formulario de login en req.body
// Body esperado (JSON):
//   {
//     "email": "admin@ecommerce.com",  → Email registrado
//     "password": "admin123"            → Contraseña en texto plano
//   }
// Proceso interno (en auth.controller.js):
//   1. Busca usuario por email usando scope 'withPassword' (para obtener el hash)
//   2. Compara la contraseña con bcrypt.compare() (método compararPassword del modelo)
//   3. Verifica que el usuario esté activo (activo === true)
//   4. Genera un token JWT con el id y rol del usuario
//   5. Retorna el usuario (sin password) + token
// Respuesta exitosa (200 OK):
//   { success: true, data: { usuario: { id, nombre, email, rol, ... }, token: "eyJ..." } }
router.post('/login', login);

// ==========================================
// RUTAS PROTEGIDAS (Requieren autenticación)
// ==========================================
// Estas rutas REQUIEREN el middleware verificarAuth
// El frontend debe enviar el token JWT en el header: Authorization: Bearer <token>
// verificarAuth decodifica el token y pone los datos del usuario en req.usuario

// GET /api/auth/me → Obtiene el perfil del usuario actualmente autenticado
// verificarAuth se ejecuta primero → verifica el token y pone datos en req.usuario
// Luego getMe lee req.usuario.id y busca el usuario completo en la BD
// Headers requeridos: { "Authorization": "Bearer eyJhbGciOiJIUzI1NiIs..." }
// Respuesta exitosa (200 OK):
//   { success: true, data: { usuario: { id, nombre, email, rol, telefono, direccion, ... } } }
// Se usa en el frontend para verificar si la sesión sigue activa al cargar la app
router.get('/me', verificarAuth, getMe);

// PUT /api/auth/me → Actualiza el perfil del usuario autenticado
// verificarAuth valida el token → updateMe actualiza solo los campos permitidos
// Body esperado (JSON, todos opcionales):
//   {
//     "nombre": "Juan Carlos",         → Nuevo nombre
//     "apellido": "Pérez López",       → Nuevo apellido
//     "telefono": "3001234567",        → Nuevo teléfono
//     "direccion": "Carrera 10 #20-30" → Nueva dirección
//   }
// NOTA: NO permite cambiar email, password ni rol desde esta ruta (seguridad)
// Respuesta exitosa (200 OK):
//   { success: true, message: "Perfil actualizado exitosamente", data: { usuario: {...} } }
router.put('/me', verificarAuth, updateMe);

// PUT /api/auth/change-password → Cambia la contraseña del usuario autenticado
// verificarAuth valida el token → changePassword verifica la contraseña actual y establece la nueva
// Body esperado (JSON):
//   {
//     "passwordActual": "miPasswordVieja123",  → Contraseña actual (se verifica con bcrypt)
//     "passwordNueva": "miPasswordNueva456"     → Nueva contraseña (mín. 6 caracteres)
//   }
// Proceso interno:
//   1. Busca el usuario con scope 'withPassword' para obtener el hash actual
//   2. Compara passwordActual con el hash guardado usando bcrypt.compare()
//   3. Si coincide, actualiza con la nueva (el hook beforeUpdate la encripta automáticamente)
// Respuesta exitosa (200 OK):
//   { success: true, message: "Contraseña actualizada exitosamente" }
router.put('/change-password', verificarAuth, changePassword);

// ==========================================
// EXPORTAR ROUTER
// ==========================================
// Exporta el router para que server.js lo monte en /api/auth
// Se importa como: const authRoutes = require('./routes/auth.routes')
// Se usa como: app.use('/api/auth', authRoutes)
module.exports = router;
