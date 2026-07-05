if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];
let editingId = null;

async function loadAreas() {
  const res = await apiFetch('/areas');
  const sel = document.getElementById('fArea');
  sel.innerHTML = '<option value="">Seleccionar área...</option>' +
    (res?.data || []).map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
}

async function loadData() {
  const res = await apiFetch('/cargos');
  if (!res || !res.ok) { showToast('Error al cargar cargos', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

const nivelLabel = { 1:'Operativo',2:'Técnico',3:'Coordinador',4:'Supervisor',5:'Jefatura',6:'Gerencia',7:'Dirección' };

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i class="fa-solid fa-id-badge"></i><p>No hay cargos registrados</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((c, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="font-size:.78rem;color:#A78BFA">${c.codigo}</code></td>
      <td><strong>${c.nombre}</strong></td>
      <td>${c.area_nombre}</td>
      <td><span class="badge badge-muted">${nivelLabel[c.nivel_jerarquico] || c.nivel_jerarquico}</span></td>
      <td style="color:var(--success)">${c.salario_min ? 'S/. ' + Number(c.salario_min).toFixed(2) : '—'}</td>
      <td style="color:var(--gold)">${c.salario_max ? 'S/. ' + Number(c.salario_max).toFixed(2) : '—'}</td>
      <td><span class="badge ${c.activo ? 'badge-success' : 'badge-danger'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td><div class="table-actions">
        <button class="action-btn edit" onclick="editItem(${c.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete" onclick="confirmDelete(${c.id})"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>
  `).join('');
}

function filterTable(q) {
  renderTable(allData.filter(c =>
    c.nombre.toLowerCase().includes(q.toLowerCase()) ||
    c.codigo.toLowerCase().includes(q.toLowerCase()) ||
    c.area_nombre.toLowerCase().includes(q.toLowerCase())
  ));
}

function resetForm() {
  editingId = null;
  document.getElementById('mainForm').reset();
  document.getElementById('fActivo').value = '1';
  document.getElementById('fNivel').value = '1';
  document.getElementById('modalTitle').textContent = 'Nuevo Cargo';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}

function openCreate() { resetForm(); loadAreas(); openModal('modalForm'); }

async function editItem(id) {
  const res = await apiFetch(`/cargos/${id}`);
  if (!res || !res.ok) { showToast('Error al cargar datos', 'error'); return; }
  const c = res.data;
  editingId = id;
  await loadAreas();
  document.getElementById('fArea').value   = c.area_id;
  document.getElementById('fCodigo').value = c.codigo || '';
  document.getElementById('fNombre').value = c.nombre || '';
  document.getElementById('fDesc').value   = c.descripcion || '';
  document.getElementById('fNivel').value  = c.nivel_jerarquico;
  document.getElementById('fSMin').value   = c.salario_min || '';
  document.getElementById('fSMax').value   = c.salario_max || '';
  document.getElementById('fActivo').value = c.activo ? '1' : '0';
  document.getElementById('modalTitle').textContent = 'Editar Cargo';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar';
  openModal('modalForm');
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';
  const body = {
    area_id:          parseInt(document.getElementById('fArea').value),
    codigo:           document.getElementById('fCodigo').value.trim(),
    nombre:           document.getElementById('fNombre').value.trim(),
    descripcion:      document.getElementById('fDesc').value.trim(),
    nivel_jerarquico: parseInt(document.getElementById('fNivel').value),
    salario_min:      parseFloat(document.getElementById('fSMin').value) || null,
    salario_max:      parseFloat(document.getElementById('fSMax').value) || null,
    activo:           parseInt(document.getElementById('fActivo').value)
  };
  const res = editingId
    ? await apiFetch(`/cargos/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/cargos', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
  if (res && res.ok) { showToast(editingId ? 'Cargo actualizado ✔' : 'Cargo creado ✔', 'success'); closeModal('modalForm'); loadData(); }
  else showToast(res?.message || 'Error al guardar', 'error');
}

let deleteId = null;
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/cargos/${deleteId}`, { method: 'DELETE' });
    if (res && res.ok) { showToast('Cargo desactivado', 'warning'); closeModal('modalConfirm'); loadData(); }
    else showToast(res?.message || 'Error', 'error');
  };
  openModal('modalConfirm');
}

loadData();
