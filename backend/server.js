/**
 * SERVIDOR PRINCIPAL DEL BACKEND
 * este archivo principal del backend
 * condiguracion express.middleware, rutas y conexionde la base de datos
 */

// IMPORTACIONES 

// Importar express para crear servidor 
const express = require ( 'express');

// Importar cors para permitir solisitudes desde el fronend
const cors = require ( 'cors');

// Importar path para manejar rutas de archivos
const path = require ( 'path');

// importar dotenv para manejar variables del entorno 
require ('dotenv').config();

// Importar configuracion de la base de datos 
const { testConnection, syncDatabase, sequelize } = require ('./config/database');

// Importar modelos y asociaciones 
const {initAssociations} = require ('./models');

// Importar seeders (opcional en este entorno)
/** 
let runSeeders = null;
try {
    ({ runSeeders } = require('./seeders/adminSeeder'));
} catch (error) {
    console.warn('⚠️ Seeders no disponibles, se omite carga inicial de datos');
}
    */

// crear aplicaciones express 

const app = express ();

// Obtener el puerto desde las variables de entorno 
const PORT = process.env.PORT || 5000;

//MIDDLEWARES GLOBALES

// cors permiten peticiones desde el fronend
//configurar que los dominios pueden hacer peticiones al backend

app.use (cors ({
    origin:process.env.FRONDEND_URL || 'http://localhost:3000', ///url del frontend
    credentials: true, // permitir enviar cookies 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], //metodos permitidos
    allowedHeaders:['Content-Type', 'Authorization'], // encabezados permitidos
}));

/**
 * express.json() - parse el body de las peticiones en fomaro JSON
 */

app.use(express.json());

/**
 * express.urlencoded() - parse el body de los formularios
 * las imagenes estaran disponibles
 */

app.use(express.urlencoded({extended: true}));

/**
 * servir archivos estaticos iamgenes desdde la capeta raiz
 */

app.use('/uploads', express.static(path.join(__dirname, 'UPLOADS')));

// middleware para logging de peticiones 
// muestra en consola las peticiones que llega el servidor 

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`ok ${req.method} ${req.path}`);
        next();
    });
}

// rutas 

// rutas raiz verificar que el servidor esta corriendo 

app.get('/', (req, res) =>{
    res.json({
        success: true,
        message: 'servidor E-commerce Backend esta corrriendo',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

//rutas de salud verificar que  el servidor como esta

app.get('/api/health', (req, res) =>{
    res.json({
        success: true,
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
    });
});

// rutas api 


// rutas de autenticacion
// incluye registro login, perfil

const authRoutes = require ('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Rutas del administrador 
// requiren autenticacion y rol de administrador 
const adminRoutes = require ('./routes/admin.routes');
app.use('/api/admin', adminRoutes);
 
// Rutas de profesionales
// se montan en /api/profesional
const profesionalRoutes = require('./routes/Profesional.routes');
app.use('/api/profesional', profesionalRoutes);

// Alias para citas de profesional en /api/citas
const { verificarAuth } = require('./middleware/auth');
const { esProfesional } = require('./middleware/checkRole');
const citaController = require('./controllers/cita.controller');
const profesionalController = require('./controllers/profesional.controller');
app.get('/api/citas', verificarAuth, esProfesional, citaController.getCitasProfesional);
app.put('/api/citas/:id/estado', verificarAuth, esProfesional, citaController.actualizarEstadoCita);

// Alias para perfil de profesional en /api/perfil
app.get('/api/perfil', verificarAuth, esProfesional, profesionalController.getMiPerfilProfesional);
app.put('/api/perfil', verificarAuth, esProfesional, profesionalController.actualizarMiPerfil);

// Alias para especialidades de profesional en /api/mis-especialidades
app.get('/api/mis-especialidades', verificarAuth, esProfesional, profesionalController.getMisEspecialidades);
app.post('/api/mis-especialidades', verificarAuth, esProfesional, profesionalController.agregarEspecialidad);
app.delete('/api/mis-especialidades/:especialidadId', verificarAuth, esProfesional, profesionalController.removerEspecialidad);

// rutas clientes
// incluye 
const clientRoutes = require ('./routes/cliente.routes');
app.use('/api', clientRoutes);

//Manejo de rutas no encontradas (404)
app.use((req,res, next) =>{
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

//Manejo de errores globales

app.use((err, req, res, next) =>{
    console.error ('Error:', err.message);
    // Error de multer subida de archivos
    if(err.name === 'MulterError'){
        return res.status(400).json({
            success: false,
            message: 'Error al subir archivo'
        })
    }

    //otros errores
    res.status(500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && {stack : err.stack})
    });
});

// inicalizacion servidor y base de datos

/**
 * funcion principal para iniciar el servidor
 * prueba la conexion mxysql
 * sincroniza los modelos (crea tablas)
 * inicar el servidor express
 */

const starServer = async () =>{
    try{
        //paso  1 comprabar la conexion a MYSQL
        console.log('Conectando a MYSQL...');
        const dbConnected = await testConnection();
        if (!dbConnected){
            console.error('No se puedo conectar a MYSQL verificar XXAMPP y el archivo .env');
            process.exit(1); // salir si no hay conexion
         }
         // paso 2 sincronizar  modelos ( crear tablas)
         console.log ('sincronizar modelos con la base de datos...');


         //Inicializar asociaciones entre modelos
            initAssociations();
         
        // en desarrollo alter puede ser true para actualizar la estructura
        // en pruebas forzar la recreación para mantener el esquema actualizado
        // (Jest establece JEST_WORKER_ID, y a veces NODE_ENV viene de .env)
        // en produccion debe ser false para no perder los datos
        const forceSync = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
        // En local suele venir NODE_ENV indefinido; tratamos eso como modo desarrollo.
        const isProduction = process.env.NODE_ENV === 'production';
        const alterTables = !isProduction;
        const dbSynced = await syncDatabase(forceSync, alterTables);

        if(!dbSynced){
            console.error('X error al sincronizar la base de datos');
            process.exit(1);
        }

        // paso 3 ejecutar seeders solo bajo demanda explicita
        /** 
        const runSeedersOnStart = process.env.RUN_SEEDERS_ON_START === 'true';
        if (runSeedersOnStart && typeof runSeeders === 'function') {
            await runSeeders();
        }
            */

        //paso 4 iniciar el servidor express (no en tests)
        if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
            app.listen(PORT,() => {
                console.log('\n ___________________________');
                console.log(`Servidor corriendo en el puerto ${PORT}`);
                console.log(`URL: http://localhost:${PORT}`);
                console.log(`base datos ${process.env.DB_NAME}`);
                console.log(`Modo: ${process.env.NODE_ENV}`);
                console.log(`Servidor listo para peticiones`)
            });
        }

    }catch (error){
        console.error('X Error fatal al inicar el sercidor:', error.message);
        process.exit(1);
    }
};

//manejo del cierre 
//captura el ctrl + c para cerrar el sevidor correctamente

process.on('SIGINT', () =>{
    console.log('\n \nCerrando el servidor...');
    process.exit(0);
});

//capturar errores no manejados
process.on('unhandledRejection', (err) =>{
    console.error('X Error no manejado:', err.message);
    process.exit(1);
});

// iniciar el servidor y sincronizar la base de datos (en tests no se levanta el listener)
app.ready = starServer();

// exportar el app para testing
module.exports = app;