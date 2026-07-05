const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const UsuarioModel = require('../models/UsuarioModel');

const authController = {
  async login(req, res) {
    try {
      const { username, password } = req.body;
      if (!username || !password)
        return res.status(400).json({ ok: false, message: 'Usuario y contraseña requeridos' });

      const user = await UsuarioModel.findByUsername(username);
      if (!user)
        return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });

      if (user.estado === 'BLOQUEADO')
        return res.status(403).json({ ok: false, message: 'Cuenta bloqueada. Contacte al administrador.' });

      if (user.estado !== 'ACTIVO')
        return res.status(403).json({ ok: false, message: 'Cuenta inactiva' });

      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) {
        await UsuarioModel.incrementarIntentos(user.id);
        return res.status(401).json({ ok: false, message: 'Credenciales incorrectas' });
      }

      await UsuarioModel.resetearIntentos(user.id);

      const token = jwt.sign(
        { id: user.id, username: user.username, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRY || '8h' }
      );

      res.json({
        ok: true,
        message: 'Bienvenido, ' + user.username,
        token,
        user: {
          id:         user.id,
          username:   user.username,
          email:      user.email,
          rol:        user.rol,
          rol_nombre: user.rol_nombre,
          empresa_id: user.empresa_id
        }
      });
    } catch (err) {
      console.error('Error login:', err);
      res.status(500).json({ ok: false, message: 'Error del servidor' });
    }
  },

  async me(req, res) {
    try {
      const user = await UsuarioModel.findById(req.user.id);
      if (!user) return res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
      res.json({ ok: true, user });
    } catch (err) {
      res.status(500).json({ ok: false, message: 'Error del servidor' });
    }
  },

  async logout(req, res) {
    res.json({ ok: true, message: 'Sesión cerrada' });
  }
};

module.exports = authController;
