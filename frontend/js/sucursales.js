if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];
let editingId = null;

async function loadEmpresas() {
  const res = await apiFetch('/empresas');
  if (!res || !res.ok) return;
  const sel = document.getElementById('fEmpresa');
  sel.innerHTML = '<option value="">Seleccionar empresa...</option>' +
    res.data.map(e => `<option value="${e.id}">${e.razon_social}</option>`).join('');
}

async function loadData() {
  const res = await apiFetch('/sucursales');
  if (!res || !res.ok) { showToast('Error al cargar sucursales', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-store"></i><p>No hay sucursales</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="font-size:.78rem;color:var(--accent)">${s.codigo}</code></td>
      <td><strong>${s.nombre}</strong></td>
      <td>${s.empresa_nombre}</td>
      <td>${s.direccion || '—'}</td>
      <td>${s.telefono || '—'}</td>
      <td><span class="badge ${s.activo ? 'badge-success' : 'badge-danger'}">${s.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td><div class="table-actions">
        <button class="action-btn edit" onclick="editItem(${s.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete" onclick="confirmDelete(${s.id})"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>
  `).join('');
}

function filterTable(q) {
  renderTable(allData.filter(s =>
    s.nombre.toLowerCase().includes(q.toLowerCase()) ||
    s.codigo.toLowerCase().includes(q.toLowerCase()) ||
    s.empresa_nombre.toLowerCase().includes(q.toLowerCase())
  ));
}

function resetForm() {
  editingId = null;
  document.getElementById('mainForm').reset();
  document.getElementById('fActivo').value = '1';
  document.getElementById('modalTitle').textContent = 'Nueva Sucursal';
  document.getElementById('modalSubtitle').textContent = 'Completa los datos';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}

function openCreate() { resetForm(); loadEmpresas(); openModal('modalForm'); }

async function editItem(id) {
  const res = await apiFetch(`/sucursales/${id}`);
  if (!res || !res.ok) { showToast('Error al cargar datos', 'error'); return; }
  const s = res.data;
  editingId = id;
  await loadEmpresas();
  document.getElementById('fEmpresa').value  = s.empresa_id;
  document.getElementById('fCodigo').value   = s.codigo || '';
  document.getElementById('fNombre').value   = s.nombre || '';
  document.getElementById('fDireccion').value= s.direccion || '';
  document.getElementById('fTelefono').value = s.telefono || '';
  document.getElementById('fEmail').value    = s.email || '';
  document.getElementById('fActivo').value   = s.activo ? '1' : '0';
  document.getElementById('modalTitle').textContent    = 'Editar Sucursal';
  document.getElementById('modalSubtitle').textContent = `ID: ${id}`;
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar';
  openModal('modalForm');
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';
  const body = {
    empresa_id: parseInt(document.getElementById('fEmpresa').value),
    codigo:     document.getElementById('fCodigo').value.trim(),
    nombre:     document.getElementById('fNombre').value.trim(),
    direccion:  document.getElementById('fDireccion').value.trim(),
    telefono:   document.getElementById('fTelefono').value.trim(),
    email:      document.getElementById('fEmail').value.trim(),
    activo:     parseInt(document.getElementById('fActivo').value)
  };
  const res = editingId
    ? await apiFetch(`/sucursales/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/sucursales', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
  if (res && res.ok) { showToast(editingId ? 'Actualizada ✔' : 'Creada ✔', 'success'); closeModal('modalForm'); loadData(); }
  else showToast(res?.message || 'Error al guardar', 'error');
}

let deleteId = null;
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/sucursales/${deleteId}`, { method: 'DELETE' });
    if (res && res.ok) { showToast('Sucursal desactivada', 'warning'); closeModal('modalConfirm'); loadData(); }
    else showToast(res?.message || 'Error', 'error');
  };
  openModal('modalConfirm');
}

loadData();
