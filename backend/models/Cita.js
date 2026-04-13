/**
 * ============================================
 * MODELO CITA (AGENDAMIENTO)
 * ============================================
 * Gestiona la reserva de servicios por parte de los usuarios.
 * Relaciona:
 *  - Usuario (cliente)
 *  - Servicio
 *  - Fecha y hora
 */

const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Cita = sequelize.define('Cita', {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

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
      notNull: { msg: 'Debe especificar un usuario' }
    }
  },

  servicioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicios',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: { msg: 'Debe especificar un servicio' }
    }
  },

  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: { msg: 'Debe ingresar una fecha' },
      isDate: { msg: 'Formato de fecha inválido' },
      isAfter: {
        args: new Date().toISOString().split('T')[0],
        msg: 'La fecha debe ser hoy o futura'
      }
    }
  },

  hora: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      notNull: { msg: 'Debe ingresar una hora' }
    }
  },

  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'finalizada'),
    allowNull: false,
    defaultValue: 'pendiente'
  },

  notas: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {

  tableName: 'agendamientos',
  timestamps: true,

  indexes: [
    { fields: ['usuarioId'] },
    { fields: ['servicioId'] },
    { fields: ['fecha', 'hora'] }
  ],

  hooks: {
    /**
     * Valida:
     * - Servicio existe y está activo
     * - No haya doble reserva en misma hora
     */
    beforeCreate: async (cita) => {
      const Servicio = require('./Servicio');

      const servicio = await Servicio.findByPk(cita.servicioId);

      if (!servicio) {
        throw new Error('El servicio no existe');
      }

      if (!servicio.activo) {
        throw new Error('El servicio no está disponible');
      }

      // Validar disponibilidad (evitar doble cita)
      const existe = await Cita.findOne({
        where: {
          fecha: cita.fecha,
          hora: cita.hora,
          estado: {
            [Op.ne]: 'cancelada'
          }
        }
      });

      if (existe) {
        throw new Error('Ya existe una cita en esa fecha y hora');
      }
    }
  }

});


// ===============================
// MÉTODOS DE INSTANCIA
// ===============================

Cita.prototype.esCancelable = function() {
  return this.estado !== 'cancelada' && this.estado !== 'finalizada';
};

Cita.prototype.esActiva = function() {
  return this.estado === 'pendiente' || this.estado === 'confirmada';
};


// ===============================
// MÉTODOS ESTÁTICOS
// ===============================

Cita.obtenerCitasUsuario = async function(usuarioId) {
  return await this.findAll({
    where: { usuarioId },
    order: [['fecha', 'DESC'], ['hora', 'DESC']]
  });
};

Cita.verificarDisponibilidad = async function(fecha, hora) {
  const cita = await this.findOne({
    where: {
      fecha,
      hora,
      estado: {
        [Op.ne]: 'cancelada'
      }
    }
  });

  return !cita;
};

Cita.obtenerPorFecha = async function(fecha) {
  return await this.findAll({
    where: { fecha },
    order: [['hora', 'ASC']]
  });
};


// ===============================
// EXPORTACIÓN
// ===============================

module.exports = Cita;