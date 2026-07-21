// ============================================================
//  SCGRH — auditoria.js
// ============================================================
'use strict';

let auditorias = [];
let zonas = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadAuditorias();
});

// ── CARGAR DATOS ──────────────────────────────────────────────
async function loadAuditorias() {
  const c = document.getElementById('listAuditorias');
  try {
    const r = await apiFetch('/api/auditoria');
    auditorias = r.data || [];
    
    if (auditorias.length === 0) {
      c.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px">No hay auditorías registradas.</div>`;
      return;
    }
    
    let html = '';
    for (const a of auditorias) {
      const pColor = a.puntaje_total >= 90 ? 'ptje-high' : (a.puntaje_total >= 70 ? 'ptje-med' : 'ptje-low');
      const fDate = new Date(a.fecha_auditoria).toLocaleString();
      
      html += `
        <div class="audit-item">
          <div style="flex:1">
            <h4 style="margin:0 0 5px;font-size:1rem;color:var(--text-primary)">
              <i class="fa-solid fa-map-pin" style="color:var(--accent);margin-right:5px"></i> ${esc(a.zona_nombre)}
              <span style="font-size:.65rem;background:rgba(255,255,255,0.1);padding:2px 6px;border-radius:4px;margin-left:10px">${esc(a.tipo)}</span>
            </h4>
            <div style="font-size:.8rem;color:var(--text-muted)">
              Auditor: ${esc(a.auditor)} | Sede: ${esc(a.sucursal_nombre)} <br>
              Fecha: ${fDate}
            </div>
            ${a.observaciones ? `<div style="font-size:.8rem;margin-top:5px;font-style:italic">" ${esc(a.observaciones)} "</div>` : ''}
          </div>
          <div class="audit-ptje ${pColor}">
            ${a.puntaje_total}%
          </div>
        </div>
      `;
    }
    c.innerHTML = html;
  } catch(e) {
    c.innerHTML = `<div style="color:var(--danger);text-align:center">Error al cargar datos</div>`;
  }
}

async function cargarZonas() {
  if (zonas.length) return;
  try {
    const r = await apiFetch('/api/zonas'); // Usamos el endpoint de zonas que creamos en Fase 6
    zonas = r.data.filter(z => z.activo);
    document.getElementById('fZona').innerHTML = '<option value="">— Seleccionar Zona —</option>' + 
      zonas.map(z => `<option value="${z.id}">${esc(z.sucursal_nombre)} - ${esc(z.nombre)}</option>`).join('');
  } catch(e) { showToast('Error cargando zonas', 'error'); }
}

// ── NUEVA AUDITORÍA (MODAL) ───────────────────────────────────
async function openNuevaAuditoria() {
  await cargarZonas();
  
  // Limpiar form
  document.getElementById('fZona').value = '';
  document.getElementById('fTipo').value = 'HIGIENE';
  document.getElementById('fObs').value = '';
  
  // Generar checklist base según tipo
  renderChecklist('HIGIENE');
  
  document.getElementById('fTipo').addEventListener('change', (e) => renderChecklist(e.target.value));
  
  openModal('modalNuevaAudit');
}

function renderChecklist(tipo) {
  let items = [];
  if (tipo === 'HIGIENE') {
    items = [
      'Pisos limpios y sin residuos',
      'Superficies de trabajo desinfectadas',
      'Equipos libres de grasa incrustada',
      'Cámaras de frío a temperatura adecuada (< 4°C)',
      'Contenedores de basura con tapa y vacíos',
      'Personal usa red para cabello y guantes'
    ];
  } else if (tipo === 'SEGURIDAD') {
    items = [
      'Extintores accesibles y con carga vigente',
      'Señales de evacuación visibles e iluminadas',
      'Pasillos libres de obstáculos',
      'Botiquín de primeros auxilios completo'
    ];
  } else {
    items = [
      'Luces y focos operativos',
      'Extractores de aire funcionando sin ruido anormal',
      'Sistemas de agua sin fugas ni goteos',
      'Mobiliario sin daños o astillas'
    ];
  }
  
  const c = document.getElementById('checklistContainer');
  let html = '';
  items.forEach((it, idx) => {
    html += `
      <div class="chk-row">
        <input type="checkbox" id="chk_${idx}" class="audit-cb" checked>
        <div style="flex:1">
          <div style="font-weight:600;font-size:.9rem">${esc(it)}</div>
          <input type="hidden" class="audit-item-name" value="${esc(it)}">
          <input type="text" class="audit-obs" placeholder="Observación si no cumple..." style="width:100%;font-size:.8rem;margin-top:5px;display:none">
        </div>
      </div>
    `;
  });
  c.innerHTML = html;
  
  // Toggle input text if unchecked
  document.querySelectorAll('.audit-cb').forEach(cb => {
    cb.addEventListener('change', function() {
      const obsInput = this.parentElement.querySelector('.audit-obs');
      obsInput.style.display = this.checked ? 'none' : 'block';
      if(this.checked) obsInput.value = '';
    });
  });
}

async function guardarAuditoria() {
  const zona_id = parseInt(document.getElementById('fZona').value);
  if(!zona_id) return showToast('Debe seleccionar una zona', 'error');
  
  const detalles = [];
  const rows = document.querySelectorAll('.chk-row');
  rows.forEach(r => {
    detalles.push({
      item_evaluado: r.querySelector('.audit-item-name').value,
      cumple: r.querySelector('.audit-cb').checked,
      observacion: r.querySelector('.audit-obs').value || null
    });
  });
  
  const payload = {
    zona_id,
    tipo: document.getElementById('fTipo').value,
    observaciones: document.getElementById('fObs').value,
    detalles
  };
  
  try {
    await apiFetch('/api/auditoria', 'POST', payload);
    showToast('Auditoría guardada exitosamente', 'success');
    closeModal('modalNuevaAudit');
    await loadAuditorias();
  } catch(e) { showToast(e.message, 'error'); }
}

// ── DESCARGAR EXCEL ───────────────────────────────────────────
function descargarExcel() {
  const token = localStorage.getItem('scgrh_token');
  if(!token) return;
  // Como es descarga binaria, abrimos en una nueva pestaña (el middleware extraerá el token de la cookie si está, o debemos pasarlo por query)
  // Nota: Express auth middleware chequea Bearer Token. 
  // En aplicaciones SPA, para descargar archivos por href, podemos hacer un fetch que genere un blob y lo descargue.
  
  const btn = document.querySelector('.rep-card button');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';
  
  fetch('http://localhost:3000/api/auditoria/reportes/empleados/excel', {
    headers: { 'Authorization': 'Bearer ' + token }
  })
  .then(res => {
    if(!res.ok) throw new Error('Error al generar Excel');
    return res.blob();
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Reporte_Empleados.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    btn.innerHTML = '<i class="fa-solid fa-download"></i> Descargar Excel';
  })
  .catch(err => {
    showToast(err.message, 'error');
    btn.innerHTML = '<i class="fa-solid fa-download"></i> Descargar Excel';
  });
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
