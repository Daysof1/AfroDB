const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProfesionalEspecialidad = sequelize.define('ProfesionalEspecialidad', {

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },

  especialidadId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'especialidades',
      key: 'id'
    }
  }

}, {

  tableName: 'profesional_especialidad',
  timestamps: true,

  indexes: [
    {
      unique: true,
      fields: ['usuarioId', 'especialidadId']
    }
  ],

  hooks: {

    /**
     * 🔥 VALIDACIÓN CLAVE
     */
    beforeCreate: async (registro) => {

      const Usuario = require('./Usuario');

      const usuario = await Usuario.findByPk(registro.usuarioId);

      if (!usuario) {
        throw new Error('El usuario no existe');
      }

      // 🔥 AQUÍ ESTÁ TODO
      if (usuario.rol !== 'profesional') {
        throw new Error('Solo los usuarios con rol profesional pueden tener especialidades');
      }
    }
  }
});

module.exports = ProfesionalEspecialidad;