// ============================================================
//  SCGRH — AuditoriaModel.js
//  Módulo de Auditoría y Reportes (Fase 8)
// ============================================================
const { getPool, sql } = require('../config/database');

const AuditoriaModel = {
  // ── AUDITORÍAS ──────────────────────────────────────────────
  async getAllAuditorias(empresa_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('eid', sql.Int, empresa_id)
      .query(`
        SELECT a.id, a.fecha_auditoria, a.tipo, a.puntaje_total, a.estado, a.observaciones,
               z.nombre AS zona_nombre, z.tipo AS zona_tipo, suc.nombre AS sucursal_nombre,
               usr.username AS auditor
        FROM auditorias a
        INNER JOIN zonas_restaurante z ON z.id = a.zona_id
        INNER JOIN sucursales suc ON suc.id = z.sucursal_id
        INNER JOIN usuarios usr ON usr.id = a.auditor_id
        WHERE suc.empresa_id = @eid
        ORDER BY a.fecha_auditoria DESC
      `);
    return res.recordset;
  },

  async getAuditoriaById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT a.*, z.nombre AS zona_nombre, suc.nombre AS sucursal_nombre 
        FROM auditorias a 
        INNER JOIN zonas_restaurante z ON z.id = a.zona_id
        INNER JOIN sucursales suc ON suc.id = z.sucursal_id
        WHERE a.id = @id
      `);
    if(res.recordset.length === 0) return null;
    const auditoria = res.recordset[0];
    
    const resDet = await pool.request().input('id', sql.Int, id).query(`
      SELECT * FROM auditoria_detalles WHERE auditoria_id = @id ORDER BY id
    `);
    auditoria.detalles = resDet.recordset;
    return auditoria;
  },

  async createAuditoria(data, usuario_id) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request = new sql.Request(transaction);
      
      let puntaje = null;
      if (data.detalles && data.detalles.length > 0) {
        const cumpleCount = data.detalles.filter(d => d.cumple).length;
        puntaje = Math.round((cumpleCount / data.detalles.length) * 100);
      }

      const resAudit = await request
        .input('zona', sql.Int, data.zona_id)
        .input('auditor', sql.Int, usuario_id)
        .input('tipo', sql.NVarChar, data.tipo)
        .input('ptje', sql.Int, puntaje)
        .input('obs', sql.NVarChar, data.observaciones || null)
        .input('est', sql.NVarChar, data.estado || 'COMPLETADA')
        .query(`
          INSERT INTO auditorias (zona_id, auditor_id, tipo, puntaje_total, observaciones, estado)
          OUTPUT INSERTED.id
          VALUES (@zona, @auditor, @tipo, @ptje, @obs, @est)
        `);
      
      const auditId = resAudit.recordset[0].id;

      if (data.detalles && data.detalles.length > 0) {
        for (const det of data.detalles) {
          const detReq = new sql.Request(transaction);
          await detReq
            .input('aid', sql.Int, auditId)
            .input('item', sql.NVarChar, det.item_evaluado)
            .input('cumple', sql.Bit, det.cumple ? 1 : 0)
            .input('obs', sql.NVarChar, det.observacion || null)
            .query(`
              INSERT INTO auditoria_detalles (auditoria_id, item_evaluado, cumple, observacion)
              VALUES (@aid, @item, @cumple, @obs)
            `);
        }
      }

      await transaction.commit();
      return auditId;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  // Para reportes generales (Exportación a Excel)
  async getReporteEmpleados(empresa_id) {
    const pool = getPool();
    const res = await pool.request().input('eid', sql.Int, empresa_id).query(`
      SELECT 
        per.nombres + ' ' + per.apellido_paterno + ' ' + ISNULL(per.apellido_materno, '') AS Empleado,
        per.documento_identidad AS DNI,
        co.fecha_inicio AS [Fecha Ingreso],
        co.fecha_fin AS [Fecha Fin Contrato],
        co.estado AS Estado,
        car.nombre AS Cargo,
        suc.nombre AS Sucursal
      FROM contratos co
      INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
      INNER JOIN personas per ON per.id = el.persona_id
      INNER JOIN puestos pu ON pu.id = co.puesto_id
      INNER JOIN cargos car ON car.id = pu.cargo_id
      INNER JOIN sucursales suc ON suc.id = pu.sucursal_id
      WHERE suc.empresa_id = @eid
      ORDER BY suc.nombre, Empleado
    `);
    return res.recordset;
  }
};

module.exports = AuditoriaModel;
