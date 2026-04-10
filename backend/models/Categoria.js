/**
 * ============================================
 * MODELO CATEGORIA
 * ============================================
 * Define la estructura de la tabla 'categorias' en MySQL usando Sequelize ORM.
 * Almacena las categorías principales de productos del e-commerce.
 * Ejemplo de categorías: "Electrónica", "Ropa", "Alimentos".
 * Cada categoría puede tener múltiples subcategorías (relación 1:N definida en models/index.js).
 * Si se desactiva una categoría, se desactivan EN CASCADA sus subcategorías y productos (hook afterUpdate).
 */

// Importa DataTypes de la librería 'sequelize' (paquete npm)
// DataTypes proporciona los tipos de datos para definir columnas: INTEGER, STRING, TEXT, BOOLEAN, etc.
const { DataTypes } = require('sequelize');

// Importa la instancia 'sequelize' (conexión activa a MySQL) desde config/database.js
// Se creó con new Sequelize() usando las credenciales del archivo .env
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea un modelo Sequelize que mapea a una tabla MySQL.
 * 'Categoria' → nombre interno del modelo
 * Segundo argumento → definición de columnas
 * Tercer argumento → opciones (tableName, timestamps, hooks)
 */
const Categoria = sequelize.define('Categoria', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'categorias'
  // ==========================================
  
  // Columna 'id' → Identificador único de cada categoría
  id: {
    type: DataTypes.INTEGER,           // Tipo INT en MySQL
    primaryKey: true,                  // Es la clave primaria (PK) de la tabla
    autoIncrement: true,               // Se incrementa automáticamente: 1, 2, 3...
    allowNull: false                   // No permite valores NULL
  },

  // Columna 'nombre' → Nombre visible de la categoría
  // Ejemplo: "Electrónica", "Ropa", "Alimentos"
  nombre: {
    type: DataTypes.STRING(100),       // VARCHAR(100) en MySQL → máximo 100 caracteres
    allowNull: false,                  // Obligatorio: toda categoría necesita un nombre
    unique: {                          // UNIQUE → no puede haber dos categorías con el mismo nombre
      msg: 'Ya existe una categoría con este nombre'   // Mensaje de error si se repite
    },
    validate: {                        // Validaciones de Sequelize (a nivel de aplicación)
      notEmpty: {                      // No permite cadena vacía ""
        msg: 'El nombre de la categoría no puede estar vacío'
      },
      len: {                           // Valida longitud mínima y máxima
        args: [2, 100],                // Entre 2 y 100 caracteres
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    }
  },

  // Columna 'descripcion' → Texto descriptivo de la categoría (opcional)
  descripcion: {
    type: DataTypes.TEXT,              // TEXT en MySQL → texto largo sin límite fijo
    allowNull: true                   // Opcional: puede ser NULL
  },

  // Columna 'activo' → Estado de la categoría (visible/oculta en el catálogo)
  // Si es false, la categoría NO aparece en el catálogo público
  // Además, el hook afterUpdate desactiva subcategorías y productos al cambiar a false
  activo: {
    type: DataTypes.BOOLEAN,           // TINYINT(1) en MySQL → true (1) o false (0)
    allowNull: false,                  // Obligatorio
    defaultValue: true                 // Por defecto se crea activa (visible)
  }

}, {
  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================
  
  tableName: 'categorias',            // Nombre EXACTO de la tabla en MySQL
  timestamps: true,                   // Sequelize crea automáticamente createdAt y updatedAt
  
  // HOOKS → funciones que Sequelize ejecuta automáticamente en ciertos momentos del ciclo de vida
  hooks: {
    /**
     * afterUpdate → Se ejecuta DESPUÉS de que una categoría se actualiza en la BD.
     * Implementa la DESACTIVACIÓN EN CASCADA:
     * Si activo cambia a false → desactiva TODAS las subcategorías y productos de esta categoría.
     * Esto evita que productos de una categoría oculta aparezcan en el catálogo.
     */
    afterUpdate: async (categoria, options) => {
      // changed('activo') retorna true si el campo 'activo' fue modificado
      // && !categoria.activo → solo si cambió a false (desactivación)
      if (categoria.changed('activo') && !categoria.activo) {
        console.log(`⚠️ Desactivando categoría: ${categoria.nombre}`);
        
        // Importa modelos aquí dentro para evitar dependencias circulares
        // (Categoria requiere Subcategoria, Subcategoria requiere Categoria → ciclo)
        const Subcategoria = require('./Subcategoria');
        const Producto = require('./Producto');
        
        try {
          // PASO 1: Busca TODAS las subcategorías que pertenecen a esta categoría
          // findAll → SELECT * FROM subcategorias WHERE categoriaId = categoria.id
          const subcategorias = await Subcategoria.findAll({
            where: { categoriaId: categoria.id }
          });
          
          // Recorre cada subcategoría y la desactiva
          for (const subcategoria of subcategorias) {
            // update({ activo: false }) → UPDATE subcategorias SET activo = 0 WHERE id = ?
            // transaction: options.transaction → usa la misma transacción si hay una activa
            await subcategoria.update({ activo: false }, { transaction: options.transaction });
            console.log(`  ↳ Subcategoría desactivada: ${subcategoria.nombre}`);
          }
          
          // PASO 2: Busca TODOS los productos que pertenecen a esta categoría
          // findAll → SELECT * FROM productos WHERE categoriaId = categoria.id
          const productos = await Producto.findAll({
            where: { categoriaId: categoria.id }
          });
          
          // Recorre cada producto y lo desactiva
          for (const producto of productos) {
            await producto.update({ activo: false }, { transaction: options.transaction });
            console.log(`  ↳ Producto desactivado: ${producto.nombre}`);
          }
          
          console.log(`✅ Categoría y elementos relacionados desactivados correctamente`);
        } catch (error) {
          console.error('❌ Error al desactivar elementos relacionados:', error.message);
          throw error;   // Relanza el error para que la operación falle y no quede inconsistente
        }
      }
      
      // NOTA: Si se ACTIVA una categoría (activo cambia a true), NO se reactivan
      // automáticamente sus subcategorías ni productos.
      // El administrador debe activarlos manualmente uno por uno si lo desea.
    }
  }
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================
// Se agregan a prototype → se llaman sobre UNA instancia: categoria.contarSubcategorias()

/**
 * contarSubcategorias() → Cuenta cuántas subcategorías tiene esta categoría
 * Ejecuta: SELECT COUNT(*) FROM subcategorias WHERE categoriaId = this.id
 * @returns {Promise<number>} Número de subcategorías
 */
Categoria.prototype.contarSubcategorias = async function() {
  const Subcategoria = require('./Subcategoria');   // Importa para hacer la consulta
  return await Subcategoria.count({
    where: { categoriaId: this.id }                // this.id = ID de esta categoría
  });
};

/**
 * contarProductos() → Cuenta cuántos productos tiene esta categoría
 * Ejecuta: SELECT COUNT(*) FROM productos WHERE categoriaId = this.id
 * @returns {Promise<number>} Número de productos
 */
Categoria.prototype.contarProductos = async function() {
  const Producto = require('./Producto');
  return await Producto.count({
    where: { categoriaId: this.id }
  });
};

// Exporta el modelo Categoria para usarlo en controladores, otros modelos y seeders
// Se importa como: const Categoria = require('./Categoria')
module.exports = Categoria;
