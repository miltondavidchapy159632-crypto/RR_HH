// ============================================================
//  SCGRH — DesvinculacionModel.js
//  Offboarding, Liquidaciones y Retorno de Activos
// ============================================================
const { getPool, sql } = require('../config/database');

const DesvinculacionModel = {

  // ══════════════════════════════════════════════════════════
  //  CATÁLOGOS
  // ══════════════════════════════════════════════════════════
  async getCatalogos(empresa_id) {
    const pool = getPool();
    const [motivos, contratos] = await Promise.all([
      pool.request().query(`SELECT id, codigo, descripcion FROM cat_motivo_cese ORDER BY descripcion`),
      pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT co.id AS contrato_id,
               per.nombres + ' ' + per.apellido_paterno + ' ' + ISNULL(per.apellido_materno,'') AS nombre_completo,
               car.nombre AS cargo_nombre, suc.nombre AS sucursal_nombre,
               co.fecha_inicio
        FROM   contratos co
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas  per ON per.id = el.persona_id
        INNER JOIN puestos   pu  ON pu.id = co.puesto_id
        INNER JOIN cargos    car ON car.id = pu.cargo_id
        INNER JOIN areas     a   ON a.id = car.area_id
        INNER JOIN sucursales suc ON suc.id = pu.sucursal_id
        WHERE  co.estado = 'VIGENTE' AND a.empresa_id = @eid
        ORDER  BY per.apellido_paterno, per.nombres
      `)
    ]);
    return { motivos: motivos.recordset, contratos: contratos.recordset };
  },

  // ══════════════════════════════════════════════════════════
  //  SOLICITUDES
  // ══════════════════════════════════════════════════════════
  async findAll(empresa_id) {
    const pool = getPool();
    const res  = await pool.request()
      .input('eid', sql.Int, empresa_id)
      .query(`
        SELECT s.id, s.fecha_solicitud, s.fecha_cese_propuesta, s.estado, s.descripcion,
               m.descripcion AS motivo_cese, m.codigo AS motivo_codigo,
               per.nombres + ' ' + per.apellido_paterno AS colaborador_nombre,
               car.nombre AS cargo_nombre, suc.nombre AS sucursal_nombre,
               co.fecha_inicio AS fecha_ingreso,
               (SELECT COUNT(*) FROM validacion_desvinculacion v WHERE v.solicitud_id = s.id AND v.completado = 1) AS items_completados,
               (SELECT COUNT(*) FROM validacion_desvinculacion v WHERE v.solicitud_id = s.id) AS items_totales,
               l.total_liquidacion, l.estado AS estado_liquidacion
        FROM   solicitudes_desvinculacion s
        INNER JOIN cat_motivo_cese m ON m.id = s.motivo_cese_id
        INNER JOIN contratos       co ON co.id = s.contrato_id
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas        per ON per.id = el.persona_id
        INNER JOIN puestos         pu  ON pu.id = co.puesto_id
        INNER JOIN cargos          car ON car.id = pu.cargo_id
        INNER JOIN areas           a   ON a.id = car.area_id
        INNER JOIN sucursales      suc ON suc.id = pu.sucursal_id
        LEFT  JOIN liquidaciones   l   ON l.solicitud_id = s.id
        WHERE  a.empresa_id = @eid
        ORDER BY s.fecha_solicitud DESC
      `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const [solRes, valRes, actRes, liqRes] = await Promise.all([
      pool.request().input('id', sql.Int, id).query(`
        SELECT s.*, m.descripcion AS motivo_cese, m.codigo AS motivo_codigo,
               per.nombres + ' ' + per.apellido_paterno AS colaborador_nombre,
               per.numero_documento,
               car.nombre AS cargo_nombre, suc.nombre AS sucursal_nombre,
               co.fecha_inicio AS fecha_ingreso, co.salario_base
        FROM   solicitudes_desvinculacion s
        INNER JOIN cat_motivo_cese m ON m.id = s.motivo_cese_id
        INNER JOIN contratos       co ON co.id = s.contrato_id
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas        per ON per.id = el.persona_id
        INNER JOIN puestos         pu  ON pu.id = co.puesto_id
        INNER JOIN cargos          car ON car.id = pu.cargo_id
        INNER JOIN sucursales      suc ON suc.id = pu.sucursal_id
        WHERE  s.id = @id
      `),
      pool.request().input('id', sql.Int, id).query(`SELECT * FROM validacion_desvinculacion WHERE solicitud_id = @id ORDER BY id`),
      pool.request().input('id', sql.Int, id).query(`SELECT * FROM devolucion_activos WHERE solicitud_id = @id ORDER BY id`),
      pool.request().input('id', sql.Int, id).query(`SELECT * FROM liquidaciones WHERE solicitud_id = @id`)
    ]);

    const solicitud = solRes.recordset[0] || null;
    if (solicitud) {
      solicitud.validaciones = valRes.recordset;
      solicitud.activos      = actRes.recordset;
      solicitud.liquidacion  = liqRes.recordset[0] || null;
    }
    return solicitud;
  },

  async create(data, usuario_id) {
    const pool = getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      // Crear solicitud
      const reqSol = new sql.Request(tx);
      reqSol.input('contrato_id',    sql.Int,      data.contrato_id);
      reqSol.input('motivo_cese_id', sql.Int,      data.motivo_cese_id);
      reqSol.input('fecha_cese',     sql.Date,     data.fecha_cese_propuesta);
      reqSol.input('descripcion',    sql.NVarChar, data.descripcion || null);
      reqSol.input('registrado_por', sql.Int,      usuario_id);

      const resSol = await reqSol.query(`
        INSERT INTO solicitudes_desvinculacion (contrato_id, motivo_cese_id, fecha_cese_propuesta, descripcion, registrado_por, estado)
        OUTPUT INSERTED.id
        VALUES (@contrato_id, @motivo_cese_id, @fecha_cese, @descripcion, @registrado_por, 'INICIADA')
      `);
      const solId = resSol.recordset[0].id;

      // Crear checklist de validación base
      const checkItems = [
        'Entrega de Llaves/Accesos',
        'Entrega de Uniforme',
        'Eliminación de Accesos a Sistemas/Correo',
        'Firma de Documentos de Cese'
      ];
      for (const item of checkItems) {
        const reqCheck = new sql.Request(tx);
        reqCheck.input('sol_id', sql.Int, solId);
        reqCheck.input('item',   sql.NVarChar, item);
        await reqCheck.query(`INSERT INTO validacion_desvinculacion (solicitud_id, item) VALUES (@sol_id, @item)`);
      }

      await tx.commit();
      return solId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  async cambiarEstado(id, estado, usuario_id) {
    const pool = getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const req = new sql.Request(tx);
      req.input('id', sql.Int, id);
      req.input('estado', sql.NVarChar, estado);
      
      let query = `UPDATE solicitudes_desvinculacion SET estado=@estado`;
      if (estado === 'APROBADA') {
        req.input('usr', sql.Int, usuario_id);
        query += `, aprobado_por=@usr, aprobado_en=GETDATE()`;
      } else if (estado === 'CERRADA') {
        // Al cerrar, finalizamos el contrato
        const resContrato = await new sql.Request(tx)
          .input('sol_id', sql.Int, id)
          .query(`SELECT contrato_id FROM solicitudes_desvinculacion WHERE id=@sol_id`);
        if (resContrato.recordset.length) {
          const cId = resContrato.recordset[0].contrato_id;
          await new sql.Request(tx)
            .input('cid', sql.Int, cId)
            .query(`UPDATE contratos SET estado='FINALIZADO', fecha_fin=GETDATE() WHERE id=@cid`);
        }
      }
      query += ` WHERE id=@id`;
      await req.query(query);
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  },

  // ══════════════════════════════════════════════════════════
  //  VALIDACIONES Y ACTIVOS
  // ══════════════════════════════════════════════════════════
  async toggleValidacion(id, completado, usuario_id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('completado', sql.Bit, completado ? 1 : 0)
      .input('usr', sql.Int, usuario_id)
      .query(`
        UPDATE validacion_desvinculacion 
        SET completado=@completado, validado_por=@usr, validado_en=GETDATE() 
        WHERE id=@id
      `);
  },

  async addActivoDevolucion(data) {
    const pool = getPool();
    await pool.request()
      .input('sol_id', sql.Int, data.solicitud_id)
      .input('activo', sql.NVarChar, data.activo)
      .input('cantidad', sql.Decimal, data.cantidad || 1)
      .query(`INSERT INTO devolucion_activos (solicitud_id, activo, cantidad) VALUES (@sol_id, @activo, @cantidad)`);
  },

  async updateEstadoActivo(id, estado, observacion, usuario_id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('estado', sql.NVarChar, estado)
      .input('obs', sql.NVarChar, observacion || null)
      .input('usr', sql.Int, usuario_id)
      .query(`
        UPDATE devolucion_activos 
        SET estado_devolucion=@estado, observacion=@obs, recibido_por=@usr, fecha_devolucion=GETDATE()
        WHERE id=@id
      `);
  },

  // ══════════════════════════════════════════════════════════
  //  LIQUIDACIÓN
  // ══════════════════════════════════════════════════════════
  async upsertLiquidacion(sol_id, data, usuario_id) {
    const pool = getPool();
    const existing = await pool.request().input('sid', sql.Int, sol_id).query(`SELECT id FROM liquidaciones WHERE solicitud_id=@sid`);
    
    if (existing.recordset.length) {
      await pool.request()
        .input('sid', sql.Int, sol_id)
        .input('cts', sql.Decimal, data.cts_acumulada || 0)
        .input('vac', sql.Decimal, data.vacaciones_truncas || 0)
        .input('grat', sql.Decimal, data.gratificacion_trunca || 0)
        .input('indem', sql.Decimal, data.indemnizacion || 0)
        .input('deuda', sql.Decimal, data.deudas_descuento || 0)
        .input('total', sql.Decimal, data.total_liquidacion || 0)
        .input('usr', sql.Int, usuario_id)
        .query(`
          UPDATE liquidaciones
          SET cts_acumulada=@cts, vacaciones_truncas=@vac, gratificacion_trunca=@grat,
              indemnizacion=@indem, deudas_descuento=@deuda, total_liquidacion=@total,
              calculado_por=@usr, calculado_en=GETDATE(), estado='CALCULADA'
          WHERE solicitud_id=@sid
        `);
    } else {
      const resContrato = await pool.request().input('sid', sql.Int, sol_id)
        .query(`SELECT contrato_id FROM solicitudes_desvinculacion WHERE id=@sid`);
      const cId = resContrato.recordset[0].contrato_id;

      await pool.request()
        .input('sid', sql.Int, sol_id)
        .input('cid', sql.Int, cId)
        .input('cts', sql.Decimal, data.cts_acumulada || 0)
        .input('vac', sql.Decimal, data.vacaciones_truncas || 0)
        .input('grat', sql.Decimal, data.gratificacion_trunca || 0)
        .input('indem', sql.Decimal, data.indemnizacion || 0)
        .input('deuda', sql.Decimal, data.deudas_descuento || 0)
        .input('total', sql.Decimal, data.total_liquidacion || 0)
        .input('usr', sql.Int, usuario_id)
        .query(`
          INSERT INTO liquidaciones (solicitud_id, contrato_id, cts_acumulada, vacaciones_truncas, gratificacion_trunca, indemnizacion, deudas_descuento, total_liquidacion, calculado_por, calculado_en, estado)
          VALUES (@sid, @cid, @cts, @vac, @grat, @indem, @deuda, @total, @usr, GETDATE(), 'CALCULADA')
        `);
    }
  }
};

module.exports = DesvinculacionModel;
