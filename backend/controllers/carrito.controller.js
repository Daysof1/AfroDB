/**
 * ============================================
 * CONTROLADOR DE CARRITO DE COMPRAS
 * ============================================
 * Gestiona el carrito de compras de cada cliente.
 * Todas las funciones requieren autenticación (middleware verificarAuth).
 * Es usado por las rutas definidas en routes/cliente.routes.js.
 */

// Importa el modelo Carrito desde models/Carrito.js.
// Representa la tabla 'Carrito' en la BD (items que el usuario agrega para comprar).
const Carrito = require('../models/Carrito');

// Importa el modelo Producto desde models/Producto.js.
// Se usa para verificar stock, precios y estado del producto al agregar al carrito.
const Producto = require('../models/Producto');

// Importa el modelo Categoria desde models/Categoria.js.
// Se incluye en las consultas para mostrar la categoría de cada producto del carrito.
const Categoria = require('../models/Categoria');

// Importa el modelo Subcategoria desde models/Subcategoria.js.
// Se incluye en las consultas para mostrar la subcategoría de cada producto.
const Subcategoria = require('../models/Subcategoria');

/**
 * Obtener carrito del usuario autenticado
 * 
 * Ruta: GET /api/cliente/carrito
 * Retorna todos los items del carrito del usuario con detalles del producto.
 */
