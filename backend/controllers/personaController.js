const PersonaModel = require('../models/PersonaModel');

const personaController = {
  async getAll(req, res) {
    try {
      const data = await PersonaModel.findAll();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await PersonaModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Colaborador no encontrado' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { tipo_doc_id, nro_documento, nombres, apellido_paterno } = req.body;
      if (!tipo_doc_id || !nro_documento || !nombres || !apellido_paterno) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
      }
      const creadorId = req.user.id; // Del middleware de autenticación
      const id = await PersonaModel.create(req.body, creadorId);
      res.status(201).json({ ok: true, message: 'Colaborador registrado y expediente laboral creado', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ ok: false, message: 'Ya existe un colaborador con este tipo y número de documento' });
      }
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      const { tipo_doc_id, nro_documento, nombres, apellido_paterno } = req.body;
      if (!tipo_doc_id || !nro_documento || !nombres || !apellido_paterno) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
      }
      await PersonaModel.update(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Datos del colaborador actualizados' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await PersonaModel.delete(parseInt(req.params.id));
      res.json({ ok: true, message: 'Colaborador marcado como inactivo' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getCatalogs(req, res) {
    try {
      const catalogs = await PersonaModel.getCatalogs();
      res.json({ ok: true, data: catalogs });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = personaController;
