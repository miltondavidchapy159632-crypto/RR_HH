// ============================================================
//  SCGRH — CertificacionModel.js
//  Módulo para el control de certificaciones del personal
// ============================================================
const { getPool, sql } = require('../config/database');

const CertificacionModel = {

  // ══════════════════════════════════════════════════════════
  //  CATÁLOGO DE CERTIFICACIONES
  // ══════════════════════════════════════════════════════════
  async findAllCatalogo() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT id, codigo, nombre, descripcion, entidad_emisora, vigencia_meses, activo,
             (SELECT COUNT(*) FROM certificaciones_empleado ce WHERE ce.certificacion_id = c.id AND ce.estado = 'VIGENTE') as vigentes,
             (SELECT COUNT(*) FROM certificaciones_empleado ce WHERE ce.certificacion_id = c.id AND ce.estado = 'POR_VENCER') as por_vencer,
             (SELECT COUNT(*) FROM certificaciones_empleado ce WHERE ce.certificacion_id = c.id AND ce.estado = 'VENCIDA') as vencidas
      FROM certificaciones_catalogo c
      ORDER BY nombre
    `);
    return res.recordset;
  },

  async createCatalogo(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('desc', sql.NVarChar, data.descripcion || null)
      .input('entidad', sql.NVarChar, data.entidad_emisora || null)
      .input('meses', sql.Int, data.vigencia_meses || 12)
      .query(`
        INSERT INTO certificaciones_catalogo (codigo, nombre, descripcion, entidad_emisora, vigencia_meses)
        OUTPUT INSERTED.id
        VALUES (@codigo, @nombre, @desc, @entidad, @meses)
      `);
    return res.recordset[0].id;
  },

  async updateCatalogo(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('codigo', sql.NVarChar, data.codigo)
      .input('nombre', sql.NVarChar, data.nombre)
      .input('desc', sql.NVarChar, data.descripcion || null)
      .input('entidad', sql.NVarChar, data.entidad_emisora || null)
      .input('meses', sql.Int, data.vigencia_meses || 12)
      .input('activo', sql.Bit, data.activo ? 1 : 0)
      .query(`
        UPDATE certificaciones_catalogo
        SET codigo=@codigo, nombre=@nombre, descripcion=@desc, entidad_emisora=@entidad, vigencia_meses=@meses, activo=@activo
        WHERE id=@id
      `);
  },

  // ══════════════════════════════════════════════════════════
  //  CERTIFICACIONES ASIGNADAS A EMPLEADOS
  // ══════════════════════════════════════════════════════════
  async findAllEmpleados(empresa_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('eid', sql.Int, empresa_id)
      .query(`
        SELECT ce.id, ce.nro_certificado, ce.fecha_obtencion, ce.fecha_vencimiento, 
               ce.url_documento, ce.estado, ce.observaciones,
               c.nombre AS certificacion_nombre, c.codigo AS certificacion_codigo, c.entidad_emisora,
               per.nombres + ' ' + per.apellido_paterno AS empleado_nombre,
               car.nombre AS cargo_nombre, suc.nombre AS sucursal_nombre
        FROM   certificaciones_empleado ce
        INNER JOIN certificaciones_catalogo c ON c.id = ce.certificacion_id
        INNER JOIN contratos co ON co.id = ce.contrato_id
        INNER JOIN expedientes_laborales el ON el.id = co.expediente_id
        INNER JOIN personas per ON per.id = el.persona_id
        INNER JOIN puestos pu ON pu.id = co.puesto_id
        INNER JOIN cargos car ON car.id = pu.cargo_id
        INNER JOIN areas a ON a.id = car.area_id
        INNER JOIN sucursales suc ON suc.id = pu.sucursal_id
        WHERE  a.empresa_id = @eid
        ORDER BY ce.fecha_obtencion DESC
      `);
    return res.recordset;
  },

  async getDashboardStats(empresa_id) {
    const pool = getPool();
    const res = await pool.request().input('eid', sql.Int, empresa_id).query(`
      SELECT ce.estado, COUNT(*) as cantidad
      FROM certificaciones_empleado ce
      INNER JOIN contratos co ON co.id = ce.contrato_id
      INNER JOIN puestos pu ON pu.id = co.puesto_id
      INNER JOIN cargos car ON car.id = pu.cargo_id
      INNER JOIN areas a ON a.id = car.area_id
      WHERE a.empresa_id = @eid
      GROUP BY ce.estado
    `);
    
    const stats = { VIGENTE: 0, POR_VENCER: 0, VENCIDA: 0, REVOCADA: 0, TOTAL: 0 };
    res.recordset.forEach(r => {
      stats[r.estado] = r.cantidad;
      stats.TOTAL += r.cantidad;
    });
    return stats;
  },

  async createEmpleadoCert(data, usuario_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('cert_id', sql.Int, data.certificacion_id)
      .input('contrato_id', sql.Int, data.contrato_id)
      .input('nro', sql.NVarChar, data.nro_certificado || null)
      .input('f_obt', sql.Date, data.fecha_obtencion)
      .input('f_ven', sql.Date, data.fecha_vencimiento || null)
      .input('estado', sql.NVarChar, data.estado || 'VIGENTE')
      .input('obs', sql.NVarChar, data.observaciones || null)
      .input('usr', sql.Int, usuario_id)
      .query(`
        INSERT INTO certificaciones_empleado (certificacion_id, contrato_id, nro_certificado, fecha_obtencion, fecha_vencimiento, estado, observaciones, registrado_por)
        OUTPUT INSERTED.id
        VALUES (@cert_id, @contrato_id, @nro, @f_obt, @f_ven, @estado, @obs, @usr)
      `);
    return res.recordset[0].id;
  },

  async updateEstado(id, estado) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('estado', sql.NVarChar, estado)
      .query(`UPDATE certificaciones_empleado SET estado=@estado WHERE id=@id`);
  },
  
  async deleteEmpleadoCert(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM certificaciones_empleado WHERE id=@id`);
  }
};

module.exports = CertificacionModel;
