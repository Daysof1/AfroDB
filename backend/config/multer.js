/**
 * ============================================
 * CONFIGURACIÓN DE MULTER
 * ============================================
 * Multer es un middleware de Express para manejar la subida de archivos (multipart/form-data).
 * Este archivo configura CÓMO se guardan las imágenes (nombre, carpeta) y QUÉ archivos se permiten.
 * Es usado en las rutas de productos (routes/) cuando se sube una imagen de producto.
 */

// Importa el paquete 'multer' desde node_modules.
// Multer intercepta las peticiones que contienen archivos y los procesa.
const multer = require('multer');

// Importa el módulo 'path' de Node.js (módulo nativo, no necesita instalación).
// Provee utilidades para trabajar con rutas de archivos y directorios.
const path = require('path');

// Importa el módulo 'fs' (File System) de Node.js (módulo nativo).
// Permite leer, escribir, crear y eliminar archivos y carpetas del sistema.
const fs = require('fs');

// Carga las variables del archivo .env en process.env.
require('dotenv').config();

// Lee la ruta donde se guardarán los archivos subidos desde .env (variable UPLOAD_PATH).
// Si no existe la variable, usa './uploads' como carpeta por defecto (relativa al proyecto).
const uploadPath = process.env.UPLOAD_PATH || './uploads';

// Verifica si la carpeta de uploads ya existe en el sistema de archivos.
// fs.existsSync() retorna true si la ruta existe, false si no.
if (!fs.existsSync(uploadPath)) {
  // Si la carpeta NO existe, la crea.
  // { recursive: true } permite crear carpetas anidadas (ej: ./uploads/images/products)
  fs.mkdirSync(uploadPath, { recursive: true });
  // Informa en consola que la carpeta fue creada
  console.log(`📁 Carpeta ${uploadPath} creada`);
}

/**
 * Configuración de almacenamiento de multer.
 * multer.diskStorage() define las reglas para guardar archivos en disco.
 * Controla: dónde se guarda (destination) y con qué nombre (filename).
 */
const storage = multer.diskStorage({
  /**
   * destination: función que define la carpeta destino donde se guardará el archivo subido.
   * 
   * @param {Object} req - Objeto de petición HTTP de Express (contiene datos de la petición)
   * @param {Object} file - Objeto con la información del archivo subido (nombre, tipo, tamaño)
   * @param {Function} cb - Callback (función de retorno) que recibe: (error, rutaDestino)
   */
  destination: function (req, file, cb) {
    // Llama al callback con:
    // - null: sin error (primer parámetro)
    // - uploadPath: la carpeta donde se guardará el archivo (segundo parámetro)
    cb(null, uploadPath);
  },
  
  /**
   * filename: función que define el nombre con el que se guardará el archivo.
   * Se genera un nombre único para evitar que dos archivos se sobreescriban.
   * Formato resultante: 1709578800000-producto.jpg (timestamp + nombre original)
   * 
   * @param {Object} req - Objeto de petición HTTP de Express
   * @param {Object} file - Objeto con info del archivo (file.originalname = nombre original)
   * @param {Function} cb - Callback que recibe: (error, nombreArchivo)
   */
  filename: function (req, file, cb) {
    // Date.now() genera un timestamp en milisegundos (ej: 1709578800000)
    // Se concatena con '-' y el nombre original del archivo
    // Esto garantiza un nombre único (el timestamp cambia cada milisegundo)
    const uniqueName = Date.now() + '-' + file.originalname;
    // Llama al callback con null (sin error) y el nombre único generado
    cb(null, uniqueName);
  }
});

/**
 * Filtro para validar el tipo de archivo antes de guardarlo.
 * Solo permite imágenes. Si alguien intenta subir un .pdf o .exe, se rechaza.
 * 
 * @param {Object} req - Objeto de petición HTTP de Express
 * @param {Object} file - Objeto del archivo (file.mimetype indica el tipo: 'image/jpeg', etc.)
 * @param {Function} cb - Callback: cb(null, true) = aceptar, cb(error, false) = rechazar
 */
const fileFilter = (req, file, cb) => {
  // Array con los tipos MIME permitidos (solo formatos de imagen)
  // MIME type es un estándar que identifica el tipo de contenido de un archivo
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  // Verifica si el tipo MIME del archivo subido está en la lista de permitidos
  // includes() retorna true si el elemento está en el array
  if (allowedMimeTypes.includes(file.mimetype)) {
    // Si el tipo es permitido, acepta el archivo: cb(null, true)
    // null = sin error, true = aceptar archivo
    cb(null, true);
  } else {
    // Si el tipo NO es permitido, rechaza el archivo con un mensaje de error
    // El error será capturado por Express y enviado como respuesta al cliente
    cb(new Error('Solo se permiten imágenes (JPG, JPEG, PNG, GIF)'), false);
  }
};

/**
 * Crea la instancia final de multer combinando todas las configuraciones:
 * storage (dónde y cómo guardar), fileFilter (qué tipos permitir) y limits (tamaño máximo).
 */
const upload = multer({
  // storage: usa la configuración de almacenamiento definida arriba
  storage: storage,
  // fileFilter: usa el filtro de tipos de archivo definido arriba
  fileFilter: fileFilter,
  // limits: restricciones adicionales
  limits: {
    // fileSize: tamaño máximo del archivo en bytes.
    // Lee MAX_FILE_SIZE del .env y lo convierte a número con parseInt().
    // Si no existe la variable, usa 5242880 bytes = 5 MB (5 * 1024 * 1024)
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
  }
});

/**
 * Función para eliminar un archivo del servidor (del disco).
 * Se usa cuando se actualiza la imagen de un producto (borrar la anterior)
 * o cuando se elimina un producto completamente.
 * 
 * @param {String} filename - Solo el nombre del archivo a eliminar (ej: '1709578800000-foto.jpg')
 * @returns {Boolean} - true si se eliminó correctamente, false si hubo error o no existía
 */
const deleteFile = (filename) => {
  try {
    // path.join() une la ruta de la carpeta uploads con el nombre del archivo.
    // Ejemplo: path.join('./uploads', '1709578800000-foto.jpg') = './uploads/1709578800000-foto.jpg'
    // Usa el separador correcto según el sistema operativo (/ en Linux, \ en Windows)
    const filePath = path.join(uploadPath, filename);
    
    // Verifica si el archivo existe antes de intentar eliminarlo
    if (fs.existsSync(filePath)) {
      // fs.unlinkSync() elimina el archivo del disco de forma síncrona (espera a que termine)
      fs.unlinkSync(filePath);
      console.log(`🗑️ Archivo eliminado: ${filename}`);
      return true;
    } else {
      // Si el archivo no existe, avisa pero no lanza error
      console.log(`⚠️ Archivo no encontrado: ${filename}`);
      return false;
    }
  } catch (error) {
    // Si ocurre cualquier error (permisos, disco lleno, etc.), lo registra
    console.error('❌ Error al eliminar archivo:', error.message);
    return false;
  }
};

// Exporta el middleware de multer y la función de eliminación
// para que sean usados en los archivos de rutas (routes/).
// Ejemplo: const { upload } = require('../config/multer');
//          router.post('/productos', upload.single('imagen'), controller.crear);
module.exports = {
  upload,        // Middleware de multer: se usa en las rutas para recibir archivos
  deleteFile     // Función auxiliar: se usa en controllers para eliminar imágenes viejas
};
