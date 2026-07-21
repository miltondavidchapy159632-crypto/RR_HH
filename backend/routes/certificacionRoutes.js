// ============================================================
//  SCGRH — certificacionRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl    = require('../controllers/certificacionController');

router.use(authMiddleware);

// Catálogo
router.get('/catalogo',            ctrl.getAllCatalogo);
router.post('/catalogo',           ctrl.createCatalogo);
router.put('/catalogo/:id',        ctrl.updateCatalogo);

// Auxiliares
router.get('/stats',               ctrl.getStats);
router.get('/selects',             ctrl.getCatalogosForSelects);

// Empleados (Asignaciones)
router.get('/empleados',           ctrl.getEmpleados);
router.post('/empleados',          ctrl.createEmpleadoCert);
router.patch('/empleados/:id',     ctrl.updateEstado);
router.delete('/empleados/:id',    ctrl.deleteEmpleadoCert);

module.exports = router;
