/**
 * ============================================
 * SEEDER DE ADMINISTRADOR
 * ============================================
 * Crea un usuario administrador por defecto para pruebas.
 * Este seeder se ejecuta primero para tener un admin disponible.
 */

const Usuario = require('../models/Usuario');

const adminSeeder = async () => {
  try {
    console.log('🌱 Creando administrador por defecto...');

    // Verificar si ya existe un administrador
    const adminExistente = await Usuario.findOne({
      where: { rol: 'administrador' }
    });

    if (adminExistente) {
      console.log('✅ Administrador ya existe, saltando...');
      return adminExistente;
    }

    // Crear administrador
    const admin = await Usuario.create({
      tipo_documento: 'C.C.',
      documento: '1234567890',
      nombre: 'Administrador Sistema',
      email: 'admin@afrodb.com',
      password: 'Admin123!',
      rol: 'administrador',
      telefono: '3001234567',
      activo: true
    });

    console.log('✅ Administrador creado exitosamente:', admin.email);
    return admin;

  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    throw error;
  }
};

module.exports = adminSeeder;