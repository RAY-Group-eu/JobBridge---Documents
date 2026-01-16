/**
 * SECURE DOC VIEWER APP
 * No frameworks. Native DOM manipulation.
 */

// --- CONFIGURATION ---
const APP_CONFIG = {
  MANIFEST_URL: 'manifest.json',
  LOCKOUT_THRESHOLD: 3,
  LOCKOUT_DURATION_MS: 30000,
  PASSWORD_HASH: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", // SHA-256 for "password" (demo)
  USE_HASH: true // Set to false to use plain text comparison
};

// --- STATE MANAGEMENT ---
const State = {
  isAuthenticated: false,
  documents: [],
  currentView: 'portal', // 'portal' | 'viewer'
  currentDocId: null,
  failedAttempts: 0,
  lockoutUntil: 0
};

// --- DOM ELEMENTS ---
const Elements = {
  loginScreen: document.getElementById('login-screen'),
  appContent: document.getElementById('app-content'),
  loginForm: document.getElementById('login-form'),
  passwordInput: document.getElementById('password-input'),
  feedbackArea: document.getElementById('feedback-area'),
  portalView: document.getElementById('portal-view'),
  viewerView: document.getElementById('viewer-view'),
  docGrid: document.getElementById('doc-grid'),
  searchInput: document.getElementById('search-input'),
  viewerContainer: document.getElementById('viewer-content'),
  viewerTitle: document.getElementById('viewer-title'),
  logoutBtn: document.getElementById('logout-btn')
};

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
  checkSession();
  
  if (State.isAuthenticated) {
    await initApp();
  } else {
    showLogin();
  }
  
  // Event Listeners
  Elements.loginForm.addEventListener('submit', handleLogin);
  Elements.logoutBtn.addEventListener('click', handleLogout);
  Elements.searchInput.addEventListener('input', (e) => filterDocs(e.target.value));
  
  // Caps Lock Detection
  Elements.passwordInput.addEventListener('keyup', checkCapsLock);
  Elements.passwordInput.addEventListener('keydown', checkCapsLock);
  
  // Hash Routing (basic)
  window.addEventListener('hashchange', handleRoute);
  
  // Toggle Password
  document.getElementById('toggle-password').addEventListener('click', togglePasswordVisibility);
});

// --- AUTHENTICATION ---
function checkSession() {
  const sessionAuth = sessionStorage.getItem('auth_token');
  if (sessionAuth === 'valid_session') {
    State.isAuthenticated = true;
  }
}

async function handleLogin(e) {
  e.preventDefault();
  
  // Check rate limit
  if (Date.now() < State.lockoutUntil) {
    const remaining = Math.ceil((State.lockoutUntil - Date.now()) / 1000);
    showError(`Too many attempts. Wait ${remaining}s.`);
    return;
  }

  const input = Elements.passwordInput.value;
  
  // Simulate network delay for realism
  setLoading(true);
  await delay(600); 

  let isValid = false;
  if (APP_CONFIG.USE_HASH) {
    const hash = await sha256(input);
    isValid = hash === APP_CONFIG.PASSWORD_HASH;
  } else {
    isValid = input === "password";
  }
  
  setLoading(false);

  if (isValid) {
    // Success
    sessionStorage.setItem('auth_token', 'valid_session');
    State.isAuthenticated = true;
    State.failedAttempts = 0;
    
    // Transition
    Elements.loginScreen.style.opacity = '0';
    setTimeout(() => {
      Elements.loginScreen.classList.add('hidden');
      initApp();
    }, 300);
    
  } else {
    // Failure
    State.failedAttempts++;
    Elements.loginScreen.classList.add('shake');
    setTimeout(() => Elements.loginScreen.classList.remove('shake'), 500);
    
    if (State.failedAttempts >= APP_CONFIG.LOCKOUT_THRESHOLD) {
      State.lockoutUntil = Date.now() + APP_CONFIG.LOCKOUT_DURATION_MS;
      showError(`Access locked for ${APP_CONFIG.LOCKOUT_DURATION_MS/1000} seconds.`);
      Elements.passwordInput.disabled = true;
      setTimeout(() => {
        Elements.passwordInput.disabled = false;
        showError("");
      }, APP_CONFIG.LOCKOUT_DURATION_MS);
    } else {
      showError("Access Denied. Invalid credentials.");
      Elements.passwordInput.value = "";
      Elements.passwordInput.focus();
    }
  }
}

function handleLogout() {
  sessionStorage.removeItem('auth_token');
  window.location.reload();
}

function showError(msg) {
  Elements.feedbackArea.innerHTML = `<span class="error-text">${msg}</span>`;
}

