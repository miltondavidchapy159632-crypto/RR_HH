// ============================================================
//  SCGRH — zonaRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl    = require('../controllers/zonaController');

router.use(authMiddleware);

// Zonas
router.get('/',               ctrl.getZonas);
router.get('/sucursales',     ctrl.getSucursales);
router.post('/',              ctrl.createZona);
router.put('/:id',            ctrl.updateZona);

// Asignaciones
router.get('/asignaciones',          ctrl.getAsignaciones);
router.get('/asignaciones/options',  ctrl.getOptionsAsignacion);
router.post('/asignaciones',         ctrl.createAsignacion);
router.delete('/asignaciones/:id',   ctrl.deleteAsignacion);

module.exports = router;
