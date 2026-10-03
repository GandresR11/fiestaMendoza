import { db, ref, set, remove, onValue } from './firebase-config.js';

let appData = { categorias: [] };
let votesData = {};
let currentState = {};

async function initAdmin() {
  const res = await fetch('data/nominados.json');
  appData = await res.json();

  document.getElementById('btn-factory-reset').addEventListener('click', handleFactoryReset);

  // Escuchar Estado Global
  onValue(ref(db, 'estado_evento'), (snap) => {
    currentState = snap.val() || {};
    renderAdminPanel();
  });

  // Escuchar Votos
  onValue(ref(db, 'votos'), (snap) => {
    votesData = snap.val() || {};
    renderAdminPanel();
  });
}

function renderAdminPanel() {
  const list = document.getElementById('admin-categories-list');

  list.innerHTML = appData.categorias.map(cat => {
    const isCurrentActive = currentState.activeCatId === cat.id && currentState.isOpen;
    const catVotes = votesData[cat.id] ? Object.values(votesData[cat.id]) : [];
    const totalVotes = catVotes.length;

    // Calcular conteo por nominado
    const counts = {};
    cat.nominados.forEach(n => counts[n.id] = 0);
    catVotes.forEach(v => {
      if (counts[v.nominadoId] !== undefined) counts[v.nominadoId]++;
    });

    return `
      <div class="bg-[#141416] p-5 rounded-2xl gold-border ${isCurrentActive ? 'pulse-glow border-yellow-500' : ''}">
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-bold text-lg text-white">${cat.titulo}</h3>
          <span class="text-xs font-bold px-3 py-1 rounded-full ${isCurrentActive ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400'}">
            ${isCurrentActive ? 'ABIERTA AHORA' : 'CERRADA'}
          </span>
        </div>

        <!-- Conteo de Votos en Tiempo Real -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 bg-black/40 p-3 rounded-xl border border-gray-800">
          ${cat.nominados.map(n => `
            <div class="text-center">
              <p class="text-[10px] text-gray-400 truncate">${n.nombre}</p>
              <p class="font-bold text-sm text-yellow-400">${counts[n.id]} Votos</p>
            </div>
          `).join('')}
        </div>

        <div class="text-xs text-gray-400 mb-4">Total Votos: <b class="text-white">${totalVotes}</b></div>

        <!-- Botones de Acción -->
        <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-800">
          <button onclick="setCategoryState('${cat.id}', true)" class="bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
            ▶ Iniciar Votación
          </button>
          <button onclick="setCategoryState('${cat.id}', false)" class="bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
            ⏸ Cerrar Votación
          </button>
          <button onclick="announceWinner('${cat.id}')" class="bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold px-3 py-2 rounded-lg">
            📣 Anunciar Ganador en Pantalla
          </button>
          <button onclick="resetCategoryVotes('${cat.id}')" class="bg-gray-800 hover:bg-gray-700 text-red-400 border border-red-500/30 text-xs font-bold px-3 py-2 rounded-lg">
            🗑 Reiniciar esta categoría
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.setCategoryState = async (catId, isOpen) => {
  await set(ref(db, 'estado_evento'), {
    activeCatId: catId,
    isOpen: isOpen,
    showWinner: false
  });
};

window.announceWinner = async (catId) => {
  await set(ref(db, 'estado_evento'), {
    activeCatId: catId,
    isOpen: false,
    showWinner: true
  });
};

window.resetCategoryVotes = async (catId) => {
  if (confirm("¿Seguro que deseas BORRAR los votos de esta categoría?")) {
    await remove(ref(db, `votos/${catId}`));
  }
};

// RESET GENERAL DE PRUEBAS (CRÍTICO)
async function handleFactoryReset() {
  const confirm1 = confirm("⚠️ ¿ESTÁS SEGURO? Esto borrará TODOS los votos y dejará la app limpia para la fiesta.");
  if (confirm1) {
    const confirm2 = prompt("Escribe 'MENDOZA' para confirmar el borrado total:");
    if (confirm2 === "MENDOZA") {
      await remove(ref(db, 'votos'));
      await set(ref(db, 'estado_evento'), { activeCatId: null, isOpen: false, showWinner: false });
      alert("✅ Se han borrado todos los votos de prueba con éxito.");
    }
  }
}

initAdmin();
