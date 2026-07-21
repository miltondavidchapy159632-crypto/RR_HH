// ============================================================
//  SCGRH — reclutamiento.js
//  Módulo de Reclutamiento y Selección
// ============================================================
'use strict';

// ── Estado global ─────────────────────────────────────────────
let vacantes       = [];
let catalogos      = {};
let personas       = [];
let vacanteActual  = null;   // vacante abierta en el panel de postulantes
let postActual     = null;   // postulación seleccionada para entrevista/oferta
let editMode       = false;
let editId         = null;

// ── Inicialización ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCatalogos(), loadVacantes(), loadPersonas()]);
  renderStats();
});

// ── Catálogos ─────────────────────────────────────────────────
async function loadCatalogos() {
  try {
    const r = await apiFetch('/api/vacantes/catalogos');
    catalogos = r.data;
    populateSelect('fVPuesto',   catalogos.puestos,        'id', 'descripcion', '— Seleccionar puesto —');
    populateSelect('fVSucursal', catalogos.sucursales,     'id', 'nombre',      '— Seleccionar sede —');
    populateSelect('fVTipoContrato', catalogos.tipos_contrato, 'id', 'descripcion', '—');
    populateSelect('fOfSucursal', catalogos.sucursales, 'id', 'nombre', '—');
    populateSelect('fOfTipoContrato', catalogos.tipos_contrato, 'id', 'descripcion', '—');
  } catch (e) { console.error('Error cargando catálogos:', e); }
}

async function loadPersonas() {
  try {
    const r = await apiFetch('/api/personas');
    personas = r.data || [];
    const opts = personas.map(p =>
      `<option value="${p.id}">${p.apellido_paterno} ${p.apellido_materno || ''}, ${p.nombres} (${p.tipo_doc_codigo} ${p.nro_documento})</option>`
    ).join('');
    document.getElementById('fPostPersona').innerHTML = '<option value="">— Seleccionar candidato —</option>' + opts;
  } catch (e) { console.error('Error cargando personas:', e); }
}

// ── Cargar vacantes ───────────────────────────────────────────
async function loadVacantes() {
  try {
    const r = await apiFetch('/api/vacantes');
    vacantes = r.data || [];
    renderTablaVacantes(vacantes);
    populatePipelineSelector();
  } catch (e) {
    document.getElementById('tablaVacantes').innerHTML =
      `<tr><td colspan="8" style="text-align:center;color:var(--danger)"><i class="fa-solid fa-triangle-exclamation"></i> Error al cargar vacantes</td></tr>`;
  }
}

