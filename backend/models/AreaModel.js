const { getPool, sql } = require('../config/database');

const AreaModel = {
  async findAll(empresaId) {
    const pool = getPool();
    const req = pool.request();
    let where = '';
    if (empresaId) {
      req.input('eid', sql.Int, empresaId);
      where = 'WHERE a.empresa_id = @eid';
    }
    const res = await req.query(`
      SELECT a.id, a.empresa_id, e.razon_social AS empresa_nombre,
             a.codigo, a.nombre, a.descripcion, a.activo,
             ap.nombre AS area_padre_nombre,
             (SELECT COUNT(*) FROM cargos c WHERE c.area_id = a.id) AS total_cargos
      FROM   areas a
      INNER JOIN empresas e ON e.id = a.empresa_id
      LEFT  JOIN areas ap  ON ap.id = a.area_padre_id
      ${where}
      ORDER  BY a.nombre
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT a.id, a.empresa_id, a.area_padre_id, a.codigo, a.nombre, a.descripcion, a.activo
        FROM   areas a WHERE a.id = @id
      `);
    return res.recordset[0] || null;
  },

  async create(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('eid',    sql.Int,      data.empresa_id)
      .input('padre',  sql.Int,      data.area_padre_id || null)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('desc',   sql.NVarChar, data.descripcion || null)
      .query(`
        INSERT INTO areas (empresa_id, area_padre_id, codigo, nombre, descripcion)
        OUTPUT INSERTED.id
        VALUES (@eid, @padre, @codigo, @nombre, @desc)
      `);
    return res.recordset[0].id;
  },

  async update(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('eid',    sql.Int,      data.empresa_id)
      .input('padre',  sql.Int,      data.area_padre_id || null)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('desc',   sql.NVarChar, data.descripcion || null)
      .input('activo', sql.Bit,      data.activo ?? 1)
      .query(`
        UPDATE areas
        SET empresa_id = @eid, area_padre_id = @padre, codigo = @codigo,
            nombre = @nombre, descripcion = @desc, activo = @activo
        WHERE id = @id
      `);
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE areas SET activo = 0 WHERE id = @id');
  }
};

module.exports = AreaModel;
