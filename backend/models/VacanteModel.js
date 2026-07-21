// ============================================================
//  SCGRH — VacanteModel.js
//  Gestión de vacantes, postulaciones, evaluaciones,
//  entrevistas y ofertas laborales
// ============================================================
const { getPool, sql } = require('../config/database');

const VacanteModel = {

  // ── VACANTES ─────────────────────────────────────────────

  async findAllVacantes(empresa_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('empresa_id', sql.Int, empresa_id)
      .query(`
        SELECT v.id, v.titulo, v.estado, v.fecha_publicacion, v.fecha_cierre,
               v.cantidad_requerida, v.salario_ofrecido, v.publicada_portal_web,
               p.nombre  AS puesto_nombre,
               c.nombre  AS cargo_nombre,
               a.nombre  AS area_nombre,
               s.nombre  AS sucursal_nombre,
               s.id      AS sucursal_id,
               tc.descripcion AS tipo_contrato,
               u.username AS creado_por_username,
               (SELECT COUNT(*) FROM postulaciones po WHERE po.vacante_id = v.id) AS total_postulantes,
               v.creado_en
        FROM   vacantes v
        INNER JOIN puestos   p  ON p.id  = v.puesto_id
        INNER JOIN cargos    c  ON c.id  = p.cargo_id
        INNER JOIN areas     a  ON a.id  = c.area_id
        INNER JOIN sucursales s ON s.id  = v.sucursal_id
        LEFT  JOIN cat_tipo_contrato tc ON tc.id = v.tipo_contrato_id
        LEFT  JOIN usuarios  u  ON u.id  = v.creado_por
        WHERE  a.empresa_id = @empresa_id
        ORDER  BY v.creado_en DESC
      `);
    return res.recordset;
  },

  async findVacanteById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT v.*, p.nombre AS puesto_nombre, c.nombre AS cargo_nombre,
               a.nombre AS area_nombre, s.nombre AS sucursal_nombre,
               tc.descripcion AS tipo_contrato_desc,
               u.username AS creado_por_username
        FROM   vacantes v
        INNER JOIN puestos   p  ON p.id  = v.puesto_id
        INNER JOIN cargos    c  ON c.id  = p.cargo_id
        INNER JOIN areas     a  ON a.id  = c.area_id
        INNER JOIN sucursales s ON s.id  = v.sucursal_id
        LEFT  JOIN cat_tipo_contrato tc ON tc.id = v.tipo_contrato_id
        LEFT  JOIN usuarios  u  ON u.id  = v.creado_por
        WHERE  v.id = @id
      `);
    return res.recordset[0] || null;
  },

  async createVacante(data, usuarioId) {
    const pool = getPool();
    const res  = await pool.request()
      .input('puesto_id',          sql.Int,       data.puesto_id)
      .input('sucursal_id',        sql.Int,       data.sucursal_id)
      .input('titulo',             sql.NVarChar,  data.titulo)
      .input('descripcion',        sql.NVarChar,  data.descripcion || null)
      .input('requisitos',         sql.NVarChar,  data.requisitos  || null)
      .input('salario_ofrecido',   sql.Decimal,   data.salario_ofrecido || null)
      .input('tipo_contrato_id',   sql.Int,       data.tipo_contrato_id || null)
      .input('cantidad_requerida', sql.Int,       data.cantidad_requerida || 1)
      .input('fecha_publicacion',  sql.Date,      data.fecha_publicacion || null)
      .input('fecha_cierre',       sql.Date,      data.fecha_cierre || null)
      .input('estado',             sql.NVarChar,  data.estado || 'BORRADOR')
      .input('creado_por',         sql.Int,       usuarioId)
      .query(`
        INSERT INTO vacantes (
          puesto_id, sucursal_id, titulo, descripcion, requisitos,
          salario_ofrecido, tipo_contrato_id, cantidad_requerida,
          fecha_publicacion, fecha_cierre, estado, creado_por
        )
        OUTPUT INSERTED.id
        VALUES (
          @puesto_id, @sucursal_id, @titulo, @descripcion, @requisitos,
          @salario_ofrecido, @tipo_contrato_id, @cantidad_requerida,
          @fecha_publicacion, @fecha_cierre, @estado, @creado_por
        )
      `);
    return res.recordset[0].id;
  },

  async updateVacante(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',                 sql.Int,      id)
      .input('titulo',             sql.NVarChar, data.titulo)
      .input('descripcion',        sql.NVarChar, data.descripcion       || null)
      .input('requisitos',         sql.NVarChar, data.requisitos        || null)
      .input('salario_ofrecido',   sql.Decimal,  data.salario_ofrecido  || null)
      .input('tipo_contrato_id',   sql.Int,      data.tipo_contrato_id  || null)
      .input('cantidad_requerida', sql.Int,      data.cantidad_requerida || 1)
      .input('fecha_publicacion',  sql.Date,     data.fecha_publicacion || null)
      .input('fecha_cierre',       sql.Date,     data.fecha_cierre      || null)
      .input('estado',             sql.NVarChar, data.estado)
      .query(`
        UPDATE vacantes
        SET    titulo = @titulo, descripcion = @descripcion, requisitos = @requisitos,
               salario_ofrecido = @salario_ofrecido, tipo_contrato_id = @tipo_contrato_id,
               cantidad_requerida = @cantidad_requerida,
               fecha_publicacion = @fecha_publicacion, fecha_cierre = @fecha_cierre,
               estado = @estado
        WHERE  id = @id
      `);
  },

  async cambiarEstadoVacante(id, estado) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('estado', sql.NVarChar, estado)
      .query(`UPDATE vacantes SET estado = @estado WHERE id = @id`);
  },

  // ── POSTULACIONES ────────────────────────────────────────

  async findPostulacionesByVacante(vacante_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('vacante_id', sql.Int, vacante_id)
      .query(`
        SELECT po.id, po.estado, po.puntaje_total, po.fecha_postulacion, po.fuente,
               po.cv_url, po.carta_presentacion,
               p.nombres + ' ' + p.apellido_paterno + ' ' + ISNULL(p.apellido_materno,'') AS nombre_completo,
               p.email_personal, p.email_corporativo, p.telefono_celular,
               td.codigo AS tipo_doc, p.nro_documento, p.id AS persona_id,
               (SELECT COUNT(*) FROM entrevistas e WHERE e.postulacion_id = po.id) AS total_entrevistas,
               (SELECT COUNT(*) FROM evaluaciones ev WHERE ev.postulacion_id = po.id) AS total_evaluaciones
        FROM   postulaciones po
        INNER JOIN personas p  ON p.id  = po.persona_id
        INNER JOIN cat_tipo_documento td ON td.id = p.tipo_doc_id
        WHERE  po.vacante_id = @vacante_id
        ORDER  BY po.puntaje_total DESC, po.fecha_postulacion ASC
      `);
    return res.recordset;
  },

  async createPostulacion(data) {
    const pool = getPool();
    const res  = await pool.request()
      .input('vacante_id',         sql.Int,      data.vacante_id)
      .input('persona_id',         sql.Int,      data.persona_id)
      .input('cv_url',             sql.NVarChar, data.cv_url || null)
      .input('carta_presentacion', sql.NVarChar, data.carta_presentacion || null)
      .input('fuente',             sql.NVarChar, data.fuente || 'PORTAL')
      .query(`
        INSERT INTO postulaciones (vacante_id, persona_id, cv_url, carta_presentacion, fuente)
        OUTPUT INSERTED.id
        VALUES (@vacante_id, @persona_id, @cv_url, @carta_presentacion, @fuente)
      `);
    return res.recordset[0].id;
  },

  async cambiarEstadoPostulacion(id, estado) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('estado', sql.NVarChar, estado)
      .query(`UPDATE postulaciones SET estado = @estado WHERE id = @id`);
  },

  async findPostulacionById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT po.*, v.titulo AS vacante_titulo,
               p.nombres + ' ' + p.apellido_paterno AS nombre_completo,
               p.email_personal, p.email_corporativo, p.telefono_celular
        FROM   postulaciones po
        INNER JOIN vacantes  v ON v.id = po.vacante_id
        INNER JOIN personas  p ON p.id = po.persona_id
        WHERE  po.id = @id
      `);
    return res.recordset[0] || null;
  },

  // ── ENTREVISTAS ─────────────────────────────────────────

  async createEntrevista(data) {
    const pool = getPool();
    const res  = await pool.request()
      .input('postulacion_id',   sql.Int,      data.postulacion_id)
      .input('entrevistador_id', sql.Int,      data.entrevistador_id)
      .input('tipo',             sql.NVarChar, data.tipo || 'PRESENCIAL')
      .input('fecha_programada', sql.DateTime, new Date(data.fecha_programada))
      .input('ubicacion',        sql.NVarChar, data.ubicacion    || null)
      .input('link_reunion',     sql.NVarChar, data.link_reunion || null)
      .query(`
        INSERT INTO entrevistas (postulacion_id, entrevistador_id, tipo, fecha_programada, ubicacion, link_reunion)
        OUTPUT INSERTED.id
        VALUES (@postulacion_id, @entrevistador_id, @tipo, @fecha_programada, @ubicacion, @link_reunion)
      `);
    return res.recordset[0].id;
  },

  async registrarResultadoEntrevista(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',            sql.Int,      id)
      .input('puntaje',       sql.Decimal,  data.puntaje       || null)
      .input('observaciones', sql.NVarChar, data.observaciones || null)
      .input('resultado',     sql.NVarChar, data.resultado)
      .input('estado',        sql.NVarChar, 'REALIZADA')
      .query(`
        UPDATE entrevistas
        SET    fecha_realizada = GETDATE(), puntaje = @puntaje,
               observaciones = @observaciones, resultado = @resultado, estado = @estado
        WHERE  id = @id
      `);
  },

  async findEntrevistasByPostulacion(postulacion_id) {
    const pool = getPool();
    const res = await pool.request()
      .input('postulacion_id', sql.Int, postulacion_id)
      .query(`
        SELECT e.*, u.username AS entrevistador_nombre
        FROM   entrevistas e
        INNER JOIN usuarios u ON u.id = e.entrevistador_id
        WHERE  e.postulacion_id = @postulacion_id
        ORDER  BY e.fecha_programada DESC
      `);
    return res.recordset;
  },

  // ── OFERTAS LABORALES ─────────────────────────────────────

  async createOfertaLaboral(data) {
    const pool = getPool();
    const res  = await pool.request()
      .input('postulacion_id',         sql.Int,      data.postulacion_id)
      .input('cargo_id',               sql.Int,      data.cargo_id)
      .input('sucursal_id',            sql.Int,      data.sucursal_id)
      .input('salario_ofrecido',       sql.Decimal,  data.salario_ofrecido)
      .input('tipo_contrato_id',       sql.Int,      data.tipo_contrato_id)
      .input('fecha_inicio_propuesta', sql.Date,     data.fecha_inicio_propuesta || null)
      .input('beneficios_adicionales', sql.NVarChar, data.beneficios_adicionales || null)
      .input('fecha_vencimiento',      sql.Date,     data.fecha_vencimiento || null)
      .query(`
        INSERT INTO ofertas_laborales (
          postulacion_id, cargo_id, sucursal_id, salario_ofrecido,
          tipo_contrato_id, fecha_inicio_propuesta, beneficios_adicionales, fecha_vencimiento
        )
        OUTPUT INSERTED.id
        VALUES (
          @postulacion_id, @cargo_id, @sucursal_id, @salario_ofrecido,
          @tipo_contrato_id, @fecha_inicio_propuesta, @beneficios_adicionales, @fecha_vencimiento
        )
      `);
    return res.recordset[0].id;
  },

  // ── CATÁLOGOS ─────────────────────────────────────────────

  async getCatalogos(empresa_id) {
    const pool = getPool();
    const [puestos, tiposContrato, sucursales] = await Promise.all([
      pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT pu.id, pu.codigo,
               c.nombre + ' — ' + s.nombre AS descripcion
        FROM   puestos   pu
        INNER JOIN cargos    c ON c.id  = pu.cargo_id
        INNER JOIN sucursales s ON s.id = pu.sucursal_id
        INNER JOIN areas     a ON a.id  = c.area_id
        WHERE  a.empresa_id = @eid AND pu.activo = 1
        ORDER  BY c.nombre
      `),
      pool.request().query(`SELECT id, codigo, descripcion FROM cat_tipo_contrato WHERE activo = 1`),
      pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT id, nombre FROM sucursales WHERE empresa_id = @eid AND activo = 1
      `)
    ]);
    return {
      puestos:        puestos.recordset,
      tipos_contrato: tiposContrato.recordset,
      sucursales:     sucursales.recordset
    };
  }
};

module.exports = VacanteModel;
