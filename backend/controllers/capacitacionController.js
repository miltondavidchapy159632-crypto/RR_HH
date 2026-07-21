// ============================================================
//  SCGRH — capacitacionController.js
// ============================================================
const CapModel = require('../models/CapacitacionModel');

const capacitacionController = {

  // ── CURSOS ────────────────────────────────────────────────
  async getAllCursos(req, res) {
    try {
      res.json({ ok: true, data: await CapModel.findAllCursos() });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async createCurso(req, res) {
    try {
      const { nombre } = req.body;
      if (!nombre) return res.status(400).json({ ok: false, message: 'El nombre del curso es obligatorio' });
      const id = await CapModel.createCurso(req.body);
      res.status(201).json({ ok: true, message: 'Curso creado', id });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async updateCurso(req, res) {
    try {
      if (!req.body.nombre) return res.status(400).json({ ok: false, message: 'Nombre obligatorio' });
      await CapModel.updateCurso(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Curso actualizado' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  // ── SESIONES ──────────────────────────────────────────────
  async getAllSesiones(req, res) {
    try {
      const data = await CapModel.findAllSesiones(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async getSesionById(req, res) {
    try {
      const item = await CapModel.findSesionById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Sesión no encontrada' });
      res.json({ ok: true, data: item });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async createSesion(req, res) {
    try {
      const { curso_id, fecha_inicio } = req.body;
      if (!curso_id || !fecha_inicio)
        return res.status(400).json({ ok: false, message: 'Faltan: curso_id, fecha_inicio' });
      const id = await CapModel.createSesion(req.body);
      res.status(201).json({ ok: true, message: 'Sesión creada', id });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async updateSesion(req, res) {
    try {
      if (!req.body.fecha_inicio)
        return res.status(400).json({ ok: false, message: 'La fecha de inicio es obligatoria' });
      await CapModel.updateSesion(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Sesión actualizada' });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  async cambiarEstado(req, res) {
    try {
      const { estado } = req.body;
      const validos = ['PROGRAMADA', 'EN_CURSO', 'REALIZADA', 'CANCELADA'];
      if (!validos.includes(estado))
        return res.status(400).json({ ok: false, message: 'Estado inválido' });
      await CapModel.cambiarEstadoSesion(parseInt(req.params.id), estado);
      res.json({ ok: true, message: `Sesión marcada como ${estado}` });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  // ── INSCRIPCIONES ─────────────────────────────────────────
  async inscribir(req, res) {
    try {
      const { contrato_id } = req.body;
      const cap_id = parseInt(req.params.id);
      if (!contrato_id)
        return res.status(400).json({ ok: false, message: 'contrato_id es obligatorio' });
      const id = await CapModel.inscribirParticipante(cap_id, contrato_id);
      res.status(201).json({ ok: true, message: 'Participante inscrito', id });
    } catch (err) {
      if (err.message.includes('UNIQUE') || err.message.includes('UNIQUE'))
        return res.status(409).json({ ok: false, message: 'Este colaborador ya está inscrito en esta sesión' });
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async registrarAsistencia(req, res) {
    try {
      const { registros } = req.body;
      if (!registros || !registros.length)
        return res.status(400).json({ ok: false, message: 'Se requiere el array "registros"' });
      await CapModel.registrarAsistencia(registros);
      res.json({ ok: true, message: `Asistencia registrada para ${registros.length} participante(s)` });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  // ── EVALUACIONES ──────────────────────────────────────────
  async evaluar(req, res) {
    try {
      const { puntaje } = req.body;
      if (puntaje === undefined || puntaje === null)
        return res.status(400).json({ ok: false, message: 'El puntaje es obligatorio' });
      const result = await CapModel.upsertEvaluacionAsistente(
        parseInt(req.params.asistencia_id), req.body
      );
      res.json({ ok: true, message: result.aprobado ? 'Participante APROBADO ✅' : 'Participante NO APROBADO', ...result });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  },

  // ── CATÁLOGOS ─────────────────────────────────────────────
  async getCatalogos(req, res) {
    try {
      const data = await CapModel.getCatalogos(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) { res.status(500).json({ ok: false, message: err.message }); }
  }
};

module.exports = capacitacionController;
