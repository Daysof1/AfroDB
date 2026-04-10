/**
 * ============================================
 * MODELO SUBCATEGORIA
 * ============================================
 * Define la estructura de la tabla 'subcategorias' en MySQL usando Sequelize ORM.
 * Cada subcategoría pertenece a UNA categoría padre (relación belongsTo).
 * Ejemplo: Categoría "Electrónica" → Subcategorías: "Laptops", "Teléfonos", "Tablets".
 * Si se desactiva una subcategoría, se desactivan EN CASCADA todos sus productos (hook afterUpdate).
 * No se puede crear una subcategoría en una categoría inactiva (hook beforeCreate).
 */

// Importa DataTypes de la librería 'sequelize' (paquete npm)
// Define los tipos de columnas: INTEGER, STRING, TEXT, BOOLEAN, etc.
const { DataTypes } = require('sequelize');

// Importa la instancia 'sequelize' (conexión activa a MySQL) desde config/database.js
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea el modelo que mapea a la tabla 'subcategorias'.
 * 'Subcategoria' → nombre interno del modelo en Sequelize
 */
const Subcategoria = sequelize.define('Subcategoria', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'subcategorias'
  // ==========================================
  
  // Columna 'id' → Identificador único de cada subcategoría
  id: {
    type: DataTypes.INTEGER,           // Tipo INT en MySQL
    primaryKey: true,                  // Clave primaria (PK)
    autoIncrement: true,               // Auto-incrementa: 1, 2, 3...
    allowNull: false                   // No permite NULL
  },

  // Columna 'nombre' → Nombre visible de la subcategoría
  // Ejemplo: "Laptops", "Teléfonos", "Tablets"
  nombre: {
    type: DataTypes.STRING(100),       // VARCHAR(100) en MySQL → máximo 100 caracteres
    allowNull: false,                  // Obligatorio
    validate: {                        // Validaciones de Sequelize
      notEmpty: {                      // No permite cadena vacía ""
        msg: 'El nombre de la subcategoría no puede estar vacío'
      },
      len: {                           // Valida longitud
        args: [2, 100],                // Entre 2 y 100 caracteres
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    }
  },

  // Columna 'descripcion' → Texto descriptivo de la subcategoría (opcional)
  descripcion: {
    type: DataTypes.TEXT,              // TEXT en MySQL → texto largo
    allowNull: true                   // Opcional: puede ser NULL
  },

  // Columna 'categoriaId' → Clave foránea (FK) que apunta a la tabla 'categorias'
  // Indica A QUÉ categoría padre pertenece esta subcategoría
  categoriaId: {
    type: DataTypes.INTEGER,           // Tipo INT, coincide con categorias.id
    allowNull: false,                  // Obligatorio: toda subcategoría tiene categoría padre
    references: {                      // Define la FK en MySQL
      model: 'categorias',            // Tabla referenciada → tabla 'categorias'
      key: 'id'                       // Columna referenciada → categorias.id
    },
    onUpdate: 'CASCADE',              // Si cambia categorias.id → actualiza aquí
    onDelete: 'CASCADE',              // Si se elimina la categoría → elimina subcategorías
    validate: {
      notNull: {
        msg: 'Debe seleccionar una categoría'
      }
    }
  },

  // Columna 'activo' → Estado de la subcategoría (visible/oculta)
  // Si es false, todos los productos de esta subcategoría se ocultan del catálogo
  activo: {
    type: DataTypes.BOOLEAN,           // TINYINT(1) en MySQL → true (1) o false (0)
    allowNull: false,                  // Obligatorio
    defaultValue: true                 // Se crea activa por defecto
  }

}, {
  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================
  
  tableName: 'subcategorias',          // Nombre EXACTO de la tabla en MySQL
  timestamps: true,                    // Crea automáticamente createdAt y updatedAt
  
  // Índices → mejoran el rendimiento de las consultas SQL frecuentes
  indexes: [
    {
      // Índice simple en 'categoriaId' → acelera:
      // SELECT * FROM subcategorias WHERE categoriaId = ?
      fields: ['categoriaId']
    },
    {
      // Índice ÚNICO compuesto → el NOMBRE de la subcategoría debe ser único
      // DENTRO de la misma categoría, pero dos categorías diferentes pueden
      // tener subcategorías con el mismo nombre.
      // Ejemplo: Categoría "Ropa" → "Hombre". Categoría "Zapatos" → "Hombre" (OK, misma nombre, otra categoría)
      unique: true,                    // UNIQUE → no permite combinaciones repetidas
      fields: ['nombre', 'categoriaId'],  // Columnas del índice compuesto
      name: 'nombre_categoria_unique'     // Nombre del índice en MySQL
    }
  ],
  
  // HOOKS → funciones automáticas del ciclo de vida
  hooks: {
    /**
     * beforeCreate → Se ejecuta ANTES de insertar una nueva subcategoría
     * Valida que la categoría padre exista y esté activa.
     * No tiene sentido crear una subcategoría en una categoría desactivada.
     */
    beforeCreate: async (subcategoria) => {
      // Importa el modelo Categoria aquí dentro (evita dependencia circular)
      const Categoria = require('./Categoria');
      
      // Busca la categoría padre en la BD
      // findByPk → SELECT * FROM categorias WHERE id = subcategoria.categoriaId
      const categoria = await Categoria.findByPk(subcategoria.categoriaId);
      
      // Si no existe la categoría → error
      if (!categoria) {
        throw new Error('La categoría seleccionada no existe');
      }
      
      // Si la categoría está desactivada → no permite crear subcategoría
      if (!categoria.activo) {
        throw new Error('No se puede crear una subcategoría en una categoría inactiva');
      }
    },

    /**
     * afterUpdate → Se ejecuta DESPUÉS de actualizar una subcategoría
     * Implementa DESACTIVACIÓN EN CASCADA:
     * Si activo cambia a false → desactiva TODOS los productos de esta subcategoría.
     */
    afterUpdate: async (subcategoria, options) => {
      // changed('activo') retorna true si el campo fue modificado
      // && !subcategoria.activo → solo si cambió a false (desactivación)
      if (subcategoria.changed('activo') && !subcategoria.activo) {
        console.log(`⚠️ Desactivando subcategoría: ${subcategoria.nombre}`);
        
        // Importa modelo Producto
        const Producto = require('./Producto');
        
        try {
          // Busca TODOS los productos que pertenecen a esta subcategoría
          const productos = await Producto.findAll({
            where: { subcategoriaId: subcategoria.id }
          });
          
          // Desactiva cada producto uno por uno
          for (const producto of productos) {
            // update() → UPDATE productos SET activo = 0 WHERE id = ?
            await producto.update({ activo: false }, { transaction: options.transaction });
            console.log(`  ↳ Producto desactivado: ${producto.nombre}`);
          }
          
          console.log(`✅ Subcategoría y productos relacionados desactivados correctamente`);
        } catch (error) {
          console.error('❌ Error al desactivar productos relacionados:', error.message);
          throw error;   // Relanza para que la operación falle y no quede inconsistente
        }
      }
      
      // NOTA: Si se ACTIVA una subcategoría, NO se reactivan automáticamente los productos.
      // El administrador debe activarlos manualmente si lo desea.
    }
  }
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================
// Se llaman sobre UNA instancia: subcategoria.contarProductos()

/**
 * contarProductos() → Cuenta cuántos productos tiene esta subcategoría
 * Ejecuta: SELECT COUNT(*) FROM productos WHERE subcategoriaId = this.id
 * @returns {Promise<number>} Número de productos
 */
Subcategoria.prototype.contarProductos = async function() {
  const Producto = require('./Producto');   // Importa el modelo Producto
  return await Producto.count({
    where: { subcategoriaId: this.id }     // Filtra por esta subcategoría
  });
};

/**
 * obtenerCategoria() → Busca y retorna la categoría padre de esta subcategoría
 * Ejecuta: SELECT * FROM categorias WHERE id = this.categoriaId
 * @returns {Promise<Categoria>} Instancia del modelo Categoria
 */
Subcategoria.prototype.obtenerCategoria = async function() {
  const Categoria = require('./Categoria');
  return await Categoria.findByPk(this.categoriaId);  // findByPk = Find By Primary Key
};

// Exporta el modelo Subcategoria para usarlo en controladores, otros modelos y seeders
// Se importa como: const Subcategoria = require('./Subcategoria')
module.exports = Subcategoria;
