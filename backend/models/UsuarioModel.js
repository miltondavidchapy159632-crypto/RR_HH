const { getPool, sql } = require('../config/database');

const UsuarioModel = {
  async findByUsername(username) {
    const pool = getPool();
    const res = await pool.request()
      .input('username', sql.NVarChar, username)
      .query(`
        SELECT u.id, u.username, u.email, u.password_hash,
               u.estado, u.intentos_fallidos, u.empresa_id, u.sucursal_id,
               r.codigo AS rol, r.nombre AS rol_nombre
        FROM   usuarios u
        LEFT JOIN usuarios_roles ur ON ur.usuario_id = u.id
        LEFT JOIN roles r           ON r.id = ur.rol_id
        WHERE  u.username = @username
      `);
    return res.recordset[0] || null;
  },

  async incrementarIntentos(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE usuarios
        SET    intentos_fallidos = intentos_fallidos + 1,
               estado = CASE WHEN intentos_fallidos >= 4 THEN 'BLOQUEADO' ELSE estado END,
               actualizado_en = GETDATE()
        WHERE  id = @id
      `);
  },

  async resetearIntentos(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE usuarios
        SET    intentos_fallidos = 0,
               fecha_ultimo_login = GETDATE(),
               actualizado_en = GETDATE()
        WHERE  id = @id
      `);
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT u.id, u.username, u.email, u.estado, u.empresa_id,
               e.razon_social AS empresa_nombre,
               r.codigo AS rol, r.nombre AS rol_nombre
        FROM   usuarios u
        LEFT JOIN empresas e         ON e.id = u.empresa_id
        LEFT JOIN usuarios_roles ur  ON ur.usuario_id = u.id
        LEFT JOIN roles r            ON r.id = ur.rol_id
        WHERE  u.id = @id
      `);
    return res.recordset[0] || null;
  }
};

module.exports = UsuarioModel;
