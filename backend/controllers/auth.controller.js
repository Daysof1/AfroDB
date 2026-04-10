/**
 * ============================================
 * CONTROLADOR DE AUTENTICACIÓN
 * ============================================
 * Maneja el registro, login, perfil y cambio de contraseña de usuarios.
 * Es usado por las rutas definidas en routes/auth.routes.js.
 * Cada función recibe (req, res) de Express y responde con JSON.
 */

// Importa el modelo Usuario desde la carpeta models.
// Este modelo representa la tabla 'Usuario' en la BD y permite hacer operaciones CRUD.
const Usuario = require('../models/Usuario');

// Importa la función generateToken desde config/jwt.js.
// Se usa para crear un token JWT después de un registro o login exitoso.
const { generateToken } = require('../config/jwt');

/**
 * Registrar nuevo usuario
 * 
 * Crea un nuevo usuario con rol 'cliente' en la base de datos.
 * Los administradores solo pueden ser creados desde el seeder o por otro administrador.
 * 
 * Ruta: POST /api/auth/register
 * Body esperado: { nombre, apellido, email, password, telefono, direccion }
 */
const register = async (req, res) => {
  try {
    // Desestructura los datos enviados en el body de la petición HTTP.
    // req.body contiene los datos que el cliente envía en formato JSON.
    const { nombre, apellido, email, password, telefono, direccion } = req.body;
    
    // VALIDACIÓN 1: Verifica que los campos obligatorios existan.
    // El operador ! convierte a booleano: si es vacío, null o undefined, retorna true.
    if (!nombre || !apellido || !email || !password) {
      // res.status(400) = Bad Request (datos inválidos del cliente)
      // .json() envía la respuesta en formato JSON
      // return detiene la ejecución para que no siga al siguiente código
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, apellido, email y password son obligatorios'
      });
    }
    
    // VALIDACIÓN 2: Verifica que el email tenga un formato válido usando una expresión regular.
    // La regex valida: texto@texto.texto (estructura básica de un email)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // .test() prueba si la cadena coincide con la regex, retorna true/false
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }
    
    // VALIDACIÓN 3: Verifica que la contraseña tenga al menos 6 caracteres.
    // .length retorna la cantidad de caracteres de un string.
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // VALIDACIÓN 4: Busca en la BD si ya existe un usuario con ese email.
    // findOne() busca UN registro que coincida con la condición where.
    // Retorna el registro encontrado o null si no existe.
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    
    // Si encontró un usuario con ese email, no permite registrarse
    if (usuarioExistente) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }
    
    // CREAR USUARIO en la base de datos.
    // Usuario.create() inserta un nuevo registro en la tabla Usuario.
    // El hook beforeCreate (definido en el modelo) hashea automáticamente la contraseña.
    // El password se guarda encriptado, nunca en texto plano.
    const nuevoUsuario = await Usuario.create({
      nombre,                          // Nombre del usuario
      apellido,                        // Apellido del usuario
      email,                           // Email (único)
      password,                        // Contraseña (será hasheada por el hook)
      telefono: telefono || null,      // Teléfono opcional: si no viene, guarda null
      direccion: direccion || null,    // Dirección opcional: si no viene, guarda null
      rol: 'cliente'                   // Fuerza rol 'cliente' por seguridad (no permite que envíen 'administrador')
    });
    
    // GENERAR TOKEN JWT con los datos básicos del usuario recién creado.
    // Este token se envía al cliente para que lo use en las siguientes peticiones.
    const token = generateToken({
      id: nuevoUsuario.id,          // ID del usuario en la BD
      email: nuevoUsuario.email,    // Email del usuario
      rol: nuevoUsuario.rol         // Rol del usuario ('cliente')
    });
    
    // PREPARAR RESPUESTA: convierte el objeto Sequelize a JSON plano
    // y elimina el campo password para no enviarlo al cliente por seguridad.
    const usuarioRespuesta = nuevoUsuario.toJSON();
    delete usuarioRespuesta.password;  // Elimina la propiedad password del objeto
    
    // Responde con status 201 (Created = recurso creado exitosamente)
    // Envía el usuario (sin password) y el token JWT
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario: usuarioRespuesta,  // Datos del usuario sin contraseña
        token                        // Token JWT para autenticación
      }
    });
    
  } catch (error) {
    // Si ocurre cualquier error inesperado, lo captura aquí
    // Registra el error completo en consola del servidor (para debugging)
    console.error('Error en register:', error);
    // Responde con status 500 (Internal Server Error = error del servidor)
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message  // Solo envía el mensaje, no el stack completo
    });
  }
};

