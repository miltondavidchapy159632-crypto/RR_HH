const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/planillaController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Procesos de Planilla
router.get('/',                 ctrl.getAll);
router.get('/:id',              ctrl.getById);
router.get('/:id/detalle',      ctrl.getDetalle);
router.post('/',                ctrl.create);
router.post('/calcular',        ctrl.calcular);
router.post('/aprobar',         ctrl.aprobar);

// Boletas de Pago
router.get('/boleta/:detalle_id', ctrl.getBoleta);

// Archivos Bancarios
router.get('/config/bancos',    ctrl.getArchivosBancarios);

module.exports = router;
