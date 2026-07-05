// ─────────────────────────────────────────────────────────────
//  SEED — Datos iniciales del sistema SCGRH
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
  console.log('  ✔ Cargos creados (5)');

  // 5. Rol Admin
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

  // 6. Usuario administrador
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
