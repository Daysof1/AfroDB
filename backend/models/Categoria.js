/**
 * ============================================
 * MODELO CATEGORIA
 * ============================================
 * Define la estructura de la tabla 'categorias' en MySQL usando Sequelize ORM.
 * Almacena categorías tanto de productos como de servicios.
 * Ejemplo: "Electrónica" (producto), "Belleza" (servicio).
 * El campo 'tipo' permite diferenciar su uso.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Categoria = sequelize.define('Categoria', {

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
    unique: {
      msg: 'Ya existe una categoría con este nombre'
    },
    validate: {
      notEmpty: {
        msg: 'El nombre de la categoría no puede estar vacío'
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
        msg: 'Debe especificar el tipo de categoría (producto o servicio)'
      },
      isIn: {
        args: [['producto', 'servicio']],
        msg: 'El tipo debe ser producto o servicio'
      }
    }
  },

  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }

}, {

  tableName: 'categorias',
  timestamps: true,

  indexes: [
    {
      fields: ['nombre']
    },
    {
      fields: ['tipo'] // 🔥 NUEVO ÍNDICE
    },
    {
      fields: ['activo']
    }
  ],

  hooks: {

    /**
     * afterUpdate → Desactivación en cascada
     */
    afterUpdate: async (categoria, options) => {

      if (categoria.changed('activo') && !categoria.activo) {
        console.log(`⚠️ Desactivando categoría: ${categoria.nombre}`);

        const Subcategoria = require('./Subcategoria');
        const Producto = require('./Producto');
        const Servicio = require('./Servicio'); // 🔥 NUEVO

        try {

          // 🔹 Subcategorías
          const subcategorias = await Subcategoria.findAll({
            where: { categoriaId: categoria.id }
          });

          for (const subcategoria of subcategorias) {
            await subcategoria.update(
              { activo: false },
              { transaction: options.transaction }
            );
            console.log(`  ↳ Subcategoría desactivada: ${subcategoria.nombre}`);
          }

          // 🔹 Productos (solo si aplica)
          if (categoria.tipo === 'producto') {
            const productos = await Producto.findAll({
              where: { categoriaId: categoria.id }
            });

            for (const producto of productos) {
              await producto.update(
                { activo: false },
                { transaction: options.transaction }
              );
              console.log(`  ↳ Producto desactivado: ${producto.nombre}`);
            }
          }

          // 🔥 🔹 Servicios (NUEVO)
          if (categoria.tipo === 'servicio') {
            const servicios = await Servicio.findAll({
              where: { categoriaId: categoria.id }
            });

            for (const servicio of servicios) {
              await servicio.update(
                { activo: false },
                { transaction: options.transaction }
              );
              console.log(`  ↳ Servicio desactivado: ${servicio.nombre}`);
            }
          }

          console.log(`✅ Categoría y elementos relacionados desactivados correctamente`);

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

Categoria.prototype.contarSubcategorias = async function() {
  const Subcategoria = require('./Subcategoria');
  return await Subcategoria.count({
    where: { categoriaId: this.id }
  });
};

Categoria.prototype.contarProductos = async function() {
  const Producto = require('./Producto');
  return await Producto.count({
    where: { categoriaId: this.id }
  });
};

// 🔥 NUEVO MÉTODO
Categoria.prototype.contarServicios = async function() {
  const Servicio = require('./Servicio');
  return await Servicio.count({
    where: { categoriaId: this.id }
  });
};

module.exports = Categoria;