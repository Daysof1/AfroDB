/**
 * ============================================
 * SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS
 * ============================================
 * Este script crea la base de datos si no existe.
 * Se ejecuta UNA sola vez antes de iniciar el servidor.
 * Se invoca con el comando: npm run init-db (definido en package.json)
 */

// Importa mysql2 en su versión con promesas (async/await) desde node_modules.
// Se usa mysql2 directamente (no Sequelize) porque en este punto la BD aún no existe
// y Sequelize necesita que la BD ya esté creada para conectarse.
const mysql = require('mysql2/promise');

// Importa y ejecuta dotenv: lee el archivo .env de la raíz del proyecto
// y carga las variables definidas allí (DB_HOST, DB_USER, etc.) en process.env
require('dotenv').config();

/**
 * Función principal que crea la base de datos.
 * Es async porque usa await para esperar las operaciones de base de datos.
 */
const createDatabase = async () => {
  // Declara la variable connection fuera del try para poder cerrarla en el catch si falla
  let connection;
  
  try {
    // Muestra mensaje en consola indicando que el proceso comenzó
    console.log('🔧 Iniciando creación de base de datos...\n');
    
    // Crea una conexión directa a MySQL SIN especificar base de datos
    // porque la base de datos todavía no existe y la vamos a crear
    console.log('📡 Conectando a MySQL...');
    connection = await mysql.createConnection({
      // host: dirección del servidor MySQL, viene del archivo .env (variable DB_HOST)
      // Si no existe la variable, usa 'localhost' como valor por defecto
      host: process.env.DB_HOST || 'localhost',
      // port: puerto donde escucha MySQL, viene del .env (variable DB_PORT)
      // Si no existe, usa 3306 que es el puerto estándar de MySQL
      port: process.env.DB_PORT || 3306,
      // user: usuario de MySQL, viene del .env (variable DB_USER)
      // Si no existe, usa 'root' que es el usuario por defecto de XAMPP
      user: process.env.DB_USER || 'root',
      // password: contraseña de MySQL, viene del .env (variable DB_PASSWORD)
      // Si no existe, usa cadena vacía (por defecto XAMPP no tiene contraseña)
      password: process.env.DB_PASSWORD || ''
    });
    
    // Si llegó hasta aquí sin error, la conexión fue exitosa
    console.log('✅ Conexión a MySQL establecida\n');
    
    // Obtiene el nombre de la base de datos del .env (variable DB_NAME)
    // Si no existe la variable, usa 'ecommerce_db' como nombre por defecto
    const dbName = process.env.DB_NAME || 'ecommerce_db';
    console.log(`📦 Creando base de datos: ${dbName}...`);
    
    // Ejecuta la query SQL para crear la base de datos:
    // - CREATE DATABASE IF NOT EXISTS: crea la BD solo si no existe (evita error si ya fue creada)
    // - Los backticks `` protegen el nombre por si tiene caracteres especiales
    // - CHARACTER SET utf8mb4: codificación que soporta emojis y caracteres especiales
    // - COLLATE utf8mb4_unicode_ci: reglas de comparación de texto (insensible a mayúsculas)
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    // Confirma que la base de datos fue creada o ya existía
    console.log(`✅ Base de datos '${dbName}' creada/verificada exitosamente\n`);
    
    // Cierra la conexión a MySQL para liberar recursos
    // Es importante cerrar conexiones cuando ya no se necesitan
    await connection.end();
    
    // Mensaje final indicando que todo salió bien
    console.log('🎉 ¡Proceso completado! Ahora puedes iniciar el servidor con: npm run dev\n');
    
  } catch (error) {
    // Si ocurre cualquier error en el try, se captura aquí
    // error.message contiene la descripción del error
    console.error('❌ Error al crear la base de datos:', error.message);
    // Muestra sugerencias para solucionar el error
    console.error('\n📋 Verifica que:');
    console.error('   1. XAMPP esté corriendo');
    console.error('   2. MySQL esté iniciado en XAMPP');
    console.error('   3. Las credenciales en .env sean correctas\n');
    
    // Si la conexión se alcanzó a crear antes del error, la cierra
    if (connection) {
      await connection.end();
    }
    
    // process.exit(1) termina el proceso de Node.js con código 1 (indica error)
    // Código 0 = éxito, código 1 = error
    process.exit(1);
  }
};

// Llama a la función createDatabase() para que se ejecute inmediatamente
// cuando se corre este archivo con: node config/createDatabase.js
createDatabase();
