const express = require('express');
const router = express.Router();

const verificarAuth = require('../middleware/auth');
const { esCliente } = require('../middleware/checkRole');

const citaController = require('../controllers/cita.controller');

// ============================================
// CITAS (CLIENTE)
// ============================================

router.post('/citas', verificarAuth, esCliente, citaController.crearCita);
router.get('/citas', verificarAuth, esCliente, citaController.getMisCitas);
router.get('/citas/:id', verificarAuth, esCliente, citaController.getCitaById);
router.put('/citas/:id/cancelar', verificarAuth, esCliente, citaController.cancelarCita);

module.exports = router;