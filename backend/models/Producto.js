/**
 * ============================================
 * MODELO PRODUCTO
 * ============================================
 * Define la estructura de la tabla 'productos' en MySQL usando Sequelize ORM.
 * Cada fila representa un producto del e-commerce con nombre, precio, stock, imagen, etc.
 * Un producto pertenece a UNA categoría y UNA subcategoría (relaciones belongsTo en models/index.js).
 * La imagen se guarda como nombre de archivo; el archivo físico está en la carpeta uploads/.
 * Hooks validan consistencia categoría-subcategoría y eliminan la imagen al borrar el producto.
 */

// Importa DataTypes de la librería 'sequelize' (paquete npm)
// Define los tipos de columnas: INTEGER, STRING, TEXT, DECIMAL, BOOLEAN, etc.
const { DataTypes } = require('sequelize');

// Importa la instancia 'sequelize' (conexión activa a MySQL) desde config/database.js
const { sequelize } = require('../config/database');

/**
 * sequelize.define() crea el modelo que mapea a la tabla 'productos'.
 * 'Producto' → nombre interno del modelo
 */
const Producto = sequelize.define('Producto', {
  // ==========================================
  // COLUMNAS DE LA TABLA 'productos'
  // ==========================================
  
  // Columna 'id' → Identificador único de cada producto
  id: {
    type: DataTypes.INTEGER,           // Tipo INT en MySQL
    primaryKey: true,                  // Clave primaria (PK)
    autoIncrement: true,               // Auto-incrementa: 1, 2, 3...
    allowNull: false                   // No permite NULL
  },

  // Columna 'nombre' → Nombre visible del producto
  // Ejemplo: "Laptop Dell Inspiron 15", "Camiseta Nike Dri-FIT"
  nombre: {
    type: DataTypes.STRING(200),       // VARCHAR(200) en MySQL → máximo 200 caracteres
    allowNull: false,                  // Obligatorio
    validate: {                        // Validaciones de Sequelize (a nivel de aplicación)
      notEmpty: {                      // No permite cadena vacía ""
        msg: 'El nombre del producto no puede estar vacío'
      },
      len: {                           // Valida longitud
        args: [3, 200],                // Entre 3 y 200 caracteres
        msg: 'El nombre debe tener entre 3 y 200 caracteres'
      }
    }
  },

  // Columna 'descripcion' → Descripción detallada del producto (opcional)
  descripcion: {
    type: DataTypes.TEXT,              // TEXT en MySQL → texto largo sin límite fijo
    allowNull: true                   // Opcional: puede ser NULL
  },

  // Columna 'precio' → Precio del producto en pesos colombianos
  precio: {
    type: DataTypes.DECIMAL(10, 2),    // DECIMAL(10,2) → hasta 99,999,999.99
    allowNull: false,                  // Obligatorio
    validate: {
      isDecimal: {                     // Valida que sea un número decimal
        msg: 'El precio debe ser un número decimal válido'
      },
      min: {                           // No permite precios negativos
        args: [0],
        msg: 'El precio no puede ser negativo'
      }
    }
  },

  // Columna 'stock' → Cantidad disponible en inventario
  // Se reduce al confirmar un pedido y se aumenta al cancelar
  stock: {
    type: DataTypes.INTEGER,           // Tipo INT (entero)
    allowNull: false,                  // Obligatorio
    defaultValue: 0,                   // Si no se especifica, empieza en 0
    validate: {
      isInt: {                         // Valida que sea entero
        msg: 'El stock debe ser un número entero'
      },
      min: {                           // No permite stock negativo
        args: [0],
        msg: 'El stock no puede ser negativo'
      }
    }
  },

  // Columna 'imagen' → Nombre del archivo de imagen subido por Multer
  // Solo guarda el nombre del archivo: "1709578800000-producto.jpg"
  // La ruta completa es: uploads/1709578800000-producto.jpg (servida por Express como estático)
  // Multer está configurado en config/multer.js
  imagen: {
    type: DataTypes.STRING(255),       // VARCHAR(255) → nombre del archivo
    allowNull: true,                   // Opcional: un producto puede no tener imagen
    validate: {
      is: {                            // Valida con expresión regular (regex)
        args: /\.(jpg|jpeg|png|gif)$/i,  // Solo extensiones de imagen permitidas
        msg: 'La imagen debe ser un archivo JPG, PNG o GIF'
      }
    }
  },

  // Columna 'subcategoriaId' → Clave foránea (FK) a la tabla 'subcategorias'
  // Indica a QUÉ subcategoría pertenece el producto
  subcategoriaId: {
    type: DataTypes.INTEGER,           // Tipo INT, coincide con subcategorias.id
    allowNull: false,                  // Obligatorio: todo producto tiene subcategoría
    references: {                      // Define la FK en MySQL
      model: 'subcategorias',         // Tabla referenciada
      key: 'id'                       // Columna referenciada
    },
    onUpdate: 'CASCADE',              // Si cambia subcategorias.id → actualiza aquí
    onDelete: 'CASCADE',              // Si se elimina la subcategoría → elimina productos
    validate: {
      notNull: {
        msg: 'Debe seleccionar una subcategoría'
      }
    }
  },

  // Columna 'categoriaId' → Clave foránea (FK) a la tabla 'categorias'
  // Se guarda TAMBIÉN aquí (además de en subcategoría) para facilitar búsquedas directas
  // REGLA: Debe coincidir con la categoría de la subcategoría seleccionada (validado en hooks)
  categoriaId: {
    type: DataTypes.INTEGER,           // Tipo INT, coincide con categorias.id
    allowNull: false,                  // Obligatorio
    references: {
      model: 'categorias',            // Tabla referenciada
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

  // Columna 'activo' → Estado del producto (visible/oculto en catálogo)
  // Si es false, no aparece en el catálogo público
  activo: {
    type: DataTypes.BOOLEAN,           // TINYINT(1) en MySQL
    allowNull: false,                  // Obligatorio
    defaultValue: true                 // Se crea activo por defecto
  }

}, {
  // ==========================================
  // OPCIONES DEL MODELO
  // ==========================================
  
  tableName: 'productos',             // Nombre EXACTO de la tabla en MySQL
  timestamps: true,                   // Crea automáticamente createdAt y updatedAt
  
  // Índices → aceleran las consultas SQL más frecuentes
  indexes: [
    {
      // Índice en 'subcategoriaId' → acelera filtrar productos por subcategoría
      fields: ['subcategoriaId']
    },
    {
      // Índice en 'categoriaId' → acelera filtrar productos por categoría
      fields: ['categoriaId']
    },
    {
      // Índice en 'activo' → acelera filtrar solo productos activos
      fields: ['activo']
    },
    {
      // Índice en 'nombre' → acelera búsquedas por nombre de producto
      fields: ['nombre']
    }
  ],
  
  // HOOKS → funciones automáticas del ciclo de vida del registro
  hooks: {
    /**
     * beforeCreate → Se ejecuta ANTES de insertar un producto nuevo
     * Valida que la subcategoría y categoría existan, estén activas,
     * y que la subcategoría realmente pertenezca a la categoría indicada.
     */
    beforeCreate: async (producto) => {
      // Importa modelos aquí dentro para evitar dependencias circulares
      const Categoria = require('./Categoria');
      const Subcategoria = require('./Subcategoria');
      
      // Busca la subcategoría en la BD
      const subcategoria = await Subcategoria.findByPk(producto.subcategoriaId);
      
      // Valida que la subcategoría exista
      if (!subcategoria) {
        throw new Error('La subcategoría seleccionada no existe');
      }
      
      // Valida que la subcategoría esté activa
      if (!subcategoria.activo) {
        throw new Error('No se puede crear un producto en una subcategoría inactiva');
      }
      
      // Busca la categoría en la BD
      const categoria = await Categoria.findByPk(producto.categoriaId);
      
      // Valida que la categoría exista
      if (!categoria) {
        throw new Error('La categoría seleccionada no existe');
      }
      
      // Valida que la categoría esté activa
      if (!categoria.activo) {
        throw new Error('No se puede crear un producto en una categoría inactiva');
      }
      
      // CONSISTENCIA: La subcategoría debe pertenecer a la categoría elegida
      // subcategoria.categoriaId debe ser igual a producto.categoriaId
      if (subcategoria.categoriaId !== producto.categoriaId) {
        throw new Error('La subcategoría no pertenece a la categoría seleccionada');
      }
    },

    /**
     * beforeUpdate → Se ejecuta ANTES de actualizar un producto existente
     * Si se cambió subcategoría o categoría, valida la consistencia
     */
    beforeUpdate: async (producto) => {
      // changed() retorna true si el campo fue modificado
      if (producto.changed('subcategoriaId') || producto.changed('categoriaId')) {
        const Subcategoria = require('./Subcategoria');
        
        const subcategoria = await Subcategoria.findByPk(producto.subcategoriaId);
        
        if (!subcategoria) {
          throw new Error('La subcategoría seleccionada no existe');
        }
        
        // Verifica consistencia subcategoría-categoría
        if (subcategoria.categoriaId !== producto.categoriaId) {
          throw new Error('La subcategoría no pertenece a la categoría seleccionada');
        }
      }
    },

    /**
     * beforeDestroy → Se ejecuta ANTES de eliminar un producto
     * Elimina el archivo de imagen del servidor (carpeta uploads/) si existe.
     * deleteFile() está definido en config/multer.js
     */
    beforeDestroy: async (producto) => {
      if (producto.imagen) {               // Solo si el producto tiene imagen
        // Importa deleteFile desde config/multer.js
        const { deleteFile } = require('../config/multer');
        
        // Intenta eliminar el archivo físico del servidor
        const eliminado = deleteFile(producto.imagen);
        
        if (eliminado) {
          console.log(`🗑️ Imagen eliminada: ${producto.imagen}`);
        }
      }
    }
  }
});

// ==========================================
// MÉTODOS DE INSTANCIA
// ==========================================
// Se llaman sobre UN producto: producto.hayStock(5)

/**
 * obtenerUrlImagen() → Construye la URL completa de la imagen del producto
 * Combina la URL base del servidor + la ruta de uploads + el nombre del archivo
 * @returns {string|null} URL completa o null si no tiene imagen
 * Ejemplo: "http://localhost:5000/uploads/1709578800000-producto.jpg"
 */
Producto.prototype.obtenerUrlImagen = function() {
  if (!this.imagen) {                      // Si no tiene imagen → retorna null
    return null;
  }
  
  // Toma la URL base de la variable de entorno o usa localhost por defecto
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${this.imagen}`;  // Construye la URL completa
};

/**
 * hayStock() → Verifica si hay suficiente stock para la cantidad solicitada
 * @param {number} cantidad - Cantidad que se quiere comprar (default: 1)
 * @returns {boolean} true si stock >= cantidad, false si no
 */
Producto.prototype.hayStock = function(cantidad = 1) {
  return this.stock >= cantidad;           // Compara stock actual vs cantidad deseada
};

/**
 * reducirStock() → Resta unidades del stock (se usa al confirmar una compra)
 * @param {number} cantidad - Unidades a restar
 * @returns {Promise<Producto>} Producto actualizado
 */
Producto.prototype.reducirStock = async function(cantidad) {
  if (!this.hayStock(cantidad)) {          // Valida que haya suficiente stock
    throw new Error('Stock insuficiente');
  }
  
  this.stock -= cantidad;                  // Resta la cantidad del stock
  return await this.save();                // save() ejecuta UPDATE en la BD
};

/**
 * aumentarStock() → Suma unidades al stock (se usa al cancelar un pedido o recibir inventario)
 * @param {number} cantidad - Unidades a sumar
 * @returns {Promise<Producto>} Producto actualizado
 */
Producto.prototype.aumentarStock = async function(cantidad) {
  this.stock += cantidad;                  // Suma la cantidad al stock
  return await this.save();                // Guarda en la BD
};

// Exporta el modelo Producto para usarlo en controladores, otros modelos y seeders
// Se importa como: const Producto = require('./Producto')
module.exports = Producto;
