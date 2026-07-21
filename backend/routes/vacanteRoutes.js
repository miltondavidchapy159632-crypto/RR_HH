// ============================================================
//  SCGRH — vacanteRoutes.js
// ============================================================
const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl    = require('../controllers/vacanteController');

// Todos los endpoints requieren autenticación JWT
router.use(authMiddleware);

// ── Catálogos ─────────────────────────────────────────────
router.get('/catalogos',                      ctrl.getCatalogos);

// ── Vacantes ──────────────────────────────────────────────
router.get   ('/',                            ctrl.getAllVacantes);
router.get   ('/:id',                         ctrl.getVacanteById);
router.post  ('/',                            ctrl.createVacante);
router.put   ('/:id',                         ctrl.updateVacante);
router.patch ('/:id/estado',                  ctrl.cambiarEstado);

// ── Postulaciones de una vacante ──────────────────────────
router.get   ('/:id/postulaciones',           ctrl.getPostulaciones);
router.post  ('/postulaciones',               ctrl.createPostulacion);
router.patch ('/postulaciones/:id/estado',    ctrl.cambiarEstadoPostulacion);

// ── Entrevistas ───────────────────────────────────────────
router.get   ('/postulaciones/:postulacion_id/entrevistas', ctrl.getEntrevistas);
router.post  ('/entrevistas',                               ctrl.createEntrevista);
router.patch ('/entrevistas/:id/resultado',                 ctrl.registrarResultadoEntrevista);

// ── Ofertas laborales ──────────────────────────────────────
router.post  ('/ofertas',                     ctrl.createOfertaLaboral);

module.exports = router;