function renderTablaVacantes(data) {
  const tbody = document.getElementById('tablaVacantes');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">
      <i class="fa-solid fa-briefcase" style="font-size:1.5rem;opacity:.3;display:block;margin-bottom:10px"></i>
      No hay vacantes registradas. ¡Crea la primera!</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(v => `
    <tr>
      <td>
        <div style="font-weight:600;font-size:.85rem">${esc(v.titulo)}</div>
        <div style="font-size:.72rem;color:var(--text-muted);margin-top:2px">
          ${v.cantidad_requerida} plaza(s) · ${v.total_postulantes || 0} postulante(s)
        </div>
      </td>
      <td>
        <div style="font-size:.82rem">${esc(v.cargo_nombre)}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${esc(v.area_nombre)}</div>
      </td>
      <td><span style="font-size:.82rem">${esc(v.sucursal_nombre)}</span></td>
      <td><span style="font-size:.82rem">${v.salario_ofrecido ? 'S/ ' + Number(v.salario_ofrecido).toLocaleString('es-PE') : '—'}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openPostulantes(${v.id}, '${esc(v.titulo)}')">
          <i class="fa-solid fa-users"></i> ${v.total_postulantes || 0}
        </button>
      </td>
      <td><span style="font-size:.8rem;color:var(--text-muted)">${v.fecha_cierre ? fmtDate(v.fecha_cierre) : '—'}</span></td>
      <td>${estadoBadge(v.estado)}</td>
      <td>
        <div style="display:flex;gap:5px">
          <button class="btn btn-secondary btn-sm" onclick="openEditVacante(${v.id})" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-secondary btn-sm" onclick="openPostulantes(${v.id}, '${esc(v.titulo)}')" title="Ver candidatos">
            <i class="fa-solid fa-people-group"></i>
          </button>
          ${v.estado === 'BORRADOR' ? `<button class="btn btn-primary btn-sm" onclick="publicarVacante(${v.id})" title="Publicar">
            <i class="fa-solid fa-globe"></i>
          </button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function filterVacantes(q) {
  const estado = document.getElementById('filtroEstado').value;
  const lower  = q.toLowerCase();
  const fil    = vacantes.filter(v =>
    (v.titulo.toLowerCase().includes(lower) ||
     v.cargo_nombre.toLowerCase().includes(lower) ||
     v.sucursal_nombre.toLowerCase().includes(lower)) &&
    (estado === '' || v.estado === estado)
  );
  renderTablaVacantes(fil);
}

// ── Stats ─────────────────────────────────────────────────────
function renderStats() {
  const total       = vacantes.length;
  const publicadas  = vacantes.filter(v => v.estado === 'PUBLICADA').length;
  const enProceso   = vacantes.filter(v => v.estado === 'EN_PROCESO').length;
  const postulantes = vacantes.reduce((s, v) => s + (v.total_postulantes || 0), 0);

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card blue">
      <div class="stat-icon blue"><i class="fa-solid fa-briefcase"></i></div>
      <div class="stat-body">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total Vacantes</div>
      </div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon gold"><i class="fa-solid fa-globe"></i></div>
      <div class="stat-body">
        <div class="stat-value">${publicadas}</div>
        <div class="stat-label">Publicadas</div>
      </div>
    </div>
    <div class="stat-card orange">
      <div class="stat-icon orange"><i class="fa-solid fa-spinner"></i></div>
      <div class="stat-body">
        <div class="stat-value">${enProceso}</div>
        <div class="stat-label">En Proceso</div>
      </div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon green"><i class="fa-solid fa-people-group"></i></div>
      <div class="stat-body">
        <div class="stat-value">${postulantes}</div>
        <div class="stat-label">Postulantes Totales</div>
      </div>
    </div>`;
}

// ── Modal Vacante ─────────────────────────────────────────────
function openNuevaVacante() {
  editMode = false; editId = null;
  document.getElementById('tituloModalVac').textContent   = 'Nueva Vacante';
  document.getElementById('subTituloModalVac').textContent = 'Completa los datos de la posición a cubrir';
  document.getElementById('formVacante').reset();
  document.getElementById('fVEstado').value = 'BORRADOR';
  openModal('modalVacante');
}

async function openEditVacante(id) {
  editMode = true; editId = id;
  try {
    const r = await apiFetch(`/api/vacantes/${id}`);
    const v = r.data;
    document.getElementById('tituloModalVac').textContent    = 'Editar Vacante';
    document.getElementById('subTituloModalVac').textContent  = v.titulo;
    document.getElementById('fVTitulo').value        = v.titulo;
    document.getElementById('fVPuesto').value        = v.puesto_id;
    document.getElementById('fVSucursal').value      = v.sucursal_id;
    document.getElementById('fVTipoContrato').value  = v.tipo_contrato_id || '';
    document.getElementById('fVSalario').value       = v.salario_ofrecido || '';
    document.getElementById('fVCantidad').value      = v.cantidad_requerida;
    document.getElementById('fVEstado').value        = v.estado;
    document.getElementById('fVFechaPub').value      = v.fecha_publicacion ? v.fecha_publicacion.slice(0,10) : '';
    document.getElementById('fVFechaCierre').value   = v.fecha_cierre ? v.fecha_cierre.slice(0,10) : '';
    document.getElementById('fVDesc').value          = v.descripcion || '';
    document.getElementById('fVReq').value           = v.requisitos  || '';
    openModal('modalVacante');
  } catch (e) { showToast('Error al cargar la vacante', 'error'); }
}

async function submitVacante(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitVac');
  btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

  const payload = {
    titulo:             document.getElementById('fVTitulo').value.trim(),
    puesto_id:          parseInt(document.getElementById('fVPuesto').value),
    sucursal_id:        parseInt(document.getElementById('fVSucursal').value),
    tipo_contrato_id:   document.getElementById('fVTipoContrato').value || null,
    salario_ofrecido:   document.getElementById('fVSalario').value || null,
    cantidad_requerida: parseInt(document.getElementById('fVCantidad').value) || 1,
    estado:             document.getElementById('fVEstado').value,
    fecha_publicacion:  document.getElementById('fVFechaPub').value   || null,
    fecha_cierre:       document.getElementById('fVFechaCierre').value || null,
    descripcion:        document.getElementById('fVDesc').value || null,
    requisitos:         document.getElementById('fVReq').value  || null
  };

  try {
    if (editMode) {
      await apiFetch(`/api/vacantes/${editId}`, 'PUT', payload);
      showToast('Vacante actualizada correctamente', 'success');
    } else {
      await apiFetch('/api/vacantes', 'POST', payload);
      showToast('Vacante creada correctamente', 'success');
    }
    closeModal('modalVacante');
    await loadVacantes();
    renderStats();
  } catch (err) {
    showToast(err.message || 'Error al guardar', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Vacante';
  }
}

async function publicarVacante(id) {
  try {
    await apiFetch(`/api/vacantes/${id}/estado`, 'PATCH', { estado: 'PUBLICADA' });
    showToast('Vacante publicada ✅', 'success');
    await loadVacantes();
    renderStats();
  } catch (e) { showToast('Error al publicar', 'error'); }
}

// ── Postulantes ───────────────────────────────────────────────
async function openPostulantes(vacanteId, titulo) {
  vacanteActual = vacanteId;
  document.getElementById('tituloPostulantes').textContent = `Postulantes — ${titulo}`;
  document.getElementById('subPostulantes').textContent    = 'Candidatos registrados para esta vacante';
  openModal('modalPostulantes');
  await refreshPostulantes();
}

async function refreshPostulantes() {
  const tbody = document.getElementById('tablaPostulantes');
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center"><i class="fa-solid fa-spinner fa-spin"></i></td></tr>`;
  try {
    const r = await apiFetch(`/api/vacantes/${vacanteActual}/postulaciones`);
    const lista = r.data || [];
    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:30px">
        <i class="fa-solid fa-inbox" style="font-size:1.4rem;opacity:.3;display:block;margin-bottom:8px"></i>
        Sin postulantes aún</td></tr>`;
      return;
    }
    tbody.innerHTML = lista.map(p => `
      <tr>
        <td>
          <div style="font-weight:600;font-size:.85rem">${esc(p.nombre_completo.trim())}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">${p.fuente || '—'}</div>
        </td>
        <td><span style="font-size:.82rem">${esc(p.tipo_doc)} ${esc(p.nro_documento)}</span></td>
        <td>
          <div style="font-size:.78rem">${p.email_personal || p.email_corporativo || '—'}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">${p.telefono_celular || ''}</div>
        </td>
        <td><span style="font-size:.82rem;font-weight:600;color:var(--gold)">${p.puntaje_total ?? '—'}</span></td>
        <td>${estadoPostBadge(p.estado)}</td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn btn-secondary btn-sm" onclick="openProgramarEntrevista(${p.id}, '${esc(p.nombre_completo.trim())}')" title="Entrevista">
              <i class="fa-solid fa-calendar-check"></i>
            </button>
            ${p.estado !== 'APROBADO' ? `<button class="btn btn-secondary btn-sm" title="Marcar aprobado" onclick="cambiarEstPost(${p.id},'APROBADO')">
              <i class="fa-solid fa-check"></i>
            </button>` : ''}
            <button class="btn btn-secondary btn-sm" title="Emitir oferta" onclick="openOferta(${p.id}, '${esc(p.nombre_completo.trim())}')">
              <i class="fa-solid fa-envelope-open-text" style="color:var(--gold)"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);text-align:center">Error al cargar</td></tr>`;
  }
}

function openAgregarPostulante() {
  document.getElementById('formAgregarPost').reset();
  openModal('modalAgregarPost');
}

async function submitPostulante(e) {
  e.preventDefault();
  const personaId = document.getElementById('fPostPersona').value;
  const fuente    = document.getElementById('fPostFuente').value;
  const cvUrl     = document.getElementById('fPostCV').value;
  if (!personaId) return showToast('Selecciona un candidato', 'warning');
  try {
    await apiFetch('/api/vacantes/postulaciones', 'POST', {
      vacante_id: vacanteActual,
      persona_id: parseInt(personaId),
      fuente, cv_url: cvUrl || null
    });
    showToast('Postulante registrado ✅', 'success');
    closeModal('modalAgregarPost');
    await refreshPostulantes();
    await loadVacantes();
    renderStats();
  } catch (err) {
    showToast(err.message || 'Error al registrar', 'error');
  }
}

async function cambiarEstPost(id, estado) {
  try {
    await apiFetch(`/api/vacantes/postulaciones/${id}/estado`, 'PATCH', { estado });
    showToast(`Estado actualizado: ${estado}`, 'success');
    await refreshPostulantes();
  } catch (e) { showToast('Error al cambiar estado', 'error'); }
}

// ── Entrevistas ───────────────────────────────────────────────
function openProgramarEntrevista(postulacionId, nombre) {
  postActual = postulacionId;
  document.getElementById('subEntrevista').textContent = `Candidato: ${nombre}`;
  document.getElementById('formEntrevista').reset();
  openModal('modalEntrevista');
}

async function submitEntrevista(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/vacantes/entrevistas', 'POST', {
      postulacion_id:   postActual,
      tipo:             document.getElementById('fEntTipo').value,
      fecha_programada: document.getElementById('fEntFecha').value,
      ubicacion:        document.getElementById('fEntUbicacion').value || null
    });
    showToast('Entrevista programada y candidato notificado 📧', 'success');
    closeModal('modalEntrevista');
    await refreshPostulantes();
    await cambiarEstPost(postActual, 'EN_ENTREVISTA');
  } catch (err) { showToast(err.message || 'Error', 'error'); }
}

