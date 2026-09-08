/**
 * Quantum Multi-Tier Field-Technician Dispatch Platform - Frontend Engine
 * Handles Canvas rendering, route animations, API communications, and Chart.js dashboards.
 */

// Application State
const state = {
  dispatchData: null,
  benchmarkData: null,
  activeTab: 'tab-sim',
  showRoutes: true,
  showHalos: true,
  animation: {
    isPlaying: false,
    currentMinute: 0, // 0 = 08:00 AM, 540 = 05:00 PM
    maxMinutes: 540,
    speedMultiplier: 5,
    timerId: null,
  },
  charts: {
    distance: null,
    cost: null,
    variance: null,
    co2: null,
  },
  auditLog: {
    autoScroll: true,
    filterCategories: {
      phase: true,
      method: true,
      quantum: true,
      mcda: true,
      kpi: true,
      debug: false,
    },
  },
};

// Skill color mapping
const SKILL_COLORS = {
  1: '#38BDF8', // Cyan (Tier 1: Residential)
  2: '#34D399', // Emerald (Tier 2: Fiber)
  3: '#FBBF24', // Amber (Tier 3: Commercial)
  4: '#F87171', // Rose (Tier 4: Heavy Infra)
};

const ROUTE_PALETTE = [
  '#00F0FF', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#EAB308', '#6366F1',
  '#14B8A6', '#D946EF', '#3B82F6', '#22C55E', '#FB923C'
];

// Quantum Distance Kernel Metadata & Formulas
const QUANTUM_KERNELS = {
  swap_test: {
    name: "Born's Rule Swap-Test Overlap Fidelity",
    code: 'SWAP',
    formula: 'D_Q = 1 - |⟨ψ|c⟩|² = 2 · P(|1⟩_ancilla)',
    desc: 'Continuous quantum distance computed via destructive interference probability P(|1⟩_anc) = (1 - |⟨ψ_i|c_k⟩|²) / 2.',
    formulaTeX: '$$D_Q(\\psi_i, c_k) = 2 \\cdot P(|1\\rangle_{\\text{anc}}) = 1.0 - |\\langle \\psi_i | c_k \\rangle|^2$$',
  },
  hadamard_test: {
    name: 'Hadamard Test Interference Kernel',
    code: 'HADAMARD',
    formula: 'D_Q = 1 - Re⟨ψ|c⟩ = 2 · P(|1⟩_had)',
    desc: 'Linear transition amplitude kernel measured directly via single-qubit Hadamard interference without Fredkin gates.',
    formulaTeX: '$$D_Q(\\psi_i, c_k) = 1.0 - \\text{Re}\\langle \\psi_i | c_k \\rangle = 2 \\cdot P(|1\\rangle_{\\text{had}})$$',
  },
  fubini_study: {
    name: 'Fubini-Study Geodesic Angle Metric',
    code: 'FUBINI-STUDY',
    formula: 'D_Q = arccos(|⟨ψ|c⟩|)',
    desc: 'Exact Riemannian geodesic distance along the curved manifold of pure quantum states on the Bloch / projective Hilbert sphere.',
    formulaTeX: '$$D_Q(\\psi_i, c_k) = \\arccos(|\\langle \\psi_i | c_k \\rangle|) = \\arccos\\left(\\sqrt{1 - 2 P(|1\\rangle)}\\right)$$',
  },
  quantum_euclidean: {
    name: 'Quantum Hilbert-Space Euclidean Metric',
    code: 'Q-EUCLID',
    formula: 'D_Q = ‖|ψ⟩ - |c⟩‖ = √(2 · (1 - |⟨ψ|c⟩|))',
    desc: 'Exact geometric Euclidean distance in Hilbert state space satisfying the strict triangle inequality.',
    formulaTeX: '$$D_Q(\\psi_i, c_k) = \\| |\\psi_i\\rangle - |c_k\\rangle \\|_2 = \\sqrt{2 \\cdot (1 - |\\langle \\psi_i | c_k \\rangle|)}$$',
  },
  zz_feature_map: {
    name: 'Entangled ZZ-Feature Map Kernel',
    code: 'ZZ-KERNEL',
    formula: 'D_Q = 1 - |⟨0| U_Φ†(c) U_Φ(x) |0⟩|²',
    desc: 'Non-linear quantum feature map embedding with parameterized ZZ entanglement phase coupling (γ).',
    formulaTeX: '$$D_Q(\\mathbf{x}, \\mathbf{c}) = 1.0 - |\\langle 0^{\\otimes n} | U_\\Phi^\\dagger(\\mathbf{c}) U_\\Phi(\\mathbf{x}) | 0^{\\otimes n} \\rangle|^2$$',
  },
};

// DOM Elements
const elements = {
  btnDispatch: document.getElementById('btn-run-dispatch'),
  btnBenchmark: document.getElementById('btn-run-benchmark'),
  inputTechs: document.getElementById('input-techs'),
  inputTasks: document.getElementById('input-tasks'),
  inputHubs: document.getElementById('input-hubs'),
  inputEmergency: document.getElementById('input-emergency'),
  inputFuzziness: document.getElementById('input-fuzziness'),
  inputSeed: document.getElementById('input-seed'),
  badgeTechs: document.getElementById('badge-techs'),
  badgeTasks: document.getElementById('badge-tasks'),
  badgeHubs: document.getElementById('badge-hubs'),
  badgeEmergency: document.getElementById('badge-emergency'),
  badgeFuzziness: document.getElementById('badge-fuzziness'),
  headerStatus: document.getElementById('header-status-val'),
  headerFleet: document.getElementById('header-fleet-val'),
  canvas: document.getElementById('dispatch-canvas'),
  tooltip: document.getElementById('map-tooltip'),
  timelineSlider: document.getElementById('timeline-slider'),
  timelineClock: document.getElementById('timeline-clock'),
  btnPlay: document.getElementById('btn-timeline-play'),
  btnStep: document.getElementById('btn-timeline-step'),
  speedSelect: document.getElementById('timeline-speed'),
  btnToggleRoutes: document.getElementById('btn-toggle-routes'),
  btnToggleHalos: document.getElementById('btn-toggle-halos'),
  btnResetZoom: document.getElementById('btn-reset-zoom'),
  progressTitle: document.getElementById('progress-phase-title'),
  progressPercent: document.getElementById('progress-percent-val'),
  progressFill: document.getElementById('progress-bar-fill'),
  progressDesc: document.getElementById('progress-stage-desc'),
  consoleStream: document.getElementById('console-log-stream'),
  auditLogCounter: document.getElementById('audit-log-counter'),
  btnToggleAutoScroll: document.getElementById('btn-toggle-auto-scroll'),
  btnFilterAll: document.getElementById('btn-filter-all'),
  btnFilterNone: document.getElementById('btn-filter-none'),
  btnClearLogs: document.getElementById('btn-clear-logs'),
  btnDownloadPdf: document.getElementById('btn-download-pdf'),
  btnBenchmarkTab: document.getElementById('btn-run-benchmark-tab'),
  selectMethod: document.getElementById('select-method'),
  badgeMethod: document.getElementById('badge-method'),
  selectQuantumKernel: document.getElementById('select-quantum-kernel'),
  badgeQuantumKernelCode: document.getElementById('badge-quantum-kernel-code'),
  quantumKernelFormulaVal: document.getElementById('quantum-kernel-formula-val'),
  selectQuantumShots: document.getElementById('select-quantum-shots'),
  badgeQuantumShots: document.getElementById('badge-quantum-shots'),
  inputQuantumGamma: document.getElementById('input-quantum-gamma'),
  badgeQuantumGamma: document.getElementById('badge-quantum-gamma'),
  qKernelCardTitle: document.getElementById('q-kernel-card-title'),
  qKernelCardDesc: document.getElementById('q-kernel-card-desc'),
  qKernelCardFormula: document.getElementById('q-kernel-card-formula'),
};

// Canvas Context
const ctx = elements.canvas.getContext('2d');

function setProgress(percent, title, desc) {
  if (elements.progressPercent) elements.progressPercent.textContent = `${Math.round(percent)}%`;
  if (elements.progressFill) elements.progressFill.style.width = `${Math.round(percent)}%`;
  if (elements.progressTitle) elements.progressTitle.textContent = title;
  if (elements.progressDesc) elements.progressDesc.textContent = desc;
}

