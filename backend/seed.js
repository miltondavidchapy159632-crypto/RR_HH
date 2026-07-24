require('dotenv').config();
const { sql, connectDB } = require('./config/database');

async function seed() {
  const pool = await connectDB();
  const req = () => pool.request();
  
  try {
    console.log('--- Iniciando Seeding Masivo ---');
    
    // Disable constraints temporarily
    await req().query(`EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"`);

    const tables = [
      'solicitudes_desvinculacion', 'certificaciones_empleado', 'vacantes', 
      'contratos', 'expedientes_laborales', 'personas', 
      'puestos', 'cargos', 'areas', 'sucursales', 'empresas', 'certificaciones'
    ];
    for (const table of tables) {
      try {
        await req().query(`DELETE FROM ${table}; DBCC CHECKIDENT('${table}', RESEED, 0);`);
      } catch (e) {
        await req().query(`DELETE FROM ${table};`).catch(() => {});
      }
    }

    // 1. Estructura base
    await req().query(`
      INSERT INTO empresas (razon_social, ruc, nombre_comercial, activo) VALUES ('Restaurante del Futuro S.A.C.', '20123456789', 'Restaurante del Futuro', 1);
      
      INSERT INTO sucursales (empresa_id, codigo, nombre, activo) VALUES 
        (1, 'SUC-01', 'Sede Central Piura', 1),
        (1, 'SUC-02', 'Sede Castilla', 1),
        (1, 'SUC-03', 'Sede Centro Comercial', 1);

      INSERT INTO areas (empresa_id, codigo, nombre, activo) VALUES 
        (1, 'A01', 'Cocina', 1),
        (1, 'A02', 'Salon', 1),
        (1, 'A03', 'Administracion', 1);

      INSERT INTO cargos (area_id, codigo, nombre, nivel_jerarquico) VALUES 
        (1, 'C01', 'Chef Ejecutivo', 2),
        (1, 'C02', 'Ayudante de Cocina', 4),
        (2, 'C03', 'Jefe de Salon', 3),
        (2, 'C04', 'Mozo', 5),
        (3, 'C05', 'Administrador', 2),
        (3, 'C06', 'Cajero', 4);

      INSERT INTO puestos (cargo_id, sucursal_id, codigo, cantidad_plazas) VALUES 
        (1, 1, 'P01', 2),
        (2, 1, 'P02', 10),
        (2, 2, 'P03', 10),
        (4, 1, 'P04', 15),
        (5, 1, 'P05', 2),
        (6, 1, 'P06', 5),
        (4, 2, 'P07', 15),
        (2, 3, 'P08', 10),
        (4, 3, 'P09', 15);
    `);

    // 2. Generación programática de 40 Empleados (101 a 140)
    const pwdHash = '$2a$10$14FY6zqk5.2gvzFqP9SJIOSaS66ZNntDU5Bcbu9CJ5k0aOeI8E6nO'; // '123456'
    
    let uRows = [], uRoles = [], pRows = [], eRows = [], cRows = [], certRows = [], dRows = [];
    
    for(let i = 101; i <= 140; i++) {
      uRows.push(`(${i}, 'user${i}', 'user${i}@test.com', '${pwdHash}', 1, 'ACTIVO')`);
      uRoles.push(`(${i}, 6)`);
      
      const doc = '7000' + i.toString().padStart(4, '0');
      pRows.push(`(1, '${doc}', 'Nombre${i}', 'Apellido${i}', ${i})`);
      
      const pId = i - 100; // 1 to 40
      const isCerrado = (i % 6 === 0);
      const estExp = isCerrado ? 'CERRADO' : 'COMPLETO';
      eRows.push(`(${pId}, 'EXP-${pId.toString().padStart(3, '0')}', '${estExp}', 1)`);
      
      // Random Puesto from 1 to 9 (distribuidos en las 3 sedes)
      const puestoId = (i % 9) + 1;
      // Algunos contratos están a punto de vencer (en 15 o 30 días)
      const isPorVencer = (i % 8 === 0) && !isCerrado; 
      
      let estContrato = 'VIGENTE';
      let fin = 'NULL';
      
      if (isCerrado) {
        estContrato = 'VENCIDO';
        fin = "'2024-10-31'";
      } else if (isPorVencer) {
        estContrato = 'VIGENTE';
        // Vence en 15 dias
        fin = "DATEADD(day, 15, GETDATE())";
      }

      cRows.push(`(${pId}, ${puestoId}, 1, 'CT-${pId}', '2023-01-01', ${fin}, 1500, '${estContrato}', 1)`);

      // Desvinculaciones para los contratos vencidos
      if (isCerrado) {
        const mesesAtras = (i % 5) + 1; // 1 a 5 meses atrás
        dRows.push(`(${pId}, 1, DATEADD(month, -${mesesAtras}, GETDATE()), DATEADD(month, -${mesesAtras}, GETDATE()), 'APROBADA', 1)`);
      }

      // Certificaciones aleatorias (Sanitarias, etc.)
      if (i % 2 === 0) {
         const estadoCert = (i % 6 === 0) ? 'Vencida' : (i % 10 === 0) ? 'Por_Vencer' : (i % 14 === 0) ? 'Revocada' : 'Vigente';
         certRows.push(`(${pId}, 1, 'CERT-${pId}', GETDATE(), DATEADD(month, 6, GETDATE()), '${estadoCert}', 1)`);
      }
    }

    // Insertar Usuarios
    await req().query(`DELETE FROM usuarios_roles WHERE usuario_id >= 101; DELETE FROM usuarios WHERE id >= 101;`);
    
    // Partir en chunks porque SQL Server no aguanta inserts inmensos en un solo string a veces, aunque 40 está bien
    await req().query(`
      SET IDENTITY_INSERT usuarios ON;
      INSERT INTO usuarios (id, username, email, password_hash, empresa_id, estado) VALUES ${uRows.join(',')};
      SET IDENTITY_INSERT usuarios OFF;
    `);
    
    await req().query(`INSERT INTO usuarios_roles (usuario_id, rol_id) VALUES ${uRoles.join(',')};`);

    // Insertar resto
    await req().query(`INSERT INTO personas (tipo_doc_id, nro_documento, nombres, apellido_paterno, usuario_id) VALUES ${pRows.join(',')};`);
    await req().query(`INSERT INTO expedientes_laborales (persona_id, codigo, estado, creado_por) VALUES ${eRows.join(',')};`);
    await req().query(`INSERT INTO contratos (expediente_id, puesto_id, tipo_contrato_id, codigo, fecha_inicio, fecha_fin, salario_base, estado, creado_por) VALUES ${cRows.join(',')};`);
    
    if (dRows.length > 0) {
        await req().query(`INSERT INTO solicitudes_desvinculacion (contrato_id, motivo_cese_id, fecha_solicitud, fecha_cese_propuesta, estado, registrado_por) VALUES ${dRows.join(',')};`);
    }
    if (certRows.length > 0) {
        await req().query(`INSERT INTO certificaciones_empleado (contrato_id, certificacion_id, nro_certificado, fecha_obtencion, fecha_vencimiento, estado, registrado_por) VALUES ${certRows.join(',')};`);
    }

    // Vacantes abiertas
    await req().query(`
      INSERT INTO vacantes (puesto_id, sucursal_id, titulo, descripcion, cantidad_requerida, presupuesto_aprobado, estado, creado_por) VALUES 
        (2, 3, 'Ayudante de Cocina', 'Temporal', 2, 1, 'PUBLICADA', 1),
        (4, 2, 'Mozo', 'Turno Tarde', 4, 1, 'PUBLICADA', 1),
        (5, 1, 'Administrador Asistente', 'Contrato a plazo', 1, 1, 'PUBLICADA', 1),
        (8, 3, 'Ayudante', 'Urgente', 3, 1, 'PUBLICADA', 1),
        (9, 3, 'Mozo Principal', 'Fines de semana', 2, 1, 'PUBLICADA', 1);
    `);

    // Re-enable constraints
    await req().query(`EXEC sp_msforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"`);
    
    console.log('--- 40 Empleados ficticios insertados exitosamente ---');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
