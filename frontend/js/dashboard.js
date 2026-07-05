if (!requireAuth()) throw new Error('Sin sesión');
renderSidebarUser();
setActiveNav();

async function loadStats() {
  const data = await apiFetch('/dashboard/stats');
  if (!data || !data.ok) return;
  const s = data.data;

  const stats = [
    { label:'Colaboradores Activos', value: s.empleados_activos  || 0, icon:'fa-users',        color:'blue' },
    { label:'Contratos Vigentes',     value: s.contratos_vigentes || 0, icon:'fa-file-contract', color:'green' },
    { label:'Vacantes Abiertas',      value: s.vacantes_abiertas  || 0, icon:'fa-briefcase',     color:'gold' },
    { label:'Empresas Registradas',   value: s.total_empresas     || 0, icon:'fa-building',      color:'purple' },
    { label:'Sucursales Activas',     value: s.total_sucursales   || 0, icon:'fa-store',         color:'cyan' },
    { label:'Áreas Creadas',          value: s.total_areas        || 0, icon:'fa-sitemap',       color:'orange' },
    { label:'Cargos Definidos',       value: s.total_cargos       || 0, icon:'fa-id-badge',      color:'red' },
  ];

  document.getElementById('statsGrid').innerHTML = stats.map(s => `
    <div class="stat-card ${s.color}">
      <div class="stat-icon ${s.color}"><i class="fa-solid ${s.icon}"></i></div>
      <div class="stat-info">
        <div class="stat-value" data-target="${s.value}">0</div>
        <div class="stat-label">${s.label}</div>
      </div>
    </div>
  `).join('');

  // Contador animado
  document.querySelectorAll('.stat-value').forEach(el => {
    const target = parseInt(el.dataset.target) || 0;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(timer);
    }, 40);
  });
}

loadStats();
