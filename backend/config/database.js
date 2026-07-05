const sql = require('mssql');

const config = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   process.env.DB_SERVER   || 'localhost',
  database: process.env.DB_DATABASE || 'RR_HH',
  port:     parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt:              process.env.DB_ENCRYPT    === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false'
  },
  pool: {
    max: 10, min: 0, idleTimeoutMillis: 30000
  }
};

let pool = null;

async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log('  DB:        SQL Server conectado ✔');
    return pool;
  } catch (err) {
    console.error('  DB:        Error de conexión ✖', err.message);
    throw err;
  }
}

function getPool() {
  if (!pool) throw new Error('Base de datos no conectada');
  return pool;
}

module.exports = { sql, connectDB, getPool };
