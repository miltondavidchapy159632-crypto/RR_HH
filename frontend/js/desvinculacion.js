// ============================================================
//  SCGRH — desvinculacion.js
//  Offboarding, Validación y Liquidaciones
// ============================================================
'use strict';

let solicitudes = [];
let catalogos   = {};
let solActual   = null;

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCatalogos(), loadSols()]);
});

// ── CATÁLOGOS ─────────────────────────────────────────────────
async function loadCatalogos() {
  try {
    const r = await apiFetch('/api/desvinculacion/catalogos');
    catalogos = r.data;
    
    // Select Colaboradores
    const selColab = document.getElementById('fNColaborador');
    selColab.innerHTML = '<option value="">— Seleccionar colaborador —</option>' + 
      (catalogos.contratos || []).map(c => `<option value="${c.contrato_id}" data-fecha="${c.fecha_inicio}">${esc(c.nombre_completo.trim())} — ${esc(c.cargo_nombre)}</option>`).join('');
      
    // Select Motivos
    const selMotivo = document.getElementById('fNMotivo');
    selMotivo.innerHTML = '<option value="">— Seleccionar motivo —</option>' + 
      (catalogos.motivos || []).map(m => `<option value="${m.id}">${esc(m.descripcion)}</option>`).join('');
  } catch (e) { console.error('Error cargando catálogos:', e); }
}

function onColaboradorChange() {
  const sel = document.getElementById('fNColaborador');
  const opt = sel.options[sel.selectedIndex];
  const info = document.getElementById('infoAntiguedad');
  if (!opt || !opt.value) { info.style.display = 'none'; return; }
  
  const fechaIngreso = new Date(opt.dataset.fecha);
  const hoy = new Date();
  const diffTime = Math.abs(hoy - fechaIngreso);
  const diffYears = (diffTime / (1000 * 60 * 60 * 24 * 365.25)).toFixed(1);
  
  document.getElementById('valAntiguedad').textContent = `${diffYears} años (${fmtDate(opt.dataset.fecha)})`;
  info.style.display = '';
}

// ── SOLICITUDES ───────────────────────────────────────────────
async function loadSols() {
  try {
    const r = await apiFetch('/api/desvinculacion');
    solicitudes = r.data || [];
    renderStats();
    renderTabla(solicitudes);
  } catch (e) {
    document.getElementById('tablaBody').innerHTML = `<tr><td colspan="8" style="color:var(--danger);text-align:center">Error al cargar datos</td></tr>`;
  }
}

