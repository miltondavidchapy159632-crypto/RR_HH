const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/marcacionController');
const { authMiddleware } = require('../middleware/auth');

// Reloj Biométrico (Público/Quiosco)
router.post('/check',  ctrl.checkTurno);
router.post('/marcar', ctrl.marcar);

// Panel de Administración (Privado con JWT)
router.get('/',           authMiddleware, ctrl.getAll);
router.post('/justificar', authMiddleware, ctrl.justificar);

module.exports = router;
