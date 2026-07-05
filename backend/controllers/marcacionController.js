const MarcacionModel = require('../models/MarcacionModel');

const marcacionController = {
  async getAll(req, res) {
    try {
      const data = await MarcacionModel.findAll();
      res.json({ ok: true, data });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Lógica Biométrica: Chequeo de Turno actual de colaborador ──
  async checkTurno(req, res) {
    try {
      const { nro_documento } = req.body;
      if (!nro_documento) return res.status(400).json({ ok: false, message: 'DNI/RUC requerido' });

      // Obtener fecha de hoy local en Perú (formato YYYY-MM-DD)
      const ahora = new Date();
      // Ajuste de zona horaria local
      const fechaLocal = ahora.toLocaleDateString('sv-SE'); // sv-SE da formato YYYY-MM-DD

      const info = await MarcacionModel.getTurnoAsignadoParaHoy(nro_documento.trim(), fechaLocal);
      
      if (!info) {
        return res.status(404).json({ 
          ok: false, 
          message: 'No se encontró un contrato vigente o un horario activo asignado para hoy para este colaborador.' 
        });
      }

      res.json({ ok: true, data: info });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  // ── Lógica de Marcación (Registrar Marcación) ──
  async marcar(req, res) {
    try {
      const { nro_documento, tipo_marcacion } = req.body; // tipo_marcacion: 'ENTRADA' o 'SALIDA'
      if (!nro_documento || !tipo_marcacion) {
        return res.status(400).json({ ok: false, message: 'Faltan datos obligatorios (documento y tipo)' });
      }

      const ahora = new Date();
      const fechaLocal = ahora.toLocaleDateString('sv-SE'); // YYYY-MM-DD
      const horaLocalStr = ahora.toLocaleTimeString('sv-SE'); // HH:MM:SS
      const fullDateTimeStr = `${fechaLocal}T${horaLocalStr}`;

      // 1. Obtener la asignación de turno del colaborador para hoy
      const info = await MarcacionModel.getTurnoAsignadoParaHoy(nro_documento.trim(), fechaLocal);
      if (!info) {
        return res.status(404).json({ ok: false, message: 'Colaborador no tiene turno asignado para hoy' });
      }

      if (tipo_marcacion === 'ENTRADA') {
        if (info.marcacion_id) {
          return res.status(409).json({ ok: false, message: 'El colaborador ya registró su entrada para el día de hoy.' });
        }

        // ── ALGORITMO DE CÁLCULO DE TARDANZA ──
        const [entradaH, entradaM] = info.hora_entrada.split(':').map(Number);
        const [marcadoH, marcadoM] = horaLocalStr.split(':').map(Number);

        const limiteMinutos = entradaH * 60 + entradaM + (info.tolerancia_min || 0);
        const marcadoMinutos = marcadoH * 60 + marcadoM;

        let tardanzaMinutos = 0;
        let estado = 'PRESENTE';

        if (marcadoMinutos > limiteMinutos) {
          tardanzaMinutos = marcadoMinutos - (entradaH * 60 + entradaM);
          estado = 'TARDANZA';
        }

        const id = await MarcacionModel.registrarEntrada(
          info.contrato_id,
          info.turno_id,
          fechaLocal,
          fullDateTimeStr,
          tardanzaMinutos,
          estado,
          'WEB'
        );

        res.status(201).json({
          ok: true,
          message: estado === 'TARDANZA' 
            ? `Entrada registrada con tardanza de ${tardanzaMinutos} min.` 
            : 'Entrada registrada a tiempo ✔',
          data: {
            colaborador: info.colaborador_nombre,
            hora: horaLocalStr.substring(0, 5),
            tardanza_minutos: tardanzaMinutos,
            estado
          }
        });

      } else if (tipo_marcacion === 'SALIDA') {
        if (!info.marcacion_id) {
          return res.status(400).json({ ok: false, message: 'Debe registrar primero su marcación de Entrada antes de marcar la Salida.' });
        }

        if (info.hora_salida) {
          return res.status(409).json({ ok: false, message: 'El colaborador ya registró su salida del día de hoy.' });
        }

        await MarcacionModel.registrarSalida(info.marcacion_id, fullDateTimeStr);

        res.json({
          ok: true,
          message: 'Salida registrada correctamente ✔',
          data: {
            colaborador: info.colaborador_nombre,
            hora: horaLocalStr.substring(0, 5)
          }
        });
      }

    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  },

  async justificar(req, res) {
    try {
      const { id, justificacion } = req.body;
      if (!id || !justificacion) {
        return res.status(400).json({ ok: false, message: 'ID y Justificación son obligatorios' });
      }
      const revisadoPor = req.user.id;
      await MarcacionModel.justificarMarcacion(id, justificacion, revisadoPor);
      res.json({ ok: true, message: 'Asistencia justificada correctamente' });
    } catch (err) {
      res.status(500).json({ ok: false, message: err.message });
    }
  }
};

module.exports = marcacionController;
