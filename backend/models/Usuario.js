/**
 * ============================================
 * MODELO USUARIO
 * ============================================
 * Define la estructura de la tabla 'usuarios' en MySQL usando Sequelize ORM.
 * Almacena la información de todos los usuarios del sistema:
 *   - Clientes → compran productos, tienen carrito y pedidos
 *   - Auxiliares → ayudan en tareas de administración (acceso limitado)
 *   - Administradores → control total del sistema
 * La contraseña se encripta automáticamente con bcrypt antes de guardar (hooks).
 * El defaultScope excluye el password de las consultas por seguridad.
 */

// Importa DataTypes de la librería 'sequelize' (paquete npm)
// Define los tipos de datos de las columnas: INTEGER, STRING, ENUM, BOOLEAN, TEXT
const { DataTypes } = require('sequelize');

// Importa bcryptjs (paquete npm) para encriptar y comparar contraseñas
// bcrypt genera un "hash" (versión encriptada) de la contraseña que no se puede revertir
const bcrypt = require('bcryptjs');

// Importa la instancia 'sequelize' (conexión activa a MySQL) desde config/database.js
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea el modelo que mapea a la tabla 'usuarios'.
 * 'Usuario' → nombre interno del modelo
 * Segundo argumento → definición de columnas
 * Tercer argumento → opciones (tableName, timestamps, scopes, hooks)
 */
