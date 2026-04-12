const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Servicio = sequelize.define('Servicio', {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notNull: { msg: 'El nombre es obligatorio' }
    }
  },
  //Ampliar mas la lista de servicios.
  categoria: {
    type: DataTypes.ENUM(
      'manicure',
      'pedicure',
      'cabello',
      'barberia'
    ),
    allowNull: false
  },

  descripcion: {
    type: DataTypes.STRING
  },

  precio: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Debe ser un número válido' },
      min: { args: [0], msg: 'No puede ser negativo' }
    }
  },

  duracion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duración en minutos'
  },

  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'servicios',
  timestamps: true
});


// Metodos estaticos

Servicio.obtenerPorCategoria = async function(categoria) {
  return await this.findAll({
    where: { categoria, activo: true }
  });
};

// Metodos de instancia

Servicio.prototype.esDisponible = function() {
  return this.activo;
};


module.exports = Servicio;