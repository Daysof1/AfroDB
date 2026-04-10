/**
 * ============================================
 * CONFIGURACIÓN DE LA BASE DE DATOS
 * ============================================
 * Este archivo configura la conexión con MySQL usando Sequelize ORM.
 * Sequelize es un ORM (Object-Relational Mapping) que permite trabajar
 * con la base de datos usando objetos JavaScript en lugar de escribir SQL puro.
 * Este archivo es importado por los modelos (carpeta models/) y por server.js.
 */

// Importa la clase Sequelize del paquete 'sequelize' (instalado en node_modules).
// Usa desestructuración { Sequelize } para extraer solo la clase principal del módulo.
// Sequelize es el ORM que traduce código JavaScript a consultas SQL automáticamente.
const { Sequelize } = require('sequelize');

// Importa y ejecuta dotenv para cargar las variables del archivo .env
// en el objeto global process.env, haciéndolas accesibles en todo el archivo.
require('dotenv').config();

/**
 * Crea una nueva instancia de Sequelize (la conexión a la base de datos).
 * Recibe 4 parámetros: nombre BD, usuario, contraseña, y objeto de configuración.
 * Esta instancia se reutiliza en toda la aplicación para interactuar con la BD.
 */
const sequelize = new Sequelize(
  // Primer parámetro: nombre de la base de datos, leído de .env (variable DB_NAME)
  process.env.DB_NAME,
  // Segundo parámetro: usuario de MySQL, leído de .env (variable DB_USER)
  process.env.DB_USER,
  // Tercer parámetro: contraseña de MySQL, leído de .env (variable DB_PASSWORD)
  process.env.DB_PASSWORD,
  {
    // host: dirección del servidor MySQL, leído de .env (variable DB_HOST)
    // Normalmente es 'localhost' en desarrollo con XAMPP
    host: process.env.DB_HOST,
    // port: puerto de MySQL, leído de .env (variable DB_PORT)
    // El puerto estándar de MySQL es 3306
    port: process.env.DB_PORT,
    // dialect: indica a Sequelize qué tipo de base de datos usamos
    // Opciones posibles: 'mysql', 'postgres', 'sqlite', 'mariadb', 'mssql'
    dialect: 'mysql',
    
    // pool: configuración del pool (grupo) de conexiones.
    // El pool mantiene varias conexiones abiertas y las reutiliza,
    // evitando abrir y cerrar conexiones constantemente (mejora rendimiento).
    pool: {
      // max: máximo 5 conexiones simultáneas abiertas al mismo tiempo
      max: 5,
      // min: mínimo 0 conexiones (se crean bajo demanda)
      min: 0,
      // acquire: tiempo máximo en milisegundos (30s) para intentar obtener una conexión
      // Si tarda más de 30s, lanza un error de timeout
      acquire: 30000,
      // idle: tiempo máximo en milisegundos (10s) que una conexión puede estar sin usarse
      // Si pasa más de 10s inactiva, se cierra para liberar recursos
      idle: 10000
    },
    
    // logging: controla si se muestran las consultas SQL en la consola.
    // Si NODE_ENV (variable de .env) es 'development', muestra las queries con console.log
    // En cualquier otro entorno (producción, testing), no muestra nada (false)
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // timezone: zona horaria para las fechas almacenadas en la BD.
    // '-05:00' corresponde a la zona horaria de Colombia (UTC-5)
    timezone: '-05:00',
    
    // define: opciones que se aplican a TODOS los modelos por defecto
    define: {
      // timestamps: true hace que Sequelize agregue automáticamente
      // las columnas 'createdAt' y 'updatedAt' a cada tabla
      timestamps: true,
      
      // underscored: false significa que los nombres de columnas usan camelCase
      // Ejemplo: createdAt (false/camelCase) vs created_at (true/snake_case)
      underscored: false,
      
      // freezeTableName: true usa el nombre exacto del modelo como nombre de tabla.
      // Sin esto, Sequelize pluraliza automáticamente (Usuario -> Usuarios)
      // Con true: modelo 'Usuario' crea tabla 'Usuario' (sin pluralizar)
      freezeTableName: true
    }
  }
);

/**
 * Función para probar si la conexión a la base de datos funciona.
 * Se llama desde server.js al iniciar el servidor.
 * Retorna true si la conexión es exitosa, false si falla.
 */
const testConnection = async () => {
  try {
    // authenticate() intenta conectarse a la BD con las credenciales configuradas.
    // Si falla, lanza un error que se captura en el catch.
    await sequelize.authenticate();
    // Si llega aquí, la conexión fue exitosa
    console.log('✅ Conexión a MySQL establecida correctamente.');
    return true;
  } catch (error) {
    // Si la conexión falla, muestra el error y sugerencias
    console.error('❌ Error al conectar con MySQL:', error.message);
    console.error('📋 Verifica que XAMPP esté corriendo y las credenciales en .env sean correctas');
    return false;
  }
};

/**
 * Función para sincronizar los modelos de Sequelize con las tablas de la BD.
 * "Sincronizar" significa crear o modificar las tablas para que coincidan
 * con la estructura definida en los modelos (carpeta models/).
 * Se llama desde server.js al iniciar el servidor.
 * 
 * @param {boolean} force - Si es true, ELIMINA y recrea todas las tablas (pierde datos)
 * @param {boolean} alter - Si es true, modifica las tablas existentes sin perder datos
 */
const syncDatabase = async (force = false, alter = false) => {
  try {
    // sync() compara los modelos con las tablas en la BD y las ajusta.
    // { force: true } = DROP TABLE + CREATE TABLE (borra todo)
    // { alter: true } = ALTER TABLE (modifica columnas sin borrar datos)
    // { } (sin opciones) = CREATE TABLE IF NOT EXISTS (solo crea si no existe)
    await sequelize.sync({ force, alter });
    
    // Muestra mensaje según el tipo de sincronización realizada
    if (force) {
      console.log('🔄 Base de datos sincronizada (todas las tablas recreadas).');
    } else if (alter) {
      console.log('🔄 Base de datos sincronizada (tablas alteradas según modelos).');
    } else {
      console.log('✅ Base de datos sincronizada correctamente.');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error al sincronizar la base de datos:', error.message);
    return false;
  }
};

// Exporta la instancia de Sequelize y las funciones para que otros archivos las importen.
// Ejemplo de uso en otro archivo: const { sequelize, testConnection } = require('./config/database');
module.exports = {
  sequelize,        // La instancia de conexión, usada por los modelos para definir tablas
  testConnection,   // Función para verificar la conexión, usada en server.js
  syncDatabase      // Función para sincronizar modelos con la BD, usada en server.js
};
