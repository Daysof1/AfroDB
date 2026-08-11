/**
 * ============================================
 * CONFIGURACIÓN DE MULTER (VERSIÓN SEGURA)
 * ============================================
 */

const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const { URL } = require('node:url');
const crypto = require('node:crypto');
const https = require('node:https');
const http = require('node:http');
require('dotenv').config();

const uploadPath = process.env.UPLOAD_PATH || './uploads';

// Crear carpeta si no existe
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`📁 Carpeta ${uploadPath} creada`);
}

// ==========================================
// CONFIGURACIÓN DE STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

// ==========================================
// FILTRO DE ARCHIVOS
// ==========================================

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (JPG, JPEG, PNG, GIF, WebP)'), false);
  }
};

// ==========================================
// INSTANCIA DE MULTER
// ==========================================

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 5242880
  }
});

// ==========================================
// FUNCIÓN SEGURA PARA ELIMINAR ARCHIVOS
// ==========================================

const deleteFile = (filename) => {
  try {
    // Validar que el filename no contenga caracteres peligrosos
    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      console.warn('⚠️ Intento de path traversal detectado:', filename);
      return false;
    }

    const filePath = path.join(uploadPath, sanitizedFilename);
    
    // Verificar que el archivo está dentro de uploadPath
    const resolvedPath = fs.realpathSync(filePath);
    const resolvedUploadPath = fs.realpathSync(uploadPath);
    if (!resolvedPath.startsWith(resolvedUploadPath)) {
      console.warn('⚠️ Intento de acceso fuera de la carpeta permitida:', filePath);
      return false;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Archivo eliminado: ${filename}`);
      return true;
    } else {
      console.log(`⚠️ Archivo no encontrado: ${filename}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al eliminar archivo:', error.message);
    return false;
  }
};

// ==========================================
// FUNCIÓN SEGURA PARA DESCARGAR IMÁGENES
// ==========================================

/**
 * VALIDA que una URL sea segura antes de descargarla
 * Previene ataques SSRF y path traversal
 */
const validateImageUrl = (urlStr) => {
  try {
    // Usar URL directamente (ya importado como node:url)
    const parsedUrl = new URL(urlStr);
    
    // 1. SOLO permitir HTTP o HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Protocolo no permitido. Solo HTTP o HTTPS');
    }

    // 2. Lista blanca de dominios permitidos (¡CONFIGURA ESTO!)
    const allowedDomains = [
      'images.unsplash.com',
      'cdn.example.com',
      'storage.googleapis.com',
    ];

    // Si la lista blanca está configurada, validar contra ella
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(domain => 
        parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      );
      
      if (!isAllowed) {
        throw new Error(`Dominio no permitido: ${parsedUrl.hostname}`);
      }
    }

    // 3. Prevenir ataques con IPs locales
    const hostname = parsedUrl.hostname.toLowerCase();
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '::ffff:127.0.0.1'
    ];

    if (blockedHosts.includes(hostname)) {
      throw new Error('Acceso a localhost no permitido');
    }

    // 4. Prevenir IPs privadas - Regex optimizada
    const privateIPRegex = /^(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.|127\.)/;
    if (privateIPRegex.test(hostname)) {
      throw new Error('Acceso a IP privada no permitido');
    }

    // 5. Validar extensión de archivo
    const pathname = parsedUrl.pathname.toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => pathname.endsWith(ext));
    
    if (!hasValidExtension) {
      throw new Error('La URL no apunta a una imagen con extensión válida');
    }

    return parsedUrl;
  } catch (error) {
    // Lanzar el error para que sea manejado por el llamador
    throw new Error(`URL inválida: ${error.message}`);
  }
};

/**
 * Sanitiza el nombre del archivo de manera segura
 * Versión optimizada sin regex compleja
 */
const sanitizeFileName = (nameHint) => {
  if (!nameHint) return 'imagen';
  
  // Convertir a string y eliminar caracteres no permitidos
  let safe = String(nameHint)
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Regex simplificada
    .replace(/^_+|_+$/g, '');
  
  // Si quedó vacío, usar default
  return safe || 'imagen';
};

