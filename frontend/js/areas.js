if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];
let editingId = null;

async function loadSelects() {
  const [empRes, areaRes] = await Promise.all([
    apiFetch('/empresas'),
    apiFetch('/areas')
  ]);
  const selEmp = document.getElementById('fEmpresa');
  selEmp.innerHTML = '<option value="">Seleccionar empresa...</option>' +
    (empRes?.data || []).map(e => `<option value="${e.id}">${e.razon_social}</option>`).join('');
  const selPadre = document.getElementById('fPadre');
  selPadre.innerHTML = '<option value="">Sin área padre</option>' +
    (areaRes?.data || []).map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
}

async function loadData() {
  const res = await apiFetch('/areas');
  if (!res || !res.ok) { showToast('Error al cargar áreas', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-sitemap"></i><p>No hay áreas registradas</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((a, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="font-size:.78rem;color:var(--success)">${a.codigo}</code></td>
      <td><strong>${a.nombre}</strong></td>
      <td>${a.empresa_nombre}</td>
      <td>${a.area_padre_nombre || '<span style="color:var(--text-muted)">Raíz</span>'}</td>
      <td><span class="badge badge-info">${a.total_cargos} cargo(s)</span></td>
      <td><span class="badge ${a.activo ? 'badge-success' : 'badge-danger'}">${a.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td><div class="table-actions">
        <button class="action-btn edit" onclick="editItem(${a.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete" onclick="confirmDelete(${a.id})"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>
  `).join('');
}

function filterTable(q) {
  renderTable(allData.filter(a =>
    a.nombre.toLowerCase().includes(q.toLowerCase()) ||
    a.codigo.toLowerCase().includes(q.toLowerCase())
  ));
}

function resetForm() {
  editingId = null;
  document.getElementById('mainForm').reset();
  document.getElementById('fActivo').value = '1';
  document.getElementById('modalTitle').textContent = 'Nueva Área';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}

function openCreate() { resetForm(); loadSelects(); openModal('modalForm'); }

async function editItem(id) {
  const res = await apiFetch(`/areas/${id}`);
  if (!res || !res.ok) { showToast('Error al cargar datos', 'error'); return; }
  const a = res.data;
  editingId = id;
  await loadSelects();
  document.getElementById('fEmpresa').value = a.empresa_id;
  document.getElementById('fPadre').value   = a.area_padre_id || '';
  document.getElementById('fCodigo').value  = a.codigo || '';
  document.getElementById('fNombre').value  = a.nombre || '';
  document.getElementById('fDesc').value    = a.descripcion || '';
  document.getElementById('fActivo').value  = a.activo ? '1' : '0';
  document.getElementById('modalTitle').textContent = 'Editar Área';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar';
  openModal('modalForm');
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';
  const body = {
    empresa_id:    parseInt(document.getElementById('fEmpresa').value),
    area_padre_id: document.getElementById('fPadre').value || null,
    codigo:        document.getElementById('fCodigo').value.trim(),
    nombre:        document.getElementById('fNombre').value.trim(),
    descripcion:   document.getElementById('fDesc').value.trim(),
    activo:        parseInt(document.getElementById('fActivo').value)
  };
  const res = editingId
    ? await apiFetch(`/areas/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/areas', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
  if (res && res.ok) { showToast(editingId ? 'Área actualizada ✔' : 'Área creada ✔', 'success'); closeModal('modalForm'); loadData(); }
  else showToast(res?.message || 'Error al guardar', 'error');
}

let deleteId = null;
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/areas/${deleteId}`, { method: 'DELETE' });
    if (res && res.ok) { showToast('Área desactivada', 'warning'); closeModal('modalConfirm'); loadData(); }
    else showToast(res?.message || 'Error', 'error');
  };
  openModal('modalConfirm');
}

loadData();
