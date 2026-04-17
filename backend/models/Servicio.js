/**
 * ============================================
 * MODELO SERVICIO
 * ============================================
 * Define la estructura de la tabla 'servicios' en MySQL usando Sequelize ORM.
 * Cada servicio pertenece a una categoría y subcategoría de tipo 'servicio'.
 * Puede ser usado en múltiples citas (relación muchos a muchos).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Servicio = sequelize.define('Servicio', {

  // ==========================================
  // COLUMNAS
  // ==========================================

  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  nombre: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del servicio no puede estar vacío'
      },
      len: {
        args: [3, 150],
        msg: 'El nombre debe tener entre 3 y 150 caracteres'
      }
    }
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'El precio debe ser un número válido'
      },
      min: {
        args: [0],
        msg: 'El precio no puede ser negativo'
      }
    }
  },

  duracion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: {
        msg: 'La duración debe ser un número entero'
      },
      min: {
        args: [1],
        msg: 'La duración debe ser mayor a 0 minutos'
      }
    }
  },

  imagen: {
      type: DataTypes.STRING(255),       // VARCHAR(255) → nombre del archivo
      allowNull: true,                   // Opcional: un servicio puede no tener imagen
      validate: {
        is: {                            // Valida con expresión regular (regex)
          args: /\.(jpg|jpeg|png|gif)$/i,
          msg: 'La imagen debe ser un archivo JPG, PNG o GIF'
        }
      }
    },

  // 🔹 FK categoría
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categorias',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'Debe seleccionar una categoría'
      }
    }
  },

  // 🔹 FK subcategoría
  subcategoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'subcategorias',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    validate: {
      notNull: {
        msg: 'Debe seleccionar una subcategoría'
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

  indexes: [
    { fields: ['nombre'] },
    { fields: ['categoriaId'] },
    { fields: ['subcategoriaId'] },
    { fields: ['activo'] }
  ],

  // ==========================================
  // HOOKS
  // ==========================================

  hooks: {

    /**
     * beforeCreate → Validación completa de coherencia
     */
    beforeCreate: async (servicio) => {

      const Categoria = require('./Categoria');
      const Subcategoria = require('./Subcategoria');

      const categoria = await Categoria.findByPk(servicio.categoriaId);
      const subcategoria = await Subcategoria.findByPk(servicio.subcategoriaId);

      // Existencia
      if (!categoria) {
        throw new Error('La categoría seleccionada no existe');
      }

      if (!subcategoria) {
        throw new Error('La subcategoría seleccionada no existe');
      }

      // Activo
      if (!categoria.activo) {
        throw new Error('No se puede crear un servicio en una categoría inactiva');
      }

      if (!subcategoria.activo) {
        throw new Error('No se puede crear un servicio en una subcategoría inactiva');
      }

      // 🔥 TIPO (CLAVE)
      if (categoria.tipo !== 'servicio') {
        throw new Error('La categoría no corresponde a servicios');
      }

      if (subcategoria.tipo !== 'servicio') {
        throw new Error('La subcategoría no corresponde a servicios');
      }

      // Coherencia relacional
      if (subcategoria.categoriaId !== servicio.categoriaId) {
        throw new Error('La subcategoría no pertenece a la categoría seleccionada');
      }

      // Validación lógica de duración
      if (servicio.duracion > 480) {
        throw new Error('La duración del servicio es demasiado larga');
      }
    },

    /**
     * beforeUpdate → Validar cambios críticos
     */
    beforeUpdate: async (servicio) => {

      if (
        servicio.changed('categoriaId') ||
        servicio.changed('subcategoriaId')
      ) {

        const Categoria = require('./Categoria');
        const Subcategoria = require('./Subcategoria');

        const categoria = await Categoria.findByPk(servicio.categoriaId);
        const subcategoria = await Subcategoria.findByPk(servicio.subcategoriaId);

        if (!categoria || categoria.tipo !== 'servicio') {
          throw new Error('La categoría no corresponde a servicios');
        }

        if (!subcategoria || subcategoria.tipo !== 'servicio') {
          throw new Error('La subcategoría no corresponde a servicios');
        }

        if (subcategoria.categoriaId !== servicio.categoriaId) {
          throw new Error('La subcategoría no pertenece a la categoría');
        }
      }
    }
  }
});


// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

Servicio.prototype.obtenerDuracionHoras = function() {
  return (this.duracion / 60).toFixed(2);
};

Servicio.prototype.estaActivo = function() {
  return this.activo;
};

Servicio.prototype.formatearPrecio = function() {
  return `$${parseFloat(this.precio).toLocaleString('es-CO')}`;
};


module.exports = Servicio;