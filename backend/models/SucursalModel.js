const { getPool, sql } = require('../config/database');

const SucursalModel = {
  async findAll(empresaId) {
    const pool = getPool();
    const req = pool.request();
    let where = '';
    if (empresaId) {
      req.input('eid', sql.Int, empresaId);
      where = 'WHERE s.empresa_id = @eid';
    }
    const res = await req.query(`
      SELECT s.id, s.empresa_id, e.razon_social AS empresa_nombre,
             s.codigo, s.nombre, s.direccion, s.telefono, s.email, s.activo,
             FORMAT(s.fecha_creacion, 'dd/MM/yyyy') AS fecha_creacion
      FROM   sucursales s
      INNER JOIN empresas e ON e.id = s.empresa_id
      ${where}
      ORDER  BY s.nombre
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT s.id, s.empresa_id, e.razon_social AS empresa_nombre,
               s.codigo, s.nombre, s.direccion, s.ubigeo, s.telefono, s.email, s.activo
        FROM   sucursales s
        INNER JOIN empresas e ON e.id = s.empresa_id
        WHERE  s.id = @id
      `);
    return res.recordset[0] || null;
  },

  async create(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('eid',    sql.Int,      data.empresa_id)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('dir',    sql.NVarChar, data.direccion || null)
      .input('tel',    sql.NVarChar, data.telefono || null)
      .input('email',  sql.NVarChar, data.email || null)
      .query(`
        INSERT INTO sucursales (empresa_id, codigo, nombre, direccion, telefono, email)
        OUTPUT INSERTED.id
        VALUES (@eid, @codigo, @nombre, @dir, @tel, @email)
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
      .input('dir',    sql.NVarChar, data.direccion || null)
      .input('tel',    sql.NVarChar, data.telefono || null)
      .input('email',  sql.NVarChar, data.email || null)
      .input('activo', sql.Bit,      data.activo ?? 1)
      .query(`
        UPDATE sucursales
        SET empresa_id = @eid, codigo = @codigo, nombre = @nombre,
            direccion = @dir, telefono = @tel, email = @email, activo = @activo
        WHERE id = @id
      `);
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE sucursales SET activo = 0 WHERE id = @id');
  }
};

module.exports = SucursalModel;
