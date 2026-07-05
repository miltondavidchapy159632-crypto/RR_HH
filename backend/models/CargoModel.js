const { getPool, sql } = require('../config/database');

const CargoModel = {
  async findAll(areaId) {
    const pool = getPool();
    const req = pool.request();
    let where = '';
    if (areaId) {
      req.input('aid', sql.Int, areaId);
      where = 'WHERE c.area_id = @aid';
    }
    const res = await req.query(`
      SELECT c.id, c.area_id, a.nombre AS area_nombre,
             c.codigo, c.nombre, c.descripcion, c.nivel_jerarquico,
             c.salario_min, c.salario_max, c.activo
      FROM   cargos c
      INNER JOIN areas a ON a.id = c.area_id
      ${where}
      ORDER  BY c.nivel_jerarquico, c.nombre
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT c.id, c.area_id, a.nombre AS area_nombre, c.codigo,
               c.nombre, c.descripcion, c.nivel_jerarquico, c.salario_min, c.salario_max, c.activo
        FROM   cargos c
        INNER JOIN areas a ON a.id = c.area_id
        WHERE  c.id = @id
      `);
    return res.recordset[0] || null;
  },

  async create(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('aid',    sql.Int,      data.area_id)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('desc',   sql.NVarChar, data.descripcion || null)
      .input('nivel',  sql.SmallInt, data.nivel_jerarquico || 1)
      .input('smin',   sql.Decimal,  data.salario_min || null)
      .input('smax',   sql.Decimal,  data.salario_max || null)
      .query(`
        INSERT INTO cargos (area_id, codigo, nombre, descripcion, nivel_jerarquico, salario_min, salario_max)
        OUTPUT INSERTED.id
        VALUES (@aid, @codigo, @nombre, @desc, @nivel, @smin, @smax)
      `);
    return res.recordset[0].id;
  },

  async update(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('aid',    sql.Int,      data.area_id)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('desc',   sql.NVarChar, data.descripcion || null)
      .input('nivel',  sql.SmallInt, data.nivel_jerarquico || 1)
      .input('smin',   sql.Decimal,  data.salario_min || null)
      .input('smax',   sql.Decimal,  data.salario_max || null)
      .input('activo', sql.Bit,      data.activo ?? 1)
      .query(`
        UPDATE cargos
        SET area_id = @aid, codigo = @codigo, nombre = @nombre,
            descripcion = @desc, nivel_jerarquico = @nivel,
            salario_min = @smin, salario_max = @smax, activo = @activo
        WHERE id = @id
      `);
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE cargos SET activo = 0 WHERE id = @id');
  }
};

module.exports = CargoModel;
