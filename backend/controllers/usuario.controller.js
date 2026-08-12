/**
 * ============================================
 * CONTROLADOR DE USUARIOS (Admin)
 * ============================================
 * Gestión de usuarios por parte de administradores.
 * CRUD completo: listar, ver, crear, actualizar, toggle, eliminar y estadísticas.
 * Solo accesible por administradores (protegido por middleware checkRole).
 * Las rutas están definidas en routes/admin.routes.js
 */

const Usuario = require('../models/Usuario');

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────

const ROLES_VALIDOS = ['cliente', 'auxiliar', 'administrador', 'profesional'];

const validarRol = (rol) => {
  if (rol && !ROLES_VALIDOS.includes(rol)) {
    throw new Error(`Rol inválido. Debe ser: ${ROLES_VALIDOS.join(', ')}`);
  }
};

const getPaginacionParams = (pagina, limite) => {
  const pageNum = Number.parseInt(pagina, 10);
  const limitNum = Number.parseInt(limite, 10);
  const offset = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, offset };
};

const buildUsuarioWhere = (filtros) => {
  const { rol, activo, buscar } = filtros;
  
  const where = {};
  if (rol) where.rol = rol;
  if (activo !== undefined) where.activo = activo === 'true';
  
  if (buscar) {
    const { Op } = require('sequelize');
    where[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { apellido: { [Op.like]: `%${buscar}%` } },
      { email: { [Op.like]: `%${buscar}%` } }
    ];
  }
  
  return where;
};

const verificarEmailDuplicado = async (email) => {
  const usuarioExistente = await Usuario.findOne({ where: { email } });
  if (usuarioExistente) {
    throw new Error('El email ya está registrado');
  }
};

// ─────────────────────────────────────────────────────────────
// GET: Obtener todos los usuarios
// ─────────────────────────────────────────────────────────────

const getUsuarios = async (req, res) => {
  try {
    const { rol, activo, buscar, pagina = 1, limite = 10 } = req.query;
    
    const where = buildUsuarioWhere({ rol, activo, buscar });
    const { pageNum, limitNum, offset } = getPaginacionParams(pagina, limite);
    
    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: limitNum,
      offset,
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      data: {
        usuarios,
        paginacion: {
          total: count,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(count / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getUsuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET: Obtener usuario por ID
// ─────────────────────────────────────────────────────────────

const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { usuario }
    });
    
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// POST: Crear nuevo usuario
// ─────────────────────────────────────────────────────────────

const crearUsuario = async (req, res) => {
  try {
    const { tipo_documento, documento, nombre, apellido, email, password, rol, telefono, direccion } = req.body;
    
    // Validar campos obligatorios
    if (!tipo_documento || !documento || !nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: tipo_documento, documento, nombre, apellido, email, password y rol'
      });
    }
    
    // Validar rol
    try {
      validarRol(rol);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Verificar email duplicado
    try {
      await verificarEmailDuplicado(email);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    const nuevoUsuario = await Usuario.create({
      tipo_documento,
      documento,
      nombre,
      apellido,
      email,
      password,
      rol,
      telefono: telefono || null,
      direccion: direccion || null,
      activo: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        usuario: nuevoUsuario.toJSON()
      }
    });
    
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear usuario',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT: Actualizar usuario
// ─────────────────────────────────────────────────────────────

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_documento, documento, nombre, apellido, telefono, direccion, rol } = req.body;
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Validar rol si se envía
    if (rol) {
      try {
        validarRol(rol);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
    
    // Actualizar campos
    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (rol !== undefined) usuario.rol = rol;
    if (tipo_documento !== undefined) usuario.tipo_documento = tipo_documento;
    if (documento !== undefined) usuario.documento = documento;
    
    await usuario.save();
    
    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        usuario: usuario.toJSON()
      }
    });
    
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH: Toggle usuario
// ─────────────────────────────────────────────────────────────

const toggleUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Protección: No permite que el admin se desactive a sí mismo
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }
    
    usuario.activo = !usuario.activo;
    await usuario.save();
    
    res.json({
      success: true,
      message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: {
        usuario: usuario.toJSON()
      }
    });
    
  } catch (error) {
    console.error('Error en toggleUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del usuario',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE: Eliminar usuario
// ─────────────────────────────────────────────────────────────

const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Protección: No permite que el admin se elimine a sí mismo
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }
    
    await usuario.destroy();
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET: Estadísticas de usuarios
// ─────────────────────────────────────────────────────────────

const getEstadisticasUsuarios = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.count();
    const totalClientes = await Usuario.count({ where: { rol: 'cliente' } });
    const totalAdmins = await Usuario.count({ where: { rol: 'administrador' } });
    const usuariosActivos = await Usuario.count({ where: { activo: true } });
    const usuariosInactivos = await Usuario.count({ where: { activo: false } });
    
    res.json({
      success: true,
      data: {
        total: totalUsuarios,
        porRol: {
          clientes: totalClientes,
          administradores: totalAdmins
        },
        porEstado: {
          activos: usuariosActivos,
          inactivos: usuariosInactivos
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getEstadisticasUsuarios:', error);
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
  getUsuarios,
  getUsuarioById,
  crearUsuario,
  actualizarUsuario,
  toggleUsuario,
  eliminarUsuario,
  getEstadisticasUsuarios
};