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
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: {
      msg: 'Este servicio ya existe'
    },
    validate: {
      notEmpty: { msg: 'El nombre no puede estar vacío' },
      len: {
        args: [2, 120],
        msg: 'Debe tener entre 2 y 120 caracteres'
      }
    }
  },

  // ⚠️ Mejorable: luego puedes reemplazar esto por FK a Especialidad
  categoria: {
    type: DataTypes.ENUM(
      'manicure',
      'pedicure',
      'cabello',
      'barberia',
      'cejas_pestañas',
      'tratamientos'
    ),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La categoría es obligatoria' }
    }
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 255],
        msg: 'Máximo 255 caracteres'
      }
    }
  },

  precio: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    validate: {
      isDecimal: { msg: 'Debe ser un número válido' },
      min: {
        args: [0],
        msg: 'El precio no puede ser negativo'
      }
    }
  },

  duracion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duración en minutos',
    validate: {
      isInt: { msg: 'Debe ser un número entero' },
      min: {
        args: [5],
        msg: 'Mínimo 5 minutos'
      },
      max: {
        args: [600],
        msg: 'Máximo 10 horas'
      }
    }
  },

  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {

  tableName: 'servicios',
  timestamps: true,

  defaultScope: {
    where: { activo: true }
  },

  scopes: {
    withInactive: {
      where: {}
    }
  }

});


// ===============================
// MÉTODOS ESTÁTICOS
// ===============================

Servicio.obtenerPorCategoria = async function(categoria) {
  return await this.findAll({
    where: { categoria, activo: true }
  });
};

Servicio.obtenerActivos = async function() {
  return await this.findAll({
    where: { activo: true }
  });
};


// ===============================
// MÉTODOS DE INSTANCIA
// ===============================

Servicio.prototype.esDisponible = function() {
  return this.activo;
};

Servicio.prototype.formatearPrecio = function() {
  return `$${parseFloat(this.precio).toLocaleString()}`;
};


// ===============================
// EXPORTACIÓN
// ===============================

module.exports = Servicio;