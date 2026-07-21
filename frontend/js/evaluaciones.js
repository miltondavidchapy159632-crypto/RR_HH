// ============================================================
//  SCGRH — evaluaciones.js
//  Evaluaciones de desempeño + Planes de desarrollo
// ============================================================
'use strict';

// ── Criterios predefinidos para restaurante de lujo ──────────
const CRITERIOS_DEFAULT = [
  { criterio: 'Puntualidad y asistencia',           puntaje_maximo: 10 },
  { criterio: 'Calidad del trabajo y presentación', puntaje_maximo: 10 },
  { criterio: 'Atención al cliente / protocolo',    puntaje_maximo: 10 },
  { criterio: 'Trabajo en equipo y colaboración',   puntaje_maximo: 10 },
  { criterio: 'Conocimiento técnico del puesto',    puntaje_maximo: 10 },
  { criterio: 'Iniciativa y proactividad',          puntaje_maximo: 10 },
  { criterio: 'Higiene y manejo de alimentos',      puntaje_maximo: 10 },
  { criterio: 'Cumplimiento de procedimientos',     puntaje_maximo: 10 },
  { criterio: 'Comunicación y actitud',             puntaje_maximo: 10 },
  { criterio: 'Presentación personal / uniforme',   puntaje_maximo: 10 },
];

// ── Estado global ─────────────────────────────────────────────
let evaluaciones    = [];
let catalogos       = {};
let evalDetalleActual = null;  // evaluación abierta en modal detalle
let planContratoId  = null;
let planEvalId      = null;

// ── Inicialización ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCatalogos(), loadEvals()]);
  setTodayDate();
});

function setTodayDate() {
  const hoy = new Date().toISOString().slice(0, 10);
  document.getElementById('fEFecha').value = hoy;
}

// ── Catálogos ─────────────────────────────────────────────────
async function loadCatalogos() {
  try {
    const r = await apiFetch('/api/evaluaciones/catalogos');
    catalogos = r.data;
    populateColaboradores(catalogos.contratos || []);
  } catch (e) { console.error('Error catálogos:', e); }
}

function populateColaboradores(lista) {
  const sel = document.getElementById('fEColaborador');
  if (!lista.length) {
    sel.innerHTML = '<option value="">Sin contratos vigentes</option>';
    return;
  }
  sel.innerHTML = '<option value="">— Seleccionar colaborador —</option>' +
    lista.map(c =>
      `<option value="${c.contrato_id}" data-nombre="${esc(c.nombre_completo)}" data-cargo="${esc(c.cargo_nombre)}">
        ${esc(c.nombre_completo.trim())} — ${esc(c.cargo_nombre)} (${esc(c.sucursal_nombre)})
       </option>`
    ).join('');
}

// ── Cargar evaluaciones ───────────────────────────────────────
async function loadEvals() {
  try {
    const r    = await apiFetch('/api/evaluaciones');
    evaluaciones = r.data || [];
    renderStats();
    renderTabla(evaluaciones);
    buildPeriodosFilter();
  } catch (e) {
    document.getElementById('tablaBody').innerHTML =
      `<tr><td colspan="9" style="text-align:center;color:var(--danger)">Error al cargar evaluaciones</td></tr>`;
  }
}

function buildPeriodosFilter() {
  const periodos  = [...new Set(evaluaciones.map(e => e.periodo))].sort().reverse();
  const sel = document.getElementById('filtroPeriodo');
  sel.innerHTML = '<option value="">Todos los períodos</option>' +
    periodos.map(p => `<option value="${p}">${p}</option>`).join('');
}

