/** Aqui se definira la estructura del modelo de agendamiento*/

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Agendar = sequelize.define('Agendar', {

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
      notNull: {
        msg: 'Debe especificar un usuario'
      }
    }
  },

  servicioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicios', // Agregar un modelo de servivicios. 
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'Debe especificar un servicio'
      }
    }
  },

  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: { msg: 'Debe ingresar una fecha' },
      isDate: { msg: 'Formato de fecha inválido' }
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
    type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada'),
    defaultValue: 'pendiente'
  },

  notas: {
    type: DataTypes.STRING
  }

}, {
  tableName: 'agendamientos',
  timestamps: true,

  indexes: [
    {
      fields: ['usuarioId']
    },
    {
      fields: ['servicioId']
    },
    {
      unique: true,
      fields: ['fecha', 'hora'],
      name: 'fecha_hora_unique'
    }
  ],
  
  /**hooks: funciones que Sequelize ejecuta automáticamente en ciertos momentos
   *  Son como "eventos" del ciclo de vida del registro */ 

  hooks: {
    beforeCreate: async (cita) => {
      const Servicio = require('./Servicio');

      const servicio = await Servicio.findByPk(cita.servicioId);

      if (!servicio) {
        throw new Error('El servicio no existe');
      }

      if (!servicio.activo) {
        throw new Error('El servicio no está disponible');
      }
    }
  }
});

// Metodos de instancia

Agendar.prototype.esCancelable = function() {
  return this.estado !== 'cancelada';
};

// Metodos estaticos

Agendar.obtenerCitasUsuario = async function(usuarioId) {
  return await this.findAll({
    where: { usuarioId },
    order: [['fecha', 'DESC'], ['hora', 'DESC']]
  });
};

Agendar.verificarDisponibilidad = async function(fecha, hora) {
  const cita = await this.findOne({
    where: { fecha, hora }
  });

  return !cita; // true si está libre
};

module.exports = Agendar;