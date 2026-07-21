-- ============================================================
-- SCGRH — ACTUALIZACIÓN V3 (Módulo de Auditoría)
-- ============================================================
USE RR_HH;
GO

-- 1. Tabla de Auditorías Generales (Higiene / Zonas / Operaciones)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[auditorias]') AND type in (N'U'))
BEGIN
    CREATE TABLE auditorias (
        id INT IDENTITY(1,1) PRIMARY KEY,
        zona_id INT NOT NULL,               -- Qué zona se está auditando
        auditor_id INT NOT NULL,            -- Usuario (o contrato) que hace la auditoría
        fecha_auditoria DATETIME NOT NULL DEFAULT GETDATE(),
        tipo NVARCHAR(50) NOT NULL DEFAULT 'HIGIENE', -- HIGIENE, SEGURIDAD, MANTENIMIENTO
        puntaje_total INT NULL,             -- Sobre 100%
        observaciones NVARCHAR(MAX) NULL,
        estado NVARCHAR(50) NOT NULL DEFAULT 'COMPLETADA', -- BORRADOR, COMPLETADA, REQUIERE_ACCION
        CONSTRAINT FK_Auditoria_Zona FOREIGN KEY (zona_id) REFERENCES zonas_restaurante(id),
        CONSTRAINT FK_Auditoria_Usuario FOREIGN KEY (auditor_id) REFERENCES usuarios(id)
    );
END
GO

-- 2. Detalles de la auditoría (Items evaluados / Checklist)
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[auditoria_detalles]') AND type in (N'U'))
BEGIN
    CREATE TABLE auditoria_detalles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        auditoria_id INT NOT NULL,
        item_evaluado NVARCHAR(255) NOT NULL,
        cumple BIT NOT NULL DEFAULT 0,      -- 1: Sí, 0: No
        observacion NVARCHAR(MAX) NULL,     -- Notas sobre por qué no cumple
        foto_url NVARCHAR(MAX) NULL,        -- (Opcional) URL a evidencia fotográfica
        CONSTRAINT FK_AuditoriaDetalle_Auditoria FOREIGN KEY (auditoria_id) REFERENCES auditorias(id) ON DELETE CASCADE
    );
END
GO
