// ============================================================
//  SCGRH — evaluacionDesempenoRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl    = require('../controllers/evaluacionDesempenoController');

router.use(authMiddleware);

// Catálogos
router.get ('/catalogos',              ctrl.getCatalogos);

// Evaluaciones
router.get ('/',                       ctrl.getAll);
router.get ('/:id',                    ctrl.getById);
router.post('/',                       ctrl.create);
router.put ('/:id/criterios',          ctrl.updateCriterios);
router.patch('/:id/estado',            ctrl.cambiarEstado);

// Planes de desarrollo
router.post ('/:id/planes',            ctrl.createPlan);
router.put  ('/:id/planes/:planId',    ctrl.updatePlan);

module.exports = router;
