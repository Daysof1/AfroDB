/**
 * ============================================
 * ASOCIACIONES ENTRE MODELOS (index.js)
 * ============================================
 * Este archivo es el "centro de relaciones" de la base de datos.
 * Aquí se definen TODAS las relaciones (foreign keys) entre los 7 modelos del sistema.
 * Sequelize usa estas asociaciones para:
 *   - Crear las claves foráneas (FK) en MySQL automáticamente
 *   - Permitir consultas con include (JOIN) → ej: Pedido.findAll({ include: ['detalles'] })
 *   - Aplicar reglas CASCADE/RESTRICT al eliminar o actualizar registros
 * 
 * Este archivo se importa en server.js y se ejecuta DESPUÉS de que todos los modelos existan.
 * El orden de importación importa: primero se cargan los modelos, luego se definen las relaciones.
 */

// ==========================================
// IMPORTACIÓN DE TODOS LOS MODELOS
// ==========================================
// Cada require() carga el modelo Sequelize correspondiente desde su archivo en models/
// Cada modelo ya tiene su tabla definida (columnas, validaciones, hooks)
// Aquí los importamos para poder definir las relaciones entre ellos

// Importa el modelo Usuario desde models/Usuario.js → tabla 'usuarios'
const Usuario = require('./Usuario');

// Importa el modelo Categoria desde models/Categoria.js → tabla 'categorias'
const Categoria = require('./Categoria');

// Importa el modelo Subcategoria desde models/Subcategoria.js → tabla 'subcategorias'
const Subcategoria = require('./Subcategoria');

// Importa el modelo Producto desde models/Producto.js → tabla 'productos'
const Producto = require('./Producto');

// Importa el modelo Carrito desde models/Carrito.js → tabla 'carritos'
const Carrito = require('./Carrito');

// Importa el modelo Pedido desde models/Pedido.js → tabla 'pedidos'
const Pedido = require('./Pedido');

// Importa el modelo DetallePedido desde models/DetallePedido.js → tabla 'detalle_pedidos'
const DetallePedido = require('./DetallePedido');

/**
 * ============================================
 * DEFINIR ASOCIACIONES (RELACIONES)
 * ============================================
 * 
 * Tipos de relaciones en Sequelize y su equivalente SQL:
 * - hasOne   → "Tiene uno" (1:1)     → La otra tabla tiene la FK
 * - belongsTo → "Pertenece a" (1:1)  → ESTA tabla tiene la FK
 * - hasMany  → "Tiene muchos" (1:N)  → La otra tabla tiene la FK (múltiples registros)
 * - belongsToMany → "Muchos a muchos" (N:M) → Usa una tabla intermedia (pivot)
 * 
 * Ejemplo: Categoria.hasMany(Subcategoria) + Subcategoria.belongsTo(Categoria)
 * → En SQL: tabla 'subcategorias' tiene la columna 'categoriaId' que referencia a 'categorias.id'
 * 
 * Opciones importantes:
 * - foreignKey: nombre de la columna FK que conecta las tablas
 * - as: alias que se usa en include para hacer JOINs → { include: [{ as: 'subcategorias' }] }
 * - onDelete: qué pasa si se borra el registro padre:
 *     'CASCADE' → se borran los hijos automáticamente
 *     'RESTRICT' → se IMPIDE la eliminación si tiene hijos
 * - onUpdate: qué pasa si se actualiza la PK del padre (CASCADE la actualiza en los hijos)
 */

// ==========================================
// 1. CATEGORIA ↔ SUBCATEGORIA (Uno a Muchos)
// ==========================================
// Una categoría tiene muchas subcategorías (ej: "Electrónica" tiene "Celulares", "Laptops")
// Una subcategoría pertenece a UNA sola categoría

// Lado UNO → la categoría "tiene muchas" subcategorías
// SQL equivalente: ALTER TABLE subcategorias ADD FOREIGN KEY (categoriaId) REFERENCES categorias(id)
Categoria.hasMany(Subcategoria, {
  foreignKey: 'categoriaId',       // Columna FK en la tabla 'subcategorias' que apunta a 'categorias.id'
  as: 'subcategorias',             // Alias para JOINs → Categoria.findAll({ include: ['subcategorias'] })
  onDelete: 'CASCADE',             // Si se elimina una categoría → se eliminan TODAS sus subcategorías
  onUpdate: 'CASCADE'              // Si se actualiza el id de la categoría → se actualiza en subcategorías
});

