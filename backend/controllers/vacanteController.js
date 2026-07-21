// ============================================================
//  SCGRH — vacanteController.js
// ============================================================
const VacanteModel = require('../models/VacanteModel');
const emailService = require('../services/emailService');

const vacanteController = {

  // ── VACANTES ─────────────────────────────────────────────

  async getAllVacantes(req, res) {
    try {
      const empresa_id = req.user.empresa_id;
      const data = await VacanteModel.findAllVacantes(empresa_id);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async getVacanteById(req, res) {
    try {
      const item = await VacanteModel.findVacanteById(parseInt(req.params.id));
      if (!item) return res.status(404).json({ ok: false, message: 'Vacante no encontrada' });
      res.json({ ok: true, data: item });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createVacante(req, res) {
    try {
      const { puesto_id, sucursal_id, titulo } = req.body;
      if (!puesto_id || !sucursal_id || !titulo) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios: puesto_id, sucursal_id, titulo' });
      }
      const id = await VacanteModel.createVacante(req.body, req.user.id);
      res.status(201).json({ ok: true, message: 'Vacante creada exitosamente', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async updateVacante(req, res) {
    try {
      const { titulo } = req.body;
      if (!titulo) return res.status(400).json({ ok: false, message: 'El título es obligatorio' });
      await VacanteModel.updateVacante(parseInt(req.params.id), req.body);
      res.json({ ok: true, message: 'Vacante actualizada' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async cambiarEstado(req, res) {
    try {
      const { estado } = req.body;
      const estados = ['BORRADOR','PUBLICADA','EN_PROCESO','DESIERTA','CERRADA','CANCELADA'];
      if (!estados.includes(estado)) {
        return res.status(400).json({ ok: false, message: 'Estado inválido' });
      }
      await VacanteModel.cambiarEstadoVacante(parseInt(req.params.id), estado);
      res.json({ ok: true, message: `Vacante marcada como ${estado}` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── POSTULACIONES ────────────────────────────────────────

  async getPostulaciones(req, res) {
    try {
      const data = await VacanteModel.findPostulacionesByVacante(parseInt(req.params.id));
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createPostulacion(req, res) {
    try {
      const { vacante_id, persona_id } = req.body;
      if (!vacante_id || !persona_id) {
        return res.status(400).json({ ok: false, message: 'Faltan: vacante_id, persona_id' });
      }
      const id = await VacanteModel.createPostulacion(req.body);
      res.status(201).json({ ok: true, message: 'Postulación registrada', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ ok: false, message: 'Esta persona ya tiene una postulación para esta vacante' });
      }
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async cambiarEstadoPostulacion(req, res) {
    try {
      const { estado } = req.body;
      const estados = ['RECIBIDA','EN_REVISION','PRESELECCIONADO','EN_ENTREVISTA','APROBADO','RECHAZADO','RETIRADO'];
      if (!estados.includes(estado)) {
        return res.status(400).json({ ok: false, message: 'Estado inválido' });
      }
      await VacanteModel.cambiarEstadoPostulacion(parseInt(req.params.id), estado);
      res.json({ ok: true, message: `Postulación actualizada a ${estado}` });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── ENTREVISTAS ─────────────────────────────────────────

  async getEntrevistas(req, res) {
    try {
      const data = await VacanteModel.findEntrevistasByPostulacion(parseInt(req.params.postulacion_id));
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async createEntrevista(req, res) {
    try {
      const { postulacion_id, fecha_programada } = req.body;
      if (!postulacion_id || !fecha_programada) {
        return res.status(400).json({ ok: false, message: 'Faltan: postulacion_id, fecha_programada' });
      }
      const data    = { ...req.body, entrevistador_id: req.body.entrevistador_id || req.user.id };
      const id      = await VacanteModel.createEntrevista(data);

      // Notificación al candidato (si tiene email)
      try {
        const postulacion = await VacanteModel.findPostulacionById(postulacion_id);
        const emailDest   = postulacion.email_personal || postulacion.email_corporativo;
        if (emailDest) {
          await emailService.notificarEntrevista({
            to:           emailDest,
            nombre:       postulacion.nombre_completo,
            vacante:      postulacion.vacante_titulo,
            empresa:      'Restaurante del Futuro',
            resultado:    'PENDIENTE',
            fecha:        new Date(fecha_programada).toLocaleString('es-PE'),
            observaciones: null
          });
        }
      } catch (_) { /* email no crítico */ }

      res.status(201).json({ ok: true, message: 'Entrevista programada', id });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async registrarResultadoEntrevista(req, res) {
    try {
      const { resultado } = req.body;
      if (!resultado) return res.status(400).json({ ok: false, message: 'El resultado es obligatorio' });

      const entrevistaId = parseInt(req.params.id);
      await VacanteModel.registrarResultadoEntrevista(entrevistaId, req.body);

      res.json({ ok: true, message: 'Resultado de entrevista registrado' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── OFERTAS ──────────────────────────────────────────────

  async createOfertaLaboral(req, res) {
    try {
      const { postulacion_id, cargo_id, sucursal_id, salario_ofrecido, tipo_contrato_id } = req.body;
      if (!postulacion_id || !cargo_id || !sucursal_id || !salario_ofrecido || !tipo_contrato_id) {
        return res.status(400).json({ ok: false, message: 'Faltan campos obligatorios en la oferta' });
      }
      const id = await VacanteModel.createOfertaLaboral(req.body);

      // Notificación email al candidato
      try {
        const postulacion = await VacanteModel.findPostulacionById(postulacion_id);
        const emailDest   = postulacion.email_personal || postulacion.email_corporativo;
        if (emailDest) {
          await emailService.notificarOfertaLaboral({
            to:           emailDest,
            nombre:       postulacion.nombre_completo,
            cargo:        postulacion.vacante_titulo,
            empresa:      'Restaurante del Futuro',
            sucursal:     req.body.sucursal_nombre || '—',
            salario:      salario_ofrecido,
            fechaInicio:  req.body.fecha_inicio_propuesta || '—',
            beneficios:   req.body.beneficios_adicionales || null
          });
        }
      } catch (_) { /* email no crítico */ }

      res.status(201).json({ ok: true, message: 'Oferta laboral emitida y notificación enviada', id });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(409).json({ ok: false, message: 'Ya existe una oferta para esta postulación' });
      }
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── CATÁLOGOS ────────────────────────────────────────────

  async getCatalogos(req, res) {
    try {
      const data = await VacanteModel.getCatalogos(req.user.empresa_id);
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = vacanteController;