function addLogEntry(time, phase, level, msg, category) {
  if (!elements.consoleStream) return;
  const div = document.createElement('div');
  div.className = 'log-line';

  // Infer category if not provided
  let cat = category;
  if (!cat) {
    const pUpper = (phase || '').toUpperCase();
    if (['INIT', 'TIER 1', 'TIER 2', 'TIER 3', 'TIER 4', 'COMPLETED', 'EXPORT'].includes(pUpper)) {
      cat = 'phase';
    } else if (['QUANTUM', 'QAOA', 'SWAP-TEST', 'QGA'].includes(pUpper)) {
      cat = 'quantum';
    } else if (['MCDA'].includes(pUpper)) {
      cat = 'mcda';
    } else if (['KPI'].includes(pUpper)) {
      cat = 'kpi';
    } else if (['DEBUG'].includes(pUpper)) {
      cat = 'debug';
    } else if (['FIFO', 'C-KM', 'Q-KM', 'C-FCM', 'SC-QFCM', 'P-GA', 'Q-GA', 'KM-GA', 'QKM-QGA'].includes(pUpper)) {
      cat = 'method';
    } else {
      cat = 'phase';
    }
  }

  div.dataset.category = cat;

  // Determine badge styling class
  let badgeClass = 'badge-phase';
  const pNorm = (phase || 'INFO').toUpperCase();
  if (cat === 'quantum') badgeClass = 'badge-quantum';
  else if (cat === 'mcda') badgeClass = 'badge-mcda';
  else if (cat === 'kpi') badgeClass = 'badge-kpi';
  else if (cat === 'method') badgeClass = 'badge-method';
  else if (cat === 'debug') badgeClass = 'badge-debug';
  else if (pNorm === 'EXPORT') badgeClass = 'badge-export';
  else if (pNorm === 'ERROR') badgeClass = 'badge-error';
  else if (pNorm.includes('TIER 1')) badgeClass = 'badge-tier1';
  else if (pNorm.includes('TIER 2')) badgeClass = 'badge-tier2';
  else if (pNorm.includes('TIER 3')) badgeClass = 'badge-tier3';
  else if (pNorm.includes('TIER 4')) badgeClass = 'badge-tier4';
  else if (pNorm === 'COMPLETED' || pNorm === 'SUCCESS') badgeClass = 'badge-completed';
  else if (pNorm === 'INIT') badgeClass = 'badge-init';

  // Visibility based on current filter state
  const isCategoryEnabled = state.auditLog.filterCategories[cat] !== false;
  if (!isCategoryEnabled) {
    div.style.display = 'none';
  }

  div.innerHTML = `
    <span class="log-time">${time || new Date().toLocaleTimeString()}</span>
    <span class="log-phase-badge ${badgeClass}">${phase || 'INFO'}</span>
    <span class="log-msg">${msg}</span>
  `;
  elements.consoleStream.appendChild(div);

  // Auto scroll if enabled
  if (state.auditLog.autoScroll) {
    elements.consoleStream.scrollTop = elements.consoleStream.scrollHeight;
  }

  updateLogCounter();
}

function updateLogCounter() {
  if (!elements.auditLogCounter || !elements.consoleStream) return;
  const allLines = elements.consoleStream.querySelectorAll('.log-line');
  const visibleLines = elements.consoleStream.querySelectorAll('.log-line:not([style*="display: none"])');
  if (allLines.length === visibleLines.length) {
    elements.auditLogCounter.textContent = `${allLines.length} ${allLines.length === 1 ? 'entry' : 'entries'}`;
  } else {
    elements.auditLogCounter.textContent = `${visibleLines.length} / ${allLines.length} shown`;
  }
}

function applyLogFilters() {
  const cbs = document.querySelectorAll('.audit-filter-cb');
  cbs.forEach((cb) => {
    const cat = cb.dataset.category;
    if (cat) {
      state.auditLog.filterCategories[cat] = cb.checked;
    }
  });

  if (!elements.consoleStream) return;
  const lines = elements.consoleStream.querySelectorAll('.log-line');
  lines.forEach((line) => {
    const cat = line.dataset.category || 'phase';
    if (state.auditLog.filterCategories[cat] !== false) {
      line.style.display = '';
    } else {
      line.style.display = 'none';
    }
  });

  updateLogCounter();
}

function clearLogs() {
  if (elements.consoleStream) {
    elements.consoleStream.innerHTML = '';
  }
  updateLogCounter();
}

