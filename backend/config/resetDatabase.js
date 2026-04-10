/**
 * ============================================
 * SCRIPT DE RESET DE BASE DE DATOS
 * ============================================
 * Este script ELIMINA completamente la base de datos y la vuelve a crear vacía.
 * ¡CUIDADO! Se pierden TODOS los datos (usuarios, productos, pedidos, etc.).
 * Se ejecuta con el comando: npm run reset-db (definido en package.json).
 * Útil cuando se necesita empezar desde cero en desarrollo.
 */

// Importa mysql2 en su versión con promesas (async/await) desde node_modules.
// Se usa mysql2 directamente (no Sequelize) porque se necesita eliminar/crear la BD completa,
// operaciones que Sequelize no maneja directamente.
const mysql = require('mysql2/promise');

// Carga las variables del archivo .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT)
// en el objeto global process.env para poder accederlas en este archivo.
require('dotenv').config();

/**
 * Función principal que elimina y recrea la base de datos.
 * Es async porque usa await para esperar las operaciones de MySQL.
 */
const resetDatabase = async () => {
  // Declara connection fuera del try para poder accederla en el catch si hay error
  let connection;
  
  try {
    // Mensaje de inicio del proceso
    console.log('🔧 Iniciando reset de base de datos...\n');
    
    // Crea una conexión directa a MySQL SIN especificar base de datos.
    // No especifica BD porque la vamos a eliminar (no se puede estar conectado a una BD y borrarla).
    console.log('📡 Conectando a MySQL...');
    connection = await mysql.createConnection({
      // host: dirección del servidor MySQL, del .env. Por defecto 'localhost' (máquina local)
      host: process.env.DB_HOST || 'localhost',
      // port: puerto de MySQL, del .env. Por defecto 3306 (estándar de MySQL)
      port: process.env.DB_PORT || 3306,
      // user: usuario de MySQL, del .env. Por defecto 'root' (usuario admin de XAMPP)
      user: process.env.DB_USER || 'root',
      // password: contraseña de MySQL, del .env. Por defecto vacía (XAMPP sin contraseña)
      password: process.env.DB_PASSWORD || ''
    });
    
    // Si no hubo error, la conexión se estableció correctamente
    console.log('✅ Conexión a MySQL establecida\n');
    
    // Lee el nombre de la base de datos del .env (variable DB_NAME)
    // Si no existe la variable, usa 'ecommerce_db' como valor por defecto
    const dbName = process.env.DB_NAME || 'ecommerce_db';
    
    // PASO 1: Eliminar la base de datos si existe
    // DROP DATABASE IF EXISTS: elimina la BD completa con todas sus tablas y datos.
    // IF EXISTS: evita error si la BD no existe (no hace nada en ese caso).
    // Los backticks `` protegen el nombre por si tiene caracteres especiales.
    console.log(`🗑️  Eliminando base de datos: ${dbName}...`);
    await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
    console.log(`✅ Base de datos eliminada\n`);
    
    // PASO 2: Crear la base de datos nueva (vacía, sin tablas)
    // CREATE DATABASE: crea una nueva BD con el mismo nombre.
    // CHARACTER SET utf8mb4: codificación que soporta emojis y caracteres especiales.
    // COLLATE utf8mb4_unicode_ci: reglas de comparación insensibles a mayúsculas/minúsculas.
    console.log(`📦 Creando base de datos: ${dbName}...`);
    await connection.query(`CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de datos '${dbName}' creada exitosamente\n`);
    
    // Cierra la conexión a MySQL para liberar recursos del servidor
    await connection.end();
    
    // Mensaje final indicando que el proceso terminó exitosamente
    // Las tablas se crearán automáticamente al iniciar el servidor (por Sequelize sync)
    console.log('🎉 ¡Proceso completado! Ahora puedes iniciar el servidor con: npm run dev\n');
    
  } catch (error) {
    // Si ocurre cualquier error (conexión fallida, permisos, etc.), lo muestra en consola
    console.error('❌ Error al resetear la base de datos:', error.message);
    // Termina el proceso con código 1 (indica que hubo un error)
    process.exit(1);
  }
};

// Ejecuta la función inmediatamente cuando se corre este archivo
// con: node config/resetDatabase.js (o npm run reset-db)
resetDatabase();
