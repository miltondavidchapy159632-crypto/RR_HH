-- =============================================================================
--  SISTEMA CORPORATIVO DE GESTIÓN DE RECURSOS HUMANOS (SCGRH)
--  Script para: Microsoft SQL Server (T-SQL)
--  Base de datos: RR_HH
--  Versión: 3.0 · 2026 (CORREGIDO)
--
--  INSTRUCCIONES: Ejecutar TODO este script de una vez (Ctrl+A → F5)
--  Primero elimina todo limpio, luego crea desde cero.
-- =============================================================================

USE [RR_HH];
GO

-- =============================================================================
-- PASO 1: ELIMINAR TABLAS EXISTENTES (orden inverso de dependencias)
-- =============================================================================

IF OBJECT_ID('dbo.monitoreo_calidad',           'U') IS NOT NULL DROP TABLE dbo.monitoreo_calidad;
IF OBJECT_ID('dbo.reglas_calidad',              'U') IS NOT NULL DROP TABLE dbo.reglas_calidad;
IF OBJECT_ID('dbo.log_auditoria',               'U') IS NOT NULL DROP TABLE dbo.log_auditoria;
IF OBJECT_ID('dbo.documentos_cese',             'U') IS NOT NULL DROP TABLE dbo.documentos_cese;
IF OBJECT_ID('dbo.liquidaciones',               'U') IS NOT NULL DROP TABLE dbo.liquidaciones;
IF OBJECT_ID('dbo.devolucion_activos',          'U') IS NOT NULL DROP TABLE dbo.devolucion_activos;
IF OBJECT_ID('dbo.validacion_desvinculacion',   'U') IS NOT NULL DROP TABLE dbo.validacion_desvinculacion;
IF OBJECT_ID('dbo.solicitudes_desvinculacion',  'U') IS NOT NULL DROP TABLE dbo.solicitudes_desvinculacion;
IF OBJECT_ID('dbo.archivos_bancarios',          'U') IS NOT NULL DROP TABLE dbo.archivos_bancarios;
IF OBJECT_ID('dbo.boletas_pago',                'U') IS NOT NULL DROP TABLE dbo.boletas_pago;
IF OBJECT_ID('dbo.movimientos_planilla',        'U') IS NOT NULL DROP TABLE dbo.movimientos_planilla;
IF OBJECT_ID('dbo.detalle_planilla',            'U') IS NOT NULL DROP TABLE dbo.detalle_planilla;
IF OBJECT_ID('dbo.planillas',                   'U') IS NOT NULL DROP TABLE dbo.planillas;
IF OBJECT_ID('dbo.conceptos_remunerativos',     'U') IS NOT NULL DROP TABLE dbo.conceptos_remunerativos;
IF OBJECT_ID('dbo.reconocimientos',             'U') IS NOT NULL DROP TABLE dbo.reconocimientos;
IF OBJECT_ID('dbo.sanciones',                   'U') IS NOT NULL DROP TABLE dbo.sanciones;
IF OBJECT_ID('dbo.permisos_laborales',          'U') IS NOT NULL DROP TABLE dbo.permisos_laborales;
IF OBJECT_ID('dbo.licencias',                   'U') IS NOT NULL DROP TABLE dbo.licencias;
IF OBJECT_ID('dbo.solicitudes_vacaciones',      'U') IS NOT NULL DROP TABLE dbo.solicitudes_vacaciones;
IF OBJECT_ID('dbo.vacaciones',                  'U') IS NOT NULL DROP TABLE dbo.vacaciones;
IF OBJECT_ID('dbo.cierre_asistencia',           'U') IS NOT NULL DROP TABLE dbo.cierre_asistencia;
IF OBJECT_ID('dbo.horas_extras',                'U') IS NOT NULL DROP TABLE dbo.horas_extras;
IF OBJECT_ID('dbo.incidencias',                 'U') IS NOT NULL DROP TABLE dbo.incidencias;
IF OBJECT_ID('dbo.marcaciones',                 'U') IS NOT NULL DROP TABLE dbo.marcaciones;
IF OBJECT_ID('dbo.asignacion_horarios',         'U') IS NOT NULL DROP TABLE dbo.asignacion_horarios;
IF OBJECT_ID('dbo.horarios',                    'U') IS NOT NULL DROP TABLE dbo.horarios;
IF OBJECT_ID('dbo.turnos',                      'U') IS NOT NULL DROP TABLE dbo.turnos;
IF OBJECT_ID('dbo.planes_desarrollo',           'U') IS NOT NULL DROP TABLE dbo.planes_desarrollo;
IF OBJECT_ID('dbo.detalle_evaluacion_desempeno','U') IS NOT NULL DROP TABLE dbo.detalle_evaluacion_desempeno;
IF OBJECT_ID('dbo.evaluaciones_desempeno',      'U') IS NOT NULL DROP TABLE dbo.evaluaciones_desempeno;
IF OBJECT_ID('dbo.evaluaciones_capacitacion',   'U') IS NOT NULL DROP TABLE dbo.evaluaciones_capacitacion;
IF OBJECT_ID('dbo.asistencia_capacitacion',     'U') IS NOT NULL DROP TABLE dbo.asistencia_capacitacion;
IF OBJECT_ID('dbo.capacitaciones',              'U') IS NOT NULL DROP TABLE dbo.capacitaciones;
IF OBJECT_ID('dbo.cursos',                      'U') IS NOT NULL DROP TABLE dbo.cursos;
IF OBJECT_ID('dbo.inducciones_trabajador',      'U') IS NOT NULL DROP TABLE dbo.inducciones_trabajador;
IF OBJECT_ID('dbo.programas_induccion',         'U') IS NOT NULL DROP TABLE dbo.programas_induccion;
IF OBJECT_ID('dbo.renovaciones_contrato',       'U') IS NOT NULL DROP TABLE dbo.renovaciones_contrato;
IF OBJECT_ID('dbo.contratos',                   'U') IS NOT NULL DROP TABLE dbo.contratos;
IF OBJECT_ID('dbo.documentos_expediente',       'U') IS NOT NULL DROP TABLE dbo.documentos_expediente;
IF OBJECT_ID('dbo.expedientes_laborales',       'U') IS NOT NULL DROP TABLE dbo.expedientes_laborales;
IF OBJECT_ID('dbo.ofertas_laborales',           'U') IS NOT NULL DROP TABLE dbo.ofertas_laborales;
IF OBJECT_ID('dbo.entrevistas',                 'U') IS NOT NULL DROP TABLE dbo.entrevistas;
IF OBJECT_ID('dbo.evaluaciones',                'U') IS NOT NULL DROP TABLE dbo.evaluaciones;
IF OBJECT_ID('dbo.postulaciones',               'U') IS NOT NULL DROP TABLE dbo.postulaciones;
IF OBJECT_ID('dbo.vacantes',                    'U') IS NOT NULL DROP TABLE dbo.vacantes;
IF OBJECT_ID('dbo.historial_datos_personales',  'U') IS NOT NULL DROP TABLE dbo.historial_datos_personales;
IF OBJECT_ID('dbo.personas',                    'U') IS NOT NULL DROP TABLE dbo.personas;
IF OBJECT_ID('dbo.sesiones_usuario',            'U') IS NOT NULL DROP TABLE dbo.sesiones_usuario;
IF OBJECT_ID('dbo.usuarios_roles',              'U') IS NOT NULL DROP TABLE dbo.usuarios_roles;
IF OBJECT_ID('dbo.roles_permisos',              'U') IS NOT NULL DROP TABLE dbo.roles_permisos;
IF OBJECT_ID('dbo.usuarios',                    'U') IS NOT NULL DROP TABLE dbo.usuarios;
IF OBJECT_ID('dbo.roles',                       'U') IS NOT NULL DROP TABLE dbo.roles;
IF OBJECT_ID('dbo.permisos',                    'U') IS NOT NULL DROP TABLE dbo.permisos;
IF OBJECT_ID('dbo.parametros_globales',         'U') IS NOT NULL DROP TABLE dbo.parametros_globales;
IF OBJECT_ID('dbo.centros_costo',               'U') IS NOT NULL DROP TABLE dbo.centros_costo;
IF OBJECT_ID('dbo.puestos',                     'U') IS NOT NULL DROP TABLE dbo.puestos;
IF OBJECT_ID('dbo.cargos',                      'U') IS NOT NULL DROP TABLE dbo.cargos;
IF OBJECT_ID('dbo.areas',                       'U') IS NOT NULL DROP TABLE dbo.areas;
IF OBJECT_ID('dbo.sucursales',                  'U') IS NOT NULL DROP TABLE dbo.sucursales;
IF OBJECT_ID('dbo.empresas',                    'U') IS NOT NULL DROP TABLE dbo.empresas;
IF OBJECT_ID('dbo.cat_tipo_cuenta_bancaria',    'U') IS NOT NULL DROP TABLE dbo.cat_tipo_cuenta_bancaria;
IF OBJECT_ID('dbo.cat_tipo_sancion',            'U') IS NOT NULL DROP TABLE dbo.cat_tipo_sancion;
IF OBJECT_ID('dbo.cat_motivo_cese',             'U') IS NOT NULL DROP TABLE dbo.cat_motivo_cese;
IF OBJECT_ID('dbo.cat_tipo_licencia',           'U') IS NOT NULL DROP TABLE dbo.cat_tipo_licencia;
IF OBJECT_ID('dbo.cat_tipo_contrato',           'U') IS NOT NULL DROP TABLE dbo.cat_tipo_contrato;
IF OBJECT_ID('dbo.cat_banco',                   'U') IS NOT NULL DROP TABLE dbo.cat_banco;
IF OBJECT_ID('dbo.cat_afp',                     'U') IS NOT NULL DROP TABLE dbo.cat_afp;
IF OBJECT_ID('dbo.cat_sexo',                    'U') IS NOT NULL DROP TABLE dbo.cat_sexo;
IF OBJECT_ID('dbo.cat_estado_civil',            'U') IS NOT NULL DROP TABLE dbo.cat_estado_civil;
IF OBJECT_ID('dbo.cat_estado',                  'U') IS NOT NULL DROP TABLE dbo.cat_estado;
IF OBJECT_ID('dbo.cat_tipo_documento',          'U') IS NOT NULL DROP TABLE dbo.cat_tipo_documento;
GO

