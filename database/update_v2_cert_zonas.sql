-- =============================================================================
--  SCGRH — Script de actualización de base de datos
--  Agrega: Certificaciones del personal + Zonas del restaurante
--  Ejecutar en: SQL Server Management Studio (SSMS)
--  Base de datos: RR_HH
-- =============================================================================
USE [RR_HH];
GO

PRINT '>>> Iniciando actualización: Certificaciones + Zonas del Restaurante';
GO

-- =============================================================================
-- A. MÓDULO DE CERTIFICACIONES
-- =============================================================================

-- Eliminar si existen (orden inverso de dependencias)
IF OBJECT_ID('dbo.certificaciones_empleado', 'U') IS NOT NULL DROP TABLE dbo.certificaciones_empleado;
IF OBJECT_ID('dbo.certificaciones_catalogo', 'U') IS NOT NULL DROP TABLE dbo.certificaciones_catalogo;
GO

-- A1. Catálogo de certificaciones (HACCP, Sommelier, etc.)
CREATE TABLE certificaciones_catalogo (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    codigo           NVARCHAR(30)  NOT NULL UNIQUE,
    nombre           NVARCHAR(150) NOT NULL,
    descripcion      NVARCHAR(500),
    entidad_emisora  NVARCHAR(120),
    -- Vinculación a cargos (qué cargos la requieren)
    obligatoria_para NVARCHAR(300),  -- JSON de cargo_ids o descripción libre
    vigencia_meses   INT            NOT NULL DEFAULT 12,  -- meses de validez
    activo           BIT            NOT NULL DEFAULT 1,
    creado_en        DATETIME       NOT NULL DEFAULT GETDATE()
);
GO

-- A2. Certificaciones por empleado (contrato)
CREATE TABLE certificaciones_empleado (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    certificacion_id INT           NOT NULL REFERENCES certificaciones_catalogo(id),
    contrato_id      INT           NOT NULL REFERENCES contratos(id),
    nro_certificado  NVARCHAR(80),                       -- número del documento
    fecha_obtencion  DATE          NOT NULL,
    fecha_vencimiento DATE,                              -- NULL = no vence
    url_documento    NVARCHAR(500),                      -- PDF escaneado
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'VIGENTE'
                     CONSTRAINT chk_cert_estado CHECK (estado IN ('VIGENTE','POR_VENCER','VENCIDA','REVOCADA')),
    observaciones    NVARCHAR(300),
    registrado_por   INT           NOT NULL REFERENCES usuarios(id),
    creado_en        DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_cert_empleado UNIQUE (certificacion_id, contrato_id, fecha_obtencion)
);
GO

-- Índices de rendimiento
CREATE INDEX idx_cert_empleado_venc  ON certificaciones_empleado(fecha_vencimiento, estado);
CREATE INDEX idx_cert_empleado_cont  ON certificaciones_empleado(contrato_id);
GO

-- Datos iniciales — catálogo de certificaciones para restaurante lujoso
INSERT INTO certificaciones_catalogo (codigo, nombre, descripcion, entidad_emisora, vigencia_meses) VALUES
('HACCP',           'HACCP — Análisis de Peligros y Puntos Críticos de Control',
                    'Certificación internacional de inocuidad alimentaria requerida en cocina',
                    'NSF International / SENCE', 24),
('MANIPULACION',    'Manipulador de Alimentos',
                    'Certificado básico obligatorio para todo el personal de cocina y sala',
                    'DIGESA / Municipalidad', 12),
('SOMMELIER_BASICO','Sommelier Nivel Básico',
                    'Conocimiento de vinos, maridaje y servicio de vinos',
                    'Asociación de Sommeliers del Perú', 36),
('SOMMELIER_AVANZ', 'Sommelier Avanzado (WSET Level 3)',
                    'Certificación internacional avanzada en vinos y espirituosos',
                    'WSET (Wine & Spirit Education Trust)', 60),
('COCINA_MOLEC',    'Gastronomía Molecular',
                    'Técnicas de cocina de vanguardia: esferificación, geles, aires',
                    'Basque Culinary Center', 60),
