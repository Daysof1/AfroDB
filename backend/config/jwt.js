/**
 * ============================================
 * CONFIGURACIÓN DE JWT (JSON WEB TOKENS)
 * ============================================
 * Este archivo contiene funciones para generar, verificar y extraer tokens JWT.
 * Los JWT se usan para autenticar usuarios sin necesidad de mantener sesiones en el servidor.
 * Un JWT es una cadena codificada que contiene datos del usuario (id, email, rol)
 * y está firmada digitalmente para que nadie pueda modificarla.
 * Este archivo es usado por: auth.controller.js (para generar tokens al login)
 * y middleware/auth.js (para verificar tokens en cada petición protegida).
 */

// Importa el paquete 'jsonwebtoken' desde node_modules.
// Este paquete provee funciones para crear (sign), verificar (verify) y decodificar tokens JWT.
const jwt = require('jsonwebtoken');

// Importa y ejecuta dotenv para cargar las variables del archivo .env en process.env.
// Necesita las variables JWT_SECRET (clave secreta) y JWT_EXPIRES_IN (tiempo de expiración).
require('dotenv').config();

/**
 * Genera un token JWT para un usuario autenticado.
 * Se llama después de un login exitoso para darle al usuario su "credencial".
 * 
 * @param {Object} payload - Datos que se incluirán dentro del token (id, email, rol del usuario)
 * @returns {String} - El token JWT generado (una cadena larga codificada en Base64)
 * 
 * Ejemplo de uso:
 * const token = generateToken({ id: 1, email: 'usuario@email.com', rol: 'cliente' });
 */
const generateToken = (payload) => {
  try {
    // jwt.sign() crea un nuevo token JWT y lo firma digitalmente.
    // Recibe 3 parámetros:
    const token = jwt.sign(
      // 1. payload: objeto con los datos del usuario que se guardarán DENTRO del token.
      //    Estos datos se pueden leer después al decodificar el token.
      //    NO incluir datos sensibles como contraseñas (el token es decodificable).
      payload,
      // 2. secret: clave secreta leída del .env (variable JWT_SECRET).
      //    Esta clave se usa para "firmar" el token. Solo el servidor la conoce.
      //    Si alguien modifica el token, la firma no coincidirá y será rechazado.
      process.env.JWT_SECRET,
      // 3. options: objeto con opciones adicionales.
      //    expiresIn: tiempo de vida del token, leído del .env (variable JWT_EXPIRES_IN).
      //    Ejemplos: '24h' (24 horas), '7d' (7 días), '1h' (1 hora).
      //    Después de este tiempo, el token expira y el usuario debe hacer login de nuevo.
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Retorna el token generado (cadena como: "eyJhbGciOiJIUzI1NiIs...")
    return token;
  } catch (error) {
    // Si ocurre un error al generar el token, lo registra en consola
    console.error('❌ Error al generar token JWT:', error.message);
    // Lanza un error que será capturado por el controller que llamó esta función
    throw new Error('Error al generar token de autenticación');
  }
};

/**
 * Verifica si un token JWT es válido (no fue modificado y no ha expirado).
 * Se llama desde el middleware auth.js en cada petición a rutas protegidas.
 * 
 * @param {String} token - El token JWT que envió el cliente en el header Authorization
 * @returns {Object} - Los datos decodificados del token (id, email, rol) si es válido
 * @throws {Error} - Lanza error si el token es inválido o ha expirado
 */
const verifyToken = (token) => {
  try {
    // jwt.verify() verifica la firma del token usando la misma clave secreta
    // y decodifica los datos (payload) que contiene.
    // Si el token fue modificado o la firma no coincide, lanza un error.
    // Si el token ya expiró, también lanza un error.
    // Parámetros:
    // 1. token: el token JWT a verificar (cadena)
    // 2. secret: la MISMA clave secreta que se usó para firmarlo (del .env)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Si la verificación pasa, retorna el objeto con los datos del usuario
    // Ejemplo: { id: 1, email: 'user@mail.com', rol: 'cliente', iat: 1709578800, exp: 1709665200 }
    // iat = issued at (fecha de creación), exp = expiration (fecha de expiración)
    return decoded;
  } catch (error) {
    // Maneja diferentes tipos de errores de JWT:
    if (error.name === 'TokenExpiredError') {
      // El token era válido pero ya pasó su tiempo de expiración
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      // El token fue modificado, está mal formado o la firma no coincide
      throw new Error('Token inválido');
    } else {
      // Cualquier otro error inesperado
      throw new Error('Error al verificar token');
    }
  }
};

/**
 * Extrae el token JWT del header Authorization de la petición HTTP.
 * El estándar es enviar el token con formato: "Bearer <token>"
 * Esta función separa el prefijo "Bearer " y devuelve solo el token.
 * Se usa en el middleware auth.js antes de verificar el token.
 * 
 * @param {String} authHeader - El valor del header Authorization (ej: "Bearer eyJhbG...")
 * @returns {String|null} - El token extraído, o null si no hay header o formato incorrecto
 */
const extractToken = (authHeader) => {
  // Verifica que: 1) el header existe (no es undefined/null)
  // y 2) comienza con la palabra "Bearer " (estándar de autenticación)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // substring(7) extrae todo después de "Bearer " (7 caracteres)
    // Ejemplo: "Bearer abc123" -> "abc123"
    return authHeader.substring(7);
  }
  
  // Si no hay header o no tiene el formato correcto, retorna null
  return null;
};

// Exporta las 3 funciones para que otros archivos las puedan importar.
// Ejemplo: const { generateToken, verifyToken } = require('../config/jwt');
module.exports = {
  generateToken,    // Usada en auth.controller.js al hacer login/registro
  verifyToken,      // Usada en middleware/auth.js para validar tokens
  extractToken      // Usada en middleware/auth.js para extraer el token del header
};
