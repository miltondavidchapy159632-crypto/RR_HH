const fs = require('fs');
const path = require('path');
const dir = 'C:/Users/DAVID/Desktop/Mis_Proyectos/Recursos_Humanos/frontend';

const navTemplate = `<nav>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Principal</p>
        <a href="/dashboard.html" class="nav-item {dashboard}"><i class="fa-solid fa-chart-pie"></i> Dashboard</a>
      </div>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Organización</p>
        <a href="/empresas.html"   class="nav-item {empresas}"><i class="fa-solid fa-building"></i> Empresas</a>
        <a href="/sucursales.html" class="nav-item {sucursales}"><i class="fa-solid fa-store"></i> Sucursales</a>
        <a href="/areas.html"      class="nav-item {areas}"><i class="fa-solid fa-sitemap"></i> Áreas</a>
        <a href="/cargos.html"     class="nav-item {cargos}"><i class="fa-solid fa-id-badge"></i> Cargos</a>
      </div>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Personas</p>
        <a href="/colaboradores.html"  class="nav-item {colaboradores}"><i class="fa-solid fa-users"></i> Colaboradores</a>
        <a href="/contratos.html"      class="nav-item {contratos}"><i class="fa-solid fa-file-contract"></i> Contratos</a>
        <a href="/reclutamiento.html"  class="nav-item {reclutamiento}"><i class="fa-solid fa-briefcase"></i> Reclutamiento</a>
      </div>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Operaciones</p>
        <a href="/turnos.html"      class="nav-item {turnos}"><i class="fa-solid fa-business-time"></i> Turnos y Horarios</a>
        <a href="/marcaciones.html" class="nav-item {marcaciones}"><i class="fa-solid fa-clock"></i> Asistencias</a>
        <a href="/vacaciones.html"  class="nav-item {vacaciones}"><i class="fa-solid fa-umbrella-beach"></i> Vacaciones</a>
        <a href="/licencias.html"   class="nav-item {licencias}"><i class="fa-solid fa-notes-medical"></i> Licencias</a>
        <a href="/planillas.html"   class="nav-item {planillas}"><i class="fa-solid fa-money-check-dollar"></i> Planillas</a>
      </div>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Talento</p>
        <a href="/evaluaciones.html"   class="nav-item {evaluaciones}"><i class="fa-solid fa-star-half-stroke"></i> Evaluaciones</a>
        <a href="/capacitaciones.html" class="nav-item {capacitaciones}"><i class="fa-solid fa-graduation-cap"></i> Capacitaciones</a>
        <a href="/certificaciones.html"class="nav-item {certificaciones}"><i class="fa-solid fa-certificate"></i> Certificaciones</a>
      </div>
      <div class="sidebar-section">
        <p class="sidebar-section-label">Gestión</p>
        <a href="/desvinculacion.html" class="nav-item {desvinculacion}"><i class="fa-solid fa-right-from-bracket"></i> Desvinculación</a>
        <a href="/zonas.html"          class="nav-item {zonas}"><i class="fa-solid fa-map-location-dot"></i> Zonas</a>
        <a href="/auditoria.html"      class="nav-item {auditoria}"><i class="fa-solid fa-scroll"></i> Auditoría</a>
      </div>
    </nav>`;

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'login.html');

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  
  const basename = file.replace('.html', '');
  
  let currentNav = navTemplate;
  const matches = currentNav.match(/\{.*?\}/g) || [];
  for (const m of matches) {
    if (m === `{${basename}}`) {
      currentNav = currentNav.replace(m, 'active');
    } else {
      currentNav = currentNav.replace(m, '');
    }
  }

  // Remove extra spaces from replacing empty strings
  currentNav = currentNav.replace(/class="nav-item "/g, 'class="nav-item"');

  const regex = /<nav>[\s\S]*?<\/nav>/i;
  if (regex.test(content)) {
    content = content.replace(regex, currentNav);
    fs.writeFileSync(p, content, 'utf8');
    console.log('Updated: ' + file);
  } else {
    console.log('Skipped (no nav tag): ' + file);
  }
}
