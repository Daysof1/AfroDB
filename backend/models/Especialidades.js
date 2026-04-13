/**
 * ============================================
 * MODELO ESPECIALIDAD
 * ============================================
 * Define la estructura de la tabla 'especialidades' en MySQL usando Sequelize ORM.
 * Almacena las habilidades o áreas en las que un profesional se desempeña:
 *   - Manicure
 *   - Pedicure
 *   - Corte de cabello
 *   - Barbería
 *   - Coloración, etc.
 * 
 * Este modelo permite organizar los servicios del sistema y relacionarlos
 * con los empleados (profesionales) mediante una relación muchos a muchos.
 */

// Importa DataTypes de sequelize
const { DataTypes } = require('sequelize');

// Importa la instancia de conexión a la base de datos
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea el modelo que mapea a la tabla 'especialidades'
 */
const Especialidad = sequelize.define('Especialidad', {

  // ==========================================
  // COLUMNAS DE LA TABLA 'especialidades'
  // ==========================================

  // ID único de la especialidad
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  // Nombre de la especialidad (ej: Manicure, Barbería)
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: {
      msg: 'Esta especialidad ya existe'
    },
    validate: {
      notEmpty: {
        msg: 'El nombre de la especialidad no puede estar vacío'
      },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    }
  },

  // Descripción de la especialidad
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 255],
        msg: 'La descripción no debe superar los 255 caracteres'
      }
    }
  },

  // Estado de la especialidad (activa/inactiva)
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {

  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================

  tableName: 'especialidades',
  timestamps: true,

  // SCOPES
  defaultScope: {
    where: {
      activo: true   // Solo muestra especialidades activas por defecto
    }
  },

  scopes: {
    // Muestra todas, incluso inactivas
    withInactive: {
      where: {}
    }
  }

});

// ==========================================
// MÉTODOS DE INSTANCIA (OPCIONAL)
// ==========================================

/**
 * toJSON() → Limpia la salida del modelo
 * (útil si luego agregas más campos internos)
 */
Especialidad.prototype.toJSON = function() {
  const valores = Object.assign({}, this.get());
  return valores;
};

// Exporta el modelo
module.exports = Especialidad;