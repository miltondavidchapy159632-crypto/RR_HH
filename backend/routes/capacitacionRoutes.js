// ============================================================
//  SCGRH — capacitacionRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl    = require('../controllers/capacitacionController');

router.use(authMiddleware);

// Catálogos
router.get('/catalogos',                            ctrl.getCatalogos);
// Cursos
router.get('/cursos',                               ctrl.getAllCursos);
router.post('/cursos',                              ctrl.createCurso);
router.put('/cursos/:id',                           ctrl.updateCurso);
// Sesiones
router.get('/',                                     ctrl.getAllSesiones);
router.get('/:id',                                  ctrl.getSesionById);
router.post('/',                                    ctrl.createSesion);
router.put('/:id',                                  ctrl.updateSesion);
router.patch('/:id/estado',                         ctrl.cambiarEstado);
// Inscripciones y asistencia
router.post('/:id/inscribir',                       ctrl.inscribir);
router.put('/:id/asistencia',                       ctrl.registrarAsistencia);
// Evaluaciones
router.put('/asistencia/:asistencia_id/evaluar',    ctrl.evaluar);

module.exports = router;
