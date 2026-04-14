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

  // Usuario que agenda la cita
  usuarioId: {
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
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },

  // Fecha de la cita
  fecha: {
    type: DataTypes.DATEONLY,
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

  // Hora de la cita
  hora: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'La hora de la cita es obligatoria'
      }
    }
  },

  // Duración total de la cita en minutos
  duracionTotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: 'La duración total debe ser un número entero'
      },
      min: {
        args: [1],
        msg: 'La duración total debe ser mayor a 0 minutos'
      }
    }
  },

  // Total cobrado por la cita
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El total debe ser un número decimal válido'
      },
      min: {
        args: [0],
        msg: 'El total no puede ser negativo'
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
      fields: ['usuarioId']
    },
    {
      fields: ['profesionalId']
    },
    {
      fields: ['fecha']
    },
    {
      fields: ['hora']
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