/**
 * Iniciar sesión (Login)
 * 
 * Autentica un usuario verificando email y contraseña.
 * Si las credenciales son correctas, retorna el usuario y un token JWT.
 * 
 * Ruta: POST /api/auth/login
 * Body esperado: { email, password }
 */
const login = async (req, res) => {
  try {
    // Extrae email y password del body de la petición
    const { email, password } = req.body;
    
    // VALIDACIÓN 1: Verifica que se enviaron ambos campos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }
    
    // VALIDACIÓN 2: Busca el usuario por email en la BD.
    // .scope('withPassword') es un scope definido en el modelo Usuario
    // que INCLUYE el campo password (normalmente está excluido por seguridad).
    // Se necesita el password aquí para poder compararlo con el que envió el usuario.
    const usuario = await Usuario.scope('withPassword').findOne({
      where: { email }  // Busca donde el email coincida
    });
    
    // Si no encontró ningún usuario con ese email
    if (!usuario) {
      // Status 401 = Unauthorized (no autorizado)
      // Mensaje genérico "Credenciales inválidas" por seguridad
      // (no revela si el email existe o no)
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // VALIDACIÓN 3: Verifica que la cuenta del usuario esté activa.
    // Un admin puede desactivar cuentas, impidiendo el login.
    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo. Contacte al administrador'
      });
    }
    
    // VALIDACIÓN 4: Compara la contraseña enviada con la almacenada (hasheada).
    // compararPassword() es un método definido en el modelo Usuario
    // que usa bcrypt para comparar de forma segura.
    // Retorna true si coinciden, false si no.
    const passwordValida = await usuario.compararPassword(password);
    
    // Si la contraseña no coincide
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // GENERAR TOKEN JWT con los datos básicos del usuario autenticado
    const token = generateToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol
    });
    
    // PREPARAR RESPUESTA: elimina el password del objeto antes de enviarlo
    const usuarioSinPassword = usuario.toJSON();
    delete usuarioSinPassword.password;
    
    // Responde con status 200 (OK) - res.json() usa 200 por defecto
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        usuario: usuarioSinPassword,  // Datos del usuario sin contraseña
        token                          // Token JWT para usar en futuras peticiones
      }
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Obtener perfil del usuario autenticado
 * 
 * Retorna los datos actualizados del usuario que hizo la petición.
 * Requiere que el middleware verificarAuth haya validado el token antes.
 * 
 * Ruta: GET /api/auth/me
 * Headers requeridos: { Authorization: 'Bearer TOKEN' }
 */
