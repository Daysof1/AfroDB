/**
 * ============================================
 * SEEDER COMPLETO - DATOS DE PRUEBA
 * ============================================
 * Script para poblar la base de datos con datos de prueba completos
 * 
 * Crea:
 * - 1 Administrador
 * - 1 Auxiliar
 * - 5 Clientes
 * - 5 Categorías
 * - 15 Subcategorías (3 por categoría)
 * - 75 Productos (5 por subcategoría)
 */

const Usuario = require('../models/Usuario');
const fs = require('fs').promises;
const path = require('path');

/**
 * Función principal del seeder
 */
const seedDatosCompletos = async () => {
  try {
    console.log('\n🌱 ========================================');
    console.log('   INICIANDO SEEDER DE DATOS COMPLETOS');
    console.log('========================================\n');

    // ==========================================
    // 1. CREAR USUARIOS
    // ==========================================
    console.log('👥 1. CREANDO USUARIOS...\n');

    // ADMINISTRADOR
    const adminExistente = await Usuario.findOne({ where: { email: 'admin@afrodb.com' } });
    if (!adminExistente) {
      await Usuario.create({
        tipo_documento: 'C.C.',
        documento: '1234567890',
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@afrodb.com',
        password: 'admin1234',
        rol: 'administrador',
        telefono: '3001234567',
        direccion: 'SENA - Oficina Principal',
        activo: true
      });
      console.log('✅ Administrador creado');
      console.log('   📧 Usuario: admin@afrodb.com');
      console.log('   🔑 Password: admin1234\n');
    } else {
      console.log('✅ Administrador ya existe\n');
    }

    // AUXILIAR
    const auxiliarExistente = await Usuario.findOne({ where: { email: 'auxiliar@afrodb.com' } });
    if (!auxiliarExistente) {
      await Usuario.create({
        tipo_documento: 'C.C.',
        documento: '0987654321',
        nombre: 'Auxiliar',
        apellido: 'Soporte',
        email: 'auxiliar@afrodb.com',
        password: 'aux123',
        rol: 'auxiliar',
        telefono: '3009876543',
        direccion: 'SENA - Oficina Auxiliar',
        activo: true
      });
      console.log('✅ Auxiliar creado');
      console.log('   📧 Usuario: auxiliar@afrodb.com');
      console.log('   🔑 Password: aux123\n');
    } else {
      console.log('✅ Auxiliar ya existe\n');
    }

    // CLIENTES (5)
    console.log('👤 Creando 5 clientes...');
    for (let i = 1; i <= 5; i++) {
      const clienteExistente = await Usuario.findOne({ where: { email: `cliente${i}@afrodb.com` } });
      if (!clienteExistente) {
        await Usuario.create({
          tipo_documento: 'C.C.',
          documento: `100000000${i}`,
          nombre: `Cliente ${i}`,
          apellido: `Apellido ${i}`,
          email: `cliente${i}@afrodb.com`,
          password: `cliente${i}`,
          rol: 'cliente',
          telefono: `300${1000000 + i}`,
          direccion: `Dirección del Cliente ${i}, Bogotá`,
          activo: true
        });
        console.log(`   ✅ Cliente ${i} - Email: cliente${i}@afrodb.com - Pass: cliente${i}`);
      }
    }
    
    const usuariosCreados = await Usuario.count();
    console.log(`\n✅ Total: ${usuariosCreados} usuarios en la base de datos\n`);

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n🎉 ========================================');
    console.log('   SEEDER COMPLETADO EXITOSAMENTE');
    console.log('========================================\n');

    const totalUsuarios = await Usuario.count();


    console.log('📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${totalUsuarios}`);


    console.log('🔑 CREDENCIALES DE ACCESO:\n');
    console.log('   👨‍💼 ADMINISTRADOR');
    console.log('      Email: admin@afrodb.com');
    console.log('      Password: admin1234\n');
    console.log('   👤 AUXILIAR');
    console.log('      Email: auxiliar@afrodb.com');
    console.log('      Password: aux123\n');
    console.log('   🛍️  CLIENTES (5)');
    console.log('      Email: cliente1@afrodb.com - Password: cliente1');
    console.log('      Email: cliente2@afrodb.com - Password: cliente2');
    console.log('      Email: cliente3@afrodb.com - Password: cliente3');
    console.log('      Email: cliente4@afrodb.com - Password: cliente4');
    console.log('      Email: cliente5@afrodb.com - Password: cliente5\n');

    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Error en el seeder:', error.message);
    console.error(error);
    throw error;
  }
};

module.exports = { seedDatosCompletos };