const getCarrito = async (req, res) => {
  try {
    // Busca TODOS los items del carrito que pertenecen al usuario autenticado.
    // findAll() retorna un array de registros que coincidan con las condiciones.
    const itemsCarrito = await Carrito.findAll({
      // where: filtra por el ID del usuario (viene del token via middleware)
      where: { usuarioId: req.usuario.id },
      // include: hace un JOIN con la tabla Producto para traer los datos del producto.
      // Es como un LEFT JOIN en SQL: trae los datos relacionados en una sola consulta.
      include: [
        {
          model: Producto,              // Modelo con el que se hace el JOIN
          as: 'producto',               // Alias de la relación (definido en el modelo)
          // attributes: lista los campos específicos del producto que queremos obtener
          // (no traer todos los campos, solo los necesarios)
          attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
          // include anidado: dentro del producto, traer también su categoría y subcategoría
          include: [
            {
              model: Categoria,
              as: 'categoria',
              attributes: ['id', 'nombre']   // Solo id y nombre de la categoría
            },
            {
              model: Subcategoria,
              as: 'subcategoria',
              attributes: ['id', 'nombre']   // Solo id y nombre de la subcategoría
            }
          ]
        }
      ],
      // order: ordena los resultados por fecha de creación ascendente (primero los más antiguos)
      // ASC = ascendente, DESC = descendente
      order: [['createdAt', 'ASC']]
    });
    
    // Calcula el total del carrito sumando (precioUnitario * cantidad) de cada item.
    let total = 0;
    // forEach recorre cada item del array
    itemsCarrito.forEach(item => {
      // parseFloat convierte el precio (que puede ser string) a número decimal
      total += parseFloat(item.precioUnitario) * item.cantidad;
    });
    
    // Responde con los items del carrito y un resumen
    res.json({
      success: true,
      data: {
        items: itemsCarrito,   // Array con todos los items del carrito
        resumen: {
          totalItems: itemsCarrito.length,  // Cantidad de productos diferentes en el carrito
          // reduce() acumula un valor recorriendo el array:
          // sum empieza en 0 y va sumando la cantidad de cada item
          cantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
          // toFixed(2) formatea el número con 2 decimales: 15000 -> "15000.00"
          total: total.toFixed(2)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito',
      error: error.message
    });
  }
};

/**
 * Agregar producto al carrito
 * 
 * Ruta: POST /api/cliente/carrito
 * Body esperado: { productoId, cantidad }
 * Si el producto ya está en el carrito, suma la cantidad.
 */
const agregarAlCarrito = async (req, res) => {
  try {
    // Extrae productoId y cantidad del body.
    // Si no viene cantidad, usa 1 por defecto (valor default).
    const { productoId, cantidad = 1 } = req.body;
    
    // VALIDACIÓN 1: Verifica que se envió el ID del producto
    if (!productoId) {
      return res.status(400).json({
        success: false,
        message: 'El productoId es requerido'
      });
    }
    
    // VALIDACIÓN 2: Verifica que la cantidad sea un número válido >= 1
    // parseInt convierte string a número entero: "3" -> 3
    const cantidadNum = parseInt(cantidad);
    if (cantidadNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser al menos 1'
      });
    }
    
    // VALIDACIÓN 3: Busca el producto en la BD para verificar que existe.
    // findByPk() busca por Primary Key (clave primaria = id)
    const producto = await Producto.findByPk(productoId);
    
    // Si no existe el producto
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Verifica que el producto esté activo (no desactivado por un admin)
    if (!producto.activo) {
      return res.status(400).json({
        success: false,
        message: 'El producto no está disponible'
      });
    }
    
    // VALIDACIÓN 4: Verifica si este producto ya está en el carrito del usuario.
    // findOne() busca un solo registro que coincida con las condiciones.
    const itemExistente = await Carrito.findOne({
      where: {
        usuarioId: req.usuario.id,  // Del usuario actual
        productoId                   // Con este producto
      }
    });
    
    // Si el producto YA está en el carrito, actualiza la cantidad en vez de crear otro
    if (itemExistente) {
      // Suma la cantidad nueva a la existente
      const nuevaCantidad = itemExistente.cantidad + cantidadNum;
      
      // Verifica que la nueva cantidad total no supere el stock disponible
      if (nuevaCantidad > producto.stock) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente. Disponible: ${producto.stock}, En carrito: ${itemExistente.cantidad}`
        });
      }
      
      // Actualiza la cantidad en el registro existente
      itemExistente.cantidad = nuevaCantidad;
      await itemExistente.save();  // Guarda los cambios en la BD
      
      // Recarga el item con los datos del producto incluidos (para la respuesta)
      // reload() vuelve a consultar la BD y actualiza el objeto en memoria
      await itemExistente.reload({
        include: [{
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
        }]
      });
      
      // Responde con el item actualizado
      return res.json({
        success: true,
        message: 'Cantidad actualizada en el carrito',
        data: {
          item: itemExistente
        }
      });
    }
    
    // VALIDACIÓN 5: Si es un producto NUEVO en el carrito, verifica stock disponible
    if (cantidadNum > producto.stock) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${producto.stock}`
      });
    }
    
    // CREAR NUEVO ITEM EN EL CARRITO.
    // Carrito.create() inserta un nuevo registro en la tabla Carrito.
    const nuevoItem = await Carrito.create({
      usuarioId: req.usuario.id,       // ID del usuario (dueño del carrito)
      productoId,                       // ID del producto que agrega
      cantidad: cantidadNum,            // Cantidad solicitada
      precioUnitario: producto.precio   // Precio al momento de agregar (se congela)
    });
    
    // Recarga el item con los datos del producto para la respuesta
    await nuevoItem.reload({
      include: [{
        model: Producto,
        as: 'producto',
        attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
      }]
    });
    
    // Responde con status 201 (Created) y el nuevo item
    res.status(201).json({
      success: true,
      message: 'Producto agregado al carrito',
      data: {
        item: nuevoItem
      }
    });
    
  } catch (error) {
    console.error('Error en agregarAlCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto al carrito',
      error: error.message
    });
  }
};

/**
 * Actualizar cantidad de un item del carrito
 * 
 * Ruta: PUT /api/cliente/carrito/:id
 * Parámetro URL: :id = ID del item del carrito
 * Body: { cantidad }
 */
