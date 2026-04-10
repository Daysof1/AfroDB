/**
 * ============================================
 * MIDDLEWARE DE AUTENTICACIÓN JWT
 * ============================================
 * Este archivo contiene los middlewares que verifican la identidad del usuario
 * mediante tokens JWT (JSON Web Token).
 * Se ejecutan ANTES de los controladores en las rutas protegidas.
 * Un middleware es una función que intercepta la petición (req) antes de que
 * llegue al controlador, puede modificarla o rechazarla.
 */

// Importa verifyToken (decodifica y valida el JWT) y extractToken (separa "Bearer" del token)
// Ambas funciones están definidas en config/jwt.js
const { verifyToken, extractToken } = require('../config/jwt');

// Importa el modelo Usuario desde models/Usuario.js → tabla 'Usuario' en MySQL
// Se usa para verificar que el usuario del token realmente existe en la BD
const Usuario = require('../models/Usuario');

/**
 * Middleware OBLIGATORIO de autenticación
 * 
 * Flujo completo:
 * 1. Lee el header "Authorization" de la petición HTTP
 * 2. Extrae el token JWT (formato: "Bearer eyJhbGci...")
 * 3. Verifica que el token sea válido y no haya expirado
 * 4. Busca al usuario en la BD usando el ID decodificado del token
 * 5. Verifica que el usuario esté activo
 * 6. Adjunta el usuario a req.usuario para que los controladores lo usen
 * 
 * Si CUALQUIER paso falla → responde 401 (No autorizado) y NO llega al controlador.
 * 
 * Uso en rutas (en routes/*.routes.js):
 *   router.get('/ruta-protegida', verificarAuth, controlador);
 */
const verificarAuth = async (req, res, next) => {
  try {
    // PASO 1: Lee el header "Authorization" de la petición HTTP
    // El frontend envía: headers: { Authorization: "Bearer <token>" }
    const authHeader = req.headers.authorization;
    
    // Si no hay header Authorization, el usuario no envió token → no está autenticado
    if (!authHeader) {
      return res.status(401).json({    // 401 = No autorizado
        success: false,
        message: 'No se proporcionó token de autenticación'
      });
    }
    
    // PASO 2: Extrae solo el token quitando el prefijo "Bearer "
    // extractToken() está en config/jwt.js → separa "Bearer eyJhbG..." → "eyJhbG..."
    const token = extractToken(authHeader);
    
    // Si extractToken retorna null, el formato del header es incorrecto
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación inválido'
      });
    }
    
    // PASO 3: Verifica y decodifica el token JWT
    // verifyToken() está en config/jwt.js → usa jwt.verify() con la clave secreta
    // Si el token es válido, retorna el payload: { id: 1, rol: 'cliente', iat: ..., exp: ... }
    // Si es inválido o expiró, lanza un error que se captura en el catch
    let decoded;
    try {
      decoded = verifyToken(token);     // decoded = { id, rol, iat, exp }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message          // "Token expirado" o "Token inválido"
      });
    }
    
    // PASO 4: Busca al usuario en la BD usando el ID que venía dentro del token
    // findByPk = Find By Primary Key → SELECT * FROM Usuario WHERE id = decoded.id
    // attributes.exclude: ['password'] → trae todos los campos EXCEPTO password (seguridad)
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    // Si el usuario fue eliminado de la BD después de crear el token
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // PASO 5: Verifica que la cuenta del usuario esté activa
    // Un admin puede desactivar cuentas → campo 'activo' en la tabla Usuario
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }
    
    // PASO 6: Adjunta el objeto usuario completo al request (req)
    // A partir de aquí, CUALQUIER controlador o middleware posterior puede usar req.usuario
    // Ejemplo: req.usuario.id, req.usuario.rol, req.usuario.nombre
    req.usuario = usuario;
    
    // next() le dice a Express: "todo bien, continúa con el siguiente middleware o controlador"
    // Sin next(), la petición se quedaría colgada y nunca llegaría al controlador
    next();
    
  } catch (error) {
    // Error inesperado del servidor (problemas de BD, etc.)
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({      // 500 = Error interno del servidor
      success: false,
      message: 'Error al verificar autenticación',
      error: error.message
    });
  }
};

/**
 * Middleware OPCIONAL de autenticación
 * 
 * Funciona igual que verificarAuth PERO:
 * - Si NO hay token → continúa normalmente con req.usuario = null (NO rechaza)
 * - Si el token es inválido → continúa normalmente con req.usuario = null (NO rechaza)
 * - Si el token es válido → adjunta el usuario a req.usuario (igual que verificarAuth)
 * 
 * Útil para rutas públicas que muestran contenido extra si el usuario está logueado.
 * Ejemplo: El catálogo lo ve cualquiera, pero si estás logueado ves precios especiales.
 * 
 * Uso en rutas:
 *   router.get('/catalogo', verificarAuthOpcional, controlador);
 */
const verificarAuthOpcional = async (req, res, next) => {
  try {
    // Lee el header Authorization
    const authHeader = req.headers.authorization;
    
    // Sin token → continúa sin usuario autenticado (NO rechaza la petición)
    if (!authHeader) {
      req.usuario = null;              // El controlador verá que no hay usuario logueado
      return next();                   // Continúa al siguiente middleware/controlador
    }
    
    // Extrae el token del header
    const token = extractToken(authHeader);
    
    // Token mal formado → continúa sin usuario (NO rechaza)
    if (!token) {
      req.usuario = null;
      return next();
    }
    
    try {
      // Intenta decodificar el token
      const decoded = verifyToken(token);
      
      // Busca al usuario en la BD (sin password)
      const usuario = await Usuario.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      // Solo adjunta el usuario si existe Y está activo
      if (usuario && usuario.activo) {
        req.usuario = usuario;         // Usuario autenticado disponible
      } else {
        req.usuario = null;            // Usuario no existe o está inactivo
      }
    } catch (error) {
      // Token inválido o expirado → NO rechaza, simplemente continúa sin usuario
      req.usuario = null;
    }
    
    // Siempre continúa al siguiente middleware/controlador, haya o no usuario
    next();
    
  } catch (error) {
    // Incluso ante errores inesperados, este middleware NO bloquea la petición
    console.error('Error en middleware de autenticación opcional:', error);
    req.usuario = null;
    next();                            // Continúa de todas formas
  }
};

// Exporta ambos middlewares para usarlos en las rutas (routes/*.routes.js)
// verificarAuth → para rutas que REQUIEREN estar logueado
// verificarAuthOpcional → para rutas que FUNCIONAN con o sin login
module.exports = {
  verificarAuth,                       // Rutas protegidas: /api/cliente/*, /api/admin/*
  verificarAuthOpcional                // Rutas públicas con extras: /api/catalogo/*
};
