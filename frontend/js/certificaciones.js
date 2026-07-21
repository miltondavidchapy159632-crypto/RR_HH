// ============================================================
//  SCGRH — certificaciones.js
// ============================================================
'use strict';

let asigList = [];
let cats = [];

document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadEmpleadosCert(), loadStats()]);
});

// ── DASHBOARD & LISTA ─────────────────────────────────────────
async function loadStats() {
  try {
    const r = await apiFetch('/api/certificaciones/stats');
    const s = r.data || {};
    
    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card blue">
        <div class="stat-icon blue"><i class="fa-solid fa-certificate"></i></div>
        <div class="stat-body"><div class="stat-value">${s.TOTAL||0}</div><div class="stat-label">Total Asignaciones</div></div>
      </div>
      <div class="stat-card green">
        <div class="stat-icon green"><i class="fa-solid fa-check"></i></div>
        <div class="stat-body"><div class="stat-value">${s.VIGENTE||0}</div><div class="stat-label">Vigentes</div></div>
      </div>
      <div class="stat-card gold">
        <div class="stat-icon gold"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="stat-body"><div class="stat-value">${s.POR_VENCER||0}</div><div class="stat-label">Por Vencer</div></div>
      </div>
      <div class="stat-card red">
        <div class="stat-icon red"><i class="fa-solid fa-ban"></i></div>
        <div class="stat-body"><div class="stat-value">${s.VENCIDA||0}</div><div class="stat-label">Vencidas</div></div>
      </div>
    `;
  } catch (e) { console.error('Error loadStats', e); }
}

async function loadEmpleadosCert() {
  try {
    const r = await apiFetch('/api/certificaciones/empleados');
    asigList = r.data || [];
    filterTabla(document.getElementById('searchInput').value);
  } catch (e) {
    document.getElementById('tablaBody').innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--danger)">Error al cargar</td></tr>`;
  }
}

function filterTabla(q) {
  const est = document.getElementById('filtroEstado').value;
  const lower = q.toLowerCase();
  const fil = asigList.filter(a => 
    (a.empleado_nombre.toLowerCase().includes(lower) || a.certificacion_nombre.toLowerCase().includes(lower)) &&
    (est === '' || a.estado === est)
  );
  renderTabla(fil);
}

function renderTabla(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--text-muted)">No hay registros</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(a => `
    <tr>
      <td>
        <div style="font-weight:600;font-size:.85rem">${esc(a.empleado_nombre)}</div>
        <div style="font-size:.75rem;color:var(--text-muted)">${esc(a.cargo_nombre)} · ${esc(a.sucursal_nombre)}</div>
      </td>
      <td>
        <div style="font-size:.82rem;font-weight:600;color:var(--accent)">${esc(a.certificacion_nombre)}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${esc(a.entidad_emisora)}</div>
      </td>
      <td><span style="font-size:.8rem">${esc(a.nro_certificado||'—')}</span></td>
      <td><span style="font-size:.82rem">${fmtDate(a.fecha_obtencion)}</span></td>
      <td><span style="font-size:.82rem;font-weight:600;${a.estado==='VENCIDA'?'color:#ff4d4f':''}">${fmtDate(a.fecha_vencimiento)}</span></td>
      <td><span class="badge-cert ${a.estado}">${a.estado.replace('_',' ')}</span></td>
      <td>
        <select class="form-control" style="font-size:.75rem;padding:2px 5px;width:100px" onchange="changeEstado(${a.id}, this.value)">
          <option value="VIGENTE" ${a.estado==='VIGENTE'?'selected':''}>Vigente</option>
          <option value="POR_VENCER" ${a.estado==='POR_VENCER'?'selected':''}>Por Vencer</option>
          <option value="VENCIDA" ${a.estado==='VENCIDA'?'selected':''}>Vencida</option>
          <option value="REVOCADA" ${a.estado==='REVOCADA'?'selected':''}>Revocada</option>
        </select>
        <button class="btn btn-secondary btn-sm" style="padding:2px 6px;margin-left:5px;color:#ff4d4f" onclick="eliminar(${a.id})" title="Eliminar registro">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function changeEstado(id, estado) {
  try {
    await apiFetch(`/api/certificaciones/empleados/${id}`, 'PATCH', { estado });
    showToast('Estado actualizado', 'success');
    loadStats();
    // Actualizamos local
    const f = asigList.find(x => x.id === id);
    if (f) f.estado = estado;
    filterTabla(document.getElementById('searchInput').value);
  } catch (e) { showToast('Error al actualizar', 'error'); }
}

async function eliminar(id) {
  if(!confirm('¿Eliminar esta certificación del colaborador?')) return;
  try {
    await apiFetch(`/api/certificaciones/empleados/${id}`, 'DELETE');
    showToast('Registro eliminado', 'success');
    await loadEmpleadosCert();
    loadStats();
  } catch (e) { showToast('Error al eliminar', 'error'); }
}

