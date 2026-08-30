/**
 * Canonical Quantum Algorithm Presets & Gamified Missions
 */

const ALGORITHM_PRESETS = {
  superposition: {
    id: 'superposition',
    title: 'Equal Superposition State',
    desc: 'Demonstrates a qubit existing simultaneously in |0⟩ and |1⟩ with 50% probability each.',
    math: '|ψ⟩ = 1/√2 (|0⟩ + |1⟩)',
    difficulty: 'Beginner',
    grid: [
      ['H', null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null]
    ]
  },
  bell: {
    id: 'bell',
    title: 'Bell State (Entanglement / EPR Pair)',
    desc: 'Entangles Qubit 0 and Qubit 1 so their measurement outcomes are 100% correlated.',
    math: '|Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)',
    difficulty: 'Intermediate',
    grid: [
      ['H', 'CX_CTRL', null, null, null, null],
      [null, 'CX_TGT', null, null, null, null],
      [null, null, null, null, null, null]
    ]
  },
  grover: {
    id: 'grover',
    title: 'Grover\'s Search Algorithm (2-Qubit)',
    desc: 'Searches an unsorted database to amplify target state |11⟩ to 100% probability using Oracle + Diffusion.',
    math: 'O(√N) Quadratic Quantum Speedup',
    difficulty: 'Advanced',
    grid: [
      ['H', 'Z', 'H', 'X', 'H', null],
      ['H', 'CX_TGT', 'H', 'X', 'H', null],
      [null, null, null, null, null, null]
    ]
  },
  teleportation: {
    id: 'teleportation',
    title: 'Quantum Teleportation Protocol',
    desc: 'Transfers unknown quantum state from Qubit 0 to Qubit 2 using an entangled Bell pair and classical channels.',
    math: 'State Transfer via Entangled Channels',
    difficulty: 'Advanced',
    grid: [
      ['H', 'CX_CTRL', 'H', 'M', null, null],
      [null, 'CX_TGT', null, 'M', null, null],
      [null, null, null, null, 'X', 'Z']
    ]
  },
  deutsch: {
    id: 'deutsch',
    title: 'Deutsch-Jozsa Algorithm',
    desc: 'Determines whether an oracle function is constant or balanced in just ONE single query.',
    math: 'Deterministic 1-Query Speedup',
    difficulty: 'Intermediate',
    grid: [
      ['H', 'X', 'H', null, null, null],
      ['X', 'H', 'CX_TGT', 'H', null, null],
      [null, null, null, null, null, null]
    ]
  }
};

class MissionManager {
  constructor() {
    this.missions = [
      {
        id: 1,
        title: "Mission 1: The Quantum Coin Flip",
        desc: "Put Qubit 0 into equal superposition using a Hadamard (H) gate.",
        hint: "Drag the 'H' gate from the palette onto Qubit 0, column 1.",
        check: (grid, probs) => {
          return grid[0].some(g => g === 'H') && probs.filter(p => p.probability > 0.4).length >= 2;
        },
        completed: false
      },
      {
        id: 2,
        title: "Mission 2: Spooky Entanglement",
        desc: "Create a Bell pair (|Φ⁺⟩) by combining Hadamard on Qubit 0 and CNOT across Qubits 0 and 1.",
        hint: "Place 'H' on Qubit 0, then place 'CX' with Qubit 0 as control and Qubit 1 as target.",
        check: (grid, probs) => {
          const hasH = grid[0].some(g => g === 'H');
          const hasCX = grid[0].some((g, c) => g === 'CX_CTRL' && grid[1][c] === 'CX_TGT');
          const p00 = probs.find(p => p.state === '|000⟩')?.probability || 0;
          return hasH && hasCX && p00 > 0.4;
        },
        completed: false
      },
      {
        id: 3,
        title: "Mission 3: The Quantum NOT Gate",
        desc: "Flip Qubit 0 from state |0⟩ to state |1⟩ using a Pauli-X gate.",
        hint: "Drag the 'X' gate onto Qubit 0.",
        check: (grid, probs) => {
          const hasX = grid[0].some(g => g === 'X');
          const p1 = probs.find(p => p.state.startsWith('|1'))?.probability || 0;
          return hasX && p1 > 0.9;
        },
        completed: false
      },
      {
        id: 4,
        title: "Mission 4: Interference Cancellation",
        desc: "Demonstrate that the Hadamard gate is its own inverse by applying H twice on Qubit 0.",
        hint: "Place 'H' in column 1 on Qubit 0, and another 'H' in column 2 on Qubit 0.",
        check: (grid, probs) => {
          const hCount = grid[0].filter(g => g === 'H').length;
          const p0 = probs.find(p => p.state === '|000⟩')?.probability || 0;
          return hCount >= 2 && p0 > 0.9;
        },
        completed: false
      }
    ];

    this.activeMission = 0;
    this.renderMissions();
  }

  renderMissions() {
    const listEl = document.getElementById('missions-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    this.missions.forEach((m, idx) => {
      const card = document.createElement('div');
      card.className = `mission-card ${m.completed ? 'mission-completed' : ''} ${idx === this.activeMission ? 'mission-active' : ''}`;
      card.innerHTML = `
        <div class="mission-header">
          <span class="mission-status-icon">${m.completed ? '✓' : idx + 1}</span>
          <h4 class="mission-title">${m.title}</h4>
        </div>
        <p class="mission-desc">${m.desc}</p>
        <div class="mission-hint"><strong>Hint:</strong> ${m.hint}</div>
        <button class="btn-load-mission" data-mission="${idx}">
          ${m.completed ? 'Solved (Try Again)' : 'Attempt Mission'}
        </button>
      `;
      card.querySelector('.btn-load-mission').addEventListener('click', () => {
        this.activeMission = idx;
        if (window.circuitUI) {
          window.circuitUI.clearCircuit();
          document.querySelector('[data-tab="simulator"]').click();
        }
        this.renderMissions();
      });
      listEl.appendChild(card);
    });

    this.updateProgressBar();
  }

  evaluate(grid, probs) {
    const current = this.missions[this.activeMission];
    if (current && !current.completed) {
      if (current.check(grid, probs)) {
        current.completed = true;
        this.showSuccessNotification(current.title);
        this.renderMissions();
      }
    }
  }

  showSuccessNotification(title) {
    const toast = document.createElement('div');
    toast.className = 'mission-toast';
    toast.innerHTML = `
      <div class="toast-icon">🏆</div>
      <div>
        <strong>Mission Completed!</strong>
        <div>${title}</div>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-fade');
      setTimeout(() => toast.remove(), 600);
    }, 3000);
  }

  updateProgressBar() {
    const solved = this.missions.filter(m => m.completed).length;
    const total = this.missions.length;
    const pct = (solved / total) * 100;

    const fillEl = document.getElementById('missions-progress-fill');
    const labelEl = document.getElementById('missions-progress-label');
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (labelEl) labelEl.textContent = `${solved} / ${total} Completed (${pct.toFixed(0)}%)`;
  }
}

window.ALGORITHM_PRESETS = ALGORITHM_PRESETS;
window.MissionManager = MissionManager;
