/**
 * ============================================
 * SEEDER COMPLETO - DATOS DE PRUEBA
 * ============================================
 * Script para poblar la base de datos con datos de prueba base.
 * Es idempotente: puede ejecutarse varias veces sin duplicar datos.
 *
 * Crea/reactiva:
 * - 1 Administrador
 * - 1 Auxiliar
 * - 5 Clientes
 * - Profesionales base
 * - Especialidades requeridas por subcategorías de tipo servicio
 * - Asignaciones profesional-especialidad con cobertura redundante
 */

const Usuario = require('../models/Usuario');
const Subcategoria = require('../models/Subcategoria');
const Especialidad = require('../models/Especialidades');
const ProfesionalEspecialidad = require('../models/ProfesionalEspecialidad');

const normalizarTexto = (texto = '') =>
  String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const PROFESIONALES_BASE = [
  {
    tipo_documento: 'C.C.',
    documento: '2000000001',
    nombre: 'Maria',
    apellido: 'Gonzalez',
    email: 'maria.profesional@afrodb.com',
    password: 'profe123',
    rol: 'profesional',
    telefono: '3011000001',
    direccion: 'Sede Norte',
    activo: true
  },
  {
    tipo_documento: 'C.C.',
    documento: '2000000002',
    nombre: 'Carlos',
    apellido: 'Rodriguez',
    email: 'carlos.profesional@afrodb.com',
    password: 'profe123',
    rol: 'profesional',
    telefono: '3011000002',
    direccion: 'Sede Norte',
    activo: true
  },
  {
    tipo_documento: 'C.C.',
    documento: '2000000003',
    nombre: 'Ana',
    apellido: 'Lopez',
    email: 'ana.profesional@afrodb.com',
    password: 'profe123',
    rol: 'profesional',
    telefono: '3011000003',
    direccion: 'Sede Centro',
    activo: true
  },
  {
    tipo_documento: 'C.C.',
    documento: '2000000004',
    nombre: 'Juan',
    apellido: 'Ramirez',
    email: 'juan.profesional@afrodb.com',
    password: 'profe123',
    rol: 'profesional',
    telefono: '3011000004',
    direccion: 'Sede Centro',
    activo: true
  },
  {
    tipo_documento: 'C.C.',
    documento: '2000000005',
    nombre: 'Laura',
    apellido: 'Martinez',
    email: 'laura.profesional@afrodb.com',
    password: 'profe123',
    rol: 'profesional',
    telefono: '3011000005',
    direccion: 'Sede Sur',
    activo: true
  },
  {
    tipo_documento: 'C.C.',
    documento: '2000000006',
    nombre: 'Sofia',
    apellido: 'Castro',
    email: 'sofia.profesional@afrodb.com',
    password: 'profe123',
    rol: 'profesional',
    telefono: '3011000006',
    direccion: 'Sede Sur',
    activo: true
  }
];

const ESPECIALIDADES_FALLBACK = [
  { nombre: 'Manicure', descripcion: 'Especialidad base de manicure' },
  { nombre: 'Pedicure', descripcion: 'Especialidad base de pedicure' },
  { nombre: 'Corte', descripcion: 'Especialidad base de corte' },
  { nombre: 'Peinados', descripcion: 'Especialidad base de peinados' },
  { nombre: 'Relajacion', descripcion: 'Especialidad base de relajacion' },
  { nombre: 'Paquetes', descripcion: 'Especialidad base de paquetes' }
];

const getEspecialidadesRequeridas = async () => {
  const subcategoriasServicio = await Subcategoria.findAll({
    where: { tipo: 'servicio', activo: true },
    attributes: ['nombre', 'descripcion'],
    order: [['nombre', 'ASC']]
  });

  const requeridasMap = new Map();

  for (const sub of subcategoriasServicio) {
    const nombre = (sub.nombre || '').trim();
    if (!nombre) continue;

    const key = normalizarTexto(nombre);
    if (!key || requeridasMap.has(key)) continue;

    requeridasMap.set(key, {
      nombre,
      descripcion: sub.descripcion || `Especialidad para ${nombre}`
    });
  }

  if (requeridasMap.size === 0) {
    for (const especialidadFallback of ESPECIALIDADES_FALLBACK) {
      requeridasMap.set(normalizarTexto(especialidadFallback.nombre), especialidadFallback);
    }
  }

  return Array.from(requeridasMap.entries());
};

const syncEspecialidades = async (especialidadesRequeridas) => {
  const especialesExistentes = await Especialidad.scope('withInactive').findAll();
  const existentesMap = new Map(
    especialesExistentes.map((esp) => [normalizarTexto(esp.nombre), esp])
  );

  const especialidadesFinales = [];

  for (const [key, requerida] of especialidadesRequeridas) {
    const existente = existentesMap.get(key);

    if (!existente) {
      const creada = await Especialidad.create({
        nombre: requerida.nombre,
        descripcion: requerida.descripcion,
        activo: true
      });
      especialidadesFinales.push(creada);
      continue;
    }

    if (!existente.activo) {
      existente.activo = true;
      if (!existente.descripcion && requerida.descripcion) {
        existente.descripcion = requerida.descripcion;
      }
      await existente.save();
    }

    especialidadesFinales.push(existente);
  }

  return especialidadesFinales;
};

