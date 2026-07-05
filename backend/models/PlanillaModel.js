const { getPool, sql } = require('../config/database');

const PlanillaModel = {
  // ── Conceptos Remunerativos ──
  async getConceptos() {
    const pool = getPool();
    const res = await pool.request().query("SELECT * FROM conceptos_remunerativos WHERE activo = 1 ORDER BY tipo DESC, nombre");
    return res.recordset;
  },

  // ── Listar Planillas ──
  async findAll() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT p.id, p.periodo, p.tipo, p.estado, p.total_ingresos, p.total_descuentos, p.total_neto,
             e.razon_social AS empresa_nombre,
             s.nombre AS sucursal_nombre
      FROM   planillas p
      INNER JOIN empresas e ON e.id = p.empresa_id
      LEFT  JOIN sucursales s ON s.id = p.sucursal_id
      ORDER BY p.periodo DESC, p.creado_en DESC
    `);
    return res.recordset;
  },

  async findById(id) {
    const pool = getPool();
    const res = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, e.razon_social AS empresa_nombre, s.nombre AS sucursal_nombre
        FROM   planillas p
        INNER JOIN empresas e ON e.id = p.empresa_id
        LEFT  JOIN sucursales s ON s.id = p.sucursal_id
        WHERE  p.id = @id
      `);
    return res.recordset[0] || null;
  },

  // ── Detalle de la Planilla ──
  async getDetallePlanilla(planillaId) {
    const pool = getPool();
    const res = await pool.request()
      .input('pid', sql.Int, planillaId)
      .query(`
        SELECT dp.id, dp.dias_trabajados, dp.dias_no_labora, dp.horas_extras,
               dp.salario_base, dp.total_ingresos, dp.total_descuentos, dp.neto_pagar,
               c.codigo AS contrato_codigo,
               p.nombres + ' ' + p.apellido_paterno AS colaborador_nombre
        FROM   detalle_planilla dp
        INNER JOIN contratos c ON c.id = dp.contrato_id
        INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
        INNER JOIN personas p ON p.id = el.persona_id
        WHERE  dp.planilla_id = @pid
      `);
    return res.recordset;
  },

  // ── Crear cabecera de Planilla en BORRADOR ──
  async create(data) {
    const pool = getPool();
    const res = await pool.request()
      .input('eid',    sql.Int,      data.empresa_id)
      .input('sid',    sql.Int,      data.sucursal_id || null)
      .input('periodo',sql.Char,     data.periodo) // Ej: '2026-07'
      .input('tipo',   sql.NVarChar, data.tipo || 'MENSUAL')
      .query(`
        INSERT INTO planillas (empresa_id, sucursal_id, periodo, tipo, estado)
        OUTPUT INSERTED.id
        VALUES (@eid, @sid, @periodo, @tipo, 'BORRADOR')
      `);
    return res.recordset[0].id;
  },

  // ── PROCESAMIENTO AUTOMÁTICO DE CÁLCULO DE PLANILLA (Tardanzas + AFP/ONP + Sueldos) ──
  async calcular(planillaId) {
    const pool = getPool();

    // 1. Obtener la planilla
    const planillaRes = await pool.request()
      .input('pid', sql.Int, planillaId)
      .query("SELECT * FROM planillas WHERE id = @pid");
    const planilla = planillaRes.recordset[0];
    if (!planilla) throw new Error('La planilla no existe');
    if (planilla.estado === 'APROBADA' || planilla.estado === 'PAGADA') {
      throw new Error('No se puede recalcular una planilla aprobada o pagada.');
    }

    // 2. Obtener contratos vigentes que pertenecen a esta sucursal y empresa
    const contratosRes = await pool.request()
      .input('eid', sql.Int, planilla.empresa_id)
      .input('sid', sql.Int, planilla.sucursal_id)
      .query(`
        SELECT c.id, c.sueldo_basico, c.moneda, c.asignacion_familiar,
               p.id AS persona_id, p.afp_id, afp.tasa_comision AS afp_tasa
        FROM   contratos c
        INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
        INNER JOIN personas p ON p.id = el.persona_id
        LEFT  JOIN cat_afp afp ON afp.id = p.afp_id
        WHERE  c.empresa_id = @eid AND c.sucursal_id = @sid AND c.estado = 'VIGENTE'
      `);
    const contratos = contratosRes.recordset;

    // Limpiar cálculo previo del detalle para volver a calcular de forma limpia
    await pool.request().input('pid', sql.Int, planillaId).query(`
      DELETE FROM movimientos_planilla WHERE detalle_planilla_id IN (SELECT id FROM detalle_planilla WHERE planilla_id = @pid);
      DELETE FROM detalle_planilla WHERE planilla_id = @pid;
    `);

    // Definición de conceptos base (Sueldo, Tardanzas, AFP, Asig. Familiar)
    // Buscamos o creamos conceptos si no existen
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM conceptos_remunerativos WHERE codigo = 'ING-SUELDO')
        INSERT INTO conceptos_remunerativos (codigo, nombre, tipo, es_remunerativo) VALUES ('ING-SUELDO', 'Sueldo Básico', 'INGRESO', 1);
      IF NOT EXISTS (SELECT 1 FROM conceptos_remunerativos WHERE codigo = 'ING-ASIGFAM')
        INSERT INTO conceptos_remunerativos (codigo, nombre, tipo, es_remunerativo) VALUES ('ING-ASIGFAM', 'Asignación Familiar', 'INGRESO', 1);
      IF NOT EXISTS (SELECT 1 FROM conceptos_remunerativos WHERE codigo = 'DES-TARDANZA')
        INSERT INTO conceptos_remunerativos (codigo, nombre, tipo, es_remunerativo) VALUES ('DES-TARDANZA', 'Descuento por Tardanza', 'DESCUENTO', 0);
      IF NOT EXISTS (SELECT 1 FROM conceptos_remunerativos WHERE codigo = 'DES-PENSION')
        INSERT INTO conceptos_remunerativos (codigo, nombre, tipo, es_remunerativo) VALUES ('DES-PENSION', 'Aporte Sistema de Pensiones (AFP/ONP)', 'DESCUENTO', 0);
    `);

    const conceptosRes = await pool.request().query("SELECT id, codigo, tipo FROM conceptos_remunerativos");
    const conceptos = conceptosRes.recordset;
    const cSueldo = conceptos.find(c => c.codigo === 'ING-SUELDO').id;
    const cAsigFam = conceptos.find(c => c.codigo === 'ING-ASIGFAM').id;
    const cTardanza = conceptos.find(c => c.codigo === 'DES-TARDANZA').id;
    const cPension = conceptos.find(c => c.codigo === 'DES-PENSION').id;

    let planillaTotalIngresos = 0;
    let planillaTotalDescuentos = 0;
    let planillaTotalNeto = 0;

    // Primer día y último día del periodo en cuestión (formato 'YYYY-MM-DD')
    // Asumiendo periodo 'YYYY-MM'
    const anio = planilla.periodo.split('-')[0];
    const mes = planilla.periodo.split('-')[1];
    const primerDia = `${anio}-${mes}-01`;
    const ultimoDia = new Date(anio, mes, 0).toISOString().split('T')[0];

    for (const c of contratos) {
      const sueldoBasico = Number(c.sueldo_basico) || 0;
      
      // A) Calcular descuento de Tardanzas automático desde el módulo de marcaciones
      const tardanzaRes = await pool.request()
        .input('contrato_id', sql.Int, c.id)
        .input('ini', sql.Date, primerDia)
        .input('fin', sql.Date, ultimoDia)
        .query(`
          SELECT SUM(tardanza_minutos) AS total_minutos
          FROM   marcaciones
          WHERE  contrato_id = @contrato_id AND fecha BETWEEN @ini AND @fin AND estado = 'TARDANZA'
        `);
      
      const minutosTardanza = tardanzaRes.recordset[0].total_minutos || 0;
      // Fórmula del descuento: (Sueldo / 30 días / 8 horas / 60 min) * minutosTardanza
      const descuentoTardanza = minutosTardanza > 0 
        ? Number(((sueldoBasico / 30 / 8 / 60) * minutosTardanza).toFixed(2)) 
        : 0;

      // B) Calcular Asignación Familiar (si corresponde, en Perú es 10% del sueldo mínimo 1025.00 = 102.50)
      const asigFamiliar = c.asignacion_familiar ? 102.50 : 0.00;

      // Sumamos ingresos brutos
      const totalIngresos = sueldoBasico + asigFamiliar;

      // C) Calcular Descuento Sistema de Pensiones (AFP / ONP)
      // La tasa de la AFP/ONP se multiplica sobre el total de ingresos remunerativos
      const tasaAporte = c.afp_tasa ? Number(c.afp_tasa) : 0.13; // 13% ONP si no tiene AFP asignada
      const descuentoPension = Number((totalIngresos * tasaAporte).toFixed(2));

      // Sumamos descuentos
      const totalDescuentos = descuentoPension + descuentoTardanza;
      const netoPagar = totalIngresos - totalDescuentos;

      // Insertar en detalle_planilla
      const dpRes = await pool.request()
        .input('planilla_id', sql.Int, planillaId)
        .input('contrato_id', sql.Int, c.id)
        .input('dias_trab',    sql.Decimal, 30.00) // Se asume mes completo
        .input('salario_base', sql.Decimal, sueldoBasico)
        .input('ingresos',     sql.Decimal, totalIngresos)
        .input('descuentos',   sql.Decimal, totalDescuentos)
        .input('neto',         sql.Decimal, netoPagar)
        .query(`
          INSERT INTO detalle_planilla (planilla_id, contrato_id, dias_trabajados, salario_base, total_ingresos, total_descuentos, neto_pagar)
          OUTPUT INSERTED.id
          VALUES (@planilla_id, @contrato_id, @dias_trab, @salario_base, @ingresos, @descuentos, @neto)
        `);
      const detalleId = dpRes.recordset[0].id;

      // Registrar los movimientos individuales en movimientos_planilla
      // 1. Ingreso de Sueldo
      await pool.request()
        .input('det_id', sql.Int, detalleId)
        .input('con_id', sql.Int, cSueldo)
        .input('monto',  sql.Decimal, sueldoBasico)
        .query("INSERT INTO movimientos_planilla (detalle_planilla_id, concepto_id, monto) VALUES (@det_id, @con_id, @monto)");

      // 2. Ingreso de Asignación Familiar
      if (asigFamiliar > 0) {
        await pool.request()
          .input('det_id', sql.Int, detalleId)
          .input('con_id', sql.Int, cAsigFam)
          .input('monto',  sql.Decimal, asigFamiliar)
          .query("INSERT INTO movimientos_planilla (detalle_planilla_id, concepto_id, monto) VALUES (@det_id, @con_id, @monto)");
      }

      // 3. Descuento de Pensión (AFP/ONP)
      await pool.request()
        .input('det_id', sql.Int, detalleId)
        .input('con_id', sql.Int, cPension)
        .input('monto',  sql.Decimal, descuentoPension)
        .query("INSERT INTO movimientos_planilla (detalle_planilla_id, concepto_id, monto) VALUES (@det_id, @con_id, @monto)");

      // 4. Descuento por Tardanza (asistencia)
      if (descuentoTardanza > 0) {
        await pool.request()
          .input('det_id', sql.Int, detalleId)
          .input('con_id', sql.Int, cTardanza)
          .input('monto',  sql.Decimal, descuentoTardanza)
          .input('ref',    sql.NVarChar, `Minutos de tardanza acumulados: ${minutosTardanza} min`)
          .query("INSERT INTO movimientos_planilla (detalle_planilla_id, concepto_id, monto, referencia) VALUES (@det_id, @con_id, @monto, @ref)");
      }

      planillaTotalIngresos += totalIngresos;
      planillaTotalDescuentos += totalDescuentos;
      planillaTotalNeto += netoPagar;
    }

    // Actualizar los totales consolidados de la Planilla y pasar a estado PRE_NOMINA
    await pool.request()
      .input('pid', sql.Int,     planillaId)
      .input('ing', sql.Decimal, planillaTotalIngresos)
      .input('des', sql.Decimal, planillaTotalDescuentos)
      .input('net', sql.Decimal, planillaTotalNeto)
      .query(`
        UPDATE planillas
        SET    total_ingresos = @ing,
               total_descuentos = @des,
               total_neto = @net,
               estado = 'PRE_NOMINA',
               fecha_calculo = GETDATE()
        WHERE  id = @pid
      `);
  },

  // ── Aprobar Planilla y Generar Boletas / Archivo Bancario ──
  async aprobar(planillaId, aprobadoPorUsuarioId) {
    const pool = getPool();
    
    // 1. Aprobar la planilla
    await pool.request()
      .input('pid',     sql.Int, aprobadoId => planillaId)
      .input('user_id', sql.Int, aprobadoPorUsuarioId)
      .query(`
        UPDATE planillas
        SET    estado = 'APROBADA',
               aprobado_por = @user_id,
               aprobado_en = GETDATE()
        WHERE  id = @pid
      `);

    // 2. Generar Boletas de Pago automáticamente para cada detalle calculado
    const detalles = await pool.request()
      .input('pid', sql.Int, planillaId)
      .query("SELECT id FROM detalle_planilla WHERE planilla_id = @pid");

    for (const d of detalles.recordset) {
      const nroBoleta = `BOL-${planillaId}-${d.id}`;
      
      await pool.request()
        .input('det_id', sql.Int,      d.id)
        .input('nro',    sql.NVarChar, nroBoleta)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM boletas_pago WHERE detalle_planilla_id = @det_id)
            INSERT INTO boletas_pago (detalle_planilla_id, nro_boleta, url_pdf)
            VALUES (@det_id, @nro, 'visualizar_imprimir')
        `);
    }

    // 3. Generar archivo bancario consolidado para pago
    // (Por simplicidad en la demo, asociaremos un archivo BCP consolidado)
    const bancoBcpRes = await pool.request().query("SELECT id FROM cat_banco WHERE codigo = 'BCP'");
    if (bancoBcpRes.recordset[0]) {
      const bancoId = bancoBcpRes.recordset[0].id;
      const totalsRes = await pool.request()
        .input('pid', sql.Int, planillaId)
        .query("SELECT COUNT(*) AS total, SUM(neto_pagar) AS total_monto FROM detalle_planilla WHERE planilla_id = @pid");
      
      const count = totalsRes.recordset[0].total;
      const totalMonto = totalsRes.recordset[0].total_monto || 0;

      await pool.request()
        .input('pid', sql.Int,     planillaId)
        .input('bid', sql.Int,     bancoId)
        .input('total_reg', sql.Int, count)
        .input('monto', sql.Decimal, totalMonto)
        .query(`
          INSERT INTO archivos_bancarios (planilla_id, banco_id, nombre_archivo, total_registros, total_monto, estado)
          VALUES (@pid, @bid, 'TRANSFERENCIA-BCP-SUELDOS.txt', @total_reg, @monto, 'GENERADO')
        `);
    }
  },

  // ── Ver boleta específica ──
  async getBoletaDetallada(detallePlanillaId) {
    const pool = getPool();
    
    // Obtiene datos del colaborador, contrato, sucursal, etc.
    const headerRes = await pool.request()
      .input('dpid', sql.Int, detallePlanillaId)
      .query(`
        SELECT dp.salario_base, dp.total_ingresos, dp.total_descuentos, dp.neto_pagar,
               bp.nro_boleta, bp.generada_en,
               pl.periodo, pl.tipo AS planilla_tipo,
               per.nro_documento, per.nombres + ' ' + per.apellido_paterno AS colaborador_nombre,
               c.codigo AS contrato_codigo, c.fecha_inicio AS ingreso_fecha,
               car.nombre AS cargo_nombre,
               e.razon_social AS empresa_nombre, e.ruc AS empresa_ruc
        FROM   detalle_planilla dp
        INNER JOIN boletas_pago bp ON bp.detalle_planilla_id = dp.id
        INNER JOIN planillas pl ON pl.id = dp.planilla_id
        INNER JOIN contratos c ON c.id = dp.contrato_id
        INNER JOIN cargos car ON car.id = c.cargo_id
        INNER JOIN expedientes_laborales el ON el.id = c.expediente_id
        INNER JOIN personas per ON per.id = el.persona_id
        INNER JOIN empresas e ON e.id = pl.empresa_id
        WHERE  dp.id = @dpid
      `);
    
    // Obtiene todos los conceptos e importes detallados de la boleta
    const conceptosRes = await pool.request()
      .input('dpid', sql.Int, detallePlanillaId)
      .query(`
        SELECT mp.monto, mp.referencia, cr.nombre AS concepto_nombre, cr.tipo AS concepto_tipo, cr.codigo AS concepto_codigo
        FROM   movimientos_planilla mp
        INNER JOIN conceptos_remunerativos cr ON cr.id = mp.concepto_id
        WHERE  mp.detalle_planilla_id = @dpid
      `);

    return {
      cabecera: headerRes.recordset[0] || null,
      conceptos: conceptosRes.recordset
    };
  },

  // ── Ver archivos bancarios generados ──
  async getArchivosBancarios() {
    const pool = getPool();
    const res = await pool.request().query(`
      SELECT ab.id, ab.nombre_archivo, ab.total_registros, ab.total_monto, ab.estado, ab.generado_en,
             p.periodo AS planilla_periodo,
             b.nombre AS banco_nombre
      FROM   archivos_bancarios ab
      INNER JOIN planillas p ON p.id = ab.planilla_id
      INNER JOIN cat_banco b ON b.id = ab.banco_id
      ORDER BY ab.generado_en DESC
    `);
    return res.recordset;
  }
};

module.exports = PlanillaModel;