PRINT '>>> Tablas eliminadas correctamente. Creando estructura...';
GO

-- =============================================================================
-- 01. CATÁLOGOS MAESTROS
-- =============================================================================

CREATE TABLE cat_tipo_documento (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      NVARCHAR(15)  NOT NULL UNIQUE,   -- ampliado
    descripcion NVARCHAR(60)  NOT NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_estado_civil (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      NVARCHAR(20)  NOT NULL UNIQUE,   -- CORRECCIÓN: era 10, 'CONVIVIENTE' tiene 11 chars
    descripcion NVARCHAR(40)  NOT NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_sexo (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      CHAR(1)       NOT NULL UNIQUE,
    descripcion NVARCHAR(20)  NOT NULL
);
GO

CREATE TABLE cat_afp (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    codigo        NVARCHAR(15)  NOT NULL UNIQUE,
    nombre        NVARCHAR(80)  NOT NULL,
    tasa_comision DECIMAL(5,4),
    activo        BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_banco (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      NVARCHAR(15)  NOT NULL UNIQUE,
    nombre      NVARCHAR(80)  NOT NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_tipo_contrato (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    codigo       NVARCHAR(20)  NOT NULL UNIQUE,
    descripcion  NVARCHAR(80)  NOT NULL,
    requiere_fin BIT           NOT NULL DEFAULT 1,
    activo       BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_tipo_licencia (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    codigo         NVARCHAR(20)  NOT NULL UNIQUE,
    descripcion    NVARCHAR(80)  NOT NULL,
    con_goce_haber BIT           NOT NULL DEFAULT 1,
    activo         BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_motivo_cese (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      NVARCHAR(25)  NOT NULL UNIQUE,   -- ampliado para 'DESPIDO_ARBITRARIO'
    descripcion NVARCHAR(80)  NOT NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_tipo_sancion (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      NVARCHAR(20)  NOT NULL UNIQUE,
    descripcion NVARCHAR(80)  NOT NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cat_estado (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    contexto    NVARCHAR(40)  NOT NULL,
    codigo      NVARCHAR(30)  NOT NULL,
    descripcion NVARCHAR(60)  NOT NULL,
    CONSTRAINT UQ_cat_estado UNIQUE (contexto, codigo)
);
GO

CREATE TABLE cat_tipo_cuenta_bancaria (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      NVARCHAR(15)  NOT NULL UNIQUE,
    descripcion NVARCHAR(40)  NOT NULL
);
GO

-- =============================================================================
-- 02. ORGANIZACIÓN Y CONFIGURACIÓN
-- =============================================================================

CREATE TABLE empresas (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    ruc               NVARCHAR(11)  NOT NULL UNIQUE,
    razon_social      NVARCHAR(120) NOT NULL,
    nombre_comercial  NVARCHAR(80),
    direccion_fiscal  NVARCHAR(200),
    telefono          NVARCHAR(20),
    email_corporativo NVARCHAR(100),
    logo_url          NVARCHAR(500),
    activo            BIT           NOT NULL DEFAULT 1,
    fecha_creacion    DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE sucursales (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    empresa_id     INT           NOT NULL REFERENCES empresas(id),
    codigo         NVARCHAR(20)  NOT NULL UNIQUE,
    nombre         NVARCHAR(100) NOT NULL,
    direccion      NVARCHAR(200),
    ubigeo         CHAR(6),
    telefono       NVARCHAR(20),
    email          NVARCHAR(100),
    activo         BIT           NOT NULL DEFAULT 1,
    fecha_creacion DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE areas (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    empresa_id    INT           NOT NULL REFERENCES empresas(id),
    area_padre_id INT           REFERENCES areas(id),
    codigo        NVARCHAR(20)  NOT NULL UNIQUE,
    nombre        NVARCHAR(100) NOT NULL,
    descripcion   NVARCHAR(500),
    activo        BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE cargos (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    area_id          INT           NOT NULL REFERENCES areas(id),
    codigo           NVARCHAR(20)  NOT NULL UNIQUE,
    nombre           NVARCHAR(100) NOT NULL,
    descripcion      NVARCHAR(500),
    nivel_jerarquico SMALLINT      NOT NULL DEFAULT 1,
    salario_min      DECIMAL(10,2),
    salario_max      DECIMAL(10,2),
    activo           BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE puestos (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    cargo_id        INT          NOT NULL REFERENCES cargos(id),
    sucursal_id     INT          NOT NULL REFERENCES sucursales(id),
    codigo          NVARCHAR(20) NOT NULL UNIQUE,
    cantidad_plazas INT          NOT NULL DEFAULT 1,
    plazas_ocupadas INT          NOT NULL DEFAULT 0,
    activo          BIT          NOT NULL DEFAULT 1,
    CONSTRAINT chk_plazas CHECK (plazas_ocupadas <= cantidad_plazas AND plazas_ocupadas >= 0)
);
GO

CREATE TABLE centros_costo (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    empresa_id        INT           NOT NULL REFERENCES empresas(id),
    sucursal_id       INT           REFERENCES sucursales(id),
    codigo            NVARCHAR(20)  NOT NULL UNIQUE,
    nombre            NVARCHAR(100) NOT NULL,
    presupuesto_anual DECIMAL(14,2),
    activo            BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE parametros_globales (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    empresa_id    INT           NOT NULL REFERENCES empresas(id),
    clave         NVARCHAR(80)  NOT NULL,
    valor         NVARCHAR(500) NOT NULL,
    descripcion   NVARCHAR(200),
    tipo_dato     NVARCHAR(20)  NOT NULL DEFAULT 'TEXT',
    version       INT           NOT NULL DEFAULT 1,
    vigente_desde DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    vigente_hasta DATE,
    CONSTRAINT UQ_parametros UNIQUE (empresa_id, clave, version)
);
GO

-- =============================================================================
-- 03. SEGURIDAD Y USUARIOS
-- =============================================================================

CREATE TABLE roles (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    codigo      NVARCHAR(40)  NOT NULL UNIQUE,
    nombre      NVARCHAR(80)  NOT NULL,
    descripcion NVARCHAR(300),
    activo      BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE permisos (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    modulo      NVARCHAR(60)  NOT NULL,
    accion      NVARCHAR(40)  NOT NULL,
    recurso     NVARCHAR(80)  NOT NULL,
    descripcion NVARCHAR(300),
    CONSTRAINT UQ_permisos UNIQUE (modulo, accion, recurso)
);
GO

CREATE TABLE roles_permisos (
    rol_id     INT NOT NULL REFERENCES roles(id),
    permiso_id INT NOT NULL REFERENCES permisos(id),
    PRIMARY KEY (rol_id, permiso_id)
);
GO

CREATE TABLE usuarios (
    id                        INT IDENTITY(1,1) PRIMARY KEY,
    username                  NVARCHAR(60)  NOT NULL UNIQUE,
    email                     NVARCHAR(120) NOT NULL UNIQUE,
    password_hash             NVARCHAR(300) NOT NULL,
    empresa_id                INT           NOT NULL REFERENCES empresas(id),
    sucursal_id               INT           REFERENCES sucursales(id),
    estado                    NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
                              CONSTRAINT chk_usuario_estado CHECK (estado IN ('ACTIVO','BLOQUEADO','SUSPENDIDO','INACTIVO')),
    intentos_fallidos         SMALLINT      NOT NULL DEFAULT 0,
    fecha_ultimo_login        DATETIME,
    fecha_expiracion_password DATE,
    requiere_cambio_password  BIT           NOT NULL DEFAULT 0,
    creado_en                 DATETIME      NOT NULL DEFAULT GETDATE(),
    actualizado_en            DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE usuarios_roles (
    usuario_id  INT      NOT NULL REFERENCES usuarios(id),
    rol_id      INT      NOT NULL REFERENCES roles(id),
    asignado_en DATETIME NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (usuario_id, rol_id)
);
GO

-- CORRECCIÓN CLAVE: token_hash cambiado de NVARCHAR(MAX) a NVARCHAR(500)
-- NVARCHAR(MAX) no puede ser clave de índice UNIQUE en SQL Server
CREATE TABLE sesiones_usuario (
    id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    usuario_id INT              NOT NULL REFERENCES usuarios(id),
    token_hash NVARCHAR(500)    NOT NULL UNIQUE,   -- ← CORRECCIÓN
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(300),
    creada_en  DATETIME         NOT NULL DEFAULT GETDATE(),
    expira_en  DATETIME         NOT NULL,
    cerrada_en DATETIME,
    activa     BIT              NOT NULL DEFAULT 1
);
GO

-- =============================================================================
-- 04. PERSONAS E IDENTIDAD
-- =============================================================================

CREATE TABLE personas (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    tipo_doc_id       INT           NOT NULL REFERENCES cat_tipo_documento(id),
    nro_documento     NVARCHAR(20)  NOT NULL,
    apellido_paterno  NVARCHAR(60)  NOT NULL,
    apellido_materno  NVARCHAR(60),
    nombres           NVARCHAR(100) NOT NULL,
    fecha_nacimiento  DATE,
    sexo_id           INT           REFERENCES cat_sexo(id),
    estado_civil_id   INT           REFERENCES cat_estado_civil(id),
    nacionalidad      NVARCHAR(60)  NOT NULL DEFAULT 'Peruana',
    email_personal    NVARCHAR(120),
    email_corporativo NVARCHAR(120),
    telefono_celular  NVARCHAR(15),
    telefono_fijo     NVARCHAR(15),
    direccion         NVARCHAR(200),
    ubigeo            CHAR(6),
    banco_id          INT           REFERENCES cat_banco(id),
    tipo_cuenta_id    INT           REFERENCES cat_tipo_cuenta_bancaria(id),
    nro_cuenta        NVARCHAR(30),
    cuenta_cci        NVARCHAR(30),
    afp_id            INT           REFERENCES cat_afp(id),
    nro_cuspp         NVARCHAR(12),
    nro_essalud       NVARCHAR(20),
    usuario_id        INT           UNIQUE REFERENCES usuarios(id),
    estado            NVARCHAR(20)  NOT NULL DEFAULT 'CANDIDATO'
                      CONSTRAINT chk_persona_estado CHECK (estado IN ('CANDIDATO','ACTIVO','INACTIVO','CESADO')),
    creado_en         DATETIME      NOT NULL DEFAULT GETDATE(),
    actualizado_en    DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_persona_doc UNIQUE (tipo_doc_id, nro_documento)
);
GO

CREATE TABLE historial_datos_personales (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    persona_id       INT           NOT NULL REFERENCES personas(id),
    campo_modificado NVARCHAR(60)  NOT NULL,
    valor_anterior   NVARCHAR(500),
    valor_nuevo      NVARCHAR(500),
    modificado_por   INT           NOT NULL REFERENCES usuarios(id),
    modificado_en    DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================================================
-- 05. RECLUTAMIENTO Y SELECCIÓN
-- =============================================================================

CREATE TABLE vacantes (
    id                   INT IDENTITY(1,1) PRIMARY KEY,
    puesto_id            INT           NOT NULL REFERENCES puestos(id),
    sucursal_id          INT           NOT NULL REFERENCES sucursales(id),
    centro_costo_id      INT           REFERENCES centros_costo(id),
    titulo               NVARCHAR(150) NOT NULL,
    descripcion          NVARCHAR(500),
    requisitos           NVARCHAR(500),
    salario_ofrecido     DECIMAL(10,2),
    tipo_contrato_id     INT           REFERENCES cat_tipo_contrato(id),
    cantidad_requerida   INT           NOT NULL DEFAULT 1,
    presupuesto_aprobado BIT           NOT NULL DEFAULT 0,
    fecha_publicacion    DATE,
    fecha_cierre         DATE,
    estado               NVARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
                         CONSTRAINT chk_vacante_estado CHECK (estado IN ('BORRADOR','PUBLICADA','EN_PROCESO','DESIERTA','CERRADA','CANCELADA')),
    publicada_portal_web BIT           NOT NULL DEFAULT 0,
    puntaje_minimo       DECIMAL(5,2),
    creado_por           INT           REFERENCES usuarios(id),
    creado_en            DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE postulaciones (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    vacante_id         INT           NOT NULL REFERENCES vacantes(id),
    persona_id         INT           NOT NULL REFERENCES personas(id),
    cv_url             NVARCHAR(500),
    carta_presentacion NVARCHAR(500),
    fuente             NVARCHAR(40),
    puntaje_total      DECIMAL(5,2),
    estado             NVARCHAR(20)  NOT NULL DEFAULT 'RECIBIDA'
                       CONSTRAINT chk_postulacion_estado CHECK (estado IN ('RECIBIDA','EN_REVISION','PRESELECCIONADO','EN_ENTREVISTA','APROBADO','RECHAZADO','RETIRADO')),
    fecha_postulacion  DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_postulacion UNIQUE (vacante_id, persona_id)
);
GO

CREATE TABLE evaluaciones (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    postulacion_id   INT           NOT NULL REFERENCES postulaciones(id),
    tipo_evaluacion  NVARCHAR(60)  NOT NULL,
    nombre_prueba    NVARCHAR(100),
    puntaje_obtenido DECIMAL(5,2),
    puntaje_maximo   DECIMAL(5,2),
    resultado        NVARCHAR(20)  CONSTRAINT chk_eval_resultado CHECK (resultado IN ('APROBADO','DESAPROBADO','EN_PROCESO')),
    observaciones    NVARCHAR(500),
    evaluado_por     INT           REFERENCES usuarios(id),
    fecha_evaluacion DATE          NOT NULL
);
GO

CREATE TABLE entrevistas (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    postulacion_id   INT           NOT NULL REFERENCES postulaciones(id),
    entrevistador_id INT           NOT NULL REFERENCES usuarios(id),
    tipo             NVARCHAR(20)  NOT NULL DEFAULT 'PRESENCIAL'
                     CONSTRAINT chk_entrevista_tipo CHECK (tipo IN ('PRESENCIAL','VIRTUAL','TELEFONICA')),
    fecha_programada DATETIME      NOT NULL,
    fecha_realizada  DATETIME,
    ubicacion        NVARCHAR(200),
    link_reunion     NVARCHAR(300),
    puntaje          DECIMAL(5,2),
    observaciones    NVARCHAR(500),
    resultado        NVARCHAR(20)  CONSTRAINT chk_entrevista_resultado CHECK (resultado IN ('APROBADO','DESAPROBADO','PENDIENTE','CANCELADA')),
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'PROGRAMADA'
                     CONSTRAINT chk_entrevista_estado CHECK (estado IN ('PROGRAMADA','REALIZADA','CANCELADA','REAGENDADA'))
);
GO

CREATE TABLE ofertas_laborales (
    id                     INT IDENTITY(1,1) PRIMARY KEY,
    postulacion_id         INT           NOT NULL UNIQUE REFERENCES postulaciones(id),
    cargo_id               INT           NOT NULL REFERENCES cargos(id),
    sucursal_id            INT           NOT NULL REFERENCES sucursales(id),
    salario_ofrecido       DECIMAL(10,2) NOT NULL,
    tipo_contrato_id       INT           NOT NULL REFERENCES cat_tipo_contrato(id),
    fecha_inicio_propuesta DATE,
    beneficios_adicionales NVARCHAR(500),
    fecha_emision          DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    fecha_vencimiento      DATE,
    estado                 NVARCHAR(20)  NOT NULL DEFAULT 'EMITIDA'
                           CONSTRAINT chk_oferta_estado CHECK (estado IN ('EMITIDA','ACEPTADA','RECHAZADA','VENCIDA')),
    respuesta_candidato    NVARCHAR(500),
    fecha_respuesta        DATE
);
GO

-- =============================================================================
-- 06. CONTRATACIÓN Y GESTIÓN DOCUMENTAL
-- =============================================================================

CREATE TABLE expedientes_laborales (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    persona_id        INT           NOT NULL UNIQUE REFERENCES personas(id),
    oferta_laboral_id INT           REFERENCES ofertas_laborales(id),
    codigo            NVARCHAR(30)  NOT NULL UNIQUE,
    fecha_apertura    DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    estado            NVARCHAR(20)  NOT NULL DEFAULT 'INCOMPLETO'
                      CONSTRAINT chk_expediente_estado CHECK (estado IN ('INCOMPLETO','COMPLETO','CERRADO')),
    observaciones     NVARCHAR(500),
    creado_por        INT           NOT NULL REFERENCES usuarios(id),
    creado_en         DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE documentos_expediente (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    expediente_id    INT           NOT NULL REFERENCES expedientes_laborales(id),
    tipo_doc         NVARCHAR(80)  NOT NULL,
    nombre_archivo   NVARCHAR(200),
    url_archivo      NVARCHAR(500),
    es_obligatorio   BIT           NOT NULL DEFAULT 1,
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                     CONSTRAINT chk_doc_estado CHECK (estado IN ('PENDIENTE','PRESENTADO','VALIDADO','OBSERVADO','RECHAZADO')),
    validado_por     INT           REFERENCES usuarios(id),
    fecha_validacion DATE,
    observaciones    NVARCHAR(500),
    cargado_en       DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE contratos (
    id                     INT IDENTITY(1,1) PRIMARY KEY,
    expediente_id          INT           NOT NULL REFERENCES expedientes_laborales(id),
    puesto_id              INT           NOT NULL REFERENCES puestos(id),
    tipo_contrato_id       INT           NOT NULL REFERENCES cat_tipo_contrato(id),
    centro_costo_id        INT           REFERENCES centros_costo(id),
    codigo                 NVARCHAR(30)  NOT NULL UNIQUE,
    fecha_inicio           DATE          NOT NULL,
    fecha_fin              DATE,
    salario_base           DECIMAL(10,2) NOT NULL,
    jornada_horas          DECIMAL(4,2)  NOT NULL DEFAULT 8.00,
    modalidad              NVARCHAR(20)  NOT NULL DEFAULT 'PRESENCIAL'
                           CONSTRAINT chk_contrato_modalidad CHECK (modalidad IN ('PRESENCIAL','REMOTO','HIBRIDO')),
    url_contrato_pdf       NVARCHAR(500),
    firmado_trabajador     BIT           NOT NULL DEFAULT 0,
    fecha_firma_trabajador DATE,
    firmado_empleador      BIT           NOT NULL DEFAULT 0,
    fecha_firma_empleador  DATE,
    alta_t_registro        BIT           NOT NULL DEFAULT 0,
    fecha_alta_t_registro  DATE,
    nro_registro_t         NVARCHAR(30),
    estado                 NVARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
                           CONSTRAINT chk_contrato_estado CHECK (estado IN ('BORRADOR','PENDIENTE_FIRMA','VIGENTE','VENCIDO','RESCINDIDO')),
    version                INT           NOT NULL DEFAULT 1,
    creado_por             INT           NOT NULL REFERENCES usuarios(id),
    creado_en              DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT chk_fecha_fin   CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio),
    CONSTRAINT chk_salario_pos CHECK (salario_base > 0)
);
GO

-- Solo 1 contrato VIGENTE por expediente (índice filtrado)
CREATE UNIQUE INDEX idx_contrato_unico_vigente
    ON contratos (expediente_id)
    WHERE estado = 'VIGENTE';
GO

CREATE TABLE renovaciones_contrato (
    id                   INT IDENTITY(1,1) PRIMARY KEY,
    contrato_original_id INT      NOT NULL REFERENCES contratos(id),
    contrato_nuevo_id    INT      NOT NULL REFERENCES contratos(id),
    motivo               NVARCHAR(500),
    renovado_por         INT      NOT NULL REFERENCES usuarios(id),
    renovado_en          DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================================================
-- 07. GESTIÓN DEL TALENTO
-- =============================================================================

CREATE TABLE programas_induccion (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    cargo_id      INT           REFERENCES cargos(id),
    nombre        NVARCHAR(150) NOT NULL,
    descripcion   NVARCHAR(500),
    duracion_dias INT           NOT NULL DEFAULT 1,
    activo        BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE inducciones_trabajador (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    programa_id  INT           NOT NULL REFERENCES programas_induccion(id),
    contrato_id  INT           NOT NULL REFERENCES contratos(id),
    fecha_inicio DATE          NOT NULL,
    fecha_fin    DATE,
    estado       NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                 CONSTRAINT chk_induccion_estado CHECK (estado IN ('PENDIENTE','EN_CURSO','COMPLETADO','CANCELADO')),
    observaciones NVARCHAR(500)
);
GO

CREATE TABLE cursos (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    nombre        NVARCHAR(150) NOT NULL,
    descripcion   NVARCHAR(500),
    modalidad     NVARCHAR(20)  NOT NULL DEFAULT 'PRESENCIAL'
                  CONSTRAINT chk_curso_modalidad CHECK (modalidad IN ('PRESENCIAL','VIRTUAL','MIXTO')),
    duracion_horas DECIMAL(6,2),
    costo         DECIMAL(10,2),
    proveedor     NVARCHAR(120),
    activo        BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE capacitaciones (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    curso_id      INT           NOT NULL REFERENCES cursos(id),
    sucursal_id   INT           REFERENCES sucursales(id),
    nombre_sesion NVARCHAR(200),
    fecha_inicio  DATETIME      NOT NULL,
    fecha_fin     DATETIME,
    lugar         NVARCHAR(200),
    instructor    NVARCHAR(120),
    capacidad_max INT,
    estado        NVARCHAR(20)  NOT NULL DEFAULT 'PROGRAMADA'
                  CONSTRAINT chk_capac_estado CHECK (estado IN ('PROGRAMADA','EN_CURSO','REALIZADA','CANCELADA'))
);
GO

CREATE TABLE asistencia_capacitacion (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    capacitacion_id INT      NOT NULL REFERENCES capacitaciones(id),
    contrato_id     INT      NOT NULL REFERENCES contratos(id),
    asistio         BIT,
    fecha_registro  DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_asistencia_cap UNIQUE (capacitacion_id, contrato_id)
);
GO

CREATE TABLE evaluaciones_capacitacion (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    asistencia_id    INT          NOT NULL UNIQUE REFERENCES asistencia_capacitacion(id),
    puntaje          DECIMAL(5,2),
    puntaje_maximo   DECIMAL(5,2) NOT NULL DEFAULT 100,
    aprobado         BIT,
    observaciones    NVARCHAR(500),
    fecha_evaluacion DATE         NOT NULL
);
GO

CREATE TABLE evaluaciones_desempeno (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    evaluado_id      INT           NOT NULL REFERENCES contratos(id),
    evaluador_id     INT           NOT NULL REFERENCES usuarios(id),
    periodo          NVARCHAR(20)  NOT NULL,
    puntaje_total    DECIMAL(5,2),
    categoria        NVARCHAR(30),
    fortalezas       NVARCHAR(500),
    areas_mejora     NVARCHAR(500),
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
                     CONSTRAINT chk_desempeno_estado CHECK (estado IN ('BORRADOR','EN_PROCESO','COMPLETADA','APROBADA')),
    fecha_evaluacion DATE          NOT NULL
);
GO

CREATE TABLE detalle_evaluacion_desempeno (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    evaluacion_id  INT           NOT NULL REFERENCES evaluaciones_desempeno(id),
    criterio       NVARCHAR(100) NOT NULL,
    puntaje        DECIMAL(5,2)  NOT NULL,
    puntaje_maximo DECIMAL(5,2)  NOT NULL DEFAULT 10,
    comentario     NVARCHAR(300)
);
GO

CREATE TABLE planes_desarrollo (
    id            INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id   INT           NOT NULL REFERENCES contratos(id),
    evaluacion_id INT           REFERENCES evaluaciones_desempeno(id),
    objetivo      NVARCHAR(200) NOT NULL,
    acciones      NVARCHAR(500),
    fecha_inicio  DATE          NOT NULL,
    fecha_meta    DATE,
    estado        NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVO'
                  CONSTRAINT chk_plan_estado CHECK (estado IN ('ACTIVO','EN_CURSO','CUMPLIDO','CANCELADO')),
    resultado     NVARCHAR(500)
);
GO

-- =============================================================================
-- 08. ASISTENCIA Y JORNADA LABORAL
-- =============================================================================

CREATE TABLE turnos (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    empresa_id     INT           NOT NULL REFERENCES empresas(id),
    codigo         NVARCHAR(20)  NOT NULL UNIQUE,
    nombre         NVARCHAR(80)  NOT NULL,
    hora_entrada   TIME          NOT NULL,
    hora_salida    TIME          NOT NULL,
    tolerancia_min SMALLINT      NOT NULL DEFAULT 5,
    horas_diarias  DECIMAL(4,2)  NOT NULL,
    nocturno       BIT           NOT NULL DEFAULT 0,
    activo         BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE horarios (
    id                 INT IDENTITY(1,1) PRIMARY KEY,
    sucursal_id        INT           NOT NULL REFERENCES sucursales(id),
    cargo_id           INT           REFERENCES cargos(id),
    nombre             NVARCHAR(100) NOT NULL,
    lunes_turno_id     INT           REFERENCES turnos(id),
    martes_turno_id    INT           REFERENCES turnos(id),
    miercoles_turno_id INT           REFERENCES turnos(id),
    jueves_turno_id    INT           REFERENCES turnos(id),
    viernes_turno_id   INT           REFERENCES turnos(id),
    sabado_turno_id    INT           REFERENCES turnos(id),
    domingo_turno_id   INT           REFERENCES turnos(id),
    activo             BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE asignacion_horarios (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id  INT      NOT NULL REFERENCES contratos(id),
    horario_id   INT      NOT NULL REFERENCES horarios(id),
    fecha_inicio DATE     NOT NULL,
    fecha_fin    DATE,
    asignado_por INT      NOT NULL REFERENCES usuarios(id),
    creado_en    DATETIME NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE marcaciones (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id      INT          NOT NULL REFERENCES contratos(id),
    turno_id         INT          NOT NULL REFERENCES turnos(id),
    fecha            DATE         NOT NULL,
    hora_ingreso     DATETIME,
    hora_salida      DATETIME,
    fuente           NVARCHAR(20) NOT NULL DEFAULT 'BIOMETRICO'
                     CONSTRAINT chk_marcacion_fuente CHECK (fuente IN ('BIOMETRICO','WEB','MOVIL','MANUAL')),
    tardanza_minutos SMALLINT     NOT NULL DEFAULT 0,
    estado           NVARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                     CONSTRAINT chk_marcacion_estado CHECK (estado IN ('PENDIENTE','PRESENTE','AUSENTE','TARDANZA','JUSTIFICADO')),
    justificacion    NVARCHAR(300),
    justificado_por  INT          REFERENCES usuarios(id),
    CONSTRAINT UQ_marcacion          UNIQUE (contrato_id, fecha),
    CONSTRAINT chk_salida_con_ingreso CHECK (hora_salida IS NULL OR hora_ingreso IS NOT NULL),
    CONSTRAINT chk_orden_marcacion    CHECK (hora_salida IS NULL OR hora_salida > hora_ingreso)
);
GO

CREATE TABLE incidencias (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    marcacion_id INT           REFERENCES marcaciones(id),
    contrato_id  INT           NOT NULL REFERENCES contratos(id),
    tipo         NVARCHAR(40)  NOT NULL,
    fecha        DATE          NOT NULL,
    descripcion  NVARCHAR(300),
    estado       NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                 CONSTRAINT chk_incidencia_estado CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA')),
    revisado_por INT           REFERENCES usuarios(id),
    revisado_en  DATETIME
);
GO

CREATE TABLE horas_extras (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id       INT           NOT NULL REFERENCES contratos(id),
    fecha             DATE          NOT NULL,
    horas_solicitadas DECIMAL(4,2)  NOT NULL,
    horas_realizadas  DECIMAL(4,2),
    motivo            NVARCHAR(300) NOT NULL,
    estado            NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                      CONSTRAINT chk_hextra_estado CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA','REALIZADA')),
    aprobado_por      INT           REFERENCES usuarios(id),
    aprobado_en       DATETIME,
    CONSTRAINT chk_horas_positivas CHECK (horas_solicitadas > 0)
);
GO

CREATE TABLE cierre_asistencia (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    sucursal_id INT      NOT NULL REFERENCES sucursales(id),
    periodo     CHAR(7)  NOT NULL,
    cerrado     BIT      NOT NULL DEFAULT 0,
    cerrado_por INT      REFERENCES usuarios(id),
    cerrado_en  DATETIME,
    CONSTRAINT UQ_cierre UNIQUE (sucursal_id, periodo)
);
GO

-- =============================================================================
-- 09. RELACIONES LABORALES
-- =============================================================================

CREATE TABLE vacaciones (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id     INT          NOT NULL REFERENCES contratos(id),
    periodo_laboral NVARCHAR(10) NOT NULL,
    dias_generados  DECIMAL(5,2) NOT NULL DEFAULT 30,
    dias_tomados    DECIMAL(5,2) NOT NULL DEFAULT 0,
    dias_saldo      DECIMAL(5,2) NOT NULL DEFAULT 30,
    CONSTRAINT UQ_vacaciones   UNIQUE (contrato_id, periodo_laboral),
    CONSTRAINT chk_saldo_vac   CHECK  (dias_saldo >= 0)
);
GO

CREATE TABLE solicitudes_vacaciones (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    vacaciones_id    INT          NOT NULL REFERENCES vacaciones(id),
    fecha_inicio     DATE         NOT NULL,
    fecha_fin        DATE         NOT NULL,
    dias_solicitados DECIMAL(5,2) NOT NULL,
    motivo           NVARCHAR(300),
    estado           NVARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                     CONSTRAINT chk_svac_estado CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA','CANCELADA')),
    aprobado_por     INT          REFERENCES usuarios(id),
    aprobado_en      DATETIME,
    CONSTRAINT chk_fechas_vac CHECK (fecha_fin >= fecha_inicio)
);
GO

CREATE TABLE licencias (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id      INT           NOT NULL REFERENCES contratos(id),
    tipo_licencia_id INT           NOT NULL REFERENCES cat_tipo_licencia(id),
    fecha_inicio     DATE          NOT NULL,
    fecha_fin        DATE          NOT NULL,
    dias_totales     DECIMAL(5,2),
    motivo           NVARCHAR(300),
    sustento_url     NVARCHAR(500),
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                     CONSTRAINT chk_licencia_estado CHECK (estado IN ('PENDIENTE','APROBADA','RECHAZADA','CANCELADA')),
    aprobado_por     INT           REFERENCES usuarios(id),
    aprobado_en      DATETIME,
    CONSTRAINT chk_fechas_lic CHECK (fecha_fin >= fecha_inicio)
);
GO

CREATE TABLE permisos_laborales (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id    INT           NOT NULL REFERENCES contratos(id),
    fecha          DATE          NOT NULL,
    hora_inicio    TIME          NOT NULL,
    hora_fin       TIME          NOT NULL,
    motivo         NVARCHAR(300) NOT NULL,
    con_goce_haber BIT           NOT NULL DEFAULT 1,
    estado         NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                   CONSTRAINT chk_permiso_estado CHECK (estado IN ('PENDIENTE','APROBADO','RECHAZADO')),
    aprobado_por   INT           REFERENCES usuarios(id),
    aprobado_en    DATETIME,
    CONSTRAINT chk_horas_permiso CHECK (hora_fin > hora_inicio)
);
GO

CREATE TABLE sanciones (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id     INT           NOT NULL REFERENCES contratos(id),
    tipo_sancion_id INT           NOT NULL REFERENCES cat_tipo_sancion(id),
    fecha           DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    motivo          NVARCHAR(500) NOT NULL,
    descripcion_falta NVARCHAR(500),
    dias_suspension SMALLINT      NOT NULL DEFAULT 0,
    estado          NVARCHAR(20)  NOT NULL DEFAULT 'ACTIVA'
                    CONSTRAINT chk_sancion_estado CHECK (estado IN ('ACTIVA','IMPUGNADA','LEVANTADA')),
    registrado_por  INT           NOT NULL REFERENCES usuarios(id),
    creado_en       DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE reconocimientos (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id  INT           NOT NULL REFERENCES contratos(id),
    tipo         NVARCHAR(60)  NOT NULL,
    descripcion  NVARCHAR(500) NOT NULL,
    fecha        DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    otorgado_por INT           NOT NULL REFERENCES usuarios(id),
    creado_en    DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================================================
-- 10. NÓMINA Y BENEFICIOS
-- =============================================================================

CREATE TABLE conceptos_remunerativos (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    empresa_id      INT           NOT NULL REFERENCES empresas(id),
    codigo          NVARCHAR(20)  NOT NULL UNIQUE,
    nombre          NVARCHAR(100) NOT NULL,
    tipo            NVARCHAR(20)  NOT NULL CONSTRAINT chk_concepto_tipo CHECK (tipo IN ('INGRESO','DESCUENTO')),
    es_remunerativo BIT           NOT NULL DEFAULT 1,
    afecto_essalud  BIT           NOT NULL DEFAULT 1,
    afecto_renta5   BIT           NOT NULL DEFAULT 0,
    afecto_afp_onp  BIT           NOT NULL DEFAULT 0,
    formula         NVARCHAR(300),
    activo          BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE planillas (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    empresa_id       INT           NOT NULL REFERENCES empresas(id),
    sucursal_id      INT           REFERENCES sucursales(id),
    periodo          CHAR(7)       NOT NULL,
    tipo             NVARCHAR(20)  NOT NULL DEFAULT 'MENSUAL'
                     CONSTRAINT chk_planilla_tipo CHECK (tipo IN ('MENSUAL','QUINCENAL','GRATIFICACION','CTS','LIQUIDACION')),
    fecha_calculo    DATETIME,
    estado           NVARCHAR(20)  NOT NULL DEFAULT 'BORRADOR'
                     CONSTRAINT chk_planilla_estado CHECK (estado IN ('BORRADOR','PRE_NOMINA','VALIDADA','APROBADA','PAGADA')),
    aprobado_por     INT           REFERENCES usuarios(id),
    aprobado_en      DATETIME,
    bloqueada        BIT           NOT NULL DEFAULT 0,
    version          INT           NOT NULL DEFAULT 1,
    total_ingresos   DECIMAL(14,2),
    total_descuentos DECIMAL(14,2),
    total_neto       DECIMAL(14,2),
    creado_en        DATETIME      NOT NULL DEFAULT GETDATE(),
    CONSTRAINT UQ_planilla UNIQUE (empresa_id, sucursal_id, periodo, tipo, version)
);
GO

CREATE TABLE detalle_planilla (
    id               INT IDENTITY(1,1) PRIMARY KEY,
    planilla_id      INT           NOT NULL REFERENCES planillas(id),
    contrato_id      INT           NOT NULL REFERENCES contratos(id),
    dias_trabajados  DECIMAL(5,2)  NOT NULL DEFAULT 0,
    dias_no_labora   DECIMAL(5,2)  NOT NULL DEFAULT 0,
    horas_extras     DECIMAL(6,2)  NOT NULL DEFAULT 0,
    salario_base     DECIMAL(10,2) NOT NULL,
    total_ingresos   DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_descuentos DECIMAL(10,2) NOT NULL DEFAULT 0,
    neto_pagar       DECIMAL(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT UQ_detalle_planilla UNIQUE (planilla_id, contrato_id)
);
GO

CREATE TABLE movimientos_planilla (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    detalle_planilla_id INT           NOT NULL REFERENCES detalle_planilla(id),
    concepto_id         INT           NOT NULL REFERENCES conceptos_remunerativos(id),
    monto               DECIMAL(10,2) NOT NULL,
    referencia          NVARCHAR(300)
);
GO

CREATE TABLE boletas_pago (
    id                  INT IDENTITY(1,1) PRIMARY KEY,
    detalle_planilla_id INT           NOT NULL UNIQUE REFERENCES detalle_planilla(id),
    nro_boleta          NVARCHAR(30)  NOT NULL UNIQUE,
    url_pdf             NVARCHAR(500),
    enviada_email       BIT           NOT NULL DEFAULT 0,
    fecha_envio_email   DATETIME,
    generada_en         DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE archivos_bancarios (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    planilla_id     INT           NOT NULL REFERENCES planillas(id),
    banco_id        INT           NOT NULL REFERENCES cat_banco(id),
    nombre_archivo  NVARCHAR(200),
    url_archivo     NVARCHAR(500),
    total_registros INT,
    total_monto     DECIMAL(14,2),
    estado          NVARCHAR(20)  NOT NULL DEFAULT 'GENERADO'
                    CONSTRAINT chk_archivo_estado CHECK (estado IN ('GENERADO','ENVIADO','PROCESADO','ERROR')),
    generado_en     DATETIME      NOT NULL DEFAULT GETDATE()
);
GO

-- =============================================================================
-- 11. DESVINCULACIÓN
-- =============================================================================

CREATE TABLE solicitudes_desvinculacion (
    id                   INT IDENTITY(1,1) PRIMARY KEY,
    contrato_id          INT           NOT NULL REFERENCES contratos(id),
    motivo_cese_id       INT           NOT NULL REFERENCES cat_motivo_cese(id),
    fecha_solicitud      DATE          NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    fecha_cese_propuesta DATE          NOT NULL,
    descripcion          NVARCHAR(500),
    carta_url            NVARCHAR(500),
    estado               NVARCHAR(20)  NOT NULL DEFAULT 'INICIADA'
                         CONSTRAINT chk_desvincul_estado CHECK (estado IN ('INICIADA','EN_PROCESO','VALIDADA','APROBADA','CERRADA','CANCELADA')),
    registrado_por       INT           NOT NULL REFERENCES usuarios(id),
    aprobado_por         INT           REFERENCES usuarios(id),
    aprobado_en          DATETIME
);
GO

CREATE TABLE validacion_desvinculacion (
    id           INT IDENTITY(1,1) PRIMARY KEY,
    solicitud_id INT           NOT NULL REFERENCES solicitudes_desvinculacion(id),
    item         NVARCHAR(150) NOT NULL,
    completado   BIT           NOT NULL DEFAULT 0,
    observacion  NVARCHAR(300),
    validado_por INT           REFERENCES usuarios(id),
    validado_en  DATETIME
);
GO

CREATE TABLE devolucion_activos (
    id                INT IDENTITY(1,1) PRIMARY KEY,
    solicitud_id      INT           NOT NULL REFERENCES solicitudes_desvinculacion(id),
    activo            NVARCHAR(150) NOT NULL,
    cantidad          DECIMAL(6,2)  NOT NULL DEFAULT 1,
    estado_devolucion NVARCHAR(15)  NOT NULL DEFAULT 'PENDIENTE'
                      CONSTRAINT chk_devolucion_estado CHECK (estado_devolucion IN ('PENDIENTE','DEVUELTO','NO_DEVUELTO','DANIADO')),
    observacion       NVARCHAR(300),
    recibido_por      INT           REFERENCES usuarios(id),
    fecha_devolucion  DATE
);
GO

CREATE TABLE liquidaciones (
    id                   INT IDENTITY(1,1) PRIMARY KEY,
    solicitud_id         INT           NOT NULL UNIQUE REFERENCES solicitudes_desvinculacion(id),
    contrato_id          INT           NOT NULL REFERENCES contratos(id),
    cts_acumulada        DECIMAL(10,2) NOT NULL DEFAULT 0,
    vacaciones_truncas   DECIMAL(10,2) NOT NULL DEFAULT 0,
    gratificacion_trunca DECIMAL(10,2) NOT NULL DEFAULT 0,
    indemnizacion        DECIMAL(10,2) NOT NULL DEFAULT 0,
    deudas_descuento     DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_liquidacion    DECIMAL(10,2) NOT NULL DEFAULT 0,
    calculado_por        INT           REFERENCES usuarios(id),
    calculado_en         DATETIME,
    aprobado_por         INT           REFERENCES usuarios(id),
    aprobado_en          DATETIME,
    pagado               BIT           NOT NULL DEFAULT 0,
    fecha_pago           DATE,
    estado               NVARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE'
                         CONSTRAINT chk_liquidacion_estado CHECK (estado IN ('PENDIENTE','CALCULADA','APROBADA','PAGADA'))
);
GO

CREATE TABLE documentos_cese (
    id             INT IDENTITY(1,1) PRIMARY KEY,
    solicitud_id   INT           NOT NULL REFERENCES solicitudes_desvinculacion(id),
    tipo_documento NVARCHAR(80)  NOT NULL,
    url_pdf        NVARCHAR(500),
    generado_en    DATETIME      NOT NULL DEFAULT GETDATE(),
    generado_por   INT           NOT NULL REFERENCES usuarios(id)
);
GO

-- =============================================================================
-- 12. AUDITORÍA Y GOBIERNO DEL DATO
-- =============================================================================

CREATE TABLE log_auditoria (
    id             BIGINT IDENTITY(1,1) PRIMARY KEY,
    usuario_id     INT          REFERENCES usuarios(id),
    sesion_id      UNIQUEIDENTIFIER REFERENCES sesiones_usuario(id),
    accion         NVARCHAR(20) NOT NULL,
    tabla_afectada NVARCHAR(80),
    registro_id    NVARCHAR(40),
    datos_anterior NVARCHAR(500),
    datos_nuevo    NVARCHAR(500),
    ip_address     NVARCHAR(45),
    modulo         NVARCHAR(60),
    descripcion    NVARCHAR(300),
    creado_en      DATETIME     NOT NULL DEFAULT GETDATE()
);
GO

CREATE TABLE reglas_calidad (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nombre      NVARCHAR(100) NOT NULL,
    tabla       NVARCHAR(80)  NOT NULL,
    campo       NVARCHAR(80),
    descripcion NVARCHAR(300),
    tipo_regla  NVARCHAR(40)  NOT NULL,
    activo      BIT           NOT NULL DEFAULT 1
);
GO

CREATE TABLE monitoreo_calidad (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    regla_id        INT          NOT NULL REFERENCES reglas_calidad(id),
    fecha_ejecucion DATETIME     NOT NULL DEFAULT GETDATE(),
    total_registros INT,
    registros_ok    INT,
    registros_ko    INT,
    porcentaje_ok   DECIMAL(5,2),
    detalle         NVARCHAR(500)
);
GO

-- =============================================================================
-- 13. ÍNDICES DE RENDIMIENTO
-- =============================================================================

CREATE INDEX idx_personas_nro_doc      ON personas(nro_documento);
CREATE INDEX idx_personas_estado       ON personas(estado);
CREATE INDEX idx_contratos_estado      ON contratos(estado);
CREATE INDEX idx_contratos_expediente  ON contratos(expediente_id);
CREATE INDEX idx_marcaciones_fecha     ON marcaciones(contrato_id, fecha);
CREATE INDEX idx_marcaciones_estado    ON marcaciones(estado);
CREATE INDEX idx_planillas_periodo     ON planillas(empresa_id, periodo);
CREATE INDEX idx_planillas_estado      ON planillas(estado);
CREATE INDEX idx_vacantes_estado       ON vacantes(estado);
CREATE INDEX idx_postulaciones_estado  ON postulaciones(estado);
CREATE INDEX idx_log_auditoria_fecha   ON log_auditoria(creado_en);
CREATE INDEX idx_log_auditoria_tabla   ON log_auditoria(tabla_afectada, registro_id);
CREATE INDEX idx_desvincul_estado      ON solicitudes_desvinculacion(estado);
CREATE INDEX idx_licencias_contrato    ON licencias(contrato_id, fecha_inicio, fecha_fin);
CREATE INDEX idx_horas_extras_estado   ON horas_extras(contrato_id, estado);
GO

-- =============================================================================
-- 14. DATOS INICIALES
-- =============================================================================

INSERT INTO cat_tipo_documento (codigo, descripcion) VALUES
('DNI',        'Documento Nacional de Identidad'),
('CARNET_EXT', 'Carnet de Extranjería'),
('PASAPORTE',  'Pasaporte'),
('RUC',        'Registro Único de Contribuyentes');

INSERT INTO cat_estado_civil (codigo, descripcion) VALUES
('SOLTERO',     'Soltero/a'),
('CASADO',      'Casado/a'),
('CONVIVIENTE', 'Conviviente'),     -- 11 chars, ahora cabe en NVARCHAR(20)
('DIVORCIADO',  'Divorciado/a'),
('VIUDO',       'Viudo/a');

INSERT INTO cat_sexo (codigo, descripcion) VALUES
('M', 'Masculino'),
('F', 'Femenino');

INSERT INTO cat_afp (codigo, nombre, tasa_comision) VALUES
('HABITAT',   'AFP Habitat',   0.0138),
('INTEGRA',   'AFP Integra',   0.0155),
('PRIMA',     'AFP Prima',     0.0160),
('PROFUTURO', 'AFP Profuturo', 0.0169);

INSERT INTO cat_banco (codigo, nombre) VALUES
('BCP',        'Banco de Credito del Peru'),
('BBVA',       'BBVA Continental'),
('SCOTIABANK', 'Scotiabank Peru'),
('INTERBANK',  'Interbank'),
('BANBIF',     'BanBif'),
('PICHINCHA',  'Banco Pichincha'),
('GNB',        'Banco GNB Peru'),
('FALABELLA',  'Banco Falabella');

INSERT INTO cat_tipo_contrato (codigo, descripcion, requiere_fin) VALUES
('INDETERMINADO', 'Contrato a Plazo Indeterminado', 0),
('PLAZO_FIJO',    'Contrato a Plazo Fijo',          1),
('POR_OBRA',      'Contrato por Obra o Servicio',   1),
('PART_TIME',     'Contrato Part-Time',              0),
('PRACTICANTE',   'Convenio de Practicas',           1);

INSERT INTO cat_tipo_licencia (codigo, descripcion, con_goce_haber) VALUES
('MEDICA',        'Licencia Medica (SCTR/EsSalud)',      1),
('MATERNIDAD',    'Licencia por Maternidad',             1),
('PATERNIDAD',    'Licencia por Paternidad',             1),
('CAPACITACION',  'Licencia por Capacitacion',           1),
('SIN_GOCE',      'Licencia sin Goce de Haber',          0),
('FALLECIMIENTO', 'Licencia por Fallecimiento Familiar', 1);

INSERT INTO cat_motivo_cese (codigo, descripcion) VALUES
('RENUNCIA',           'Renuncia Voluntaria'),
('DESPIDO_CAUSA',      'Despido con Causa Justificada'),
('DESPIDO_ARBITRARIO', 'Despido Arbitrario'),
('MUTUO_ACUERDO',      'Mutuo Disenso'),
('VENCIMIENTO',        'Vencimiento de Contrato'),
('FALLECIMIENTO',      'Fallecimiento del Trabajador'),
('JUBILACION',         'Jubilacion');

INSERT INTO cat_tipo_sancion (codigo, descripcion) VALUES
('AMONESTACION', 'Amonestacion Verbal'),
('MEMO',         'Amonestacion Escrita (Memorando)'),
('SUSPENSION',   'Suspension sin Goce de Haber'),
('DESCUENTO',    'Descuento por Tardanza/Falta');

INSERT INTO cat_tipo_cuenta_bancaria (codigo, descripcion) VALUES
('AHORRO',    'Cuenta de Ahorros'),
('CORRIENTE', 'Cuenta Corriente'),
('HABERES',   'Cuenta de Haberes');

INSERT INTO cat_estado (contexto, codigo, descripcion) VALUES
('CONTRATO', 'BORRADOR',        'En elaboracion'),
('CONTRATO', 'PENDIENTE_FIRMA', 'Pendiente de firma'),
('CONTRATO', 'VIGENTE',         'Contrato activo'),
('CONTRATO', 'VENCIDO',         'Contrato vencido'),
('CONTRATO', 'RESCINDIDO',      'Contrato rescindido'),
('PERSONA',  'CANDIDATO',       'Postulante'),
('PERSONA',  'ACTIVO',          'Trabajador activo'),
('PERSONA',  'INACTIVO',        'Inactivo'),
('PERSONA',  'CESADO',          'Trabajador cesado'),
('VACANTE',  'BORRADOR',        'En elaboracion'),
('VACANTE',  'PUBLICADA',       'Publicada y recibiendo postulaciones'),
('VACANTE',  'EN_PROCESO',      'En proceso de seleccion'),
('VACANTE',  'DESIERTA',        'Declarada desierta'),
('VACANTE',  'CERRADA',         'Proceso finalizado'),
('PLANILLA', 'BORRADOR',        'En elaboracion'),
('PLANILLA', 'PRE_NOMINA',      'Pre-nomina generada'),
('PLANILLA', 'VALIDADA',        'Pre-nomina validada'),
('PLANILLA', 'APROBADA',        'Nomina aprobada y bloqueada'),
('PLANILLA', 'PAGADA',          'Pagada y transferida');

INSERT INTO roles (codigo, nombre, descripcion) VALUES
('ADMIN_SISTEMA',   'Administrador del Sistema',   'Control total del sistema'),
('GERENTE_RRHH',    'Gerente Corporativo de RRHH', 'Aprueba nominas, contratos y ceses'),
('ANALISTA_RRHH',   'Analista de Recursos Humanos','Gestiona reclutamiento y contratos'),
('ANALISTA_NOMINA', 'Analista de Nomina',          'Calcula y gestiona planillas'),
('JEFE_INMEDIATO',  'Jefe Inmediato',              'Aprueba solicitudes de su equipo'),
('TRABAJADOR',      'Trabajador',                  'Acceso al portal del empleado'),
('AUDITOR',         'Auditor del Sistema',         'Solo lectura, revision de logs'),
('DATA_STEWARD',    'Data Steward',                'Gobierno y calidad del dato');
GO

PRINT '>>> Base de datos SCGRH creada exitosamente.';
PRINT '>>> Tablas creadas: 66';
PRINT '>>> Catalogos cargados: listos para usar.';
GO