const createOrReactivateProfesionales = async () => {
  const profesionales = [];

  for (const profesionalData of PROFESIONALES_BASE) {
    const existente = await Usuario.scope('withPassword').findOne({
      where: { email: profesionalData.email }
    });

    if (!existente) {
      const creado = await Usuario.create(profesionalData);
      profesionales.push(creado);
      console.log(`   ✅ Profesional creado: ${profesionalData.email}`);
      continue;
    }

    const requiereActualizacion = !existente.activo || existente.rol !== 'profesional';
    if (requiereActualizacion) {
      existente.activo = true;
      existente.rol = 'profesional';
      await existente.save();
    }

    profesionales.push(existente);
    console.log(`   ✅ Profesional verificado: ${profesionalData.email}`);
  }

  return profesionales;
};

const asignarEspecialidadesAProfesionales = async (profesionales, especialidades) => {
  if (!profesionales.length || !especialidades.length) {
    return { creadas: 0, verificadas: 0 };
  }

  let creadas = 0;
  let verificadas = 0;

  for (let i = 0; i < especialidades.length; i += 1) {
    const especialidad = especialidades[i];

    // Cobertura redundante: cada especialidad queda asignada a 2 profesionales.
    const profA = profesionales[i % profesionales.length];
    const profB = profesionales[(i + 1) % profesionales.length];
    const objetivos = [profA, profB];

    for (const profesional of objetivos) {
      const [registro, created] = await ProfesionalEspecialidad.findOrCreate({
        where: {
          usuarioId: profesional.id,
          especialidadId: especialidad.id
        },
        defaults: {
          usuarioId: profesional.id,
          especialidadId: especialidad.id
        }
      });

      if (created || registro) {
        if (created) {
          creadas += 1;
        } else {
          verificadas += 1;
        }
      }
    }
  }

  return { creadas, verificadas };
};

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
    // 2. CREAR/REACTIVAR PROFESIONALES
    // ==========================================
    console.log('🧑‍🔧 2. CREANDO PROFESIONALES...\n');

    const profesionales = await createOrReactivateProfesionales();
    console.log(`\n✅ Profesionales verificados: ${profesionales.length}\n`);

    // ==========================================
    // 3. CREAR/REACTIVAR ESPECIALIDADES REQUERIDAS
    // ==========================================
    console.log('🧠 3. SINCRONIZANDO ESPECIALIDADES REQUERIDAS...\n');

    const especialidadesRequeridas = await getEspecialidadesRequeridas();
    const especialidadesFinales = await syncEspecialidades(especialidadesRequeridas);

    console.log(`✅ Especialidades requeridas sincronizadas: ${especialidadesFinales.length}\n`);

    // ==========================================
    // 4. ASIGNAR ESPECIALIDADES A PROFESIONALES
    // ==========================================
    console.log('🧩 4. ASIGNANDO ESPECIALIDADES A PROFESIONALES...\n');

    const asignaciones = await asignarEspecialidadesAProfesionales(
      profesionales,
      especialidadesFinales
    );

    console.log(`✅ Asignaciones creadas: ${asignaciones.creadas}`);
    console.log(`✅ Asignaciones ya existentes: ${asignaciones.verificadas}\n`);

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n🎉 ========================================');
    console.log('   SEEDER COMPLETADO EXITOSAMENTE');
    console.log('========================================\n');

    const totalUsuarios = await Usuario.count();
    const totalProfesionales = await Usuario.count({ where: { rol: 'profesional', activo: true } });
    const totalEspecialidades = await Especialidad.count({ where: { activo: true } });
    const totalAsignaciones = await ProfesionalEspecialidad.count();


    console.log('📊 RESUMEN:');
    console.log(`   👥 Usuarios: ${totalUsuarios}`);
    console.log(`   🧑‍🔧 Profesionales activos: ${totalProfesionales}`);
    console.log(`   🧠 Especialidades activas: ${totalEspecialidades}`);
    console.log(`   🔗 Asignaciones profesional-especialidad: ${totalAsignaciones}`);


    console.log('🔑 CREDENCIALES DE ACCESO:\n');
    console.log('   👨‍💼 ADMINISTRADOR');
    console.log('      Email: admin@afrodb.com');
    console.log('      Password: admin1234\n');
    console.log('   👤 AUXILIAR');
    console.log('      Email: auxiliar@afrodb.com');
    console.log('      Password: aux123\n');
    console.log('   🧑‍🔧 PROFESIONALES (base)');
    console.log('      Email: maria.profesional@afrodb.com - Password: profe123');
    console.log('      Email: carlos.profesional@afrodb.com - Password: profe123');
    console.log('      Email: ana.profesional@afrodb.com - Password: profe123');
    console.log('      Email: juan.profesional@afrodb.com - Password: profe123');
    console.log('      Email: laura.profesional@afrodb.com - Password: profe123');
    console.log('      Email: sofia.profesional@afrodb.com - Password: profe123\n');
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
