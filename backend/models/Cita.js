/**
 * ============================================
 * MODELO CITA
 * ============================================
 * Define la estructura de la tabla 'citas' en MySQL usando Sequelize ORM.
 * Cada registro representa una cita agendada por un cliente con un profesional.
 * Un cliente SIEMPRE existe, pero el profesional puede asignarse manual o automáticamente.
 * Una cita puede tener múltiples servicios (relación muchos a muchos).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cita = sequelize.define('Cita', {

  // ==========================================
  // COLUMNAS
  // ==========================================

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  // Cliente que agenda la cita
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'La cita debe tener un cliente'
      }
    }
  },

  // Profesional (puede ser asignado automáticamente)
  profesionalId: {
    type: DataTypes.INTEGER,
    allowNull: true, // 👈 CLAVE DEL CAMBIO
    references: {
      model: 'usuarios',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },

  // Fecha y hora de la cita
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Debe indicar la fecha de la cita'
      },
      isDate: {
        msg: 'La fecha debe ser válida'
      }
    }
  },
  hora: {
  type: DataTypes.TIME, // 👈 aquí va la hora
  allowNull: false,
  validate: {
    notNull: {
      msg: 'Debe indicar la hora de la cita'
    },
    is: {
      args: /^([0-1]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/,
      msg: 'La hora debe tener formato HH:mm o HH:mm:ss'
    }
  }
},

  // Estado de la cita
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },

  // Notas adicionales (opcional)
  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {

  tableName: 'citas',
  timestamps: true,

  indexes: [
    {
      fields: ['clienteId']
    },
    {
      fields: ['profesionalId']
    },
    {
      fields: ['fecha']
    },
    {
      fields: ['estado']
    }
  ],

  // ==========================================
  // HOOKS
  // ==========================================

  hooks: {

    /**
     * beforeCreate → Se ejecuta antes de crear la cita
     * Si no se asignó profesional, el sistema asigna uno automáticamente
     */
    beforeCreate: async (cita) => {

      // Si ya tiene profesional → no hacer nada
      if (cita.profesionalId) return;

      const Usuario = require('./Usuario');

      // Buscar profesionales activos
      const profesionales = await Usuario.findAll({
        where: {
          rol: 'profesional',
          activo: true
        }
      });

      if (!profesionales.length) {
        throw new Error('No hay profesionales disponibles');
      }

      // Selección aleatoria (puedes mejorar luego con disponibilidad)
      const random = Math.floor(Math.random() * profesionales.length);

      cita.profesionalId = profesionales[random].id;
    },

    /**
     * beforeUpdate → Validar cambios importantes
     */
    beforeUpdate: async (cita) => {

      // Ejemplo: no permitir cambiar a completada sin profesional
      if (cita.estado === 'completada' && !cita.profesionalId) {
        throw new Error('Una cita completada debe tener profesional asignado');
      }
    }
  }
});


// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

/**
 * obtenerTotalServicios → suma el precio de los servicios asociados
 */
Cita.prototype.obtenerTotalServicios = async function() {
  const servicios = await this.getServicios(); // belongsToMany
  return servicios.reduce((total, s) => total + parseFloat(s.precio), 0);
};

/**
 * estaPendiente → indica si la cita sigue pendiente
 */
Cita.prototype.estaPendiente = function() {
  return this.estado === 'pendiente';
};

/**
 * puedeCancelarse → lógica básica de cancelación
 */
Cita.prototype.puedeCancelarse = function() {
  return ['pendiente', 'confirmada'].includes(this.estado);
};


module.exports = Cita;