// ── ASIGNACIÓN NUEVA ──────────────────────────────────────────
async function openNuevaAsig() {
  document.getElementById('formNuevaAsig').reset();
  
  try {
    const r = await apiFetch('/api/certificaciones/selects');
    cats = r.data.certificaciones; // guardado global para usar la vigencia (meses)
    
    document.getElementById('faColaborador').innerHTML = '<option value="">— Seleccionar —</option>' +
      r.data.contratos.map(c => `<option value="${c.contrato_id}">${esc(c.nombre_completo)} (${esc(c.cargo_nombre)})</option>`).join('');
      
    document.getElementById('faCert').innerHTML = '<option value="">— Seleccionar —</option>' +
      cats.map(c => `<option value="${c.id}">${esc(c.codigo)} — ${esc(c.nombre)}</option>`).join('');
      
    openModal('modalNuevaAsig');
  } catch (e) { showToast('Error al cargar opciones', 'error'); }
}

function calcVencimiento() {
  const cId = document.getElementById('faCert').value;
  const fObt = document.getElementById('faFObt').value;
  if (!cId || !fObt) return;
  
  const c = cats.find(x => x.id == cId);
  if (c && c.vigencia_meses) {
    const d = new Date(fObt);
    // Para que los meses no causen desfase raro con los días (ej 31 enero + 1 mes)
    d.setMonth(d.getMonth() + c.vigencia_meses);
    document.getElementById('faFVen').value = d.toISOString().split('T')[0];
  }
}
document.getElementById('faCert').addEventListener('change', calcVencimiento);

async function submitNuevaAsig(e) {
  e.preventDefault();
  const data = {
    contrato_id: parseInt(document.getElementById('faColaborador').value),
    certificacion_id: parseInt(document.getElementById('faCert').value),
    fecha_obtencion: document.getElementById('faFObt').value,
    fecha_vencimiento: document.getElementById('faFVen').value || null,
    nro_certificado: document.getElementById('faNro').value || null,
    estado: document.getElementById('faEstado').value,
    observaciones: document.getElementById('faObs').value || null
  };
  
  try {
    await apiFetch('/api/certificaciones/empleados', 'POST', data);
    showToast('Certificación asignada correctamente', 'success');
    closeModal('modalNuevaAsig');
    await loadEmpleadosCert();
    loadStats();
  } catch (err) { showToast(err.message, 'error'); }
}

// ── CATÁLOGO ──────────────────────────────────────────────────
async function openCatalogo() {
  openModal('modalCatalogo');
  hideFormCat();
  try {
    const r = await apiFetch('/api/certificaciones/catalogo');
    const tbody = document.getElementById('tbCatalogo');
    tbody.innerHTML = r.data.map(c => `
      <tr>
        <td style="font-weight:700;font-size:.8rem;color:var(--accent)">${esc(c.codigo)}</td>
        <td style="font-size:.85rem;font-weight:500">${esc(c.nombre)}</td>
        <td><span style="font-size:.75rem">${esc(c.entidad_emisora||'—')}</span></td>
        <td><span style="font-size:.8rem">${c.vigencia_meses} meses</span></td>
        <td style="text-align:center">
          <span style="color:var(--success);font-weight:600;font-size:.8rem" title="Vigentes">${c.vigentes}</span>
          <span style="color:var(--text-muted);font-size:.8rem;margin:0 4px">/</span>
          <span style="color:#ff4d4f;font-weight:600;font-size:.8rem" title="Vencidas">${c.vencidas}</span>
        </td>
      </tr>
    `).join('');
  } catch (e) { showToast('Error al cargar catálogo', 'error'); }
}

function showFormCat() { document.getElementById('divFormCat').style.display = 'block'; }
function hideFormCat() { 
  document.getElementById('divFormCat').style.display = 'none';
  document.getElementById('fcCod').value=''; document.getElementById('fcNom').value='';
  document.getElementById('fcEnt').value=''; document.getElementById('fcMeses').value='12';
}

async function saveNuevoCat() {
  const cod = document.getElementById('fcCod').value;
  const nom = document.getElementById('fcNom').value;
  if(!cod || !nom) return showToast('Código y nombre requeridos', 'error');
  
  try {
    await apiFetch('/api/certificaciones/catalogo', 'POST', {
      codigo: cod, nombre: nom, 
      entidad_emisora: document.getElementById('fcEnt').value,
      vigencia_meses: parseInt(document.getElementById('fcMeses').value) || 12
    });
    showToast('Certificación creada', 'success');
    hideFormCat();
    await openCatalogo(); // recargar
  } catch (e) { showToast('Error al guardar: '+e.message, 'error'); }
}

// ── UTILS ─────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return 'Indefinido';
  return new Date(d).toLocaleDateString('es-PE', { day:'2-digit', month:'short', year:'numeric' });
}
function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
