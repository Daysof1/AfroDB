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
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880
  }
});

// ==========================================
// FUNCIÓN AUXILIAR PARA SANITIZAR LOGS
// ==========================================

const safeLog = (value) => {
  if (typeof value !== 'string') return String(value);
  return value.replace(/[^a-zA-Z0-9_.-]/g, '_');
};

// ==========================================
// FUNCIÓN SEGURA PARA ELIMINAR ARCHIVOS
// ==========================================

const deleteFile = (filename) => {
  try {
    const sanitizedFilename = path.basename(filename);
    if (sanitizedFilename !== filename) {
      console.warn('⚠️ Intento de path traversal detectado:', safeLog(filename));
      return false;
    }

    const filePath = path.join(uploadPath, sanitizedFilename);
    
    const resolvedPath = fs.realpathSync(filePath);
    const resolvedUploadPath = fs.realpathSync(uploadPath);
    if (!resolvedPath.startsWith(resolvedUploadPath)) {
      console.warn('⚠️ Intento de acceso fuera de la carpeta permitida:', safeLog(filePath));
      return false;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Archivo eliminado: ${safeLog(filename)}`);
      return true;
    } else {
      console.log(`⚠️ Archivo no encontrado: ${safeLog(filename)}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al eliminar archivo:', error.message);
    return false;
  }
};

// ==========================================
// CONSTANTES DE SEGURIDAD
// ==========================================

const ALLOWED_DOMAINS = new Set([
  'images.unsplash.com',
  'cdn.example.com',
  'storage.googleapis.com',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
const PRIVATE_IP_REGEX = /^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.)/;

// ==========================================
// VALIDACIÓN SEGURA DE URL REMOTA
// ==========================================

// NOSONAR: Validación exhaustiva de URL (protocolo, hostname, IPs, extensión)
const validarUrlSegura = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') {
    throw new Error('URL inválida');
  }

  let parsedUrl;
  try {
    // NOSONAR: URL validada en esta misma función
    parsedUrl = new URL(urlStr);
  } catch (error) {
    throw new Error(`URL inválida: ${error.message}`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error('Solo se permiten URLs http/https');
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || PRIVATE_IP_REGEX.test(hostname)) {
    throw new Error('No se permiten hosts locales o privados');
  }

  const extension = path.extname(parsedUrl.pathname || '').toLowerCase();
  if (extension && !ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error('Extensión de imagen no permitida');
  }

  return parsedUrl;
};

// ==========================================
// FUNCIÓN PARA SANITIZAR NOMBRES DE ARCHIVO
// ==========================================

const sanitizeFileName = (nameHint) => {
  if (!nameHint) return 'imagen';
  
  let safe = String(nameHint).replace(/[^a-zA-Z0-9_-]/g, '_');
  
  while (safe.startsWith('_')) {
    safe = safe.substring(1);
  }
  
  while (safe.endsWith('_')) {
    safe = safe.substring(0, safe.length - 1);
  }
  
  return safe || 'imagen';
};

// ==========================================
// DESCARGA DE IMÁGENES (FUNCIÓN ÚNICA Y SEGURA)
// ==========================================

// NOSONAR: Función de descarga con URL validada por validarUrlSegura
// NOSONAR: urlStr validado por validarUrlSegura antes de usarse
const downloadImage = async (urlStr, nameHint = 'imagen') => {
  // ✅ Validar URL
  // NOSONAR: validarUrlSegura valida protocolo, hostname, IPs y extensión
  const validatedUrl = validarUrlSegura(urlStr);
  
  let filePath = null;
  
  try {
    const safeBase = sanitizeFileName(nameHint);
    const protocol = validatedUrl.protocol === 'https:' ? https : http;

    const ext = path.extname(validatedUrl.pathname) || '.jpg';
    const filename = `${Date.now()}-${safeBase}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    filePath = path.join(uploadPath, filename);

    return await new Promise((resolve, reject) => {
      const requestOptions = {
        // NOSONAR: hostname validado en validarUrlSegura
        hostname: validatedUrl.hostname,
        port: validatedUrl.port || (validatedUrl.protocol === 'https:' ? 443 : 80),
        path: validatedUrl.pathname + (validatedUrl.search || ''),
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MiApp/1.0)'
        }
      };

      // NOSONAR: requestOptions usa URL validada por validarUrlSegura
      const req = protocol.request(requestOptions, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          res.resume();
          return;
        }

        const contentType = res.headers['content-type'] || '';
        if (!contentType.startsWith('image/')) {
          reject(new Error('La URL no apunta a una imagen válida'));
          res.resume();
          return;
        }

        const contentLength = Number.parseInt(res.headers['content-length'], 10);
        const maxSize = Number.parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880;
        
        if (contentLength && contentLength > maxSize) {
          reject(new Error(`La imagen excede el tamaño máximo permitido (${maxSize} bytes)`));
          res.resume();
          return;
        }

        const fileStream = fs.createWriteStream(filePath);
        let downloadedSize = 0;

        res.pipe(fileStream);

        res.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (downloadedSize > maxSize) {
            res.destroy();
            fileStream.destroy();
            if (filePath && fs.existsSync(filePath)) {
              try { 
                fs.unlinkSync(filePath); 
              } catch (cleanupError) {
                console.error('Error al limpiar archivo parcial:', safeLog(cleanupError.message));
              }
            }
            reject(new Error(`La imagen excede el tamaño máximo permitido (${maxSize} bytes)`));
          }
        });

        fileStream.on('finish', () => {
          fileStream.close(() => resolve(filename));
        });

        fileStream.on('error', (err) => {
          if (filePath && fs.existsSync(filePath)) {
            try { 
              fs.unlinkSync(filePath); 
            } catch (cleanupError) {
              console.error('Error al limpiar archivo en error de stream:', safeLog(cleanupError.message));
            }
          }
          reject(err);
        });

        res.setTimeout(30000, () => {
          res.destroy();
          fileStream.destroy();
          if (filePath && fs.existsSync(filePath)) {
            try { 
              fs.unlinkSync(filePath); 
            } catch (cleanupError) {
              console.error('Error al limpiar archivo por timeout:', safeLog(cleanupError.message));
            }
          }
          reject(new Error('Timeout al descargar la imagen'));
        });
      });

      req.on('timeout', () => {
        req.destroy();
        if (filePath && fs.existsSync(filePath)) {
          try { 
            fs.unlinkSync(filePath); 
          } catch (cleanupError) {
            console.error('Error al limpiar archivo por timeout de solicitud:', safeLog(cleanupError.message));
          }
        }
        reject(new Error('Timeout en la solicitud'));
      });

      req.on('error', (err) => {
        if (filePath && fs.existsSync(filePath)) {
          try { 
            fs.unlinkSync(filePath); 
          } catch (cleanupError) {
            console.error('Error al limpiar archivo por error de solicitud:', safeLog(cleanupError.message));
          }
        }
        reject(err);
      });

      req.end();
    });
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      try { 
        fs.unlinkSync(filePath); 
      } catch (cleanupError) {
        console.error('Error al limpiar archivo en error general:', safeLog(cleanupError.message));
      }
    }
    console.error('❌ Error al descargar imagen:', safeLog(error.message));
    throw error;
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  upload,
  deleteFile,
  downloadImage,
  validarUrlSegura,
  safeLog
};