const Usuario = sequelize.define('Usuario', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'usuarios'
  // ==========================================
  
  // Columna 'id' → Identificador único de cada usuario
  id: {
    type: DataTypes.INTEGER,           // Tipo INT en MySQL → número entero
    primaryKey: true,                  // Es la clave primaria (PK)
    autoIncrement: true,               // MySQL auto-incrementa: 1, 2, 3...
    allowNull: false                   // No permite NULL
  },

  // Columna 'nombre' → Nombre del usuario
  nombre: {
    type: DataTypes.STRING(100),       // VARCHAR(100) en MySQL → máximo 100 caracteres
    allowNull: false,                  // Obligatorio: todo usuario necesita nombre
    validate: {                        // Validaciones de Sequelize (a nivel de aplicación)
      notEmpty: {                      // No permite cadena vacía ""
        msg: 'El nombre no puede estar vacío'
      },
      len: {                           // Valida longitud mínima y máxima
        args: [2, 100],                // Entre 2 y 100 caracteres
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    }
  },

  // Columna 'email' → Correo electrónico del usuario (identificador de login)
  email: {
    type: DataTypes.STRING(100),       // VARCHAR(100) → máximo 100 caracteres
    allowNull: false,                  // Obligatorio
    unique: {                          // UNIQUE → no puede haber dos usuarios con el mismo email
      msg: 'Este email ya está registrado'
    },
    validate: {
      isEmail: {                       // Valida formato de email (usa regex internamente)
        msg: 'Debe ser un email válido'
      },
      notEmpty: {
        msg: 'El email no puede estar vacío'
      }
    }
  },

  // Columna 'password' → Contraseña del usuario (se guarda encriptada/hasheada)
  // NUNCA se guarda la contraseña en texto plano; el hook beforeCreate la encripta
  password: {
    type: DataTypes.STRING(255),       // VARCHAR(255) → el hash de bcrypt tiene ~60 caracteres
    allowNull: false,                  // Obligatorio
    validate: {
      notEmpty: {
        msg: 'La contraseña no puede estar vacía'
      },
      len: {
        args: [6, 255],                // Mínimo 6 caracteres (antes de encriptar)
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    }
  },

  // Columna 'rol' → Define qué tipo de usuario es y qué puede hacer
  // Los permisos se verifican en los middlewares: middleware/checkRole.js
  rol: {
    type: DataTypes.ENUM(              // ENUM en MySQL → solo permite estos valores exactos
      'cliente',                       // Cliente: compra productos, tiene carrito y pedidos
      'auxiliar',                      // Auxiliar: acceso parcial al panel de administración
      'administrador'                  // Administrador: control total del sistema
    ),
    allowNull: false,                  // Obligatorio
    defaultValue: 'cliente',           // Por defecto se registra como cliente
    validate: {
      isIn: {                          // Doble validación: a nivel de Sequelize
        args: [['cliente', 'auxiliar', 'administrador']],
        msg: 'El rol debe ser cliente, auxiliar o administrador'
      }
    }
  },

  // Columna 'telefono' → Número de teléfono del usuario (opcional)
  telefono: {
    type: DataTypes.STRING(20),        // VARCHAR(20) → máximo 20 caracteres
    allowNull: true,                   // Opcional: puede ser NULL
    validate: {
      is: {                            // Valida con expresión regular (regex)
        args: /^[0-9+\-\s()]*$/,      // Solo permite: números (0-9), +, -, espacios, paréntesis
        msg: 'El teléfono solo puede contener números y caracteres válidos'
      }
    }
  },

  // Columna 'direccion' → Dirección del usuario (opcional, se usa para envíos)
  direccion: {
    type: DataTypes.TEXT,              // TEXT en MySQL → texto largo sin límite fijo
    allowNull: true                   // Opcional
  },

  // Columna 'activo' → Estado del usuario (activo/inactivo)
  // Si es false, el usuario NO puede iniciar sesión (verificado en middleware/auth.js)
  activo: {
    type: DataTypes.BOOLEAN,           // TINYINT(1) en MySQL → true (1) o false (0)
    allowNull: false,                  // Obligatorio
    defaultValue: true                 // Por defecto se crea activo
  }

}, {
  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================
  
  tableName: 'usuarios',              // Nombre EXACTO de la tabla en MySQL
  timestamps: true,                   // Crea automáticamente createdAt y updatedAt
  
  // SCOPES → consultas predefinidas que se aplican automáticamente
  // Son como "filtros" que Sequelize agrega a las consultas sin que tengas que escribirlo
  defaultScope: {
    // defaultScope se aplica a TODAS las consultas por defecto
    // Excluye el campo 'password' → NUNCA se envía la contraseña al frontend accidentalmente
    attributes: { exclude: ['password'] }
  },
  scopes: {
    // Scope personalizado 'withPassword' → incluye TODOS los campos (incluyendo password)
    // Se usa SOLO cuando se necesita la contraseña (ej: login para compararla)
    // Uso: Usuario.scope('withPassword').findOne({ where: { email } })
    withPassword: {
      attributes: {}                   // attributes vacío = incluir todo
    }
  },
  
  // HOOKS → funciones que Sequelize ejecuta automáticamente en ciertos momentos
  hooks: {
    /**
     * beforeCreate → Se ejecuta ANTES de insertar un nuevo usuario en la BD
     * Encripta la contraseña con bcrypt para que nunca se guarde en texto plano.
     * bcrypt genera un "hash" único e irreversible.
     */
    beforeCreate: async (usuario) => {
      if (usuario.password) {          // Solo si hay contraseña (siempre debería haber)
        // genSalt(10) genera una "semilla aleatoria" con factor de costo 10
        // El factor de costo controla qué tan lento es el cálculo (más = más seguro pero más lento)
        const salt = await bcrypt.genSalt(10);
        
        // hash() combina la contraseña + salt para generar el hash
        // Ejemplo: "miPassword123" → "$2a$10$K8Q7e4J..." (irreversible)
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    },

    /**
     * beforeUpdate → Se ejecuta ANTES de actualizar un usuario existente
     * Si la contraseña fue modificada, la encripta de nuevo.
     * Si se actualizan otros campos (nombre, teléfono), NO toca la contraseña.
     */
    beforeUpdate: async (usuario) => {
      // changed('password') retorna true SOLO si el campo password fue modificado
      if (usuario.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(usuario.password, salt);
      }
    }
  }
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================
// Se agregan a prototype → se llaman sobre UN usuario: usuario.compararPassword('123')

/**
 * compararPassword() → Compara una contraseña en texto plano con el hash guardado
 * bcrypt.compare() hace el cálculo internamente: hashea el input y lo compara con el hash almacenado.
 * Se usa en el login (auth.controller.js) para verificar que la contraseña sea correcta.
 * 
 * @param {string} passwordIngresado - Contraseña que el usuario escribió en el formulario
 * @returns {Promise<boolean>} true si coinciden, false si no
 * 
 * Ejemplo: const coincide = await usuario.compararPassword('miPassword123');
 */
Usuario.prototype.compararPassword = async function(passwordIngresado) {
  // compare() compara la contraseña en texto plano con el hash almacenado en this.password
  return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * toJSON() → Convierte la instancia del usuario a un objeto plano SIN la contraseña
 * Se llama automáticamente cuando se hace res.json(usuario) o JSON.stringify(usuario).
 * Asegura que la contraseña NUNCA se envíe al frontend, incluso si se obtuvo con scope withPassword.
 * 
 * @returns {Object} Objeto plano con los datos del usuario (sin password)
 */
Usuario.prototype.toJSON = function() {
  // this.get() obtiene todos los valores de la instancia como objeto plano
  // Object.assign({}, ...) crea una COPIA (para no modificar el original)
  const valores = Object.assign({}, this.get());
  
  // Elimina la contraseña de la copia
  delete valores.password;
  
  return valores;                      // Retorna el objeto sin password
};

// Exporta el modelo Usuario para usarlo en controladores, middleware, seeders y otros modelos
// Se importa como: const Usuario = require('./Usuario')
module.exports = Usuario;
