/**
 * ============================================
 * MODELO CARRITO
 * ============================================
 * Define la estructura de la tabla 'carritos' en MySQL usando Sequelize ORM.
 * Cada fila representa UN producto que un usuario agregó a su carrito de compras.
 * Es una tabla intermedia entre Usuario y Producto (relación muchos a muchos).
 * Las asociaciones con Usuario y Producto se definen en models/index.js
 */

// Importa DataTypes de la librería 'sequelize' (paquete npm)
// DataTypes define los tipos de datos de las columnas: INTEGER, STRING, DECIMAL, BOOLEAN, etc.
const { DataTypes } = require('sequelize');

// Importa la instancia 'sequelize' (conexión activa a MySQL) desde config/database.js
// Esta instancia se creó con new Sequelize(database, user, password, opciones)
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea un modelo que representa una tabla en la BD.
 * Primer argumento: 'Carrito' → nombre del modelo (Sequelize lo usa internamente)
 * Segundo argumento: objeto con las columnas y sus configuraciones
 * Tercer argumento: opciones del modelo (tableName, timestamps, hooks, indexes)
 */
const Carrito = sequelize.define('Carrito', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'carritos'
  // ==========================================
  
  // Columna 'id' → Identificador único de cada item del carrito
  id: {
    type: DataTypes.INTEGER,           // Tipo INT en MySQL
    primaryKey: true,                  // Es la clave primaria de la tabla
    autoIncrement: true,               // MySQL auto-incrementa: 1, 2, 3...
    allowNull: false                   // No permite valores NULL
  },

  // Columna 'usuarioId' → Clave foránea (FK) que apunta a la tabla 'usuarios'
  // Indica QUÉ usuario es dueño de este item del carrito
  usuarioId: {
    type: DataTypes.INTEGER,           // Tipo INT, debe coincidir con usuarios.id
    allowNull: false,                  // Obligatorio: todo item pertenece a un usuario
    references: {                      // Define la relación de FK en la BD
      model: 'usuarios',              // Tabla referenciada → tabla 'usuarios'
      key: 'id'                       // Columna referenciada → usuarios.id
    },
    onUpdate: 'CASCADE',              // Si cambia usuarios.id → actualiza aquí también
    onDelete: 'CASCADE',              // Si se elimina el usuario → elimina sus items del carrito
    validate: {                       // Validaciones de Sequelize (a nivel de aplicación)
      notNull: {
        msg: 'Debe especificar un usuario'   // Mensaje si es null
      }
    }
  },

  // Columna 'productoId' → Clave foránea (FK) que apunta a la tabla 'productos'
  // Indica QUÉ producto se agregó al carrito
  productoId: {
    type: DataTypes.INTEGER,           // Tipo INT, debe coincidir con productos.id
    allowNull: false,                  // Obligatorio: todo item tiene un producto
    references: {                      // Define la relación de FK en la BD
      model: 'productos',             // Tabla referenciada → tabla 'productos'
      key: 'id'                       // Columna referenciada → productos.id
    },
    onUpdate: 'CASCADE',              // Si cambia productos.id → actualiza aquí
    onDelete: 'CASCADE',              // Si se elimina el producto → elimina del carrito
    validate: {
      notNull: {
        msg: 'Debe especificar un producto'
      }
    }
  },

  // Columna 'cantidad' → Cuántas unidades de este producto hay en el carrito
  cantidad: {
    type: DataTypes.INTEGER,           // Tipo INT (números enteros)
    allowNull: false,                  // Obligatorio
    defaultValue: 1,                   // Si no se especifica, por defecto es 1
    validate: {                        // Validaciones de Sequelize
      isInt: {                         // Valida que sea un entero
        msg: 'La cantidad debe ser un número entero'
      },
      min: {                           // Valida que sea mínimo 1
        args: [1],                     // Valor mínimo permitido
        msg: 'La cantidad debe ser al menos 1'
      }
    }
  },

  // Columna 'precioUnitario' → Precio del producto AL MOMENTO de agregarlo al carrito
  // Se guarda una "foto" del precio para que si el producto sube de precio,
  // el carrito mantenga el precio original al que se agregó
  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),    // DECIMAL(10,2) → hasta 99,999,999.99
    allowNull: false,                  // Obligatorio (se asigna automáticamente en el hook)
    validate: {
      isDecimal: {                     // Valida formato decimal
        msg: 'El precio debe ser un número decimal válido'
      },
      min: {                           // No permite precios negativos
        args: [0],
        msg: 'El precio no puede ser negativo'
      }
    }
  }

}, {
  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================
  
  tableName: 'carritos',              // Nombre EXACTO de la tabla en MySQL (en minúsculas)
  timestamps: true,                   // Sequelize crea automáticamente createdAt y updatedAt
  
  // Índices → mejoran el rendimiento de las consultas SQL frecuentes
  indexes: [
    {
      // Índice simple en 'usuarioId' → acelera: SELECT * FROM carritos WHERE usuarioId = ?
      fields: ['usuarioId']
    },
    {
      // Índice ÚNICO compuesto → evita que un usuario tenga el MISMO producto dos veces
      // Si usuario 1 ya tiene producto 5 en el carrito, no puede crear otro registro igual
      // En vez de duplicar, se actualiza la cantidad del registro existente
      unique: true,                   // UNIQUE → no permite combinaciones repetidas
      fields: ['usuarioId', 'productoId'],  // Columnas del índice compuesto
      name: 'usuario_producto_unique'       // Nombre del índice en MySQL
    }
  ],
  
  // HOOKS → funciones que Sequelize ejecuta automáticamente en ciertos momentos
  // Son como "eventos" del ciclo de vida del registro
  hooks: {
    /**
     * beforeCreate → se ejecuta ANTES de insertar un nuevo registro en la tabla
     * Valida que el producto exista, esté activo y tenga stock disponible.
     * También asigna automáticamente el precioUnitario desde el producto.
     */
    beforeCreate: async (itemCarrito) => {
      // Importa el modelo Producto aquí dentro (no arriba) para evitar "circular dependency"
      // (Carrito necesita Producto y Producto puede necesitar Carrito → ciclo)
      const Producto = require('./Producto');
      
      // Busca el producto en la BD por su ID
      // findByPk = Find By Primary Key → SELECT * FROM productos WHERE id = productoId
      const producto = await Producto.findByPk(itemCarrito.productoId);
      
      // Si no existe el producto → lanza error y NO se crea el registro
      if (!producto) {
        throw new Error('El producto no existe');
      }
      
      // Si el producto está desactivado (activo = false) → no se puede agregar
      if (!producto.activo) {
        throw new Error('No se puede agregar un producto inactivo al carrito');
      }
      
      // hayStock() es un método del modelo Producto (Producto.prototype.hayStock)
      // Verifica si producto.stock >= cantidad solicitada
      if (!producto.hayStock(itemCarrito.cantidad)) {
        throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);
      }
      
      // Guarda el precio ACTUAL del producto como precioUnitario del carrito
      // Así el precio queda "congelado" al momento de agregar al carrito
      itemCarrito.precioUnitario = producto.precio;
    },

    /**
     * beforeUpdate → se ejecuta ANTES de actualizar un registro existente
     * Valida que haya stock suficiente si el usuario cambia la cantidad
     */
    beforeUpdate: async (itemCarrito) => {
      // changed('cantidad') retorna true si la cantidad fue modificada
      // Solo valida stock si realmente cambió la cantidad
      if (itemCarrito.changed('cantidad')) {
        const Producto = require('./Producto');
        
        // Busca el producto actual en la BD
        const producto = await Producto.findByPk(itemCarrito.productoId);
        
        if (!producto) {
          throw new Error('El producto no existe');
        }
        
        // Verifica que haya suficiente stock para la nueva cantidad
        if (!producto.hayStock(itemCarrito.cantidad)) {
          throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);
        }
      }
    }
  }
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================
// Los métodos de instancia se agregan a prototype.
// Se llaman sobre UN registro específico: itemCarrito.calcularSubtotal()

