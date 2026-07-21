require('dotenv').config();
const { sql, connectDB } = require('./config/database');

async function seed() {
  const pool = await connectDB();
  const req = () => pool.request();
  
  try {
    console.log('--- Iniciando Seeding ---');
    
    // Disable constraints temporarily for robust insert
    await req().query(`EXEC sp_msforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"`);

    // Clear tables
    const tables = [
      'desvinculaciones', 'solicitudes_desvinculacion', 'certificaciones_empleado', 'vacantes', 
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

    // Empresas
    await req().query(`
      INSERT INTO empresas (razon_social, ruc, nombre_comercial, activo) VALUES ('Restaurante del Futuro S.A.C.', '20123456789', 'Restaurante del Futuro', 1);
    `);
    
    // Sucursales
    await req().query(`
      INSERT INTO sucursales (empresa_id, codigo, nombre, activo) VALUES 
        (1, 'SUC-01', 'Sede Central Piura', 1),
        (1, 'SUC-02', 'Sede Castilla', 1),
        (1, 'SUC-03', 'Sede Centro Comercial', 1);
    `);
    
    // Areas
    await req().query(`
      INSERT INTO areas (empresa_id, codigo, nombre, activo) VALUES 
        (1, 'A01', 'Cocina', 1),
        (1, 'A02', 'Salon', 1),
        (1, 'A03', 'Administracion', 1);
    `);
    
    // Cargos
    await req().query(`
      INSERT INTO cargos (area_id, codigo, nombre, nivel_jerarquico) VALUES 
        (1, 'C01', 'Chef Ejecutivo', 2),
        (1, 'C02', 'Ayudante de Cocina', 4),
        (2, 'C03', 'Jefe de Salon', 3),
        (2, 'C04', 'Mozo', 5),
        (3, 'C05', 'Administrador', 2),
        (3, 'C06', 'Cajero', 4);
    `);
    
    // Puestos
    await req().query(`
      INSERT INTO puestos (cargo_id, sucursal_id, codigo, cantidad_plazas) VALUES 
        (1, 1, 'P01', 1),
        (2, 1, 'P02', 2),
        (2, 2, 'P03', 1),
        (4, 1, 'P04', 3),
        (5, 1, 'P05', 1),
        (6, 1, 'P06', 2),
        (4, 2, 'P07', 2);
    `);

    // Personas
    await req().query(`
      INSERT INTO personas (tipo_doc_id, nro_documento, nombres, apellido_paterno, usuario_id) VALUES 
        (1, '70000001', 'Juan', 'Perez', 101),
        (1, '70000002', 'Maria', 'Gomez', 102),
        (1, '70000003', 'Carlos', 'Torres', 103),
        (1, '70000004', 'Ana', 'Vargas', 104),
        (1, '70000005', 'Luis', 'Castro', 105),
        (1, '70000006', 'Sofia', 'Rios', 106);
    `);

    // Expedientes Laborales
    await req().query(`
      INSERT INTO expedientes_laborales (persona_id, codigo, estado, creado_por) VALUES 
        (1, 'EXP-001', 'ACTIVO', 1),
        (2, 'EXP-002', 'ACTIVO', 1),
        (3, 'EXP-003', 'ACTIVO', 1),
        (4, 'EXP-004', 'ACTIVO', 1),
        (5, 'EXP-005', 'CERRADO', 1),
        (6, 'EXP-006', 'CERRADO', 1);
    `);

    // Contratos
    await req().query(`
      INSERT INTO contratos (expediente_id, puesto_id, tipo_contrato_id, codigo, fecha_inicio, fecha_fin, salario_base, estado, creado_por) VALUES 
        (1, 1, 1, 'CT-01', '2023-01-01', NULL, 3000, 'VIGENTE', 1),
        (2, 4, 1, 'CT-02', '2023-02-01', NULL, 1800, 'VIGENTE', 1),
        (3, 5, 2, 'CT-03', '2025-01-01', DATEADD(day, 15, GETDATE()), 1200, 'VIGENTE', 1),
        (4, 6, 2, 'CT-04', '2025-02-01', DATEADD(day, 5, GETDATE()), 1200, 'VIGENTE', 1),
        (5, 2, 2, 'CT-05', '2024-01-01', '2024-06-30', 1100, 'FINALIZADO', 1),
        (6, 7, 2, 'CT-06', '2024-03-01', '2024-09-30', 1200, 'FINALIZADO', 1);
    `);

    // Vacantes
    await req().query(`
      INSERT INTO vacantes (puesto_id, sucursal_id, titulo, descripcion, cantidad_requerida, presupuesto_aprobado, estado, creado_por) VALUES 
        (2, 3, 'Ayudante de Cocina - Fines de semana', 'Se busca ayudante', 2, 1, 'PUBLICADA', 1),
        (4, 2, 'Mozo - Turno Noche', 'Atencion nocturna', 3, 1, 'PUBLICADA', 1);
    `);

    // Certificaciones
    await req().query(`
      INSERT INTO certificaciones_empleado (contrato_id, certificacion_id, nro_certificado, fecha_obtencion, fecha_vencimiento, estado, registrado_por) VALUES 
        (1, 1, 'CERT-001', GETDATE(), DATEADD(year, 1, GETDATE()), 'Vigente', 1),
        (2, 1, 'CERT-002', GETDATE(), DATEADD(day, 20, GETDATE()), 'Por_Vencer', 1),
        (3, 2, 'CERT-003', '2023-01-01', '2024-01-01', 'Vencida', 1);
    `);

    // Desvinculaciones (Solicitudes)
    await req().query(`
      INSERT INTO solicitudes_desvinculacion (contrato_id, motivo_cese_id, fecha_solicitud, fecha_cese_propuesta, estado, registrado_por) VALUES 
        (5, 1, DATEADD(month, -2, GETDATE()), DATEADD(month, -2, GETDATE()), 'APROBADA', 1),
        (6, 2, DATEADD(month, -1, GETDATE()), DATEADD(month, -1, GETDATE()), 'APROBADA', 1);
    `);

    // Desvinculaciones (Real)
    await req().query(`
      INSERT INTO desvinculaciones (contrato_id, motivo, detalle, fecha_cese, estado_liquidacion) VALUES 
        (5, 'RENUNCIA', 'Mejor oferta laboral', DATEADD(month, -2, GETDATE()), 'PAGADA'),
        (6, 'FIN_CONTRATO', 'Termino de temporada', DATEADD(month, -1, GETDATE()), 'PAGADA');
    `);

    // Re-enable constraints
    await req().query(`EXEC sp_msforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all"`);
    
    console.log('--- Datos ficticios insertados exitosamente ---');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
