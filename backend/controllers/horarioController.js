const HorarioModel = require('../models/HorarioModel');

const horarioController = {
  async getAll(req, res) {
    try {
      const data = await HorarioModel.findAll();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getById(req, res) {
    try {
      const item = await HorarioModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Horario no encontrado' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async create(req, res) {
    try {
      const { sucursal_id, nombre } = req.body;
      if (!sucursal_id || !nombre) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios' });
      }
      const id = await HorarioModel.create(req.body);
      res.status(201).json({ ok: true, message: 'Horario creado', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async update(req, res) {
    try {
      await HorarioModel.update(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Horario actualizado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async delete(req, res) {
    try {
      await HorarioModel.delete(parseInt(req.params.id));
      res.json({ ok: true, message: 'Horario desactivado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Controladores de asignación de horarios ──
  async getAsignaciones(req, res) {
    try {
      const data = await HorarioModel.getAsignaciones();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createAsignacion(req, res) {
    try {
      const { contrato_id, horario_id, fecha_inicio } = req.body;
      if (!contrato_id || !horario_id || !fecha_inicio) {
        return res.status(400).json({ ok: false, message: 'Contrato, Horario y Fecha de Inicio requeridos' });
      }
      const asignadoPor = req.user.id;
      const id = await HorarioModel.createAsignacion(req.body, asignadoPor);
      res.status(201).json({ ok: true, message: 'Horario asignado al colaborador', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async deleteAsignacion(req, res) {
    try {
      await HorarioModel.deleteAsignacion(parseInt(req.params.id));
      res.json({ ok: true, message: 'Asignación eliminada' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = horarioController;