const getMe = async (req, res) => {
  try {
    // req.usuario fue agregado por el middleware verificarAuth (middleware/auth.js)
    // Contiene los datos decodificados del token (id, email, rol).
    // Volvemos a consultar la BD para obtener los datos más recientes del usuario.
    // findByPk() busca por Primary Key (clave primaria = id)
    const usuario = await Usuario.findByPk(req.usuario.id, {
      // attributes.exclude: lista los campos que NO queremos obtener
      // Excluye 'password' para no enviarlo en la respuesta
      attributes: { exclude: ['password'] }
    });
    
    // Si el usuario fue eliminado después de generar el token
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Responde con los datos del usuario
    res.json({
      success: true,
      data: {
        usuario
      }
    });
    
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

/**
 * Actualizar perfil del usuario autenticado
 * 
 * Permite al usuario actualizar su información personal.
 * NO permite cambiar el rol ni el estado activo (solo un admin puede).
 * 
 * Ruta: PUT /api/auth/me
 * Headers: { Authorization: 'Bearer TOKEN' }
 * Body: { nombre, apellido, telefono, direccion }
 */
const updateMe = async (req, res) => {
  try {
    // Solo extrae los campos que el usuario tiene PERMITIDO cambiar.
    // No extrae 'rol' ni 'activo' por seguridad.
    const { nombre, apellido, telefono, direccion } = req.body;
    
    // Busca el usuario en la BD por su ID (viene del token via middleware)
    const usuario = await Usuario.findByPk(req.usuario.id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // ACTUALIZAR CAMPOS: solo actualiza si el campo viene definido en el body.
    // La condición !== undefined permite enviar valores vacíos o null intencionalmente.
    // Si el campo no viene en el body, no lo modifica (mantiene el valor actual).
    if (nombre !== undefined) usuario.nombre = nombre;
    if (apellido !== undefined) usuario.apellido = apellido;
    if (telefono !== undefined) usuario.telefono = telefono;
    if (direccion !== undefined) usuario.direccion = direccion;
    
    // .save() persiste los cambios en la base de datos.
    // Sequelize genera un UPDATE SQL solo con los campos que cambiaron.
    await usuario.save();
    
    // Responde con los datos actualizados.
    // toJSON() convierte el objeto Sequelize a un objeto plano
    // y el modelo excluye automáticamente el password en toJSON().
    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        usuario: usuario.toJSON()
      }
    });
    
  } catch (error) {
    console.error('Error en updateMe:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

/**
 * Cambiar contraseña del usuario autenticado
 * 
 * Requiere la contraseña actual como verificación de seguridad.
 * La nueva contraseña se hashea automáticamente por el hook beforeUpdate.
 * 
 * Ruta: PUT /api/auth/change-password
 * Headers: { Authorization: 'Bearer TOKEN' }
 * Body: { passwordActual, passwordNueva }
 */
const changePassword = async (req, res) => {
  try {
    // Extrae las dos contraseñas del body
    const { passwordActual, passwordNueva } = req.body;
    
    // VALIDACIÓN 1: Verifica que ambas contraseñas fueron enviadas
    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere contraseña actual y nueva contraseña'
      });
    }
    
    // VALIDACIÓN 2: Verifica longitud mínima de la nueva contraseña
    if (passwordNueva.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    
    // VALIDACIÓN 3: Busca el usuario CON el password incluido (scope especial).
    // Necesitamos el password para comparar la contraseña actual.
    const usuario = await Usuario.scope('withPassword').findByPk(req.usuario.id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // VALIDACIÓN 4: Verifica que la contraseña actual proporcionada sea correcta.
    // Compara con bcrypt la contraseña en texto plano vs la hasheada en la BD.
    const passwordValida = await usuario.compararPassword(passwordActual);
    
    if (!passwordValida) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }
    
    // ACTUALIZAR CONTRASEÑA: asigna la nueva contraseña al usuario.
    // El hook beforeUpdate del modelo se encargará de hashearla automáticamente
    // antes de guardarla en la BD (nunca se guarda en texto plano).
    usuario.password = passwordNueva;
    await usuario.save();  // Guarda los cambios en la BD
    
    // Responde confirmando el cambio (no envía el password ni token nuevo)
    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
    
  } catch (error) {
    console.error('Error en changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

// Exporta todas las funciones del controlador como un objeto.
// Estas funciones se importan en routes/auth.routes.js para asociarlas a las rutas.
// Ejemplo en rutas: router.post('/register', authController.register);
module.exports = {
  register,         // POST /api/auth/register - Registro de nuevos usuarios
  login,            // POST /api/auth/login - Inicio de sesión
  getMe,            // GET /api/auth/me - Obtener perfil propio
  updateMe,         // PUT /api/auth/me - Actualizar perfil propio
  changePassword    // PUT /api/auth/change-password - Cambiar contraseña
};
