const express = require('express');
const router = express.Router();

// Middlewares
const verificarAuth = require('../middleware/auth');
const { esAdministrador } = require('../middleware/checkRole');

// Controllers
const categoriaController = require('../controllers/categoria.controller');
const subcategoriaController = require('../controllers/subcategoria.controller');
const especialidadController = require('../controllers/especialidad.controller');
const profesionalController = require('../controllers/profesional.controller');

// ============================================
// CATEGORÍAS
// ============================================

router.get('/categorias', verificarAuth, esAdministrador, categoriaController.getCategorias);
router.get('/categorias/:id', verificarAuth, esAdministrador, categoriaController.getCategoriaById);
router.post('/categorias', verificarAuth, esAdministrador, categoriaController.crearCategoria);
router.put('/categorias/:id', verificarAuth, esAdministrador, categoriaController.actualizarCategoria);
router.patch('/categorias/:id/toggle', verificarAuth, esAdministrador, categoriaController.toggleCategoria);
router.delete('/categorias/:id', verificarAuth, esAdministrador, categoriaController.eliminarCategoria);
router.get('/categorias/:id/stats', verificarAuth, esAdministrador, categoriaController.getEstadisticasCategoria);

// ============================================
// SUBCATEGORÍAS
// ============================================

router.get('/subcategorias', verificarAuth, esAdministrador, subcategoriaController.getSubcategorias);
router.get('/subcategorias/:id', verificarAuth, esAdministrador, subcategoriaController.getSubcategoriaById);
router.post('/subcategorias', verificarAuth, esAdministrador, subcategoriaController.crearSubcategoria);
router.put('/subcategorias/:id', verificarAuth, esAdministrador, subcategoriaController.actualizarSubcategoria);
router.patch('/subcategorias/:id/toggle', verificarAuth, esAdministrador, subcategoriaController.toggleSubcategoria);
router.delete('/subcategorias/:id', verificarAuth, esAdministrador, subcategoriaController.eliminarSubcategoria);

// ============================================
// ESPECIALIDADES
// ============================================

router.get('/especialidades', verificarAuth, esAdministrador, especialidadController.getEspecialidades);
router.get('/especialidades/:id', verificarAuth, esAdministrador, especialidadController.getEspecialidadById);
router.post('/especialidades', verificarAuth, esAdministrador, especialidadController.crearEspecialidad);
router.put('/especialidades/:id', verificarAuth, esAdministrador, especialidadController.actualizarEspecialidad);
router.delete('/especialidades/:id', verificarAuth, esAdministrador, especialidadController.eliminarEspecialidad);

// ============================================
// PROFESIONALES (gestión admin)
// ============================================

router.get('/profesionales', verificarAuth, esAdministrador, profesionalController.getProfesionales);
router.get('/profesionales/:id', verificarAuth, esAdministrador, profesionalController.getProfesionalById);
router.put('/profesionales/:id', verificarAuth, esAdministrador, profesionalController.actualizarProfesional);
router.delete('/profesionales/:id', verificarAuth, esAdministrador, profesionalController.eliminarProfesional);

module.exports = router;