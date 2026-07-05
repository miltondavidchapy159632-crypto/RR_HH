if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allPlanillas = [];
let activePlanillaId = null;

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.getElementById(tabId).style.display = 'block';

  // Toggle button styling
  const btns = document.querySelectorAll('.page-content .btn');
  if (tabId === 'tab-planillas') {
    btns[0].className = 'btn btn-primary btn-sm';
    btns[1].className = 'btn btn-secondary btn-sm';
  } else {
    btns[0].className = 'btn btn-secondary btn-sm';
    btns[1].className = 'btn btn-primary btn-sm';
    loadBancos();
  }
}

async function loadEmpresas() {
  const res = await apiFetch('/empresas');
  if (res && res.ok) {
    document.getElementById('pEmpresa').innerHTML = '<option value="">Seleccionar empresa...</option>' +
      res.data.filter(e => e.activo).map(e => `<option value="${e.id}">${e.razon_social}</option>`).join('');
  }
}

async function cargarSucursales() {
  const empId = document.getElementById('pEmpresa').value;
  const select = document.getElementById('pSucursal');
  if (!empId) {
    select.innerHTML = '<option value="">Seleccionar empresa primero...</option>';
    return;
  }
  const res = await apiFetch(`/sucursales?empresa_id=${empId}`);
  if (res && res.ok) {
    select.innerHTML = '<option value="">Seleccionar sucursal...</option>' +
      res.data.filter(s => s.activo).map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
  }
}

async function loadData() {
  const res = await apiFetch('/planillas');
  if (res && res.ok) {
    allPlanillas = res.data;
    renderPlanillas(allPlanillas);
  }
}

function renderPlanillas(data) {
  const tbody = document.getElementById('tablaPlanillasBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-calculator"></i><p>No hay planillas de sueldos procesadas</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(p => {
    let badgeClass = 'badge-muted';
    if (p.estado === 'APROBADA') badgeClass = 'badge-success';
    if (p.estado === 'PAGADA')   badgeClass = 'badge-primary';
    if (p.estado === 'BORRADOR') badgeClass = 'badge-info';
    if (p.estado === 'PRE_NOMINA') badgeClass = 'badge-warning';

    const ingresos = p.total_ingresos ? `S/ ${Number(p.total_ingresos).toFixed(2)}` : '—';
    const descuentos = p.total_descuentos ? `S/ ${Number(p.total_descuentos).toFixed(2)}` : '—';
    const neto = p.total_neto ? `S/ ${Number(p.total_neto).toFixed(2)}` : '—';

    return `
      <tr>
        <td><strong>${p.periodo}</strong></td>
        <td>${p.empresa_nombre}</td>
        <td>${p.sucursal_nombre || '—'}</td>
        <td><span class="badge badge-muted">${p.tipo}</span></td>
        <td><span style="color:var(--success)">${ingresos}</span></td>
        <td><span style="color:var(--danger)">${descuentos}</span></td>
        <td><strong>${neto}</strong></td>
        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
        <td>
          <div class="table-actions">
            <button class="action-btn edit" title="Ver Detalle / Calcular" onclick="verDetallePlanilla(${p.id}, '${p.periodo}', '${p.estado}')"><i class="fa-solid fa-folder-open"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Ver Detalle de planilla seleccionada ──
async function verDetallePlanilla(id, periodo, estado) {
  activePlanillaId = id;
  document.getElementById('detPlanillaTitulo').textContent = `Detalle de Planilla — Periodo: ${periodo} (${estado})`;
  document.getElementById('detallePlanillaSeccion').style.display = 'block';

  // Ocultar botones de cálculo/aprobación si ya está aprobada
  const btnCalcular = document.getElementById('btnCalcular');
  const btnAprobar = document.getElementById('btnAprobar');
  if (estado === 'APROBADA' || estado === 'PAGADA') {
    btnCalcular.style.display = 'none';
    btnAprobar.style.display = 'none';
  } else {
    btnCalcular.style.display = 'inline-flex';
    btnAprobar.style.display = 'inline-flex';
  }

  loadDetalleTable();
}

async function loadDetalleTable() {
  const res = await apiFetch(`/planillas/${activePlanillaId}/detalle`);
  const tbody = document.getElementById('tablaDetalleBody');
  if (!res || !res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text-muted)">Haz clic en Calcular para procesar los sueldos del periodo.</td></tr>`;
    return;
  }

  tbody.innerHTML = res.data.map(d => `
    <tr>
      <td><strong>${d.colaborador_nombre}</strong></td>
      <td><code style="font-size:.78rem;color:var(--accent)">${d.contrato_codigo}</code></td>
      <td>S/ ${Number(d.salario_base).toFixed(2)}</td>
      <td><span style="color:var(--success)">S/ ${Number(d.total_ingresos).toFixed(2)}</span></td>
      <td><span style="color:var(--danger)">S/ ${Number(d.total_descuentos).toFixed(2)}</span></td>
      <td><strong>S/ ${Number(d.neto_pagar).toFixed(2)}</strong></td>
      <td>
        <button class="action-btn edit" title="Ver Boleta de Pago" onclick="verBoleta(${d.id})"><i class="fa-solid fa-receipt"></i></button>
      </td>
    </tr>
  `).join('');
}

