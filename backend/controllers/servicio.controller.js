/**
 * ============================================
 * CONTROLADOR DE SERVICIOS
 * ============================================
 * Gestiona la creación, consulta, actualización y estado de servicios.
 * Los servicios son usados para agendar citas con profesionales.
 * 
 * - ADMIN: CRUD completo
 * - CLIENTE: ver servicios disponibles
 */

const Servicio = require('../models/Servicio');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const { deleteFile, downloadImage } = require('../config/multer');

// ─────────────────────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────────────────────

const esNombreImagenValido = (imagen) => /\.(jpg|jpeg|png|gif)$/i.test(String(imagen || ''));

const getPaginacionParams = (pagina, limite) => {
  const pageNum = Number.parseInt(pagina, 10);
  const limitNum = Number.parseInt(limite, 10);
  const offset = (pageNum - 1) * limitNum;
  return { pageNum, limitNum, offset };
};

const buildServicioWhere = (filtros) => {
  const { Op } = require('sequelize');
  const { categoriaId, subcategoriaId, activo, buscar } = filtros;
  
  const where = {};
  if (categoriaId) where.categoriaId = categoriaId;
  if (subcategoriaId) where.subcategoriaId = subcategoriaId;
  if (activo !== undefined) where.activo = activo === 'true';
  
  if (buscar) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${buscar}%` } },
      { descripcion: { [Op.like]: `%${buscar}%` } }
    ];
  }
  
  return where;
};

const validarCategoriaServicio = async (categoriaId) => {
  const categoria = await Categoria.findByPk(categoriaId);
  if (!categoria) {
    throw new Error(`No existe una categoría con ID ${categoriaId}`);
  }
  if (!categoria.activo) {
    throw new Error(`La categoría "${categoria.nombre}" está inactiva`);
  }
  if (categoria.tipo !== 'servicio') {
    throw new Error('La categoría no corresponde a servicios');
  }
  return categoria;
};

const validarSubcategoriaServicio = async (subcategoriaId, categoriaId) => {
  const subcategoria = await Subcategoria.findByPk(subcategoriaId);
  if (!subcategoria) {
    throw new Error(`No existe una subcategoría con ID ${subcategoriaId}`);
  }
  if (!subcategoria.activo) {
    throw new Error(`La subcategoría "${subcategoria.nombre}" está inactiva`);
  }
  if (subcategoria.categoriaId !== Number.parseInt(categoriaId, 10)) {
    throw new Error('La subcategoría no pertenece a la categoría seleccionada');
  }
  if (subcategoria.tipo !== 'servicio') {
    throw new Error('La subcategoría no corresponde a servicios');
  }
  return subcategoria;
};

const validarPrecioServicio = (precio) => {
  const precioNum = Number.parseFloat(precio);
  if (Number.isNaN(precioNum) || precioNum <= 0) {
    throw new Error('El precio debe ser mayor a 0');
  }
  return precioNum;
};

const validarDuracionServicio = (duracion) => {
  const duracionNum = Number.parseInt(duracion, 10);
  if (Number.isNaN(duracionNum) || duracionNum < 1) {
    throw new Error('La duración debe ser mayor a 0 minutos');
  }
  return duracionNum;
};

const limpiarImagenEnError = async (filename) => {
  if (filename) {
    try {
      await deleteFile(filename);
    } catch (err) {
      console.error('Error al eliminar imagen:', err);
    }
  }
};

// ─────────────────────────────────────────────────────────────
// GET: Obtener servicios
// ─────────────────────────────────────────────────────────────

const getServicios = async (req, res) => {
  try {
    const { categoriaId, subcategoriaId, activo, buscar, pagina = 1, limite = 100 } = req.query;
    
    const where = buildServicioWhere({ categoriaId, subcategoriaId, activo, buscar });
    const { pageNum, limitNum, offset } = getPaginacionParams(pagina, limite);
    
    const { count, rows: servicios } = await Servicio.findAndCountAll({
      where,
      include: [
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Subcategoria,
          as: 'subcategoria',
          attributes: ['id', 'nombre']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset
    });
    
    res.json({
      success: true,
      data: {
        servicios,
        paginacion: {
          total: count,
          pagina: pageNum,
          limite: limitNum,
          totalPaginas: Math.ceil(count / limitNum)
        }
      }
    });
    
  } catch (error) {
    console.error('Error en getServicios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// GET: Obtener servicio por ID
// ─────────────────────────────────────────────────────────────

const getServicioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const servicio = await Servicio.findByPk(id, {
      include: [
        { model: Categoria, as: 'categoria' },
        { model: Subcategoria, as: 'subcategoria' }
      ]
    });
    
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: { servicio }
    });
    
  } catch (error) {
    console.error('Error en getServicioById:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicio',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// POST: Crear servicio
// ─────────────────────────────────────────────────────────────

const crearServicio = async (req, res) => {
  let downloadedImagen = null;
  
  try {
    const { nombre, descripcion, precio, duracion, categoriaId, subcategoriaId } = req.body;
    
    // Validar campos obligatorios
    if (!nombre || !precio || !duracion || !categoriaId || !subcategoriaId) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser enviados'
      });
    }
    
    const parsedPrecio = validarPrecioServicio(precio);
    const parsedDuracion = validarDuracionServicio(duracion);
    const parsedCategoriaId = Number.parseInt(categoriaId, 10);
    const parsedSubcategoriaId = Number.parseInt(subcategoriaId, 10);
    
    // Validar categoría y subcategoría
    await validarCategoriaServicio(parsedCategoriaId);
    await validarSubcategoriaServicio(parsedSubcategoriaId, parsedCategoriaId);
    
    let imagen = null;
    if (req.file) {
      imagen = req.file.filename;
    } else if (req.body?.imagenUrl) {
      try {
        downloadedImagen = await downloadImage(req.body.imagenUrl, nombre);
        imagen = downloadedImagen;
      } catch (err) {
        console.warn('No se pudo descargar la imagen remota:', err.message);
        imagen = null;
      }
    }
    
    const servicio = await Servicio.create({
      nombre,
      descripcion,
      precio: parsedPrecio,
      duracion: parsedDuracion,
      categoriaId: parsedCategoriaId,
      subcategoriaId: parsedSubcategoriaId,
      imagen,
      activo: true
    });
    
    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: { servicio }
    });
    
  } catch (error) {
    console.error('Error en crearServicio:', error);
    
    if (req.file) {
      await limpiarImagenEnError(req.file.filename);
    }
    if (downloadedImagen) {
      await limpiarImagenEnError(downloadedImagen);
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map((e) => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al crear servicio',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PUT: Actualizar servicio
// ─────────────────────────────────────────────────────────────

const actualizarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, duracion, categoriaId, subcategoriaId, activo } = req.body;
    
    const parsedPrecio = precio !== undefined ? validarPrecioServicio(precio) : undefined;
    const parsedDuracion = duracion !== undefined ? validarDuracionServicio(duracion) : undefined;
    const parsedCategoriaId = categoriaId !== undefined && categoriaId !== '' 
      ? Number.parseInt(categoriaId, 10) 
      : undefined;
    const parsedSubcategoriaId = subcategoriaId !== undefined && subcategoriaId !== '' 
      ? Number.parseInt(subcategoriaId, 10) 
      : undefined;
    const parsedActivo = activo !== undefined ? activo === 'true' || activo === true : undefined;
    
    const servicio = await Servicio.findByPk(id);
    
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    // Validar categoría
    if (parsedCategoriaId !== undefined) {
      await validarCategoriaServicio(parsedCategoriaId);
    }
    
    // Validar subcategoría
    if (parsedSubcategoriaId !== undefined) {
      const categoriaDeServicio = parsedCategoriaId !== undefined ? parsedCategoriaId : servicio.categoriaId;
      await validarSubcategoriaServicio(parsedSubcategoriaId, categoriaDeServicio);
    }
    
    const imagenAnterior = servicio.imagen;
    let downloadedNewImageService = null;
    
    // Manejo de imagen
    if (req.file) {
      servicio.imagen = req.file.filename;
      if (imagenAnterior && imagenAnterior !== servicio.imagen) {
        await limpiarImagenEnError(imagenAnterior);
      }
    } else if (req.body?.imagenUrl) {
      try {
        const imagenUrlStr = String(req.body.imagenUrl || '');
        if (!imagenAnterior || !imagenUrlStr.includes(imagenAnterior)) {
          const filename = await downloadImage(imagenUrlStr, servicio.nombre || 'imagen');
          downloadedNewImageService = filename;
          servicio.imagen = filename;
          if (imagenAnterior && imagenAnterior !== filename) {
            await limpiarImagenEnError(imagenAnterior);
          }
        }
      } catch (err) {
        console.warn('No se pudo descargar imagen remota:', err.message);
      }
    } else if (servicio.imagen && !esNombreImagenValido(servicio.imagen)) {
      servicio.imagen = null;
    }
    
    // Actualizar campos
    if (nombre !== undefined) servicio.nombre = nombre;
    if (descripcion !== undefined) servicio.descripcion = descripcion;
    if (parsedPrecio !== undefined) servicio.precio = parsedPrecio;
    if (parsedDuracion !== undefined) servicio.duracion = parsedDuracion;
    if (parsedCategoriaId !== undefined) servicio.categoriaId = parsedCategoriaId;
    if (parsedSubcategoriaId !== undefined) servicio.subcategoriaId = parsedSubcategoriaId;
    if (parsedActivo !== undefined) servicio.activo = parsedActivo;
    
    await servicio.save();
    
    res.json({
      success: true,
      message: 'Servicio actualizado',
      data: { servicio }
    });
    
  } catch (error) {
    console.error('Error en actualizarServicio:', error);
    
    if (req.file) {
      await limpiarImagenEnError(req.file.filename);
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors: error.errors.map((e) => e.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH: Toggle servicio
// ─────────────────────────────────────────────────────────────

const toggleServicio = async (req, res) => {
  try {
    const { id } = req.params;
    
    const servicio = await Servicio.findByPk(id);
    
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    servicio.activo = !servicio.activo;
    await servicio.save();
    
    res.json({
      success: true,
      message: `Servicio ${servicio.activo ? 'activado' : 'desactivado'}`,
      data: { servicio }
    });
    
  } catch (error) {
    console.error('Error en toggleServicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del servicio',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// DELETE: Eliminar servicio
// ─────────────────────────────────────────────────────────────

const eliminarServicio = async (req, res) => {
  try {
    const { id } = req.params;
    
    const servicio = await Servicio.findByPk(id);
    
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    
    if (servicio.imagen) {
      await limpiarImagenEnError(servicio.imagen);
    }
    
    await servicio.destroy();
    
    res.json({
      success: true,
      message: 'Servicio eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('Error en eliminarServicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar servicio',
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  getServicios,
  getServicioById,
  crearServicio,
  actualizarServicio,
  toggleServicio,
  eliminarServicio
};