/**
 * ============================================
 * CONTROLADOR DE CITAS
 * ============================================
 * Gestiona el agendamiento de citas.
 * Funciones de CLIENTE: crear cita, ver mis citas, cancelar.
 * Funciones de ADMIN: ver todas, cambiar estado, estadísticas.
 */

const Cita = require('../models/Cita');
const Servicio = require('../models/Servicio');
const CitaServicio = require('../models/CitaServicio');
const Usuario = require('../models/Usuario');
const Subcategoria = require('../models/Subcategoria');
const Especialidad = require('../models/Especialidades');
const { Op } = require('sequelize');

const normalizarTexto = (texto = '') =>
  String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

    const validarFechaHoraCita = (fecha, hora) => {
  if (!fecha || !hora) {
    return { valid: false, message: 'Debe indicar fecha y hora para agendar la cita' };
  }

  const fechaHoraSeleccionada = new Date(`${fecha}T${hora}`);
  if (Number.isNaN(fechaHoraSeleccionada.getTime())) {
    return { valid: false, message: 'La fecha u hora ingresada no es válida' };
  }

  const ahora = new Date();
  if (fechaHoraSeleccionada <= ahora) {
    return { valid: false, message: 'No se puede agendar una cita en una fecha u hora que ya pasó' };
  }

  const añoActual = ahora.getFullYear();
  const fechaSeleccionada = new Date(fecha);
  if (fechaSeleccionada.getFullYear() !== añoActual) {
    return { valid: false, message: `La cita debe agendarse en el año actual (${añoActual})` };
  }

  const [horaNum, minutoNum] = hora.split(':').map(Number);
  if (horaNum < 8 || horaNum > 20 || (horaNum === 20 && minutoNum > 0)) {
    return { valid: false, message: 'Las citas solo se pueden agendar entre las 08:00 a.m. y las 08:00 p.m.' };
  }

  return { valid: true, fechaHoraSeleccionada };
};

// ==========================================
// 📅 CREAR CITA - CLIENTE
// ==========================================

const crearCita = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();

  try {
    const { fecha, hora, servicios, profesionalId, profesionalesIds, notas } = req.body;

    // VALIDACIÓN DE FECHA Y HORA
    const fechaValid = validarFechaHoraCita(fecha, hora);
    if (!fechaValid.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: fechaValid.message });
    }

    const fechaHoraSeleccionada = new Date(`${fecha}T${hora}`);
    if (Number.isNaN(fechaHoraSeleccionada.getTime())) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'La fecha u hora ingresada no es válida'
      });
    }

    const ahora = new Date();
    if (fechaHoraSeleccionada <= ahora) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'No se puede agendar una cita en una fecha u hora que ya pasó'
      });
    }

       // VALIDACIÓN: La fecha debe corresponder al año actual
    const añoActual = ahora.getFullYear();
    const fechaSeleccionada = new Date(fecha);
    const añoFecha = fechaSeleccionada.getFullYear();
    if (añoFecha !== añoActual) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `La cita debe agendarse en el año actual (${añoActual})`
      });
    }

// VALIDACIÓN: Las citas solo se pueden agendar entre las 08:00 y las 20:00
const [horaNum, minutoNum] = hora.split(':').map(Number);

