/**
 * ============================================
 * MODELO SUBCATEGORIA
 * ============================================
 * Ahora soporta tanto productos como servicios mediante el campo 'tipo'.
 * Mantiene coherencia con la categoría padre.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subcategoria = sequelize.define('Subcategoria', {

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
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre de la subcategoría no puede estar vacío'
      },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    }
  },

  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // 🔥 NUEVO CAMPO CLAVE
  tipo: {
    type: DataTypes.ENUM('producto', 'servicio'),
    allowNull: false,
    validate: {
      notNull: {
        msg: 'Debe especificar el tipo (producto o servicio)'
      },
      isIn: {
        args: [['producto', 'servicio']],
        msg: 'El tipo debe ser producto o servicio'
      }
    }
  },

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

  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {

  tableName: 'subcategorias',
  timestamps: true,

  indexes: [
    {
      fields: ['categoriaId']
    },
    {
      fields: ['tipo'] // 🔥 NUEVO ÍNDICE
    },
    {
      unique: true,
      fields: ['nombre', 'categoriaId'],
      name: 'nombre_categoria_unique'
    }
  ],

  hooks: {

    /**
     * beforeCreate → valida coherencia con categoría
     */
    beforeCreate: async (subcategoria) => {
      const Categoria = require('./Categoria');

      const categoria = await Categoria.findByPk(subcategoria.categoriaId);

      if (!categoria) {
        throw new Error('La categoría seleccionada no existe');
      }

      if (!categoria.activo) {
        throw new Error('No se puede crear una subcategoría en una categoría inactiva');
      }

      // 🔥 VALIDACIÓN CLAVE
      if (categoria.tipo !== subcategoria.tipo) {
        throw new Error('El tipo de la subcategoría no coincide con la categoría');
      }
    },

    /**
     * beforeUpdate → valida cambios de tipo o categoría
     */
    beforeUpdate: async (subcategoria) => {
      if (subcategoria.changed('tipo') || subcategoria.changed('categoriaId')) {
        const Categoria = require('./Categoria');

        const categoria = await Categoria.findByPk(subcategoria.categoriaId);

        if (!categoria) {
          throw new Error('La categoría seleccionada no existe');
        }

        if (categoria.tipo !== subcategoria.tipo) {
          throw new Error('El tipo de la subcategoría no coincide con la categoría');
        }
      }
    },

    /**
     * afterUpdate → desactivación en cascada
     */
    afterUpdate: async (subcategoria, options) => {

      if (subcategoria.changed('activo') && !subcategoria.activo) {
        console.log(`⚠️ Desactivando subcategoría: ${subcategoria.nombre}`);

        const Producto = require('./Producto');
        const Servicio = require('./Servicio'); // 🔥 NUEVO

        try {

          // 🔹 Productos
          if (subcategoria.tipo === 'producto') {
            const productos = await Producto.findAll({
              where: { subcategoriaId: subcategoria.id }
            });

            for (const producto of productos) {
              await producto.update(
                { activo: false },
                { transaction: options.transaction }
              );
              console.log(`  ↳ Producto desactivado: ${producto.nombre}`);
            }
          }

          // 🔥 🔹 Servicios
          if (subcategoria.tipo === 'servicio') {
            const servicios = await Servicio.findAll({
              where: { subcategoriaId: subcategoria.id }
            });

            for (const servicio of servicios) {
              await servicio.update(
                { activo: false },
                { transaction: options.transaction }
              );
              console.log(`  ↳ Servicio desactivado: ${servicio.nombre}`);
            }
          }

          console.log(`✅ Subcategoría y elementos relacionados desactivados correctamente`);

        } catch (error) {
          console.error('❌ Error al desactivar elementos relacionados:', error.message);
          throw error;
        }
      }
    }
  }
});


// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================

Subcategoria.prototype.contarProductos = async function() {
  const Producto = require('./Producto');
  return await Producto.count({
    where: { subcategoriaId: this.id }
  });
};

// 🔥 NUEVO
Subcategoria.prototype.contarServicios = async function() {
  const Servicio = require('./Servicio');
  return await Servicio.count({
    where: { subcategoriaId: this.id }
  });
};

Subcategoria.prototype.obtenerCategoria = async function() {
  const Categoria = require('./Categoria');
  return await Categoria.findByPk(this.categoriaId);
};

module.exports = Subcategoria;