/**
 * calcularSubtotal() → Calcula precio × cantidad de este item
 * parseFloat() convierte el DECIMAL de la BD a número JavaScript
 * @returns {number} Subtotal de este item del carrito
 */
Carrito.prototype.calcularSubtotal = function() {
  return parseFloat(this.precioUnitario) * this.cantidad;
};

/**
 * actualizarCantidad() → Cambia la cantidad de este item después de validar stock
 * @param {number} nuevaCantidad - Nueva cantidad deseada
 * @returns {Promise<Carrito>} El item actualizado
 */
Carrito.prototype.actualizarCantidad = async function(nuevaCantidad) {
  const Producto = require('./Producto');   // Importa Producto para verificar stock
  
  // Busca el producto en la BD
  const producto = await Producto.findByPk(this.productoId);
  
  // Verifica que haya stock suficiente para la nueva cantidad
  if (!producto.hayStock(nuevaCantidad)) {
    throw new Error(`Stock insuficiente. Solo hay ${producto.stock} unidades disponibles`);
  }
  
  this.cantidad = nuevaCantidad;           // Asigna la nueva cantidad
  return await this.save();                // save() ejecuta UPDATE en la BD
};

// ==========================================
// MÉTODOS ESTÁTICOS (DE CLASE)
// ==========================================
// Los métodos estáticos se llaman sobre el MODELO: Carrito.obtenerCarritoUsuario(id)
// No necesitan una instancia previa

/**
 * obtenerCarritoUsuario() → Trae todos los items del carrito de un usuario
 * Incluye los datos completos del producto (nombre, precio, imagen, etc.)
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>} Array de items del carrito con productos incluidos
 */
Carrito.obtenerCarritoUsuario = async function(usuarioId) {
  const Producto = require('./Producto');   // Importa para hacer el JOIN
  
  // findAll → SELECT * FROM carritos WHERE usuarioId = ?
  // include → hace un LEFT JOIN con la tabla 'productos'
  return await this.findAll({
    where: { usuarioId },                  // Filtra por el usuario
    include: [
      {
        model: Producto,                   // Modelo a incluir en el JOIN
        as: 'producto'                     // Alias definido en models/index.js (belongsTo)
      }
    ],
    order: [['createdAt', 'DESC']]         // Más recientes primero
  });
};

/**
 * calcularTotalCarrito() → Suma los subtotales de todos los items del carrito
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number>} Total del carrito en dinero
 */
Carrito.calcularTotalCarrito = async function(usuarioId) {
  // Trae todos los items del carrito del usuario
  const items = await this.findAll({
    where: { usuarioId }
  });
  
  // Recorre cada item y acumula el subtotal (precio × cantidad)
  let total = 0;
  for (const item of items) {
    total += item.calcularSubtotal();      // Usa el método de instancia definido arriba
  }
  
  return total;                            // Retorna el total acumulado
};

/**
 * vaciarCarrito() → Elimina TODOS los items del carrito de un usuario
 * Se usa después de que el usuario completa un pedido (checkout)
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number>} Número de filas eliminadas
 */
Carrito.vaciarCarrito = async function(usuarioId) {
  // destroy() con where → DELETE FROM carritos WHERE usuarioId = ?
  return await this.destroy({
    where: { usuarioId }
  });
};

// Exporta el modelo Carrito para usarlo en controladores y otros modelos
// Se importa como: const Carrito = require('./Carrito')
module.exports = Carrito;
