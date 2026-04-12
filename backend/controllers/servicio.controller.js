const Servicio = require('../models/Servicio');

// GET → Todos los servicios
exports.getAll = async (req, res) => {
  try {
    const servicios = await Servicio.findAll();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// GET → Por ID
exports.getById = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);

    if (!servicio) {
      return res.status(404).json({ msg: 'Servicio no encontrado' });
    }

    res.json(servicio);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// GET → Por categoría
exports.getByCategoria = async (req, res) => {
  try {
    const servicios = await Servicio.obtenerPorCategoria(req.params.categoria);
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// POST → Crear servicio
exports.create = async (req, res) => {
  try {
    const servicio = await Servicio.create(req.body);
    res.status(201).json(servicio);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// PUT → Actualizar completo
exports.update = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);

    if (!servicio) {
      return res.status(404).json({ msg: 'Servicio no encontrado' });
    }

    await servicio.update(req.body);

    res.json(servicio);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// PATCH → Activar / desactivar
exports.patch = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);

    if (!servicio) {
      return res.status(404).json({ msg: 'Servicio no encontrado' });
    }

    servicio.activo = req.body.activo;
    await servicio.save();

    res.json(servicio);
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

// DELETE → Eliminar
exports.delete = async (req, res) => {
  try {
    const servicio = await Servicio.findByPk(req.params.id);

    if (!servicio) {
      return res.status(404).json({ msg: 'Servicio no encontrado' });
    }

    await servicio.destroy();

    res.json({ msg: 'Servicio eliminado' });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};