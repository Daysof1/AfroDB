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

const { sequelize } = require('../config/database');

const datosCompletosSeeder = async () => {
  try {
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
        nombre: 'Administrador Sistema',
        email: 'admin@afrodb.com',
        password: 'admin1234',
        rol: 'administrador',
        telefono: '3001234567',
        activo: true
      });
      console.log('✅ Administrador creado');
    } else {
      console.log('⚠️ Administrador ya existe');
    }

    // 2. CATEGORÍAS
    console.log('\n2️⃣ Creando categorías...');
    const categoriasData = [
      { nombre: 'Belleza y Cuidado Personal', descripcion: 'Productos para el cuidado de la piel, cabello y belleza general', tipo: 'producto' },
      { nombre: 'Belleza y Cuidado Personal - Servicios', descripcion: 'Servicios para el cuidado de la piel, cabello y belleza general', tipo: 'servicio' },
      { nombre: 'Salud y Bienestar', descripcion: 'Productos naturales, suplementos y servicios de bienestar', tipo: 'producto' },
      { nombre: 'Salud y Bienestar - Servicios', descripcion: 'Servicios naturales y terapias de bienestar', tipo: 'servicio' },
      { nombre: 'Hogar y Limpieza', descripcion: 'Productos para el hogar, limpieza y organización', tipo: 'producto' },
      { nombre: 'Alimentación', descripcion: 'Productos naturales, orgánicos y saludables', tipo: 'producto' },
      { nombre: 'Moda y Accesorios', descripcion: 'Ropa, accesorios y complementos con estilo afro', tipo: 'producto' }
    ];

    const categorias = [];
    for (const catData of categoriasData) {
      const [categoria, created] = await Categoria.findOrCreate({
        where: { nombre: catData.nombre, tipo: catData.tipo },
        defaults: catData
      });
      categorias.push(categoria);
      if (created) console.log(`✅ Categoría: ${categoria.nombre}`);
    }

    // 3. SUBCATEGORÍAS
    console.log('\n3️⃣ Creando subcategorías...');
    const subcategoriasData = [
      // Belleza producto
      { nombre: 'Cuidado del Cabello', categoriaNombre: 'Belleza y Cuidado Personal', tipo: 'producto' },
      { nombre: 'Cuidado de la Piel', categoriaNombre: 'Belleza y Cuidado Personal', tipo: 'producto' },
      { nombre: 'Maquillaje Natural', categoriaNombre: 'Belleza y Cuidado Personal', tipo: 'producto' },
      // Belleza servicio
      { nombre: 'Cuidado del Cabello', categoriaNombre: 'Belleza y Cuidado Personal - Servicios', tipo: 'servicio' },
      { nombre: 'Aceites Esenciales', categoriaNombre: 'Belleza y Cuidado Personal - Servicios', tipo: 'servicio' },
      { nombre: 'Maquillaje Natural', categoriaNombre: 'Belleza y Cuidado Personal - Servicios', tipo: 'servicio' },
      // Salud producto
      { nombre: 'Suplementos Naturales', categoriaNombre: 'Salud y Bienestar', tipo: 'producto' },
      { nombre: 'Aceites Esenciales', categoriaNombre: 'Salud y Bienestar', tipo: 'producto' },
      // Salud servicio
      { nombre: 'Suplementos Naturales', categoriaNombre: 'Salud y Bienestar - Servicios', tipo: 'servicio' },
      { nombre: 'Aceites Esenciales', categoriaNombre: 'Salud y Bienestar - Servicios', tipo: 'servicio' },
      { nombre: 'Productos de Masaje', categoriaNombre: 'Salud y Bienestar - Servicios', tipo: 'servicio' },
      // Alimentación
      { nombre: 'Alimentos Orgánicos', categoriaNombre: 'Alimentación', tipo: 'producto' },
      { nombre: 'Tés e Infusiones', categoriaNombre: 'Alimentación', tipo: 'producto' },
      // Moda
      { nombre: 'Accesorios Étnicos', categoriaNombre: 'Moda y Accesorios', tipo: 'producto' },
      { nombre: 'Bisutería Artesanal', categoriaNombre: 'Moda y Accesorios', tipo: 'producto' }
    ];

    const subcategorias = [];
    for (const subData of subcategoriasData) {
      const categoria = categorias.find(c => c.nombre === subData.categoriaNombre && c.tipo === subData.tipo);
      if (categoria) {
        const [subcategoria, created] = await Subcategoria.findOrCreate({
          where: { nombre: subData.nombre, categoriaId: categoria.id, tipo: subData.tipo },
          defaults: { nombre: subData.nombre, categoriaId: categoria.id, tipo: subData.tipo }
        });
        subcategorias.push(subcategoria);
        if (created) console.log(`✅ Subcategoría: ${subcategoria.nombre}`);
      }
    }

    // 4. ESPECIALIDADES
    console.log('\n4️⃣ Creando especialidades...');
    const especialidadesData = [
      { nombre: 'Estilista Capilar', descripcion: 'Especialista en cortes, peinados y tratamientos capilares' },
      { nombre: 'Terapeuta Natural', descripcion: 'Especialista en terapias naturales y bienestar' },
      { nombre: 'Maquilladora Profesional', descripcion: 'Especialista en maquillaje para eventos y ocasiones especiales' },
      { nombre: 'Masajista Terapéutica', descripcion: 'Especialista en masajes terapéuticos y relajantes' },
      { nombre: 'Nutricionista Natural', descripcion: 'Especialista en alimentación saludable y nutrición natural' },
      { nombre: 'Aromaterapeuta', descripcion: 'Especialista en terapias con aceites esenciales' },
      { nombre: 'Cosmetóloga Natural', descripcion: 'Especialista en cosméticos naturales y tratamientos faciales' },
      { nombre: 'Manicurista/Pedicurista', descripcion: 'Especialista en cuidado de uñas y manicura' }
    ];

    const especialidades = [];
    for (const espData of especialidadesData) {
      const [especialidad, created] = await Especialidad.scope('withInactive').findOrCreate({
        where: { nombre: espData.nombre },
        defaults: espData
      });

      // Si ya existía inactiva, se reactiva para evitar choques de unique en ejecuciones repetidas.
      if (!created && !especialidad.activo) {
        await especialidad.update({ activo: true, descripcion: espData.descripcion });
      }

      especialidades.push(especialidad);
      if (created) console.log(`✅ Especialidad: ${especialidad.nombre}`);
    }

    // 5. USUARIOS DE PRUEBA
    console.log('\n5️⃣ Creando usuarios de prueba...');
    const usuariosData = [
      // Profesionales
      { tipo_documento: 'C.C.', documento: '1111111111', nombre: 'María González', email: 'maria.profesional@afrodb.com', password: 'Profe123!', rol: 'profesional', telefono: '3012345678', activo: true },
      { tipo_documento: 'C.C.', documento: '2222222222', nombre: 'Carlos Rodríguez', email: 'carlos.profesional@afrodb.com', password: 'Profe123!', rol: 'profesional', telefono: '3023456789', activo: true },
      { tipo_documento: 'C.C.', documento: '3333333333', nombre: 'Ana López', email: 'ana.profesional@afrodb.com', password: 'Profe123!', rol: 'profesional', telefono: '3034567890', activo: true },
      // Clientes
      { tipo_documento: 'C.C.', documento: '4444444444', nombre: 'Juan Pérez', apellido: 'Cliente', email: 'cliente1@afrodb.com', password: 'cliente1', rol: 'cliente', telefono: '3045678901', activo: true },
      { tipo_documento: 'C.C.', documento: '5555555555', nombre: 'Laura Martínez', apellido: 'Cliente', email: 'laura.cliente@afrodb.com', password: 'Cliente123!', rol: 'cliente', telefono: '3056789012', activo: true },
      // Auxiliar
      { tipo_documento: 'C.C.', documento: '6666666666', nombre: 'Sofia Ramírez', apellido: 'Auxiliar', email: 'auxiliar@afrodb.com', password: 'aux123', rol: 'auxiliar', telefono: '3067890123', activo: true }
    ];

    const usuarios = [];
    for (const userData of usuariosData) {
      const [usuario, created] = await Usuario.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      usuarios.push(usuario);
      if (created) console.log(`✅ Usuario: ${usuario.nombre} (${usuario.rol})`);
    }

    const profesionalesDisponibles = usuarios.filter(u => u.rol === 'profesional');

    // 6. PRODUCTOS
    console.log('\n6️⃣ Creando productos...');
    const productosData = [
      { nombre: 'Aceite de Argán Puro', descripcion: 'Aceite natural de argán 100% puro para cabello y piel', precio: 45000, stock: 25, categoriaNombre: 'Belleza y Cuidado Personal', subcategoriaNombre: 'Cuidado del Cabello' },
      { nombre: 'Crema Hidratante Natural', descripcion: 'Crema hidratante elaborada con ingredientes naturales', precio: 35000, stock: 30, categoriaNombre: 'Belleza y Cuidado Personal', subcategoriaNombre: 'Cuidado de la Piel' },
      { nombre: 'Aceite Esencial de Lavanda', descripcion: 'Aceite esencial 100% puro para aromaterapia', precio: 25000, stock: 40, categoriaNombre: 'Salud y Bienestar', subcategoriaNombre: 'Aceites Esenciales' },
      { nombre: 'Miel Orgánica de Abejas', descripcion: 'Miel pura orgánica producida localmente', precio: 28000, stock: 35, categoriaNombre: 'Alimentación', subcategoriaNombre: 'Alimentos Orgánicos' },
      { nombre: 'Té Verde Orgánico', descripcion: 'Té verde premium de cultivos orgánicos', precio: 18000, stock: 50, categoriaNombre: 'Alimentación', subcategoriaNombre: 'Tés e Infusiones' },
      { nombre: 'Collar Étnico de Cuentas', descripcion: 'Collar artesanal con cuentas de colores africanos', precio: 35000, stock: 12, categoriaNombre: 'Moda y Accesorios', subcategoriaNombre: 'Accesorios Étnicos' }
    ];

    for (const prodData of productosData) {
      const categoria = categorias.find(c => c.nombre === prodData.categoriaNombre && c.tipo === 'producto');
      const subcategoria = subcategorias.find(s => s.nombre === prodData.subcategoriaNombre && s.categoriaId === categoria?.id && s.tipo === 'producto');

      if (categoria && subcategoria) {
        const [producto, created] = await Producto.findOrCreate({
          where: { nombre: prodData.nombre },
          defaults: {
            nombre: prodData.nombre,
            descripcion: prodData.descripcion,
            precio: prodData.precio,
            stock: prodData.stock,
            categoriaId: categoria.id,
            subcategoriaId: subcategoria.id
          }
        });
        if (created) console.log(`✅ Producto: ${producto.nombre} - $${producto.precio}`);
      }
    }

    // 7. SERVICIOS
    console.log('\n7️⃣ Creando servicios...');
    const serviciosData = [
      { nombre: 'Corte y Peinado Afro', descripcion: 'Corte especializado para cabello afro con técnicas profesionales', precio: 45000, duracion: 90, categoriaNombre: 'Belleza y Cuidado Personal - Servicios', subcategoriaNombre: 'Cuidado del Cabello' },
      { nombre: 'Maquillaje para Eventos', descripcion: 'Maquillaje profesional para bodas, fiestas y ocasiones especiales', precio: 55000, duracion: 75, categoriaNombre: 'Belleza y Cuidado Personal - Servicios', subcategoriaNombre: 'Maquillaje Natural' },
      { nombre: 'Masaje Terapéutico Completo', descripcion: 'Masaje relajante con técnicas terapéuticas para todo el cuerpo', precio: 65000, duracion: 90, categoriaNombre: 'Salud y Bienestar - Servicios', subcategoriaNombre: 'Productos de Masaje' },
      { nombre: 'Sesión de Aromaterapia', descripcion: 'Terapia con aceites esenciales para relajación y bienestar', precio: 40000, duracion: 60, categoriaNombre: 'Salud y Bienestar - Servicios', subcategoriaNombre: 'Aceites Esenciales' },
      { nombre: 'Consulta Nutricional', descripcion: 'Asesoría nutricional personalizada con enfoque natural', precio: 50000, duracion: 45, categoriaNombre: 'Salud y Bienestar - Servicios', subcategoriaNombre: 'Suplementos Naturales' }
    ];

    for (const [index, servData] of serviciosData.entries()) {
      const categoria = categorias.find(c => c.nombre === servData.categoriaNombre && c.tipo === 'servicio');
      const subcategoria = subcategorias.find(s => s.nombre === servData.subcategoriaNombre && s.categoriaId === categoria?.id && s.tipo === 'servicio');
      const profesional = profesionalesDisponibles[index % profesionalesDisponibles.length];

      if (categoria && subcategoria && profesional) {
        const [servicio, created] = await Servicio.findOrCreate({
          where: { nombre: servData.nombre },
          defaults: {
            nombre: servData.nombre,
            descripcion: servData.descripcion,
            precio: servData.precio,
            duracion: servData.duracion,
            categoriaId: categoria.id,
            subcategoriaId: subcategoria.id,
            profesionalId: profesional.id
          }
        });
        if (created) console.log(`✅ Servicio: ${servicio.nombre} - $${servicio.precio} (Profesional: ${profesional.nombre})`);
      }
    }

    // 8. ASIGNACIONES PROFESIONAL-ESPECIALIDAD
    console.log('\n8️⃣ Asignando especialidades a profesionales...');
    const asignaciones = [
      { emailProfesional: 'maria.profesional@afrodb.com', especialidadesNombres: ['Estilista Capilar', 'Maquilladora Profesional'] },
      { emailProfesional: 'carlos.profesional@afrodb.com', especialidadesNombres: ['Terapeuta Natural', 'Masajista Terapéutica', 'Aromaterapeuta'] },
      { emailProfesional: 'ana.profesional@afrodb.com', especialidadesNombres: ['Nutricionista Natural', 'Cosmetóloga Natural'] }
    ];

    for (const asignacion of asignaciones) {
      const profesional = usuarios.find(u => u.email === asignacion.emailProfesional && u.rol === 'profesional');
      if (profesional) {
        const especialidadesProfesional = especialidades.filter(e =>
          asignacion.especialidadesNombres.includes(e.nombre)
        );

        if (especialidadesProfesional.length > 0) {
          await profesional.setEspecialidades(especialidadesProfesional.map(e => e.id));
          console.log(`✅ Especialidades asignadas a ${profesional.nombre}: ${especialidadesProfesional.map(e => e.nombre).join(', ')}`);
        }
      }
    }

    // Reactivar restricciones
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n🎉 ¡Seeders completados exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log('• 1 Administrador');
    console.log('• 5 Categorías');
    console.log('• 10 Subcategorías');
    console.log('• 8 Especialidades');
    console.log('• 6 Usuarios de prueba');
    console.log('• 6 Productos');
    console.log('• 5 Servicios');
    console.log('• 7 Asignaciones profesional-especialidad');

    console.log('\n🔐 Credenciales de acceso:');
    console.log('Admin: admin@afrodb.com / Admin123!');
    console.log('Profesional: maria.profesional@afrodb.com / Profe123!');
    console.log('Cliente: juan.cliente@afrodb.com / Cliente123!');
    console.log('Auxiliar: sofia.auxiliar@afrodb.com / Auxiliar123!');

  } catch (error) {
    console.error('\n❌ Error ejecutando seeders:', error);

    // Reactivar restricciones en caso de error
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (fkError) {
      console.error('Error reactivando FK checks:', fkError);
    }

    throw error;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  datosCompletosSeeder()
    .then(() => {
      console.log('\n✅ Proceso completado exitosamente.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = datosCompletosSeeder;