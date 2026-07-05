const { getPool, sql } = require('../config/database');

const LicenciaModel = {
  // ── Licencias ──
  async findAllLicencias() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT l.id, l.fecha_inicio, l.fecha_fin, l.dias_totales, l.motivo, l.sustento_url, l.estado,
             tl.descripcion AS tipo_licencia_descripcion,
             c.codigo AS contrato_codigo,
             p.nombres + ' ' + p.apellido_paterno AS colaborador_nombre
      FROM   licencias l
      INNER JOIN contratos c ON c.id = l.contrato_id
      INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
      INNER JOIN personas p ON p.id = el.persona_id
      INNER JOIN cat_tipo_licencia tl ON tl.id = l.tipo_licencia_id
      ORDER BY l.fecha_inicio DESC
    `);
    return res.recordset;
  },

  async createLicencia(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('contrato_id',      sql.Int,      data.contrato_id)
      .input('tipo_licencia_id', sql.Int,      data.tipo_licencia_id)
      .input('inicio',           sql.Date,     data.fecha_inicio)
      .input('fin',              sql.Date,     data.fecha_fin)
      .input('dias',             sql.Decimal,  data.dias_totales)
      .input('motivo',           sql.NVarChar, data.motivo || null)
      .input('sustento',         sql.NVarChar, data.sustento_url || null)
      .query(`
        INSERT INTO licencias (contrato_id, tipo_licencia_id, fecha_inicio, fecha_fin, dias_totales, motivo, sustento_url, estado)
        OUTPUT INSERTED.id
        VALUES (@contrato_id, @tipo_licencia_id, @inicio, @fin, @dias, @motivo, @sustento, 'PENDIENTE')
      `);
    return res.recordset[0].id;
  },

  async procesarLicencia(id, estado, aprobadoPorUsuarioId) {
    const pool = getPool();
    await pool.request()
      .input('id',      sql.Int,      id)
      .input('estado',  sql.NVarChar, estado)
      .input('user_id', sql.Int,      aprobadoPorUsuarioId)
      .query(`
        UPDATE licencias
        SET    estado = @estado, aprobado_por = @user_id, aprobado_en = GETDATE()
        WHERE  id = @id
      `);
  },

  // ── Permisos Laborales (por Horas) ──
  async findAllPermisos() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT pl.id, pl.fecha,
             LEFT(CAST(pl.hora_inicio AS VARCHAR), 5) AS hora_inicio,
             LEFT(CAST(pl.hora_fin AS VARCHAR), 5) AS hora_fin,
             pl.motivo, pl.con_goce_haber, pl.estado,
             c.codigo AS contrato_codigo,
             p.nombres + ' ' + p.apellido_paterno AS colaborador_nombre
      FROM   permisos_laborales pl
      INNER JOIN contratos c ON c.id = pl.contrato_id
      INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
      INNER JOIN personas p ON p.id = el.persona_id
      ORDER BY pl.fecha DESC, pl.hora_inicio DESC
    `);
    return res.recordset;
  },

  async createPermiso(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('contrato_id', sql.Int,      data.contrato_id)
      .input('fecha',       sql.Date,     data.fecha)
      .input('inicio',      sql.VarChar,  data.hora_inicio)
      .input('fin',         sql.VarChar,  data.hora_fin)
      .input('motivo',      sql.NVarChar, data.motivo)
      .input('con_goce',    sql.Bit,      data.con_goce_haber ? 1 : 0)
      .query(`
        INSERT INTO permisos_laborales (contrato_id, fecha, hora_inicio, hora_fin, motivo, con_goce_haber, estado)
        OUTPUT INSERTED.id
        VALUES (@contrato_id, @fecha, CAST(@inicio AS TIME), CAST(@fin AS TIME), @motivo, @con_goce, 'PENDIENTE')
      `);
    return res.recordset[0].id;
  },

  async procesarPermiso(id, estado, aprobadoPorUsuarioId) {
    const pool = getPool();
    await pool.request()
      .input('id',      sql.Int,      id)
      .input('estado',  sql.NVarChar, estado)
      .input('user_id', sql.Int,      aprobadoPorUsuarioId)
      .query(`
        UPDATE permisos_laborales
        SET    estado = @estado, aprobado_por = @user_id, aprobado_en = GETDATE()
        WHERE  id = @id
      `);
  },

  // Catálogos auxiliares
  async getTiposLicencia() {
    const pool = getPool();
    const res = await pool.request().query("SELECT id, codigo, descripcion, con_goce_haber FROM cat_tipo_licencia WHERE activo = 1");
    return res.recordset;
  }
};

module.exports = LicenciaModel;