// ── Ejecutar Lógica de Procesamiento de Planilla (Calcular / Recalcular) ──
async function ejecutarCalculo() {
  const btn = document.getElementById('btnCalcular');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const res = await apiFetch('/planillas/calcular', {
    method: 'POST',
    body: JSON.stringify({ id: activePlanillaId })
  });

  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Calcular / Recalcular';

  if (res && res.ok) {
    showToast('Planilla calculada exitosamente ✔', 'success');
    loadData();
    loadDetalleTable();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

// ── Ejecutar Aprobación de Planilla (Genera Boletas y Bancos) ──
async function ejecutarAprobacion() {
  const btn = document.getElementById('btnAprobar');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const res = await apiFetch('/planillas/aprobar', {
    method: 'POST',
    body: JSON.stringify({ id: activePlanillaId })
  });

  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Aprobar y Generar Boletas';

  if (res && res.ok) {
    showToast('Planilla aprobada exitosamente. Boletas generadas ✔', 'success');
    document.getElementById('detallePlanillaSeccion').style.display = 'none';
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

// ── Ver boleta detallada ──
async function verBoleta(detalleId) {
  const res = await apiFetch(`/planillas/boleta/${detalleId}`);
  if (!res || !res.ok) { showToast('Error al cargar boleta', 'error'); return; }
  const b = res.data;

  // Rellenar cabecera
  document.getElementById('bEmpresa').textContent    = b.cabecera.empresa_nombre;
  document.getElementById('bEmpresaRuc').textContent = `RUC: ${b.cabecera.empresa_ruc}`;
  document.getElementById('bNroBoleta').textContent   = b.cabecera.nro_boleta;
  document.getElementById('bColaborador').textContent= b.cabecera.colaborador_nombre;
  document.getElementById('bPeriodo').textContent    = b.cabecera.periodo;
  document.getElementById('bNroDoc').textContent     = b.cabecera.nro_documento;
  document.getElementById('bCargo').textContent      = b.cabecera.cargo_nombre;
  document.getElementById('bIngreso').textContent    = b.cabecera.ingreso_fecha.split('T')[0];
  document.getElementById('bContrato').textContent   = b.cabecera.contrato_codigo;

  // Rellenar Conceptos
  const ingList = document.getElementById('bIngresosList');
  const desList = document.getElementById('bDescuentosList');

  // Separar ingresos y descuentos
  const ingresos = b.conceptos.filter(c => c.concepto_tipo === 'INGRESO');
  const descuentos = b.conceptos.filter(c => c.concepto_tipo === 'DESCUENTO');

  ingList.innerHTML = ingresos.map(i => `
    <div style="display:flex; justify-content:space-between">
      <span>${i.concepto_nombre}</span>
      <strong>S/ ${Number(i.monto).toFixed(2)}</strong>
    </div>
  `).join('');

  desList.innerHTML = descuentos.map(d => `
    <div style="display:flex; justify-content:space-between">
      <span>${d.concepto_nombre} ${d.referencia ? `<br/><small style="color:var(--text-muted);font-size:0.68rem">${d.referencia}</small>` : ''}</span>
      <strong style="color:var(--danger)">S/ ${Number(d.monto).toFixed(2)}</strong>
    </div>
  `).join('');

  // Rellenar totales
  document.getElementById('bTotalIngresos').textContent  = `S/ ${Number(b.cabecera.total_ingresos).toFixed(2)}`;
  document.getElementById('bTotalDescuentos').textContent= `S/ ${Number(b.cabecera.total_descuentos).toFixed(2)}`;
  document.getElementById('bNeto').textContent            = `S/ ${Number(b.cabecera.neto_pagar).toFixed(2)}`;

  openModal('modalBoleta');
}

// ── Cargar Archivos Bancarios (BCP) ──
async function loadBancos() {
  const res = await apiFetch('/planillas/config/bancos');
  const tbody = document.getElementById('tablaBancosBody');
  if (!res || !res.ok || !res.data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-building-columns"></i><p>No se han generado archivos bancarios de pago</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = res.data.map(ab => `
    <tr>
      <td><span style="font-family:monospace;font-size:0.8rem"><i class="fa-regular fa-file-lines" style="margin-right:8px;color:var(--accent)"></i>${ab.nombre_archivo}</span></td>
      <td><strong>${ab.banco_name || ab.banco_nombre}</strong></td>
      <td><span class="badge badge-muted">${ab.planilla_periodo}</span></td>
      <td>${ab.total_registros} colaboradores</td>
      <td><strong>S/ ${Number(ab.total_monto).toFixed(2)}</strong></td>
      <td><span class="badge badge-success">${ab.estado}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="showToast('Archivo descargado en formato de texto BCP ✔', 'success')"><i class="fa-solid fa-download"></i> Descargar TXT</button>
      </td>
    </tr>
  `).join('');
}

// ── CRUD Crear Cabecera ──
async function openCreatePlanilla() {
  document.getElementById('formPlanilla').reset();
  await loadEmpresas();
  openModal('modalPlanilla');
}

async function submitPlanilla(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitPlanilla');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    empresa_id:  parseInt(document.getElementById('pEmpresa').value),
    sucursal_id: parseInt(document.getElementById('pSucursal').value),
    periodo:     document.getElementById('pPeriodo').value,
    tipo:        document.getElementById('pTipo').value
  };

  const res = await apiFetch('/planillas', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-calculator"></i> Crear Borrador';

  if (res && res.ok) {
    showToast('Cabecera de planilla creada en borrador ✔', 'success');
    closeModal('modalPlanilla');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

loadData();
