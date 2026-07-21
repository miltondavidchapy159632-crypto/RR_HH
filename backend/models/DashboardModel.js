// ============================================================
//  SCGRH — DashboardModel.js
//  Módulo de métricas avanzadas Multi-sede
// ============================================================
const { getPool, sql } = require('../config/database');

const DashboardModel = {
  
  async getAdvancedStats(empresa_id) {
    const pool = getPool();
    const stats = {
      generales: {},
      certificaciones: {},
      desvinculaciones: {},
      sedes: []
    };

    try {
      // 1. Estadísticas Generales
      const resGen = await pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT
          (SELECT COUNT(*) FROM contratos c INNER JOIN puestos pu ON pu.id=c.puesto_id INNER JOIN cargos car ON car.id=pu.cargo_id INNER JOIN areas a ON a.id=car.area_id WHERE c.estado = 'VIGENTE' AND a.empresa_id=@eid) AS empleados_activos,
          (SELECT COUNT(*) FROM vacantes v INNER JOIN puestos pu ON pu.id=v.puesto_id INNER JOIN cargos car ON car.id=pu.cargo_id INNER JOIN areas a ON a.id=car.area_id WHERE v.estado = 'PUBLICADA' AND a.empresa_id=@eid) AS vacantes_abiertas,
          (SELECT COUNT(*) FROM sucursales WHERE empresa_id=@eid AND activo=1) AS total_sucursales,
          (SELECT COUNT(*) FROM contratos c INNER JOIN puestos pu ON pu.id=c.puesto_id INNER JOIN cargos car ON car.id=pu.cargo_id INNER JOIN areas a ON a.id=car.area_id WHERE c.estado = 'VIGENTE' AND a.empresa_id=@eid AND c.fecha_fin IS NOT NULL AND c.fecha_fin <= DATEADD(day, 30, GETDATE())) AS contratos_por_vencer
      `);
      stats.generales = resGen.recordset[0] || {};

      // 2. Estado de Certificaciones (Salud/Higiene)
      const resCert = await pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT ce.estado, COUNT(*) as cantidad
        FROM certificaciones_empleado ce
        INNER JOIN contratos co ON co.id = ce.contrato_id
        INNER JOIN puestos pu ON pu.id = co.puesto_id
        INNER JOIN cargos car ON car.id = pu.cargo_id
        INNER JOIN areas a ON a.id = car.area_id
        WHERE a.empresa_id = @eid
        GROUP BY ce.estado
      `);
      resCert.recordset.forEach(r => { stats.certificaciones[r.estado] = r.cantidad; });

      // 3. Desvinculaciones y Rotación (últimos 6 meses)
      const resDesv = await pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT 
          FORMAT(fecha_solicitud, 'yyyy-MM') as mes,
          COUNT(*) as cantidad
        FROM solicitudes_desvinculacion s
        INNER JOIN contratos co ON co.id = s.contrato_id
        INNER JOIN puestos pu ON pu.id = co.puesto_id
        INNER JOIN cargos car ON car.id = pu.cargo_id
        INNER JOIN areas a ON a.id = car.area_id
        WHERE a.empresa_id = @eid AND s.estado IN ('APROBADA','CERRADA')
          AND s.fecha_solicitud >= DATEADD(month, -6, GETDATE())
        GROUP BY FORMAT(fecha_solicitud, 'yyyy-MM')
        ORDER BY mes
      `);
      stats.desvinculaciones.tendencia = resDesv.recordset;

      // 4. Distribución por Sedes (Sucursales) - Empleados Activos
      const resSedes = await pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT suc.nombre, COUNT(co.id) as total_empleados
        FROM sucursales suc
        LEFT JOIN puestos pu ON pu.sucursal_id = suc.id
        LEFT JOIN contratos co ON co.puesto_id = pu.id AND co.estado = 'VIGENTE'
        WHERE suc.empresa_id = @eid AND suc.activo = 1
        GROUP BY suc.nombre
        ORDER BY total_empleados DESC
      `);
      stats.sedes = resSedes.recordset;

      return stats;
    } catch(e) { throw e; }
  }
};

module.exports = DashboardModel;
