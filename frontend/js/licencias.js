if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allLicencias = [];
let allPermisos = [];

async function loadFormCatalogs() {
  const [contRes, tipoRes] = await Promise.all([
    apiFetch('/contratos'),
    apiFetch('/licencias/catalogs/tipos')
  ]);

  if (contRes && contRes.ok) {
    const activeContratos = contRes.data.filter(c => c.estado === 'VIGENTE').map(c => `<option value="${c.id}">${c.colaborador_nombre} (Contrato: ${c.codigo})</option>`).join('');
    document.getElementById('lContrato').innerHTML = '<option value="">Seleccionar contrato...</option>' + activeContratos;
    document.getElementById('pContrato').innerHTML = '<option value="">Seleccionar contrato...</option>' + activeContratos;
  }

  if (tipoRes && tipoRes.ok) {
    document.getElementById('lTipo').innerHTML = '<option value="">Seleccionar tipo...</option>' +
      tipoRes.data.map(t => `<option value="${t.id}">${t.descripcion} (${t.con_goce_haber ? 'Con Goce' : 'Sin Goce'})</option>`).join('');
  }
}

async function loadData() {
  const [licRes, permRes] = await Promise.all([
    apiFetch('/licencias/licencias'),
    apiFetch('/licencias/permisos')
  ]);

  if (licRes && licRes.ok) {
    allLicencias = licRes.data;
    renderLicencias(allLicencias);
  }

  if (permRes && permRes.ok) {
    allPermisos = permRes.data;
    renderPermisos(allPermisos);
  }
}

