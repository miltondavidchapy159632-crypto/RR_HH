const { getPool, sql } = require('../config/database');

const HorarioModel = {
  async findAll() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT h.id, h.nombre, h.activo,
             s.nombre AS sucursal_nombre,
             c.nombre AS cargo_nombre,
             tlu.nombre AS lunes_turno,
             tma.nombre AS martes_turno,
             tmi.nombre AS miercoles_turno,
             tju.nombre AS jueves_turno,
             tvi.nombre AS viernes_turno,
             tsa.nombre AS sabado_turno,
             tdo.nombre AS domingo_turno
      FROM   horarios h
      INNER JOIN sucursales s ON s.id = h.sucursal_id
      LEFT JOIN cargos c     ON c.id = h.cargo_id
      LEFT JOIN turnos tlu   ON tlu.id = h.lunes_turno_id
      LEFT JOIN turnos tma   ON tma.id = h.martes_turno_id
      LEFT JOIN turnos tmi   ON tmi.id = h.miercoles_turno_id
      LEFT JOIN turnos tju   ON tju.id = h.jueves_turno_id
      LEFT JOIN turnos tvi   ON tvi.id = h.viernes_turno_id
      LEFT JOIN turnos tsa   ON tsa.id = h.sabado_turno_id
      LEFT JOIN turnos tdo   ON tdo.id = h.domingo_turno_id
      ORDER BY h.nombre
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM horarios WHERE id = @id');
    return res.recordset[0] || null;
  },

  async create(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('sid',   sql.Int,      data.sucursal_id)
      .input('cid',   sql.Int,      data.cargo_id || null)
      .input('nombre',sql.NVarChar, data.nombre)
      .input('lu',    sql.Int,      data.lunes_turno_id || null)
      .input('ma',    sql.Int,      data.martes_turno_id || null)
      .input('mi',    sql.Int,      data.miercoles_turno_id || null)
      .input('ju',    sql.Int,      data.jueves_turno_id || null)
      .input('vi',    sql.Int,      data.viernes_turno_id || null)
      .input('sa',    sql.Int,      data.sabado_turno_id || null)
      .input('do',    sql.Int,      data.domingo_turno_id || null)
      .query(`
        INSERT INTO horarios (
          sucursal_id, cargo_id, nombre,
          lunes_turno_id, martes_turno_id, miercoles_turno_id, jueves_turno_id, viernes_turno_id, sabado_turno_id, domingo_turno_id
        )
        OUTPUT INSERTED.id
        VALUES (@sid, @cid, @nombre, @lu, @ma, @mi, @ju, @vi, @sa, @do)
      `);
    return res.recordset[0].id;
  },

  async update(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('sid',    sql.Int,      data.sucursal_id)
      .input('cid',    sql.Int,      data.cargo_id || null)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('lu',     sql.Int,      data.lunes_turno_id || null)
      .input('ma',     sql.Int,      data.martes_turno_id || null)
      .input('mi',     sql.Int,      data.miercoles_turno_id || null)
      .input('ju',     sql.Int,      data.jueves_turno_id || null)
      .input('vi',     sql.Int,      data.viernes_turno_id || null)
      .input('sa',     sql.Int,      data.sabado_turno_id || null)
      .input('do',     sql.Int,      data.domingo_turno_id || null)
      .input('activo', sql.Bit,      data.activo ?? 1)
      .query(`
        UPDATE horarios
        SET    sucursal_id = @sid, cargo_id = @cid, nombre = @nombre,
               lunes_turno_id = @lu, martes_turno_id = @ma, miercoles_turno_id = @mi,
               jueves_turno_id = @ju, viernes_turno_id = @vi, sabado_turno_id = @sa, domingo_turno_id = @do,
               activo = @activo
        WHERE  id = @id
      `);
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE horarios SET activo = 0 WHERE id = @id');
  },

  // ── Métodos de Asignación de Horarios a colaboradores (Contratos) ──
  async getAsignaciones() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT ah.id, ah.contrato_id, ah.horario_id,
             FORMAT(ah.fecha_inicio, 'dd/MM/yyyy') AS fecha_inicio,
             FORMAT(ah.fecha_fin, 'dd/MM/yyyy') AS fecha_fin,
             c.codigo AS contrato_codigo,
             h.nombre AS horario_nombre,
             per.nombres + ' ' + per.apellido_paterno AS colaborador_nombre
      FROM   asignacion_horarios ah
      INNER JOIN contratos c ON c.id = ah.contrato_id
      INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
      INNER JOIN personas per ON per.id = el.persona_id
      INNER JOIN horarios h ON h.id = ah.horario_id
      ORDER BY ah.creado_en DESC
    `);
    return res.recordset;
  },

  async createAsignacion(data, asignadoPorUsuarioId) {
    const pool = getPool();
    const res = await pool.request()
      .input('contrato_id', sql.Int,      data.contrato_id)
      .input('horario_id',  sql.Int,      data.horario_id)
      .input('fecha_ini',   sql.Date,     data.fecha_inicio)
      .input('fecha_fin',   sql.Date,     data.fecha_fin || null)
      .input('creador_id',  sql.Int,      asignadoPorUsuarioId)
      .query(`
        INSERT INTO asignacion_horarios (contrato_id, horario_id, fecha_inicio, fecha_fin, asignado_por)
        OUTPUT INSERTED.id
        VALUES (@contrato_id, @horario_id, @fecha_ini, @fecha_fin, @creador_id)
      `);
    return res.recordset[0].id;
  },

  async deleteAsignacion(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM asignacion_horarios WHERE id = @id');
  }
};

module.exports = HorarioModel;
