const { getPool, sql } = require('../config/database');

const EmpresaModel = {
  async findAll() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT id, ruc, razon_social, nombre_comercial,
             direccion_fiscal, telefono, email_corporativo, activo,
             FORMAT(fecha_creacion, 'dd/MM/yyyy') AS fecha_creacion,
             (SELECT COUNT(*) FROM sucursales s WHERE s.empresa_id = e.id) AS total_sucursales
      FROM   empresas e
      ORDER  BY razon_social
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, ruc, razon_social, nombre_comercial,
               direccion_fiscal, telefono, email_corporativo, activo
        FROM   empresas WHERE id = @id
      `);
    return res.recordset[0] || null;
  },

  async create(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('ruc',   sql.NVarChar, data.ruc)
      .input('rs',    sql.NVarChar, data.razon_social)
      .input('nc',    sql.NVarChar, data.nombre_comercial || null)
      .input('dir',   sql.NVarChar, data.direccion_fiscal || null)
      .input('tel',   sql.NVarChar, data.telefono || null)
      .input('email', sql.NVarChar, data.email_corporativo || null)
      .query(`
        INSERT INTO empresas (ruc, razon_social, nombre_comercial, direccion_fiscal, telefono, email_corporativo)
        OUTPUT INSERTED.id
        VALUES (@ruc, @rs, @nc, @dir, @tel, @email)
      `);
    return res.recordset[0].id;
  },

  async update(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',    sql.Int,      id)
      .input('ruc',   sql.NVarChar, data.ruc)
      .input('rs',    sql.NVarChar, data.razon_social)
      .input('nc',    sql.NVarChar, data.nombre_comercial || null)
      .input('dir',   sql.NVarChar, data.direccion_fiscal || null)
      .input('tel',   sql.NVarChar, data.telefono || null)
      .input('email', sql.NVarChar, data.email_corporativo || null)
      .input('activo',sql.Bit,      data.activo ?? 1)
      .query(`
        UPDATE empresas
        SET ruc = @ruc, razon_social = @rs, nombre_comercial = @nc,
            direccion_fiscal = @dir, telefono = @tel, email_corporativo = @email, activo = @activo
        WHERE id = @id
      `);
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE empresas SET activo = 0 WHERE id = @id');
  }
};

module.exports = EmpresaModel;
