// ============================================================
//  SCGRH — zonas.js
// ============================================================
'use strict';

let asignaciones = [];
let opcionesAsig = null;
let zonasCat = [];
let sucursales = [];

document.addEventListener('DOMContentLoaded', async () => {
  // Set default date to today
  document.getElementById('filtroFecha').value = new Date().toISOString().split('T')[0];
  await loadAsignaciones();
});

// ── ASIGNACIONES ──────────────────────────────────────────────
async function loadAsignaciones() {
  const f = document.getElementById('filtroFecha').value;
  if(!f) return;
  try {
    const r = await apiFetch(`/api/zonas/asignaciones?fecha=${f}`);
    asignaciones = r.data || [];
    renderAsignaciones();
  } catch (e) {
    document.getElementById('asignacionesContainer').innerHTML = `<p style="color:var(--danger);text-align:center">Error al cargar asignaciones</p>`;
  }
}

function renderAsignaciones() {
  const c = document.getElementById('asignacionesContainer');
  if (!asignaciones.length) {
    c.innerHTML = `<div class="card" style="text-align:center;padding:40px;color:var(--text-muted)">
      <i class="fa-solid fa-map-location-dot" style="font-size:2rem;opacity:.3;margin-bottom:10px;display:block"></i>
      No hay personal asignado a zonas para esta fecha.
    </div>`;
    return;
  }
  
  // Agrupar por sucursal y luego por zona
  const sList = {};
  asignaciones.forEach(a => {
    if(!sList[a.sucursal_nombre]) sList[a.sucursal_nombre] = {};
    if(!sList[a.sucursal_nombre][a.zona_nombre]) sList[a.sucursal_nombre][a.zona_nombre] = { tipo: a.zona_tipo, items:[] };
    sList[a.sucursal_nombre][a.zona_nombre].items.push(a);
  });
  
  let html = '';
  for (const suc in sList) {
    html += `<h4 style="margin:20px 0 10px;color:var(--text-primary)"><i class="fa-solid fa-store" style="color:var(--text-muted)"></i> ${esc(suc)}</h4>`;
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(400px, 1fr));gap:16px">`;
    
    for (const zName in sList[suc]) {
      const z = sList[suc][zName];
      html += `
        <div class="zone-card">
          <div class="zone-header">
            <h5 style="margin:0;font-size:1rem;color:var(--accent)">${esc(zName)}</h5>
            <span class="zone-type ${z.tipo}">${esc(z.tipo).replace('_',' ')}</span>
          </div>
          <div style="flex:1">
            ${z.items.map(i => `
              <div class="asig-row">
                <div class="asig-time">
                  ${i.hora_inicio ? i.hora_inicio.substring(0,5) : '--:--'} - ${i.hora_fin ? i.hora_fin.substring(0,5) : '--:--'}<br>
                  <span style="font-size:.65rem;color:var(--text-muted)">${esc(i.turno_nombre||'')}</span>
                </div>
                <div style="flex:1">
                  <div style="font-weight:600;font-size:.85rem">${esc(i.empleado_nombre)}</div>
                  <div style="font-size:.7rem;color:var(--text-muted)">${esc(i.rol_en_zona) || esc(i.cargo_nombre)}</div>
                </div>
                <button class="btn btn-secondary btn-sm" style="color:#ff4d4f;padding:2px 6px" onclick="deleteAsig(${i.id})" title="Eliminar asignación"><i class="fa-solid fa-trash"></i></button>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    html += `</div>`;
  }
  c.innerHTML = html;
}

// ── NUEVA ASIGNACIÓN ──────────────────────────────────────────
async function openNuevaAsig() {
  document.getElementById('formNuevaAsig').reset();
  document.getElementById('faFecha').value = document.getElementById('filtroFecha').value || new Date().toISOString().split('T')[0];
  
  if (!opcionesAsig) {
    try {
      const r = await apiFetch('/api/zonas/asignaciones/options');
      opcionesAsig = r.data;
    } catch(e) { return showToast('Error cargando opciones', 'error'); }
  }
  
  // Llenar selects
  document.getElementById('faZona').innerHTML = '<option value="">— Seleccionar Zona —</option>' +
    opcionesAsig.zonas.map(z => `<option value="${z.id}">${esc(z.sucursal)} - ${esc(z.nombre)}</option>`).join('');
  document.getElementById('faColaborador').innerHTML = '<option value="">— Seleccionar Personal —</option>' +
    opcionesAsig.empleados.map(e => `<option value="${e.contrato_id}">${esc(e.empleado_nombre)} (${esc(e.cargo)})</option>`).join('');
  document.getElementById('faTurno').innerHTML = '<option value="">— Seleccionar Turno —</option>' +
    opcionesAsig.turnos.map(t => `<option value="${t.id}" data-hi="${t.hora_inicio}" data-hf="${t.hora_fin}">${esc(t.nombre)}</option>`).join('');

  openModal('modalNuevaAsig');
}

