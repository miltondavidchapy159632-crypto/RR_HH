if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];
let editingId = null;

async function loadEmpresas() {
  const res = await apiFetch('/empresas');
  if (!res || !res.ok) { showToast('Error al cargar empresas', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="9">
      <div class="empty-state"><i class="fa-solid fa-building"></i><p>No hay empresas registradas</p></div>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((e, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><code style="font-size:.78rem;color:var(--accent)">${e.ruc}</code></td>
      <td><strong>${e.razon_social}</strong></td>
      <td>${e.nombre_comercial || '<span style="color:var(--text-muted)">—</span>'}</td>
      <td>${e.telefono || '—'}</td>
      <td><span class="badge badge-info">${e.total_sucursales} sucursal(es)</span></td>
      <td><span class="badge ${e.activo ? 'badge-success' : 'badge-danger'}">${e.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td>${e.fecha_creacion || '—'}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" title="Editar" onclick="editItem(${e.id})"><i class="fa-solid fa-pen"></i></button>
          <button class="action-btn delete" title="Eliminar" onclick="confirmDelete(${e.id})"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterTable(q) {
  const filtered = allData.filter(e =>
    e.razon_social.toLowerCase().includes(q.toLowerCase()) ||
    e.ruc.includes(q) ||
    (e.nombre_comercial || '').toLowerCase().includes(q.toLowerCase())
  );
  renderTable(filtered);
}

function resetForm() {
  editingId = null;
  document.getElementById('formEmpresa').reset();
  document.getElementById('fActivo').value = '1';
  document.getElementById('modalTitle').textContent = 'Nueva Empresa';
  document.getElementById('modalSubtitle').textContent = 'Completa los datos de la empresa';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}

function openCreate() {
  resetForm();
  openModal('modalEmpresa');
}

async function editItem(id) {
  const res = await apiFetch(`/empresas/${id}`);
  if (!res || !res.ok) { showToast('Error al cargar datos', 'error'); return; }
  const e = res.data;
  editingId = id;
  document.getElementById('fRuc').value           = e.ruc || '';
  document.getElementById('fRazonSocial').value    = e.razon_social || '';
  document.getElementById('fNombreComercial').value= e.nombre_comercial || '';
  document.getElementById('fDireccion').value      = e.direccion_fiscal || '';
  document.getElementById('fTelefono').value       = e.telefono || '';
  document.getElementById('fEmail').value          = e.email_corporativo || '';
  document.getElementById('fActivo').value         = e.activo ? '1' : '0';
  document.getElementById('modalTitle').textContent    = 'Editar Empresa';
  document.getElementById('modalSubtitle').textContent = `ID: ${id}`;
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar';
  openModal('modalEmpresa');
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.innerHTML = '<div class="loader"></div> Guardando...';

  const body = {
    ruc:               document.getElementById('fRuc').value.trim(),
    razon_social:      document.getElementById('fRazonSocial').value.trim(),
    nombre_comercial:  document.getElementById('fNombreComercial').value.trim(),
    direccion_fiscal:  document.getElementById('fDireccion').value.trim(),
    telefono:          document.getElementById('fTelefono').value.trim(),
    email_corporativo: document.getElementById('fEmail').value.trim(),
    activo:            parseInt(document.getElementById('fActivo').value)
  };

  const res = editingId
    ? await apiFetch(`/empresas/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/empresas', { method:'POST', body: JSON.stringify(body) });

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';

  if (res && res.ok) {
    showToast(editingId ? 'Empresa actualizada ✔' : 'Empresa creada ✔', 'success');
    closeModal('modalEmpresa');
    loadEmpresas();
  } else {
    showToast(res?.message || 'Error al guardar', 'error');
  }
}

let deleteId = null;
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/empresas/${deleteId}`, { method: 'DELETE' });
    if (res && res.ok) {
      showToast('Empresa desactivada', 'warning');
      closeModal('modalConfirm');
      loadEmpresas();
    } else {
      showToast(res?.message || 'Error', 'error');
    }
  };
  openModal('modalConfirm');
}

// Sobrescribir el onclick del botón Nueva
document.getElementById('btnNueva').onclick = openCreate;

loadEmpresas();
