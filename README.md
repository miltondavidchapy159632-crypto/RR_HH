# SCGRH — Sistema Corporativo de Gestión de Recursos Humanos

> **Módulo 1:** Login · Dashboard · Organización (Empresas, Sucursales, Áreas, Cargos)

---

## 🏗️ Arquitectura

```
Recursos_Humanos/
├── backend/                    ← Servidor Node.js (Express)
│   ├── server.js               ← Punto de entrada, puerto 3000
│   ├── .env                    ← Variables de entorno (configurar)
│   ├── seed.js                 ← Datos iniciales de prueba
│   ├── config/
│   │   └── database.js         ← Conexión SQL Server (mssql)
│   ├── middleware/
│   │   └── auth.js             ← JWT middleware
│   ├── models/                 ← Solo SQL (SELECT/INSERT/UPDATE)
│   │   ├── UsuarioModel.js
│   │   ├── EmpresaModel.js
│   │   ├── SucursalModel.js
│   │   ├── AreaModel.js
│   │   └── CargoModel.js
│   ├── controllers/            ← Lógica y validaciones
│   │   ├── authController.js
│   │   ├── empresaController.js
│   │   ├── sucursalController.js
│   │   ├── areaController.js
│   │   └── cargoController.js
│   └── routes/                 ← URLs del servidor
│       ├── authRoutes.js
│       ├── empresaRoutes.js
│       ├── sucursalRoutes.js
│       ├── areaRoutes.js
│       ├── cargoRoutes.js
│       └── dashboardRoutes.js
│
├── frontend/                   ← HTML + CSS + JS vanilla
│   ├── login.html
│   ├── dashboard.html
│   ├── empresas.html
│   ├── sucursales.html
│   ├── areas.html
│   ├── cargos.html
│   ├── css/
│   │   └── style.css           ← Sistema de diseño global
│   └── js/
│       ├── auth.js             ← Utilidades compartidas (JWT, fetch, toast)
│       ├── login.js
│       ├── dashboard.js
│       ├── empresas.js
│       ├── sucursales.js
│       ├── areas.js
│       └── cargos.js
│
└── database/
    └── schema_rrhh.sql         ← Script completo SQL Server
```

---

## ⚙️ Instalación

### Prerrequisitos
- Node.js 18+
- SQL Server con base de datos `RR_HH` ya creada
- El script `schema_rrhh.sql` ya ejecutado en SSMS

### Paso 1 — Configurar la base de datos
Ejecuta `database/schema_rrhh.sql` en SQL Server Management Studio si no lo has hecho.

### Paso 2 — Configurar variables de entorno
Edita el archivo `backend/.env`:
```env
DB_USER=sa
DB_PASSWORD=tu_contraseña_aqui    ← CAMBIA ESTO
DB_SERVER=localhost
DB_DATABASE=RR_HH
JWT_SECRET=scgrh_clave_secreta    ← CAMBIA ESTO en producción
```

### Paso 3 — Instalar dependencias
```powershell
cd backend
npm install
```

### Paso 4 — Insertar datos de prueba
```powershell
npm run seed
```
Esto crea:
- Empresa: "Restaurantes El Sabor SAC"
- 3 sucursales
- 5 áreas
- 5 cargos
- Usuario administrador

### Paso 5 — Iniciar el servidor
```powershell
npm run dev      # Modo desarrollo (con nodemon)
# o
npm start        # Modo producción
```

### Paso 6 — Abrir en el navegador
```
http://localhost:3000
```

**Credenciales de acceso:**
| Campo | Valor |
|-------|-------|
| Usuario | `admin` |
| Contraseña | `Admin123!` |

---

## 🔌 API Endpoints

Todos los endpoints protegidos requieren: `Authorization: Bearer <token>`

### Autenticación
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login → devuelve token JWT |
| `GET`  | `/api/auth/me` | Datos del usuario actual |
| `POST` | `/api/auth/logout` | Cerrar sesión |

### Dashboard
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Estadísticas generales |

### Empresas
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`    | `/api/empresas` | Listar todas |
| `GET`    | `/api/empresas/:id` | Ver una |
| `POST`   | `/api/empresas` | Crear |
| `PUT`    | `/api/empresas/:id` | Editar |
| `DELETE` | `/api/empresas/:id` | Desactivar |

### Sucursales
| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET`    | `/api/sucursales?empresa_id=1` | Filtrar por empresa |
| `GET`    | `/api/sucursales/:id` | Ver una |
| `POST`   | `/api/sucursales` | Crear |
| `PUT`    | `/api/sucursales/:id` | Editar |
| `DELETE` | `/api/sucursales/:id` | Desactivar |

### Áreas y Cargos
Mismo patrón que sucursales en `/api/areas` y `/api/cargos`.

---

## 🎨 Diseño

- **Tema:** Oscuro premium (navy profundo)
- **Paleta:** Azul `#2D7EF8` + Dorado `#F0A500`
- **Font:** Inter (Google Fonts)
- **Iconos:** Font Awesome 6
- **Componentes:** Cards, tablas, modales, toasts, sidebar colapsable

---

## 📋 Módulos Planificados

| # | Módulo | Estado |
|---|--------|--------|
| 1 | Login + Dashboard + Organización | ✅ Completo |
| 2 | Personas y Contratos | 🔜 Siguiente |
| 3 | Asistencia y Turnos | ⏳ Pendiente |
| 4 | Vacaciones y Licencias | ⏳ Pendiente |
| 5 | Reclutamiento | ⏳ Pendiente |
| 6 | Nómina y Planillas | ⏳ Pendiente |
| 7 | Desvinculaciones | ⏳ Pendiente |
| 8 | Auditoría y Reportes | ⏳ Pendiente |

---

*UNP — Ingeniería Informática · 2026*