// ── Stats ─────────────────────────────────────────────────────
function renderStats() {
  const total      = evaluaciones.length;
  const aprobadas  = evaluaciones.filter(e => e.estado === 'APROBADA').length;
  const enProceso  = evaluaciones.filter(e => e.estado === 'EN_PROCESO').length;
  const prom       = evaluaciones.filter(e => e.puntaje_total).map(e => e.puntaje_total);
  const promedio   = prom.length ? (prom.reduce((a,b) => a+b, 0) / prom.length).toFixed(1) : '—';
  const excelentes = evaluaciones.filter(e => e.categoria === 'EXCELENTE').length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card blue">
      <div class="stat-icon blue"><i class="fa-solid fa-clipboard-list"></i></div>
      <div class="stat-body"><div class="stat-value">${total}</div><div class="stat-label">Total evaluaciones</div></div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div>
      <div class="stat-body"><div class="stat-value">${aprobadas}</div><div class="stat-label">Aprobadas</div></div>
    </div>
    <div class="stat-card orange">
      <div class="stat-icon orange"><i class="fa-solid fa-spinner"></i></div>
      <div class="stat-body"><div class="stat-value">${enProceso}</div><div class="stat-label">En proceso</div></div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon gold"><i class="fa-solid fa-chart-line"></i></div>
      <div class="stat-body"><div class="stat-value">${promedio}</div><div class="stat-label">Puntaje promedio</div></div>
    </div>
    <div class="stat-card blue">
      <div class="stat-icon blue"><i class="fa-solid fa-trophy"></i></div>
      <div class="stat-body"><div class="stat-value">${excelentes}</div><div class="stat-label">Excelentes</div></div>
    </div>`;
}

// ── Tabla ─────────────────────────────────────────────────────
function renderTabla(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:50px">
      <i class="fa-solid fa-star-half-stroke" style="font-size:2rem;opacity:.2;display:block;margin-bottom:12px"></i>
      No hay evaluaciones registradas. ¡Crea la primera!
    </td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(e => `
    <tr>
      <td>
        <div style="font-weight:600;font-size:.85rem">${esc(e.evaluado_nombre.trim())}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${esc(e.evaluador_nombre)}</div>
      </td>
      <td>
        <div style="font-size:.83rem">${esc(e.cargo_nombre)}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${esc(e.sucursal_nombre)}</div>
      </td>
      <td><span style="font-size:.83rem;font-weight:600">${esc(e.periodo)}</span></td>
      <td>
        ${e.puntaje_total !== null && e.puntaje_total !== undefined
          ? `<div style="text-align:center">
               ${scoreRing(e.puntaje_total)}
             </div>`
          : '<span style="color:var(--text-muted);font-size:.8rem">—</span>'}
      </td>
      <td>${e.categoria ? categoriaBadge(e.categoria) : '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>
        <span style="background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:3px 10px;font-size:.8rem">
          ${e.total_criterios || 0}
        </span>
      </td>
      <td>
        <span style="background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:3px 10px;font-size:.8rem">
          ${e.total_planes || 0}
        </span>
      </td>
      <td>${estadoBadge(e.estado)}</td>
      <td>
        <div style="display:flex;gap:5px">
          <button class="btn btn-secondary btn-sm" onclick="openDetalle(${e.id})" title="Ver detalle">
            <i class="fa-solid fa-eye"></i>
          </button>
          ${e.estado === 'BORRADOR' ? `
            <button class="btn btn-secondary btn-sm" onclick="cambiarEstado(${e.id},'EN_PROCESO')" title="Iniciar proceso">
              <i class="fa-solid fa-play" style="color:var(--gold)"></i>
            </button>` : ''}
          ${e.estado === 'EN_PROCESO' ? `
            <button class="btn btn-secondary btn-sm" onclick="cambiarEstado(${e.id},'COMPLETADA')" title="Marcar completada">
              <i class="fa-solid fa-check" style="color:var(--success)"></i>
            </button>` : ''}
          ${e.estado === 'COMPLETADA' ? `
            <button class="btn btn-secondary btn-sm" onclick="cambiarEstado(${e.id},'APROBADA')" title="Aprobar">
              <i class="fa-solid fa-circle-check" style="color:var(--accent)"></i>
            </button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterEvals(q) {
  const estado  = document.getElementById('filtroEstado').value;
  const periodo = document.getElementById('filtroPeriodo').value;
  const lower   = q.toLowerCase();
  const fil     = evaluaciones.filter(e =>
    (e.evaluado_nombre.toLowerCase().includes(lower) ||
     e.cargo_nombre.toLowerCase().includes(lower) ||
     e.sucursal_nombre.toLowerCase().includes(lower)) &&
    (estado  === '' || e.estado  === estado) &&
    (periodo === '' || e.periodo === periodo)
  );
  renderTabla(fil);
}

// ── Modal Nueva Evaluación ────────────────────────────────────
function openNuevaEval() {
  document.getElementById('formNuevaEval').reset();
  setTodayDate();
  renderCriteriosDefecto();
  openModal('modalNuevaEval');
}

function renderCriteriosDefecto() {
  const cont = document.getElementById('criteriosList');
  cont.innerHTML = '';
  CRITERIOS_DEFAULT.forEach(c => addCriterio(c.criterio, c.puntaje_maximo));
}

function addCriterio(nombre = '', maxPts = 10) {
  const cont = document.getElementById('criteriosList');
  const id   = 'cr_' + Date.now() + '_' + Math.random().toString(36).slice(2);
  const div  = document.createElement('div');
  div.className = 'criterio-row';
  div.id = id;
  div.innerHTML = `
    <input class="form-control" type="text" placeholder="Nombre del criterio *"
           value="${esc(nombre)}" required style="font-size:.82rem"/>
    <input class="form-control" type="number" min="0" max="10" step="0.5"
           placeholder="Puntaje" value="0" style="font-size:.82rem;text-align:center"
           oninput="calcPuntajePrelim()"/>
    <input class="form-control" type="number" min="1" max="20" step="1"
           placeholder="Máx" value="${maxPts}" style="font-size:.82rem;text-align:center"
           oninput="calcPuntajePrelim()"/>
    <input class="form-control" type="text" placeholder="Comentario (opcional)" style="font-size:.82rem"/>
    <button type="button" class="criterio-del" onclick="document.getElementById('${id}').remove();calcPuntajePrelim()">
      <i class="fa-solid fa-xmark"></i>
    </button>`;
  cont.appendChild(div);
  calcPuntajePrelim();
}

function calcPuntajePrelim() {
  const rows = document.querySelectorAll('.criterio-row');
  if (!rows.length) {
    document.getElementById('puntajeSummary').style.display = 'none';
    return;
  }
  let total = 0, max = 0;
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input[type="number"]');
    total += parseFloat(inputs[0].value) || 0;
    max   += parseFloat(inputs[1].value) || 10;
  });
  const pct = max > 0 ? Math.round((total / max) * 10000) / 100 : 0;
  const cat = categoriaFromPct(pct);
  const [clr] = catColor(cat);

  document.getElementById('puntajeSummary').style.display = '';
  document.getElementById('puntajePrelim').textContent    = pct.toFixed(1);
  document.getElementById('categoriaPrelim').style.color  = clr;
  document.getElementById('categoriaPrelim').textContent  = cat.replace('_',' ');
}

function getCriteriosFromDOM() {
  const rows = document.querySelectorAll('.criterio-row');
  return Array.from(rows).map(row => {
    const inputs = row.querySelectorAll('input');
    return {
      criterio:       inputs[0].value.trim(),
      puntaje:        parseFloat(inputs[1].value) || 0,
      puntaje_maximo: parseFloat(inputs[2].value) || 10,
      comentario:     inputs[3].value.trim() || null
    };
  }).filter(c => c.criterio);
}

async function submitNuevaEval(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitEval');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

  const criterios = getCriteriosFromDOM();
  if (!criterios.length) {
    showToast('Agrega al menos un criterio de evaluación', 'warning');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Evaluación';
    return;
  }

  const payload = {
    evaluado_id:      parseInt(document.getElementById('fEColaborador').value),
    periodo:          document.getElementById('fEPeriodo').value.trim(),
    fecha_evaluacion: document.getElementById('fEFecha').value,
    fortalezas:       document.getElementById('fEFortalezas').value || null,
    areas_mejora:     document.getElementById('fEMejoras').value    || null,
    estado:           'EN_PROCESO',
    criterios
  };

  try {
    const r = await apiFetch('/api/evaluaciones', 'POST', payload);
    showToast('Evaluación creada correctamente ✅', 'success');
    closeModal('modalNuevaEval');
    await loadEvals();
    // Abrir detalle automáticamente
    openDetalle(r.id);
  } catch (err) {
    showToast(err.message || 'Error al guardar', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Evaluación';
  }
}

// ── Modal Detalle ─────────────────────────────────────────────
async function openDetalle(id) {
  openModal('modalDetalle');
  document.getElementById('detalleBody').innerHTML =
    `<div style="text-align:center;padding:60px"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent)"></i></div>`;

  try {
    const r = await apiFetch(`/api/evaluaciones/${id}`);
    const ev = r.data;
    evalDetalleActual = ev;

    document.getElementById('detalleTitulo').textContent   = `Evaluación — ${ev.evaluado_nombre.trim()}`;
    document.getElementById('detalleSubtitulo').textContent = `Período: ${ev.periodo} · ${ev.cargo_nombre} — ${ev.sucursal_nombre}`;

    const pct  = ev.puntaje_total ?? 0;
    const [clr]= catColor(ev.categoria || 'REGULAR');

    document.getElementById('detalleBody').innerHTML = `
      <!-- Cabecera score -->
      <div style="display:flex;gap:24px;align-items:center;margin-bottom:28px;flex-wrap:wrap">
        <div style="text-align:center">
          ${scoreRing(pct, 72, '1.4rem')}
          <div style="margin-top:6px">${ev.categoria ? categoriaBadge(ev.categoria) : ''}</div>
        </div>
        <div style="flex:1">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="color:var(--text-muted);font-size:.82rem;padding:5px 0;width:140px">Evaluado</td>
              <td style="font-size:.83rem;font-weight:600">${esc(ev.evaluado_nombre.trim())}</td>
            </tr>
            <tr>
              <td style="color:var(--text-muted);font-size:.82rem;padding:5px 0">Cargo</td>
              <td style="font-size:.83rem">${esc(ev.cargo_nombre)} · ${esc(ev.sucursal_nombre)}</td>
            </tr>
            <tr>
              <td style="color:var(--text-muted);font-size:.82rem;padding:5px 0">Evaluador</td>
              <td style="font-size:.83rem">${esc(ev.evaluador_nombre)}</td>
            </tr>
            <tr>
              <td style="color:var(--text-muted);font-size:.82rem;padding:5px 0">Período</td>
              <td style="font-size:.83rem;font-weight:600">${esc(ev.periodo)}</td>
            </tr>
            <tr>
              <td style="color:var(--text-muted);font-size:.82rem;padding:5px 0">Estado</td>
              <td>${estadoBadge(ev.estado)}</td>
            </tr>
          </table>
        </div>
        <div style="flex:1;min-width:200px">
          ${ev.fortalezas ? `<div style="background:#00c89611;border:1px solid #00c89633;border-radius:8px;padding:12px;margin-bottom:10px">
            <p style="margin:0 0 4px;font-size:.75rem;color:#00c896;font-weight:700">✅ FORTALEZAS</p>
            <p style="margin:0;font-size:.82rem;color:var(--text-primary)">${esc(ev.fortalezas)}</p>
          </div>` : ''}
          ${ev.areas_mejora ? `<div style="background:#F0A50011;border:1px solid #F0A50033;border-radius:8px;padding:12px">
            <p style="margin:0 0 4px;font-size:.75rem;color:var(--gold);font-weight:700">📈 ÁREAS DE MEJORA</p>
            <p style="margin:0;font-size:.82rem;color:var(--text-primary)">${esc(ev.areas_mejora)}</p>
          </div>` : ''}
        </div>
      </div>

      <!-- Criterios -->
      <h4 style="font-size:.88rem;font-weight:700;color:var(--accent);margin-bottom:12px">
        <i class="fa-solid fa-list-check"></i> Criterios de Evaluación (${ev.criterios.length})
      </h4>
      <table class="detail-criterios-table" style="width:100%;border-collapse:collapse;margin-bottom:28px">
        <thead>
          <tr style="background:var(--bg-surface)">
            <th style="text-align:left;padding:8px 12px;font-size:.78rem;color:var(--text-muted)">CRITERIO</th>
            <th style="text-align:center;padding:8px 12px;font-size:.78rem;color:var(--text-muted)">PUNTAJE</th>
            <th style="text-align:center;padding:8px 12px;font-size:.78rem;color:var(--text-muted)">MÁXIMO</th>
            <th style="padding:8px 12px;font-size:.78rem;color:var(--text-muted)">BARRA</th>
            <th style="text-align:left;padding:8px 12px;font-size:.78rem;color:var(--text-muted)">COMENTARIO</th>
          </tr>
        </thead>
        <tbody>
          ${ev.criterios.map(c => {
            const porcentaje = c.puntaje_maximo > 0 ? (c.puntaje / c.puntaje_maximo) * 100 : 0;
            const barColor   = porcentaje >= 80 ? 'var(--success)' : porcentaje >= 60 ? 'var(--accent)' : porcentaje >= 40 ? 'var(--gold)' : '#ff4d4f';
            return `<tr style="border-bottom:1px solid var(--border)">
              <td style="padding:10px 12px;font-size:.83rem;font-weight:500">${esc(c.criterio)}</td>
              <td style="text-align:center;font-size:.9rem;font-weight:700;color:${barColor}">${c.puntaje}</td>
              <td style="text-align:center;font-size:.82rem;color:var(--text-muted)">${c.puntaje_maximo}</td>
              <td style="padding:10px 12px;min-width:120px">
                <div class="criterio-bar-wrap">
                  <div class="criterio-bar" style="width:${porcentaje}%;background:${barColor}"></div>
                </div>
                <span style="font-size:.7rem;color:var(--text-muted)">${porcentaje.toFixed(0)}%</span>
              </td>
              <td style="font-size:.78rem;color:var(--text-muted);padding:10px 12px">${esc(c.comentario || '—')}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      <!-- Planes de desarrollo -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <h4 style="font-size:.88rem;font-weight:700;color:var(--accent);margin:0">
          <i class="fa-solid fa-rocket"></i> Planes de Desarrollo (${ev.planes.length})
        </h4>
        <button class="btn btn-secondary btn-sm" onclick="openNuevoPlan(${ev.evaluado_id}, ${ev.id})">
          <i class="fa-solid fa-plus"></i> Nuevo plan
        </button>
      </div>
      ${ev.planes.length
        ? ev.planes.map(p => `
          <div class="plan-card ${p.estado}">
            <div class="plan-card-head">
              <div>
                <div class="plan-card-obj">${esc(p.objetivo)}</div>
                ${p.acciones ? `<div class="plan-card-acc">${esc(p.acciones)}</div>` : ''}
              </div>
              ${planEstadoBadge(p.estado)}
            </div>
            <div class="plan-card-meta">
              📅 Inicio: ${fmtDate(p.fecha_inicio)}
              ${p.fecha_meta ? ` · Meta: ${fmtDate(p.fecha_meta)}` : ''}
              ${p.resultado ? ` · Resultado: ${esc(p.resultado)}` : ''}
            </div>
          </div>`).join('')
        : `<div style="text-align:center;color:var(--text-muted);padding:20px;font-size:.83rem">
             <i class="fa-solid fa-rocket" style="opacity:.2;font-size:1.5rem;display:block;margin-bottom:8px"></i>
             Sin planes de desarrollo aún. ¡Crea el primero!
           </div>`}
    `;
  } catch (err) {
    document.getElementById('detalleBody').innerHTML =
      `<p style="color:var(--danger);text-align:center">Error al cargar la evaluación</p>`;
  }
}

// ── Estado ────────────────────────────────────────────────────
async function cambiarEstado(id, estado) {
  try {
    await apiFetch(`/api/evaluaciones/${id}/estado`, 'PATCH', { estado });
    const labels = { EN_PROCESO: 'iniciada', COMPLETADA: 'completada', APROBADA: 'aprobada ✅' };
    showToast(`Evaluación ${labels[estado] || estado}`, 'success');
    await loadEvals();
  } catch (e) { showToast('Error al cambiar estado', 'error'); }
}

// ── Planes de desarrollo ──────────────────────────────────────
function openNuevoPlan(contratoId, evalId) {
  planContratoId = contratoId;
  planEvalId     = evalId;
  document.getElementById('formPlan').reset();
  document.getElementById('fPInicio').value = new Date().toISOString().slice(0,10);
  openModal('modalPlan');
}

async function submitPlan(e) {
  e.preventDefault();
  try {
    await apiFetch(`/api/evaluaciones/${planEvalId}/planes`, 'POST', {
      contrato_id:   planContratoId,
      evaluacion_id: planEvalId,
      objetivo:      document.getElementById('fPObjetivo').value.trim(),
      acciones:      document.getElementById('fPAcciones').value || null,
      fecha_inicio:  document.getElementById('fPInicio').value,
      fecha_meta:    document.getElementById('fPMeta').value || null,
      estado:        'ACTIVO'
    });
    showToast('Plan de desarrollo creado 🚀', 'success');
    closeModal('modalPlan');
    // Refrescar el detalle
    openDetalle(planEvalId);
    await loadEvals();
  } catch (err) { showToast(err.message || 'Error al crear plan', 'error'); }
}

// ── Helpers visuales ──────────────────────────────────────────
function scoreRing(pct, size = 52, fontSize = '1rem') {
  const [color] = catColor(categoriaFromPct(pct));
  return `<div class="score-ring" style="width:${size}px;height:${size}px;
    background:conic-gradient(${color} ${pct * 3.6}deg, #21262d 0deg);
    box-shadow:0 0 0 3px #161b22,0 0 0 5px ${color}33;">
    <span style="background:#161b22;width:${size-14}px;height:${size-14}px;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-size:${fontSize};font-weight:800;color:${color}">${pct.toFixed(0)}</span>
  </div>`;
}

function categoriaBadge(cat) {
  const labels = {
    EXCELENTE: '🏆 Excelente', MUY_BUENO: '⭐ Muy Bueno',
    BUENO: '👍 Bueno', REGULAR: '⚠️ Regular', DEFICIENTE: '❌ Deficiente'
  };
  return `<span class="cat-badge cat-${cat}">${labels[cat] || cat}</span>`;
}

function planEstadoBadge(estado) {
  const map = {
    ACTIVO:    ['#2D7EF8', 'Activo'],
    EN_CURSO:  ['var(--gold)', 'En curso'],
    CUMPLIDO:  ['var(--success)', 'Cumplido ✅'],
    CANCELADO: ['#ff4d4f', 'Cancelado']
  };
  const [c, l] = map[estado] || ['#8b949e', estado];
  return `<span style="background:${c}22;color:${c};border:1px solid ${c}44;
    border-radius:12px;padding:2px 10px;font-size:.72rem;font-weight:600;white-space:nowrap">${l}</span>`;
}

function estadoBadge(estado) {
  const map = {
    BORRADOR:   ['#8b949e', 'fa-circle-dot', 'Borrador'],
    EN_PROCESO: ['var(--gold)', 'fa-spinner', 'En Proceso'],
    COMPLETADA: ['#a78bfa', 'fa-check', 'Completada'],
    APROBADA:   ['var(--success)', 'fa-circle-check', 'Aprobada'],
  };
  const [c, icon, l] = map[estado] || ['#8b949e', 'fa-circle', estado];
  return `<span style="background:${c}22;color:${c};border:1px solid ${c}44;
    border-radius:12px;padding:3px 10px;font-size:.72rem;font-weight:600;display:inline-flex;align-items:center;gap:5px">
    <i class="fa-solid ${icon}" style="font-size:.65rem"></i>${l}</span>`;
}

function categoriaFromPct(pct) {
  if (pct >= 90) return 'EXCELENTE';
  if (pct >= 75) return 'MUY_BUENO';
  if (pct >= 60) return 'BUENO';
  if (pct >= 45) return 'REGULAR';
  return 'DEFICIENTE';
}

function catColor(cat) {
  const m = {
    EXCELENTE: ['#00c896'], MUY_BUENO: ['#2D7EF8'],
    BUENO: ['#a78bfa'], REGULAR: ['#F0A500'], DEFICIENTE: ['#ff4d4f']
  };
  return m[cat] || ['#8b949e'];
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}
