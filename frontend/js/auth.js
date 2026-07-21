// ─────────────────────────────────────────────────────────────
//  auth.js — Utilidades de autenticación compartidas (frontend)
// ─────────────────────────────────────────────────────────────
const API = 'http://localhost:3000/api';

function getToken()  { return localStorage.getItem('scgrh_token'); }
function getUser()   { return JSON.parse(localStorage.getItem('scgrh_user') || 'null'); }
function saveSession(token, user) {
  localStorage.setItem('scgrh_token', token);
  localStorage.setItem('scgrh_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('scgrh_token');
  localStorage.removeItem('scgrh_user');
}

function requireAuth() {
  if (!getToken()) { window.location.href = '/login.html'; return false; }
  return true;
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const url = endpoint.startsWith('/api') ? `http://localhost:3000${endpoint}` : `${API}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    ...options
  });
  if (res.status === 401) { clearSession(); window.location.href = '/login.html'; return; }
  return res.json();
}

// ─── Toast ───────────────────────────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark',
                  warning: 'fa-triangle-exclamation', info: 'fa-circle-info' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info}"></i>
    <span class="toast-msg">${message}</span>
    <i class="fa-solid fa-xmark toast-close" onclick="this.parentElement.remove()"></i>
  `;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ─── Modal helpers ────────────────────────────────────────────
function openModal(id)  { document.getElementById(id)?.classList.add('show'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('show'); }
function closeAllModals() { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('show')); }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });
document.addEventListener('click', e => { if (e.target.classList.contains('modal-overlay')) closeAllModals(); });

// ─── Render sidebar user info ─────────────────────────────────
function renderSidebarUser() {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('sidebarUsername');
  const rl = document.getElementById('sidebarRole');
  const av = document.getElementById('sidebarAvatar');
  if (el) el.textContent = user.username;
  if (rl) rl.textContent = user.rol_nombre || user.rol || 'Usuario';
  if (av) av.textContent = (user.username || 'U').charAt(0).toUpperCase();
}

// ─── Active nav link ──────────────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split('/').pop();
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    const href = item.getAttribute('href') || '';
    if (href.includes(path)) item.classList.add('active');
  });
}

// ─── Logout ──────────────────────────────────────────────────
async function logout() {
  await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  clearSession();
  window.location.href = '/login.html';
}

window.API          = API;
window.getToken     = getToken;
window.getUser      = getUser;
window.saveSession  = saveSession;
window.clearSession = clearSession;
window.requireAuth  = requireAuth;
window.apiFetch     = apiFetch;
window.showToast    = showToast;
window.openModal    = openModal;
window.closeModal   = closeModal;
window.renderSidebarUser = renderSidebarUser;
window.setActiveNav = setActiveNav;
window.logout       = logout;
