// ============================================================
//  SCGRH — capacitaciones.js
//  Cursos · Sesiones · Asistencia · Evaluaciones
// ============================================================
'use strict';

// ── Estado global ─────────────────────────────────────────────
let sesiones      = [];
let cursos        = [];
let catalogos     = {};
let sesionActual  = null;  // id de sesión abierta en detalle
let editCursoId   = null;
let editSesionId  = null;

// Colores por estado de sesión
const ESTADO_COLOR = {
  PROGRAMADA: '#2D7EF8',
  EN_CURSO:   '#F0A500',
  REALIZADA:  '#00c896',
  CANCELADA:  '#ff4d4f'
};

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCatalogos(), loadSesiones(), loadCursos()]);
});

// ── Catálogos ─────────────────────────────────────────────────
async function loadCatalogos() {
  try {
    const r   = await apiFetch('/api/capacitaciones/catalogos');
    catalogos = r.data;
    populateCursoSelect();
    populateSucursalSelect();
    populateColaboradoresInscribir();
  } catch (e) { console.error('Catálogos:', e); }
}

function populateCursoSelect() {
  const sel  = document.getElementById('fSCurso');
  const opts = (catalogos.cursos || []).map(c =>
    `<option value="${c.id}" data-horas="${c.duracion_horas||0}" data-costo="${c.costo||0}" data-proveedor="${esc(c.proveedor||'—')}" data-modalidad="${c.modalidad}">${esc(c.nombre)}</option>`
  ).join('');
  sel.innerHTML = '<option value="">— Seleccionar curso —</option>' + opts;
}

function populateSucursalSelect() {
  const sel  = document.getElementById('fSSucursal');
  const opts = (catalogos.sucursales || []).map(s =>
    `<option value="${s.id}">${esc(s.nombre)}</option>`
  ).join('');
  sel.innerHTML = '<option value="">— Todas las sedes —</option>' + opts;
}

function populateColaboradoresInscribir() {
  const sel  = document.getElementById('fInscColaborador');
  const opts = (catalogos.contratos || []).map(c =>
    `<option value="${c.contrato_id}">${esc(c.nombre_completo.trim())} — ${esc(c.cargo_nombre)} (${esc(c.sucursal_nombre)})</option>`
  ).join('');
  sel.innerHTML = '<option value="">— Seleccionar colaborador —</option>' + opts;
}

function onCursoChange() {
  const sel    = document.getElementById('fSCurso');
  const opt    = sel.options[sel.selectedIndex];
  const panel  = document.getElementById('cursoInfoPanel');
  if (!opt || !opt.value) { panel.style.display = 'none'; return; }
  document.getElementById('infoCursoHoras').textContent     = opt.dataset.horas || '—';
  document.getElementById('infoCursoCosto').textContent     = opt.dataset.costo || '—';
  document.getElementById('infoCursoProveedor').textContent = opt.dataset.proveedor || '—';
  document.getElementById('infoCursoModalidad').textContent = opt.dataset.modalidad || '—';
  panel.style.display = '';
}

// ── Sesiones ──────────────────────────────────────────────────
async function loadSesiones() {
  try {
    const r = await apiFetch('/api/capacitaciones');
    sesiones = r.data || [];
    renderStats();
    renderSesionesGrid(sesiones);
  } catch (e) {
    document.getElementById('sesionesGrid').innerHTML =
      `<p style="color:var(--danger)">Error al cargar sesiones</p>`;
  }
}

