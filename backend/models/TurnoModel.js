const { getPool, sql } = require('../config/database');

const TurnoModel = {
  async findAll(empresaId) {
    const pool = getPool();
    const req = pool.request();
    let where = '';
    if (empresaId) {
      req.input('eid', sql.Int, empresaId);
      where = 'WHERE empresa_id = @eid';
    }
    const res = await req.query(`
      SELECT id, empresa_id, codigo, nombre,
             LEFT(CAST(hora_entrada AS VARCHAR), 5) AS hora_entrada,
             LEFT(CAST(hora_salida AS VARCHAR), 5) AS hora_salida,
             tolerancia_min, horas_diarias, nocturno, activo
      FROM   turnos
      ${where}
      ORDER BY nombre
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, empresa_id, codigo, nombre,
               LEFT(CAST(hora_entrada AS VARCHAR), 5) AS hora_entrada,
               LEFT(CAST(hora_salida AS VARCHAR), 5) AS hora_salida,
               tolerancia_min, horas_diarias, nocturno, activo
        FROM   turnos
        WHERE  id = @id
      `);
    return res.recordset[0] || null;
  },

  async create(data) {
    const pool = getPool();
    // Convertir horas formato 'HH:MM' a objeto TIME o string
    const res = await pool.request()
      .input('eid',    sql.Int,      data.empresa_id)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('entrada',sql.VarChar,  data.hora_entrada) // '08:00'
      .input('salida', sql.VarChar,  data.hora_salida)  // '17:00'
      .input('tol',    sql.SmallInt, data.tolerancia_min || 5)
      .input('horas',  sql.Decimal,  data.horas_diarias || 8.00)
      .input('noc',    sql.Bit,      data.nocturno ? 1 : 0)
      .query(`
        INSERT INTO turnos (empresa_id, codigo, nombre, hora_entrada, hora_salida, tolerancia_min, horas_diarias, nocturno)
        OUTPUT INSERTED.id
        VALUES (@eid, @codigo, @nombre, CAST(@entrada AS TIME), CAST(@salida AS TIME), @tol, @horas, @noc)
      `);
    return res.recordset[0].id;
  },

  async update(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('eid',    sql.Int,      data.empresa_id)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('entrada',sql.VarChar,  data.hora_entrada)
      .input('salida', sql.VarChar,  data.hora_salida)
      .input('tol',    sql.SmallInt, data.tolerancia_min || 5)
      .input('horas',  sql.Decimal,  data.horas_diarias || 8.00)
      .input('noc',    sql.Bit,      data.nocturno ? 1 : 0)
      .input('activo', sql.Bit,      data.activo ?? 1)
      .query(`
        UPDATE turnos
        SET    empresa_id = @eid, codigo = @codigo, nombre = @nombre,
               hora_entrada = CAST(@entrada AS TIME), hora_salida = CAST(@salida AS TIME),
               tolerancia_min = @tol, horas_diarias = @horas, nocturno = @noc, activo = @activo
        WHERE  id = @id
      `);
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE turnos SET activo = 0 WHERE id = @id');
  }
};

module.exports = TurnoModel;
