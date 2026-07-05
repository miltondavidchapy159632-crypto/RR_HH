const express = require('express');
const router  = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getPool, sql } = require('../config/database');

router.use(authMiddleware);

router.get('/stats', async (req, res) => {
  try {
    const pool = getPool();
    const stats = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM personas WHERE estado = 'ACTIVO')     AS empleados_activos,
        (SELECT COUNT(*) FROM contratos WHERE estado = 'VIGENTE')    AS contratos_vigentes,
        (SELECT COUNT(*) FROM vacantes  WHERE estado = 'PUBLICADA')  AS vacantes_abiertas,
        (SELECT COUNT(*) FROM empresas  WHERE activo = 1)            AS total_empresas,
        (SELECT COUNT(*) FROM sucursales WHERE activo = 1)           AS total_sucursales,
        (SELECT COUNT(*) FROM areas      WHERE activo = 1)           AS total_areas,
        (SELECT COUNT(*) FROM cargos     WHERE activo = 1)           AS total_cargos
    `);
    res.json({ ok: true, data: stats.recordset[0] });
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message });
  }
});

module.exports = router;
