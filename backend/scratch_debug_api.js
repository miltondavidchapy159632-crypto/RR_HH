require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 1, username: 'admin', email: 'admin@scgrh.pe', rol: 'ADMIN_SISTEMA' },
  process.env.JWT_SECRET || 'scgrh_clave_super_secreta_2026_unp',
  { expiresIn: '1h' }
);

console.log('JWT Generado:', token);

async function testApi() {
  try {
    const response = await fetch('http://localhost:3000/api/personas/catalogs', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    const text = await response.text();
    console.log('Response body (primeros 200 caracteres):', text.substring(0, 200));
  } catch (err) {
    console.error('Error en fetch de diagnóstico:', err);
  }
}

testApi();
