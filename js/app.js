import { db, ref, set, get, onValue } from './firebase-config.js';

let appData = { categorias: [] };
let currentUser = null;
let savedUsers = JSON.parse(localStorage.getItem('mendoza_users')) || [];
let activeState = { activeCatId: null, isOpen: false };

// Cargar categorías
async function initApp() {
  const res = await fetch('data/nominados.json');
  appData = await res.json();

  setupEventListeners();
  loadSavedUsers();
  listenToAppState();
}

function setupEventListeners() {
  document.getElementById('btn-start-voting').addEventListener('click', handleNewUserLogin);
  document.getElementById('btn-switch-user').addEventListener('click', openUserModal);
  document.getElementById('btn-close-modal').addEventListener('click', () => document.getElementById('modal-users').classList.add('hidden'));
  document.getElementById('btn-modal-add-user').addEventListener('click', handleModalAddUser);
}

// Control del almacenamiento Local (múltiples personas en un mismo móvil)
function loadSavedUsers() {
  const container = document.getElementById('saved-users-container');
  const list = document.getElementById('saved-users-list');
  
  if (savedUsers.length > 0) {
    container.classList.remove('hidden');
    list.innerHTML = savedUsers.map(u => `
      <button class="w-full text-left bg-[#0B0B0C] border border-gray-800 p-3 rounded-xl flex justify-between items-center text-sm font-semibold text-gray-200 active:border-[#D4AF37]" onclick="selectSavedUser('${u.id}')">
        <span>${u.nombre}</span>
        <span class="text-xs text-yellow-500">Seleccionar →</span>
      </button>
    `).join('');
  }
}

window.selectSavedUser = (userId) => {
  currentUser = savedUsers.find(u => u.id === userId);
  showMainView();
};

function handleNewUserLogin() {
  const input = document.getElementById('input-fullname').value.trim();
  if (!input) return alert("Por favor ingresa un nombre válido.");

  const newUser = { id: 'usr_' + Date.now(), nombre: input };
  savedUsers.push(newUser);
  localStorage.setItem('mendoza_users', JSON.stringify(savedUsers));
  currentUser = newUser;
  showMainView();
}

function handleModalAddUser() {
  const input = document.getElementById('input-modal-fullname').value.trim();
  if (!input) return alert("Ingresa un nombre.");

  const newUser = { id: 'usr_' + Date.now(), nombre: input };
  savedUsers.push(newUser);
  localStorage.setItem('mendoza_users', JSON.stringify(savedUsers));
  currentUser = newUser;
  document.getElementById('modal-users').classList.add('hidden');
  showMainView();
}

function openUserModal() {
  const list = document.getElementById('modal-users-list');
  list.innerHTML = savedUsers.map(u => `
    <button class="w-full text-left bg-[#0B0B0C] border ${currentUser && currentUser.id === u.id ? 'border-yellow-500' : 'border-gray-800'} p-2.5 rounded-xl text-xs font-semibold text-gray-200" onclick="selectSavedUserModal('${u.id}')">
      ${u.nombre} ${currentUser && currentUser.id === u.id ? '(Activo)' : ''}
    </button>
  `).join('');
  document.getElementById('modal-users').classList.remove('hidden');
}

window.selectSavedUserModal = (userId) => {
  selectSavedUser(userId);
  document.getElementById('modal-users').classList.add('hidden');
};

function showMainView() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('app-header').classList.remove('hidden');
  document.getElementById('current-user-display').innerText = currentUser.nombre;
  renderCurrentCategoryState();
}

// Escuchar cambios de estado desde Firebase (En Tiempo Real)
function listenToAppState() {
  const stateRef = ref(db, 'estado_evento');
  onValue(stateRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      activeState = data;
      if (currentUser) renderCurrentCategoryState();
    }
  });
}

async function renderCurrentCategoryState() {
  const viewVoting = document.getElementById('view-voting');
  const viewWaiting = document.getElementById('view-waiting');

  if (!activeState.isOpen || !activeState.activeCatId) {
    viewVoting.classList.add('hidden');
    viewWaiting.classList.remove('hidden');
    return;
  }

  const category = appData.categorias.find(c => c.id === activeState.activeCatId);
  if (!category) return;

  viewWaiting.classList.add('hidden');
  viewVoting.classList.remove('hidden');

  document.getElementById('cat-title').innerText = category.titulo;
  document.getElementById('cat-desc').innerText = category.descripcion;

  // Verificar si la persona ya votó en esta categoría
  const userVoteRef = ref(db, `votos/${activeState.activeCatId}/${currentUser.id}`);
  const voteSnap = await get(userVoteRef);
  const alreadyVoted = voteSnap.exists();

  const container = document.getElementById('nominado-cards-container');
  const feedback = document.getElementById('voted-feedback');

  if (alreadyVoted) {
    feedback.classList.remove('hidden');
  } else {
    feedback.classList.add('hidden');
  }

  const selectedNomId = alreadyVoted ? voteSnap.val().nominadoId : null;

  container.innerHTML = category.nominados.map(nom => `
    <div class="bg-[#141416] p-4 rounded-2xl ${selectedNomId === nom.id ? 'gold-border-active' : 'gold-border'} flex items-center justify-between gap-4">
      <img src="${nom.foto}" alt="${nom.nombre}" class="w-16 h-16 rounded-full object-cover border border-[#D4AF37]">
      <div class="flex-1">
        <h4 class="font-bold text-sm text-white">${nom.nombre}</h4>
      </div>
      <button 
        ${alreadyVoted ? 'disabled' : ''} 
        onclick="castVote('${category.id}', '${nom.id}')"
        class="${alreadyVoted && selectedNomId === nom.id ? 'bg-green-600 text-white' : alreadyVoted ? 'bg-gray-800 text-gray-500' : 'gold-btn'} text-xs px-4 py-2.5 rounded-xl uppercase tracking-wider font-bold">
        ${alreadyVoted && selectedNomId === nom.id ? 'Votado ✓' : alreadyVoted ? 'Bloqueado' : 'Votar'}
      </button>
    </div>
  `).join('');
}

window.castVote = async (catId, nominadoId) => {
  if (!currentUser) return;

  const voteData = {
    usuarioNombre: currentUser.nombre,
    nominadoId: nominadoId,
    timestamp: Date.now()
  };

  // Guardar en Firebase
  await set(ref(db, `votos/${catId}/${currentUser.id}`), voteData);
  renderCurrentCategoryState();
};

initApp();
