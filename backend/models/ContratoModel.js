const { getPool, sql } = require('../config/database');

const ContratoModel = {
  async findAll() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT c.id, c.codigo, c.fecha_inicio, c.fecha_fin, c.salario_base,
             c.modalidad, c.estado, tc.descripcion AS tipo_contrato_descripcion,
             p.codigo AS puesto_codigo, car.nombre AS cargo_nombre,
             per.nombres + ' ' + per.apellido_paterno AS colaborador_nombre,
             per.id AS persona_id
      FROM   contratos c
      INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
      INNER JOIN personas per             ON per.id = el.persona_id
      INNER JOIN puestos p                ON p.id = c.puesto_id
      INNER JOIN cargos car               ON car.id = p.cargo_id
      INNER JOIN cat_tipo_contrato tc     ON tc.id = c.tipo_contrato_id
      ORDER BY c.fecha_inicio DESC
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT c.*, el.persona_id
        FROM   contratos c
        INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
        WHERE  c.id = @id
      `);
    return res.recordset[0] || null;
  },

  async create(data, creadoPorUsuarioId) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Insertar Contrato
      const req = new sql.Request(transaction);
      req.input('expediente_id',          sql.Int,      data.expediente_id);
      req.input('puesto_id',              sql.Int,      data.puesto_id);
      req.input('tipo_contrato_id',       sql.Int,      data.tipo_contrato_id);
      req.input('centro_costo_id',        sql.Int,      data.centro_costo_id || null);
      req.input('codigo',                 sql.NVarChar, data.codigo);
      req.input('fecha_inicio',           sql.Date,     data.fecha_inicio);
      req.input('fecha_fin',              sql.Date,     data.fecha_fin || null);
      req.input('salario_base',           sql.Decimal,  data.salario_base);
      req.input('jornada_horas',          sql.Decimal,  data.jornada_horas || 8.00);
      req.input('modalidad',              sql.NVarChar, data.modalidad || 'PRESENCIAL');
      req.input('alta_t_registro',        sql.Bit,      data.alta_t_registro ? 1 : 0);
      req.input('nro_registro_t',         sql.NVarChar, data.nro_registro_t || null);
      req.input('estado',                 sql.NVarChar, data.estado || 'BORRADOR');
      req.input('creado_por',             sql.Int,      creadoPorUsuarioId);

      const res = await req.query(`
        INSERT INTO contratos (
          expediente_id, puesto_id, tipo_contrato_id, centro_costo_id, codigo,
          fecha_inicio, fecha_fin, salario_base, jornada_horas, modalidad,
          alta_t_registro, nro_registro_t, estado, creado_por
        )
        OUTPUT INSERTED.id
        VALUES (
          @expediente_id, @puesto_id, @tipo_contrato_id, @centro_costo_id, @codigo,
          @fecha_inicio, @fecha_fin, @salario_base, @jornada_horas, @modalidad,
          @alta_t_registro, @nro_registro_t, @estado, @creado_por
        )
      `);

      const contratoId = res.recordset[0].id;

      // 2. Si el contrato es VIGENTE, actualizar el estado de la Persona asociada a 'ACTIVO'
      if (data.estado === 'VIGENTE') {
        const reqUpdatePersona = new sql.Request(transaction);
        reqUpdatePersona.input('expediente_id', sql.Int, data.expediente_id);
        await reqUpdatePersona.query(`
          UPDATE personas
          SET    estado = 'ACTIVO', actualizado_en = GETDATE()
          WHERE  id = (SELECT persona_id FROM expedientes_laborales WHERE id = @expediente_id)
        `);
      }

      await transaction.commit();
      return contratoId;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async update(id, data) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const req = new sql.Request(transaction);
      req.input('id',                     sql.Int,      id);
      req.input('expediente_id',          sql.Int,      data.expediente_id);
      req.input('puesto_id',              sql.Int,      data.puesto_id);
      req.input('tipo_contrato_id',       sql.Int,      data.tipo_contrato_id);
      req.input('centro_costo_id',        sql.Int,      data.centro_costo_id || null);
      req.input('codigo',                 sql.NVarChar, data.codigo);
      req.input('fecha_inicio',           sql.Date,     data.fecha_inicio);
      req.input('fecha_fin',              sql.Date,     data.fecha_fin || null);
      req.input('salario_base',           sql.Decimal,  data.salario_base);
      req.input('jornada_horas',          sql.Decimal,  data.jornada_horas || 8.00);
      req.input('modalidad',              sql.NVarChar, data.modalidad || 'PRESENCIAL');
      req.input('alta_t_registro',        sql.Bit,      data.alta_t_registro ? 1 : 0);
      req.input('nro_registro_t',         sql.NVarChar, data.nro_registro_t || null);
      req.input('estado',                 sql.NVarChar, data.estado || 'BORRADOR');

      await req.query(`
        UPDATE contratos
        SET    expediente_id = @expediente_id, puesto_id = @puesto_id,
               tipo_contrato_id = @tipo_contrato_id, centro_costo_id = @centro_costo_id,
               codigo = @codigo, fecha_inicio = @fecha_inicio, fecha_fin = @fecha_fin,
               salario_base = @salario_base, jornada_horas = @jornada_horas, modalidad = @modalidad,
               alta_t_registro = @alta_t_registro, nro_registro_t = @nro_registro_t, estado = @estado
        WHERE  id = @id
      `);

      // Si el contrato cambia a VIGENTE, actualizar el estado de la Persona asociada a 'ACTIVO'
      if (data.estado === 'VIGENTE') {
        const reqUpdatePersona = new sql.Request(transaction);
        reqUpdatePersona.input('expediente_id', sql.Int, data.expediente_id);
        await reqUpdatePersona.query(`
          UPDATE personas
          SET    estado = 'ACTIVO', actualizado_en = GETDATE()
          WHERE  id = (SELECT persona_id FROM expedientes_laborales WHERE id = @expediente_id)
        `);
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE contratos SET estado = 'RESCINDIDO' WHERE id = @id");
  },

  // ── Métodos de catálogos y relaciones necesarias para crear contratos ──
  async getCatalogs() {
    const pool = getPool();
    const [tipos, puestos, centros] = await Promise.all([
      pool.request().query("SELECT id, codigo, descripcion FROM cat_tipo_contrato WHERE activo = 1"),
      pool.request().query(`
        SELECT p.id, p.codigo, c.nombre AS cargo_nombre, s.nombre AS sucursal_nombre,
               p.cantidad_plazas, p.plazas_ocupadas
        FROM   puestos p
        INNER JOIN cargos c ON c.id = p.cargo_id
        INNER JOIN sucursales s ON s.id = p.sucursal_id
        WHERE  p.activo = 1
      `),
      pool.request().query("SELECT id, codigo, nombre FROM centros_costo WHERE activo = 1")
    ]);
    return {
      tipos_contrato: tipos.recordset,
      puestos:        puestos.recordset,
      centros_costo:  centros.recordset
    };
  }
};

module.exports = ContratoModel;
