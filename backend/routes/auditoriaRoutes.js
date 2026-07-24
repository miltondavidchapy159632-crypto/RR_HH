// ============================================================
//  SCGRH — auditoriaRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl    = require('../controllers/auditoriaController');

router.use(authMiddleware);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);

// Endpoints que retornan archivos binarios
router.get('/reportes/empleados/excel', ctrl.downloadReporteEmpleados);
router.get('/reportes/calidad/pdf', ctrl.downloadReporteCalidad);

module.exports = router;
