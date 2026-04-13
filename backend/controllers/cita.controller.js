const cita = require('../models/Cita');

// GET → Todas las citas
exports.getAll = async (req, res) => {
  try {
    const citas = await cita.findAll({
      order: [['fecha', 'DESC'], ['hora', 'DESC']]
    });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// GET → Una cita por ID
exports.getById = async (req, res) => {
  try {
    const cita = await cita.findByPk(req.params.id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    res.json(cita);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// POST → Crear cita
exports.create = async (req, res) => {
  try {
    const { fecha, hora } = req.body;

    const disponible = await cita.verificarDisponibilidad(fecha, hora);
    if (!disponible) {
      return res.status(400).json({
        msg: 'Ya existe una cita en esa fecha y hora'
      });
    }

    const nuevaCita = await cita.create(req.body);

    res.status(201).json(nuevaCita);

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// PUT → Actualizar completa
exports.update = async (req, res) => {
  try {
    const cita = await cita.findByPk(req.params.id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    const { fecha, hora } = req.body;

    if (fecha && hora) {
      const disponible = await cita.verificarDisponibilidad(fecha, hora);
      if (!disponible) {
        return res.status(400).json({
          msg: 'Ese horario ya está ocupado'
        });
      }
    }

    await cita.update(req.body);

    res.json(cita);

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// PATCH → Cambiar estado
exports.patch = async (req, res) => {
  try {
    const cita = await cita.findByPk(req.params.id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    const { estado } = req.body;

    const estadosValidos = ['pendiente', 'confirmada', 'cancelada'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        msg: 'Estado no válido'
      });
    }

    cita.estado = estado;
    await cita.save();

    res.json(cita);

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// DELETE → Eliminar cita
exports.delete = async (req, res) => {
  try {
    const cita = await cita.findByPk(req.params.id);

    if (!cita) {
      return res.status(404).json({ msg: 'Cita no encontrada' });
    }

    await cita.destroy();

    res.json({ msg: 'Cita eliminada correctamente' });

  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};