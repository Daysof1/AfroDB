/**
 * ============================================
 * SEEDER PRINCIPAL - DATOS COMPLETOS
 * ============================================
 * Ejecuta todos los seeders en el orden correcto para crear
 * datos de prueba completos para testing.
 *
 * Incluye:
 * - Administrador
 * - Categorías y subcategorías
 * - Especialidades
 * - Usuarios de prueba (profesionales, clientes, auxiliar)
 * - Productos
 * - Servicios
 * - Asignaciones profesional-especialidad
 */

const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const Especialidad = require('../models/Especialidades');
const Producto = require('../models/Producto');
const Servicio = require('../models/Servicio');
const ProfesionalEspecialidad = require('../models/ProfesionalEspecialidad');
const { Op } = require('sequelize');
const { initAssociations } = require('../models');

const { sequelize } = require('../config/database');

const datosCompletosSeeder = async () => {
  try {
    initAssociations();
    console.log('🚀 Iniciando seeders completos para testing...\n');

    // Desactivar restricciones de claves foráneas temporalmente
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    console.log('📋 Creando datos base...\n');

    // 1. ADMINISTRADOR
    console.log('1️⃣ Creando administrador...');
    const adminExistente = await Usuario.findOne({ where: { rol: 'administrador' } });
    if (!adminExistente) {
      await Usuario.create({
        tipo_documento: 'C.C.',
        documento: '1234567890',
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@afrodb.com',
        password: 'Admin123!',
        rol: 'administrador',
        telefono: '3001234567',
        activo: true
      });
      console.log('✅ Administrador creado');
    } else {
      await adminExistente.update({
        tipo_documento: 'C.C.',
        documento: adminExistente.documento || '1234567890',
        nombre: 'Administrador',
        apellido: adminExistente.apellido || 'Sistema',
        email: 'admin@afrodb.com',
        password: 'Admin123!',
        telefono: adminExistente.telefono || '3001234567',
        activo: true
      });
      console.log('⚠️ Administrador ya existe');
    }


    // 5. USUARIOS DE PRUEBA
    console.log('\n5️⃣ Creando usuarios de prueba...');
    const usuariosData = [
      // Profesionales
      { tipo_documento: 'C.C.', documento: '1111111111', nombre: 'María', apellido: 'González', email: 'maria.profesional@afrodb.com', password: 'Profe123!', rol: 'profesional', telefono: '3012345678', activo: true },
      { tipo_documento: 'C.C.', documento: '2222222222', nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos.profesional@afrodb.com', password: 'Profe123!', rol: 'profesional', telefono: '3023456789', activo: true },
      { tipo_documento: 'C.C.', documento: '3333333333', nombre: 'Ana', apellido: 'López', email: 'ana.profesional@afrodb.com', password: 'Profe123!', rol: 'profesional', telefono: '3034567890', activo: true },
      // Clientes
      { tipo_documento: 'C.C.', documento: '4444444444', nombre: 'Juan', apellido: 'Pérez', email: 'juan.cliente@afrodb.com', password: 'Cliente123!', rol: 'cliente', telefono: '3045678901', activo: true, legacyEmails: ['cliente1@afrodb.com'] },
      { tipo_documento: 'C.C.', documento: '5555555555', nombre: 'Laura Martínez', apellido: 'Cliente', email: 'laura.cliente@afrodb.com', password: 'Cliente123!', rol: 'cliente', telefono: '3056789012', activo: true },
      // Auxiliar
      { tipo_documento: 'C.C.', documento: '6666666666', nombre: 'Sofia', apellido: 'Ramírez', email: 'sofia.auxiliar@afrodb.com', password: 'Auxiliar123!', rol: 'auxiliar', telefono: '3067890123', activo: true, legacyEmails: ['auxiliar@afrodb.com'] }
    ];

    const usuarios = [];
    for (const userData of usuariosData) {
      const emailsCandidatos = [userData.email, ...(userData.legacyEmails || [])];
      const usuarioExistente = await Usuario.findOne({
        where: {
          email: {
            [Op.in]: emailsCandidatos
          }
        }
      });

      const payload = {
        tipo_documento: userData.tipo_documento,
        documento: userData.documento,
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        password: userData.password,
        rol: userData.rol,
        telefono: userData.telefono,
        activo: userData.activo
      };

      let usuario = usuarioExistente;
      let created = false;

      if (usuario) {
        await usuario.update(payload);
      } else {
        usuario = await Usuario.create(payload);
        created = true;
      }

      usuarios.push(usuario);
      if (created) console.log(`✅ Usuario: ${usuario.nombre} (${usuario.rol})`);
    }

    const profesionalesDisponibles = usuarios.filter(u => u.rol === 'profesional');
  } catch (error) {
    console.error('❌ Error en el seeder de datos completos:', error);
  }
};
