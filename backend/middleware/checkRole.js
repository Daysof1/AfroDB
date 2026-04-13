/**
 * ============================================
 * MIDDLEWARE DE VERIFICACIÓN DE ROLES
 * ============================================
 * Controla el acceso según el rol del usuario autenticado.
 * Requiere que verificarAuth se ejecute antes (req.usuario).
 * 
 * Roles manejados:
 * - administrador
 * - cliente
 * - profesional
 * - auxiliar
 */

// ============================================
// FUNCIÓN AUXILIAR
// ============================================

/**
 * Normaliza el rol para evitar errores (mayúsculas/minúsculas)
 */
const normalizarRol = (rol) => {
  return rol ? rol.toLowerCase().trim() : null;
};

/**
 * Verifica autenticación base
 */
const verificarUsuario = (req, res) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado. Debes iniciar sesión primero'
    });
  }
};

// ============================================
// SOLO ADMIN
// ============================================

const esAdministrador = (req, res, next) => {
  try {
    const errorAuth = verificarUsuario(req, res);
    if (errorAuth) return;

    const rol = normalizarRol(req.usuario.rol);

    if (rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    next();
  } catch (error) {
    console.error('Error en esAdministrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// ============================================
// SOLO CLIENTE
// ============================================

const esCliente = (req, res, next) => {
  try {
    const errorAuth = verificarUsuario(req, res);
    if (errorAuth) return;

    const rol = normalizarRol(req.usuario.rol);

    if (rol !== 'cliente') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo clientes pueden acceder'
      });
    }

    next();
  } catch (error) {
    console.error('Error en esCliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// ============================================
// SOLO PROFESIONAL
// ============================================

const esProfesional = (req, res, next) => {
  try {
    const errorAuth = verificarUsuario(req, res);
    if (errorAuth) return;

    const rol = normalizarRol(req.usuario.rol);

    if (rol !== 'profesional') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo profesionales pueden acceder'
      });
    }

    next();
  } catch (error) {
    console.error('Error en esProfesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// ============================================
// ADMIN O AUXILIAR
// ============================================

const esAdminOAuxiliar = (req, res, next) => {
  try {
    const errorAuth = verificarUsuario(req, res);
    if (errorAuth) return;

    const rol = normalizarRol(req.usuario.rol);

    if (!['administrador', 'auxiliar'].includes(rol)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere administrador o auxiliar'
      });
    }

    next();
  } catch (error) {
    console.error('Error en esAdminOAuxiliar:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// ============================================
// SOLO ADMIN (CRÍTICO)
// ============================================

const soloAdministrador = (req, res, next) => {
  try {
    const errorAuth = verificarUsuario(req, res);
    if (errorAuth) return;

    const rol = normalizarRol(req.usuario.rol);

    if (rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden realizar esta acción'
      });
    }

    next();
  } catch (error) {
    console.error('Error en soloAdministrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// ============================================
// MÚLTIPLES ROLES (DINÁMICO)
// ============================================

const tieneRol = (rolesPermitidos = []) => {
  return (req, res, next) => {
    try {
      const errorAuth = verificarUsuario(req, res);
      if (errorAuth) return;

      const rol = normalizarRol(req.usuario.rol);

      // Normaliza también los roles permitidos
      const rolesNormalizados = rolesPermitidos.map(r => r.toLowerCase());

      if (!rolesNormalizados.includes(rol)) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Roles permitidos: ${rolesPermitidos.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Error en tieneRol:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar permisos',
        error: error.message
      });
    }
  };
};

// ============================================
// PROPIO USUARIO O ADMIN
// ============================================

const esPropioUsuarioOAdmin = (req, res, next) => {
  try {
    const errorAuth = verificarUsuario(req, res);
    if (errorAuth) return;

    const rol = normalizarRol(req.usuario.rol);

    if (rol === 'administrador') {
      return next();
    }

    const usuarioIdParam = req.params.usuarioId || req.params.id;

    if (parseInt(usuarioIdParam) !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No puedes acceder a datos de otros usuarios'
      });
    }

    next();
  } catch (error) {
    console.error('Error en esPropioUsuarioOAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message
    });
  }
};

// ============================================
// EXPORTACIÓN
// ============================================

module.exports = {
  esAdministrador,
  esCliente,
  esProfesional,
  esAdminOAuxiliar,
  soloAdministrador,
  tieneRol,
  esPropioUsuarioOAdmin
};