const actualizarItemCarrito = async (req, res) => {
  try {
    // req.params contiene los parámetros de la URL.
    // En la ruta /carrito/:id, req.params.id es el valor después de /carrito/
    const { id } = req.params;
    // Extrae la nueva cantidad del body
    const { cantidad } = req.body;
    
    // Convierte la cantidad a número entero y valida que sea >= 1
    const cantidadNum = parseInt(cantidad);
    if (cantidadNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser al menos 1'
      });
    }
    
    // Busca el item del carrito por su ID Y que pertenezca al usuario actual.
    // La doble condición (id + usuarioId) evita que un usuario modifique el carrito de otro.
    const item = await Carrito.findOne({
      where: {
        id,                              // ID del item del carrito
        usuarioId: req.usuario.id        // Solo puede modificar SU propio carrito
      },
      // Incluye los datos del producto para verificar stock
      include: [{
        model: Producto,
        as: 'producto',
        attributes: ['id', 'nombre', 'precio', 'stock']
      }]
    });
    
    // Si no encontró el item (no existe o no pertenece al usuario)
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }
    
    // Verifica que la nueva cantidad no supere el stock disponible del producto
    if (cantidadNum > item.producto.stock) {
      return res.status(400).json({
        success: false,
        message: `Stock insuficiente. Disponible: ${item.producto.stock}`
      });
    }
    
    // Actualiza la cantidad y guarda en la BD
    item.cantidad = cantidadNum;
    await item.save();
    
    // Responde con el item actualizado
    res.json({
      success: true,
      message: 'Cantidad actualizada',
      data: {
        item
      }
    });
    
  } catch (error) {
    console.error('Error en actualizarItemCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar item del carrito',
      error: error.message
    });
  }
};

/**
 * Eliminar un item del carrito
 * 
 * Ruta: DELETE /api/cliente/carrito/:id
 * Parámetro URL: :id = ID del item del carrito a eliminar
 */
const eliminarItemCarrito = async (req, res) => {
  try {
    // Obtiene el ID del item desde los parámetros de la URL
    const { id } = req.params;
    
    // Busca el item verificando que pertenezca al usuario actual
    const item = await Carrito.findOne({
      where: {
        id,
        usuarioId: req.usuario.id  // Seguridad: solo puede eliminar items de SU carrito
      }
    });
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }
    
    // .destroy() elimina el registro de la BD (DELETE en SQL)
    await item.destroy();
    
    // Responde confirmando la eliminación
    res.json({
      success: true,
      message: 'Producto eliminado del carrito'
    });
    
  } catch (error) {
    console.error('Error en eliminarItemCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar item del carrito',
      error: error.message
    });
  }
};

/**
 * Vaciar todo el carrito
 * 
 * Ruta: DELETE /api/cliente/carrito
 * Elimina TODOS los items del carrito del usuario autenticado.
 */
const vaciarCarrito = async (req, res) => {
  try {
    // Carrito.destroy() con where elimina TODOS los registros que coincidan.
    // Equivale a: DELETE FROM Carrito WHERE usuarioId = X
    // Retorna el número de registros eliminados.
    const itemsEliminados = await Carrito.destroy({
      where: { usuarioId: req.usuario.id }
    });
    
    // Responde con la cantidad de items eliminados
    res.json({
      success: true,
      message: 'Carrito vaciado',
      data: {
        itemsEliminados  // Número de items que se eliminaron
      }
    });
    
  } catch (error) {
    console.error('Error en vaciarCarrito:', error);
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito',
      error: error.message
    });
  }
};

// Exporta las funciones del controlador para ser usadas en las rutas.
// Se importan en routes/cliente.routes.js
module.exports = {
  getCarrito,               // GET /api/cliente/carrito - Ver carrito
  agregarAlCarrito,         // POST /api/cliente/carrito - Agregar producto
  actualizarItemCarrito,    // PUT /api/cliente/carrito/:id - Cambiar cantidad
  eliminarItemCarrito,      // DELETE /api/cliente/carrito/:id - Quitar un item
  vaciarCarrito             // DELETE /api/cliente/carrito - Vaciar todo
};