// ── Ofertas laborales ─────────────────────────────────────────
function openOferta(postulacionId, nombre) {
  postActual = postulacionId;
  document.getElementById('subOferta').textContent = `Candidato: ${nombre}`;
  document.getElementById('formOferta').reset();

  // Cargar cargos en el select de oferta
  if (catalogos.puestos) {
    const opts = catalogos.puestos.map(p =>
      `<option value="${p.id}">${p.descripcion}</option>`
    ).join('');
    document.getElementById('fOfCargo').innerHTML = '<option value="">— Seleccionar —</option>' + opts;
  }
  openModal('modalOferta');
}

async function submitOferta(e) {
  e.preventDefault();
  try {
    await apiFetch('/api/vacantes/ofertas', 'POST', {
      postulacion_id:         postActual,
      cargo_id:               parseInt(document.getElementById('fOfCargo').value),
      sucursal_id:            parseInt(document.getElementById('fOfSucursal').value),
      tipo_contrato_id:       parseInt(document.getElementById('fOfTipoContrato').value),
      salario_ofrecido:       parseFloat(document.getElementById('fOfSalario').value),
      fecha_inicio_propuesta: document.getElementById('fOfFechaInicio').value || null,
      fecha_vencimiento:      document.getElementById('fOfFechaVence').value  || null,
      beneficios_adicionales: document.getElementById('fOfBeneficios').value  || null
    });
    showToast('¡Oferta emitida y candidato notificado por email! 🎉', 'success');
    closeModal('modalOferta');
    await refreshPostulantes();
  } catch (err) { showToast(err.message || 'Error al emitir oferta', 'error'); }
}