function setHorasFromTurno() {
  const sel = document.getElementById('faTurno');
  const opt = sel.options[sel.selectedIndex];
  if (opt && opt.value) {
    // Las horas vienen de SQL SERVER TimeSpan, usualmente formato string "15:00:00"
    const hi = opt.dataset.hi ? opt.dataset.hi.substring(11,16) : ''; // "1970-01-01T15:00:00Z" (Depende del driver). A veces solo es "15:00:00"
    // Handle diff node mssql returns
    let realHi = opt.dataset.hi; let realHf = opt.dataset.hf;
    if(realHi && realHi.includes('T')) realHi = new Date(realHi).toISOString().substring(11,16);
    if(realHf && realHf.includes('T')) realHf = new Date(realHf).toISOString().substring(11,16);
    // fallback
    if(realHi && realHi.length>5 && !realHi.includes('T')) realHi = realHi.substring(0,5);
    if(realHf && realHf.length>5 && !realHf.includes('T')) realHf = realHf.substring(0,5);
    
    document.getElementById('faHI').value = realHi;
    document.getElementById('faHF').value = realHf;
  }
}

async function submitNuevaAsig(e) {
  e.preventDefault();
  const d = {
    zona_id: parseInt(document.getElementById('faZona').value),
    contrato_id: parseInt(document.getElementById('faColaborador').value),
    turno_id: parseInt(document.getElementById('faTurno').value),
    fecha: document.getElementById('faFecha').value,
    hora_inicio: document.getElementById('faHI').value,
    hora_fin: document.getElementById('faHF').value,
    rol_en_zona: document.getElementById('faRol').value || null
  };
  
  try {
    await apiFetch('/api/zonas/asignaciones', 'POST', d);
    showToast('Asignado correctamente', 'success');
    closeModal('modalNuevaAsig');
    
    // Si la fecha coincide con el filtro actual, recargar
    if (document.getElementById('filtroFecha').value === d.fecha) {
      await loadAsignaciones();
    }
  } catch(err) { showToast(err.message, 'error'); }
}

async function deleteAsig(id) {
  if(!confirm('¿Eliminar esta asignación?')) return;
  try {
    await apiFetch(`/api/zonas/asignaciones/${id}`, 'DELETE');
    await loadAsignaciones();
  } catch(e) { showToast('Error al eliminar', 'error'); }
}

// ── CRUD ZONAS ────────────────────────────────────────────────
async function openZonasCat() {
  openModal('modalZonasCat');
  hideFormZona();
  document.getElementById('gridZonasCat').innerHTML = '<div style="text-align:center;padding:20px"><i class="fa-solid fa-spinner fa-spin"></i></div>';
  
  try {
    // cargar sucursales si no están
    if(!sucursales.length) {
      const rs = await apiFetch('/api/zonas/sucursales');
      sucursales = rs.data;
      document.getElementById('fzSuc').innerHTML = sucursales.map(s => `<option value="${s.id}">${esc(s.nombre)}</option>`).join('');
    }
    
    // cargar zonas
    const r = await apiFetch('/api/zonas');
    zonasCat = r.data;
    renderZonasCat();
  } catch(e) { showToast('Error cargando zonas', 'error'); }
}

function renderZonasCat() {
  const c = document.getElementById('gridZonasCat');
  let html = `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px">`;
  
  zonasCat.forEach(z => {
    html += `
      <div class="zone-card" style="${z.activo?'':'opacity:0.6;filter:grayscale(1)'}">
        <div class="zone-header">
          <div>
            <h5 style="margin:0;font-size:.9rem">${esc(z.codigo)} — ${esc(z.nombre)}</h5>
            <div style="font-size:.7rem;color:var(--text-muted)">${esc(z.sucursal_nombre)}</div>
          </div>
          <span class="zone-type ${z.tipo}">${esc(z.tipo)}</span>
        </div>
        <div class="zone-stats" style="margin-top:10px">
          <div class="z-stat"><div class="z-stat-val">${z.aforo_max}</div><div class="z-stat-lbl">Aforo Máx</div></div>
          <div class="z-stat"><div class="z-stat-val" style="color:var(--accent)">${z.personal_hoy}</div><div class="z-stat-lbl">Personal Hoy</div></div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  c.innerHTML = html;
}

function showFormZona() { document.getElementById('divFormZona').style.display = 'block'; }
function hideFormZona() { document.getElementById('divFormZona').style.display = 'none'; }

async function saveZona() {
  const payload = {
    sucursal_id: parseInt(document.getElementById('fzSuc').value),
    codigo: document.getElementById('fzCod').value,
    nombre: document.getElementById('fzNom').value,
    tipo: document.getElementById('fzTipo').value,
    aforo_max: parseInt(document.getElementById('fzAforo').value),
    activo: parseInt(document.getElementById('fzActivo').value)
  };
  
  if(!payload.codigo || !payload.nombre) return showToast('Código y nombre obligatorios', 'error');
  
  try {
    await apiFetch('/api/zonas', 'POST', payload);
    showToast('Zona guardada', 'success');
    hideFormZona();
    await openZonasCat(); // recargar modal
    opcionesAsig = null; // invalidar cache de opciones
  } catch(e) { showToast(e.message, 'error'); }
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
