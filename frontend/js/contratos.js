if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];
let editingId = null;

async function loadFormCatalogs() {
  const [perRes, catRes] = await Promise.all([
    apiFetch('/personas'),
    apiFetch('/contratos/catalogs')
  ]);

  if (perRes && perRes.ok) {
    // Solo permitir contratos a personas que tengan un expediente laboral creado
    document.getElementById('fColaborador').innerHTML = '<option value="">Seleccionar colaborador...</option>' +
      perRes.data.map(p => `<option value="${p.expediente_id}">${p.apellido_paterno} ${p.apellido_materno || ''}, ${p.nombres} (Expediente: ${p.expediente_codigo})</option>`).join('');
  }

  if (catRes && catRes.ok) {
    const cats = catRes.data;

    // Llenar tipo de contrato
    document.getElementById('fTipoContrato').innerHTML = '<option value="">Seleccionar...</option>' +
      cats.tipos_contrato.map(t => `<option value="${t.id}">${t.descripcion}</option>`).join('');

    // Llenar puestos
    document.getElementById('fPuesto').innerHTML = '<option value="">Seleccionar...</option>' +
      cats.puestos.map(p => `<option value="${p.id}">${p.cargo_nombre} — Sede: ${p.sucursal_nombre} (Plazas: ${p.plazas_ocupadas}/${p.cantidad_plazas})</option>`).join('');

    // Llenar centros de costo
    document.getElementById('fCentroCosto').innerHTML = '<option value="">Ninguno</option>' +
      cats.centros_costo.map(c => `<option value="${c.id}">${c.nombre} (${c.codigo})</option>`).join('');
  }
}

async function loadData() {
  const res = await apiFetch('/contratos');
  if (!res || !res.ok) { showToast('Error al cargar contratos', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-file-contract"></i><p>No hay contratos registrados</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((c, i) => {
    let badgeClass = 'badge-muted';
    if (c.estado === 'VIGENTE') badgeClass = 'badge-success';
    if (c.estado === 'RESCINDIDO' || c.estado === 'VENCIDO') badgeClass = 'badge-danger';
    if (c.estado === 'PENDIENTE_FIRMA') badgeClass = 'badge-warning';

    const fInicio = c.fecha_inicio ? c.fecha_inicio.split('T')[0] : '—';
    const fFin = c.fecha_fin ? c.fecha_fin.split('T')[0] : 'Indefinido';

    return `
      <tr>
        <td>${i + 1}</td>
        <td><code style="font-size:.78rem;color:var(--accent)">${c.codigo}</code></td>
        <td><strong>${c.colaborador_nombre}</strong></td>
        <td>
          <span style="font-size:0.8rem">${c.cargo_nombre}</span><br/>
          <span style="font-size:0.7rem;color:var(--text-muted)">Puesto: ${c.puesto_codigo}</span>
        </td>
        <td>${c.tipo_contrato_descripcion}</td>
        <td><span class="badge badge-muted">${c.modalidad}</span></td>
        <td style="color:var(--success)">S/. ${Number(c.salario_base).toFixed(2)}</td>
        <td style="font-size:0.75rem;white-space:nowrap">${fInicio} al ${fFin}</td>
        <td><span class="badge ${badgeClass}">${c.estado}</span></td>
        <td><div class="table-actions">
          <button class="action-btn edit" title="Editar" onclick="editItem(${c.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" title="Rescindir" onclick="confirmDelete(${c.id})"><i class="fa-solid fa-ban"></i></button>
        </div></td>
      </tr>
    `;
  }).join('');
}

function filterTable(q) {
  renderTable(allData.filter(c =>
    c.colaborador_nombre.toLowerCase().includes(q.toLowerCase()) ||
    c.codigo.toLowerCase().includes(q.toLowerCase()) ||
    c.cargo_nombre.toLowerCase().includes(q.toLowerCase())
  ));
}

function resetForm() {
  editingId = null;
  document.getElementById('mainForm').reset();
  document.getElementById('fEstado').value = 'BORRADOR';
  document.getElementById('fModalidad').value = 'PRESENCIAL';
  document.getElementById('fJornada').value = '8.0';
  document.getElementById('modalTitle').textContent = 'Generar Contrato';
  document.getElementById('modalSubtitle').textContent = 'Define los términos contractuales y puesto laboral';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}

async function openCreate() {
  resetForm();
  await loadFormCatalogs();
  openModal('modalForm');
}

async function editItem(id) {
  const res = await apiFetch(`/contratos/${id}`);
  if (!res || !res.ok) { showToast('Error al cargar datos', 'error'); return; }
  const c = res.data;
  editingId = id;
  await loadFormCatalogs();

  document.getElementById('fColaborador').value = c.expediente_id;
  document.getElementById('fCodigo').value      = c.codigo || '';
  document.getElementById('fEstado').value      = c.estado || 'BORRADOR';
  document.getElementById('fPuesto').value      = c.puesto_id;
  document.getElementById('fTipoContrato').value = c.tipo_contrato_id;
  document.getElementById('fCentroCosto').value  = c.centro_costo_id || '';
  document.getElementById('fModalidad').value    = c.modalidad || 'PRESENCIAL';

  if (c.fecha_inicio) document.getElementById('fFechaInicio').value = c.fecha_inicio.split('T')[0];
  if (c.fecha_fin) document.getElementById('fFechaFin').value = c.fecha_fin.split('T')[0];

  document.getElementById('fSalario').value     = c.salario_base;
  document.getElementById('fJornada').value     = c.jornada_horas;
  document.getElementById('fAltaTReg').checked  = !!c.alta_t_registro;
  document.getElementById('fNroRegT').value     = c.nro_registro_t || '';

  document.getElementById('modalTitle').textContent    = 'Editar Contrato';
  document.getElementById('modalSubtitle').textContent = `Contrato ID: ${id}`;
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar';
  openModal('modalForm');
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.innerHTML = '<div class="loader"></div>';

  const body = {
    expediente_id:    parseInt(document.getElementById('fColaborador').value),
    codigo:           document.getElementById('fCodigo').value.trim(),
    estado:           document.getElementById('fEstado').value,
    puesto_id:        parseInt(document.getElementById('fPuesto').value),
    tipo_contrato_id: parseInt(document.getElementById('fTipoContrato').value),
    centro_costo_id:  document.getElementById('fCentroCosto').value ? parseInt(document.getElementById('fCentroCosto').value) : null,
    modalidad:        document.getElementById('fModalidad').value,
    fecha_inicio:     document.getElementById('fFechaInicio').value,
    fecha_fin:        document.getElementById('fFechaFin').value || null,
    salario_base:     parseFloat(document.getElementById('fSalario').value),
    jornada_horas:    parseFloat(document.getElementById('fJornada').value),
    alta_t_registro:  document.getElementById('fAltaTReg').checked,
    nro_registro_t:   document.getElementById('fNroRegT').value.trim(),
  };

  const res = editingId
    ? await apiFetch(`/contratos/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/contratos', { method:'POST', body: JSON.stringify(body) });

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';

  if (res && res.ok) {
    showToast(editingId ? 'Contrato actualizado ✔' : 'Contrato registrado ✔', 'success');
    closeModal('modalForm');
    loadData();
  } else {
    showToast(res?.message || 'Error al guardar contrato', 'error');
  }
}

let deleteId = null;
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/contratos/${deleteId}`, { method: 'DELETE' });
    if (res && res.ok) {
      showToast('Contrato rescindido', 'warning');
      closeModal('modalConfirm');
      loadData();
    } else {
      showToast(res?.message || 'Error', 'error');
    }
  };
  openModal('modalConfirm');
}

loadData();
