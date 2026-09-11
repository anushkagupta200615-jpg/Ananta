/**
 * Ananta - Quantum Knowledge Graph Manager
 * Visual DAG curriculum dependency graph and isolated per-user mastery tracker.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ananta_kg_mastery';
  const UNLOCK_THRESHOLD = 50; // Named constant: score needed in prereqs to unlock child node

  class KnowledgeGraphManager {
    constructor() {
      this.container = null;
      this.selectedNodeId = 'module-01';
      this.nodes = (typeof window !== 'undefined' && window.QUANTUM_KG_NODES) ? window.QUANTUM_KG_NODES : [];
      this.initDOM();
    }

    initDOM() {
      if (typeof document === 'undefined') return;
      if (!this.container) {
        this.container = document.getElementById('view-knowledge-graph');
      }
    }

    // Defensive read of isolated localStorage key: ananta_kg_mastery
    getMasteryScores() {
      try {
        if (typeof localStorage === 'undefined') return {};
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed;
        }
      } catch (err) {
        console.warn('[KnowledgeGraph] Failed to parse mastery scores from localStorage:', err);
      }
      return {};
    }

    // Defensive write to isolated localStorage key: ananta_kg_mastery
    setMasteryScore(nodeId, score) {
      try {
        const clampedScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
        const scores = this.getMasteryScores();
        scores[nodeId] = clampedScore;
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
        }
        // Reactive re-render
        this.render();
      } catch (err) {
        console.warn('[KnowledgeGraph] Failed to save mastery score to localStorage:', err);
      }
    }

    getNodeScore(nodeId, scores) {
      if (!scores) scores = this.getMasteryScores();
      const val = scores[nodeId];
      return (typeof val === 'number' && !isNaN(val)) ? Math.max(0, Math.min(100, Math.round(val))) : 0;
    }

    isNodeUnlocked(node, scores) {
      if (!node.prerequisites || node.prerequisites.length === 0) return true;
      if (!scores) scores = this.getMasteryScores();
      return node.prerequisites.every(prereqId => {
        const pScore = this.getNodeScore(prereqId, scores);
        return pScore >= UNLOCK_THRESHOLD;
      });
    }

    selectNode(nodeId) {
      this.selectedNodeId = nodeId;
      this.render();
    }

    // Main render entrypoint invoked on tab switch & interactive updates
    render() {
      this.initDOM();
      if (!this.container) return;

      const scores = this.getMasteryScores();
      const nodes = (window.QUANTUM_KG_NODES && window.QUANTUM_KG_NODES.length > 0)
        ? window.QUANTUM_KG_NODES
        : this.nodes;

      const nodeMap = {};
      nodes.forEach(n => { nodeMap[n.id] = n; });

      // Calculate curriculum mastery statistics
      let totalScore = 0;
      let unlockedCount = 0;
      let masteredCount = 0;

      nodes.forEach(node => {
        const score = this.getNodeScore(node.id, scores);
        totalScore += score;
        if (this.isNodeUnlocked(node, scores)) unlockedCount++;
        if (score >= 80) masteredCount++;
      });

      const avgMastery = nodes.length > 0 ? Math.round(totalScore / nodes.length) : 0;
      const selectedNode = nodeMap[this.selectedNodeId] || nodes[0];

      this.container.innerHTML = `
        <div class="kg-wrapper">
          <!-- Hero Header -->
          <div class="kg-header">
            <div class="kg-header-badge">
              <span class="kg-pulse-dot"></span>
              <span>CURRICULUM TOPOLOGY · PREREQUISITE DAG</span>
            </div>
            <h1 class="kg-title">Quantum Knowledge Graph</h1>
            <p class="kg-subtitle">
              Interactive prerequisite dependency map and concept mastery tracker across 10 core quantum computing modules.
            </p>

            <!-- Metrics Bar -->
            <div class="kg-stats-bar">
              <div class="kg-stat-card">
                <div class="kg-stat-value">${avgMastery}%</div>
                <div class="kg-stat-label">Average Mastery</div>
              </div>
              <div class="kg-stat-card">
                <div class="kg-stat-value">${unlockedCount} / ${nodes.length}</div>
                <div class="kg-stat-label">Unlocked Nodes</div>
              </div>
              <div class="kg-stat-card">
                <div class="kg-stat-value">${masteredCount} / ${nodes.length}</div>
                <div class="kg-stat-label">Mastered (≥80%)</div>
              </div>
              <div class="kg-stat-card">
                <div class="kg-stat-value">${UNLOCK_THRESHOLD}%</div>
                <div class="kg-stat-label">Unlock Threshold</div>
              </div>
            </div>

            <!-- Legend & Instructions -->
            <div class="kg-legend-row">
              <div class="kg-legend-item">
                <span class="kg-legend-indicator kg-legend-locked"></span>
                <span>Locked (Prereq &lt; ${UNLOCK_THRESHOLD}%)</span>
              </div>
              <div class="kg-legend-item">
                <span class="kg-legend-indicator kg-legend-progress"></span>
                <span>In Progress (1-79%)</span>
              </div>
              <div class="kg-legend-item">
                <span class="kg-legend-indicator kg-legend-mastered"></span>
                <span>Mastered (≥80%)</span>
              </div>
              <div class="kg-legend-item">
                <span class="kg-legend-indicator kg-legend-edge"></span>
                <span>Prerequisite Path</span>
              </div>
              <div class="kg-legend-hint">
                <span>💡 Click any node to inspect details and adjust your mastery score</span>
              </div>
            </div>
          </div>

          <!-- Main Layout: Graph Canvas & Inspector Panel -->
          <div class="kg-layout-body">
            <!-- Graph Visualizer SVG Canvas -->
            <div class="kg-graph-panel">
              <div class="kg-graph-scroll-container">
                ${this.renderSVGGraph(nodes, nodeMap, scores)}
              </div>
            </div>

            <!-- Node Inspector / Mastery Drawer -->
            <div class="kg-inspector-panel" id="kg-inspector">
              ${this.renderNodeInspector(selectedNode, nodeMap, scores)}
            </div>
          </div>
        </div>
      `;

      this.bindEvents(nodes, scores);
    }

    renderSVGGraph(nodes, nodeMap, scores) {
      // Dimensions for the DAG layout
      const svgWidth = 1200;
      const svgHeight = 500;

      // Generate directed Bezier edges
      let edgesHTML = '';
      nodes.forEach(targetNode => {
        const isTargetUnlocked = this.isNodeUnlocked(targetNode, scores);
        (targetNode.prerequisites || []).forEach(sourceId => {
          const sourceNode = nodeMap[sourceId];
          if (!sourceNode) return;

          const sourceScore = this.getNodeScore(sourceId, scores);
          const isPrereqSatisfied = sourceScore >= UNLOCK_THRESHOLD;

          // Connect from right of source to left of target
          const x1 = sourceNode.x + 42;
          const y1 = sourceNode.y;
          const x2 = targetNode.x - 42;
          const y2 = targetNode.y;
          const dx = Math.max(40, (x2 - x1) * 0.5);

          const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

          const edgeClass = isPrereqSatisfied
            ? 'kg-edge kg-edge-satisfied'
            : (isTargetUnlocked ? 'kg-edge kg-edge-pending' : 'kg-edge kg-edge-locked');

          const markerEnd = isPrereqSatisfied
            ? 'url(#kg-marker-satisfied)'
            : 'url(#kg-marker-locked)';

          edgesHTML += `
            <path d="${pathD}" class="${edgeClass}" marker-end="${markerEnd}" />
          `;
        });
      });

      // Generate nodes
      let nodesHTML = '';
      const radius = 38;
      const circumference = 2 * Math.PI * (radius + 4);

      nodes.forEach(node => {
        const score = this.getNodeScore(node.id, scores);
        const isUnlocked = this.isNodeUnlocked(node, scores);
        const isSelected = node.id === this.selectedNodeId;
        const offset = circumference - (score / 100) * circumference;

        let statusClass = 'kg-status-unstarted';
        if (!isUnlocked) {
          statusClass = 'kg-status-locked';
        } else if (score >= 80) {
          statusClass = 'kg-status-mastered';
        } else if (score > 0) {
          statusClass = 'kg-status-progress';
        }

        const selectedClass = isSelected ? 'kg-node-selected' : '';

        // Category color token
        const categoryColor = this.getCategoryColor(node.category);

        nodesHTML += `
          <g class="kg-node-group ${statusClass} ${selectedClass}"
             data-node-id="${node.id}"
             transform="translate(${node.x}, ${node.y})"
             tabindex="0"
             role="button"
             aria-label="${node.title} - Mastery: ${score}% - Status: ${isUnlocked ? 'Unlocked' : 'Locked'}">
            
            <!-- Outer focus/hover ring -->
            <circle class="kg-node-halo" r="${radius + 10}"></circle>

            <!-- Background Card Fill -->
            <circle class="kg-node-bg" r="${radius}"></circle>

            <!-- Progress Meter Ring -->
            <circle class="kg-node-meter-bg" r="${radius + 4}"></circle>
            <circle class="kg-node-meter-fill"
                    r="${radius + 4}"
                    style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${offset};"></circle>

            <!-- Center Content (Lock Icon or Module Short Tag) -->
            ${!isUnlocked ? `
              <text class="kg-node-lock-icon" text-anchor="middle" dy="6">🔒</text>
            ` : `
              <text class="kg-node-score-text" text-anchor="middle" dy="-2">${score}%</text>
              <text class="kg-node-level-text" text-anchor="middle" dy="14">${node.level}</text>
            `}

            <!-- Node Card Label & Category -->
            <g transform="translate(0, ${radius + 20})">
              <!-- Label pill background -->
              <rect class="kg-label-bg" x="-90" y="-3" width="180" height="42" rx="8"></rect>
              <text class="kg-node-label-title" text-anchor="middle" y="14">${this.truncateTitle(node.title, 22)}</text>
              <text class="kg-node-label-cat" text-anchor="middle" y="28" fill="${categoryColor}">${node.category}</text>
            </g>
          </g>
        `;
      });

      return `
        <svg class="kg-svg-canvas"
             viewBox="0 0 ${svgWidth} ${svgHeight}"
             preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- Marker for satisfied/unlocked edges -->
            <marker id="kg-marker-satisfied" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" class="kg-marker-satisfied-path" />
            </marker>

            <!-- Marker for locked/pending edges -->
            <marker id="kg-marker-locked" viewBox="0 0 10 10" refX="8" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" class="kg-marker-locked-path" />
            </marker>

            <!-- Drop shadow for selected node -->
            <filter id="kg-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Directed dependency edges -->
          <g class="kg-edges-layer">${edgesHTML}</g>

          <!-- Knowledge graph curriculum nodes -->
          <g class="kg-nodes-layer">${nodesHTML}</g>
        </svg>
      `;
    }

    renderNodeInspector(node, nodeMap, scores) {
      if (!node) {
        return `
          <div class="kg-inspector-empty">
            <p>Select a curriculum node to inspect prerequisites and manage mastery.</p>
          </div>
        `;
      }

      const score = this.getNodeScore(node.id, scores);
      const isUnlocked = this.isNodeUnlocked(node, scores);

      // Analyze prerequisites
      const prereqs = (node.prerequisites || []).map(pId => {
        const pNode = nodeMap[pId];
        const pScore = this.getNodeScore(pId, scores);
        const pSatisfied = pScore >= UNLOCK_THRESHOLD;
        return {
          id: pId,
          title: pNode ? pNode.title : pId,
          score: pScore,
          satisfied: pSatisfied
        };
      });

      // Find dependent modules (what this node unlocks)
      const unlocks = (window.QUANTUM_KG_NODES || this.nodes).filter(n =>
        (n.prerequisites || []).includes(node.id)
      );

      return `
        <div class="kg-inspector-card">
          <!-- Inspector Header -->
          <div class="kg-inspector-header">
            <div class="kg-inspector-badge-row">
              <span class="kg-pill kg-pill-cat">${node.category}</span>
              <span class="kg-pill kg-pill-level">${node.level}</span>
              ${isUnlocked
                ? (score >= 80
                    ? `<span class="kg-pill kg-pill-mastered">✓ Mastered</span>`
                    : `<span class="kg-pill kg-pill-unlocked">🔓 Unlocked</span>`)
                : `<span class="kg-pill kg-pill-locked">🔒 Locked</span>`
              }
            </div>
            <h2 class="kg-inspector-title">${node.title}</h2>
            <div class="kg-inspector-id">${node.id.toUpperCase()}</div>
          </div>

          <!-- Prerequisite Status Section -->
          <div class="kg-inspector-section">
            <div class="kg-section-title">Prerequisites</div>
            ${prereqs.length === 0 ? `
              <div class="kg-prereq-empty">
                <span>🌟 Entry-point module. No prerequisite dependencies required.</span>
              </div>
            ` : `
              <div class="kg-prereq-list">
                ${prereqs.map(p => `
                  <div class="kg-prereq-item ${p.satisfied ? 'kg-prereq-met' : 'kg-prereq-unmet'}"
                       data-jump-node="${p.id}"
                       title="Click to view ${p.title}">
                    <div class="kg-prereq-info">
                      <span class="kg-prereq-icon">${p.satisfied ? '✓' : '✗'}</span>
                      <span class="kg-prereq-title">${p.title}</span>
                    </div>
                    <div class="kg-prereq-score-badge ${p.satisfied ? 'kg-satisfied' : 'kg-pending'}">
                      ${p.score}% / ${UNLOCK_THRESHOLD}%
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Unlocks Section -->
          ${unlocks.length > 0 ? `
            <div class="kg-inspector-section">
              <div class="kg-section-title">Unlocks Downstream Modules</div>
              <div class="kg-unlocks-list">
                ${unlocks.map(u => `
                  <div class="kg-unlock-chip" data-jump-node="${u.id}">
                    <span class="kg-unlock-arrow">↳</span>
                    <span>${u.title}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Mastery Control Slider & Adjustment Panel -->
          <div class="kg-inspector-section kg-mastery-control-box">
            <div class="kg-section-title">
              <span>Manual Mastery Tracker</span>
              <span class="kg-score-display" id="kg-score-display-${node.id}">${score}%</span>
            </div>
            <p class="kg-control-hint">
              Adjust your self-assessed mastery level for this quantum concept. Setting all prerequisites ≥ ${UNLOCK_THRESHOLD}% unlocks dependent topics.
            </p>

            <!-- Range Slider -->
            <div class="kg-slider-wrapper">
              <input type="range"
                     min="0"
                     max="100"
                     step="1"
                     value="${score}"
                     class="kg-range-slider"
                     id="kg-slider-${node.id}"
                     aria-label="Mastery score for ${node.title}">
            </div>

            <!-- Stepper Buttons & Quick Presets -->
            <div class="kg-control-buttons-row">
              <div class="kg-stepper-group">
                <button type="button" class="kg-btn-step" data-step="-10" title="Decrease 10%">-10</button>
                <button type="button" class="kg-btn-step" data-step="-1" title="Decrease 1%">-1</button>
                <button type="button" class="kg-btn-step" data-step="+1" title="Increase 1%">+1</button>
                <button type="button" class="kg-btn-step" data-step="+10" title="Increase 10%">+10</button>
              </div>

              <div class="kg-preset-group">
                <button type="button" class="kg-btn-preset" data-preset="0">Reset</button>
                <button type="button" class="kg-btn-preset" data-preset="50">Unlock (50%)</button>
                <button type="button" class="kg-btn-preset" data-preset="100">Master (100%)</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    bindEvents(nodes, scores) {
      if (!this.container) return;

      // Click / keyboard on SVG nodes
      this.container.querySelectorAll('.kg-node-group').forEach(group => {
        const nodeId = group.getAttribute('data-node-id');
        group.addEventListener('click', () => {
          this.selectNode(nodeId);
        });
        group.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.selectNode(nodeId);
          }
        });
      });

      // Jump links from prereq list or unlock list
      this.container.querySelectorAll('[data-jump-node]').forEach(item => {
        item.addEventListener('click', () => {
          const jumpId = item.getAttribute('data-jump-node');
          if (jumpId) this.selectNode(jumpId);
        });
      });

      // Range slider input & change
      const selectedNodeId = this.selectedNodeId;
      const slider = this.container.querySelector(`#kg-slider-${selectedNodeId}`);
      const scoreDisplay = this.container.querySelector(`#kg-score-display-${selectedNodeId}`);

      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = Number(e.target.value);
          if (scoreDisplay) scoreDisplay.textContent = `${val}%`;
        });
        slider.addEventListener('change', (e) => {
          const val = Number(e.target.value);
          this.setMasteryScore(selectedNodeId, val);
        });
      }

      // Stepper buttons (-10, -1, +1, +10)
      this.container.querySelectorAll('.kg-btn-step').forEach(btn => {
        btn.addEventListener('click', () => {
          const delta = Number(btn.getAttribute('data-step')) || 0;
          const current = this.getNodeScore(selectedNodeId, scores);
          const next = Math.max(0, Math.min(100, current + delta));
          this.setMasteryScore(selectedNodeId, next);
        });
      });

      // Preset buttons (0, 50, 100)
      this.container.querySelectorAll('.kg-btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
          const presetVal = Number(btn.getAttribute('data-preset')) || 0;
          this.setMasteryScore(selectedNodeId, presetVal);
        });
      });
    }

    truncateTitle(title, maxLen) {
      if (!title) return '';
      return title.length > maxLen ? title.substring(0, maxLen - 1) + '…' : title;
    }

    getCategoryColor(category) {
      switch (category) {
        case 'Foundations': return 'var(--accent-cyan, #78d9ec)';
        case 'Quantum Gates': return 'var(--google-blue, #8ab4f8)';
        case 'Statistical Physics': return 'var(--accent-purple, #c58af9)';
        case 'Measurements': return 'var(--google-yellow, #fdd663)';
        case 'Hardware Physics': return 'var(--google-red, #f28b82)';
        case 'Software Engineering': return 'var(--google-green, #81c995)';
        case 'Quantum Phenomena': return 'var(--quantum-magenta, #d367c4)';
        case 'Quantum Protocols': return 'var(--ibm-coral, #f28b82)';
        case 'Quantum Algorithms': return 'var(--accent-emerald, #81c995)';
        case 'NISQ Algorithms': return 'var(--accent-indigo, #8ab4f8)';
        default: return 'var(--text-dim, #9aa0a6)';
      }
    }
  }

  // Expose on global window object
  window.KnowledgeGraphManager = KnowledgeGraphManager;
})();

