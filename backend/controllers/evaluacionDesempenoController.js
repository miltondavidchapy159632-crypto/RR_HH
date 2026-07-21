// ============================================================
//  SCGRH — evaluacionDesempenoController.js
// ============================================================
const EvalModel = require('../models/EvaluacionDesempenoModel');

const evalController = {

  // ── Listar todas ──────────────────────────────────────────
  async getAll(req, res) {
    try {
      const data = await EvalModel.findAll(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Detalle con criterios y planes ───────────────────────
  async getById(req, res) {
    try {
      const item = await EvalModel.findById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Evaluación no encontrada' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Crear evaluación con criterios ───────────────────────
  async create(req, res) {
    try {
      const { evaluado_id, periodo, fecha_evaluacion } = req.body;
      if (!evaluado_id || !periodo || !fecha_evaluacion) {
        return res.status(400).json({
          ok: false, message: 'Faltan campos obligatorios: evaluado_id, periodo, fecha_evaluacion'
        });
      }
      const id = await EvalModel.create(req.body, req.user.id);
      res.status(201).json({ ok: true, message: 'Evaluación creada exitosamente', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Actualizar criterios y recalcular puntaje ────────────
  async updateCriterios(req, res) {
    try {
      const { criterios } = req.body;
      if (!criterios || !criterios.length) {
        return res.status(400).json({ ok: false, message: 'Se requiere al menos un criterio' });
      }
      const result = await EvalModel.upsertCriterios(parseInt(req.params.id), criterios);
      res.json({ ok: true, message: 'Criterios actualizados', ...result });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Cambiar estado (BORRADOR → EN_PROCESO → COMPLETADA → APROBADA) ──
  async cambiarEstado(req, res) {
    try {
      const { estado } = req.body;
      const validos = ['BORRADOR', 'EN_PROCESO', 'COMPLETADA', 'APROBADA'];
      if (!validos.includes(estado)) {
        return res.status(400).json({ ok: false, message: 'Estado inválido' });
      }
      await EvalModel.cambiarEstado(parseInt(req.params.id), estado);
      res.json({ ok: true, message: `Evaluación marcada como ${estado}` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Planes de desarrollo ──────────────────────────────────
  async createPlan(req, res) {
    try {
      const { contrato_id, objetivo, fecha_inicio } = req.body;
      if (!contrato_id || !objetivo || !fecha_inicio) {
        return res.status(400).json({ ok: false, message: 'Faltan: contrato_id, objetivo, fecha_inicio' });
      }
      const id = await EvalModel.createPlanDesarrollo(req.body);
      res.status(201).json({ ok: true, message: 'Plan de desarrollo creado', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async updatePlan(req, res) {
    try {
      await EvalModel.updatePlanDesarrollo(parseInt(req.params.planId), req.body);
      res.json({ ok: true, message: 'Plan de desarrollo actualizado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Catálogos ─────────────────────────────────────────────
  async getCatalogos(req, res) {
    try {
      const contratos = await EvalModel.getContratosActivos(req.user.empresa_id);
      res.json({ ok: true, data: { contratos } });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = evalController;