function renderStats() {
  const total       = sesiones.length;
  const programadas = sesiones.filter(s => s.estado === 'PROGRAMADA').length;
  const realizadas  = sesiones.filter(s => s.estado === 'REALIZADA').length;
  const inscritos   = sesiones.reduce((a, s) => a + (s.total_inscritos || 0), 0);
  const horas       = sesiones.reduce((a, s) => a + (s.duracion_horas || 0), 0);

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card blue">
      <div class="stat-icon blue"><i class="fa-solid fa-graduation-cap"></i></div>
      <div class="stat-body"><div class="stat-value">${total}</div><div class="stat-label">Sesiones totales</div></div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon gold"><i class="fa-solid fa-calendar-days"></i></div>
      <div class="stat-body"><div class="stat-value">${programadas}</div><div class="stat-label">Programadas</div></div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon green"><i class="fa-solid fa-circle-check"></i></div>
      <div class="stat-body"><div class="stat-value">${realizadas}</div><div class="stat-label">Realizadas</div></div>
    </div>
    <div class="stat-card blue">
      <div class="stat-icon blue"><i class="fa-solid fa-users"></i></div>
      <div class="stat-body"><div class="stat-value">${inscritos}</div><div class="stat-label">Inscritos totales</div></div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon gold"><i class="fa-solid fa-clock"></i></div>
      <div class="stat-body"><div class="stat-value">${horas.toFixed(0)}h</div><div class="stat-label">Horas de formación</div></div>
    </div>`;
}

function renderSesionesGrid(data) {
  const grid = document.getElementById('sesionesGrid');
  if (!data.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-muted)">
        <i class="fa-solid fa-graduation-cap" style="font-size:2.5rem;opacity:.15;display:block;margin-bottom:16px"></i>
        <p>No hay sesiones de capacitación. ¡Programa la primera!</p>
      </div>`;
    return;
  }
  grid.innerHTML = data.map(s => {
    const color     = ESTADO_COLOR[s.estado] || '#2D7EF8';
    const pct       = s.capacidad_max > 0 ? Math.min(100, (s.total_inscritos / s.capacidad_max) * 100) : 0;
    const fechaIni  = new Date(s.fecha_inicio);
    const aprobados = s.total_asistieron || 0;

    return `
    <div class="cap-card" style="--cap-color:${color}">
      <div class="cap-card-head">
        <div style="flex:1;min-width:0">
          <div class="cap-card-curso">${esc(s.curso_nombre)} · ${esc(s.curso_modalidad)}</div>
          <div class="cap-card-sesion">${esc(s.nombre_sesion || s.curso_nombre)}</div>
        </div>
        <span class="ses-badge ${s.estado}">
          ${s.estado === 'PROGRAMADA' ? '📅' : s.estado === 'EN_CURSO' ? '▶️' : s.estado === 'REALIZADA' ? '✅' : '❌'}
          ${s.estado.replace('_', ' ')}
        </span>
      </div>

      <div class="cap-card-meta">
        <span><i class="fa-solid fa-calendar"></i> ${fmtDateTime(s.fecha_inicio)}</span>
        ${s.lugar ? `<span><i class="fa-solid fa-location-dot"></i> ${esc(s.lugar)}</span>` : ''}
        ${s.instructor ? `<span><i class="fa-solid fa-chalkboard-user"></i> ${esc(s.instructor)}</span>` : ''}
        ${s.sucursal_nombre ? `<span><i class="fa-solid fa-store"></i> ${esc(s.sucursal_nombre)}</span>` : ''}
        ${s.duracion_horas ? `<span><i class="fa-solid fa-clock"></i> ${s.duracion_horas}h</span>` : ''}
      </div>

      ${s.capacidad_max ? `
      <div class="cap-card-progress">
        <div class="cap-card-progress-bar">
          <div class="cap-card-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="cap-card-progress-label">${s.total_inscritos}/${s.capacidad_max} participantes (${pct.toFixed(0)}%)</div>
      </div>` : `
      <div class="cap-card-progress">
        <div class="cap-card-progress-label" style="color:${color}">
          <i class="fa-solid fa-users"></i> ${s.total_inscritos} inscritos · ${aprobados} asistieron
        </div>
      </div>`}

      <div class="cap-card-actions">
        <button class="btn btn-secondary btn-sm" onclick="openDetalleSesion(${s.id})" style="flex:1">
          <i class="fa-solid fa-eye"></i> Ver detalle
        </button>
        ${s.estado === 'PROGRAMADA' ? `
        <button class="btn btn-secondary btn-sm" onclick="cambiarEstadoSesion(${s.id},'EN_CURSO')" title="Iniciar">
          <i class="fa-solid fa-play" style="color:var(--gold)"></i>
        </button>` : ''}
        ${s.estado === 'EN_CURSO' ? `
        <button class="btn btn-secondary btn-sm" onclick="cambiarEstadoSesion(${s.id},'REALIZADA')" title="Finalizar">
          <i class="fa-solid fa-flag-checkered" style="color:var(--success)"></i>
        </button>` : ''}
        <button class="btn btn-secondary btn-sm" onclick="openEditSesion(${s.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
      </div>
    </div>`;
  }).join('');
}

