/**
 * ============================================
 * MODELO DETALLE PEDIDO
 * ============================================
 * Define la estructura de la tabla 'detalle_pedidos' en MySQL usando Sequelize ORM.
 * Cada fila representa UN producto incluido dentro de un pedido específico.
 * Es la tabla intermedia de la relación muchos-a-muchos entre Pedido y Producto.
 * Ejemplo: Si un pedido tiene 3 productos, habrá 3 filas en esta tabla con el mismo pedidoId.
 * Guarda precio y cantidad "congelados" al momento de la compra (historial inmutable).
 */

// Importa DataTypes de la librería 'sequelize' (paquete npm)
// DataTypes proporciona los tipos de datos: INTEGER, DECIMAL, etc.
const { DataTypes } = require('sequelize');

// Importa la instancia 'sequelize' (conexión activa a MySQL) desde config/database.js
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea el modelo que mapea a la tabla 'detalle_pedidos'.
 * 'DetallePedido' → nombre interno del modelo en Sequelize
 */
const DetallePedido = sequelize.define('DetallePedido', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'detalle_pedidos'
  // ==========================================
  
  // Columna 'id' → Identificador único de cada línea de detalle
  id: {
    type: DataTypes.INTEGER,           // Tipo INT en MySQL
    primaryKey: true,                  // Es la clave primaria
    autoIncrement: true,               // Auto-incrementa: 1, 2, 3...
    allowNull: false                   // No permite NULL
  },

  // Columna 'pedidoId' → Clave foránea (FK) que apunta a la tabla 'pedidos'
  // Indica A QUÉ pedido pertenece este detalle
  pedidoId: {
    type: DataTypes.INTEGER,           // Tipo INT, coincide con pedidos.id
    allowNull: false,                  // Obligatorio: todo detalle pertenece a un pedido
    references: {                      // Define la relación FK en MySQL
      model: 'pedidos',               // Tabla referenciada → tabla 'pedidos'
      key: 'id'                       // Columna referenciada → pedidos.id
    },
    onUpdate: 'CASCADE',              // Si cambia pedidos.id → actualiza aquí
    onDelete: 'CASCADE',              // Si se elimina el pedido → elimina sus detalles
    validate: {
      notNull: {
        msg: 'Debe especificar un pedido'
      }
    }
  },

  // Columna 'productoId' → Clave foránea (FK) que apunta a la tabla 'productos'
  // Indica QUÉ producto se compró en esta línea del pedido
  productoId: {
    type: DataTypes.INTEGER,           // Tipo INT, coincide con productos.id
    allowNull: false,                  // Obligatorio: todo detalle tiene un producto
    references: {
      model: 'productos',             // Tabla referenciada → tabla 'productos'
      key: 'id'                       // Columna referenciada → productos.id
    },
    onUpdate: 'CASCADE',              // Si cambia productos.id → actualiza aquí
    onDelete: 'RESTRICT',             // RESTRICT → NO permite eliminar un producto que tiene pedidos
    validate: {
      notNull: {
        msg: 'Debe especificar un producto'
      }
    }
  },

  // Columna 'cantidad' → Cuántas unidades de este producto se compraron
  cantidad: {
    type: DataTypes.INTEGER,           // Tipo INT (entero)
    allowNull: false,                  // Obligatorio
    validate: {
      isInt: {                         // Valida que sea entero
        msg: 'La cantidad debe ser un número entero'
      },
      min: {                           // Mínimo 1 unidad
        args: [1],
        msg: 'La cantidad debe ser al menos 1'
      }
    }
  },

  // Columna 'precioUnitario' → Precio del producto AL MOMENTO de la compra
  // Se guarda como "foto" del precio para mantener el historial
  // Si el producto sube o baja de precio después, este registro NO cambia
  precioUnitario: {
    type: DataTypes.DECIMAL(10, 2),    // DECIMAL(10,2) → hasta 99,999,999.99
    allowNull: false,                  // Obligatorio
    validate: {
      isDecimal: {                     // Valida formato decimal
        msg: 'El precio debe ser un número decimal válido'
      },
      min: {                           // No permite negativos
        args: [0],
        msg: 'El precio no puede ser negativo'
      }
    }
  },

  // Columna 'subtotal' → Total de esta línea = precioUnitario × cantidad
  // Se calcula automáticamente en el hook beforeCreate
  // Ejemplo: Si precio = 50000 y cantidad = 3, subtotal = 150000
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),    // DECIMAL(10,2)
    allowNull: false,                  // Obligatorio (se asigna en el hook)
    validate: {
      isDecimal: {
        msg: 'El subtotal debe ser un número decimal válido'
      },
      min: {
        args: [0],
        msg: 'El subtotal no puede ser negativo'
      }
    }
  }

}, {
  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================
  
  tableName: 'detalle_pedidos',        // Nombre EXACTO de la tabla en MySQL
  timestamps: false,                   // NO crea createdAt/updatedAt (los detalles no cambian)
  
  // Índices → aceleran las consultas SQL frecuentes
  indexes: [
    {
      // Índice en 'pedidoId' → acelera: SELECT * FROM detalle_pedidos WHERE pedidoId = ?
      // Usado cuando se consultan los detalles de un pedido específico
      fields: ['pedidoId']
    },
    {
      // Índice en 'productoId' → acelera búsquedas por producto
      // Usado para estadísticas de productos más vendidos
      fields: ['productoId']
    }
  ],
  
  // HOOKS → funciones automáticas del ciclo de vida del registro
  hooks: {
    /**
     * beforeCreate → Se ejecuta ANTES de insertar un nuevo detalle en la BD
     * Calcula automáticamente el subtotal = precioUnitario × cantidad
     */
    beforeCreate: (detalle) => {
      // parseFloat() convierte el DECIMAL de Sequelize a número JavaScript
      // Luego multiplica por la cantidad para obtener el subtotal
      detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
    },

    /**
     * beforeUpdate → Se ejecuta ANTES de actualizar un detalle existente
     * Recalcula el subtotal si el precio o la cantidad cambiaron
     */
    beforeUpdate: (detalle) => {
      // changed() verifica si un campo fue modificado
      if (detalle.changed('precioUnitario') || detalle.changed('cantidad')) {
        detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
      }
    }
  }
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================
// Se llaman sobre UN registro: detalle.calcularSubtotal()

/**
 * calcularSubtotal() → Calcula manualmente el subtotal de esta línea
 * Útil para verificaciones antes de guardar
 * @returns {number} precioUnitario × cantidad
 */
DetallePedido.prototype.calcularSubtotal = function() {
  return parseFloat(this.precioUnitario) * this.cantidad;
};

/**
 * obtenerProducto() → Busca y retorna el producto asociado a este detalle
 * Ejecuta: SELECT * FROM productos WHERE id = this.productoId
 * @returns {Promise<Producto>} Instancia del modelo Producto
 */
DetallePedido.prototype.obtenerProducto = async function() {
  const Producto = require('./Producto');   // Importa el modelo Producto
  return await Producto.findByPk(this.productoId);  // findByPk = Find By Primary Key
};

// ==========================================
// MÉTODOS ESTÁTICOS (DE CLASE)
// ==========================================
// Se llaman sobre el MODELO, no sobre una instancia: DetallePedido.crearDesdeCarrito(...)

/**
 * crearDesdeCarrito() → Convierte los items del carrito en detalles de pedido
 * Se usa durante el checkout: los items del carrito se "copian" como detalles del nuevo pedido.
 * 
 * @param {number} pedidoId - ID del pedido recién creado
 * @param {Array} itemsCarrito - Array de items del carrito (cada uno tiene productoId, cantidad, precioUnitario)
 * @returns {Promise<Array>} Array de detalles creados
 */
DetallePedido.crearDesdeCarrito = async function(pedidoId, itemsCarrito) {
  const detalles = [];                     // Array para acumular los detalles creados
  
  // Recorre cada item del carrito
  for (const item of itemsCarrito) {
    // this.create() → INSERT INTO detalle_pedidos VALUES (...)
    // El hook beforeCreate calcula el subtotal automáticamente
    const detalle = await this.create({
      pedidoId: pedidoId,                  // ID del pedido al que pertenece
      productoId: item.productoId,         // Producto que se compró
      cantidad: item.cantidad,             // Cantidad comprada
      precioUnitario: item.precioUnitario  // Precio al momento de la compra
    });
    
    detalles.push(detalle);                // Agrega al array de resultados
  }
  
  return detalles;                         // Retorna todos los detalles creados
};

/**
 * calcularTotalPedido() → Suma los subtotales de todos los detalles de un pedido
 * Ejecuta: SELECT * FROM detalle_pedidos WHERE pedidoId = ? → luego suma los subtotales
 * 
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<number>} Total calculado del pedido
 */
DetallePedido.calcularTotalPedido = async function(pedidoId) {
  // Trae todos los detalles del pedido
  const detalles = await this.findAll({
    where: { pedidoId }
  });
  
  // Recorre y acumula los subtotales
  let total = 0;
  for (const detalle of detalles) {
    total += parseFloat(detalle.subtotal); // parseFloat convierte DECIMAL a número JS
  }
  
  return total;
};

/**
 * obtenerMasVendidos() → Obtiene los productos más vendidos (ranking)
 * Usa funciones de agregación SQL: SUM() y GROUP BY
 * 
 * SQL equivalente:
 *   SELECT productoId, SUM(cantidad) as totalVendido
 *   FROM detalle_pedidos
 *   GROUP BY productoId
 *   ORDER BY totalVendido DESC
 *   LIMIT ?
 * 
 * @param {number} limite - Cuántos productos retornar (default: 10)
 * @returns {Promise<Array>} Array de { productoId, totalVendido }
 */
DetallePedido.obtenerMasVendidos = async function(limite = 10) {
  // Importa sequelize para usar funciones SQL (fn, col)
  const { sequelize } = require('../config/database');
  
  return await this.findAll({
    attributes: [
      'productoId',                        // Columna productoId
      // sequelize.fn('SUM', ...) → función SQL SUM()
      // sequelize.col('cantidad') → referencia a la columna 'cantidad'
      // El resultado se nombra como 'totalVendido' (alias)
      [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendido']
    ],
    group: ['productoId'],                 // GROUP BY productoId → agrupa por producto
    // Ordena por totalVendido de mayor a menor (los más vendidos primero)
    order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
    limit: limite                          // Limita la cantidad de resultados
  });
};

// Exporta el modelo DetallePedido para usarlo en controladores y otros modelos
// Se importa como: const DetallePedido = require('./DetallePedido')
module.exports = DetallePedido;
