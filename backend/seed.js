// ─────────────────────────────────────────────────────────────
//  SEED — Datos iniciales del sistema SCGRH (Incluye Asistencia y Catálogos)
//  Ejecutar: node seed.js
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const bcrypt     = require('bcryptjs');
const { connectDB, getPool, sql } = require('./config/database');

async function seed() {
  await connectDB();
  const pool = getPool();
  console.log('\n🌱 Insertando datos iniciales...\n');

  // 1. Empresa de ejemplo
  await pool.request()
    .input('ruc',   sql.NVarChar, '20123456789')
    .input('rs',    sql.NVarChar, 'Restaurantes El Sabor SAC')
    .input('nc',    sql.NVarChar, 'El Sabor')
    .input('dir',   sql.NVarChar, 'Av. Grau 123, Piura')
    .input('email', sql.NVarChar, 'admin@elsabor.pe')
    .query(`
      IF NOT EXISTS (SELECT 1 FROM empresas WHERE ruc = @ruc)
        INSERT INTO empresas (ruc, razon_social, nombre_comercial, direccion_fiscal, email_corporativo)
        VALUES (@ruc, @rs, @nc, @dir, @email)
    `);
  console.log('  ✔ Empresa creada');

  const empRes = await pool.request()
    .input('ruc', sql.NVarChar, '20123456789')
    .query('SELECT id FROM empresas WHERE ruc = @ruc');
  const empresaId = empRes.recordset[0].id;

  // 2. Sucursales
  const sucursales = [
    { codigo: 'SUC-001', nombre: 'Sede Central Piura',  dir: 'Av. Grau 123' },
    { codigo: 'SUC-002', nombre: 'Sede Castilla',        dir: 'Jr. Lima 456' },
    { codigo: 'SUC-003', nombre: 'Sede Centro Comercial',dir: 'CC Real Plaza L-12' },
  ];
  for (const s of sucursales) {
    await pool.request()
      .input('eid',    sql.Int,         empresaId)
      .input('codigo', sql.NVarChar,    s.codigo)
      .input('nombre', sql.NVarChar,    s.nombre)
      .input('dir',    sql.NVarChar,    s.dir)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM sucursales WHERE codigo = @codigo)
          INSERT INTO sucursales (empresa_id, codigo, nombre, direccion)
          VALUES (@eid, @codigo, @nombre, @dir)
      `);
  }
  console.log('  ✔ Sucursales creadas (3)');

  // 3. Áreas
  const areas = [
    { codigo: 'AREA-OPE', nombre: 'Operaciones' },
    { codigo: 'AREA-ADM', nombre: 'Administración' },
    { codigo: 'AREA-COC', nombre: 'Cocina' },
    { codigo: 'AREA-ATN', nombre: 'Atención al Cliente' },
    { codigo: 'AREA-LOG', nombre: 'Logística' },
  ];
  for (const a of areas) {
    await pool.request()
      .input('eid',    sql.Int,      empresaId)
      .input('codigo', sql.NVarChar, a.codigo)
      .input('nombre', sql.NVarChar, a.nombre)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM areas WHERE codigo = @codigo)
          INSERT INTO areas (empresa_id, codigo, nombre)
          VALUES (@eid, @codigo, @nombre)
      `);
  }
  console.log('  ✔ Áreas creadas (5)');

  // 4. Cargos
  const areaAdmRes = await pool.request()
    .input('c', sql.NVarChar, 'AREA-ADM')
    .query('SELECT id FROM areas WHERE codigo = @c');
  const areaOpeRes = await pool.request()
    .input('c', sql.NVarChar, 'AREA-OPE')
    .query('SELECT id FROM areas WHERE codigo = @c');
  const areaAtnRes = await pool.request()
    .input('c', sql.NVarChar, 'AREA-ATN')
    .query('SELECT id FROM areas WHERE codigo = @c');

  const areaAdmId = areaAdmRes.recordset[0].id;
  const areaOpeId = areaOpeRes.recordset[0].id;
  const areaAtnId = areaAtnRes.recordset[0].id;

  const cargos = [
    { area: areaAdmId, codigo: 'CARG-GER', nombre: 'Gerente General',     sMin: 5000, sMax: 8000 },
    { area: areaAdmId, codigo: 'CARG-ADM', nombre: 'Asistente Administrativo', sMin: 1500, sMax: 2500 },
    { area: areaOpeId, codigo: 'CARG-SUP', nombre: 'Supervisor de Turno',  sMin: 2000, sMax: 3500 },
    { area: areaAtnId, codigo: 'CARG-CAJ', nombre: 'Cajero/a',             sMin: 1050, sMax: 1600 },
    { area: areaAtnId, codigo: 'CARG-MOZ', nombre: 'Mozo/Moza',            sMin: 1050, sMax: 1500 },
  ];
  for (const c of cargos) {
    await pool.request()
      .input('aid',    sql.Int,      c.area)
      .input('codigo', sql.NVarChar, c.codigo)
      .input('nombre', sql.NVarChar, c.nombre)
      .input('smin',   sql.Decimal,  c.sMin)
      .input('smax',   sql.Decimal,  c.sMax)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM cargos WHERE codigo = @codigo)
          INSERT INTO cargos (area_id, codigo, nombre, salario_min, salario_max)
          VALUES (@aid, @codigo, @nombre, @smin, @smax)
      `);
  }
  console.log('  ✔ Cargos creadas (5)');

  // 5. Puestos (Plazas Libres)
  const sucursalPiuraRes = await pool.request()
    .input('c', sql.NVarChar, 'SUC-001')
    .query('SELECT id FROM sucursales WHERE codigo = @c');
  const sucursalPiuraId = sucursalPiuraRes.recordset[0].id;

  const cargoMozRes = await pool.request()
    .input('c', sql.NVarChar, 'CARG-MOZ')
    .query('SELECT id FROM cargos WHERE codigo = @c');
  const cargoMozId = cargoMozRes.recordset[0].id;

  await pool.request()
    .input('cargo_id',    sql.Int,      cargoMozId)
    .input('sucursal_id', sql.Int,      sucursalPiuraId)
    .input('codigo',      sql.NVarChar, 'PUESTO-MOZO-01')
    .query(`
      IF NOT EXISTS (SELECT 1 FROM puestos WHERE codigo = @codigo)
        INSERT INTO puestos (cargo_id, sucursal_id, codigo, cantidad_plazas, plazas_ocupadas)
        VALUES (@cargo_id, @sucursal_id, @codigo, 5, 0)
    `);
  console.log('  ✔ Puestos/Plazas creadas');

  // 6. Catálogos Maestros (Documentos, Sexos, Estados Civil, AFP, Bancos)
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM cat_tipo_documento WHERE codigo = 'DNI')
      INSERT INTO cat_tipo_documento (codigo, descripcion) VALUES ('DNI', 'Documento Nacional de Identidad');
    IF NOT EXISTS (SELECT 1 FROM cat_tipo_documento WHERE codigo = 'RUC')
      INSERT INTO cat_tipo_documento (codigo, descripcion) VALUES ('RUC', 'Registro Único de Contribuyente');
    IF NOT EXISTS (SELECT 1 FROM cat_tipo_documento WHERE codigo = 'CE')
      INSERT INTO cat_tipo_documento (codigo, descripcion) VALUES ('CE', 'Carnet de Extranjería');

    IF NOT EXISTS (SELECT 1 FROM cat_sexo WHERE codigo = 'M')
      INSERT INTO cat_sexo (codigo, descripcion) VALUES ('M', 'Masculino');
    IF NOT EXISTS (SELECT 1 FROM cat_sexo WHERE codigo = 'F')
      INSERT INTO cat_sexo (codigo, descripcion) VALUES ('F', 'Femenino');

    IF NOT EXISTS (SELECT 1 FROM cat_estado_civil WHERE codigo = 'SOLTERO')
      INSERT INTO cat_estado_civil (codigo, descripcion) VALUES ('SOLTERO', 'Soltero/a');
    IF NOT EXISTS (SELECT 1 FROM cat_estado_civil WHERE codigo = 'CASADO')
      INSERT INTO cat_estado_civil (codigo, descripcion) VALUES ('CASADO', 'Casado/a');
    IF NOT EXISTS (SELECT 1 FROM cat_estado_civil WHERE codigo = 'CONVIVIENTE')
      INSERT INTO cat_estado_civil (codigo, descripcion) VALUES ('CONVIVIENTE', 'Conviviente');

    IF NOT EXISTS (SELECT 1 FROM cat_tipo_cuenta_bancaria WHERE codigo = 'AHORROS')
      INSERT INTO cat_tipo_cuenta_bancaria (codigo, descripcion) VALUES ('AHORROS', 'Cuenta Ahorros');
    IF NOT EXISTS (SELECT 1 FROM cat_tipo_cuenta_bancaria WHERE codigo = 'CORRIENTE')
      INSERT INTO cat_tipo_cuenta_bancaria (codigo, descripcion) VALUES ('CORRIENTE', 'Cuenta Corriente');

    IF NOT EXISTS (SELECT 1 FROM cat_banco WHERE codigo = 'BCP')
      INSERT INTO cat_banco (codigo, nombre) VALUES ('BCP', 'Banco de Crédito del Perú');
    IF NOT EXISTS (SELECT 1 FROM cat_banco WHERE codigo = 'BBVA')
      INSERT INTO cat_banco (codigo, nombre) VALUES ('BBVA', 'BBVA Banco Continental');
    IF NOT EXISTS (SELECT 1 FROM cat_banco WHERE codigo = 'INTERBANK')
      INSERT INTO cat_banco (codigo, nombre) VALUES ('INTERBANK', 'Interbank');

    IF NOT EXISTS (SELECT 1 FROM cat_afp WHERE codigo = 'INTEGRA')
      INSERT INTO cat_afp (codigo, nombre, tasa_comision) VALUES ('INTEGRA', 'AFP Integra', 0.0150);
    IF NOT EXISTS (SELECT 1 FROM cat_afp WHERE codigo = 'PRIMA')
      INSERT INTO cat_afp (codigo, nombre, tasa_comision) VALUES ('PRIMA', 'AFP Prima', 0.0160);
    IF NOT EXISTS (SELECT 1 FROM cat_afp WHERE codigo = 'ONP')
      INSERT INTO cat_afp (codigo, nombre, tasa_comision) VALUES ('ONP', 'Oficina de Normalización Previsional', 0.1300);

    IF NOT EXISTS (SELECT 1 FROM cat_tipo_contrato WHERE codigo = 'INDETERMINADO')
      INSERT INTO cat_tipo_contrato (codigo, descripcion, requiere_fin) VALUES ('INDETERMINADO', 'Contrato a Plazo Indeterminado', 0);
    IF NOT EXISTS (SELECT 1 FROM cat_tipo_contrato WHERE codigo = 'PLAZO_FIJO')
      INSERT INTO cat_tipo_contrato (codigo, descripcion, requiere_fin) VALUES ('PLAZO_FIJO', 'Contrato a Plazo Fijo', 1);
  `);
  console.log('  ✔ Catálogos Maestros rellenados');

  // 7. Turno de prueba (Oficina regular)
  await pool.request()
    .input('eid',    sql.Int,      empresaId)
    .input('codigo', sql.NVarChar, 'TUR-ADM')
    .input('nombre', sql.NVarChar, 'Horario de Oficina Administrativo')
    .input('entrada',sql.VarChar,  '08:00')
    .input('salida', sql.VarChar,  '17:00')
    .input('tol',    sql.SmallInt, 10)
    .input('horas',  sql.Decimal,  8.00)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM turnos WHERE codigo = @codigo)
        INSERT INTO turnos (empresa_id, codigo, nombre, hora_entrada, hora_salida, tolerancia_min, horas_diarias, nocturno)
        VALUES (@eid, @codigo, @nombre, CAST(@entrada AS TIME), CAST(@salida AS TIME), @tol, @horas, 0)
    `);
  console.log('  ✔ Turno Administrativo de prueba creado');

  // 8. Rol Admin
  await pool.request()
    .input('codigo',  sql.NVarChar, 'ADMIN_SISTEMA')
    .input('nombre',  sql.NVarChar, 'Administrador del Sistema')
    .query(`
      IF NOT EXISTS (SELECT 1 FROM roles WHERE codigo = @codigo)
        INSERT INTO roles (codigo, nombre) VALUES (@codigo, @nombre)
    `);

  const rolRes = await pool.request()
    .input('c', sql.NVarChar, 'ADMIN_SISTEMA')
    .query('SELECT id FROM roles WHERE codigo = @c');
  const rolId = rolRes.recordset[0].id;

  // 9. Usuario administrador
  const hash = await bcrypt.hash('Admin123!', 10);
  await pool.request()
    .input('username', sql.NVarChar, 'admin')
    .input('email',    sql.NVarChar, 'admin@scgrh.pe')
    .input('hash',     sql.NVarChar, hash)
    .input('eid',      sql.Int,      empresaId)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM usuarios WHERE username = @username)
        INSERT INTO usuarios (username, email, password_hash, empresa_id)
        VALUES (@username, @email, @hash, @eid)
    `);

  const userRes = await pool.request()
    .input('u', sql.NVarChar, 'admin')
    .query('SELECT id FROM usuarios WHERE username = @u');
  const userId = userRes.recordset[0].id;

  await pool.request()
    .input('uid', sql.Int, userId)
    .input('rid', sql.Int, rolId)
    .query(`
      IF NOT EXISTS (SELECT 1 FROM usuarios_roles WHERE usuario_id = @uid AND rol_id = @rid)
        INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES (@uid, @rid)
    `);

  console.log('  ✔ Usuario admin creado');
  console.log('\n════════════════════════════════════════');
  console.log('  Usuario: admin');
  console.log('  Contraseña: Admin123!');
  console.log('════════════════════════════════════════\n');

  process.exit(0);
}

seed().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
