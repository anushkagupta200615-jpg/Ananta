# Ananta (अनन्त) - Interactive Quantum Circuit Studio & State Simulator

**Ananta** (*The Infinite & Boundless*) is a developer-grade, web-based quantum circuit development environment, statevector simulator, and educational workbench. It bridges ancient Indian atomic philosophy (*Maharshi Kanada's Parmanu Vada*) with modern quantum linear algebra, 3D Bloch sphere dynamics, and OpenQASM / Qiskit hardware execution.

---

## 🌟 Key Features

### 1. Quantum Circuit Composer (White Canvas & IBM Color Gates)
- **Visual Gate Placement:** Interactive wire grid for multi-qubit registers.
- **Operations Palette:** Square color-coded buttons matching IBM Quantum Composer:
  - Hadamard ($H$): Coral Red (`#fa4d56`)
  - CNOT ($\oplus$ / $CX$): IBM Blue (`#0f62fe`)
  - Pauli-$X$: Crimson (`#da1e28`)
  - Pauli-$Y$: Magenta (`#ee5396`)
  - Pauli-$Z$: Purple (`#8a3ffc`)
  - Phase ($S$): Cyan (`#0072c3`)
  - $\pi/8$ Phase ($T$): Sky Blue (`#1192e8`)
  - Measurement ($M$): Slate (`#475569`)

### 2. Real-Time Linear Algebra Simulation Engine
- **Complex Statevector Evolution:** Direct matrix multiplication in $\mathbb{C}^{2^n}$ Hilbert space.
- **Reduced Density Matrix:** Real-time partial trace calculations to extract single-qubit mixed and pure states.
- **Dynamic Probability Histogram:** Real-time display of computational basis probabilities ($|000\rangle \dots |111\rangle$).

### 3. 3D Bloch Sphere Dynamics
- **Interactive Three.js Visualizer:** Coordinate axes ($X, Y, Z$), orbital drag controls, and state vector arrow $(\theta, \phi)$ with real-time spherical-to-Cartesian interpolation.

### 4. Hardware Bridge (Qiskit & OpenQASM 2.0 Export)
- **Live Code Generation:** Automatically compiles your graphical circuit into production-ready Python Qiskit scripts and OpenQASM 2.0 representations.

### 5. Algorithm Benchmark Labs & Interactive Challenges
- **Canonical Presets:** Bell State ($\frac{|00\rangle + |11\rangle}{\sqrt{2}}$), Grover's Search ($|11\rangle$ Oracle), Superposition Registers, and Quantum Teleportation.
- **Missions & Diagnostics:** Built-in challenge system with automated state verification.

### 6. Dedicated Ancient Rishi Login Experience
- **Honoring Maharshi Kanada:** Features the ancient sage and author of *Vaisheshika Sutra* (6th Century BCE) who proposed atomic theory (*Parmanu Vada*).
- **Google Sign-In:** Interactive OAuth account selection flow with persistent user state.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/anushkagupta200615-jpg/Ananta.git
cd Ananta
```

### 2. Run Locally
Serve using any static file server, for example with Python:
```bash
python -m http.server 8080
```
Then open your browser and navigate to:
- **Main Studio:** `http://localhost:8080`
- **Login Experience:** `http://localhost:8080/login.html`

---

## 📂 Project Structure

```
Ananta/
├── index.html              # Main single-page application & circuit studio
├── login.html              # Dedicated Google Sign-In page with ancient Rishi artwork
├── style.css               # Clean white design system & IBM gate styles
├── assets/
│   └── ancient_rishi.jpg   # Portrait of Maharshi Kanada with quantum orbits
├── js/
│   ├── quantum-engine.js   # Complex linear algebra & statevector engine
│   ├── bloch-sphere.js     # Three.js 3D Bloch sphere renderer
│   ├── circuit-ui.js       # Wire grid, gate placement & visualizers
│   ├── algorithms.js       # Canonical presets & mission challenges
│   └── app.js              # Coordinator, tab routing & Google auth flow
└── README.md
```

---

## 📜 Philosophical Heritage

> *"सर्वं द्रव्यं परमाणु रूपम्"*  
> *(All matter is composed of eternal, indivisible, vibrating quanta)*  
> — **Maharshi Kanada**, *Vaisheshika Sutra* (~6th Century BCE)

*Ananta* draws inspiration from India's profound tradition of cosmic atomism (*Parmanu*), wave fluctuations (*Spanda*), and infinite dimensional potentiality (*Ananta*).

---

## 📄 License
MIT License. Created with passion for quantum computing and scientific heritage.
