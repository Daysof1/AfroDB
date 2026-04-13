const express = require('express');
const router = express.Router();

const verificarAuth = require('../middleware/auth');
const { esProfesional } = require('../middleware/checkRole');

const citaController = require('../controllers/cita.controller');
const profesionalController = require('../controllers/profesional.controller');

// ============================================
// CITAS (PROFESIONAL)
// ============================================

router.get('/citas', verificarAuth, esProfesional, citaController.getCitasProfesional);
router.put('/citas/:id/estado', verificarAuth, esProfesional, citaController.actualizarEstadoCita);

// ============================================
// PERFIL PROFESIONAL
// ============================================

router.get('/perfil', verificarAuth, esProfesional, profesionalController.getMiPerfil);
router.put('/perfil', verificarAuth, esProfesional, profesionalController.actualizarMiPerfil);

// Especialidades del profesional
router.get('/mis-especialidades', verificarAuth, esProfesional, profesionalController.getMisEspecialidades);
router.post('/mis-especialidades', verificarAuth, esProfesional, profesionalController.agregarEspecialidad);
router.delete('/mis-especialidades/:especialidadId', verificarAuth, esProfesional, profesionalController.removerEspecialidad);

module.exports = router;