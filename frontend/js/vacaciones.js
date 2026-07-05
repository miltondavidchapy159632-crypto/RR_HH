if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let saldos = [];
let solicitudes = [];
let activeSolicitudId = null;

async function loadCatalogs() {
  const [contRes, saldosRes] = await Promise.all([
    apiFetch('/contratos'),
    apiFetch('/vacaciones/saldos')
  ]);

  if (contRes && contRes.ok) {
    document.getElementById('sContrato').innerHTML = '<option value="">Seleccionar contrato...</option>' +
      contRes.data.filter(c => c.estado === 'VIGENTE').map(c => `<option value="${c.id}">${c.colaborador_nombre} (Contrato: ${c.codigo})</option>`).join('');
  }

  if (saldosRes && saldosRes.ok) {
    saldos = saldosRes.data;
    document.getElementById('vSaldoId').innerHTML = '<option value="">Seleccionar saldo disponible...</option>' +
      saldos.map(s => `<option value="${s.id}" data-saldo="${s.dias_saldo}">${s.colaborador_nombre} (Periodo: ${s.periodo_laboral} — Saldo: ${s.dias_saldo} días)</option>`).join('');
  }
}

async function loadData() {
  const [sRes, solRes] = await Promise.all([
    apiFetch('/vacaciones/saldos'),
    apiFetch('/vacaciones/solicitudes')
  ]);

  if (sRes && sRes.ok) {
    saldos = sRes.data;
    renderSaldos(saldos);
  }

  if (solRes && solRes.ok) {
    solicitudes = solRes.data;
    renderSolicitudes(solicitudes);
  }
}

function renderSaldos(data) {
  const tbody = document.getElementById('tablaSaldosBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-umbrella-beach"></i><p>No se han inicializado saldos vacacionales</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(s => `
    <tr>
      <td><strong>${s.colaborador_nombre}</strong></td>
      <td><code style="font-size:.78rem;color:var(--accent)">${s.contrato_codigo}</code></td>
      <td><span class="badge badge-info">${s.periodo_laboral}</span></td>
      <td>${Number(s.dias_generados).toFixed(0)} días</td>
      <td>${Number(s.dias_tomados).toFixed(0)} días</td>
      <td><strong style="color:var(--success)">${Number(s.dias_saldo).toFixed(0)} días</strong></td>
    </tr>
  `).join('');
}

function renderSolicitudes(data) {
  const tbody = document.getElementById('tablaSolicitudesBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-paper-plane"></i><p>No hay solicitudes de vacaciones registradas</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(sol => {
    let badgeClass = 'badge-muted';
    if (sol.estado === 'APROBADA') badgeClass = 'badge-success';
    if (sol.estado === 'RECHAZADA') badgeClass = 'badge-danger';
    if (sol.estado === 'PENDIENTE') badgeClass = 'badge-info';

    return `
      <tr>
        <td><strong>${sol.colaborador_nombre}</strong><br/><span style="font-size:0.75rem;color:var(--text-muted)">Contrato: ${sol.contrato_codigo}</span></td>
        <td><span class="badge badge-muted">${sol.periodo_laboral}</span></td>
        <td>${sol.fecha_inicio.split('T')[0]}</td>
        <td>${sol.fecha_fin.split('T')[0]}</td>
        <td><strong>${Number(sol.dias_solicitados).toFixed(0)} días</strong></td>
        <td><span style="font-size:0.8rem;color:var(--text-muted)">${sol.motivo || '—'}</span></td>
        <td><span class="badge ${badgeClass}">${sol.estado}</span></td>
        <td>
          <div class="table-actions">
            ${sol.estado === 'PENDIENTE'
              ? `<button class="action-btn edit" title="Resolver" onclick="openResolver(${sol.id})"><i class="fa-solid fa-circle-check"></i></button>`
              : '<span style="color:var(--text-muted);font-size:0.75rem">—</span>'
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── CRUD Saldos ──
async function openCreateSaldo() {
  document.getElementById('formSaldo').reset();
  await loadCatalogs();
  openModal('modalSaldo');
}

async function submitSaldo(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitSaldo');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    contrato_id:     parseInt(document.getElementById('sContrato').value),
    periodo_laboral: document.getElementById('sPeriodo').value.trim(),
    dias_generados:  parseFloat(document.getElementById('sGenerados').value)
  };

  const res = await apiFetch('/vacaciones/saldos', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Inicializar';

  if (res && res.ok) {
    showToast('Saldo vacacional inicializado', 'success');
    closeModal('modalSaldo');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

// ── CRUD Solicitudes ──
async function openCreateSolicitud() {
  document.getElementById('formSolicitud').reset();
  document.getElementById('diasDisponiblesInfo').textContent = '';
  await loadCatalogs();
  openModal('modalSolicitud');
}

function actualizarDiasRestantes() {
  const select = document.getElementById('vSaldoId');
  const option = select.options[select.selectedIndex];
  if (!option || !option.value) {
    document.getElementById('diasDisponiblesInfo').textContent = '';
    return;
  }
  const saldo = option.dataset.saldo;
  document.getElementById('diasDisponiblesInfo').textContent = `Días disponibles en este periodo: ${saldo} día(s)`;
}

function calcularDiasSolicitados() {
  const inicio = document.getElementById('vFechaInicio').value;
  const fin = document.getElementById('vFechaFin').value;
  if (!inicio || !fin) return;

  const dateIni = new Date(inicio);
  const dateFin = new Date(fin);
  
  if (dateFin < dateIni) {
    document.getElementById('vDias').value = 0;
    return;
  }

  // Calcular diferencia en días (inclusive)
  const diffTime = Math.abs(dateFin - dateIni);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  document.getElementById('vDias').value = diffDays;
}

async function submitSolicitud(e) {
  e.preventDefault();
  const select = document.getElementById('vSaldoId');
  const option = select.options[select.selectedIndex];
  const saldoDisponible = parseFloat(option.dataset.saldo);
  const diasSolicitados = parseFloat(document.getElementById('vDias').value);

  if (diasSolicitados > saldoDisponible) {
    showToast('El colaborador no cuenta con suficiente saldo disponible para este periodo vacacional.', 'error');
    return;
  }

  const btn = document.getElementById('btnSubmitSolicitud');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    vacaciones_id:    parseInt(select.value),
    fecha_inicio:     document.getElementById('vFechaInicio').value,
    fecha_fin:        document.getElementById('vFechaFin').value,
    dias_solicitados: diasSolicitados,
    motivo:           document.getElementById('vMotivo').value.trim()
  };

  const res = await apiFetch('/vacaciones/solicitudes', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud';

  if (res && res.ok) {
    showToast('Solicitud de vacaciones enviada ✔', 'success');
    closeModal('modalSolicitud');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

// ── Resolver Solicitudes (Aprobar/Rechazar) ──
function openResolver(id) {
  activeSolicitudId = id;
  openModal('modalResolver');
}

async function resolverSolicitud(estado) {
  const res = await apiFetch('/vacaciones/procesar', {
    method: 'POST',
    body: JSON.stringify({ id: activeSolicitudId, estado })
  });

  if (res && res.ok) {
    showToast(`Solicitud de vacaciones: ${estado} ✔`, estado === 'APROBADA' ? 'success' : 'warning');
    closeModal('modalResolver');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

loadData();
