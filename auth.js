/**
 * ============================================================
 * SwiftBus — Authentication Module  (js/auth.js)
 * Handles Registration, Password Login, Logout via localStorage
 * ============================================================
 */
(function () {
  'use strict';

  const USERS_KEY   = 'swiftbus_users';
  const SESSION_KEY = 'swiftbus_user';

  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify([]));
  }

  // ---- Show alert ----
  function showAlert(msg, type) {
    const box = document.getElementById('alertBox');
    if (!box) return;
    const icon = type === 'success' ? 'fa-circle-check' : type === 'info' ? 'fa-circle-info' : 'fa-circle-exclamation';
    box.className = `alert show alert-${type}`;
    box.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
    setTimeout(() => { box.className = 'alert'; }, 4500);
  }

  // ---- Redirect logged-in users away from auth pages ----
  const isAuthPage = !!document.getElementById('loginForm') || !!document.getElementById('registerForm');
  if (isAuthPage && localStorage.getItem(SESSION_KEY)) {
    window.location.href = 'search.html';
    return;
  }

  // ==========================================================
  //  REGISTRATION
  // ==========================================================
  const regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const fullName = document.getElementById('regName').value.trim();
      const mobile   = document.getElementById('regMobile').value.trim();
      const email    = document.getElementById('regEmail').value.trim().toLowerCase();
      const gender   = document.getElementById('regGender').value;
      const password = document.getElementById('regPass').value;
      const confirm  = document.getElementById('regConfirm').value;

      if (!fullName || !mobile || !email || !gender || !password || !confirm) {
        return showAlert('Please fill in all fields.', 'error');
      }
      if (!/^[0-9]{10}$/.test(mobile)) {
        return showAlert('Enter a valid 10-digit mobile number.', 'error');
      }
      if (password.length < 6) {
        return showAlert('Password must be at least 6 characters.', 'error');
      }
      if (password !== confirm) {
        return showAlert('Passwords do not match!', 'error');
      }

      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      if (users.find(u => u.email === email)) {
        return showAlert('This email is already registered. Please login.', 'error');
      }

      users.push({ id: Date.now(), fullName, mobile, email, gender, password });
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      showAlert('Registration successful! Redirecting to login…', 'success');
      regForm.reset();
      setTimeout(() => { window.location.href = 'login.html'; }, 500);
    });
  }

  // ==========================================================
  //  PASSWORD LOGIN
  // ==========================================================
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const email    = document.getElementById('loginEmail').value.trim().toLowerCase();
      const password = document.getElementById('loginPass').value;

      if (!email || !password) {
        return showAlert('Please enter both email and password.', 'error');
      }

      const users = JSON.parse(localStorage.getItem(USERS_KEY));
      const user  = users.find(u => u.email === email && u.password === password);

      if (user) {
        const session = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile,
          gender: user.gender
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        showAlert('Login successful! Redirecting…', 'success');
        setTimeout(() => { window.location.href = 'search.html'; }, 1000);
      } else {
        const exists = users.some(u => u.email === email);
        if (!exists) {
          showAlert('Account not found. Redirecting to registration…', 'error');
          setTimeout(() => { window.location.href = 'register.html'; }, 2000);
        } else {
          showAlert('Incorrect password. Please try again.', 'error');
        }
      }
    });
  }

  // ==========================================================
  //  LOGOUT (global)
  // ==========================================================
  window.logout = function () {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  };
})();
