// ─── login.js ────────────────────────────────────────────────
const API = 'http://localhost:3000/api';

// Si ya hay sesión → redirigir al dashboard
if (localStorage.getItem('scgrh_token')) {
  window.location.href = '/dashboard.html';
}

// Toggle contraseña
document.getElementById('togglePass').addEventListener('click', function() {
  const input = document.getElementById('password');
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  this.className = isPass
    ? 'fa-solid fa-eye-slash toggle-pass'
    : 'fa-solid fa-eye toggle-pass';
});

// Form submit
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username  = document.getElementById('username').value.trim();
  const password  = document.getElementById('password').value;
  const btnLogin  = document.getElementById('btnLogin');
  const errorMsg  = document.getElementById('errorMsg');
  const errorText = document.getElementById('errorText');

  // Limpiar error previo
  errorMsg.classList.remove('show');

  // Loading state
  btnLogin.disabled = true;
  btnLogin.innerHTML = '<div class="spin"></div><span>Verificando...</span>';

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.ok) {
      // Guardar sesión
      localStorage.setItem('scgrh_token', data.token);
      localStorage.setItem('scgrh_user', JSON.stringify(data.user));

      // Feedback y redirigir
      btnLogin.innerHTML = '<i class="fa-solid fa-circle-check"></i><span>¡Acceso concedido!</span>';
      btnLogin.style.background = 'linear-gradient(135deg, #00C896, #00A07A)';

      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 700);
    } else {
      // Mostrar error
      errorText.textContent = data.message || 'Credenciales incorrectas';
      errorMsg.classList.add('show');
      document.getElementById('password').value = '';
      document.getElementById('password').classList.add('error');

      btnLogin.disabled = false;
      btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Iniciar Sesión</span>';

      // Shake animation on error
      document.querySelector('.login-card').style.animation = 'shake 0.4s ease';
      setTimeout(() => {
        document.querySelector('.login-card').style.animation = '';
        document.getElementById('password').classList.remove('error');
      }, 400);
    }
  } catch (err) {
    errorText.textContent = 'Error de conexión con el servidor. Verifica que el backend esté corriendo.';
    errorMsg.classList.add('show');
    btnLogin.disabled = false;
    btnLogin.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span>Iniciar Sesión</span>';
  }
});

// Shake keyframe via style tag
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-8px); }
    40%, 80% { transform: translateX(8px); }
  }
`;
document.head.appendChild(style);
