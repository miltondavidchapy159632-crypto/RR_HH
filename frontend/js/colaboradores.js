if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];
let editingId = null;

async function loadCatalogs() {
  const res = await apiFetch('/personas/catalogs');
  if (!res || !res.ok) return;

  const cats = res.data;

  // Llenar select de tipos de documento
  document.getElementById('fTipoDoc').innerHTML =
    cats.tipos_documento.map(d => `<option value="${d.id}">${d.descripcion} (${d.codigo})</option>`).join('');

  // Llenar sexos
  document.getElementById('fSexo').innerHTML = '<option value="">Seleccionar...</option>' +
    cats.sexos.map(s => `<option value="${s.id}">${s.descripcion}</option>`).join('');

  // Llenar estado civil
  document.getElementById('fEstadoCivil').innerHTML = '<option value="">Seleccionar...</option>' +
    cats.estados_civil.map(c => `<option value="${c.id}">${c.descripcion}</option>`).join('');

  // Llenar bancos
  document.getElementById('fBanco').innerHTML = '<option value="">Ninguno</option>' +
    cats.bancos.map(b => `<option value="${b.id}">${b.nombre}</option>`).join('');

  // Llenar tipo de cuenta
  document.getElementById('fTipoCuenta').innerHTML = '<option value="">Ninguna</option>' +
    cats.tipos_cuenta.map(tc => `<option value="${tc.id}">${tc.descripcion}</option>`).join('');

  // Llenar AFP
  document.getElementById('fAFP').innerHTML = '<option value="">Ninguno</option>' +
    cats.afps.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
}

async function loadData() {
  const res = await apiFetch('/personas');
  if (!res || !res.ok) { showToast('Error al cargar colaboradores', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fa-solid fa-users"></i><p>No hay colaboradores registrados</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((p, i) => {
    let badgeClass = 'badge-muted';
    if (p.estado === 'ACTIVO') badgeClass = 'badge-success';
    if (p.estado === 'CESADO') badgeClass = 'badge-danger';
    if (p.estado === 'CANDIDATO') badgeClass = 'badge-info';

    return `
      <tr>
        <td>${i + 1}</td>
        <td><code style="font-size:.78rem;color:var(--accent)">${p.tipo_doc_codigo}: ${p.nro_documento}</code></td>
        <td><strong>${p.apellido_paterno} ${p.apellido_materno || ''}, ${p.nombres}</strong></td>
        <td>${p.email_corporativo || '—'}</td>
        <td>${p.telefono_celular || '—'}</td>
        <td>
          <span style="font-size:0.75rem;color:var(--text-muted)">
            <i class="fa-regular fa-folder-open"></i> ${p.expediente_codigo || 'Generando...'}
          </span>
        </td>
        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
        <td><div class="table-actions">
          <button class="action-btn edit" title="Editar" onclick="editItem(${p.id})"><i class="fa-solid fa-user-pen"></i></button>
          <button class="action-btn delete" title="Desactivar" onclick="confirmDelete(${p.id})"><i class="fa-solid fa-user-minus"></i></button>
        </div></td>
      </tr>
    `;
  }).join('');
}

function filterTable(q) {
  renderTable(allData.filter(p =>
    p.nombres.toLowerCase().includes(q.toLowerCase()) ||
    p.apellido_paterno.toLowerCase().includes(q.toLowerCase()) ||
    (p.apellido_materno || '').toLowerCase().includes(q.toLowerCase()) ||
    p.nro_documento.includes(q)
  ));
}

function resetForm() {
  editingId = null;
  document.getElementById('mainForm').reset();
  document.getElementById('fEstado').value = 'CANDIDATO';
  document.getElementById('fNacionalidad').value = 'Peruana';
  document.getElementById('modalTitle').textContent = 'Registrar Colaborador';
  document.getElementById('modalSubtitle').textContent = 'Ingresa los datos personales e información de nómina';
  document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Registrar';
}

async function openCreate() {
  try {
    resetForm();
    await loadCatalogs();
    openModal('modalForm');
  } catch (err) {
    console.error('Error al iniciar registro de colaborador:', err);
    showToast('Error de catálogos: ' + err.message, 'error');
  }
}