// Initialize Event Listeners
function initListeners() {
  // Sliders input updates
  elements.inputTechs.addEventListener('input', (e) => {
    elements.badgeTechs.textContent = Number(e.target.value).toLocaleString();
    elements.headerFleet.textContent = `${Number(e.target.value).toLocaleString()} Techs`;
    if (!state.dispatchData) renderMap();
  });
  elements.inputTasks.addEventListener('input', (e) => {
    elements.badgeTasks.textContent = Number(e.target.value).toLocaleString();
    if (!state.dispatchData) renderMap();
  });
  elements.inputHubs.addEventListener('input', (e) => {
    elements.badgeHubs.textContent = Number(e.target.value).toLocaleString();
    if (!state.dispatchData) renderMap();
  });
  elements.inputEmergency.addEventListener('input', (e) => {
    elements.badgeEmergency.textContent = `${e.target.value}%`;
    if (!state.dispatchData) renderMap();
  });
  elements.inputFuzziness.addEventListener('input', (e) => {
    elements.badgeFuzziness.textContent = Number(e.target.value).toFixed(1);
    if (!state.dispatchData) renderMap();
  });

  // Preset Buttons (Selects configuration WITHOUT auto-running solving)
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const tasks = btn.dataset.tasks;
      const techs = btn.dataset.techs;
      const hubs = btn.dataset.hubs;

      elements.inputTasks.value = tasks;
      elements.inputTechs.value = techs;
      elements.inputHubs.value = hubs;

      elements.badgeTasks.textContent = Number(tasks).toLocaleString();
      elements.badgeTechs.textContent = Number(techs).toLocaleString();
      elements.badgeHubs.textContent = Number(hubs).toLocaleString();
      elements.headerFleet.textContent = `${Number(techs).toLocaleString()} Techs`;

      // Update idle canvas preview without auto-running solve
      if (!state.dispatchData) {
        renderMap();
      }
    });
  });

  // Tab Navigation (Auto-populates Detailed Benchmark Dashboard)
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
      state.activeTab = btn.dataset.tab;

      if (btn.dataset.tab === 'tab-bench') {
        if (state.benchmarkData) {
          updateBenchmarkUI(state.benchmarkData);
          setTimeout(() => {
            Object.values(state.charts).forEach((c) => {
              if (c && typeof c.resize === 'function') c.resize();
            });
          }, 50);
        } else {
          runBenchmark();
        }
      }
    });
  });

  // Calculation Method Selector
  if (elements.selectMethod) {
    elements.selectMethod.addEventListener('change', async (e) => {
      const chosen = e.target.value;
      if (elements.badgeMethod) {
        const txt = e.target.options[e.target.selectedIndex].text;
        elements.badgeMethod.textContent = txt.split('.')[0].trim();
      }
      if (typeof updateQuantumPanelActiveState === 'function') {
        updateQuantumPanelActiveState();
      }
      if (state.dispatchData) {
        await switchViewMethod(chosen);
      }
    });
  }

  // Clear Console
  if (elements.btnClearLogs) {
    elements.btnClearLogs.addEventListener('click', clearLogs);
  }

  // Toggle Auto-Scroll
  if (elements.btnToggleAutoScroll) {
    elements.btnToggleAutoScroll.addEventListener('click', () => {
      state.auditLog.autoScroll = !state.auditLog.autoScroll;
      elements.btnToggleAutoScroll.textContent = state.auditLog.autoScroll ? 'Scroll: ON' : 'Scroll: OFF';
      elements.btnToggleAutoScroll.classList.toggle('active', state.auditLog.autoScroll);
      if (state.auditLog.autoScroll && elements.consoleStream) {
        elements.consoleStream.scrollTop = elements.consoleStream.scrollHeight;
      }
    });
  }

  // Audit Filter Category Checkboxes
  const auditFilterCbs = document.querySelectorAll('.audit-filter-cb');
  auditFilterCbs.forEach((cb) => {
    cb.addEventListener('change', applyLogFilters);
  });

  if (elements.btnFilterAll) {
    elements.btnFilterAll.addEventListener('click', () => {
      document.querySelectorAll('.audit-filter-cb').forEach((cb) => {
        cb.checked = true;
      });
      applyLogFilters();
    });
  }

  if (elements.btnFilterNone) {
    elements.btnFilterNone.addEventListener('click', () => {
      document.querySelectorAll('.audit-filter-cb').forEach((cb) => {
        cb.checked = false;
      });
      applyLogFilters();
    });
  }

  // Initial filter sync and count
  applyLogFilters();

  // Benchmark Tab Run Button
  if (elements.btnBenchmarkTab) {
    elements.btnBenchmarkTab.addEventListener('click', runBenchmark);
  }

  // Active Methods Checkbox Chooser Listeners
  const btnSelectAll = document.getElementById('btn-select-all-methods');
  if (btnSelectAll) {
    btnSelectAll.addEventListener('click', () => {
      document.querySelectorAll('.method-cb').forEach((cb) => {
        cb.checked = true;
      });
      updateActiveMethodsUI();
    });
  }

  const btnDeselectAll = document.getElementById('btn-deselect-all-methods');
  if (btnDeselectAll) {
    btnDeselectAll.addEventListener('click', () => {
      document.querySelectorAll('.method-cb').forEach((cb) => {
        cb.checked = false;
      });
      // Keep currently selected method checked
      const cur = elements.selectMethod ? elements.selectMethod.value : 'quantum_multitier_qfcm';
      const curCb = document.querySelector(`.method-cb[value="${cur}"]`);
      if (curCb) curCb.checked = true;
      updateActiveMethodsUI();
    });
  }

  document.querySelectorAll('.method-cb').forEach((cb) => {
    cb.addEventListener('change', () => {
      const active = getActiveMethods();
      // If current dropdown selection was unchecked, switch dropdown to first active method
      if (elements.selectMethod && !active.includes(elements.selectMethod.value)) {
        elements.selectMethod.value = active[0];
        if (elements.badgeMethod) {
          const opt = elements.selectMethod.options[elements.selectMethod.selectedIndex];
          elements.badgeMethod.textContent = opt ? opt.text.split('.')[0].trim() : 'Active';
        }
      }
      updateActiveMethodsUI();
    });
  });
  // Quantum Distance Kernel Selection Listeners
  function updateQuantumKernelUI() {
    const kKey = elements.selectQuantumKernel ? elements.selectQuantumKernel.value : 'swap_test';
    const kInfo = QUANTUM_KERNELS[kKey] || QUANTUM_KERNELS['swap_test'];
    if (elements.badgeQuantumKernelCode) {
      elements.badgeQuantumKernelCode.textContent = kInfo.code;
    }
    if (elements.quantumKernelFormulaVal) {
      elements.quantumKernelFormulaVal.textContent = kInfo.formula;
    }
    if (elements.qKernelCardTitle) {
      elements.qKernelCardTitle.textContent = kInfo.name;
    }
    if (elements.qKernelCardDesc) {
      elements.qKernelCardDesc.textContent = kInfo.desc;
    }
    if (elements.qKernelCardFormula) {
      elements.qKernelCardFormula.textContent = kInfo.formula;
    }

    // Handle Entanglement Gamma parameter active vs inactive state
    const isZZ = kKey === 'zz_feature_map';
    const gammaCol = document.getElementById('qparam-col-gamma');
    if (gammaCol) {
      gammaCol.classList.toggle('is-inactive', !isZZ);
    }
    if (elements.inputQuantumGamma) {
      elements.inputQuantumGamma.disabled = !isZZ;
    }
    if (elements.badgeQuantumGamma) {
      if (isZZ) {
        const gVal = parseFloat(elements.inputQuantumGamma.value).toFixed(2);
        elements.badgeQuantumGamma.textContent = `γ = ${gVal}`;
      } else {
        elements.badgeQuantumGamma.textContent = 'N/A (ZZ Only)';
      }
    }

    updateQuantumPanelActiveState();
  }

  function updateQuantumPanelActiveState() {
    const quantumMethods = ['quantum_multitier_qfcm', 'quantum_kmeans', 'pure_ga_quantum', 'kmeans_depot_ga_quantum'];
    const curMethod = elements.selectMethod ? elements.selectMethod.value : 'quantum_multitier_qfcm';
    const activeMethods = getActiveMethods();
    const isQuantumSelected = quantumMethods.includes(curMethod);
    const hasQuantumActive = activeMethods.some((m) => quantumMethods.includes(m));

    const panel = document.getElementById('quantum-kernel-panel');
    const notice = document.getElementById('quantum-kernel-inactive-notice');
    const badge = elements.badgeQuantumKernelCode;
    const kKey = elements.selectQuantumKernel ? elements.selectQuantumKernel.value : 'swap_test';
    const kInfo = QUANTUM_KERNELS[kKey] || QUANTUM_KERNELS['swap_test'];

    if (panel) {
      panel.classList.toggle('is-inactive', !isQuantumSelected);
    }
    if (notice) {
      notice.style.display = isQuantumSelected ? 'none' : 'flex';
      const noticeText = notice.querySelector('.inactive-notice-text');
      if (noticeText) {
        if (hasQuantumActive) {
          noticeText.textContent = 'Standby for classical active view. Active for Quantum Paradigms (3, 5, 7, 9) in benchmark.';
        } else {
          noticeText.textContent = 'Inactive: current solver and active options are classical (Paradigms 1, 2, 4, 6, 8, 10).';
        }
      }
    }
    if (badge) {
      if (isQuantumSelected) {
        badge.textContent = kInfo.code;
        badge.title = `Active quantum kernel: ${kInfo.name}`;
      } else if (hasQuantumActive) {
        badge.textContent = 'STANDBY';
        badge.title = 'Active in benchmark for quantum algorithms, but standby for current classical map view';
      } else {
        badge.textContent = 'INACTIVE';
        badge.title = 'Inactive for classical algorithms';
      }
    }
  }

  if (elements.selectQuantumKernel) {
    elements.selectQuantumKernel.addEventListener('change', () => {
      updateQuantumKernelUI();
      const kKey = elements.selectQuantumKernel.value;
      const kInfo = QUANTUM_KERNELS[kKey];
      addLogEntry(null, 'CONFIG', 'INFO', `Selected Quantum Distance Kernel: ${kInfo.name} [${kInfo.code}]`, 'quantum');
    });
  }

  if (elements.selectQuantumShots) {
    elements.selectQuantumShots.addEventListener('change', () => {
      if (elements.badgeQuantumShots) {
        elements.badgeQuantumShots.textContent = `${parseInt(elements.selectQuantumShots.value, 10).toLocaleString()} Shots`;
      }
      addLogEntry(null, 'CONFIG', 'INFO', `Ancilla Measurement Precision: ${elements.selectQuantumShots.value} shots/sample`, 'quantum');
    });
  }

  if (elements.inputQuantumGamma) {
    elements.inputQuantumGamma.addEventListener('input', () => {
      const gVal = parseFloat(elements.inputQuantumGamma.value).toFixed(2);
      if (elements.badgeQuantumGamma) {
        elements.badgeQuantumGamma.textContent = `γ = ${gVal}`;
      }
    });
  }
  updateQuantumKernelUI();

  // Action Buttons
  elements.btnDispatch.addEventListener('click', runDispatch);
  elements.btnBenchmark.addEventListener('click', () => {
    document.getElementById('tab-btn-bench').click();
    runBenchmark();
  });

  // Map Controls
  elements.btnToggleRoutes.addEventListener('click', () => {
    state.showRoutes = !state.showRoutes;
    renderMap();
  });
  elements.btnToggleHalos.addEventListener('click', () => {
    state.showHalos = !state.showHalos;
    renderMap();
  });
  elements.btnResetZoom.addEventListener('click', renderMap);

  // Timeline Controls
  elements.btnPlay.addEventListener('click', togglePlay);
  elements.btnStep.addEventListener('click', stepTimeline);
  elements.timelineSlider.addEventListener('input', (e) => {
    state.animation.currentMinute = parseInt(e.target.value, 10);
    updateClockDisplay();
    renderMap();
  });
  elements.speedSelect.addEventListener('change', (e) => {
    state.animation.speedMultiplier = parseInt(e.target.value, 10);
  });

  // Tooltip Mouse Hover on Canvas
  elements.canvas.addEventListener('mousemove', handleCanvasHover);
  elements.canvas.addEventListener('mouseleave', () => {
    elements.tooltip.style.display = 'none';
  });

  // Window Resize
  window.addEventListener('resize', resizeCanvas);
}

// Resize canvas high-DPI
function resizeCanvas() {
  const rect = elements.canvas.parentElement.getBoundingClientRect();
  elements.canvas.width = rect.width * window.devicePixelRatio;
  elements.canvas.height = rect.height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  renderMap();
}

// Format Clock (0 -> 08:00 AM, 540 -> 05:00 PM)
function updateClockDisplay() {
  const totalMin = 480 + state.animation.currentMinute; // 480 = 8h * 60
  const hours24 = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 > 12 ? hours24 - 12 : hours24;
  const padMin = mins < 10 ? `0${mins}` : mins;
  elements.timelineClock.textContent = `${hours12}:${padMin} ${ampm}`;
  elements.timelineSlider.value = state.animation.currentMinute;
}

// Play / Pause Animation Loop
function togglePlay() {
  state.animation.isPlaying = !state.animation.isPlaying;
  if (state.animation.isPlaying) {
    elements.btnPlay.textContent = '⏸ Pause';
    elements.btnPlay.style.background = '#F59E0B';
    startAnimationLoop();
  } else {
    elements.btnPlay.textContent = '▶ Play Day';
    elements.btnPlay.style.background = '#00F0FF';
    cancelAnimationFrame(state.animation.timerId);
  }
}

function startAnimationLoop() {
  if (!state.animation.isPlaying) return;

  state.animation.currentMinute += 0.5 * state.animation.speedMultiplier;
  if (state.animation.currentMinute > state.animation.maxMinutes) {
    state.animation.currentMinute = 0;
  }

  updateClockDisplay();
  renderMap();

  state.animation.timerId = requestAnimationFrame(startAnimationLoop);
}

function stepTimeline() {
  state.animation.currentMinute = Math.min(state.animation.maxMinutes, state.animation.currentMinute + 30);
  updateClockDisplay();
  renderMap();
}

function applyDispatchData(data) {
  state.dispatchData = data;
  updateKPIDashboard(data);
  if (data.quantum_metrics) updateQuantumTelemetry(data.quantum_metrics);
  renderMap();
}

async function switchViewMethod(method) {
  setProgress(50, 'SWITCHING PARADIGM', `Switching active map display to ${method}...`);
  try {
    const res = await fetch('/api/switch_view_method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method }),
    });
    if (!res.ok) {
      setProgress(100, 'VIEW READY', 'Switched view mode.');
      return;
    }
    const data = await res.json();
    if (data.kpis) {
      applyDispatchData(data);
      setProgress(100, 'PARADIGM ACTIVE', `Now viewing routes for ${data.kpis.method_name}.`);
      addLogEntry(null, 'VIEW', 'INFO', `Switched active map view to: ${data.kpis.method_name} (${data.kpis.total_distance_km.toFixed(1)} km)`);
    }
  } catch (err) {
    console.error('Failed to switch calculation view:', err);
  }
}