function filterSesiones(q) {
  const estado = document.getElementById('filtroEstadoSesion').value;
  const lower  = q.toLowerCase();
  const fil    = sesiones.filter(s =>
    ((s.curso_nombre || '').toLowerCase().includes(lower) ||
     (s.nombre_sesion || '').toLowerCase().includes(lower) ||
     (s.instructor || '').toLowerCase().includes(lower)) &&
    (estado === '' || s.estado === estado)
  );
  renderSesionesGrid(fil);
}

// ── Modal Sesión ──────────────────────────────────────────────
function openNuevaSesion() {
  editSesionId = null;
  document.getElementById('tituloModalSes').textContent = 'Programar Sesión de Capacitación';
  document.getElementById('subModalSes').textContent    = 'Configura los detalles de la nueva sesión';
  document.getElementById('formSesion').reset();
  document.getElementById('cursoInfoPanel').style.display = 'none';
  openModal('modalSesion');
}

async function openEditSesion(id) {
  editSesionId = id;
  const ses = sesiones.find(s => s.id === id);
  if (!ses) return;
  document.getElementById('tituloModalSes').textContent = 'Editar Sesión';
  document.getElementById('subModalSes').textContent    = ses.curso_nombre;
  document.getElementById('fSCurso').value      = ses.curso_id;
  document.getElementById('fSNombre').value     = ses.nombre_sesion || '';
  document.getElementById('fSFechaInicio').value= toDateTimeLocal(ses.fecha_inicio);
  document.getElementById('fSFechaFin').value   = ses.fecha_fin ? toDateTimeLocal(ses.fecha_fin) : '';
  document.getElementById('fSSucursal').value   = ses.sucursal_id || '';
  document.getElementById('fSCapacidad').value  = ses.capacidad_max || '';
  document.getElementById('fSInstructor').value = ses.instructor || '';
  document.getElementById('fSLugar').value      = ses.lugar || '';
  document.getElementById('fSEstado').value     = ses.estado;
  onCursoChange();
  openModal('modalSesion');
}

