const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/licenciaController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Licencias
router.get('/licencias',          ctrl.getAllLicencias);
router.post('/licencias',         ctrl.createLicencia);
router.post('/licencias/procesar', ctrl.procesarLicencia);
router.get('/catalogs/tipos',     ctrl.getTiposLicencia);

// Permisos
router.get('/permisos',          ctrl.getAllPermisos);
router.post('/permisos',         ctrl.createPermiso);
router.post('/permisos/procesar', ctrl.procesarPermiso);

module.exports = router;
