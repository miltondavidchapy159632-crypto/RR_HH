const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/horarioController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Horarios base
router.get('/',       ctrl.getAll);
router.get('/:id',    ctrl.getById);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.delete);

// Asignaciones
router.get('/config/asignaciones',    ctrl.getAsignaciones);
router.post('/config/asignaciones',   ctrl.createAsignacion);
router.delete('/config/asignaciones/:id', ctrl.deleteAsignacion);

module.exports = router;