// ── Pipeline Kanban ───────────────────────────────────────────
function populatePipelineSelector() {
  const sel = document.getElementById('selVacantePipeline');
  const opts = vacantes.map(v =>
    `<option value="${v.id}">${v.titulo} — ${v.sucursal_nombre}</option>`
  ).join('');
  sel.innerHTML = '<option value="">— Selecciona una vacante —</option>' + opts;
}

const KANBAN_COLS = [
  { id: 'RECIBIDA',       label: 'Recibidas',     color: '#8b949e' },
  { id: 'EN_REVISION',    label: 'En Revisión',   color: '#2D7EF8' },
  { id: 'EN_ENTREVISTA',  label: 'Entrevista',    color: '#F0A500' },
  { id: 'PRESELECCIONADO',label: 'Preselecto',    color: '#a78bfa' },
  { id: 'APROBADO',       label: 'Aprobados ✅',  color: '#00c896' },
];

async function loadPipeline(vacanteId) {
  const board = document.getElementById('kanbanBoard');
  if (!vacanteId) { board.innerHTML = ''; return; }
  board.innerHTML = KANBAN_COLS.map(c => `
    <div class="kanban-col">
      <div class="kanban-col-header" style="color:${c.color}">${c.label}</div>
      <div class="kanban-col-body" id="kcol-${c.id}">
        <div class="empty-kanban"><i class="fa-solid fa-spinner fa-spin"></i></div>
      </div>
    </div>`).join('');

  try {
    const r = await apiFetch(`/api/vacantes/${vacanteId}/postulaciones`);
    const postulantes = r.data || [];

    KANBAN_COLS.forEach(col => {
      const colBody = document.getElementById(`kcol-${col.id}`);
      const grupo   = postulantes.filter(p => p.estado === col.id);
      if (!grupo.length) {
        colBody.innerHTML = `<div class="empty-kanban"><i class="fa-solid fa-inbox"></i>Sin candidatos</div>`;
        return;
      }
      colBody.innerHTML = grupo.map(p => `
        <div class="kanban-card">
          <div class="kanban-card-name">${esc(p.nombre_completo.trim())}</div>
          <div class="kanban-card-doc">${esc(p.tipo_doc)} ${esc(p.nro_documento)}</div>
          ${p.puntaje_total ? `<div class="kanban-card-score">${p.puntaje_total}pts</div>` : ''}
          <div class="kanban-card-actions">
            <button onclick="openProgramarEntrevista(${p.id},'${esc(p.nombre_completo.trim())}');closeModal('modalPostulantes')" title="Entrevista">
              📅 Entrevista
            </button>
            <button onclick="openOferta(${p.id},'${esc(p.nombre_completo.trim())}');closeModal('modalPostulantes')" title="Oferta">
              ✉️ Oferta
            </button>
          </div>
        </div>`).join('');
    });
  } catch (e) {
    board.innerHTML = `<p style="color:var(--danger)">Error cargando pipeline</p>`;
  }
}

