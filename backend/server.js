require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { connectDB } = require('./config/database');

// ── Rutas ──────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const empresaRoutes   = require('./routes/empresaRoutes');
const sucursalRoutes  = require('./routes/sucursalRoutes');
const areaRoutes      = require('./routes/areaRoutes');
const cargoRoutes     = require('./routes/cargoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const personaRoutes   = require('./routes/personaRoutes');
const contratoRoutes  = require('./routes/contratoRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globales ────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','DELETE'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Servir frontend estático ────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/empresas',   empresaRoutes);
app.use('/api/sucursales', sucursalRoutes);
app.use('/api/areas',      areaRoutes);
app.use('/api/cargos',     cargoRoutes);
app.use('/api/dashboard',  dashboardRoutes);
app.use('/api/personas',   personaRoutes);
app.use('/api/contratos',  contratoRoutes);

// ── Ruta raíz → login ───────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

// ── Manejo de errores global ────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    ok:      false,
    message: err.message || 'Error interno del servidor'
  });
});

// ── Iniciar servidor ────────────────────────────────────
async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log('════════════════════════════════════════');
      console.log('  SCGRH — Sistema de Recursos Humanos   ');
      console.log('════════════════════════════════════════');
      console.log(`  Servidor:  http://localhost:${PORT}`);
      console.log(`  Entorno:   ${process.env.NODE_ENV}`);
      console.log('════════════════════════════════════════');
    });
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
}

startServer();
