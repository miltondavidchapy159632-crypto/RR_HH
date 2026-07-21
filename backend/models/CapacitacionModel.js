// ============================================================
//  SCGRH — CapacitacionModel.js
//  Cursos → Sesiones de capacitación → Asistentes → Evaluación
// ============================================================
const { getPool, sql } = require('../config/database');

const CapacitacionModel = {

  // ══════════════════════════════════════════════════════════
  //  CURSOS (catálogo)
  // ══════════════════════════════════════════════════════════

  async findAllCursos() {
    const pool = getPool();
    const res  = await pool.request().query(`
      SELECT id, nombre, descripcion, modalidad, duracion_horas, costo, proveedor, activo
      FROM   cursos
      ORDER  BY nombre
    `);
    return res.recordset;
  },

  async createCurso(data) {
    const pool = getPool();
    const res  = await pool.request()
      .input('nombre',        sql.NVarChar, data.nombre)
      .input('descripcion',   sql.NVarChar, data.descripcion    || null)
      .input('modalidad',     sql.NVarChar, data.modalidad      || 'PRESENCIAL')
      .input('duracion_horas',sql.Decimal,  data.duracion_horas || null)
      .input('costo',         sql.Decimal,  data.costo          || null)
      .input('proveedor',     sql.NVarChar, data.proveedor      || null)
      .query(`
        INSERT INTO cursos (nombre, descripcion, modalidad, duracion_horas, costo, proveedor)
        OUTPUT INSERTED.id
        VALUES (@nombre, @descripcion, @modalidad, @duracion_horas, @costo, @proveedor)
      `);
    return res.recordset[0].id;
  },

  async updateCurso(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',            sql.Int,      id)
      .input('nombre',        sql.NVarChar, data.nombre)
      .input('descripcion',   sql.NVarChar, data.descripcion    || null)
      .input('modalidad',     sql.NVarChar, data.modalidad      || 'PRESENCIAL')
      .input('duracion_horas',sql.Decimal,  data.duracion_horas || null)
      .input('costo',         sql.Decimal,  data.costo          || null)
      .input('proveedor',     sql.NVarChar, data.proveedor      || null)
      .input('activo',        sql.Bit,      data.activo ? 1 : 0)
      .query(`
        UPDATE cursos
        SET nombre=@nombre, descripcion=@descripcion, modalidad=@modalidad,
            duracion_horas=@duracion_horas, costo=@costo, proveedor=@proveedor, activo=@activo
        WHERE id=@id
      `);
  },

  // ══════════════════════════════════════════════════════════
  //  SESIONES DE CAPACITACIÓN
  // ══════════════════════════════════════════════════════════

  async findAllSesiones(empresa_id) {
    const pool = getPool();
    const res  = await pool.request()
      .input('empresa_id', sql.Int, empresa_id)
      .query(`
        SELECT  ca.id, ca.nombre_sesion, ca.fecha_inicio, ca.fecha_fin,
                ca.lugar, ca.instructor, ca.capacidad_max, ca.estado,
                c.nombre        AS curso_nombre,
                c.modalidad     AS curso_modalidad,
                c.duracion_horas,
                c.costo         AS costo_unitario,
                c.proveedor,
                s.nombre        AS sucursal_nombre,
                s.id            AS sucursal_id,
                (SELECT COUNT(*) FROM asistencia_capacitacion ac WHERE ac.capacitacion_id = ca.id)
                                AS total_inscritos,
                (SELECT COUNT(*) FROM asistencia_capacitacion ac WHERE ac.capacitacion_id = ca.id AND ac.asistio = 1)
                                AS total_asistieron
        FROM    capacitaciones ca
        INNER JOIN cursos       c  ON c.id  = ca.curso_id
        LEFT  JOIN sucursales   s  ON s.id  = ca.sucursal_id
        WHERE  s.empresa_id = @empresa_id OR ca.sucursal_id IS NULL
        ORDER  BY ca.fecha_inicio DESC
      `);
    return res.recordset;
  },

  async findSesionById(id) {
    const pool = getPool();
    const [sesionRes, asistRes] = await Promise.all([
      pool.request().input('id', sql.Int, id).query(`
        SELECT  ca.*, c.nombre AS curso_nombre, c.modalidad AS curso_modalidad,
                c.duracion_horas, c.costo, c.proveedor,
                s.nombre AS sucursal_nombre
        FROM    capacitaciones ca
        INNER JOIN cursos      c  ON c.id = ca.curso_id
        LEFT  JOIN sucursales  s  ON s.id = ca.sucursal_id
        WHERE  ca.id = @id
      `),
      pool.request().input('id', sql.Int, id).query(`
        SELECT  ac.id AS asistencia_id, ac.asistio, ac.fecha_registro,
                per.nombres + ' ' + per.apellido_paterno + ' ' + ISNULL(per.apellido_materno,'') AS nombre_completo,
                per.email_personal, per.email_corporativo,
                car.nombre AS cargo_nombre,
                suc.nombre AS sucursal_nombre,
                co.id      AS contrato_id,
                ec.puntaje, ec.aprobado, ec.observaciones
        FROM    asistencia_capacitacion ac
        INNER JOIN contratos             co  ON co.id  = ac.contrato_id
        INNER JOIN expedientes_laborales el  ON el.id  = co.expediente_id
        INNER JOIN personas              per ON per.id = el.persona_id
        INNER JOIN puestos               pu  ON pu.id  = co.puesto_id
        INNER JOIN cargos                car ON car.id = pu.cargo_id
        INNER JOIN sucursales            suc ON suc.id = pu.sucursal_id
        LEFT  JOIN evaluaciones_capacitacion ec ON ec.asistencia_id = ac.id
        WHERE  ac.capacitacion_id = @id
        ORDER  BY per.apellido_paterno, per.nombres
      `)
    ]);
    const sesion = sesionRes.recordset[0] || null;
    if (sesion) sesion.asistentes = asistRes.recordset;
    return sesion;
  },

  async createSesion(data) {
    const pool = getPool();
    const res  = await pool.request()
      .input('curso_id',     sql.Int,      data.curso_id)
      .input('sucursal_id',  sql.Int,      data.sucursal_id   || null)
      .input('nombre_sesion',sql.NVarChar, data.nombre_sesion || null)
      .input('fecha_inicio', sql.DateTime, new Date(data.fecha_inicio))
      .input('fecha_fin',    sql.DateTime, data.fecha_fin ? new Date(data.fecha_fin) : null)
      .input('lugar',        sql.NVarChar, data.lugar         || null)
      .input('instructor',   sql.NVarChar, data.instructor    || null)
      .input('capacidad_max',sql.Int,      data.capacidad_max || null)
      .input('estado',       sql.NVarChar, data.estado        || 'PROGRAMADA')
      .query(`
        INSERT INTO capacitaciones
          (curso_id, sucursal_id, nombre_sesion, fecha_inicio, fecha_fin, lugar, instructor, capacidad_max, estado)
        OUTPUT INSERTED.id
        VALUES
          (@curso_id, @sucursal_id, @nombre_sesion, @fecha_inicio, @fecha_fin, @lugar, @instructor, @capacidad_max, @estado)
      `);
    return res.recordset[0].id;
  },

  async updateSesion(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',           sql.Int,      id)
      .input('nombre_sesion',sql.NVarChar, data.nombre_sesion || null)
      .input('fecha_inicio', sql.DateTime, new Date(data.fecha_inicio))
      .input('fecha_fin',    sql.DateTime, data.fecha_fin ? new Date(data.fecha_fin) : null)
      .input('lugar',        sql.NVarChar, data.lugar         || null)
      .input('instructor',   sql.NVarChar, data.instructor    || null)
      .input('capacidad_max',sql.Int,      data.capacidad_max || null)
      .input('estado',       sql.NVarChar, data.estado        || 'PROGRAMADA')
      .query(`
        UPDATE capacitaciones
        SET nombre_sesion=@nombre_sesion, fecha_inicio=@fecha_inicio, fecha_fin=@fecha_fin,
            lugar=@lugar, instructor=@instructor, capacidad_max=@capacidad_max, estado=@estado
        WHERE id=@id
      `);
  },

  async cambiarEstadoSesion(id, estado) {
    const pool = getPool();
    await pool.request()
      .input('id',     sql.Int,      id)
      .input('estado', sql.NVarChar, estado)
      .query(`UPDATE capacitaciones SET estado=@estado WHERE id=@id`);
  },

  // ══════════════════════════════════════════════════════════
  //  INSCRIPCIONES / ASISTENCIA
  // ══════════════════════════════════════════════════════════

  async inscribirParticipante(capacitacion_id, contrato_id) {
    const pool = getPool();
    const res  = await pool.request()
      .input('cap_id',     sql.Int, capacitacion_id)
      .input('contrato_id',sql.Int, contrato_id)
      .query(`
        INSERT INTO asistencia_capacitacion (capacitacion_id, contrato_id)
        OUTPUT INSERTED.id
        VALUES (@cap_id, @contrato_id)
      `);
    return res.recordset[0].id;
  },

  // Registrar asistencia masiva: array de { asistencia_id, asistio }
  async registrarAsistencia(registros) {
    const pool = getPool();
    const tx   = new sql.Transaction(pool);
    await tx.begin();
    try {
      for (const r of registros) {
        const req = new sql.Request(tx);
        req.input('id',      sql.Int, r.asistencia_id);
        req.input('asistio', sql.Bit, r.asistio ? 1 : 0);
        await req.query(`UPDATE asistencia_capacitacion SET asistio=@asistio WHERE id=@id`);
      }
      await tx.commit();
    } catch (err) { await tx.rollback(); throw err; }
  },

  // ══════════════════════════════════════════════════════════
  //  EVALUACIONES POR ASISTENTE
  // ══════════════════════════════════════════════════════════

  async upsertEvaluacionAsistente(asistencia_id, data) {
    const pool    = getPool();
    // Si ya existe, actualizar; si no, insertar
    const existing = await pool.request()
      .input('id', sql.Int, asistencia_id)
      .query(`SELECT id FROM evaluaciones_capacitacion WHERE asistencia_id=@id`);

    const puntaje  = parseFloat(data.puntaje)         || 0;
    const max      = parseFloat(data.puntaje_maximo)   || 100;
    const aprobado = puntaje >= (max * 0.6) ? 1 : 0; // umbral 60%

    if (existing.recordset.length) {
      await pool.request()
        .input('asistencia_id',  sql.Int,      asistencia_id)
        .input('puntaje',        sql.Decimal,  puntaje)
        .input('puntaje_maximo', sql.Decimal,  max)
        .input('aprobado',       sql.Bit,      aprobado)
        .input('observaciones',  sql.NVarChar, data.observaciones || null)
        .input('fecha_eval',     sql.Date,     data.fecha_evaluacion || new Date())
        .query(`
          UPDATE evaluaciones_capacitacion
          SET puntaje=@puntaje, puntaje_maximo=@puntaje_maximo, aprobado=@aprobado,
              observaciones=@observaciones, fecha_evaluacion=@fecha_eval
          WHERE asistencia_id=@asistencia_id
        `);
    } else {
      await pool.request()
        .input('asistencia_id',  sql.Int,      asistencia_id)
        .input('puntaje',        sql.Decimal,  puntaje)
        .input('puntaje_maximo', sql.Decimal,  max)
        .input('aprobado',       sql.Bit,      aprobado)
        .input('observaciones',  sql.NVarChar, data.observaciones || null)
        .input('fecha_eval',     sql.Date,     data.fecha_evaluacion || new Date())
        .query(`
          INSERT INTO evaluaciones_capacitacion
            (asistencia_id, puntaje, puntaje_maximo, aprobado, observaciones, fecha_evaluacion)
          VALUES
            (@asistencia_id, @puntaje, @puntaje_maximo, @aprobado, @observaciones, @fecha_eval)
        `);
    }
    return { aprobado: !!aprobado };
  },

  // ══════════════════════════════════════════════════════════
  //  CATÁLOGOS
  // ══════════════════════════════════════════════════════════

  async getCatalogos(empresa_id) {
    const pool = getPool();
    const [cursos, sucursales, contratos] = await Promise.all([
      pool.request().query(`SELECT id, nombre, modalidad, duracion_horas, costo, proveedor FROM cursos WHERE activo=1 ORDER BY nombre`),
      pool.request().input('eid', sql.Int, empresa_id).query(`SELECT id, nombre FROM sucursales WHERE empresa_id=@eid AND activo=1`),
      pool.request().input('eid', sql.Int, empresa_id).query(`
        SELECT co.id AS contrato_id,
               per.nombres + ' ' + per.apellido_paterno + ' ' + ISNULL(per.apellido_materno,'') AS nombre_completo,
               car.nombre AS cargo_nombre, suc.nombre AS sucursal_nombre
        FROM   contratos co
        INNER JOIN expedientes_laborales el ON el.id=co.expediente_id
        INNER JOIN personas  per ON per.id=el.persona_id
        INNER JOIN puestos   pu  ON pu.id=co.puesto_id
        INNER JOIN cargos    car ON car.id=pu.cargo_id
        INNER JOIN areas     a   ON a.id=car.area_id
        INNER JOIN sucursales suc ON suc.id=pu.sucursal_id
        WHERE  co.estado='VIGENTE' AND a.empresa_id=@eid
        ORDER  BY per.apellido_paterno, per.nombres
      `)
    ]);
    return {
      cursos:     cursos.recordset,
      sucursales: sucursales.recordset,
      contratos:  contratos.recordset
    };
  }
};

module.exports = CapacitacionModel;
