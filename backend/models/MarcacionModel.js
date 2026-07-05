const { getPool, sql } = require('../config/database');

const MarcacionModel = {
  async findAll() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT m.id, m.contrato_id, m.fecha,
             FORMAT(m.hora_ingreso, 'hh:mm tt') AS hora_ingreso_formato,
             FORMAT(m.hora_salida, 'hh:mm tt') AS hora_salida_formato,
             m.fuente, m.tardanza_minutos, m.estado, m.justificacion,
             c.codigo AS contrato_codigo,
             p.nombres + ' ' + p.apellido_paterno AS colaborador_nombre,
             t.nombre AS turno_nombre
      FROM   marcaciones m
      INNER JOIN contratos c ON c.id = m.contrato_id
      INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
      INNER JOIN personas p ON p.id = el.persona_id
      INNER JOIN turnos t ON t.id = m.turno_id
      ORDER BY m.fecha DESC, m.hora_ingreso DESC
    `);
    return res.recordset;
  },

  // ── Lógica del Reloj Biométrico ──

  // 1. Buscar si existe un contrato y obtener su turno asignado para HOY
  async getTurnoAsignadoParaHoy(nroDocumento, fechaString) {
    const pool = getPool();
    // Obtiene el día de la semana en español/inglés. Usamos DATEPART de SQL Server
    // DATEPART(dw, fecha) depende del LANGUAGE, así que usaremos un CASE con DATENAME(weekday, fecha)
    const res = await pool.request()
      .input('doc', sql.NVarChar, nroDocumento)
      .input('fecha', sql.Date, fechaString)
      .query(`
        DECLARE @dw NVARCHAR(20) = LOWER(DATENAME(weekday, @fecha));
        
        SELECT c.id AS contrato_id, 
               p.id AS persona_id,
               p.nombres + ' ' + p.apellido_paterno AS colaborador_nombre,
               h.nombre AS horario_nombre,
               t.id AS turno_id,
               t.nombre AS turno_nombre,
               LEFT(CAST(t.hora_entrada AS VARCHAR), 5) AS hora_entrada,
               LEFT(CAST(t.hora_salida AS VARCHAR), 5) AS hora_salida,
               t.tolerancia_min,
               t.horas_diarias,
               -- Buscar si ya marcó ingreso/salida hoy
               m.id AS marcacion_id,
               m.hora_ingreso,
               m.hora_salida
        FROM   personas p
        INNER JOIN expedientes_laborales el ON el.persona_id = p.id
        INNER JOIN contratos c ON c.expediente_id = el.id AND c.estado = 'VIGENTE'
        INNER JOIN asignacion_horarios ah ON ah.contrato_id = c.id 
              AND @fecha BETWEEN ah.fecha_inicio AND COALESCE(ah.fecha_fin, '2099-12-31')
        INNER JOIN horarios h ON h.id = ah.horario_id
        -- Unir al turno del día de la semana correspondiente
        INNER JOIN turnos t ON t.id = CASE 
          WHEN @dw LIKE '%lunes%' OR @dw LIKE '%monday%' THEN h.lunes_turno_id
          WHEN @dw LIKE '%martes%' OR @dw LIKE '%tuesday%' THEN h.martes_turno_id
          WHEN @dw LIKE '%miercoles%' OR @dw LIKE '%wednesday%' THEN h.miercoles_turno_id
          WHEN @dw LIKE '%jueves%' OR @dw LIKE '%thursday%' THEN h.jueves_turno_id
          WHEN @dw LIKE '%viernes%' OR @dw LIKE '%friday%' THEN h.viernes_turno_id
          WHEN @dw LIKE '%sabado%' OR @dw LIKE '%saturday%' THEN h.sabado_turno_id
          WHEN @dw LIKE '%domingo%' OR @dw LIKE '%sunday%' THEN h.domingo_turno_id
        END
        LEFT JOIN marcaciones m ON m.contrato_id = c.id AND m.fecha = @fecha
        WHERE p.nro_documento = @doc
      `);
    return res.recordset[0] || null;
  },

  // 2. Registrar Entrada
  async registrarEntrada(contratoId, turnoId, fechaString, horaIngresoString, tardanzaMinutos, estado, fuente = 'WEB') {
    const pool = getPool();
    const res = await pool.request()
      .input('cid', sql.Int, contratoId)
      .input('tid', sql.Int, turnoId)
      .input('fecha', sql.Date, fechaString)
      .input('ingreso', sql.DateTime, horaIngresoString)
      .input('tardanza', sql.SmallInt, tardanzaMinutos)
      .input('estado', sql.NVarChar, estado)
      .input('fuente', sql.NVarChar, fuente)
      .query(`
        INSERT INTO marcaciones (contrato_id, turno_id, fecha, hora_ingreso, tardanza_minutos, estado, fuente)
        OUTPUT INSERTED.id
        VALUES (@cid, @tid, @fecha, @ingreso, @tardanza, @estado, @fuente)
      `);
    return res.recordset[0].id;
  },

  // 3. Registrar Salida
  async registrarSalida(marcacionId, horaSalidaString) {
    const pool = getPool();
    await pool.request()
      .input('mid', sql.Int, marcacionId)
      .input('salida', sql.DateTime, horaSalidaString)
      .query(`
        UPDATE marcaciones
        SET    hora_salida = @salida,
               estado = CASE WHEN estado = 'TARDANZA' THEN 'TARDANZA' ELSE 'PRESENTE' END
        WHERE  id = @mid
      `);
  },

  // 4. Justificar Marcación / Incidencia
  async justificarMarcacion(id, justificacion, revisadoPorUsuarioId) {
    const pool = getPool();
    await pool.request()
      .input('id', sql.Int, id)
      .input('justificacion', sql.NVarChar, justificacion)
      .input('usuario_id', sql.Int, revisadoPorUsuarioId)
      .query(`
        UPDATE marcaciones
        SET    estado = 'JUSTIFICADO',
               justificacion = @justificacion,
               justificado_por = @usuario_id
        WHERE  id = @id
      `);
  }
};

module.exports = MarcacionModel;
