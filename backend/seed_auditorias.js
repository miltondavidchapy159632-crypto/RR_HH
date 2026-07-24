require('dotenv').config();
const { connectDB } = require('./config/database');

async function seedAuditorias() {
  const pool = await connectDB();
  const req = () => pool.request();
  
  try {
    console.log('--- Iniciando Seeding de Auditorias ---');
    
    // 1. Zonas
    await req().query(`DELETE FROM auditoria_detalles; DELETE FROM auditorias; DELETE FROM zonas_restaurante; DBCC CHECKIDENT('zonas_restaurante', RESEED, 0); DBCC CHECKIDENT('auditorias', RESEED, 0);`);
    
    await req().query(`
      INSERT INTO zonas_restaurante (sucursal_id, codigo, nombre, tipo, activo) VALUES 
        (1, 'Z01', 'Cocina Principal', 'COCINA', 1),
        (1, 'Z02', 'Salón Comedor A', 'SALON', 1),
        (1, 'Z03', 'Cámara de Frío', 'BODEGA', 1),
        (2, 'Z04', 'Cocina Sede Castilla', 'COCINA', 1),
        (3, 'Z05', 'Barra Centro Comercial', 'BAR', 1);
    `);
    
    // 2. Auditorias
    await req().query(`
      SET IDENTITY_INSERT auditorias ON;
      INSERT INTO auditorias (id, zona_id, auditor_id, tipo, puntaje_total, observaciones, estado, fecha_auditoria) VALUES 
        (1, 1, 1, 'HIGIENE', 85, 'Falta limpieza en filtros', 'COMPLETADA', DATEADD(day, -2, GETDATE())),
        (2, 2, 1, 'SEGURIDAD', 100, 'Todo en orden', 'COMPLETADA', DATEADD(day, -5, GETDATE())),
        (3, 4, 1, 'HIGIENE', 70, 'Pisos con restos orgánicos', 'COMPLETADA', DATEADD(day, -10, GETDATE())),
        (4, 5, 1, 'MANTENIMIENTO', 90, 'Luz fundida en barra', 'COMPLETADA', DATEADD(day, -15, GETDATE()));
      SET IDENTITY_INSERT auditorias OFF;
    `);

    // 3. Auditorias Detalles (solo unos cuantos)
    await req().query(`
      INSERT INTO auditoria_detalles (auditoria_id, item_evaluado, cumple, observacion) VALUES 
        (1, 'Pisos limpios y sin residuos', 1, NULL),
        (1, 'Equipos libres de grasa incrustada', 0, 'Campana sucia'),
        (2, 'Extintores accesibles', 1, NULL),
        (2, 'Botiquín de primeros auxilios completo', 1, NULL),
        (3, 'Superficies de trabajo desinfectadas', 1, NULL),
        (3, 'Pisos limpios y sin residuos', 0, 'Restos bajo lavadero'),
        (4, 'Luces y focos operativos', 0, 'Foco 3 parpadea'),
        (4, 'Sistemas de agua sin fugas', 1, NULL);
    `);

    console.log('--- Auditorias y Zonas insertadas exitosamente ---');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

seedAuditorias();
