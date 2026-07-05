const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/vacacionesController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/saldos',        ctrl.getSaldos);
router.post('/saldos',       ctrl.createSaldo);
router.get('/solicitudes',   ctrl.getSolicitudes);
router.post('/solicitudes',  ctrl.createSolicitud);
router.post('/procesar',     ctrl.procesar);

module.exports = router;
