/**
 * ============================================
 * MODELO PEDIDO
 * ============================================
 * Define la estructura de la tabla 'pedidos' en MySQL usando Sequelize ORM.
 * Cada fila representa un pedido/compra realizada por un usuario.
 * Un pedido tiene múltiples detalles (tabla detalle_pedidos) → cada detalle es un producto comprado.
 * Los pedidos pasan por estados: pendiente → pagado → enviado → entregado (o cancelado).
 * Las fechas de pago, envío y entrega se registran automáticamente vía hooks.
 * REGLA DE NEGOCIO: Los pedidos NO se pueden eliminar, solo cancelar.
 */

// Importa DataTypes de la librería 'sequelize' (paquete npm)
// Define los tipos de columnas: INTEGER, DECIMAL, ENUM, TEXT, DATE, etc.
const { DataTypes } = require('sequelize');

// Importa la instancia 'sequelize' (conexión activa a MySQL) desde config/database.js
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea el modelo que mapea a la tabla 'pedidos'.
 * 'Pedido' → nombre interno del modelo en Sequelize
 */
const Pedido = sequelize.define('Pedido', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'pedidos'
  // ==========================================
  
  // Columna 'id' → Identificador único de cada pedido
  id: {
    type: DataTypes.INTEGER,           // Tipo INT en MySQL
    primaryKey: true,                  // Clave primaria (PK)
    autoIncrement: true,               // Auto-incrementa: 1, 2, 3...
    allowNull: false                   // No permite NULL
  },

  // Columna 'usuarioId' → Clave foránea (FK) que apunta a la tabla 'usuarios'
  // Indica QUÉ usuario realizó este pedido
  usuarioId: {
    type: DataTypes.INTEGER,           // Tipo INT, coincide con usuarios.id
    allowNull: false,                  // Obligatorio: todo pedido pertenece a un usuario
    references: {                      // Define la relación FK en MySQL
      model: 'usuarios',              // Tabla referenciada
      key: 'id'                       // Columna referenciada
    },
    onUpdate: 'CASCADE',              // Si cambia usuarios.id → actualiza aquí
    onDelete: 'RESTRICT',             // RESTRICT → NO permite eliminar un usuario que tiene pedidos
    validate: {
      notNull: {
        msg: 'Debe especificar un usuario'
      }
    }
  },

  // Columna 'total' → Monto total del pedido en dinero
  // Es la suma de todos los subtotales de detalle_pedidos
  total: {
    type: DataTypes.DECIMAL(10, 2),    // DECIMAL(10,2) → hasta 99,999,999.99
    allowNull: false,                  // Obligatorio
    validate: {
      isDecimal: {                     // Valida formato decimal
        msg: 'El total debe ser un número decimal válido'
      },
      min: {                           // No permite totales negativos
        args: [0],
        msg: 'El total no puede ser negativo'
      }
    }
  },

  // Columna 'estado' → Estado actual del pedido (flujo de vida del pedido)
  // Flujo normal: pendiente → pagado → enviado → entregado
  // Flujo alterno: pendiente/pagado → cancelado
  estado: {
    type: DataTypes.ENUM(              // ENUM en MySQL → solo permite estos valores exactos
      'pendiente',                     // Recién creado, esperando pago
      'pagado',                        // Ya pagó, se está preparando
      'enviado',                       // Ya se envió al cliente
      'entregado',                     // El cliente ya lo recibió
      'cancelado'                      // Fue cancelado (se devuelve el stock)
    ),
    allowNull: false,                  // Obligatorio
    defaultValue: 'pendiente',         // Todo pedido nuevo empieza como 'pendiente'
    validate: {
      isIn: {                          // Doble validación: a nivel de Sequelize
        args: [['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']],
        msg: 'Estado inválido'
      }
    }
  },

  // Columna 'direccionEnvio' → Dirección donde se envía el pedido
  // Puede ser diferente a la dirección del perfil del usuario
  direccionEnvio: {
    type: DataTypes.TEXT,              // TEXT en MySQL → texto largo
    allowNull: false,                  // Obligatorio para poder enviar
    validate: {
      notEmpty: {                      // No permite cadena vacía ""
        msg: 'La dirección de envío es obligatoria'
      }
    }
  },

  // Columna 'telefono' → Teléfono de contacto para el envío
  telefono: {
    type: DataTypes.STRING(20),        // VARCHAR(20) → máximo 20 caracteres
    allowNull: false,                  // Obligatorio
    validate: {
      notEmpty: {
        msg: 'El teléfono es obligatorio'
      }
    }
  },

  // Columna 'notas' → Comentarios adicionales del cliente (opcional)
  // Ejemplo: "Entregar después de las 5pm", "Dejar en portería"
  notas: {
    type: DataTypes.TEXT,              // TEXT → texto largo
    allowNull: true                   // Opcional: puede ser NULL
  },

  // Columna 'fechaPago' → Fecha y hora en que se registró el pago
  // Se asigna automáticamente en el hook afterUpdate cuando estado cambia a 'pagado'
  fechaPago: {
    type: DataTypes.DATE,              // DATETIME en MySQL
    allowNull: true                   // NULL hasta que se pague
  },

  // Columna 'fechaEnvio' → Fecha y hora en que se envió el pedido
  // Se asigna automáticamente cuando estado cambia a 'enviado'
  fechaEnvio: {
    type: DataTypes.DATE,              // DATETIME en MySQL
    allowNull: true                   // NULL hasta que se envíe
  },

  // Columna 'fechaEntrega' → Fecha y hora en que se entregó al cliente
  // Se asigna automáticamente cuando estado cambia a 'entregado'
  fechaEntrega: {
    type: DataTypes.DATE,              // DATETIME en MySQL
    allowNull: true                   // NULL hasta que se entregue
  }

}, {
  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================
  
  tableName: 'pedidos',                // Nombre EXACTO de la tabla en MySQL
  timestamps: true,                    // Sequelize crea createdAt (fecha de creación) y updatedAt
  
  // Índices → mejoran el rendimiento de consultas frecuentes
  indexes: [
    {
      // Índice en 'usuarioId' → acelera: "dame todos los pedidos de este usuario"
      fields: ['usuarioId']
    },
    {
      // Índice en 'estado' → acelera: "dame todos los pedidos pendientes"
      fields: ['estado']
    },
    {
      // Índice en 'createdAt' → acelera: "ordena los pedidos por fecha"
      fields: ['createdAt']
    }
  ],
  
  // HOOKS → funciones automáticas del ciclo de vida
  hooks: {
    /**
     * afterUpdate → Se ejecuta DESPUÉS de actualizar un pedido
     * Registra automáticamente las fechas cuando el estado cambia.
     * Usa { hooks: false } en save() para evitar un ciclo infinito
     * (sin eso, save() volvería a ejecutar afterUpdate y así indefinidamente).
     */
    afterUpdate: async (pedido) => {
      // Si el estado cambió a 'pagado' y aún no tiene fecha de pago
      if (pedido.changed('estado') && pedido.estado === 'pagado' && !pedido.fechaPago) {
        pedido.fechaPago = new Date();               // Asigna la fecha/hora actual
        await pedido.save({ hooks: false });         // Guarda SIN ejecutar hooks (evita ciclo)
      }
      
      // Si el estado cambió a 'enviado' y aún no tiene fecha de envío
      if (pedido.changed('estado') && pedido.estado === 'enviado' && !pedido.fechaEnvio) {
        pedido.fechaEnvio = new Date();
        await pedido.save({ hooks: false });
      }
      
      // Si el estado cambió a 'entregado' y aún no tiene fecha de entrega
      if (pedido.changed('estado') && pedido.estado === 'entregado' && !pedido.fechaEntrega) {
        pedido.fechaEntrega = new Date();
        await pedido.save({ hooks: false });
      }
    },

    /**
     * beforeDestroy → Se ejecuta ANTES de intentar eliminar un pedido
     * BLOQUEA la eliminación: los pedidos son históricos y NO deben borrarse.
     * Si alguien llama pedido.destroy(), se lanza un error.
     */
    beforeDestroy: async () => {
      throw new Error('No se pueden eliminar pedidos. Use el estado "cancelado" en su lugar.');
    }
  }
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================
// Se llaman sobre UN pedido: pedido.cambiarEstado('pagado')

/**
 * cambiarEstado() → Cambia el estado del pedido después de validar
 * @param {string} nuevoEstado - Nuevo estado ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado')
 * @returns {Promise<Pedido>} Pedido actualizado (el hook afterUpdate registra las fechas)
 */
Pedido.prototype.cambiarEstado = async function(nuevoEstado) {
  // Lista de estados válidos permitidos
  const estadosValidos = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
  
  // Valida que el nuevo estado esté en la lista
  if (!estadosValidos.includes(nuevoEstado)) {
    throw new Error('Estado inválido');
  }
  
  this.estado = nuevoEstado;           // Asigna el nuevo estado
  return await this.save();            // save() ejecuta UPDATE y dispara el hook afterUpdate
};

/**
 * puedeSerCancelado() → Verifica si el pedido se puede cancelar
 * Solo se cancelan pedidos en estado 'pendiente' o 'pagado'.
 * Si ya fue enviado o entregado, NO se puede cancelar.
 * @returns {boolean} true si se puede cancelar, false si no
 */
Pedido.prototype.puedeSerCancelado = function() {
  // includes() verifica si this.estado está en el array
  return ['pendiente', 'pagado'].includes(this.estado);
};

/**
 * cancelar() → Cancela el pedido y DEVUELVE el stock de los productos
 * Flujo:
 * 1. Verifica que se pueda cancelar
 * 2. Obtiene los detalles del pedido (productos comprados)
 * 3. Devuelve el stock de cada producto
 * 4. Cambia el estado a 'cancelado'
 * @returns {Promise<Pedido>} Pedido cancelado
 */
Pedido.prototype.cancelar = async function() {
  // Si no se puede cancelar (ya enviado/entregado), lanza error
  if (!this.puedeSerCancelado()) {
    throw new Error('Este pedido no puede ser cancelado');
  }
  
  // Importa modelos necesarios (aquí dentro para evitar dependencias circulares)
  const DetallePedido = require('./DetallePedido');
  const Producto = require('./Producto');
  
  // Obtiene todos los detalles (líneas) de este pedido
  // findAll → SELECT * FROM detalle_pedidos WHERE pedidoId = this.id
  const detalles = await DetallePedido.findAll({
    where: { pedidoId: this.id }
  });
  
  // Recorre cada detalle y devuelve el stock al producto
  for (const detalle of detalles) {
    // Busca el producto en la BD
    const producto = await Producto.findByPk(detalle.productoId);
    if (producto) {
      // aumentarStock() suma la cantidad de vuelta al stock del producto
      await producto.aumentarStock(detalle.cantidad);
      console.log(`  ↳ Stock devuelto: ${detalle.cantidad} x ${producto.nombre}`);
    }
  }
  
  // Cambia el estado a 'cancelado'
  this.estado = 'cancelado';
  return await this.save();            // Guarda en la BD
};

/**
 * obtenerDetalle() → Obtiene los detalles del pedido CON información de productos
 * Hace un JOIN entre detalle_pedidos y productos
 * @returns {Promise<Array>} Array de detalles con producto incluido
 */
Pedido.prototype.obtenerDetalle = async function() {
  const DetallePedido = require('./DetallePedido');
  const Producto = require('./Producto');
  
  // findAll con include → SELECT + LEFT JOIN
  return await DetallePedido.findAll({
    where: { pedidoId: this.id },      // Solo detalles de ESTE pedido
    include: [
      {
        model: Producto,               // JOIN con tabla 'productos'
        as: 'producto'                 // Alias definido en models/index.js
      }
    ]
  });
};

// ==========================================
// MÉTODOS ESTÁTICOS (DE CLASE)
// ==========================================
// Se llaman sobre el MODELO: Pedido.obtenerPorEstado('pendiente')

/**
 * obtenerPorEstado() → Obtiene todos los pedidos filtrados por estado
 * Incluye datos del usuario que hizo el pedido (nombre, email, teléfono)
 * @param {string} estado - Estado a filtrar ('pendiente', 'pagado', etc.)
 * @returns {Promise<Array>} Array de pedidos con usuario incluido
 */
Pedido.obtenerPorEstado = async function(estado) {
  const Usuario = require('./Usuario');    // Importa para hacer el JOIN
  
  return await this.findAll({
    where: { estado },                     // Filtra por estado
    include: [
      {
        model: Usuario,                    // JOIN con tabla 'usuarios'
        as: 'usuario',                     // Alias definido en models/index.js
        attributes: ['id', 'nombre', 'email', 'telefono']  // Solo trae estos campos
      }
    ],
    order: [['createdAt', 'DESC']]         // Más recientes primero
  });
};

/**
 * obtenerHistorialUsuario() → Obtiene todos los pedidos de un usuario específico
 * Se usa para "Mis Pedidos" en el frontend
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<Array>} Array de pedidos ordenados por fecha
 */
Pedido.obtenerHistorialUsuario = async function(usuarioId) {
  return await this.findAll({
    where: { usuarioId },                  // Filtra por usuario
    order: [['createdAt', 'DESC']]         // Más recientes primero
  });
};

// Exporta el modelo Pedido para usarlo en controladores y otros modelos
// Se importa como: const Pedido = require('./Pedido')
module.exports = Pedido;