if (horaNum < 8 || horaNum > 20 || (horaNum === 20 && minutoNum > 0)) {
  await t.rollback();
  return res.status(400).json({
    success: false,
    message: 'Las citas solo se pueden agendar entre las 08:00 a.m. y las 08:00 p.m.'
  });
}

    // VALIDACIÓN 1: servicios obligatorios
    if (!servicios || servicios.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Debe seleccionar al menos un servicio'
      });
    }

    // VALIDACIÓN 2: obtener servicios
    const serviciosDB = await Servicio.findAll({
      where: { id: servicios, activo: true },
      include: [
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre']
        }
      ],
      transaction: t
    });

    if (serviciosDB.length !== servicios.length) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Uno o más servicios no son válidos'
      });
    }

    // 🔥 CALCULAR DURACIÓN Y TOTAL
    let duracionTotal = 0;
    let total = 0;

    for (const s of serviciosDB) {
      duracionTotal += s.duracion;
      total += Number.parseFloat(s.precio);
    }
    // ==========================================
    // VALIDACIÓN DE HORA DE FINALIZACIÓN
    // ==========================================
    // Verifica que la duración total de la cita
    // no haga que termine después de las 8:00 p.m.

    const inicioCita = new Date(`${fecha}T${hora}`);

    const finCita = new Date(inicioCita);
    finCita.setMinutes(
      finCita.getMinutes() + duracionTotal
    );

    const horaFin = finCita.getHours();
    const minutoFin = finCita.getMinutes();

    if (horaFin > 20 || (horaFin === 20 && minutoFin > 0)) {
      await t.rollback();

      return res.status(400).json({
        success: false,
        message:
          'La cita finaliza fuera del horario permitido (8:00 p.m.)'
      });
    }

    const nombresRequeridos = Array.from(new Set(
      serviciosDB
        .map((s) => s?.subcategoria?.nombre)
        .filter(Boolean)
    ));

    const especialidadesActivas = await Especialidad.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre'],
      transaction: t
    });

    const especialidadesPorNombre = new Map(
      especialidadesActivas.map((esp) => [normalizarTexto(esp.nombre), esp])
    );

    const especialidadesRequeridas = [];
    const sinEspecialidadConfigurada = [];

    for (const nombre of nombresRequeridos) {
      const especialidad = especialidadesPorNombre.get(normalizarTexto(nombre));
      if (!especialidad) {
        sinEspecialidadConfigurada.push(nombre);
      } else {
        especialidadesRequeridas.push(especialidad);
      }
    }

    if (sinEspecialidadConfigurada.length > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Falta configurar especialidades para: ${sinEspecialidadConfigurada.join(', ')}`
      });
    }

    // 🔥 ASIGNACIÓN DE PROFESIONALES
    // Una cita puede incluir varios servicios y cada servicio puede quedar con profesional distinto.
    const profesionalesDisponibles = await Usuario.findAll({
      where: { rol: 'profesional', activo: true },
      include: [{
        model: Especialidad,
        as: 'especialidades',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
        required: false
      }],
      transaction: t
    });

    const profesionalesPorId = new Map(
      profesionalesDisponibles.map((p) => [p.id, p])
    );

    const especialidadPorNombreNormalizado = new Map(
      especialidadesRequeridas.map((esp) => [normalizarTexto(esp.nombre), esp])
    );

    let profesionalSeleccionado = null;
    let profesionalesPreferidos = [];

    if (Array.isArray(profesionalesIds) && profesionalesIds.length > 0) {
      const idsUnicos = Array.from(new Set(profesionalesIds.map(Number).filter((id) => Number.isFinite(id) && id > 0)));

      profesionalesPreferidos = idsUnicos
        .map((id) => profesionalesPorId.get(id))
        .filter(Boolean);

      if (profesionalesPreferidos.length !== idsUnicos.length) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Uno o más profesionales seleccionados no existen o están inactivos'
        });
      }
    }

    if (profesionalId) {
      profesionalSeleccionado = profesionalesPorId.get(Number(profesionalId)) || null;

      if (!profesionalSeleccionado) {
        await t.rollback();
        return res.status(404).json({
          success: false,
          message: 'Profesional no encontrado o inactivo'
        });
      }
    }

    const serviciosAsignados = [];

    // Verifica si un `profesional` (cargado con su relación `especialidades`)
    // incluye la `especialidadId` requerida. Se usa para asegurar que
    // el profesional asignado a un servicio efectivamente tenga la
    // especialidad asociada al nombre de la subcategoría del servicio.
    const profesionalTieneEspecialidad = (profesional, especialidadId) => {
      const idsEspecialidades = new Set((profesional.especialidades || []).map((esp) => esp.id));
      return idsEspecialidades.has(especialidadId);
    };

    // Para cada servicio solicitamos la subcategoría y buscamos la
    // especialidad configurada que corresponde a ese nombre. Luego
    // buscamos un profesional (preferido, seleccionado o disponible)
    // que tenga dicha especialidad. Si no existe, se cancela la
    // creación de la cita con un error claro al cliente.
    for (const servicio of serviciosDB) {
      const nombreSubcategoria = servicio?.subcategoria?.nombre;
      const especialidad = especialidadPorNombreNormalizado.get(normalizarTexto(nombreSubcategoria));

      let profesionalParaServicio = null;

      // Si el cliente escogió un profesional explícito, hay que validar ese caso
      // antes de buscar otros candidatos. Si no tiene la especialidad, se rechaza
      // la solicitud con un mensaje preciso para la UI del cliente.
      if (profesionalSeleccionado && especialidad) {
        if (!profesionalTieneEspecialidad(profesionalSeleccionado, especialidad.id)) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `El profesional seleccionado no tiene la especialidad requerida para el servicio: ${servicio.nombre}`
          });
        }
        profesionalParaServicio = profesionalSeleccionado;
      }

      if (profesionalesPreferidos.length > 0 && especialidad) {
        const profesionalesInvalidosSeleccionados = profesionalesPreferidos.filter(
          (p) => !profesionalTieneEspecialidad(p, especialidad.id)
        );

        if (profesionalesInvalidosSeleccionados.length > 0) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: `Uno de los profesionales seleccionados no tiene la especialidad requerida para el servicio: ${servicio.nombre}`
          });
        }
      }

      // Prioriza profesionales preferidos (si se enviaron) que tengan la especialidad
      if (!profesionalParaServicio && profesionalesPreferidos.length > 0 && especialidad) {
        profesionalParaServicio = profesionalesPreferidos.find((p) => profesionalTieneEspecialidad(p, especialidad.id)) || null;
      }

      if (!profesionalParaServicio && especialidad) {
        // Si aún no hay asignación, buscar entre candidatos (preferidos o todos)
        const candidatos = profesionalesPreferidos.length > 0 ? profesionalesPreferidos : profesionalesDisponibles;
        profesionalParaServicio = candidatos.find((p) => profesionalTieneEspecialidad(p, especialidad.id)) || null;
      }

      // Si no se encuentra ningún profesional con la especialidad requerida,
      // se revierte la transacción y se devuelve un 400 con mensaje informativo.
      if (!profesionalParaServicio) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `No hay profesional disponible con la especialidad requerida para el servicio: ${servicio.nombre}`
        });
      }

      serviciosAsignados.push({
        servicio,
        profesionalId: profesionalParaServicio.id
      });
    }

    const profesionalesAsignadosIds = Array.from(new Set(serviciosAsignados.map((s) => s.profesionalId)));

    const inicioNueva = new Date(`${fecha}T${hora}`);
    const finNueva = new Date(inicioNueva);
    finNueva.setMinutes(finNueva.getMinutes() + duracionTotal);

    for (const profesionalAsignadoId of profesionalesAsignadosIds) {
      const detallesProfesional = await CitaServicio.findAll({
        where: { profesionalId: profesionalAsignadoId },
        attributes: ['citaId'],
        transaction: t
      });

      const citaIds = detallesProfesional.map((detalle) => detalle.citaId);
      if (citaIds.length === 0) continue;

      const citasExistentes = await Cita.findAll({
        where: {
          id: citaIds,
          fecha,
          estado: {
            [Op.in]: ['confirmada']
          }
        },
        attributes: ['hora', 'duracionTotal'],
        transaction: t
      });

      for (const citaExistente of citasExistentes) {
        const inicioExistente = new Date(`${fecha}T${citaExistente.hora}`);
        const finExistente = new Date(inicioExistente);
        finExistente.setMinutes(finExistente.getMinutes() + citaExistente.duracionTotal);

        const hayCruce = inicioNueva < finExistente && finNueva > inicioExistente;
        if (hayCruce) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: 'Uno de los profesionales asignados ya tiene una cita en ese horario'
          });
        }
      }
    }

    // ==========================================
    // CREAR CITA
    // ==========================================

    const cita = await Cita.create({
      usuarioId: req.usuario.id,
      profesionalId: profesionalSeleccionado ? profesionalSeleccionado.id : profesionalesAsignadosIds[0],
      fecha,
      hora,
      duracionTotal,
      total,
      estado: 'pendiente',
      notas: typeof notas === 'string' ? notas.trim() : (notas || null)
    }, { transaction: t });

    // ==========================================
    // CREAR DETALLES (CitaServicio)
    // ==========================================

    for (const asignacion of serviciosAsignados) {
      const s = asignacion.servicio;
      await CitaServicio.create({
        citaId: cita.id,
        servicioId: s.id,
        profesionalId: asignacion.profesionalId,
        precio: s.precio,
        duracion: s.duracion,
        cantidad: 1
      }, { transaction: t });
    }

    await t.commit();

    await cita.reload({
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre']
        },
        {
          model: Usuario,
          as: 'profesional',
          attributes: ['id', 'nombre']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Cita creada exitosamente',
      data: { cita }
    });

  } catch (error) {
    await t.rollback();
    console.error('Error en crearCita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear cita',
      error: error.message
    });
  }
};


// ==========================================
// 📄 MIS CITAS - CLIENTE
// ==========================================

const getMisCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll({
      where: { usuarioId: req.usuario.id },
      include: [
        {
          model: Usuario,
          as: 'profesional',
          attributes: ['id', 'nombre']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ],
      order: [['fecha', 'DESC']]
    });

    const citasConServiciosCompletos = citas.map(cita => {
      const servicios = cita.Servicios.map(servicio => {
        return {
          ...servicio.toJSON(),
          UsuarioId: cita.usuarioId,
          profesionalId: servicio.CitaServicio.profesionalId
        };
      });
      return {
        ...cita.toJSON(),
        Servicios: servicios
      };
    });

    res.json({
      success: true,
      data: { citas: citasConServiciosCompletos }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
};


// ==========================================
// 🔍 OBTENER CITA
// ==========================================

const getCitaById = async (req, res) => {
  try {
    const { id } = req.params;

    const where = { id };

    if (req.usuario.rol !== 'administrador') {
      where.usuarioId = req.usuario.id;
    }

    const cita = await Cita.findOne({
      where,
      include: [
        {
          model: Usuario,
          as: 'cliente'
        },
        {
          model: Usuario,
          as: 'profesional'
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ]
    });

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    res.json({
      success: true,
      data: { cita }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cita',
      error: error.message
    });
  }
};


// ==========================================
// ❌ CANCELAR CITA - CLIENTE
// ==========================================

const cancelarCita = async (req, res) => {
  try {
    const { id } = req.params;

    const cita = await Cita.findOne({
      where: {
        id,
        usuarioId: req.usuario.id
      }
    });

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (cita.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden cancelar citas pendientes'
      });
    }

    cita.estado = 'cancelada';
    await cita.save();

    res.json({
      success: true,
      message: 'Cita cancelada'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cancelar cita',
      error: error.message
    });
  }
};

// ==========================================
// 🔁 REPROGRAMAR CITA - CLIENTE
// ==========================================

const reprogramarCita = async (req, res) => {
  const { sequelize } = require('../config/database');
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { fecha, hora } = req.body;

    // VALIDACIÓN DE FECHA Y HORA
    const fechaValid = validarFechaHoraCita(fecha, hora);
    if (!fechaValid.valid) {
      await t.rollback();
      return res.status(400).json({ success: false, message: fechaValid.message });
    }

    const cita = await Cita.findOne({
      where: {
        id,
        usuarioId: req.usuario.id
      },
      transaction: t
    });

    if (!cita) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    if (!['pendiente', 'confirmada', 'cancelada'].includes(cita.estado)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden reprogramar citas pendientes, confirmadas o canceladas'
      });
    }

    const detalles = await CitaServicio.findAll({
      where: { citaId: cita.id },
      attributes: ['profesionalId'],
      transaction: t
    });

    const profesionalesAsignados = new Set();
    if (cita.profesionalId) {
      profesionalesAsignados.add(Number(cita.profesionalId));
    }

    for (const detalle of detalles) {
      if (detalle.profesionalId) {
        profesionalesAsignados.add(Number(detalle.profesionalId));
      }
    }

    const inicioNueva = new Date(`${fecha}T${hora}`);
    const finNueva = new Date(inicioNueva);
    finNueva.setMinutes(finNueva.getMinutes() + cita.duracionTotal);

    for (const profesionalAsignadoId of profesionalesAsignados) {
      const detallesProfesional = await CitaServicio.findAll({
        where: { profesionalId: profesionalAsignadoId },
        attributes: ['citaId'],
        transaction: t
      });

      const citaIds = detallesProfesional.map((detalle) => detalle.citaId);
      if (citaIds.length === 0) continue;

      const citasExistentes = await Cita.findAll({
        where: {
          [Op.and]: [
            { id: citaIds },
            { fecha: fecha },
            { estado: { [Op.in]: ['confirmada'] } },
            { id: { [Op.ne]: cita.id } }
          ]
        },
        attributes: ['hora', 'duracionTotal'],
        transaction: t
      });

      for (const citaExistente of citasExistentes) {
        const inicioExistente = new Date(`${fecha}T${citaExistente.hora}`);
        const finExistente = new Date(inicioExistente);
        finExistente.setMinutes(finExistente.getMinutes() + citaExistente.duracionTotal);

        const hayCruce = inicioNueva < finExistente && finNueva > inicioExistente;
        if (hayCruce) {
          await t.rollback();
          return res.status(400).json({
            success: false,
            message: 'Uno de los profesionales asignados ya tiene una cita en ese horario'
          });
        }
      }
    }

    cita.fecha = fecha;
    cita.hora = hora;
    if (cita.estado === 'cancelada') {
      cita.estado = 'pendiente';
    }
    await cita.save({ transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Cita reprogramada exitosamente',
      data: { cita }
    });

  } catch (error) {
    await t.rollback();
    res.status(500).json({
      success: false,
      message: 'Error al reprogramar cita',
      error: error.message
    });
  }
};


// ==========================================
// 📊 TODAS LAS CITAS - ADMIN
// ==========================================

const getAllCitas = async (req, res) => {
  try {
    const citas = await Cita.findAll({
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre', 'email', 'telefono']
        },
        {
          model: Usuario,
          as: 'profesional',
          attributes: ['id', 'nombre']
        },
        {
          model: Servicio,
          through: { attributes: ['precio', 'duracion', 'profesionalId'] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const citasConServicios = citas.map((cita) => {
      const servicios = (cita.Servicios || []).map((servicio) => ({
        ...servicio.toJSON(),
        UsuarioId: cita.usuarioId,
        profesionalId: servicio.CitaServicio?.profesionalId ?? cita.profesionalId
      }));

      return {
        ...cita.toJSON(),
        Servicios: servicios
      };
    });

    res.json({
      success: true,
      data: { citas: citasConServicios }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
};


// ==========================================
// 🔄 CAMBIAR ESTADO - ADMIN
// ==========================================

const actualizarEstadoCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'completada', 'cancelada'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido: ${estadosValidos.join(', ')}`
      });
    }

    const cita = await Cita.findByPk(id);

    if (!cita) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    cita.estado = estado;
    await cita.save();

    res.json({
      success: true,
      message: 'Estado actualizado',
      data: { cita }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};


// ==========================================
// 🗓️ CITAS DEL PROFESIONAL
// ==========================================

const getCitasProfesional = async (req, res) => {
  try {
    // Encuentra todas las citas en las que el profesional actual está involucrado a través de CitaServicio.
    const citas = await Cita.findAll({
      include: [
        {
          model: Usuario,
          as: 'cliente',
          attributes: ['id', 'nombre', 'email']
        },
        {
          model: Servicio,
          through: { attributes: ['profesionalId', 'precio', 'duracion'] },
          required: true
        },
        {
          model: CitaServicio,
          where: { profesionalId: req.usuario.id },
          attributes: [], // No necesitamos las columnas de CitaServicio aquí directamente
          required: true
        }
      ],
      order: [['fecha', 'DESC'], ['hora', 'DESC']],
      distinct: true // Asegura que cada cita se devuelva solo una vez
    });

    // Transforma la respuesta para que cada servicio tenga los IDs correctos.
    const citasTransformadas = citas.map(cita => {
      const serviciosTransformados = cita.Servicios.map(servicio => {
        // El profesionalId correcto está en la tabla intermedia CitaServicio
        const profesionalIdDelServicio = servicio.CitaServicio.profesionalId;

        return {
          ...servicio.toJSON(),
          UsuarioId: cita.usuarioId, // El ID del cliente de la cita
          profesionalId: profesionalIdDelServicio // El ID del profesional que hizo este servicio
        };
      });

      return {
        ...cita.toJSON(),
        Servicios: serviciosTransformados
      };
    });

    res.json({
      success: true,
      data: { citas: citasTransformadas }
    });

  } catch (error) {
    console.error('Error al obtener las citas del profesional:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las citas del profesional',
      error: error.message
    });
  }
};


// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // CLIENTE
  crearCita,
  getMisCitas,
  getCitaById,
  cancelarCita,
  reprogramarCita,

  // ADMIN
  getAllCitas,
  actualizarEstadoCita,
  getCitasProfesional
};