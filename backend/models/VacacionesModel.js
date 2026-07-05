const { getPool, sql } = require('../config/database');

const VacacionesModel = {
  // ── Historial de Saldos Vacacionales por Colaborador ──
  async getSaldos() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT v.id, v.periodo_laboral, v.dias_generados, v.dias_tomados, v.dias_saldo,
             c.codigo AS contrato_codigo,
             p.nombres + ' ' + p.apellido_paterno AS colaborador_nombre
      FROM   vacaciones v
      INNER JOIN contratos c ON c.id = v.contrato_id
      INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
      INNER JOIN personas p ON p.id = el.persona_id
      ORDER BY p.apellido_paterno, v.periodo_laboral DESC
    `);
    return res.recordset;
  },

  // Inicializar saldo vacacional para un colaborador
  async createSaldo(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('contrato_id', sql.Int,      data.contrato_id)
      .input('periodo',     sql.NVarChar, data.periodo_laboral) // Ej: '2025-2026'
      .input('generados',   sql.Decimal,  data.dias_generados || 30.00)
      .query(`
        INSERT INTO vacaciones (contrato_id, periodo_laboral, dias_generados, dias_tomados, dias_saldo)
        OUTPUT INSERTED.id
        VALUES (@contrato_id, @periodo, @generados, 0, @generados)
      `);
    return res.recordset[0].id;
  },

  // ── Solicitudes de Vacaciones ──
  async getSolicitudes() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT sv.id, sv.fecha_inicio, sv.fecha_fin, sv.dias_solicitados, sv.motivo, sv.estado,
             v.periodo_laboral,
             c.codigo AS contrato_codigo,
             p.nombres + ' ' + p.apellido_paterno AS colaborador_nombre
      FROM   solicitudes_vacaciones sv
      INNER JOIN vacaciones v ON v.id = sv.vacaciones_id
      INNER JOIN contratos c ON c.id = v.contrato_id
      INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
      INNER JOIN personas p ON p.id = el.persona_id
      ORDER BY sv.fecha_inicio DESC
    `);
    return res.recordset;
  },

  async createSolicitud(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('vacaciones_id', sql.Int,      data.vacaciones_id)
      .input('inicio',        sql.Date,     data.fecha_inicio)
      .input('fin',           sql.Date,     data.fecha_fin)
      .input('dias',          sql.Decimal,  data.dias_solicitados)
      .input('motivo',        sql.NVarChar, data.motivo || null)
      .query(`
        INSERT INTO solicitudes_vacaciones (vacaciones_id, fecha_inicio, fecha_fin, dias_solicitados, motivo, estado)
        OUTPUT INSERTED.id
        VALUES (@vacaciones_id, @inicio, @fin, @dias, @motivo, 'PENDIENTE')
      `);
    return res.recordset[0].id;
  },

  // ── Transacción para Aprobar Solicitud y descontar del saldo ──
  async procesarSolicitud(id, estado, aprobadoPorUsuarioId) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Obtener los detalles de la solicitud
      const reqInfo = new sql.Request(transaction);
      reqInfo.input('id', sql.Int, id);
      const resInfo = await reqInfo.query(`
        SELECT vacaciones_id, dias_solicitados, estado 
        FROM   solicitudes_vacaciones 
        WHERE  id = @id
      `);
      
      const solicitud = resInfo.recordset[0];
      if (!solicitud) throw new Error('Solicitud no encontrada');
      if (solicitud.estado !== 'PENDIENTE') throw new Error('La solicitud ya fue procesada previamente');

      // 2. Actualizar estado de la solicitud
      const reqUpdate = new sql.Request(transaction);
      reqUpdate.input('id',      sql.Int,      id);
      reqUpdate.input('estado',  sql.NVarChar, estado);
      reqUpdate.input('user_id', sql.Int,      aprobadoPorUsuarioId);
      await reqUpdate.query(`
        UPDATE solicitudes_vacaciones
        SET    estado = @estado, aprobado_por = @user_id, aprobado_en = GETDATE()
        WHERE  id = @id
      `);

      // 3. Si es APROBADA, descontar del saldo en vacaciones
      if (estado === 'APROBADA') {
        const reqSaldo = new sql.Request(transaction);
        reqSaldo.input('vac_id', sql.Int,     solicitud.vacaciones_id);
        reqSaldo.input('dias',   sql.Decimal, solicitud.dias_solicitados);
        
        await reqSaldo.query(`
          UPDATE vacaciones
          SET    dias_tomados = dias_tomados + @dias,
                 dias_saldo   = dias_saldo - @dias
          WHERE  id = @vac_id
        `);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
};

module.exports = VacacionesModel;