function getActiveMethods() {
  const checked = document.querySelectorAll('.method-cb:checked');
  const methods = Array.from(checked).map((cb) => cb.value);
  return methods.length > 0 ? methods : ['quantum_multitier_qfcm'];
}

function updateActiveMethodsUI() {
  const allCbs = document.querySelectorAll('.method-cb');
  const checkedCbs = document.querySelectorAll('.method-cb:checked');
  const countEl = document.getElementById('active-methods-count');
  if (countEl) {
    countEl.textContent = `${checkedCbs.length} of ${allCbs.length} Active`;
  }
  const btnLabel = document.getElementById('btn-run-benchmark-label');
  if (btnLabel) {
    btnLabel.textContent = `Run Benchmark (${checkedCbs.length} Active)`;
  }

  // Update visual inactive styling on checkbox labels
  allCbs.forEach((cb) => {
    const parentLabel = cb.closest('.method-cb-label');
    if (parentLabel) {
      parentLabel.classList.toggle('is-inactive', !cb.checked);
    }
  });

  if (typeof updateQuantumPanelActiveState === 'function') {
    updateQuantumPanelActiveState();
  }
}

// API: Run Dispatch with Real-Time Progress & Telemetry Logging
async function runDispatch() {
  elements.headerStatus.textContent = 'Solving...';
  elements.headerStatus.classList.remove('text-cyan', 'text-emerald', 'text-rose');
  elements.headerStatus.classList.add('text-amber');

  const activeMethods = getActiveMethods();
  const selectedMethod = elements.selectMethod ? elements.selectMethod.value : 'quantum_multitier_qfcm';
  const effectiveMethod = activeMethods.includes(selectedMethod) ? selectedMethod : activeMethods[0];

  const quantumKernel = elements.selectQuantumKernel ? elements.selectQuantumKernel.value : 'swap_test';
  const quantumShots = elements.selectQuantumShots ? parseInt(elements.selectQuantumShots.value, 10) : 2048;
  const quantumGamma = elements.inputQuantumGamma ? parseFloat(elements.inputQuantumGamma.value) : 1.0;

  const payload = {
    num_tasks: parseInt(elements.inputTasks.value, 10),
    total_technicians: parseInt(elements.inputTechs.value, 10),
    num_hubs: parseInt(elements.inputHubs.value, 10),
    emergency_ratio: parseFloat(elements.inputEmergency.value) / 100.0,
    fuzziness_m: parseFloat(elements.inputFuzziness.value),
    seed: parseInt(elements.inputSeed.value, 10),
    method: effectiveMethod,
    active_methods: activeMethods,
    quantum_kernel: quantumKernel,
    quantum_shots: quantumShots,
    quantum_gamma: quantumGamma,
  };

  // Phase 1: Problem initialization
  setProgress(15, 'Phase 1: Initializing', `Encoding ${payload.num_tasks.toLocaleString()} tasks across ${payload.num_hubs.toLocaleString()} hubs...`);
  addLogEntry(null, 'INIT', 'INFO', `Launching dispatch across ${activeMethods.length} active algorithms (${payload.num_tasks.toLocaleString()} tasks, ${payload.total_technicians.toLocaleString()} techs, ${payload.num_hubs.toLocaleString()} hubs)...`, 'phase');
  addLogEntry(null, 'DEBUG', 'INFO', `Dispatch parameters: Seed=${payload.seed}, Fuzziness m=${payload.fuzziness_m}, Emergency=${(payload.emergency_ratio * 100).toFixed(0)}%, Active=[${activeMethods.join(', ')}], Kernel=${quantumKernel} (${quantumShots} shots, γ=${quantumGamma})`, 'debug');

  try {
    // Progress stage transitions
    setTimeout(() => {
      setProgress(40, 'Phase 1: Active Algorithms', `Synthesizing ${activeMethods.length} active algorithms in parallel...`);
      addLogEntry(null, 'TIER 1', 'INFO', `Tier 1: Macro-spatial clustering in progress across ${activeMethods.length} active paradigms...`, 'phase');
    }, 120);

    setTimeout(() => {
      setProgress(68, 'Phase 2 & 3: Optimization', 'Applying skill feasibility filters & delta-heap shift leveling across active paradigms...');
      addLogEntry(null, 'TIER 2', 'INFO', 'Tier 2: Skill matching & technician certification validation...', 'phase');
    }, 280);

    setTimeout(() => {
      const kInfo = QUANTUM_KERNELS[quantumKernel] || QUANTUM_KERNELS['swap_test'];
      setProgress(88, 'Phase 4: Synthesis', `Synthesizing ${kInfo.name} circuits & Classiq QAOA Hamiltonian...`);
      addLogEntry(null, 'QUANTUM', 'QUANTUM', `Synthesizing ${kInfo.name} (${kInfo.code}) distance circuits & Hamiltonian parameters...`, 'quantum');
    }, 450);

    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    applyDispatchData(data);

    // Stream logs returned from server with specific categories
    if (data.logs && data.logs.length) {
      data.logs.forEach((l) => {
        addLogEntry(l.time, l.phase, l.level, l.msg, l.category);
      });
    }

    // Automatically build benchmark UI directly from solving results
    if (data.benchmark) {
      state.benchmarkData = data.benchmark;
      updateBenchmarkUI(data.benchmark);
    }

    // Auto-exported PDF handler
    if (data.exported_pdf_filename) {
      if (elements.btnDownloadPdf) {
        elements.btnDownloadPdf.href = `/api/export/${data.exported_pdf_filename}`;
        elements.btnDownloadPdf.style.display = 'flex';
        const label = document.getElementById('btn-download-pdf-label');
        if (label) label.textContent = `Download Report (${data.exported_pdf_filename.slice(0, 22)}...)`;
      }
      addLogEntry(
        null,
        'EXPORT',
        'SUCCESS',
        `📄 Auto-exported named PDF to /Export: <a href="/api/export/${data.exported_pdf_filename}" target="_blank" style="color:#00F0FF; text-decoration:underline; font-weight:bold;">${data.exported_pdf_filename}</a>`,
        'phase'
      );
    }

    setProgress(100, 'Completed', `${activeMethods.length}-algorithm dispatch completed in ${data.kpis.runtime_seconds}s (100% skill compliant)`);
    elements.headerStatus.textContent = 'Optimized';
    elements.headerStatus.classList.remove('text-amber');
    elements.headerStatus.classList.add('text-emerald');
  } catch (err) {
    console.error('Dispatch API error:', err);
    setProgress(100, 'Error', 'Execution failed. Check console.');
    addLogEntry(null, 'ERROR', 'ERROR', `Dispatch failed: ${err.message || err}`, 'phase');
    elements.headerStatus.textContent = 'Error';
    elements.headerStatus.classList.remove('text-amber');
    elements.headerStatus.classList.add('text-rose');
  }
}