('BARISMO',         'Barismo Profesional',
                    'Preparación de café de especialidad y latte art',
                    'Specialty Coffee Association (SCA)', 36),
('PRIMEROS_AUX',    'Primeros Auxilios',
                    'Atención de emergencias médicas básicas en el establecimiento',
                    'Cruz Roja Peruana', 24),
('ATENCION_VIP',    'Protocolo de Atención VIP y Lujo',
                    'Servicio de mesa de alto nivel, protocolo y etiqueta',
                    'Instituto Gastronómico de Lima', 24),
('INCENDIOS',       'Prevención y Control de Incendios',
                    'Uso de extintores y evacuación de emergencia',
                    'INDECI', 12),
('BARMAN',          'Barman / Mixología Profesional',
                    'Preparación de cócteles clásicos y creativos de alto nivel',
                    'IBA — International Bartenders Association', 36);
GO

PRINT '>>> Tablas de Certificaciones creadas correctamente.';
GO

-- =============================================================================
-- B. MÓDULO DE ZONAS DEL RESTAURANTE
-- =============================================================================

-- Eliminar si existen
IF OBJECT_ID('dbo.asignacion_zonas',   'U') IS NOT NULL DROP TABLE dbo.asignacion_zonas;
IF OBJECT_ID('dbo.zonas_restaurante',  'U') IS NOT NULL DROP TABLE dbo.zonas_restaurante;
GO

-- B1. Zonas físicas del restaurante por sucursal
CREATE TABLE zonas_restaurante (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    sucursal_id  INT           NOT NULL REFERENCES sucursales(id),
    codigo       NVARCHAR(20)  NOT NULL,
    nombre       NVARCHAR(100) NOT NULL,
    descripcion  NVARCHAR(300),
    aforo_max    INT           NOT NULL DEFAULT 20,    -- capacidad máxima de comensales
    tipo         NVARCHAR(30)  NOT NULL DEFAULT 'SALON'
                 CONSTRAINT chk_zona_tipo CHECK (tipo IN (
                     'SALON','SALON_VIP','TERRAZA','BAR','LOUNGE',
                     'COCINA','COCINA_MOLECULAR','BODEGA','ENTRADA','PRIVADO'
                 )),
    activo       BIT           NOT NULL DEFAULT 1,
    creado_en    DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_zona UNIQUE (sucursal_id, codigo)
);
GO

-- B2. Asignación de empleados a zonas por turno y fecha
CREATE TABLE asignacion_zonas (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    zona_id         INT           NOT NULL REFERENCES zonas_restaurante(id),
    contrato_id     INT           NOT NULL REFERENCES contratos(id),
    turno_id        INT           REFERENCES turnos(id),
    fecha           DATE          NOT NULL,
    hora_inicio     TIME,
    hora_fin        TIME,
    rol_en_zona     NVARCHAR(60),   -- e.g. "Capitán de mesa", "Chef responsable"
    observaciones   NVARCHAR(200),
    asignado_por    INT           NOT NULL REFERENCES usuarios(id),
    creado_en       DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_asig_zona UNIQUE (zona_id, contrato_id, fecha, turno_id)
);
GO

-- Índices
CREATE INDEX idx_asig_zona_fecha   ON asignacion_zonas(zona_id, fecha);
CREATE INDEX idx_asig_zona_contrat ON asignacion_zonas(contrato_id, fecha);
GO

PRINT '>>> Tablas de Zonas del Restaurante creadas correctamente.';
GO

PRINT '========================================================';
PRINT '>>> ACTUALIZACIÓN COMPLETADA EXITOSAMENTE';
PRINT '>>> Nuevas tablas:';
PRINT '>>>   - certificaciones_catalogo (con 10 registros iniciales)';
PRINT '>>>   - certificaciones_empleado';
PRINT '>>>   - zonas_restaurante';
PRINT '>>>   - asignacion_zonas';
PRINT '========================================================';
GO