/**
 * Descarga una imagen desde una URL de manera SEGURA
 */
const downloadImage = async (urlStr, nameHint = 'imagen') => {
  // Variable para almacenar la ruta del archivo y poder limpiar en caso de error
  let filePath = null;
  
  try {
    // 1. VALIDAR LA URL (previene SSRF)
    const validatedUrl = validateImageUrl(urlStr);
    
    // 2. SANITIZAR el nombre del archivo (regex optimizada)
    const safeBase = sanitizeFileName(nameHint);

    // 3. Determinar protocolo de manera segura (ya validado)
    const protocol = validatedUrl.protocol === 'https:' ? https : http;

    // 4. Crear nombre único para el archivo
    const ext = path.extname(validatedUrl.pathname) || '.jpg';
    const filename = `${Date.now()}-${safeBase}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    filePath = path.join(uploadPath, filename);

    // 5. Descargar con timeout y límite de tamaño
    return await new Promise((resolve, reject) => {
      // Usar hostname y path del objeto URL validado
      const requestOptions = {
        hostname: validatedUrl.hostname,
        port: validatedUrl.port || (validatedUrl.protocol === 'https:' ? 443 : 80),
        path: validatedUrl.pathname + (validatedUrl.search || ''),
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MiApp/1.0)'
        }
      };

      const req = protocol.request(requestOptions, (res) => {
        // Verificar código de estado
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          res.resume();
          return;
        }

        // Verificar content-type
        const contentType = res.headers['content-type'] || '';
        if (!contentType.startsWith('image/')) {
          reject(new Error('La URL no apunta a una imagen válida'));
          res.resume();
          return;
        }

        // Verificar tamaño (Content-Length)
        const contentLength = parseInt(res.headers['content-length'], 10);
        const maxSize = Number.parseInt(process.env.MAX_FILE_SIZE) || 5242880;
        
        if (contentLength && contentLength > maxSize) {
          reject(new Error(`La imagen excede el tamaño máximo permitido (${maxSize} bytes)`));
          res.resume();
          return;
        }

        // Crear stream de escritura
        const fileStream = fs.createWriteStream(filePath);
        let downloadedSize = 0;

        res.pipe(fileStream);

        // Monitorear tamaño durante la descarga
        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (downloadedSize > maxSize) {
            res.destroy();
            fileStream.destroy();
            // Limpiar archivo parcial
            if (filePath && fs.existsSync(filePath)) {
              try { fs.unlinkSync(filePath); } catch (cleanupError) {
                console.error('Error al limpiar archivo parcial:', cleanupError.message);
              }
            }
            reject(new Error(`La imagen excede el tamaño máximo permitido (${maxSize} bytes)`));
          }
        });

        fileStream.on('finish', () => {
          fileStream.close(() => resolve(filename));
        });

        fileStream.on('error', (err) => {
          // Limpiar archivo en caso de error
          if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (cleanupError) {
              console.error('Error al limpiar archivo en error de stream:', cleanupError.message);
            }
          }
          reject(err);
        });

        // Timeout de la respuesta
        res.setTimeout(30000, () => {
          res.destroy();
          fileStream.destroy();
          if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (cleanupError) {
              console.error('Error al limpiar archivo por timeout:', cleanupError.message);
            }
          }
          reject(new Error('Timeout al descargar la imagen'));
        });
      });

      req.on('timeout', () => {
        req.destroy();
        if (filePath && fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (cleanupError) {
            console.error('Error al limpiar archivo por timeout de solicitud:', cleanupError.message);
          }
        }
        reject(new Error('Timeout en la solicitud'));
      });

      req.on('error', (err) => {
        if (filePath && fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (cleanupError) {
            console.error('Error al limpiar archivo por error de solicitud:', cleanupError.message);
          }
        }
        reject(err);
      });

      req.end();
    });
  } catch (error) {
    // Limpiar archivo en caso de error general
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (cleanupError) {
        console.error('Error al limpiar archivo en error general:', cleanupError.message);
      }
    }
    console.error('❌ Error al descargar imagen:', error.message);
    throw error;
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  upload,
  deleteFile,
  downloadImage
};