function renderStats() {
  const tot = solicitudes.length;
  const enProc = solicitudes.filter(s => ['INICIADA', 'EN_PROCESO', 'VALIDADA'].includes(s.estado)).length;
  const aprob = solicitudes.filter(s => s.estado === 'APROBADA').length;
  const cerr = solicitudes.filter(s => s.estado === 'CERRADA').length;

  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-card blue">
      <div class="stat-icon blue"><i class="fa-solid fa-right-from-bracket"></i></div>
      <div class="stat-body"><div class="stat-value">${tot}</div><div class="stat-label">Total Solicitudes</div></div>
    </div>
    <div class="stat-card gold">
      <div class="stat-icon gold"><i class="fa-solid fa-spinner"></i></div>
      <div class="stat-body"><div class="stat-value">${enProc}</div><div class="stat-label">En Proceso</div></div>
    </div>
    <div class="stat-card green">
      <div class="stat-icon green"><i class="fa-solid fa-check"></i></div>
      <div class="stat-body"><div class="stat-value">${aprob}</div><div class="stat-label">Aprobadas / LBS lista</div></div>
    </div>
    <div class="stat-card blue">
      <div class="stat-icon blue"><i class="fa-solid fa-lock"></i></div>
      <div class="stat-body"><div class="stat-value">${cerr}</div><div class="stat-label">Cerradas (Fin contrato)</div></div>
    </div>`;
}

function renderTabla(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:40px">
      <i class="fa-solid fa-right-from-bracket" style="font-size:2rem;opacity:.2;display:block;margin-bottom:10px"></i>
      No hay solicitudes de desvinculación
    </td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td>
        <div style="font-weight:600;font-size:.85rem">${esc(s.colaborador_nombre)}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">Ingreso: ${fmtDate(s.fecha_ingreso)}</div>
      </td>
      <td>
        <div style="font-size:.82rem">${esc(s.cargo_nombre)}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${esc(s.sucursal_nombre)}</div>
      </td>
      <td><span style="font-size:.82rem">${esc(s.motivo_cese)}</span></td>
      <td><span style="font-weight:600;font-size:.82rem">${fmtDate(s.fecha_cese_propuesta)}</span></td>
      <td>
        <span style="font-size:.8rem;color:${s.items_completados === s.items_totales && s.items_totales>0 ? 'var(--success)' : 'var(--text-muted)'}">
          ${s.items_completados} / ${s.items_totales || 0}
        </span>
      </td>
      <td>
        ${s.estado_liquidacion 
          ? `<span style="font-size:.8rem;color:var(--gold);font-weight:600">S/ ${Number(s.total_liquidacion).toLocaleString('es-PE')}</span>` 
          : '<span style="color:var(--text-muted);font-size:.75rem">Pendiente</span>'}
      </td>
      <td>${estadoBadge(s.estado)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openDetalle(${s.id})" title="Gestionar Offboarding">
          <i class="fa-solid fa-gear"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterSols(q) {
  const est = document.getElementById('filtroEstado').value;
  const lower = q.toLowerCase();
  const fil = solicitudes.filter(s => 
    (s.colaborador_nombre.toLowerCase().includes(lower) || s.cargo_nombre.toLowerCase().includes(lower)) &&
    (est === '' || s.estado === est)
  );
  renderTabla(fil);
}

function openNuevaSol() {
  document.getElementById('formNuevaSol').reset();
  document.getElementById('infoAntiguedad').style.display = 'none';
  openModal('modalNuevaSol');
}

async function submitNuevaSol(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitSol');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';

  const payload = {
    contrato_id: parseInt(document.getElementById('fNColaborador').value),
    motivo_cese_id: parseInt(document.getElementById('fNMotivo').value),
    fecha_cese_propuesta: document.getElementById('fNFecha').value,
    descripcion: document.getElementById('fNDesc').value || null
  };

  try {
    const r = await apiFetch('/api/desvinculacion', 'POST', payload);
    showToast('Proceso de offboarding iniciado', 'success');
    closeModal('modalNuevaSol');
    await loadSols();
    openDetalle(r.id);
  } catch (err) { showToast(err.message, 'error'); }
  finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-rocket"></i> Iniciar Proceso';
  }
}

// ── DETALLE / OFFBOARDING ─────────────────────────────────────
async function openDetalle(id) {
  openModal('modalDetalle');
  await loadDetalle(id);
}

async function loadDetalle(id) {
  document.getElementById('detBodyContent').innerHTML = `<div style="text-align:center;padding:40px"><i class="fa-solid fa-spinner fa-spin fa-2x"></i></div>`;
  try {
    const r = await apiFetch(`/api/desvinculacion/${id}`);
    solActual = r.data;
    
    document.getElementById('detalleTitulo').textContent = `Offboarding — ${solActual.colaborador_nombre}`;
    document.getElementById('detalleSubtitulo').textContent = `${solActual.cargo_nombre} · ${solActual.sucursal_nombre}`;
    
    // Update footer
    document.getElementById('detEstadoText').innerHTML = `Estado: ${estadoBadge(solActual.estado)}`;
    renderAccionesFooter();
    
    // Switch to first tab initially or keep current
    switchDetalleTab('resumen', true);
  } catch (err) {
    document.getElementById('detBodyContent').innerHTML = `<p style="color:var(--danger);text-align:center">Error al cargar detalle</p>`;
  }
}

function renderAccionesFooter() {
  const c = document.getElementById('detAcciones');
  const e = solActual.estado;
  let html = '';
  
  if (e === 'INICIADA') {
    html = `<button class="btn btn-primary" onclick="cambiarEstado('EN_PROCESO')"><i class="fa-solid fa-play"></i> En Proceso</button>
            <button class="btn btn-secondary" onclick="cambiarEstado('CANCELADA')"><i class="fa-solid fa-ban"></i> Cancelar</button>`;
  } else if (e === 'EN_PROCESO') {
    const items = solActual.validaciones || [];
    const todosOk = items.length > 0 && items.every(i => i.completado);
    html = `<button class="btn btn-primary" onclick="cambiarEstado('VALIDADA')" ${!todosOk ? 'disabled title="Complete todas las validaciones primero"' : ''}>
              <i class="fa-solid fa-check-double"></i> Validar
            </button>`;
  } else if (e === 'VALIDADA') {
    const liqOk = !!solActual.liquidacion;
    html = `<button class="btn btn-primary" onclick="cambiarEstado('APROBADA')" ${!liqOk ? 'disabled title="Calcule la liquidación primero"' : ''}>
              <i class="fa-solid fa-thumbs-up"></i> Aprobar Liquidación
            </button>`;
  } else if (e === 'APROBADA') {
    html = `<button class="btn btn-primary" onclick="cambiarEstado('CERRADA')" style="background:var(--bg-card);border-color:var(--border)">
              <i class="fa-solid fa-lock"></i> Cerrar Proceso
            </button>`;
  }
  c.innerHTML = html;
}

async function cambiarEstado(nuevoEstado) {
  if (!confirm(`¿Estás seguro de marcar la solicitud como ${nuevoEstado}? ${nuevoEstado === 'CERRADA' ? '\n\nESTO FINALIZARÁ EL CONTRATO DEL COLABORADOR.' : ''}`)) return;
  try {
    await apiFetch(`/api/desvinculacion/${solActual.id}/estado`, 'PATCH', { estado: nuevoEstado });
    showToast(`Solicitud cambiada a ${nuevoEstado}`, 'success');
    await loadDetalle(solActual.id);
    await loadSols();
  } catch (e) { showToast('Error al cambiar estado', 'error'); }
}

// ── TABS DEL MODAL ────────────────────────────────────────────
function switchDetalleTab(tab, forceRender = false) {
  document.querySelectorAll('.rec-tab').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  
  if (!solActual) return;
  
  const content = document.getElementById('detBodyContent');
  if (tab === 'resumen') renderTabResumen(content);
  else if (tab === 'activos') renderTabActivos(content);
  else if (tab === 'liquidacion') renderTabLiquidacion(content);
}

function renderTabResumen(container) {
  const v = solActual.validaciones || [];
  container.innerHTML = `
    <div style="display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap">
      <div style="flex:1;background:var(--bg-card);padding:16px;border-radius:10px;border:1px solid var(--border)">
        <h4 style="font-size:.85rem;color:var(--text-muted);margin:0 0 10px">Datos del Cese</h4>
        <p style="margin:0 0 5px;font-size:.85rem"><strong>Motivo:</strong> ${esc(solActual.motivo_cese)}</p>
        <p style="margin:0 0 5px;font-size:.85rem"><strong>Fecha propuesta:</strong> ${fmtDate(solActual.fecha_cese_propuesta)}</p>
        <p style="margin:0;font-size:.82rem;color:var(--text-muted)">${esc(solActual.descripcion || 'Sin observaciones')}</p>
      </div>
      <div style="flex:1;background:var(--bg-card);padding:16px;border-radius:10px;border:1px solid var(--border)">
        <h4 style="font-size:.85rem;color:var(--text-muted);margin:0 0 10px">Checklist de Validación</h4>
        <div style="font-size:1.5rem;font-weight:800;color:${v.every(x=>x.completado) ? 'var(--success)' : 'var(--gold)'};margin-bottom:5px">
          ${v.filter(x=>x.completado).length} / ${v.length}
        </div>
        <p style="margin:0;font-size:.75rem;color:var(--text-muted)">Tareas completadas</p>
      </div>
    </div>
    
    <h4 style="font-size:.9rem;margin-bottom:12px;color:var(--accent)"><i class="fa-solid fa-list-check"></i> Tareas de validación</h4>
    <div>
      ${v.map(item => `
        <div class="chk-row ${item.completado ? 'checked' : ''}">
          <div style="display:flex;align-items:center;gap:12px">
            <input type="checkbox" style="width:18px;height:18px;cursor:pointer;accent-color:var(--success)" 
                   ${item.completado ? 'checked' : ''} 
                   ${solActual.estado === 'INICIADA' || solActual.estado === 'CERRADA' ? 'disabled' : ''}
                   onchange="toggleCheckItem(${item.id}, this.checked)"/>
            <span class="chk-title" style="font-size:.85rem;font-weight:500">${esc(item.item)}</span>
          </div>
          ${item.validado_en ? `<span style="font-size:.7rem;color:var(--text-muted)">Validado el ${fmtDate(item.validado_en)}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

async function toggleCheckItem(id, completado) {
  try {
    await apiFetch(`/api/desvinculacion/validacion/${id}`, 'PATCH', { completado });
    await loadDetalle(solActual.id); // Reload to update UI and footer buttons
  } catch (e) { showToast('Error al guardar', 'error'); }
}

function renderTabActivos(container) {
  const act = solActual.activos || [];
  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <h4 style="font-size:.9rem;margin:0;color:var(--accent)"><i class="fa-solid fa-laptop"></i> Activos asignados a devolver</h4>
      ${!['CERRADA','CANCELADA'].includes(solActual.estado) ? `
      <button class="btn btn-secondary btn-sm" onclick="promptAddActivo()">
        <i class="fa-solid fa-plus"></i> Añadir Activo
      </button>` : ''}
    </div>
    ${act.length ? `
    <table class="act-table" style="width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:8px;overflow:hidden">
      <thead style="background:var(--bg-card)">
        <tr>
          <th style="text-align:left">Activo</th>
          <th style="text-align:center">Cantidad</th>
          <th style="text-align:left">Estado</th>
          <th style="text-align:left">Observación</th>
        </tr>
      </thead>
      <tbody>
        ${act.map(a => `
        <tr style="border-top:1px solid var(--border)">
          <td style="font-weight:600">${esc(a.activo)}</td>
          <td style="text-align:center">${a.cantidad}</td>
          <td>
            <select class="form-control" style="width:120px;padding:3px 8px;font-size:.78rem;font-weight:600;
                    ${a.estado_devolucion==='DEVUELTO' ? 'color:var(--success)' : a.estado_devolucion==='PENDIENTE' ? 'color:var(--gold)' : 'color:#ff4d4f'}"
                    onchange="updateActivo(${a.id}, this.value, '${esc(a.observacion||'')}')"
                    ${['CERRADA','CANCELADA'].includes(solActual.estado) ? 'disabled' : ''}>
              <option value="PENDIENTE" ${a.estado_devolucion==='PENDIENTE'?'selected':''}>Pendiente</option>
              <option value="DEVUELTO" ${a.estado_devolucion==='DEVUELTO'?'selected':''}>Devuelto</option>
              <option value="NO_DEVUELTO" ${a.estado_devolucion==='NO_DEVUELTO'?'selected':''}>No devuelto</option>
              <option value="DANIADO" ${a.estado_devolucion==='DANIADO'?'selected':''}>Dañado</option>
            </select>
          </td>
          <td>
            <input type="text" class="form-control" style="width:100%;padding:3px 8px;font-size:.78rem" 
                   value="${esc(a.observacion||'')}" placeholder="Nota..."
                   onchange="updateActivo(${a.id}, '${a.estado_devolucion}', this.value)"
                   ${['CERRADA','CANCELADA'].includes(solActual.estado) ? 'disabled' : ''}/>
          </td>
        </tr>
        `).join('')}
      </tbody>
    </table>
    ` : `<p style="text-align:center;color:var(--text-muted);padding:20px;font-size:.85rem">No se han registrado activos para devolución.</p>`}
  `;
}

async function promptAddActivo() {
  const activo = prompt('Nombre del activo a devolver (ej: Laptop Dell, Llaves caja, etc):');
  if (!activo) return;
  try {
    await apiFetch(`/api/desvinculacion/${solActual.id}/activos`, 'POST', { activo });
    await loadDetalle(solActual.id);
  } catch (e) { showToast('Error al añadir', 'error'); }
}

async function updateActivo(id, estado, observacion) {
  try {
    await apiFetch(`/api/desvinculacion/activos/${id}`, 'PATCH', { estado, observacion });
  } catch (e) { showToast('Error al actualizar', 'error'); }
}

function renderTabLiquidacion(container) {
  const l = solActual.liquidacion || {};
  const isEditable = !['APROBADA','CERRADA','CANCELADA'].includes(solActual.estado);
  const total = l.total_liquidacion || 0;
  
  container.innerHTML = `
    <h4 style="font-size:.9rem;margin-bottom:16px;color:var(--accent)"><i class="fa-solid fa-calculator"></i> Liquidación de Beneficios Sociales (LBS)</h4>
    <div class="liq-grid">
      <div class="liq-card">
        <h5 style="margin:0 0 12px;font-size:.8rem;color:var(--text-muted);text-transform:uppercase">Ingresos</h5>
        <div class="liq-item">
          <span>CTS Trunca</span>
          ${isEditable ? `<input type="number" id="l_cts" class="form-control" style="width:100px;text-align:right" value="${l.cts_acumulada||0}" oninput="calcLiq()"/>` : `<span style="font-weight:600">S/ ${l.cts_acumulada||0}</span>`}
        </div>
        <div class="liq-item">
          <span>Vacaciones Truncas</span>
          ${isEditable ? `<input type="number" id="l_vac" class="form-control" style="width:100px;text-align:right" value="${l.vacaciones_truncas||0}" oninput="calcLiq()"/>` : `<span style="font-weight:600">S/ ${l.vacaciones_truncas||0}</span>`}
        </div>
        <div class="liq-item">
          <span>Gratificación Trunca</span>
          ${isEditable ? `<input type="number" id="l_grat" class="form-control" style="width:100px;text-align:right" value="${l.gratificacion_trunca||0}" oninput="calcLiq()"/>` : `<span style="font-weight:600">S/ ${l.gratificacion_trunca||0}</span>`}
        </div>
        <div class="liq-item">
          <span>Indemnización (si aplica)</span>
          ${isEditable ? `<input type="number" id="l_indem" class="form-control" style="width:100px;text-align:right" value="${l.indemnizacion||0}" oninput="calcLiq()"/>` : `<span style="font-weight:600">S/ ${l.indemnizacion||0}</span>`}
        </div>
      </div>
      <div class="liq-card">
        <h5 style="margin:0 0 12px;font-size:.8rem;color:var(--text-muted);text-transform:uppercase">Descuentos</h5>
        <div class="liq-item">
          <span>Deudas / Préstamos / Activos</span>
          ${isEditable ? `<input type="number" id="l_deuda" class="form-control" style="width:100px;text-align:right;color:#ff4d4f" value="${l.deudas_descuento||0}" oninput="calcLiq()"/>` : `<span style="font-weight:600;color:#ff4d4f">- S/ ${l.deudas_descuento||0}</span>`}
        </div>
        <div class="liq-total">
          <span>Total Neto a Pagar</span>
          <span id="l_total_lbl">S/ ${Number(total).toLocaleString('es-PE')}</span>
        </div>
        
        ${isEditable ? `
        <button class="btn btn-primary" style="width:100%;margin-top:20px" onclick="guardarLiq()">
          <i class="fa-solid fa-floppy-disk"></i> Guardar Liquidación
        </button>` : `
        <div style="margin-top:20px;text-align:center;padding:10px;background:rgba(0,200,150,.1);border-radius:8px;color:var(--success);font-weight:600;font-size:.8rem">
          <i class="fa-solid fa-circle-check"></i> Liquidación Guardada y Aprobada
        </div>`}
      </div>
    </div>
  `;
}

function calcLiq() {
  const cts = parseFloat(document.getElementById('l_cts').value)||0;
  const vac = parseFloat(document.getElementById('l_vac').value)||0;
  const grat = parseFloat(document.getElementById('l_grat').value)||0;
  const indem = parseFloat(document.getElementById('l_indem').value)||0;
  const deuda = parseFloat(document.getElementById('l_deuda').value)||0;
  
  const total = (cts + vac + grat + indem) - deuda;
  document.getElementById('l_total_lbl').textContent = `S/ ${Number(total).toLocaleString('es-PE')}`;
}

async function guardarLiq() {
  const cts = parseFloat(document.getElementById('l_cts').value)||0;
  const vac = parseFloat(document.getElementById('l_vac').value)||0;
  const grat = parseFloat(document.getElementById('l_grat').value)||0;
  const indem = parseFloat(document.getElementById('l_indem').value)||0;
  const deuda = parseFloat(document.getElementById('l_deuda').value)||0;
  const total = (cts + vac + grat + indem) - deuda;

  try {
    await apiFetch(`/api/desvinculacion/${solActual.id}/liquidacion`, 'PUT', {
      cts_acumulada: cts, vacaciones_truncas: vac, gratificacion_trunca: grat,
      indemnizacion: indem, deudas_descuento: deuda, total_liquidacion: total
    });
    showToast('Liquidación guardada exitosamente', 'success');
    await loadDetalle(solActual.id);
  } catch (e) { showToast('Error al guardar liquidación', 'error'); }
}

// ── HELPERS ───────────────────────────────────────────────────
function estadoBadge(estado) {
  const labels = {
    INICIADA: 'Iniciada', EN_PROCESO: 'En Proceso', VALIDADA: 'Validada',
    APROBADA: 'Aprobada', CERRADA: 'Cerrada', CANCELADA: 'Cancelada'
  };
  return `<span class="off-badge ${estado}">${labels[estado] || estado}</span>`;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
