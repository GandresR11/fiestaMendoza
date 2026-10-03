import { db, ref, onValue } from './firebase-config.js';

let appData = { categorias: [] };
let votesData = {};

async function initTV() {
  const res = await fetch('data/nominados.json');
  appData = await res.json();

  // Escuchar Estado
  onValue(ref(db, 'estado_evento'), (snap) => {
    const state = snap.val() || {};
    renderTV(state);
  });

  // Escuchar Votos
  onValue(ref(db, 'votos'), (snap) => {
    votesData = snap.val() || {};
  });
}

function renderTV(state) {
  const main = document.getElementById('tv-main-content');

  if (!state.activeCatId) {
    main.innerHTML = `
      <div class="animate-pulse">
        <h2 class="font-cinzel text-5xl font-extrabold gold-gradient-text mb-4">¡Bienvenidos a la Gala!</h2>
        <p class="text-xl text-gray-400">Escanea el código QR en pantalla para ingresar a la plataforma de votación.</p>
      </div>
    `;
    return;
  }

  const category = appData.categorias.find(c => c.id === state.activeCatId);

  if (state.isOpen) {
    main.innerHTML = `
      <div class="space-y-6">
        <span class="bg-green-500 text-black font-bold px-6 py-2 rounded-full text-lg uppercase tracking-wider animate-bounce inline-block">
          🔴 VOTACIÓN ABIERTA
        </span>
        <h2 class="font-cinzel text-6xl font-bold text-white">${category.titulo}</h2>
        <p class="text-2xl text-gray-300">${category.descripcion}</p>
        <p class="text-lg text-yellow-400 pt-6">Ingresa a tu celular y vota por tu favorito.</p>
      </div>
    `;
  } else if (state.showWinner) {
    // Calcular Ganador
    const catVotes = votesData[category.id] ? Object.values(votesData[category.id]) : [];
    const counts = {};
    category.nominados.forEach(n => counts[n.id] = 0);
    catVotes.forEach(v => { if(counts[v.nominadoId] !== undefined) counts[v.nominadoId]++; });

    let winnerId = null;
    let maxVotes = -1;
    Object.keys(counts).forEach(id => {
      if (counts[id] > maxVotes) {
        maxVotes = counts[id];
        winnerId = id;
      }
    });

    const winner = category.nominados.find(n => n.id === winnerId);

    // Lanzar Confeti
    if (window.confetti) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    main.innerHTML = `
      <div class="flex flex-col items-center">
        <span class="text-yellow-400 font-bold tracking-widest text-xl uppercase mb-2">Y EL GANADOR DEL ÓSCAR ES...</span>
        <h2 class="font-cinzel text-4xl font-bold text-gray-300 mb-8">${category.titulo}</h2>
        
        <div class="bg-[#141416] p-8 rounded-3xl gold-border-active flex flex-col items-center max-w-lg animate-pulse">
          <img src="${winner.foto}" class="w-48 h-48 rounded-full object-cover border-4 border-[#D4AF37] shadow-2xl mb-6">
          <h3 class="font-cinzel text-4xl font-black text-white mb-2">${winner.nombre}</h3>
          <p class="text-yellow-400 font-bold text-lg">${maxVotes} VOTOS RECIBIDOS</p>
        </div>
      </div>
    `;
  } else {
    main.innerHTML = `
      <div>
        <h2 class="font-cinzel text-5xl font-bold gold-gradient-text mb-4">${category.titulo}</h2>
        <p class="text-2xl text-yellow-500 font-semibold">Votación Cerrada. Esperando anuncio del ganador...</p>
      </div>
    `;
  }
}

initTV();
