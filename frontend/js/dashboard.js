// ============================================================
//  SCGRH — dashboard.js
//  Renderizado de KPIs y Gráficos (Chart.js)
// ============================================================
'use strict';

// Configuración global Chart.js para modo oscuro/premium
Chart.defaults.color = '#8b949e';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.scale.grid.color = 'rgba(139, 148, 158, 0.1)';

document.addEventListener('DOMContentLoaded', async () => {
  // El usuario ya se validó en auth.js (se asume global configUser = true)
  const usr = JSON.parse(localStorage.getItem('scgrh_user'));
  if (usr) document.getElementById('lblEmpresaName').textContent = usr.empresa_nombre;

  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    const r = await apiFetch('/api/dashboard/stats');
    const d = r.data;
    
    // 1. Set KPIs
    document.getElementById('kpi_empleados').textContent = d.generales.empleados_activos || 0;
    document.getElementById('kpi_vencen').textContent    = d.generales.contratos_por_vencer || 0;
    document.getElementById('kpi_vacantes').textContent  = d.generales.vacantes_abiertas || 0;
    document.getElementById('kpi_sedes').textContent     = d.generales.total_sucursales || 0;

    // 2. Render Charts
    renderRotacionChart(d.desvinculaciones.tendencia || []);
    renderCertificacionesChart(d.certificaciones || {});
    renderSedesChart(d.sedes || []);

  } catch (err) {
    showToast('Error cargando métricas: ' + err.message, 'error');
  }
}

function renderRotacionChart(data) {
  const ctx = document.getElementById('chartRotacion').getContext('2d');
  
  // Fill empty months if data is small, but for now we just map what's available
  const labels = data.map(x => x.mes);
  const values = data.map(x => x.cantidad);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Desvinculaciones',
        data: values,
        borderColor: '#ff4d4f', // danger color
        backgroundColor: 'rgba(255, 77, 79, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#ff4d4f',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

function renderCertificacionesChart(data) {
  const ctx = document.getElementById('chartCert').getContext('2d');
  
  const labels = ['Vigentes', 'Por Vencer', 'Vencidas', 'Revocadas'];
  const values = [
    data.Vigente || data.VIGENTE || 0,
    data.Por_Vencer || data.POR_VENCER || 0,
    data.Vencida || data.VENCIDA || 0,
    data.Revocada || data.REVOCADA || 0
  ];
  
  // Si no hay datos, mostrar todo en 0 no tiene sentido en dona, pero se renderiza igual
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: [
          '#00c896', // success
          '#f0a500', // gold
          '#ff4d4f', // danger
          '#8b949e'  // muted
        ],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'right', labels: { usePointStyle: true, boxWidth: 8 } }
      }
    }
  });
}

function renderSedesChart(data) {
  const ctx = document.getElementById('chartSedes').getContext('2d');
  
  const labels = data.map(x => x.nombre);
  const values = data.map(x => x.total_empleados);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Empleados Activos',
        data: values,
        backgroundColor: 'rgba(45,126,248,0.7)', // primary / accent
        borderColor: '#2D7EF8',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}