async function editItem(id) {
  try {
    editingId = id;
    await loadCatalogs();
    const res = await apiFetch(`/personas/${id}`);
    if (!res || !res.ok) { showToast('Error al cargar datos', 'error'); return; }
    const p = res.data;

    document.getElementById('fTipoDoc').value        = p.tipo_doc_id;
    document.getElementById('fNroDoc').value         = p.nro_documento || '';
    document.getElementById('fNombres').value        = p.nombres || '';
    document.getElementById('fApPaterno').value      = p.apellido_paterno || '';
    document.getElementById('fApMaterno').value      = p.apellido_materno || '';
    
    if (p.fecha_nacimiento) {
      document.getElementById('fFechaNac').value = p.fecha_nacimiento.split('T')[0];
    } else {
      document.getElementById('fFechaNac').value = '';
    }

    document.getElementById('fSexo').value           = p.sexo_id || '';
    document.getElementById('fEstadoCivil').value    = p.estado_civil_id || '';
    document.getElementById('fNacionalidad').value   = p.nacionalidad || 'Peruana';
    document.getElementById('fEstado').value         = p.estado || 'CANDIDATO';
    
    document.getElementById('fEmailPersonal').value  = p.email_personal || '';
    document.getElementById('fEmailCorp').value      = p.email_corporativo || '';
    document.getElementById('fCelular').value        = p.telefono_celular || '';
    document.getElementById('fFijo').value           = p.telefono_fijo || '';
    document.getElementById('fDireccion').value      = p.direccion || '';
    
    document.getElementById('fBanco').value          = p.banco_id || '';
    document.getElementById('fTipoCuenta').value     = p.tipo_cuenta_id || '';
    document.getElementById('fNroCuenta').value      = p.nro_cuenta || '';
    document.getElementById('fCCI').value            = p.cuenta_cci || '';
    document.getElementById('fAFP').value            = p.afp_id || '';
    document.getElementById('fCUSPP').value          = p.nro_cuspp || '';

    document.getElementById('modalTitle').textContent    = 'Editar Ficha de Colaborador';
    document.getElementById('modalSubtitle').textContent = `Ficha ID: ${id}`;
    document.getElementById('btnSubmit').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Cambios';
    openModal('modalForm');
  } catch (err) {
    showToast('Error al cargar datos de edición: ' + err.message, 'error');
  }
}

async function submitForm(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  btn.innerHTML = '<div class="loader"></div> Registrando...';

  const body = {
    tipo_doc_id:       parseInt(document.getElementById('fTipoDoc').value),
    nro_documento:     document.getElementById('fNroDoc').value.trim(),
    nombres:           document.getElementById('fNombres').value.trim(),
    apellido_paterno:  document.getElementById('fApPaterno').value.trim(),
    apellido_materno:  document.getElementById('fApMaterno').value.trim(),
    fecha_nacimiento:  document.getElementById('fFechaNac').value || null,
    sexo_id:           document.getElementById('fSexo').value ? parseInt(document.getElementById('fSexo').value) : null,
    estado_civil_id:   document.getElementById('fEstadoCivil').value ? parseInt(document.getElementById('fEstadoCivil').value) : null,
    nacionalidad:      document.getElementById('fNacionalidad').value.trim(),
    estado:            document.getElementById('fEstado').value,
    email_personal:    document.getElementById('fEmailPersonal').value.trim(),
    email_corporativo: document.getElementById('fEmailCorp').value.trim(),
    telefono_celular:  document.getElementById('fCelular').value.trim(),
    telefono_fijo:     document.getElementById('fFijo').value.trim(),
    direccion:         document.getElementById('fDireccion').value.trim(),
    banco_id:          document.getElementById('fBanco').value ? parseInt(document.getElementById('fBanco').value) : null,
    tipo_cuenta_id:    document.getElementById('fTipoCuenta').value ? parseInt(document.getElementById('fTipoCuenta').value) : null,
    nro_cuenta:        document.getElementById('fNroCuenta').value.trim(),
    cuenta_cci:        document.getElementById('fCCI').value.trim(),
    afp_id:            document.getElementById('fAFP').value ? parseInt(document.getElementById('fAFP').value) : null,
    nro_cuspp:         document.getElementById('fCUSPP').value.trim(),
  };

  const res = editingId
    ? await apiFetch(`/personas/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/personas', { method:'POST', body: JSON.stringify(body) });

  btn.disabled = false;
  btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';

  if (res && res.ok) {
    showToast(editingId ? 'Ficha actualizada ✔' : 'Colaborador registrado ✔', 'success');
    closeModal('modalForm');
    loadData();
  } else {
    showToast(res?.message || 'Error al guardar colaborador', 'error');
  }
}

let deleteId = null;
function confirmDelete(id) {
  deleteId = id;
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/personas/${deleteId}`, { method: 'DELETE' });
    if (res && res.ok) {
      showToast('Ficha de colaborador desactivada', 'warning');
      closeModal('modalConfirm');
      loadData();
    } else {
      showToast(res?.message || 'Error', 'error');
    }
  };
  openModal('modalConfirm');
}

loadData();
