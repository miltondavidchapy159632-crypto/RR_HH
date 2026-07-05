if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();

let allData = [];

// ── Reloj Digital en Tiempo Real ──
function initReloj() {
  const reloj = document.getElementById('reloj');
  const fechaEl = document.getElementById('fecha');

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  setInterval(() => {
    const ahora = new Date();
    
    // Formatear hora
    const h = String(ahora.getHours()).padStart(2, '0');
    const m = String(ahora.getMinutes()).padStart(2, '0');
    const s = String(ahora.getSeconds()).padStart(2, '0');
    reloj.textContent = `${h}:${m}:${s}`;

    // Formatear fecha
    const diaSem = dias[ahora.getDay()];
    const diaMes = ahora.getDate();
    const mes = meses[ahora.getMonth()];
    const anio = ahora.getFullYear();
    fechaEl.textContent = `${diaSem}, ${diaMes} de ${mes} del ${anio}`;
  }, 1000);
}

// ── Cargar Historial (Rol Admin) ──
async function loadData() {
  const res = await apiFetch('/marcaciones');
  if (!res || !res.ok) { showToast('Error al cargar marcaciones', 'error'); return; }
  allData = res.data;
  renderTable(allData);
}

function renderTable(data) {
  const tbody = document.getElementById('tablaBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fa-solid fa-clock"></i><p>No hay marcaciones hoy</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map((m, i) => {
    let badgeClass = 'badge-success';
    if (m.estado === 'TARDANZA') badgeClass = 'badge-danger';
    if (m.estado === 'JUSTIFICADO') badgeClass = 'badge-info';
    if (m.estado === 'AUSENTE') badgeClass = 'badge-muted';

    const entrada = m.hora_ingreso_formato || '—';
    const salida = m.hora_salida_formato || '—';

    return `
      <tr>
        <td><strong>${m.colaborador_nombre}</strong><br/><span style="font-size:0.7rem;color:var(--text-muted)">Turno: ${m.turno_nombre}</span></td>
        <td>${m.fecha.split('T')[0]}</td>
        <td>
          <span style="font-size:0.8rem">Ent: ${entrada}</span><br/>
          <span style="font-size:0.8rem">Sal: ${salida}</span>
        </td>
        <td><span style="color:var(--danger)">${m.tardanza_minutos ? m.tardanza_minutos + ' min' : '—'}</span></td>
        <td><span class="badge ${badgeClass}">${m.estado}</span></td>
        <td>
          <div class="table-actions">
            ${m.estado === 'TARDANZA' 
              ? `<button class="action-btn edit" title="Justificar" onclick="openJustificar(${m.id}, '${m.colaborador_nombre}')"><i class="fa-solid fa-circle-exclamation"></i></button>`
              : '<span style="color:var(--text-muted);font-size:0.75rem">—</span>'
            }
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ── Registrar Marcación desde el Quiosco Biométrico ──
async function marcarAsistencia(tipo) {
  const docInput = document.getElementById('bioDoc');
  const nro_documento = docInput.value.trim();

  if (!nro_documento) {
    showToast('Por favor, ingresa tu número de documento (DNI)', 'warning');
    docInput.focus();
    return;
  }

  const btn = document.querySelector(`.biometric-btn.${tipo.toLowerCase()}`);
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="loader"></div>';

  try {
    const res = await fetch(`${API}/marcaciones/marcar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nro_documento, tipo_marcacion: tipo })
    });
    
    const data = await res.json();
    
    if (data.ok) {
      showToast(data.message, 'success', 5000);
      docInput.value = '';
      loadData(); // Refrescar historial
    } else {
      showToast(data.message || 'Error al marcar', 'error', 5000);
    }
  } catch (err) {
    showToast('Error de conexión con el biométrico', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// ── Justificaciones ──
function openJustificar(id, nombre) {
  document.getElementById('jId').value = id;
  document.getElementById('jColaborador').value = nombre;
  document.getElementById('jJustificacion').value = '';
  openModal('modalJustificar');
}

async function submitJustificacion(e) {
  e.preventDefault();
  const id = parseInt(document.getElementById('jId').value);
  const justificacion = document.getElementById('jJustificacion').value.trim();

  const res = await apiFetch('/marcaciones/justificar', {
    method: 'POST',
    body: JSON.stringify({ id, justificacion })
  });

  if (res && res.ok) {
    showToast('Inasistencia/Tardanza justificada ✔', 'success');
    closeModal('modalJustificar');
    loadData();
  } else {
    showToast(res?.message || 'Error', 'error');
  }
}

// Inicializar Reloj y Cargar datos
initReloj();
loadData();