// Lado MUCHOS → cada subcategoría "pertenece a" una categoría
// Crea el método subcategoria.getCategoria() automáticamente
Subcategoria.belongsTo(Categoria, {
  foreignKey: 'categoriaId',       // Misma FK → conecta con la definición anterior
  as: 'categoria',                 // Alias para JOINs → Subcategoria.findAll({ include: ['categoria'] })
  onDelete: 'CASCADE',             // Mismas reglas de eliminación
  onUpdate: 'CASCADE'              // Mismas reglas de actualización
});

// ==========================================
// 2. CATEGORIA ↔ PRODUCTO (Uno a Muchos)
// ==========================================
// Una categoría tiene muchos productos directamente
// Un producto pertenece a una categoría (relación directa para consultas rápidas)

// Lado UNO → la categoría "tiene muchos" productos
Categoria.hasMany(Producto, {
  foreignKey: 'categoriaId',       // Columna FK en tabla 'productos' que apunta a 'categorias.id'
  as: 'productos',                 // Alias → Categoria.findAll({ include: ['productos'] })
  onDelete: 'CASCADE',             // Si se elimina la categoría → se eliminan sus productos
  onUpdate: 'CASCADE'              // Si cambia el id → se actualiza en productos
});

// Lado MUCHOS → cada producto "pertenece a" una categoría
Producto.belongsTo(Categoria, {
  foreignKey: 'categoriaId',       // Misma FK
  as: 'categoria',                 // Alias → Producto.findAll({ include: ['categoria'] })
  onDelete: 'CASCADE',             // Mismas reglas
  onUpdate: 'CASCADE'
});

// ==========================================
// 3. SUBCATEGORIA ↔ PRODUCTO (Uno a Muchos)
// ==========================================
// Una subcategoría tiene muchos productos (ej: "Celulares" tiene "iPhone 15", "Samsung S24")
// Un producto pertenece a una subcategoría

// Lado UNO → la subcategoría "tiene muchos" productos
Subcategoria.hasMany(Producto, {
  foreignKey: 'subcategoriaId',    // Columna FK en tabla 'productos' que apunta a 'subcategorias.id'
  as: 'productos',                 // Alias → Subcategoria.findAll({ include: ['productos'] })
  onDelete: 'CASCADE',             // Si se elimina la subcategoría → se eliminan sus productos
  onUpdate: 'CASCADE'
});

