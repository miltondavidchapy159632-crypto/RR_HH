require('dotenv').config();
const { connectDB } = require('./config/database');
const PersonaModel = require('./models/PersonaModel');

async function test() {
  try {
    await connectDB();
    console.log('Intentando obtener catálogos...');
    const cats = await PersonaModel.getCatalogs();
    console.log('Catálogos obtenidos correctamente:', Object.keys(cats));
    process.exit(0);
  } catch (err) {
    console.error('Error al obtener catálogos:', err);
    process.exit(1);
  }
}

test();
