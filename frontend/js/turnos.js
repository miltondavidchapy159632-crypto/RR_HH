if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];
let editingId = null;

async function loadEmpresas() {
  const res = await apiFetch('/empresas');
  if (!res || !res.ok) return;
  document.getElementById('fEmpresa').innerHTML = '<option value="">Seleccionar empresa...</option>' +
    res.data.map(e => `<option value="${e.id}">${e.razon_social}</option>`).join('');
}

async function loadData() {
  const res = await apiFetch('/turnos');
  if (!res || !res.ok) { showToast('Error al cargar turnos', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><i class="fa-solid fa-business-time"></i><p>No hay turnos registrados</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="font-size:.78rem;color:var(--accent)">${t.codigo}</code></td>
      <td><strong>${t.nombre}</strong></td>
      <td><span class="badge badge-info"><i class="fa-regular fa-clock"></i> ${t.hora_entrada}</span></td>
      <td><span class="badge badge-warning"><i class="fa-regular fa-clock"></i> ${t.hora_salida}</span></td>
      <td>${t.tolerancia_min} min</td>
      <td>${Number(t.horas_diarias).toFixed(1)} hrs</td>
      <td><span class="badge badge-muted">${t.nocturno ? 'Sí' : 'No'}</span></td>
      <td><span class="badge ${t.activo ? 'badge-success' : 'badge-danger'}">${t.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td><div class="table-actions">
        <button class="action-btn edit" onclick="editItem(${t.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete" onclick="confirmDelete(${t.id})"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>
  `).join('');
}

function filterTable(q) {
  renderTable(allData.filter(t =>
    t.nombre.toLowerCase().includes(q.toLowerCase()) ||
    t.codigo.toLowerCase().includes(q.toLowerCase())
  ));
}

function resetForm() {
  editingId = null;
  document.getElementById('mainForm').reset();
  document.getElementById('fActivo').value = '1';
  document.getElementById('fTolerancia').value = '5';
  document.getElementById('fHorasDiarias').value = '8.0';
  document.getElementById('fNocturno').checked = false;
  document.getElementById('modalTitle').textContent = 'Nuevo Turno';
  document.getElementById('modalSubtitle').textContent = 'Define el horario diario del turno laboral';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}

async function openCreate() {
  resetForm();
  await loadEmpresas();
  openModal('modalForm');
}

async function editItem(id) {
  const res = await apiFetch(`/turnos/${id}`);
  if (!res || !res.ok) { showToast('Error al cargar datos del turno', 'error'); return; }
  const t = res.data;
  editingId = id;
  await loadEmpresas();

  document.getElementById('fEmpresa').value     = t.empresa_id;
  document.getElementById('fCodigo').value      = t.codigo || '';
  document.getElementById('fNombre').value      = t.nombre || '';
  document.getElementById('fHoraEntrada').value  = t.hora_entrada || '';
  document.getElementById('fHoraSalida').value   = t.hora_salida || '';
  document.getElementById('fTolerancia').value  = t.tolerancia_min;
  document.getElementById('fHorasDiarias').value = t.horas_diarias;
  document.getElementById('fNocturno').checked  = !!t.nocturno;
  document.getElementById('fActivo').value      = t.activo ? '1' : '0';

  document.getElementById('modalTitle').textContent    = 'Editar Turno';
  document.getElementById('modalSubtitle').textContent = `Turno ID: ${id}`;
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar';
  openModal('modalForm');
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    empresa_id:     parseInt(document.getElementById('fEmpresa').value),
    codigo:         document.getElementById('fCodigo').value.trim(),
    nombre:         document.getElementById('fNombre').value.trim(),
    hora_entrada:   document.getElementById('fHoraEntrada').value,
    hora_salida:    document.getElementById('fHoraSalida').value,
    tolerancia_min: parseInt(document.getElementById('fTolerancia').value),
    horas_diarias:  parseFloat(document.getElementById('fHorasDiarias').value),
    nocturno:       document.getElementById('fNocturno').checked,
    activo:         parseInt(document.getElementById('fActivo').value)
  };

  const res = editingId
    ? await apiFetch(`/turnos/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/turnos', { method:'POST', body: JSON.stringify(body) });

  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';

  if (res && res.ok) {
    showToast(editingId ? 'Turno actualizado ✔' : 'Turno creado ✔', 'success');
    closeModal('modalForm');
    loadData();
  } else {
    showToast(res?.message || 'Error al guardar el turno', 'error');
  }
}

let deleteId = null;
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/turnos/${deleteId}`, { method: 'DELETE' });
    if (res && res.ok) {
      showToast('Turno desactivado', 'warning');
      closeModal('modalConfirm');
      loadData();
    } else {
      showToast(res?.message || 'Error', 'error');
    }
  };
  openModal('modalConfirm');
}

loadData();