// Lado MUCHOS → cada producto "pertenece a" una subcategoría
Producto.belongsTo(Subcategoria, {
  foreignKey: 'subcategoriaId',    // Misma FK
  as: 'subcategoria',              // Alias → Producto.findAll({ include: ['subcategoria'] })
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// ==========================================
// 4. USUARIO ↔ CARRITO (Uno a Muchos)
// ==========================================
// Un usuario tiene muchos items en su carrito (cada item es un registro en 'carritos')
// Cada item del carrito pertenece a un usuario
// CASCADE: si se elimina el usuario, se borra todo su carrito

// Lado UNO → el usuario "tiene muchos" items de carrito
Usuario.hasMany(Carrito, {
  foreignKey: 'usuarioId',         // Columna FK en tabla 'carritos' que apunta a 'usuarios.id'
  as: 'carrito',                   // Alias → Usuario.findAll({ include: ['carrito'] })
  onDelete: 'CASCADE',             // Si se elimina el usuario → se elimina su carrito completo
  onUpdate: 'CASCADE'
});

// Lado MUCHOS → cada item del carrito "pertenece a" un usuario
Carrito.belongsTo(Usuario, {
  foreignKey: 'usuarioId',         // Misma FK
  as: 'usuario',                   // Alias → Carrito.findAll({ include: ['usuario'] })
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// ==========================================
// 5. PRODUCTO ↔ CARRITO (Uno a Muchos)
// ==========================================
// Un producto puede estar en muchos carritos (de diferentes usuarios)
// Cada item del carrito tiene UN producto asociado
// CASCADE: si se elimina el producto, se elimina de todos los carritos

// Lado UNO → el producto "puede estar en muchos" carritos
Producto.hasMany(Carrito, {
  foreignKey: 'productoId',        // Columna FK en tabla 'carritos' que apunta a 'productos.id'
  as: 'carrito',                   // Alias → Producto.findAll({ include: ['carrito'] })
  onDelete: 'CASCADE',             // Si se elimina el producto → se elimina de todos los carritos
  onUpdate: 'CASCADE'
});

// Lado MUCHOS → cada item del carrito "tiene" un producto
Carrito.belongsTo(Producto, {
  foreignKey: 'productoId',        // Misma FK
  as: 'producto',                  // Alias → Carrito.findAll({ include: ['producto'] })
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// ==========================================
// 6. USUARIO ↔ PEDIDO (Uno a Muchos)
// ==========================================
// Un usuario tiene muchos pedidos (historial de compras)
// Cada pedido pertenece a un usuario
// RESTRICT: NO se puede eliminar un usuario que tiene pedidos (los pedidos son históricos)

// Lado UNO → el usuario "tiene muchos" pedidos
Usuario.hasMany(Pedido, {
  foreignKey: 'usuarioId',         // Columna FK en tabla 'pedidos' que apunta a 'usuarios.id'
  as: 'pedidos',                   // Alias → Usuario.findAll({ include: ['pedidos'] })
  onDelete: 'RESTRICT',            // RESTRICT → impide eliminar usuario con pedidos existentes
  onUpdate: 'CASCADE'              // Si cambia el id del usuario → se actualiza en pedidos
});

// Lado MUCHOS → cada pedido "pertenece a" un usuario
Pedido.belongsTo(Usuario, {
  foreignKey: 'usuarioId',         // Misma FK
  as: 'usuario',                   // Alias → Pedido.findAll({ include: ['usuario'] })
  onDelete: 'RESTRICT',            // Misma regla: no se puede eliminar el usuario
  onUpdate: 'CASCADE'
});

// ==========================================
// 7. PEDIDO ↔ DETALLE PEDIDO (Uno a Muchos)
// ==========================================
// Un pedido tiene muchos detalles (cada detalle = un producto comprado con su cantidad y precio)
// Cada detalle pertenece a un pedido
// CASCADE: si se elimina un pedido, se eliminan todos sus detalles

// Lado UNO → el pedido "tiene muchos" detalles
Pedido.hasMany(DetallePedido, {
  foreignKey: 'pedidoId',          // Columna FK en tabla 'detalle_pedidos' que apunta a 'pedidos.id'
  as: 'detalles',                  // Alias → Pedido.findAll({ include: ['detalles'] })
  onDelete: 'CASCADE',             // Si se elimina el pedido → se eliminan sus detalles
  onUpdate: 'CASCADE'
});

// Lado MUCHOS → cada detalle "pertenece a" un pedido
DetallePedido.belongsTo(Pedido, {
  foreignKey: 'pedidoId',          // Misma FK
  as: 'pedido',                    // Alias → DetallePedido.findAll({ include: ['pedido'] })
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// ==========================================
// 8. PRODUCTO ↔ DETALLE PEDIDO (Uno a Muchos)
// ==========================================
// Un producto puede aparecer en muchos detalles de pedidos (diferentes personas lo compraron)
// Cada detalle tiene un producto
// RESTRICT: NO se puede eliminar un producto que aparece en pedidos (historial de ventas)

// Lado UNO → el producto "puede estar en muchos" detalles de pedidos
Producto.hasMany(DetallePedido, {
  foreignKey: 'productoId',        // Columna FK en tabla 'detalle_pedidos' que apunta a 'productos.id'
  as: 'detallePedidos',            // Alias → Producto.findAll({ include: ['detallePedidos'] })
  onDelete: 'RESTRICT',            // RESTRICT → impide eliminar productos que ya fueron vendidos
  onUpdate: 'CASCADE'
});

// Lado MUCHOS → cada detalle "tiene" un producto
DetallePedido.belongsTo(Producto, {
  foreignKey: 'productoId',        // Misma FK
  as: 'producto',                  // Alias → DetallePedido.findAll({ include: ['producto'] })
  onDelete: 'RESTRICT',            // No se puede eliminar el producto si tiene detalles asociados
  onUpdate: 'CASCADE'
});

// ==========================================
// RELACIÓN MUCHOS A MUCHOS (N:M) - PEDIDO ↔ PRODUCTO
// ==========================================
// Además de las relaciones 1:N anteriores, se define una relación N:M (muchos a muchos):
// Un pedido puede tener MUCHOS productos y un producto puede estar en MUCHOS pedidos.
// La tabla intermedia (pivot) es 'detalle_pedidos' que ya existe como modelo DetallePedido.
// Esta relación permite hacer: pedido.getProductos() o producto.getPedidos()

// Lado PEDIDO → un pedido "pertenece a muchos" productos (a través de DetallePedido)
Pedido.belongsToMany(Producto, {
  through: DetallePedido,          // Tabla intermedia (pivot) que conecta pedidos con productos
  foreignKey: 'pedidoId',          // FK en detalle_pedidos que apunta al pedido
  otherKey: 'productoId',          // FK en detalle_pedidos que apunta al producto
  as: 'productos'                  // Alias → Pedido.findAll({ include: ['productos'] })
});

// Lado PRODUCTO → un producto "pertenece a muchos" pedidos (a través de DetallePedido)
Producto.belongsToMany(Pedido, {
  through: DetallePedido,          // Misma tabla intermedia
  foreignKey: 'productoId',        // FK que apunta al producto
  otherKey: 'pedidoId',            // FK que apunta al pedido
  as: 'pedidos'                    // Alias → Producto.findAll({ include: ['pedidos'] })
});

/**
 * ============================================
 * FUNCIÓN DE INICIALIZACIÓN DE ASOCIACIONES
 * ============================================
 */

/**
 * initAssociations() → Función que confirma que las asociaciones se establecieron
 * Se llama desde server.js después de cargar este archivo con require('./models')
 * Las asociaciones ya se definen al importar este archivo (el código de arriba se ejecuta al hacer require)
 * Esta función solo imprime un mensaje de confirmación en consola
 */
const initAssociations = () => {
  // Imprime mensaje en consola del servidor para confirmar que las relaciones están listas
  console.log('🔗 Asociaciones entre modelos establecidas correctamente');
};

// ==========================================
// EXPORTACIÓN DE MODELOS Y FUNCIÓN
// ==========================================
// Exporta todos los modelos y la función de inicialización como un objeto
// Se importa en server.js como: const { Usuario, Producto, ..., initAssociations } = require('./models')
// Al importar este archivo, las asociaciones ya se ejecutan automáticamente
module.exports = {
  Usuario,                           // Modelo de usuarios → tabla 'usuarios'
  Categoria,                         // Modelo de categorías → tabla 'categorias'
  Subcategoria,                      // Modelo de subcategorías → tabla 'subcategorias'
  Producto,                          // Modelo de productos → tabla 'productos'
  Carrito,                           // Modelo de carrito → tabla 'carritos'
  Pedido,                            // Modelo de pedidos → tabla 'pedidos'
  DetallePedido,                     // Modelo de detalles de pedido → tabla 'detalle_pedidos'
  initAssociations                   // Función para confirmar asociaciones en consola
};

/**
 * ============================================
 * DIAGRAMA DE RELACIONES DE LA BASE DE DATOS
 * ============================================
 * 
 * Muestra cómo están conectadas las 7 tablas del sistema:
 * 
 * Usuario (1) ─────< Carrito (N)         → Un usuario tiene muchos items en carrito
 *    │                   │
 *    │                   │
 *    │                   ▼
 *    │              Producto (1)          → Cada item del carrito tiene un producto
 *    │                   │
 *    │                   │
 *    │                   ├─────> Subcategoria (1)   → Cada producto pertenece a una subcategoría
 *    │                   │              │
 *    │                   │              │
 *    │                   │              ▼
 *    │                   │         Categoria (1)     → Cada subcategoría pertenece a una categoría
 *    │                   │
 *    ▼                   │
 * Pedido (N)             │               → Un usuario tiene muchos pedidos
 *    │                   │
 *    │                   │
 *    ▼                   ▼
 * DetallePedido (N) ────< Producto (1)   → Cada detalle conecta un pedido con un producto
 * 
 * Leyenda:
 * (1) = Lado "uno" de la relación (tabla padre)
 * (N) = Lado "muchos" de la relación (tabla hija, contiene la FK)
 * ─── = Línea de relación (foreign key)
 * ───< = Relación uno a muchos (la flecha apunta al lado "muchos")
 * 
 * ============================================
 * REGLAS DE NEGOCIO EN LAS RELACIONES
 * ============================================
 * 
 * 1. CASCADE en Carrito (eliminación en cascada):
 *    - Si se elimina un usuario → se elimina TODO su carrito automáticamente
 *    - Si se elimina un producto → se elimina de TODOS los carritos
 *    - Razón: el carrito es temporal, no hay problema en perder esos datos
 * 
 * 2. CASCADE en Categorías (desactivación en cascada):
 *    - Si se desactiva una categoría → se desactivan sus subcategorías y productos
 *    - Si se desactiva una subcategoría → se desactivan sus productos
 *    - Esto se maneja en los hooks afterUpdate de Categoria.js y Subcategoria.js
 * 
 * 3. RESTRICT en Pedidos (protección de historial):
 *    - NO se puede eliminar un usuario que tiene pedidos existentes
 *    - NO se puede eliminar un producto que aparece en pedidos
 *    - Razón: los pedidos son historial de ventas y DEBEN conservarse
 *    - Error: MySQL lanza error si intentas violar esta restricción
 * 
 * 4. Validaciones cruzadas (en hooks de los modelos):
 *    - Un producto DEBE tener subcategoría Y categoría asignadas
 *    - La subcategoría DEBE pertenecer a la categoría indicada (consistencia)
 *    - No se puede crear producto en categoría/subcategoría inactiva
 *    - El carrito valida stock disponible ANTES de agregar un producto
 * 
 */
