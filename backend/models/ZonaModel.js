// ============================================================
//  SCGRH — ZonaModel.js
//  Módulo para gestión de zonas físicas y asignación de personal
// ============================================================
const { getPool, sql } = require('../config/database');

const ZonaModel = {

  // ══════════════════════════════════════════════════════════
  //  ZONAS FÍSICAS (SALONES, COCINA, ETC)
  // ══════════════════════════════════════════════════════════
  async findAllZonas(empresa_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('eid', sql.Int, empresa_id)
      .query(`
        SELECT z.id, z.codigo, z.nombre, z.descripcion, z.aforo_max, z.tipo, z.activo,
               suc.nombre AS sucursal_nombre, suc.id AS sucursal_id,
               (SELECT COUNT(DISTINCT contrato_id) 
                FROM asignacion_zonas a 
                WHERE a.zona_id = z.id AND a.fecha = CAST(GETDATE() AS DATE)) as personal_hoy
        FROM zonas_restaurante z
        INNER JOIN sucursales suc ON suc.id = z.sucursal_id
        WHERE suc.empresa_id = @eid
        ORDER BY suc.nombre, z.nombre
      `);
    return res.recordset;
  },

  async getSucursales(empresa_id) {
    const pool = getPool();
    const res = await pool.request().input('eid', sql.Int, empresa_id).query(`
      SELECT id, nombre, direccion FROM sucursales WHERE empresa_id=@eid ORDER BY nombre
    `);
    return res.recordset;
  },

  async createZona(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('suc', sql.Int, data.sucursal_id)
      .input('cod', sql.NVarChar, data.codigo)
      .input('nom', sql.NVarChar, data.nombre)
      .input('desc', sql.NVarChar, data.descripcion || null)
      .input('aforo', sql.Int, data.aforo_max || 20)
      .input('tipo', sql.NVarChar, data.tipo || 'SALON')
      .query(`
        INSERT INTO zonas_restaurante (sucursal_id, codigo, nombre, descripcion, aforo_max, tipo)
        OUTPUT INSERTED.id
        VALUES (@suc, @cod, @nom, @desc, @aforo, @tipo)
      `);
    return res.recordset[0].id;
  },

  async updateZona(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('cod', sql.NVarChar, data.codigo)
      .input('nom', sql.NVarChar, data.nombre)
      .input('desc', sql.NVarChar, data.descripcion || null)
      .input('aforo', sql.Int, data.aforo_max || 20)
      .input('tipo', sql.NVarChar, data.tipo)
      .input('activo', sql.Bit, data.activo ? 1 : 0)
      .query(`
        UPDATE zonas_restaurante 
        SET codigo=@cod, nombre=@nom, descripcion=@desc, aforo_max=@aforo, tipo=@tipo, activo=@activo
        WHERE id=@id
      `);
  },

  // ══════════════════════════════════════════════════════════
  //  ASIGNACIÓN DE PERSONAL A ZONAS
  // ══════════════════════════════════════════════════════════
  async findAsignacionesByDate(empresa_id, fecha) {
    const pool = getPool();
    const res = await pool.request()
      .input('eid', sql.Int, empresa_id)
      .input('f', sql.Date, fecha)
      .query(`
        SELECT a.id, a.fecha, a.hora_inicio, a.hora_fin, a.rol_en_zona, a.observaciones,
               z.nombre AS zona_nombre, z.tipo AS zona_tipo,
               suc.nombre AS sucursal_nombre,
               per.nombres + ' ' + per.apellido_paterno AS empleado_nombre,
               car.nombre AS cargo_nombre,
               t.nombre AS turno_nombre
        FROM asignacion_zonas a
        INNER JOIN zonas_restaurante z ON z.id = a.zona_id
        INNER JOIN sucursales suc ON suc.id = z.sucursal_id
        INNER JOIN contratos co ON co.id = a.contrato_id
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas per ON per.id = el.persona_id
        INNER JOIN puestos pu ON pu.id = co.puesto_id
        INNER JOIN cargos car ON car.id = pu.cargo_id
        LEFT JOIN turnos t ON t.id = a.turno_id
        WHERE suc.empresa_id = @eid AND a.fecha = @f
        ORDER BY suc.nombre, z.nombre, t.hora_inicio
      `);
    return res.recordset;
  },

  async getOptionsForAsignacion(empresa_id) {
    const pool = getPool();
    const [zonRes, contRes, turRes] = await Promise.all([
      pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT z.id, z.nombre, suc.nombre AS sucursal FROM zonas_restaurante z
        INNER JOIN sucursales suc ON suc.id=z.sucursal_id
        WHERE suc.empresa_id=@eid AND z.activo=1 ORDER BY suc.nombre, z.nombre
      `),
      pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT co.id AS contrato_id, per.nombres + ' ' + per.apellido_paterno AS empleado_nombre, car.nombre AS cargo
        FROM contratos co
        INNER JOIN expedientes_laborales el ON el.id=co.expediente_id
        INNER JOIN personas per ON per.id=el.persona_id
        INNER JOIN puestos pu ON pu.id=co.puesto_id
        INNER JOIN cargos car ON car.id=pu.cargo_id
        INNER JOIN areas a ON a.id=car.area_id
        WHERE co.estado='VIGENTE' AND a.empresa_id=@eid
        ORDER BY per.nombres
      `),
      pool.request().input('eid', sql.Int, empresa_id).query(`SELECT id, nombre, hora_inicio, hora_fin FROM turnos WHERE empresa_id=@eid`)
    ]);
    return {
      zonas: zonRes.recordset,
      empleados: contRes.recordset,
      turnos: turRes.recordset
    };
  },

  async createAsignacion(data, usuario_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('zona', sql.Int, data.zona_id)
      .input('cont', sql.Int, data.contrato_id)
      .input('turno', sql.Int, data.turno_id || null)
      .input('fecha', sql.Date, data.fecha)
      .input('hi', sql.Time, data.hora_inicio || null)
      .input('hf', sql.Time, data.hora_fin || null)
      .input('rol', sql.NVarChar, data.rol_en_zona || null)
      .input('obs', sql.NVarChar, data.observaciones || null)
      .input('usr', sql.Int, usuario_id)
      .query(`
        INSERT INTO asignacion_zonas (zona_id, contrato_id, turno_id, fecha, hora_inicio, hora_fin, rol_en_zona, observaciones, asignado_por)
        OUTPUT INSERTED.id
        VALUES (@zona, @cont, @turno, @fecha, @hi, @hf, @rol, @obs, @usr)
      `);
    return res.recordset[0].id;
  },

  async deleteAsignacion(id) {
    const pool = getPool();
    await pool.request().input('id', sql.Int, id).query(`DELETE FROM asignacion_zonas WHERE id=@id`);
  }

};

module.exports = ZonaModel;
