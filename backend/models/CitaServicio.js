/**
 * ============================================
 * MODELO CITA_SERVICIO
 * ============================================
 * Tabla intermedia entre citas y servicios (relación muchos a muchos).
 * Guarda información adicional como:
 * - precio en el momento (histórico)
 * - duración en el momento
 * - cantidad (opcional)
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CitaServicio = sequelize.define('CitaServicio', {

  // ==========================================
  // COLUMNAS
  // ==========================================

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  // FK → Cita
  citaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'citas',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },

  // FK → Servicio
  servicioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicios',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },

  // 🔥 PRECIO HISTÓRICO
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El precio debe ser válido'
      },
      min: {
        args: [0],
        msg: 'El precio no puede ser negativo'
      }
    }
  },

  // 🔥 DURACIÓN HISTÓRICA
  duracion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: 'La duración debe ser un número entero'
      },
      min: {
        args: [1],
        msg: 'La duración debe ser mayor a 0'
      }
    }
  },

  // Opcional (por si algún día lo necesitas)
  cantidad: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      isInt: true,
      min: 1
    }
  }

}, {

  tableName: 'cita_servicios',
  timestamps: true,

  indexes: [
    { fields: ['citaId'] },
    { fields: ['servicioId'] },
    {
      unique: true,
      fields: ['citaId', 'servicioId'], // evita duplicados
      name: 'cita_servicio_unique'
    }
  ],

  // ==========================================
  // HOOKS
  // ==========================================

  hooks: {

    /**
     * beforeCreate → copia datos del servicio (histórico)
     */
    beforeCreate: async (citaServicio) => {

      const Servicio = require('./Servicio');

      const servicio = await Servicio.findByPk(citaServicio.servicioId);

      if (!servicio) {
        throw new Error('El servicio no existe');
      }

      if (!servicio.activo) {
        throw new Error('El servicio no está disponible');
      }

      // 🔥 CLAVE: guardar valores históricos
      citaServicio.precio = servicio.precio;
      citaServicio.duracion = servicio.duracion;
    }
  }
});


// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * calcularSubtotal → precio * cantidad
 */
CitaServicio.prototype.calcularSubtotal = function() {
  return parseFloat(this.precio) * this.cantidad;
};

module.exports = CitaServicio;