async function submitSesion(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitSes');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

  const payload = {
    curso_id:     parseInt(document.getElementById('fSCurso').value),
    nombre_sesion:document.getElementById('fSNombre').value     || null,
    fecha_inicio: document.getElementById('fSFechaInicio').value,
    fecha_fin:    document.getElementById('fSFechaFin').value   || null,
    sucursal_id:  document.getElementById('fSSucursal').value   || null,
    capacidad_max:document.getElementById('fSCapacidad').value  || null,
    instructor:   document.getElementById('fSInstructor').value || null,
    lugar:        document.getElementById('fSLugar').value      || null,
    estado:       document.getElementById('fSEstado').value
  };

  try {
    if (editSesionId) {
      await apiFetch(`/api/capacitaciones/${editSesionId}`, 'PUT', payload);
      showToast('Sesión actualizada ✅', 'success');
    } else {
      await apiFetch('/api/capacitaciones', 'POST', payload);
      showToast('Sesión programada ✅', 'success');
    }
    closeModal('modalSesion');
    await loadSesiones();
  } catch (err) {
    showToast(err.message || 'Error al guardar', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Sesión';
  }
}

async function cambiarEstadoSesion(id, estado) {
  try {
    await apiFetch(`/api/capacitaciones/${id}/estado`, 'PATCH', { estado });
    const labels = { EN_CURSO: 'iniciada ▶️', REALIZADA: 'finalizada ✅', CANCELADA: 'cancelada ❌' };
    showToast(`Sesión ${labels[estado] || estado}`, 'success');
    await loadSesiones();
  } catch (e) { showToast('Error al cambiar estado', 'error'); }
}

// ── Modal Detalle sesión ──────────────────────────────────────
async function openDetalleSesion(id) {
  sesionActual = id;
  openModal('modalDetalleSes');
  await refreshDetalleSesion();
}

async function refreshDetalleSesion() {
  document.getElementById('detSesBody').innerHTML =
    `<div style="text-align:center;padding:60px"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--accent)"></i></div>`;
  try {
    const r   = await apiFetch(`/api/capacitaciones/${sesionActual}`);
    const ses = r.data;

    document.getElementById('detSesTotitulo').textContent  = ses.nombre_sesion || ses.curso_nombre;
    document.getElementById('detSesSubtitulo').textContent =
      `${ses.curso_modalidad} · ${ses.duracion_horas ? ses.duracion_horas + 'h' : ''} · ${fmtDateTime(ses.fecha_inicio)}`;

    const color = ESTADO_COLOR[ses.estado] || '#2D7EF8';
    const asistentes = ses.asistentes || [];
    const aprobados  = asistentes.filter(a => a.aprobado).length;

    document.getElementById('detSesBody').innerHTML = `
      <!-- Cabecera info -->
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px">
        ${infoChip('fa-chalkboard-user', ses.instructor || '—', color)}
        ${infoChip('fa-location-dot', ses.lugar || '—', color)}
        ${infoChip('fa-store', ses.sucursal_nombre || 'Todas las sedes', color)}
        ${infoChip('fa-users', asistentes.length + ' inscritos', color)}
        ${ses.capacidad_max ? infoChip('fa-user-check', ses.capacidad_max + ' cupo máx.', color) : ''}
        ${infoChip('fa-trophy', aprobados + ' aprobaron', '#00c896')}
        <span class="ses-badge ${ses.estado}" style="align-self:center">${ses.estado.replace('_',' ')}</span>
      </div>

      <!-- Botón inscribir -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <h4 style="font-size:.88rem;font-weight:700;color:#a78bfa;margin:0">
          <i class="fa-solid fa-users"></i> Participantes (${asistentes.length})
        </h4>
        <div style="display:flex;gap:8px">
          ${ses.estado !== 'CANCELADA' && ses.estado !== 'REALIZADA' ? `
          <button class="btn btn-secondary btn-sm" onclick="openInscribir(${ses.id})">
            <i class="fa-solid fa-user-plus"></i> Inscribir
          </button>` : ''}
          ${asistentes.length && ses.estado !== 'PROGRAMADA' ? `
          <button class="btn btn-primary btn-sm" id="btnGuardarAsist" onclick="guardarAsistencia()">
            <i class="fa-solid fa-floppy-disk"></i> Guardar asistencia
          </button>` : ''}
        </div>
      </div>

      ${asistentes.length
        ? `<table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:var(--bg-surface)">
                <th style="padding:9px 12px;font-size:.78rem;color:var(--text-muted);text-align:left">COLABORADOR</th>
                <th style="padding:9px 12px;font-size:.78rem;color:var(--text-muted)">ASISTIÓ</th>
                <th style="padding:9px 12px;font-size:.78rem;color:var(--text-muted)">PUNTAJE</th>
                <th style="padding:9px 12px;font-size:.78rem;color:var(--text-muted)">RESULTADO</th>
                <th style="padding:9px 12px;font-size:.78rem;color:var(--text-muted)">ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              ${asistentes.map(a => `
              <tr class="asistencia-row" id="row-asist-${a.asistencia_id}">
                <td>
                  <div style="font-weight:600;font-size:.84rem">${esc(a.nombre_completo.trim())}</div>
                  <div style="font-size:.72rem;color:var(--text-muted)">${esc(a.cargo_nombre)} · ${esc(a.sucursal_nombre)}</div>
                </td>
                <td style="text-align:center">
                  <span id="toggle-${a.asistencia_id}"
                    class="toggle-asistio ${a.asistio ? 'si' : (a.asistio === false ? 'no' : '')}"
                    onclick="toggleAsistio(${a.asistencia_id})"
                    data-val="${a.asistio ? '1' : '0'}">
                    ${a.asistio ? '✅ Sí' : '❌ No'}
                  </span>
                </td>
                <td style="text-align:center">
                  <input type="number" min="0" max="100" step="0.5"
                    class="form-control puntaje-input" id="puntaje-${a.asistencia_id}"
                    value="${a.puntaje ?? ''}" placeholder="0–100"/>
                </td>
                <td style="text-align:center">
                  ${a.aprobado === null ? '<span style="color:var(--text-muted);font-size:.78rem">—</span>'
                   : a.aprobado
                     ? '<span style="color:var(--success);font-weight:700;font-size:.78rem">✅ Aprobado</span>'
                     : '<span style="color:#ff4d4f;font-weight:700;font-size:.78rem">❌ No aprobado</span>'}
                </td>
                <td style="text-align:center">
                  <button class="btn btn-secondary btn-sm" onclick="evaluarAsistente(${a.asistencia_id})" title="Guardar evaluación">
                    <i class="fa-solid fa-floppy-disk" style="color:var(--accent)"></i>
                  </button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>`
        : `<div style="text-align:center;padding:30px;color:var(--text-muted)">
             <i class="fa-solid fa-user-plus" style="font-size:1.8rem;opacity:.2;display:block;margin-bottom:10px"></i>
             Ningún participante inscrito todavía
           </div>`}
    `;
  } catch (err) {
    document.getElementById('detSesBody').innerHTML =
      `<p style="color:var(--danger);text-align:center">Error al cargar la sesión</p>`;
  }
}

function toggleAsistio(asistenciaId) {
  const el  = document.getElementById(`toggle-${asistenciaId}`);
  const val = el.dataset.val === '1' ? '0' : '1';
  el.dataset.val = val;
  el.className   = `toggle-asistio ${val === '1' ? 'si' : 'no'}`;
  el.textContent = val === '1' ? '✅ Sí' : '❌ No';
}

async function guardarAsistencia() {
  const rows = document.querySelectorAll('[id^="toggle-"]');
  const registros = Array.from(rows).map(el => ({
    asistencia_id: parseInt(el.id.replace('toggle-', '')),
    asistio:       el.dataset.val === '1'
  }));
  try {
    await apiFetch(`/api/capacitaciones/${sesionActual}/asistencia`, 'PUT', { registros });
    showToast('Asistencia guardada ✅', 'success');
    await refreshDetalleSesion();
  } catch (err) { showToast('Error al guardar asistencia', 'error'); }
}

async function evaluarAsistente(asistenciaId) {
  const puntaje = parseFloat(document.getElementById(`puntaje-${asistenciaId}`).value);
  if (isNaN(puntaje)) return showToast('Ingresa un puntaje válido', 'warning');
  try {
    const r = await apiFetch(`/api/capacitaciones/asistencia/${asistenciaId}/evaluar`, 'PUT', {
      puntaje,
      puntaje_maximo: 100,
      fecha_evaluacion: new Date().toISOString().slice(0, 10)
    });
    showToast(r.aprobado ? '✅ Aprobado registrado' : '❌ No aprobado registrado', r.aprobado ? 'success' : 'warning');
    await refreshDetalleSesion();
  } catch (err) { showToast('Error al evaluar', 'error'); }
}

// ── Inscribir ─────────────────────────────────────────────────
function openInscribir(sesionId) {
  sesionActual = sesionId;
  document.getElementById('subInscribir').textContent = `Sesión #${sesionId}`;
  document.getElementById('formInscribir').reset();
  openModal('modalInscribir');
}

async function submitInscribir(e) {
  e.preventDefault();
  const contratoId = document.getElementById('fInscColaborador').value;
  if (!contratoId) return showToast('Selecciona un colaborador', 'warning');
  try {
    await apiFetch(`/api/capacitaciones/${sesionActual}/inscribir`, 'POST', {
      contrato_id: parseInt(contratoId)
    });
    showToast('Participante inscrito ✅', 'success');
    closeModal('modalInscribir');
    await refreshDetalleSesion();
    await loadSesiones();
  } catch (err) { showToast(err.message || 'Error al inscribir', 'error'); }
}

// ── Cursos ────────────────────────────────────────────────────
async function loadCursos() {
  try {
    const r = await apiFetch('/api/capacitaciones/cursos');
    cursos  = r.data || [];
    renderTablaCursos(cursos);
  } catch (e) {
    document.getElementById('tablaCursos').innerHTML =
      `<tr><td colspan="7" style="color:var(--danger);text-align:center">Error</td></tr>`;
  }
}

function renderTablaCursos(data) {
  const tbody = document.getElementById('tablaCursos');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:40px">
      <i class="fa-solid fa-book-open" style="font-size:1.5rem;opacity:.2;display:block;margin-bottom:8px"></i>
      Sin cursos registrados
    </td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(c => `
    <tr>
      <td>
        <div style="font-weight:600;font-size:.85rem">${esc(c.nombre)}</div>
        ${c.descripcion ? `<div style="font-size:.72rem;color:var(--text-muted)">${esc(c.descripcion.slice(0,60))}...</div>` : ''}
      </td>
      <td>${modalidadBadge(c.modalidad)}</td>
      <td><span style="font-size:.83rem">${c.duracion_horas ? c.duracion_horas + 'h' : '—'}</span></td>
      <td><span style="font-size:.83rem">${c.costo ? 'S/ ' + Number(c.costo).toLocaleString('es-PE') : '—'}</span></td>
      <td><span style="font-size:.82rem;color:var(--text-muted)">${esc(c.proveedor || '—')}</span></td>
      <td>
        <span style="background:${c.activo ? 'rgba(0,200,150,.15)' : 'rgba(255,77,79,.15)'};color:${c.activo ? 'var(--success)' : '#ff4d4f'};border-radius:12px;padding:2px 10px;font-size:.72rem;font-weight:700">
          ${c.activo ? 'Activo' : 'Inactivo'}
        </span>
      </td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openEditCurso(${c.id})" title="Editar">
          <i class="fa-solid fa-pen"></i>
        </button>
      </td>
    </tr>`).join('');
}

// ── Modal Curso ───────────────────────────────────────────────
function openNuevoCurso() {
  editCursoId = null;
  document.getElementById('tituloModalCurso').textContent = 'Nuevo Curso';
  document.getElementById('formCurso').reset();
  openModal('modalCurso');
}

function openEditCurso(id) {
  editCursoId = id;
  const c = cursos.find(x => x.id === id);
  if (!c) return;
  document.getElementById('tituloModalCurso').textContent = 'Editar Curso';
  document.getElementById('fCNombre').value    = c.nombre;
  document.getElementById('fCDesc').value      = c.descripcion || '';
  document.getElementById('fCModalidad').value = c.modalidad;
  document.getElementById('fCHoras').value     = c.duracion_horas || '';
  document.getElementById('fCCosto').value     = c.costo || '';
  document.getElementById('fCProveedor').value = c.proveedor || '';
  openModal('modalCurso');
}

async function submitCurso(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitCurso');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  const payload = {
    nombre:         document.getElementById('fCNombre').value.trim(),
    descripcion:    document.getElementById('fCDesc').value     || null,
    modalidad:      document.getElementById('fCModalidad').value,
    duracion_horas: document.getElementById('fCHoras').value    || null,
    costo:          document.getElementById('fCCosto').value     || null,
    proveedor:      document.getElementById('fCProveedor').value || null,
    activo:         true
  };

  try {
    if (editCursoId) {
      await apiFetch(`/api/capacitaciones/cursos/${editCursoId}`, 'PUT', payload);
      showToast('Curso actualizado ✅', 'success');
    } else {
      await apiFetch('/api/capacitaciones/cursos', 'POST', payload);
      showToast('Curso creado ✅', 'success');
    }
    closeModal('modalCurso');
    await Promise.all([loadCursos(), loadCatalogos()]);
  } catch (err) { showToast(err.message || 'Error', 'error'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Curso';
  }
}

// ── Tabs ──────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('view-sesiones').style.display = tab === 'sesiones' ? '' : 'none';
  document.getElementById('view-cursos').style.display   = tab === 'cursos'   ? '' : 'none';
  document.getElementById('tab-sesiones').classList.toggle('active', tab === 'sesiones');
  document.getElementById('tab-cursos').classList.toggle('active',   tab === 'cursos');
}

// ── Helpers ───────────────────────────────────────────────────
function infoChip(icon, text, color) {
  return `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-surface);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:.78rem;color:var(--text-muted)">
    <i class="fa-solid ${icon}" style="color:${color}"></i>${esc(text)}</span>`;
}

function modalidadBadge(m) {
  const map = {
    PRESENCIAL: ['#2D7EF8', '🏢'], VIRTUAL: ['#a78bfa', '💻'], MIXTO: ['#F0A500', '🔄']
  };
  const [c, e] = map[m] || ['#8b949e', ''];
  return `<span style="background:${c}22;color:${c};border:1px solid ${c}44;border-radius:12px;padding:2px 10px;font-size:.72rem;font-weight:700">${e} ${m}</span>`;
}

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es-PE', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function toDateTimeLocal(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toISOString().slice(0, 16);
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
