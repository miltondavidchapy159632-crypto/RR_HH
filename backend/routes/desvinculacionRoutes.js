// ============================================================
//  SCGRH — desvinculacionRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl    = require('../controllers/desvinculacionController');

router.use(authMiddleware);

router.get('/catalogos',                  ctrl.getCatalogos);
router.get('/',                           ctrl.getAll);
router.get('/:id',                        ctrl.getById);
router.post('/',                          ctrl.create);
router.patch('/:id/estado',               ctrl.cambiarEstado);
router.patch('/validacion/:val_id',       ctrl.toggleValidacion);
router.post('/:id/activos',               ctrl.addActivo);
router.patch('/activos/:activo_id',       ctrl.updateActivo);
router.put('/:id/liquidacion',            ctrl.upsertLiquidacion);

module.exports = router;