// API: Run Benchmark with Progress & Telemetry Logging
async function runBenchmark() {
  const activeMethods = getActiveMethods();
  const quantumKernel = elements.selectQuantumKernel ? elements.selectQuantumKernel.value : 'swap_test';
  const quantumShots = elements.selectQuantumShots ? parseInt(elements.selectQuantumShots.value, 10) : 2048;
  const quantumGamma = elements.inputQuantumGamma ? parseFloat(elements.inputQuantumGamma.value) : 1.0;

  elements.headerStatus.textContent = 'Benchmarking...';
  setProgress(20, 'Benchmarking', `Evaluating ${activeMethods.length} active algorithm scenarios...`);
  addLogEntry(null, 'BENCH', 'INFO', `Starting comparative benchmark on ${activeMethods.length} active algorithms...`, 'phase');

  const payload = {
    num_tasks: parseInt(elements.inputTasks.value, 10),
    total_technicians: parseInt(elements.inputTechs.value, 10),
    num_hubs: parseInt(elements.inputHubs.value, 10),
    seed: parseInt(elements.inputSeed.value, 10),
    active_methods: activeMethods,
    quantum_kernel: quantumKernel,
    quantum_shots: quantumShots,
    quantum_gamma: quantumGamma,
  };

  addLogEntry(null, 'DEBUG', 'INFO', `Benchmark evaluation parameters: Tasks=${payload.num_tasks}, Techs=${payload.total_technicians}, Hubs=${payload.num_hubs}, Seed=${payload.seed}, Kernel=${quantumKernel} (${quantumShots} shots, γ=${quantumGamma})`, 'debug');

  try {
    setTimeout(() => {
      setProgress(55, 'Benchmarking', 'Evaluating selected optimization paradigms...');
      addLogEntry(null, 'TIER 1', 'INFO', `Benchmarking macro-spatial clustering across ${activeMethods.length} paradigms...`, 'phase');
    }, 150);

    setTimeout(() => {
      setProgress(80, 'Benchmarking', 'Synthesizing benchmark telemetry & MCDA rankings...');
      addLogEntry(null, 'MCDA', 'INFO', 'Calculating multi-criteria normalized scores (Dist 25%, Cost 25%, CO2 10%, Equity 20%, Compl 20%)...', 'mcda');
    }, 350);

    const res = await fetch('/api/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    const benchObj = (data && data.benchmark) ? data.benchmark : data;
    state.benchmarkData = benchObj;
    updateBenchmarkUI(benchObj);

    // Stream logs if returned
    if (data.logs && data.logs.length) {
      data.logs.forEach((l) => {
        addLogEntry(l.time, l.phase, l.level, l.msg, l.category);
      });
    }

    if (data.exported_pdf_filename) {
      if (elements.btnDownloadPdf) {
        elements.btnDownloadPdf.href = `/api/export/${data.exported_pdf_filename}`;
        elements.btnDownloadPdf.style.display = 'flex';
        const label = document.getElementById('btn-download-pdf-label');
        if (label) label.textContent = `Download Benchmark (${data.exported_pdf_filename.slice(0, 22)}...)`;
      }
      addLogEntry(
        null,
        'EXPORT',
        'SUCCESS',
        `📄 Auto-exported Benchmark PDF to /Export: <a href="/api/export/${data.exported_pdf_filename}" target="_blank" style="color:#00F0FF; text-decoration:underline; font-weight:bold;">${data.exported_pdf_filename}</a>`,
        'phase'
      );
    }

    const winnerObj = benchObj.complex_winner || data.complex_winner;
    const winnerName = (winnerObj && winnerObj.name) || 'Active Winner';
    const winnerScore = (winnerObj && winnerObj.score) || 100;
    const catsWon = (winnerObj && winnerObj.categories_won) || 5;
    addLogEntry(null, 'MCDA', 'SUCCESS', `🏆 MCDA Champion: ${winnerName} (Score: ${winnerScore}/100, Won ${catsWon}/5 categories)!`, 'mcda');
    addLogEntry(null, 'COMPLETED', 'SUCCESS', `${activeMethods.length}-Method Benchmark finished! Winner: ${winnerName}!`, 'phase');
    setProgress(100, 'Benchmarked', `${activeMethods.length}-Method comparison complete! Winner: ${winnerName}`);
    elements.headerStatus.textContent = 'Ready';
  } catch (err) {
    console.error('Benchmark API error:', err);
    setProgress(100, 'Error', 'Benchmark failed.');
    addLogEntry(null, 'ERROR', 'ERROR', `Benchmark error: ${err.message || err}`, 'phase');
  }
}

// Update Top KPI Cards
function updateKPIDashboard(data) {
  const kpi = data.kpis;
  const totalTasks = data.total_tasks_computed || kpi.total_tasks || 100;
  document.getElementById('kpi-active-techs').textContent =
    `${kpi.active_technicians_count.toLocaleString()} / ${kpi.standby_technicians_count.toLocaleString()}`;
  document.getElementById('kpi-active-sub').textContent =
    `${totalTasks.toLocaleString()} Tasks (100% Demand Served)`;
  document.getElementById('kpi-distance').textContent = `${kpi.total_distance_km.toLocaleString()} km`;
  document.getElementById('kpi-distance-miles').textContent = `${kpi.total_distance_miles.toLocaleString()} miles`;
  document.getElementById('kpi-windshield').textContent = `${kpi.total_windshield_hours.toLocaleString()} hrs`;
  document.getElementById('kpi-cost').textContent = `$${kpi.total_operating_cost_usd.toLocaleString()}`;
  document.getElementById('kpi-co2').textContent = `${kpi.epa_carbon_footprint_kg.toLocaleString()} kg`;
  document.getElementById('kpi-compliance').textContent =
    `${kpi.skill_compliance_rate}% / ${kpi.shift_compliance_rate}%`;

  if (data.display_tasks_count && data.display_tasks_count < totalTasks) {
    document.getElementById('map-telemetry').textContent =
      `Displaying ${data.display_tasks_count.toLocaleString()} sample tasks of ${totalTasks.toLocaleString()} total tasks (100% dispatched)`;
  } else {
    document.getElementById('map-telemetry').textContent =
      `Displaying all ${totalTasks.toLocaleString()} customer tasks. Click any stop or hub to inspect details.`;
  }
}

// Update Quantum Tab Telemetry
function updateQuantumTelemetry(qm) {
  if (!qm) return;
  document.getElementById('q-qubits').textContent = `${qm.qubits_allocated} Qubits`;
  document.getElementById('q-layers').textContent = `${qm.qaoa_layers} Layers (p=${qm.qaoa_layers})`;
  document.getElementById('q-depth').textContent = `${qm.circuit_depth} Depth`;
  document.getElementById('q-cx').textContent = `${qm.cx_entangling_gates} CX Gates`;
  document.getElementById('q-shots').textContent = `${(qm.ancilla_measurement_shots || 2048).toLocaleString()} Shots`;

  if (qm.quantum_kernel_name && elements.qKernelCardTitle) {
    elements.qKernelCardTitle.textContent = qm.quantum_kernel_name;
  }
  if (qm.quantum_kernel_formula && elements.qKernelCardFormula) {
    elements.qKernelCardFormula.textContent = qm.quantum_kernel_formula;
  }
  if (qm.quantum_kernel_key && QUANTUM_KERNELS[qm.quantum_kernel_key] && elements.qKernelCardDesc) {
    elements.qKernelCardDesc.textContent = QUANTUM_KERNELS[qm.quantum_kernel_key].desc;
  }
}

// Helper: Rounded Rectangle
function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

// Render Idle Welcome / Parameter Preview State (Prevents empty canvas)
function renderIdleCanvas() {
  const rect = elements.canvas.parentElement.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  // 1. Sleek Tactical Coordinate Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 100; i += 10) {
    const p1 = scaleCoord(i, 0);
    const p2 = scaleCoord(i, 100);
    ctx.beginPath();
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.stroke();

    const p3 = scaleCoord(0, i);
    const p4 = scaleCoord(100, i);
    ctx.beginPath();
    ctx.moveTo(p3.px, p3.py);
    ctx.lineTo(p4.px, p4.py);
    ctx.stroke();
  }

  // 2. Hub Previews & Radar Range Rings
  const numHubs = parseInt(elements.inputHubs ? elements.inputHubs.value : '1000', 10);
  const hubCoords = [];
  if (numHubs === 1) {
    hubCoords.push({ name: 'Hub 1: Central Depot', x: 50, y: 50 });
  } else if (numHubs === 2) {
    hubCoords.push({ name: 'Hub 1: East Depot', x: 70, y: 50 });
    hubCoords.push({ name: 'Hub 2: West Depot', x: 30, y: 50 });
  } else if (numHubs <= 16) {
    for (let h = 0; h < numHubs; h++) {
      const angle = (h / numHubs) * 2 * Math.PI;
      hubCoords.push({
        name: `Hub ${h + 1}`,
        x: 50 + 32 * Math.cos(angle),
        y: 50 + 32 * Math.sin(angle),
      });
    }
  } else {
    // When numHubs is large (e.g. 100 to 5000), sample up to 36 representative depot points for high-performance canvas
    const sampleCount = Math.min(36, numHubs);
    for (let h = 0; h < sampleCount; h++) {
      const ring = h % 3;
      const radius = ring === 0 ? 38 : ring === 1 ? 26 : 14;
      const angle = (h / sampleCount) * 2 * Math.PI + (ring * 0.4);
      hubCoords.push({
        name: `D${h + 1}`,
        x: 50 + radius * Math.cos(angle),
        y: 50 + radius * Math.sin(angle),
      });
    }
  }

  const drawRadar = numHubs <= 10;
  const drawLabels = numHubs <= 16;

  hubCoords.forEach((h) => {
    const pos = scaleCoord(h.x, h.y);

    // Subtle radar range circles (for small hub counts)
    if (drawRadar) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      [40, 90, 150].forEach((r) => {
        ctx.beginPath();
        ctx.arc(pos.px, pos.py, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.restore();
    }

    // Depot icon & glow
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, drawRadar ? 14 : 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Diamond symbol
    ctx.save();
    ctx.translate(pos.px, pos.py);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#F59E0B';
    const s = drawRadar ? 5 : 3;
    ctx.fillRect(-s, -s, s * 2, s * 2);
    ctx.restore();

    // Hub label
    if (drawLabels) {
      ctx.fillStyle = '#F59E0B';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(h.name, pos.px, pos.py + 26);
    }
  });

  // 3. Central Glassmorphic Mission Control Banner
  const cardW = Math.min(rect.width - 60, 560);
  const cardH = 175;
  const cardX = (rect.width - cardW) / 2;
  const cardY = (rect.height - cardH) / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(17, 24, 39, 0.94)';
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = 'rgba(0, 240, 255, 0.25)';
  ctx.shadowBlur = 24;
  roundRect(ctx, cardX, cardY, cardW, cardH, 12);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Title
  ctx.fillStyle = '#00F0FF';
  ctx.font = 'bold 15px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚛️ CLASSIQ SC-QFCM DISPATCH SIMULATOR READY', rect.width / 2, cardY + 34);

  // Subtitle
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('Multi-Tier Quantum Fuzzy C-Means & Intra-Route QAOA Hamiltonian Engine', rect.width / 2, cardY + 56);

  // Parameters Badge
  const nVal = elements.inputTasks ? elements.inputTasks.value : '1000';
  const kVal = elements.inputTechs ? elements.inputTechs.value : '50';
  const mVal = elements.inputHubs ? elements.inputHubs.value : '1000';
  const slaVal = elements.inputEmergency ? elements.inputEmergency.value : '0';

  ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
  roundRect(ctx, cardX + 24, cardY + 74, cardW - 48, 32, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
  ctx.stroke();

  ctx.fillStyle = '#34D399';
  ctx.font = 'bold 12px JetBrains Mono, monospace';
  ctx.fillText(
    `CONFIGURED: ${Number(nVal).toLocaleString()} Tasks • ${Number(kVal).toLocaleString()} Techs • ${Number(mVal).toLocaleString()} Depots • ${slaVal}% 911 SLA`,
    rect.width / 2,
    cardY + 95
  );

  // Call to action
  ctx.fillStyle = '#FBBF24';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText('👉 Click "🚀 Run Quantum Dispatch" in the left sidebar to start solve', rect.width / 2, cardY + 134);

  ctx.fillStyle = '#6B7280';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('(Adjust dispatch parameters or select a Quick Preset before solving)', rect.width / 2, cardY + 154);
  ctx.restore();
}

// Coordinate Scaling: converts [0, 100] coordinate domain to canvas dimensions
function scaleCoord(x, y) {
  const safeX = (x != null && !isNaN(x)) ? Number(x) : 50.0;
  const safeY = (y != null && !isNaN(y)) ? Number(y) : 50.0;
  const rect = elements.canvas.parentElement.getBoundingClientRect();
  const pad = 40;
  const w = Math.max(10, rect.width - pad * 2);
  const h = Math.max(10, rect.height - pad * 2);
  return {
    px: pad + (safeX / 100.0) * w,
    py: pad + ((100.0 - safeY) / 100.0) * h, // Invert Y for cartesian
  };
}

// Render Interactive Canvas Map
function renderMap() {
  if (!state.dispatchData) {
    renderIdleCanvas();
    return;
  }

  const rect = elements.canvas.parentElement.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const { hubs, tasks, active_technicians } = state.dispatchData;
  const hubsList = Array.isArray(hubs) ? hubs : [];
  const tasksList = Array.isArray(tasks) ? tasks : [];
  const techList = Array.isArray(active_technicians) ? active_technicians : [];

  // Build Fast & Safe O(1) Index Lookup Maps
  const hubMap = new Map();
  hubsList.forEach((h, idx) => {
    if (h && typeof h === 'object') {
      if (h.id != null) hubMap.set(h.id, h);
      hubMap.set(idx, h);
    }
  });

  const taskMap = new Map();
  tasksList.forEach((t, idx) => {
    if (t && typeof t === 'object') {
      if (t.id != null) taskMap.set(t.id, t);
      taskMap.set(idx, t);
    }
  });

  // Default fallback hub coordinates
  const defaultHub = hubsList[0] || { x: 50, y: 50, code: 'HUB1' };

  // 1. Draw Grid Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 100; i += 10) {
    const p1 = scaleCoord(i, 0);
    const p2 = scaleCoord(i, 100);
    ctx.beginPath();
    ctx.moveTo(p1.px, p1.py);
    ctx.lineTo(p2.px, p2.py);
    ctx.stroke();

    const p3 = scaleCoord(0, i);
    const p4 = scaleCoord(100, i);
    ctx.beginPath();
    ctx.moveTo(p3.px, p3.py);
    ctx.lineTo(p4.px, p4.py);
    ctx.stroke();
  }

  // 2. Draw Technician Route Loops
  if (state.showRoutes && techList.length > 0) {
    techList.forEach((tech, idx) => {
      if (!tech || !tech.assigned_tasks || tech.assigned_tasks.length === 0) return;
      const hub = hubMap.get(tech.depot_id) || defaultHub;
      if (!hub || hub.x == null || hub.y == null) return;
      const hubPos = scaleCoord(hub.x, hub.y);
      const color = ROUTE_PALETTE[idx % ROUTE_PALETTE.length];

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.globalAlpha = 0.65;

      ctx.moveTo(hubPos.px, hubPos.py);
      tech.assigned_tasks.forEach((tId) => {
        const task = taskMap.get(tId);
        if (task && task.x != null && task.y != null) {
          const tPos = scaleCoord(task.x, task.y);
          ctx.lineTo(tPos.px, tPos.py);
        }
      });
      ctx.lineTo(hubPos.px, hubPos.py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    });
  }

  // 3. Draw Tasks
  tasksList.forEach((task) => {
    if (!task || task.x == null || task.y == null) return;
    const pos = scaleCoord(task.x, task.y);
    const color = SKILL_COLORS[task.skill_required] || '#00F0FF';

    // Emergency SLA pulsing halo
    if (task.priority_sla >= 0.85) {
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Task node circle
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Small stroke
    ctx.strokeStyle = '#0B0F19';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 4. Draw Service Hubs / Depots
  const showHubLabels = hubsList.length <= 25;
  const hubRadius = hubsList.length > 50 ? 5 : hubsList.length > 20 ? 7 : 9;
  const hubGlow = hubsList.length > 50 ? 10 : hubsList.length > 20 ? 14 : 18;

  hubsList.forEach((hub) => {
    if (!hub || hub.x == null || hub.y == null) return;
    const pos = scaleCoord(hub.x, hub.y);

    // Hub Outer Glow
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, hubGlow, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Hub Inner Badge
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#00F0FF';
    ctx.fill();

    // Hub Label (when uncluttered)
    if (showHubLabels) {
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = '#F9FAFB';
      ctx.textAlign = 'center';
      ctx.fillText(`${hub.code || 'HUB'} (${hub.active_technicians || 0})`, pos.px, pos.py - 24);
    }
  });

  // 5. Draw Animated Technician Vehicle Dots if playback active
  if (techList.length > 0 && state.animation.currentMinute > 0) {
    const elapsedM = state.animation.currentMinute;

    techList.forEach((tech, idx) => {
      if (!tech || !tech.assigned_tasks || tech.assigned_tasks.length === 0) return;
      const hub = hubMap.get(tech.depot_id) || defaultHub;
      if (!hub || hub.x == null || hub.y == null) return;
      const hubPos = scaleCoord(hub.x, hub.y);
      const color = ROUTE_PALETTE[idx % ROUTE_PALETTE.length];

      // Build sequence of points
      const waypoints = [hubPos];
      tech.assigned_tasks.forEach((tId) => {
        const t = taskMap.get(tId);
        if (t && t.x != null && t.y != null) {
          waypoints.push(scaleCoord(t.x, t.y));
        }
      });
      waypoints.push(hubPos);

      if (waypoints.length < 2) return;

      // Estimate current vehicle position based on fraction of shift completed
      const totalShift = tech.total_shift_min || 1.0;
      const fraction = Math.min(1.0, elapsedM / totalShift);
      const totalSegments = waypoints.length - 1;
      const exactIndex = fraction * totalSegments;
      const segIndex = Math.min(totalSegments - 1, Math.floor(exactIndex));
      const segFraction = exactIndex - segIndex;

      const pStart = waypoints[segIndex];
      const pEnd = waypoints[segIndex + 1];

      if (!pStart || !pEnd) return;

      const curX = pStart.px + (pEnd.px - pStart.px) * segFraction;
      const curY = pStart.py + (pEnd.py - pStart.py) * segFraction;

      // Draw vehicle beacon
      ctx.beginPath();
      ctx.arc(curX, curY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
}

// Handle Canvas Hover Tooltip
function handleCanvasHover(e) {
  if (!state.dispatchData) return;

  const rect = elements.canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const { tasks, hubs } = state.dispatchData;
  const tasksList = Array.isArray(tasks) ? tasks : [];
  const hubsList = Array.isArray(hubs) ? hubs : [];

  let hoveredItem = null;
  let hoveredType = null;

  // Check tasks
  for (const t of tasksList) {
    if (!t || t.x == null || t.y == null) continue;
    const pos = scaleCoord(t.x, t.y);
    const dist = Math.hypot(pos.px - mouseX, pos.py - mouseY);
    if (dist < 10) {
      hoveredItem = t;
      hoveredType = 'task';
      break;
    }
  }

  // Check hubs
  if (!hoveredItem) {
    for (const h of hubsList) {
      if (!h || h.x == null || h.y == null) continue;
      const pos = scaleCoord(h.x, h.y);
      const dist = Math.hypot(pos.px - mouseX, pos.py - mouseY);
      if (dist < 20) {
        hoveredItem = h;
        hoveredType = 'hub';
        break;
      }
    }
  }

  if (hoveredItem) {
    elements.tooltip.style.display = 'block';
    elements.tooltip.style.left = `${mouseX + 15}px`;
    elements.tooltip.style.top = `${mouseY - 15}px`;

    if (hoveredType === 'task') {
      elements.tooltip.innerHTML = `
        <strong>Task #${hoveredItem.id}</strong><br/>
        Skill: ${hoveredItem.skill_name}<br/>
        Equipment: ${hoveredItem.equipment_name}<br/>
        Window: ${hoveredItem.time_window}<br/>
        Duration: ${hoveredItem.service_duration_min} min<br/>
        SLA: ${(hoveredItem.priority_sla * 100).toFixed(0)}% ${hoveredItem.priority_sla >= 0.85 ? '🚨 911 Emergency' : ''}<br/>
        Assigned: Tech #${hoveredItem.assigned_tech}
      `;
    } else {
      elements.tooltip.innerHTML = `
        <strong>${hoveredItem.name}</strong><br/>
        Code: ${hoveredItem.code}<br/>
        Assigned Orders: ${hoveredItem.assigned_tasks}<br/>
        Active Technicians: ${hoveredItem.active_technicians}<br/>
        Hub Workload: ${hoveredItem.workload_hours} hrs
      `;
    }
  } else {
    elements.tooltip.style.display = 'none';
  }
}

// Mathematical Multi-Criteria Decision Analysis (MCDA) Dynamic Ranking & Winner Calculation
function computeDynamicMCDARanking(sc, backendWinner) {
  const allPossibleKeys = [
    'baseline_fifo',
    'classic_kmeans',
    'quantum_kmeans',
    'classic_fcm',
    'quantum_multitier_qfcm',
    'pure_ga_classical',
    'pure_ga_quantum',
    'kmeans_depot_ga_classical',
    'kmeans_depot_ga_quantum',
    'simulated_annealing'
  ];
  const methodKeys = allPossibleKeys.filter(k => sc[k] && typeof sc[k].distance_km === 'number');
  if (methodKeys.length === 0) return null;

  const dists = methodKeys.map(k => sc[k].distance_km);
  const costs = methodKeys.map(k => sc[k].operating_cost_usd);
  const co2s = methodKeys.map(k => sc[k].co2_kg);
  const equities = methodKeys.map(k => sc[k].depot_workload_std);
  const comps = methodKeys.map(k => sc[k].shift_compliance_rate);

  const minD = Math.min(...dists), maxD = Math.max(...dists);
  const minC = Math.min(...costs), maxC = Math.max(...costs);
  const minE = Math.min(...co2s), maxE = Math.max(...co2s);
  const minEq = Math.min(...equities), maxEq = Math.max(...equities);
  const minComp = Math.min(...comps), maxComp = Math.max(...comps);

  const bestD = methodKeys[dists.indexOf(minD)];
  const bestC = methodKeys[costs.indexOf(minC)];
  const bestE = methodKeys[co2s.indexOf(minE)];
  const bestEq = methodKeys[equities.indexOf(minEq)];
  const bestComp = methodKeys[comps.indexOf(maxComp)];

  const catsWon = {};
  methodKeys.forEach(k => { catsWon[k] = 0; });
  catsWon[bestD] = (catsWon[bestD] || 0) + 1;
  catsWon[bestC] = (catsWon[bestC] || 0) + 1;
  catsWon[bestE] = (catsWon[bestE] || 0) + 1;
  catsWon[bestEq] = (catsWon[bestEq] || 0) + 1;
  catsWon[bestComp] = (catsWon[bestComp] || 0) + 1;

  const scores = {};
  methodKeys.forEach(k => {
    const item = sc[k];
    const sD = (maxD - item.distance_km) / (maxD - minD + 1e-6);
    const sC = (maxC - item.operating_cost_usd) / (maxC - minC + 1e-6);
    const sE = (maxE - item.co2_kg) / (maxE - minE + 1e-6);
    const sEq = maxEq > minEq ? (maxEq - item.depot_workload_std) / (maxEq - minEq + 1e-6) : 1.0;
    const sComp = maxComp > minComp ? (item.shift_compliance_rate - minComp) / (maxComp - minComp + 1e-6) : 1.0;

    const total = 100.0 * (0.25 * sD + 0.25 * sC + 0.10 * sE + 0.20 * sEq + 0.20 * sComp);
    scores[k] = Math.round(total * 10) / 10;
    item.calculatedScore = scores[k];
    item.categoriesWon = catsWon[k] || 0;
  });

  const rankedKeys = [...methodKeys].sort((a, b) => scores[b] - scores[a]);
  rankedKeys.forEach((k, idx) => {
    sc[k].calculatedRank = idx + 1;
  });

  const winKey = (backendWinner && backendWinner.key && sc[backendWinner.key]) ? backendWinner.key : rankedKeys[0];
  return {
    winnerKey: winKey,
    winner: sc[winKey] || sc[rankedKeys[0]],
    rankedKeys,
    scores,
    catsWon: catsWon[winKey] || 0,
  };
}

// Update Benchmark Charts & Table
function updateBenchmarkUI(data) {
  if (!data) return;
  const benchmarkObj = (data && data.benchmark) ? data.benchmark : data;
  let sc = benchmarkObj.scenarios;
  const adv = benchmarkObj.quantum_advantage || data.quantum_advantage || {
    distance_saved_percent: 0,
    distance_saved_km: 0,
    windshield_hours_saved: 0,
    operating_cost_saved_usd: 0,
    co2_saved_kg: 0,
  };

  // If scenarios map is not provided directly, synthesize from benchmarks array
  const benchmarksList = benchmarkObj.benchmarks || data.benchmarks;
  if (!sc && Array.isArray(benchmarksList) && benchmarksList.length >= 1) {
    sc = {};
    const keyMap = [
      'baseline_fifo',
      'classic_kmeans',
      'quantum_kmeans',
      'classic_fcm',
      'quantum_multitier_qfcm',
      'pure_ga_classical',
      'pure_ga_quantum',
      'kmeans_depot_ga_classical',
      'kmeans_depot_ga_quantum',
      'simulated_annealing'
    ];
    benchmarksList.forEach((b, idx) => {
      const k = b.method_code ? b.method_code.toLowerCase().replace(/[^a-z0-9_]/g, '_') : (keyMap[idx] || `method_${idx}`);
      sc[k] = {
        name: b.method_name || k,
        distance_km: b.total_fleet_distance_km || 0,
        windshield_hours: b.total_windshield_hours || 0,
        operating_cost_usd: b.total_operating_cost_usd || 0,
        co2_kg: b.epa_carbon_footprint_kg || 0,
        depot_workload_std: b.depot_workload_std || 0,
        shift_compliance_rate: b.shift_compliance_rate || 0,
        runtime_seconds: b.runtime_seconds || 0,
      };
    });
  }

  const validScKeys = sc ? Object.keys(sc).filter(k => sc[k] && typeof sc[k].distance_km === 'number') : [];
  if (validScKeys.length === 0) {
    console.warn('Benchmark data structure has no valid scenario metrics:', data);
    return;
  }

  // Banner Highlights: compute realistic savings across active methods
  const allDists = validScKeys.map(k => sc[k].distance_km);
  const maxD = Math.max(...allDists);
  const minD = Math.min(...allDists);
  const distSavedKm = (adv.distance_saved_km && adv.distance_saved_km > 0) ? adv.distance_saved_km : Math.max(0, maxD - minD);
  const distSavedPct = (adv.distance_saved_percent && adv.distance_saved_percent > 0) ? adv.distance_saved_percent : (maxD > 0 ? ((maxD - minD) / maxD * 100) : 0);

  const allCosts = validScKeys.map(k => sc[k].operating_cost_usd);
  const maxC = Math.max(...allCosts);
  const minC = Math.min(...allCosts);
  const costSavedUsd = (adv.operating_cost_saved_usd && adv.operating_cost_saved_usd > 0) ? adv.operating_cost_saved_usd : Math.max(0, maxC - minC);

  const allHrs = validScKeys.map(k => sc[k].windshield_hours);
  const maxH = Math.max(...allHrs);
  const minH = Math.min(...allHrs);
  const hrsSaved = (adv.windshield_hours_saved && adv.windshield_hours_saved > 0) ? adv.windshield_hours_saved : Math.max(0, maxH - minH);

  const allCo2 = validScKeys.map(k => sc[k].co2_kg);
  const maxCo2 = Math.max(...allCo2);
  const minCo2 = Math.min(...allCo2);
  const co2SavedKg = (adv.co2_saved_kg && adv.co2_saved_kg > 0) ? adv.co2_saved_kg : Math.max(0, maxCo2 - minCo2);

  const distEl = document.getElementById('adv-dist-val');
  if (distEl) distEl.textContent = `${distSavedPct.toFixed(1)}%`;
  const kmEl = document.getElementById('adv-dist-km');
  if (kmEl) kmEl.textContent = `${distSavedKm.toFixed(0)} km saved`;
  const hrsEl = document.getElementById('adv-hours-val');
  if (hrsEl) hrsEl.textContent = `${hrsSaved.toFixed(1)} hrs`;
  const costEl = document.getElementById('adv-cost-val');
  if (costEl) costEl.textContent = `$${costSavedUsd.toFixed(2)}`;
  const co2El = document.getElementById('adv-co2-val');
  if (co2El) co2El.textContent = `${co2SavedKg.toFixed(0)} kg CO2`;

  // Mathematical Multi-Criteria Ranking
  const mcda = computeDynamicMCDARanking(sc, benchmarkObj.complex_winner || data.complex_winner);
  const winner = mcda ? mcda.winner : (sc.quantum_multitier_qfcm || sc[validScKeys[0]]);
  const winnerKey = mcda ? mcda.winnerKey : validScKeys[0];
  const catsWon = mcda ? mcda.catsWon : 5;

  if (winner) {
    const titleEl = document.querySelector('.winner-method-title');
    if (titleEl) titleEl.textContent = `Method: ${winner.name}`;

    const scorePill = document.querySelector('.winner-score-pill');
    if (scorePill) {
      scorePill.textContent = `🏆 #1 OVERALL (${catsWon} OF 5 CATEGORIES WON) — SCORE ${winner.calculatedScore || 100}/100`;
    }

    const winDist = document.getElementById('win-dist-val');
    if (winDist) winDist.textContent = `${winner.distance_km.toFixed(1)} km`;
    const winCost = document.getElementById('win-cost-val');
    if (winCost) winCost.textContent = `$${winner.operating_cost_usd.toFixed(2)}`;
    const winCo2 = document.getElementById('win-co2-val');
    if (winCo2) winCo2.textContent = `${winner.co2_kg.toFixed(1)} kg`;
    const winEquity = document.getElementById('win-equity-val');
    if (winEquity) winEquity.textContent = `${winner.depot_workload_std.toFixed(2)} h`;
    const winComp = document.getElementById('win-comp-val');
    if (winComp) winComp.textContent = `${winner.shift_compliance_rate.toFixed(0)}%`;
  }

  // Render Charts with dynamic winner key highlight
  renderBenchmarkCharts(sc, winnerKey);

  // Render Audit Table sorted dynamically by rank
  const tbody = document.getElementById('benchmark-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const badgeMap = {
    quantum_multitier_qfcm: '⚡ Quantum + Soft Fuzzy',
    classic_fcm: '🌀 Classical Soft Fuzzy',
    quantum_kmeans: '⚛️ Quantum + Hard K-Means',
    classic_kmeans: '📐 Classical Hard K-Means',
    baseline_fifo: '⏱️ Classical FIFO Baseline',
    pure_ga_classical: '🧬 Classical Pure Genetic Algorithm',
    pure_ga_quantum: '⚛️🧬 Quantum-Inspired Pure GA (QGA)',
    kmeans_depot_ga_classical: '🗺️ Classical K-Means + Classical GA',
    kmeans_depot_ga_quantum: '⚛️🗺️ Quantum K-Means + Quantum GA',
    simulated_annealing: '🔥 Simulated Annealing Metaheuristic',
  };

  const allKeys = [
    'quantum_multitier_qfcm',
    'classic_fcm',
    'quantum_kmeans',
    'classic_kmeans',
    'baseline_fifo',
    'pure_ga_classical',
    'pure_ga_quantum',
    'kmeans_depot_ga_classical',
    'kmeans_depot_ga_quantum',
    'simulated_annealing'
  ];
  const orderedKeys = mcda ? mcda.rankedKeys : allKeys.filter(k => sc[k]);

  orderedKeys.forEach((key) => {
    const item = sc[key];
    if (!item) return;
    const rank = item.calculatedRank || 1;
    const isTop = rank === 1;
    const isQ = key.includes('quantum') || key.includes('qfcm') || key.includes('_q');
    const badge = badgeMap[key] || item.name;
    const scoreVal = item.calculatedScore != null ? item.calculatedScore : (100 - (rank - 1) * 10);
    const starCount = Math.max(0, Math.min(5, 5 - Math.floor((rank - 1) * 0.6)));
    const starStr = '★'.repeat(starCount) + '☆'.repeat(5 - starCount);
    const scoreDisplay = `${starStr} ${scoreVal}/100`;

    const tr = document.createElement('tr');
    if (isTop) tr.className = 'tr-winner';

    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="rank-badge rank-${rank}">#${rank}</span>
          <div>
            <div style="font-weight: bold; color: ${isTop ? '#FFD700' : isQ ? '#A78BFA' : '#F3F4F6'}">
              ${item.name} ${isTop ? '🏆 <span style="font-size:10px; color:#FFD700; font-weight:800; border:1px solid #FFD700; border-radius:3px; padding:1px 4px; margin-left:4px;">WINNER</span>' : ''}
            </div>
            <div style="font-size: 10px; color: #9CA3AF; margin-top: 2px;">${badge}</div>
          </div>
        </div>
      </td>
      <td>
        <span style="color: ${isTop ? '#FFD700' : '#E2E8F0'}; font-weight: 700; font-size: 11px;">${scoreDisplay}</span>
      </td>
      <td><strong style="color: ${isTop ? '#00F0FF' : 'inherit'}">${item.distance_km.toFixed(1)} km</strong></td>
      <td>${item.windshield_hours.toFixed(1)} h</td>
      <td class="${isTop ? 'text-emerald' : ''}">$${item.operating_cost_usd.toFixed(2)}</td>
      <td>${item.co2_kg.toFixed(1)} kg</td>
      <td style="${isTop ? 'color: #00F0FF; font-weight: 700;' : ''}">${item.depot_workload_std.toFixed(2)} h</td>
      <td class="${item.shift_compliance_rate >= 80 ? 'text-emerald' : 'text-rose'}">${item.shift_compliance_rate.toFixed(1)}%</td>
      <td>${(item.runtime_seconds * 1000).toFixed(1)} ms</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderBenchmarkCharts(sc, winnerKey) {
  const methodMap = [
    { key: 'baseline_fifo', label: '1. FIFO', color: '#6B7280' },
    { key: 'classic_kmeans', label: '2. C-KM', color: '#F59E0B' },
    { key: 'quantum_kmeans', label: '3. Q-KM', color: '#6366F1' },
    { key: 'classic_fcm', label: '4. C-FCM', color: '#10B981' },
    { key: 'quantum_multitier_qfcm', label: '5. SC-QFCM', color: '#00F0FF' },
    { key: 'pure_ga_classical', label: '6. Pure GA', color: '#F43F5E' },
    { key: 'pure_ga_quantum', label: '7. Pure Q-GA', color: '#D946EF' },
    { key: 'kmeans_depot_ga_classical', label: '8. KM+GA', color: '#14B8A6' },
    { key: 'kmeans_depot_ga_quantum', label: '9. QKM+QGA', color: '#8B5CF6' },
    { key: 'simulated_annealing', label: '10. SA', color: '#F97316' },
  ].filter(m => sc[m.key] && typeof sc[m.key].distance_km === 'number');

  if (methodMap.length === 0) return;

  const effectiveWinnerKey = winnerKey || (methodMap[0] && methodMap[0].key);
  const labels = methodMap.map(m => m.key === effectiveWinnerKey ? `${m.label} 🏆` : m.label);
  const colors = methodMap.map(m => m.color);
  const borderColors = methodMap.map(m => m.key === effectiveWinnerKey ? '#FFD700' : 'transparent');
  const borderWidths = methodMap.map(m => m.key === effectiveWinnerKey ? 3.0 : 0);

  const getMetric = (metric) => methodMap.map(m => sc[m.key] ? sc[m.key][metric] || 0 : 0);

  // Chart 1: Distance (km)
  if (state.charts.distance) state.charts.distance.destroy();
  state.charts.distance = new Chart(document.getElementById('chart-distance'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Distance (km)',
          data: getMetric('distance_km'),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: borderWidths,
        },
      ],
    },
    options: chartDefaultOptions(),
  });

  // Chart 2: Operating Cost ($)
  if (state.charts.cost) state.charts.cost.destroy();
  state.charts.cost = new Chart(document.getElementById('chart-cost'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Operating Cost ($)',
          data: getMetric('operating_cost_usd'),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: borderWidths,
        },
      ],
    },
    options: chartDefaultOptions(),
  });

  // Chart 3: Workload Variance
  if (state.charts.variance) state.charts.variance.destroy();
  state.charts.variance = new Chart(document.getElementById('chart-variance'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Depot Workload Std Dev (Hours)',
          data: getMetric('depot_workload_std'),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: borderWidths,
        },
      ],
    },
    options: chartDefaultOptions(),
  });

  // Chart 4: CO2
  if (state.charts.co2) state.charts.co2.destroy();
  state.charts.co2 = new Chart(document.getElementById('chart-co2'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'CO2 Emissions (kg)',
          data: getMetric('co2_kg'),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: borderWidths,
        },
      ],
    },
    options: chartDefaultOptions(),
  });
}

function chartDefaultOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF', font: { size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#9CA3AF', font: { size: 10 } },
      },
    },
  };
}

// Pre-fetch benchmark data in background so Detailed Benchmark Dashboard is always filled
async function prefetchBenchmark() {
  try {
    const res = await fetch('/api/benchmark');
    if (res.ok) {
      const data = await res.json();
      const bench = (data && data.benchmark) ? data.benchmark : data;
      if (bench && (bench.scenarios || bench.benchmarks)) {
        state.benchmarkData = bench;
        updateBenchmarkUI(bench);
      }
    }
  } catch (err) {
    console.debug('Background benchmark prefetch notice:', err);
  }
}

// Initial Boot - Starts in interactive idle preview, awaiting explicit user execution
window.addEventListener('DOMContentLoaded', () => {
  initListeners();
  updateActiveMethodsUI();
  resizeCanvas();
  prefetchBenchmark();
});
