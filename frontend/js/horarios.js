if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allHorarios = [];
let allAsignaciones = [];
let editingHorarioId = null;

async function loadFormCatalogs() {
  const [sucRes, carRes, turnRes, contRes] = await Promise.all([
    apiFetch('/sucursales'),
    apiFetch('/cargos'),
    apiFetch('/turnos'),
    apiFetch('/contratos')
  ]);

  if (sucRes && sucRes.ok) {
    document.getElementById('hSucursal').innerHTML = '<option value="">Seleccionar...</option>' +
      sucRes.data.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
  }
  if (carRes && carRes.ok) {
    document.getElementById('hCargo').innerHTML = '<option value="">Todos los cargos</option>' +
      carRes.data.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  }
  if (turnRes && turnRes.ok) {
    const options = '<option value="">Libre / Descanso</option>' +
      turnRes.data.filter(t => t.activo).map(t => `<option value="${t.id}">${t.nombre} (${t.hora_entrada} - ${t.hora_salida})</option>`).join('');
    
    // Rellenar select de todos los días de la semana
    document.querySelectorAll('.f-dia').forEach(select => {
      select.innerHTML = options;
    });
    // También para la asignación
    document.getElementById('aHorario').innerHTML = '<option value="">Seleccionar plantilla...</option>' +
      allHorarios.filter(h => h.activo).map(h => `<option value="${h.id}">${h.nombre}</option>`).join('');
  }
  if (contRes && contRes.ok) {
    // Solo permitir asignar a contratos VIGENTES
    document.getElementById('aContrato').innerHTML = '<option value="">Seleccionar contrato...</option>' +
      contRes.data.filter(c => c.estado === 'VIGENTE').map(c => `<option value="${c.id}">${c.colaborador_nombre} (Contrato: ${c.codigo})</option>`).join('');
  }
}

async function loadData() {
  const [hRes, aRes] = await Promise.all([
    apiFetch('/horarios'),
    apiFetch('/horarios/config/asignaciones')
  ]);

  if (hRes && hRes.ok) {
    allHorarios = hRes.data;
    renderHorariosTable(allHorarios);
  }

  if (aRes && aRes.ok) {
    allAsignaciones = aRes.data;
    renderAsignacionesTable(allAsignaciones);
  }
}

