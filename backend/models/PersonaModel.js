const { getPool, sql } = require('../config/database');

const PersonaModel = {
  async findAll() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT p.id, td.codigo AS tipo_doc_codigo, p.nro_documento,
             p.apellido_paterno, p.apellido_materno, p.nombres,
             p.email_corporativo, p.telefono_celular, p.estado,
             el.id AS expediente_id, el.codigo AS expediente_codigo
      FROM   personas p
      INNER JOIN cat_tipo_documento td ON td.id = p.tipo_doc_id
      LEFT JOIN expedientes_laborales el ON el.persona_id = p.id
      ORDER BY p.apellido_paterno, p.apellido_materno, p.nombres
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, el.id AS expediente_id, el.codigo AS expediente_codigo
        FROM   personas p
        LEFT JOIN expedientes_laborales el ON el.persona_id = p.id
        WHERE  p.id = @id
      `);
    return res.recordset[0] || null;
  },

  async create(data, creadoPorUsuarioId) {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Insertar Persona
      const reqPersona = new sql.Request(transaction);
      reqPersona.input('tipo_doc_id',      sql.Int,      data.tipo_doc_id);
      reqPersona.input('nro_documento',    sql.NVarChar, data.nro_documento);
      reqPersona.input('apellido_paterno', sql.NVarChar, data.apellido_paterno);
      reqPersona.input('apellido_materno', sql.NVarChar, data.apellido_materno || null);
      reqPersona.input('nombres',          sql.NVarChar, data.nombres);
      reqPersona.input('fecha_nacimiento', sql.Date,     data.fecha_nacimiento || null);
      reqPersona.input('sexo_id',          sql.Int,      data.sexo_id || null);
      reqPersona.input('estado_civil_id',  sql.Int,      data.estado_civil_id || null);
      reqPersona.input('nacionalidad',     sql.NVarChar, data.nacionalidad || 'Peruana');
      reqPersona.input('email_personal',   sql.NVarChar, data.email_personal || null);
      reqPersona.input('email_corporativo',sql.NVarChar, data.email_corporativo || null);
      reqPersona.input('telefono_celular', sql.NVarChar, data.telefono_celular || null);
      reqPersona.input('telefono_fijo',    sql.NVarChar, data.telefono_fijo || null);
      reqPersona.input('direccion',        sql.NVarChar, data.direccion || null);
      reqPersona.input('ubigeo',           sql.Char,     data.ubigeo || null);
      reqPersona.input('banco_id',         sql.Int,      data.banco_id || null);
      reqPersona.input('tipo_cuenta_id',   sql.Int,      data.tipo_cuenta_id || null);
      reqPersona.input('nro_cuenta',       sql.NVarChar, data.nro_cuenta || null);
      reqPersona.input('cuenta_cci',       sql.NVarChar, data.cuenta_cci || null);
      reqPersona.input('afp_id',           sql.Int,      data.afp_id || null);
      reqPersona.input('nro_cuspp',        sql.NVarChar, data.nro_cuspp || null);
      reqPersona.input('nro_essalud',      sql.NVarChar, data.nro_essalud || null);
      reqPersona.input('estado',           sql.NVarChar, data.estado || 'CANDIDATO');

      const resPersona = await reqPersona.query(`
        INSERT INTO personas (
          tipo_doc_id, nro_documento, apellido_paterno, apellido_materno, nombres,
          fecha_nacimiento, sexo_id, estado_civil_id, nacionalidad,
          email_personal, email_corporativo, telefono_celular, telefono_fijo,
          direccion, ubigeo, banco_id, tipo_cuenta_id, nro_cuenta, cuenta_cci,
          afp_id, nro_cuspp, nro_essalud, estado
        )
        OUTPUT INSERTED.id
        VALUES (
          @tipo_doc_id, @nro_documento, @apellido_paterno, @apellido_materno, @nombres,
          @fecha_nacimiento, @sexo_id, @estado_civil_id, @nacionalidad,
          @email_personal, @email_corporativo, @telefono_celular, @telefono_fijo,
          @direccion, @ubigeo, @banco_id, @tipo_cuenta_id, @nro_cuenta, @cuenta_cci,
          @afp_id, @nro_cuspp, @nro_essalud, @estado
        )
      `);

      const personaId = resPersona.recordset[0].id;

      // 2. Crear Expediente Laboral Asociado
      const expedienteCodigo = `EXP-${data.nro_documento}`;
      const reqExp = new sql.Request(transaction);
      reqExp.input('persona_id', sql.Int,      personaId);
      reqExp.input('codigo',     sql.NVarChar, expedienteCodigo);
      reqExp.input('creado_por', sql.Int,      creadoPorUsuarioId);

      await reqExp.query(`
        INSERT INTO expedientes_laborales (persona_id, codigo, creado_por)
        VALUES (@persona_id, @codigo, @creado_por)
      `);

      await transaction.commit();
      return personaId;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },

  async update(id, data) {
    const pool = getPool();
    await pool.request()
      .input('id',               sql.Int,      id)
      .input('tipo_doc_id',      sql.Int,      data.tipo_doc_id)
      .input('nro_documento',    sql.NVarChar, data.nro_documento)
      .input('apellido_paterno', sql.NVarChar, data.apellido_paterno)
      .input('apellido_materno', sql.NVarChar, data.apellido_materno || null)
      .input('nombres',          sql.NVarChar, data.nombres)
      .input('fecha_nacimiento', sql.Date,     data.fecha_nacimiento || null)
      .input('sexo_id',          sql.Int,      data.sexo_id || null)
      .input('estado_civil_id',  sql.Int,      data.estado_civil_id || null)
      .input('nacionalidad',     sql.NVarChar, data.nacionalidad || 'Peruana')
      .input('email_personal',   sql.NVarChar, data.email_personal || null)
      .input('email_corporativo',sql.NVarChar, data.email_corporativo || null)
      .input('telefono_celular', sql.NVarChar, data.telefono_celular || null)
      .input('telefono_fijo',    sql.NVarChar, data.telefono_fijo || null)
      .input('direccion',        sql.NVarChar, data.direccion || null)
      .input('ubigeo',           sql.Char,     data.ubigeo || null)
      .input('banco_id',         sql.Int,      data.banco_id || null)
      .input('tipo_cuenta_id',   sql.Int,      data.tipo_cuenta_id || null)
      .input('nro_cuenta',       sql.NVarChar, data.nro_cuenta || null)
      .input('cuenta_cci',       sql.NVarChar, data.cuenta_cci || null)
      .input('afp_id',           sql.Int,      data.afp_id || null)
      .input('nro_cuspp',        sql.NVarChar, data.nro_cuspp || null)
      .input('nro_essalud',      sql.NVarChar, data.nro_essalud || null)
      .input('estado',           sql.NVarChar, data.estado || 'CANDIDATO')
      .query(`
        UPDATE personas
        SET    tipo_doc_id = @tipo_doc_id, nro_documento = @nro_documento,
               apellido_paterno = @apellido_paterno, apellido_materno = @apellido_materno,
               nombres = @nombres, fecha_nacimiento = @fecha_nacimiento, sexo_id = @sexo_id,
               estado_civil_id = @estado_civil_id, nacionalidad = @nacionalidad,
               email_personal = @email_personal, email_corporativo = @email_corporativo,
               telefono_celular = @telefono_celular, telefono_fijo = @telefono_fijo,
               direccion = @direccion, ubigeo = @ubigeo, banco_id = @banco_id,
               tipo_cuenta_id = @tipo_cuenta_id, nro_cuenta = @nro_cuenta, cuenta_cci = @cuenta_cci,
               afp_id = @afp_id, nro_cuspp = @nro_cuspp, nro_essalud = @nro_essalud,
               estado = @estado, actualizado_en = GETDATE()
        WHERE  id = @id
      `);
  },

  async delete(id) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE personas SET estado = 'INACTIVO', actualizado_en = GETDATE() WHERE id = @id");
  },

  // ── Métodos para obtener los catálogos necesarios para los formularios ──
  async getCatalogs() {
    const pool = getPool();
    const [docs, sexos, civils, bancos, cuentas, afps] = await Promise.all([
      pool.request().query("SELECT id, codigo, descripcion FROM cat_tipo_documento WHERE activo = 1"),
      pool.request().query("SELECT id, codigo, descripcion FROM cat_sexo"),
      pool.request().query("SELECT id, codigo, descripcion FROM cat_estado_civil WHERE activo = 1"),
      pool.request().query("SELECT id, codigo, nombre FROM cat_banco WHERE activo = 1"),
      pool.request().query("SELECT id, codigo, descripcion FROM cat_tipo_cuenta_bancaria"),
      pool.request().query("SELECT id, codigo, nombre FROM cat_afp WHERE activo = 1")
    ]);
    return {
      tipos_documento: docs.recordset,
      sexos:           sexos.recordset,
      estados_civil:   civils.recordset,
      bancos:          bancos.recordset,
      tipos_cuenta:    cuentas.recordset,
      afps:            afps.recordset
    };
  }
};

module.exports = PersonaModel;
