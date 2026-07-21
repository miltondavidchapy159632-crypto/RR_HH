// ============================================================
//  SCGRH — EvaluacionDesempenoModel.js
//  Evaluaciones de desempeño + criterios de detalle +
//  planes de desarrollo individual
// ============================================================
const { getPool, sql } = require('../config/database');

const EvaluacionDesempenoModel = {

  // ── EVALUACIONES ─────────────────────────────────────────

  async findAll(empresa_id) {
    const pool = getPool();
    const res  = await pool.request()
      .input('empresa_id', sql.Int, empresa_id)
      .query(`
        SELECT  ed.id, ed.periodo, ed.puntaje_total, ed.categoria,
                ed.estado, ed.fecha_evaluacion,
                per.nombres + ' ' + per.apellido_paterno + ' ' + ISNULL(per.apellido_materno,'') AS evaluado_nombre,
                per.id   AS persona_id,
                car.nombre AS cargo_nombre,
                s.nombre   AS sucursal_nombre,
                u.username AS evaluador_nombre,
                (SELECT COUNT(*) FROM detalle_evaluacion_desempeno d WHERE d.evaluacion_id = ed.id) AS total_criterios,
                (SELECT COUNT(*) FROM planes_desarrollo pd WHERE pd.evaluacion_id = ed.id) AS total_planes
        FROM    evaluaciones_desempeno ed
        INNER JOIN contratos       co  ON co.id  = ed.evaluado_id
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas        per ON per.id = el.persona_id
        INNER JOIN puestos         pu  ON pu.id  = co.puesto_id
        INNER JOIN cargos          car ON car.id = pu.cargo_id
        INNER JOIN areas           a   ON a.id   = car.area_id
        INNER JOIN sucursales      s   ON s.id   = pu.sucursal_id
        INNER JOIN usuarios        u   ON u.id   = ed.evaluador_id
        WHERE   a.empresa_id = @empresa_id
        ORDER BY ed.fecha_evaluacion DESC, ed.periodo DESC
      `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const [evalRes, detRes, planesRes] = await Promise.all([
      pool.request().input('id', sql.Int, id).query(`
        SELECT  ed.*,
                per.nombres + ' ' + per.apellido_paterno + ' ' + ISNULL(per.apellido_materno,'') AS evaluado_nombre,
                per.email_personal, per.email_corporativo,
                car.nombre AS cargo_nombre,
                s.nombre   AS sucursal_nombre,
                u.username AS evaluador_nombre,
                co.salario_base
        FROM    evaluaciones_desempeno ed
        INNER JOIN contratos       co  ON co.id  = ed.evaluado_id
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas        per ON per.id = el.persona_id
        INNER JOIN puestos         pu  ON pu.id  = co.puesto_id
        INNER JOIN cargos          car ON car.id = pu.cargo_id
        INNER JOIN sucursales      s   ON s.id   = pu.sucursal_id
        INNER JOIN usuarios        u   ON u.id   = ed.evaluador_id
        WHERE   ed.id = @id
      `),
      pool.request().input('id', sql.Int, id).query(`
        SELECT id, criterio, puntaje, puntaje_maximo, comentario
        FROM   detalle_evaluacion_desempeno
        WHERE  evaluacion_id = @id
        ORDER  BY id
      `),
      pool.request().input('id', sql.Int, id).query(`
        SELECT id, objetivo, acciones, fecha_inicio, fecha_meta, estado, resultado
        FROM   planes_desarrollo
        WHERE  evaluacion_id = @id
        ORDER  BY id
      `)
    ]);
    const ev = evalRes.recordset[0] || null;
    if (ev) {
      ev.criterios = detRes.recordset;
      ev.planes    = planesRes.recordset;
    }
    return ev;
  },

  // Crear evaluación con sus criterios en una transacción
  async create(data, evaluadorId) {
    const pool = getPool();
    const tx   = new sql.Transaction(pool);
    await tx.begin();
    try {
      // 1. Cabecera
      const req1 = new sql.Request(tx);
      req1.input('evaluado_id',    sql.Int,      data.evaluado_id);      // contrato_id
      req1.input('evaluador_id',   sql.Int,      evaluadorId);
      req1.input('periodo',        sql.NVarChar, data.periodo);
      req1.input('fortalezas',     sql.NVarChar, data.fortalezas    || null);
      req1.input('areas_mejora',   sql.NVarChar, data.areas_mejora  || null);
      req1.input('estado',         sql.NVarChar, data.estado        || 'BORRADOR');
      req1.input('fecha_eval',     sql.Date,     data.fecha_evaluacion || new Date());

      const r1  = await req1.query(`
        INSERT INTO evaluaciones_desempeno
          (evaluado_id, evaluador_id, periodo, fortalezas, areas_mejora, estado, fecha_evaluacion)
        OUTPUT INSERTED.id
        VALUES (@evaluado_id, @evaluador_id, @periodo, @fortalezas, @areas_mejora, @estado, @fecha_eval)
      `);
      const evalId = r1.recordset[0].id;

      // 2. Criterios de detalle
      let totalPuntaje = 0, totalMax = 0;
      if (data.criterios && data.criterios.length) {
        for (const c of data.criterios) {
          const req2 = new sql.Request(tx);
          req2.input('eval_id',    sql.Int,      evalId);
          req2.input('criterio',   sql.NVarChar, c.criterio);
          req2.input('puntaje',    sql.Decimal,  parseFloat(c.puntaje));
          req2.input('puntaje_max',sql.Decimal,  parseFloat(c.puntaje_maximo || 10));
          req2.input('comentario', sql.NVarChar, c.comentario || null);
          await req2.query(`
            INSERT INTO detalle_evaluacion_desempeno
              (evaluacion_id, criterio, puntaje, puntaje_maximo, comentario)
            VALUES (@eval_id, @criterio, @puntaje, @puntaje_max, @comentario)
          `);
          totalPuntaje += parseFloat(c.puntaje);
          totalMax     += parseFloat(c.puntaje_maximo || 10);
        }

        // 3. Calcular puntaje total (% sobre 100) y categoría
        const pct      = totalMax > 0 ? (totalPuntaje / totalMax) * 100 : 0;
        const categoria = calcCategoria(pct);

        const req3 = new sql.Request(tx);
        req3.input('id',       sql.Int,      evalId);
        req3.input('puntaje',  sql.Decimal,  Math.round(pct * 100) / 100);
        req3.input('categoria',sql.NVarChar, categoria);
        await req3.query(`
          UPDATE evaluaciones_desempeno
          SET    puntaje_total = @puntaje, categoria = @categoria
          WHERE  id = @id
        `);
      }

      await tx.commit();
      return evalId;
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // Actualizar estado de la evaluación
  async cambiarEstado(id, estado) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('estado', sql.NVarChar, estado)
      .query(`UPDATE evaluaciones_desempeno SET estado = @estado WHERE id = @id`);
  },

  // Agregar / actualizar criterios individualmente
  async upsertCriterios(evalId, criterios) {
    const pool = getPool();
    const tx   = new sql.Transaction(pool);
    await tx.begin();
    try {
      // Borrar criterios anteriores y reinsertar
      await new sql.Request(tx)
        .input('id', sql.Int, evalId)
        .query(`DELETE FROM detalle_evaluacion_desempeno WHERE evaluacion_id = @id`);

      let totalPuntaje = 0, totalMax = 0;
      for (const c of criterios) {
        const req = new sql.Request(tx);
        req.input('eval_id',    sql.Int,      evalId);
        req.input('criterio',   sql.NVarChar, c.criterio);
        req.input('puntaje',    sql.Decimal,  parseFloat(c.puntaje));
        req.input('puntaje_max',sql.Decimal,  parseFloat(c.puntaje_maximo || 10));
        req.input('comentario', sql.NVarChar, c.comentario || null);
        await req.query(`
          INSERT INTO detalle_evaluacion_desempeno
            (evaluacion_id, criterio, puntaje, puntaje_maximo, comentario)
          VALUES (@eval_id, @criterio, @puntaje, @puntaje_max, @comentario)
        `);
        totalPuntaje += parseFloat(c.puntaje);
        totalMax     += parseFloat(c.puntaje_maximo || 10);
      }

      const pct      = totalMax > 0 ? (totalPuntaje / totalMax) * 100 : 0;
      const categoria = calcCategoria(pct);
      const req3 = new sql.Request(tx);
      req3.input('id',       sql.Int,      evalId);
      req3.input('puntaje',  sql.Decimal,  Math.round(pct * 100) / 100);
      req3.input('categoria',sql.NVarChar, categoria);
      await req3.query(`
        UPDATE evaluaciones_desempeno
        SET    puntaje_total = @puntaje, categoria = @categoria
        WHERE  id = @id
      `);

      await tx.commit();
      return { puntaje_total: Math.round(pct * 100) / 100, categoria };
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  },

  // ── PLANES DE DESARROLLO ─────────────────────────────────

  async createPlanDesarrollo(data) {
    const pool = getPool();
    const res  = await pool.request()
      .input('contrato_id',   sql.Int,      data.contrato_id)
      .input('evaluacion_id', sql.Int,      data.evaluacion_id || null)
      .input('objetivo',      sql.NVarChar, data.objetivo)
      .input('acciones',      sql.NVarChar, data.acciones      || null)
      .input('fecha_inicio',  sql.Date,     data.fecha_inicio)
      .input('fecha_meta',    sql.Date,     data.fecha_meta    || null)
      .input('estado',        sql.NVarChar, data.estado        || 'ACTIVO')
      .query(`
        INSERT INTO planes_desarrollo
          (contrato_id, evaluacion_id, objetivo, acciones, fecha_inicio, fecha_meta, estado)
        OUTPUT INSERTED.id
        VALUES
          (@contrato_id, @evaluacion_id, @objetivo, @acciones, @fecha_inicio, @fecha_meta, @estado)
      `);
    return res.recordset[0].id;
  },

  async updatePlanDesarrollo(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',          sql.Int,      id)
      .input('objetivo',    sql.NVarChar, data.objetivo)
      .input('acciones',    sql.NVarChar, data.acciones   || null)
      .input('fecha_meta',  sql.Date,     data.fecha_meta || null)
      .input('estado',      sql.NVarChar, data.estado     || 'ACTIVO')
      .input('resultado',   sql.NVarChar, data.resultado  || null)
      .query(`
        UPDATE planes_desarrollo
        SET    objetivo = @objetivo, acciones = @acciones,
               fecha_meta = @fecha_meta, estado = @estado, resultado = @resultado
        WHERE  id = @id
      `);
  },

  // ── CATÁLOGOS ─────────────────────────────────────────────

  async getContratosActivos(empresa_id) {
    const pool = getPool();
    const res  = await pool.request()
      .input('empresa_id', sql.Int, empresa_id)
      .query(`
        SELECT co.id AS contrato_id,
               per.nombres + ' ' + per.apellido_paterno + ' ' + ISNULL(per.apellido_materno,'') AS nombre_completo,
               car.nombre AS cargo_nombre,
               s.nombre   AS sucursal_nombre,
               co.fecha_inicio, co.salario_base
        FROM   contratos co
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas  per ON per.id  = el.persona_id
        INNER JOIN puestos   pu  ON pu.id   = co.puesto_id
        INNER JOIN cargos    car ON car.id  = pu.cargo_id
        INNER JOIN areas     a   ON a.id    = car.area_id
        INNER JOIN sucursales s  ON s.id    = pu.sucursal_id
        WHERE  co.estado = 'VIGENTE'
          AND  a.empresa_id = @empresa_id
        ORDER BY per.apellido_paterno, per.nombres
      `);
    return res.recordset;
  }
};

// ── Helper privado: categoría por puntaje ─────────────────
function calcCategoria(pct) {
  if (pct >= 90) return 'EXCELENTE';
  if (pct >= 75) return 'MUY_BUENO';
  if (pct >= 60) return 'BUENO';
  if (pct >= 45) return 'REGULAR';
  return 'DEFICIENTE';
}

module.exports = EvaluacionDesempenoModel;
