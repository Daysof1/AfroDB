/**
 * ============================================
 * CONTROLADOR DE USUARIOS (Admin)
 * ============================================
 * Gestión de usuarios por parte de administradores.
 * CRUD completo: listar, ver, crear, actualizar, toggle, eliminar y estadísticas.
 * Solo accesible por administradores (protegido por middleware checkRole).
 * Las rutas están definidas en routes/admin.routes.js
 */

// Importa el modelo Usuario desde models/Usuario.js → tabla 'Usuario'
const Usuario = require('../models/Usuario');

/**
 * Obtener todos los usuarios (admin)
 * 
 * Ruta: GET /api/admin/usuarios
 * Query params opcionales:
 * - rol: 'cliente' | 'administrador'
 * - activo: 'true'/'false'
 * - buscar: texto para buscar en nombre, apellido o email
 * - pagina, limite: Paginación
 */
const getUsuarios = async (req, res) => {
  try {
    // Extrae filtros y paginación de los query params
    const { rol, activo, buscar, pagina = 1, limite = 10 } = req.query;
    
    // Construye filtros dinámicamente
    const where = {};
    if (rol) where.rol = rol;                                   // Filtra por rol
    if (activo !== undefined) where.activo = activo === 'true';  // Convierte string a boolean
    
    // Búsqueda por texto en nombre, apellido o email
    if (buscar) {
      const { Op } = require('sequelize');   // Importa operadores de Sequelize
      // Op.or: busca donde coincida CUALQUIERA de las condiciones
      // Op.like: equivale a LIKE en SQL. %texto% busca en cualquier posición.
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { email: { [Op.like]: `%${buscar}%` } }
      ];
    }
    
    // Calcula el offset para paginación (cuántos registros saltar)
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    
    // Consulta usuarios con paginación.
    // attributes.exclude: ['password'] → trae TODOS los campos EXCEPTO password (seguridad).
    const { count, rows: usuarios } = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },   // Nunca enviar la contraseña al frontend
      limit: parseInt(limite),
      offset,
      order: [['createdAt', 'DESC']]            // Más recientes primero
    });
    
    // Responde con los usuarios y la paginación
    res.json({
      success: true,
      data: {
        usuarios,
        paginacion: {
          total: count,
          pagina: parseInt(pagina),
          limite: parseInt(limite),
          totalPaginas: Math.ceil(count / parseInt(limite))
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

/**
 * Obtener un usuario por ID (admin)
 * 
 * Ruta: GET /api/admin/usuarios/:id
 */
const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;    // ID del usuario desde la URL
    
    // Busca por Primary Key, excluyendo el campo password de la respuesta
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
      data: {
        usuario
      }
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

/**
 * Crear nuevo usuario (admin)
 * 
 * Ruta: POST /api/admin/usuarios
 * Body JSON: { nombre, apellido, email, password, rol, telefono, direccion }
 * A diferencia del registro público, aquí el admin elige el rol.
 */
const crearUsuario = async (req, res) => {
  try {
    // Extrae todos los campos del body
    const { nombre, apellido, email, password, rol, telefono, direccion } = req.body;
    
    // VALIDACIÓN 1: Campos obligatorios
    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, apellido, email, password y rol'
      });
    }
    
    // VALIDACIÓN 2: El rol debe ser uno de los permitidos
    if (!['cliente', 'auxiliar', 'administrador'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser: cliente, auxiliar o administrador'
      });
    }
    
    // VALIDACIÓN 3: Verifica que el email no esté ya registrado
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    
    // Crea el usuario en la BD. El hook beforeCreate del modelo
    // se encarga de hashear (encriptar) la contraseña automáticamente.
    const nuevoUsuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password,                          // Se hashea automáticamente en el hook
      rol,                               // El admin elige el rol
      telefono: telefono || null,        // Opcional, null si no se envía
      direccion: direccion || null,       // Opcional
      activo: true                        // Se crea activo por defecto
    });
    
    // 201 = Created. toJSON() convierte la instancia a objeto plano
    // (y el modelo excluye password con defaultScope o el getter del modelo)
    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        usuario: nuevoUsuario.toJSON()
      }
    });
    
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    
    // Captura errores de validación del modelo Sequelize
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

/**
 * Actualizar usuario (admin)
 * 
 * Ruta: PUT /api/admin/usuarios/:id
 * Body JSON: { nombre, apellido, telefono, direccion, rol }
 * NOTA: No permite cambiar email ni password desde aquí.
 */
const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, direccion, rol } = req.body;
    
    // Busca el usuario por ID
    const usuario = await Usuario.findByPk(id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // VALIDACIÓN: Si se envía rol, debe ser válido
    if (rol && !['cliente', 'administrador'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido'
      });
    }
    
    // Actualiza SOLO los campos que se enviaron
    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    if (rol !== undefined) usuario.rol = rol;
    
    // save() ejecuta UPDATE en la BD
    await usuario.save();
    
    // Responde con el usuario actualizado (toJSON excluye password)
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

/**
 * Activar/Desactivar usuario (toggle) (admin)
 * 
 * Ruta: PATCH /api/admin/usuarios/:id/toggle
 * Invierte el estado activo del usuario.
 * Protección: un admin NO puede desactivarse a sí mismo.
 */
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
    
    // PROTECCIÓN: No permite que el admin se desactive a sí mismo.
    // req.usuario.id viene del middleware de autenticación (JWT decodificado).
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes desactivar tu propia cuenta'
      });
    }
    
    // Invierte el estado: true → false, false → true
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

/**
 * Eliminar usuario (admin)
 * 
 * Ruta: DELETE /api/admin/usuarios/:id
 * Protección: un admin NO puede eliminarse a sí mismo.
 */
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
    
    // PROTECCIÓN: No permite que el admin se elimine a sí mismo
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      });
    }
    
    // destroy() ejecuta DELETE FROM Usuario WHERE id = :id
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

/**
 * Obtener estadísticas de usuarios (admin)
 * 
 * Ruta: GET /api/admin/usuarios/stats
 * Retorna: totales, por rol y por estado.
 */
const getEstadisticasUsuarios = async (req, res) => {
  try {
    // Cuenta total de usuarios en la BD
    const totalUsuarios = await Usuario.count();
    // Cuenta usuarios con rol 'cliente'
    const totalClientes = await Usuario.count({ where: { rol: 'cliente' } });
    // Cuenta usuarios con rol 'administrador'
    const totalAdmins = await Usuario.count({ where: { rol: 'administrador' } });
    // Cuenta usuarios activos
    const usuariosActivos = await Usuario.count({ where: { activo: true } });
    // Cuenta usuarios inactivos
    const usuariosInactivos = await Usuario.count({ where: { activo: false } });
    
    // Responde con todas las estadísticas
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

// Exporta todas las funciones del controlador para usarlas en las rutas de admin.
module.exports = {
  getUsuarios,               // GET    /api/admin/usuarios - Listar todos
  getUsuarioById,            // GET    /api/admin/usuarios/:id - Ver uno
  crearUsuario,              // POST   /api/admin/usuarios - Crear nuevo
  actualizarUsuario,         // PUT    /api/admin/usuarios/:id - Actualizar
  toggleUsuario,             // PATCH  /api/admin/usuarios/:id/toggle - Activar/Desactivar
  eliminarUsuario,           // DELETE /api/admin/usuarios/:id - Eliminar
  getEstadisticasUsuarios    // GET    /api/admin/usuarios/stats - Estadísticas
};