// ── Tabs ──────────────────────────────────────────────────────
function switchTab(tab) {
  document.getElementById('view-vacantes').style.display = tab === 'vacantes' ? '' : 'none';
  document.getElementById('view-pipeline').style.display = tab === 'pipeline' ? '' : 'none';
  document.getElementById('tab-vacantes').classList.toggle('active', tab === 'vacantes');
  document.getElementById('tab-pipeline').classList.toggle('active', tab === 'pipeline');
  if (tab === 'pipeline') populatePipelineSelector();
}

// ── Helpers ───────────────────────────────────────────────────
function estadoBadge(estado) {
  const map = {
    BORRADOR:   ['borrador',   'fa-circle-dot',    'Borrador'],
    PUBLICADA:  ['publicada',  'fa-globe',         'Publicada'],
    EN_PROCESO: ['en-proceso', 'fa-spinner',       'En Proceso'],
    DESIERTA:   ['desierta',   'fa-ban',           'Desierta'],
    CERRADA:    ['cerrada',    'fa-check-circle',  'Cerrada'],
    CANCELADA:  ['desierta',   'fa-times-circle',  'Cancelada'],
  };
  const [cls, icon, label] = map[estado] || ['borrador', 'fa-circle', estado];
  return `<span class="badge-rec ${cls}"><i class="fa-solid ${icon}"></i> ${label}</span>`;
}

function estadoPostBadge(estado) {
  const colors = {
    RECIBIDA:       '#8b949e', EN_REVISION: '#2D7EF8', PRESELECCIONADO: '#a78bfa',
    EN_ENTREVISTA:  '#F0A500', APROBADO: '#00c896',    RECHAZADO: '#ff4d4f',
    RETIRADO:       '#ff4d4f'
  };
  const color = colors[estado] || '#8b949e';
  return `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:12px;padding:2px 10px;font-size:.72rem;font-weight:600">${estado.replace('_',' ')}</span>`;
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}

function populateSelect(id, items, valKey, labelKey, placeholder) {
  const el = document.getElementById(id);
  if (!el || !items) return;
  el.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option value="${i[valKey]}">${esc(i[labelKey])}</option>`).join('');
}