function renderLicencias(data) {
  const tbody = document.getElementById('tablaLicenciasBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-briefcase-medical"></i><p>No hay licencias registradas</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(l => {
    let badgeClass = 'badge-muted';
    if (l.estado === 'APROBADA') badgeClass = 'badge-success';
    if (l.estado === 'RECHAZADA') badgeClass = 'badge-danger';
    if (l.estado === 'PENDIENTE') badgeClass = 'badge-info';

    const sustento = l.sustento_url 
      ? `<a href="${l.sustento_url}" target="_blank" style="color:var(--accent);text-decoration:none"><i class="fa-solid fa-file-pdf"></i> Ver Sustento</a>`
      : '<span style="color:var(--text-muted)">Sin sustento</span>';

    return `
      <tr>
        <td><strong>${l.colaborador_nombre}</strong><br/><span style="font-size:0.75rem;color:var(--text-muted)">Contrato: ${l.contrato_codigo}</span></td>
        <td><strong>${l.tipo_licencia_descripcion}</strong></td>
        <td>${l.fecha_inicio.split('T')[0]}</td>
        <td>${l.fecha_fin.split('T')[0]}</td>
        <td>${Number(l.dias_totales).toFixed(0)} día(s)</td>
        <td>
          <span style="font-size:0.8rem">${l.motivo || '—'}</span><br/>
          ${sustento}
        </td>
        <td><span class="badge ${badgeClass}">${l.estado}</span></td>
        <td>
          <div class="table-actions">
            ${l.estado === 'PENDIENTE'
              ? `<button class="action-btn edit" title="Resolver" onclick="openResolver('LICENCIA', ${l.id})"><i class="fa-solid fa-circle-check"></i></button>`
              : '<span style="color:var(--text-muted);font-size:0.75rem">—</span>'
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderPermisos(data) {
  const tbody = document.getElementById('tablaPermisosBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-clock"></i><p>No hay permisos registrados</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(p => {
    let badgeClass = 'badge-muted';
    if (p.estado === 'APROBADO') badgeClass = 'badge-success';
    if (p.estado === 'RECHAZADO') badgeClass = 'badge-danger';
    if (p.estado === 'PENDIENTE') badgeClass = 'badge-info';

    return `
      <tr>
        <td><strong>${p.colaborador_nombre}</strong><br/><span style="font-size:0.75rem;color:var(--text-muted)">Contrato: ${p.contrato_codigo}</span></td>
        <td>${p.fecha.split('T')[0]}</td>
        <td><span class="badge badge-muted">${p.hora_inicio} - ${p.hora_fin}</span></td>
        <td><span style="font-size:0.8rem">${p.motivo}</span></td>
        <td><span class="badge ${p.con_goce_haber ? 'badge-success' : 'badge-danger'}">${p.con_goce_haber ? 'Con Goce' : 'Sin Goce'}</span></td>
        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
        <td>
          <div class="table-actions">
            ${p.estado === 'PENDIENTE'
              ? `<button class="action-btn edit" title="Resolver" onclick="openResolver('PERMISO', ${p.id})"><i class="fa-solid fa-circle-check"></i></button>`
              : '<span style="color:var(--text-muted);font-size:0.75rem">—</span>'
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── CRUD Licencia ──
async function openCreateLicencia() {
  document.getElementById('formLicencia').reset();
  await loadFormCatalogs();
  openModal('modalLicencia');
}

function calcularDiasLicencia() {
  const inicio = document.getElementById('lFechaInicio').value;
  const fin = document.getElementById('lFechaFin').value;
  if (!inicio || !fin) return;

  const dateIni = new Date(inicio);
  const dateFin = new Date(fin);
  
  if (dateFin < dateIni) {
    document.getElementById('lDias').value = 0;
    return;
  }

  const diffTime = Math.abs(dateFin - dateIni);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  document.getElementById('lDias').value = diffDays;
}

async function submitLicencia(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitLicencia');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    contrato_id:      parseInt(document.getElementById('lContrato').value),
    tipo_licencia_id: parseInt(document.getElementById('lTipo').value),
    fecha_inicio:     document.getElementById('lFechaInicio').value,
    fecha_fin:        document.getElementById('lFechaFin').value,
    dias_totales:     parseFloat(document.getElementById('lDias').value),
    motivo:           document.getElementById('lMotivo').value.trim(),
    sustento_url:     document.getElementById('lSustento').value.trim()
  };

  const res = await apiFetch('/licencias/licencias', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Registrar';

  if (res && res.ok) {
    showToast('Licencia registrada en revisión ✔', 'success');
    closeModal('modalLicencia');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

// ── CRUD Permisos ──
async function openCreatePermiso() {
  document.getElementById('formPermiso').reset();
  await loadFormCatalogs();
  openModal('modalPermiso');
}

async function submitPermiso(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitPermiso');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    contrato_id:    parseInt(document.getElementById('pContrato').value),
    fecha:          document.getElementById('pFecha').value,
    hora_inicio:    document.getElementById('pHoraInicio').value,
    hora_fin:       document.getElementById('pHoraFin').value,
    con_goce_haber: parseInt(document.getElementById('pConGoce').value) === 1,
    motivo:         document.getElementById('pMotivo').value.trim()
  };

  const res = await apiFetch('/licencias/permisos', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Enviar';

  if (res && res.ok) {
    showToast('Permiso de salida enviado a revisión ✔', 'success');
    closeModal('modalPermiso');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

// ── Resoluciones (Aprobar / Rechazar) ──
function openResolver(tipo, id) {
  const url = tipo === 'LICENCIA' ? '/licencias/licencias/procesar' : '/licencias/permisos/procesar';
  
  document.getElementById('btnAprobar').onclick = () => procesarResolucion(url, id, tipo === 'LICENCIA' ? 'APROBADA' : 'APROBADO');
  document.getElementById('btnRechazar').onclick = () => procesarResolucion(url, id, tipo === 'LICENCIA' ? 'RECHAZADA' : 'RECHAZADO');
  
  openModal('modalResolver');
}

async function procesarResolucion(url, id, estado) {
  const res = await apiFetch(url, {
    method: 'POST',
    body: JSON.stringify({ id, estado })
  });

  if (res && res.ok) {
    showToast(`Solicitud resuelta como: ${estado} ✔`, estado.includes('APROB') ? 'success' : 'warning');
    closeModal('modalResolver');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

loadData();