function checkCapsLock(e) {
  if (e.getModifierState("CapsLock")) {
    Elements.feedbackArea.innerHTML = `<span class="warn-caps">⇪ Caps Lock is ON</span>`;
  } else {
    // Only clear if it was showing caps lock warning
    if (Elements.feedbackArea.innerHTML.includes("Caps Lock")) {
        Elements.feedbackArea.innerHTML = "";
    }
  }
}

function togglePasswordVisibility() {
  const type = Elements.passwordInput.type === 'password' ? 'text' : 'password';
  Elements.passwordInput.type = type;
  document.getElementById('toggle-password').innerText = type === 'password' ? 'Show' : 'Hide';
}

function setLoading(isLoading) {
  const btn = Elements.loginForm.querySelector('button');
  if (isLoading) {
    btn.disabled = true;
    btn.innerText = "Verifying...";
  } else {
    btn.disabled = false;
    btn.innerText = "Enter Secure Area";
  }
}

// --- APP LOGIC ---
async function initApp() {
  Elements.appContent.classList.remove('hidden');
  try {
    const response = await fetch(APP_CONFIG.MANIFEST_URL);
    if (!response.ok) throw new Error("Manifest not found");
    State.documents = await response.json();
    renderDocGrid(State.documents);
    handleRoute(); // Check if we loaded with a hash
  } catch (err) {
    console.error(err);
    Elements.docGrid.innerHTML = `<div class="error-text">System Error: Could not load document registry.</div>`;
    // Fallback manual check for files if manifest fails could go here
  }
}

function renderDocGrid(docs) {
  Elements.docGrid.innerHTML = docs.map(doc => `
    <article class="doc-card" onclick="viewDocument('${doc.id}')">
      <div class="doc-meta-top">
        <span class="doc-id text-muted">ID: ${doc.id.split('_')[1]}</span>
        <span class="doc-type-badge">${doc.type}</span>
      </div>
      <h3 class="doc-title">${doc.title}</h3>
      <p class="doc-summary">${doc.summary || "No description available."}</p>
      <div class="doc-footer">
        <span>${doc.date}</span>
        <span>${doc.size || "-"}</span>
      </div>
    </article>
  `).join('');
}

function viewDocument(id) {
  window.location.hash = `doc=${id}`;
}

function returnToPortal() {
  window.location.hash = '';
}

function handleRoute() {
  const hash = window.location.hash;
  if (hash.startsWith('#doc=')) {
    const id = hash.split('=')[1];
    const doc = State.documents.find(d => d.id === id);
    if (doc) {
      showViewer(doc);
    } else {
      // Doc not found
      returnToPortal();
    }
  } else {
    showPortal();
  }
}

function showPortal() {
  Elements.portalView.classList.remove('hidden');
  Elements.viewerView.classList.add('hidden');
  document.title = "Secure Doc Viewer | Portal";
}

function showViewer(doc) {
  Elements.portalView.classList.add('hidden');
  Elements.viewerView.classList.remove('hidden');
  Elements.viewerTitle.innerText = doc.title;
  document.title = `Reading: ${doc.title}`;
  
  const filePath = `docs/${doc.filename}`;
  
  // Clear previous content
  Elements.viewerContainer.innerHTML = '';
  
  if (doc.type === 'PDF') {
    Elements.viewerContainer.innerHTML = `
      <iframe src="${filePath}" class="doc-iframe" title="${doc.title}"></iframe>
    `;
  } else if (doc.type === 'TXT' || doc.type === 'MD') {
    fetch(filePath)
      .then(res => res.text())
      .then(text => {
        Elements.viewerContainer.innerHTML = `<div class="text-viewer">${escapeHtml(text)}</div>`;
      })
      .catch(err => {
         Elements.viewerContainer.innerHTML = `<div class="error-text">Failed to load text content.</div>`;
      });
  } else {
    Elements.viewerContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Format not supported for inline viewing.</p>
        <a href="${filePath}" download class="btn-primary" style="display:inline-block; width:auto;">Download File</a>
      </div>
    `;
  }
}

function filterDocs(query) {
  const lower = query.toLowerCase();
  const filtered = State.documents.filter(doc => 
    doc.title.toLowerCase().includes(lower) || 
    doc.id.toLowerCase().includes(lower) ||
    doc.summary.toLowerCase().includes(lower)
  );
  renderDocGrid(filtered);
}

// --- UTILS ---
function showLogin() {
  Elements.loginScreen.classList.remove('hidden');
  Elements.appContent.classList.add('hidden');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(unsafe) {
  return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}