function renderHorariosTable(data) {
  const tbody = document.getElementById('tablaHorariosBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="11"><div class="empty-state"><i class="fa-solid fa-calendar-days"></i><p>No hay plantillas de horarios creadas</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(h => `
    <tr>
      <td><strong>${h.nombre}</strong></td>
      <td>${h.sucursal_nombre}</td>
      <td><span style="font-size:0.75rem" class="badge badge-muted">${h.lunes_turno || 'Libre'}</span></td>
      <td><span style="font-size:0.75rem" class="badge badge-muted">${h.martes_turno || 'Libre'}</span></td>
      <td><span style="font-size:0.75rem" class="badge badge-muted">${h.miercoles_turno || 'Libre'}</span></td>
      <td><span style="font-size:0.75rem" class="badge badge-muted">${h.jueves_turno || 'Libre'}</span></td>
      <td><span style="font-size:0.75rem" class="badge badge-muted">${h.viernes_turno || 'Libre'}</span></td>
      <td><span style="font-size:0.75rem" class="badge badge-muted">${h.sabado_turno || 'Libre'}</span></td>
      <td><span style="font-size:0.75rem" class="badge badge-muted">${h.domingo_turno || 'Libre'}</span></td>
      <td><span class="badge ${h.activo ? 'badge-success' : 'badge-danger'}">${h.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td><div class="table-actions">
        <button class="action-btn edit" onclick="editHorario(${h.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete" onclick="confirmDeleteHorario(${h.id})"><i class="fa-solid fa-trash"></i></button>
      </div></td>
    </tr>
  `).join('');
}

function renderAsignacionesTable(data) {
  const tbody = document.getElementById('tablaAsignacionesBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-user-clock"></i><p>No hay horarios asignados a colaboradores</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(a => `
    <tr>
      <td><strong>${a.colaborador_nombre}</strong></td>
      <td><code style="font-size:.78rem;color:var(--accent)">${a.contrato_codigo}</code></td>
      <td><span class="badge badge-info">${a.horario_nombre}</span></td>
      <td>${a.fecha_inicio}</td>
      <td>${a.fecha_fin || 'Indefinido'}</td>
      <td><div class="table-actions">
        <button class="action-btn delete" onclick="confirmDeleteAsignacion(${a.id})"><i class="fa-solid fa-xmark"></i></button>
      </div></td>
    </tr>
  `).join('');
}

// ── CRUD Plantillas de Horarios ──

function resetHorarioForm() {
  editingHorarioId = null;
  document.getElementById('formHorario').reset();
  document.getElementById('hActivo').value = '1';
  document.getElementById('modalTitle').textContent = 'Nuevo Horario Semanal';
  document.getElementById('btnSubmitHorario').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';
}

async function openCreateHorario() {
  resetHorarioForm();
  await loadFormCatalogs();
  openModal('modalHorario');
}

async function editHorario(id) {
  const res = await apiFetch(`/horarios/${id}`);
  if (!res || !res.ok) { showToast('Error al cargar horario', 'error'); return; }
  const h = res.data;
  editingHorarioId = id;
  await loadFormCatalogs();

  document.getElementById('hNombre').value    = h.nombre;
  document.getElementById('hSucursal').value  = h.sucursal_id;
  document.getElementById('hCargo').value     = h.cargo_id || '';
  document.getElementById('hLun').value       = h.lunes_turno_id || '';
  document.getElementById('hMar').value       = h.martes_turno_id || '';
  document.getElementById('hMie').value       = h.miercoles_turno_id || '';
  document.getElementById('hJue').value       = h.jueves_turno_id || '';
  document.getElementById('hVie').value       = h.viernes_turno_id || '';
  document.getElementById('hSab').value       = h.sabado_turno_id || '';
  document.getElementById('hDom').value       = h.domingo_turno_id || '';
  document.getElementById('hActivo').value    = h.activo ? '1' : '0';

  document.getElementById('modalTitle').textContent = 'Editar Horario Semanal';
  document.getElementById('btnSubmitHorario').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar';
  openModal('modalHorario');
}

async function submitHorario(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitHorario');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    nombre:         document.getElementById('hNombre').value.trim(),
    sucursal_id:    parseInt(document.getElementById('hSucursal').value),
    cargo_id:       document.getElementById('hCargo').value ? parseInt(document.getElementById('hCargo').value) : null,
    lunes_turno_id:     document.getElementById('hLun').value ? parseInt(document.getElementById('hLun').value) : null,
    martes_turno_id:    document.getElementById('hMar').value ? parseInt(document.getElementById('hMar').value) : null,
    miercoles_turno_id: document.getElementById('hMie').value ? parseInt(document.getElementById('hMie').value) : null,
    jueves_turno_id:    document.getElementById('hJue').value ? parseInt(document.getElementById('hJue').value) : null,
    viernes_turno_id:   document.getElementById('hVie').value ? parseInt(document.getElementById('hVie').value) : null,
    sabado_turno_id:    document.getElementById('hSab').value ? parseInt(document.getElementById('hSab').value) : null,
    domingo_turno_id:   document.getElementById('hDom').value ? parseInt(document.getElementById('hDom').value) : null,
    activo:         parseInt(document.getElementById('hActivo').value)
  };

  const res = editingHorarioId
    ? await apiFetch(`/horarios/${editingHorarioId}`, { method:'PUT', body: JSON.stringify(body) })
    : await apiFetch('/horarios', { method:'POST', body: JSON.stringify(body) });

  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar';

  if (res && res.ok) {
    showToast('Plantilla guardada', 'success');
    closeModal('modalHorario');
    loadData();
  } else {
    showToast(res?.message || 'Error al guardar plantilla', 'error');
  }
}

// ── CRUD Asignaciones ──

async function openCreateAsignacion() {
  document.getElementById('formAsignacion').reset();
  await loadFormCatalogs();
  openModal('modalAsignacion');
}

async function submitAsignacion(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSubmitAsignacion');
  btn.disabled = true; btn.innerHTML = '<div class="loader"></div>';

  const body = {
    contrato_id:  parseInt(document.getElementById('aContrato').value),
    horario_id:   parseInt(document.getElementById('aHorario').value),
    fecha_inicio: document.getElementById('aFechaInicio').value,
    fecha_fin:    document.getElementById('aFechaFin').value || null
  };

  const res = await apiFetch('/horarios/config/asignaciones', { method:'POST', body: JSON.stringify(body) });
  btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Asignar';

  if (res && res.ok) {
    showToast('Horario asignado al colaborador ✔', 'success');
    closeModal('modalAsignacion');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

function confirmDeleteHorario(id) {
  document.getElementById('confirmTitle').textContent = '¿Desactivar plantilla?';
  document.getElementById('confirmDesc').textContent = 'El estado de la plantilla pasará a Inactivo.';
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/horarios/${id}`, { method: 'DELETE' });
    if (res && res.ok) { showToast('Plantilla desactivada', 'warning'); closeModal('modalConfirm'); loadData(); }
    else showToast(res?.message || 'Error', 'error');
  };
  openModal('modalConfirm');
}

function confirmDeleteAsignacion(id) {
  document.getElementById('confirmTitle').textContent = '¿Eliminar asignación?';
  document.getElementById('confirmDesc').textContent = 'El colaborador se quedará sin horario asignado.';
  document.getElementById('btnConfirmDel').onclick = async () => {
    const res = await apiFetch(`/horarios/config/asignaciones/${id}`, { method: 'DELETE' });
    if (res && res.ok) { showToast('Asignación eliminada', 'warning'); closeModal('modalConfirm'); loadData(); }
    else showToast(res?.message || 'Error', 'error');
  };
  openModal('modalConfirm');
}

loadData();
