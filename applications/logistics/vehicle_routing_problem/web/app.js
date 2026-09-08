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
};

// Canvas Context
const ctx = elements.canvas.getContext('2d');

// Initialize Event Listeners
function initListeners() {
  // Sliders input updates
  elements.inputTechs.addEventListener('input', (e) => {
    elements.badgeTechs.textContent = Number(e.target.value).toLocaleString();
    elements.headerFleet.textContent = `${Number(e.target.value).toLocaleString()} Techs`;
  });
  elements.inputTasks.addEventListener('input', (e) => {
    elements.badgeTasks.textContent = Number(e.target.value).toLocaleString();
  });
  elements.inputHubs.addEventListener('input', (e) => {
    elements.badgeHubs.textContent = e.target.value;
  });
  elements.inputEmergency.addEventListener('input', (e) => {
    elements.badgeEmergency.textContent = `${e.target.value}%`;
  });
  elements.inputFuzziness.addEventListener('input', (e) => {
    elements.badgeFuzziness.textContent = Number(e.target.value).toFixed(1);
  });

  // Preset Buttons
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
      elements.badgeHubs.textContent = hubs;
      elements.headerFleet.textContent = `${Number(techs).toLocaleString()} Techs`;

      runDispatch();
    });
  });

  // Tab Navigation
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) targetPane.classList.add('active');
      state.activeTab = btn.dataset.tab;

      if (state.activeTab === 'tab-bench' && !state.benchmarkData) {
        runBenchmark();
      }
    });
  });

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

// API: Run Dispatch
async function runDispatch() {
  elements.headerStatus.textContent = 'Solving...';
  elements.headerStatus.classList.remove('text-cyan');
  elements.headerStatus.classList.add('text-amber');

  const payload = {
    num_tasks: parseInt(elements.inputTasks.value, 10),
    total_technicians: parseInt(elements.inputTechs.value, 10),
    num_hubs: parseInt(elements.inputHubs.value, 10),
    emergency_ratio: parseFloat(elements.inputEmergency.value) / 100.0,
    fuzziness_m: parseFloat(elements.inputFuzziness.value),
    seed: parseInt(elements.inputSeed.value, 10),
    method: 'quantum_multitier_qfcm',
  };

  try {
    const res = await fetch('/api/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    state.dispatchData = data;
    updateKPIDashboard(data);
    updateQuantumTelemetry(data.quantum_metrics);
    renderMap();

    elements.headerStatus.textContent = 'Optimized';
    elements.headerStatus.classList.remove('text-amber');
    elements.headerStatus.classList.add('text-emerald');
  } catch (err) {
    console.error('Dispatch API error:', err);
    elements.headerStatus.textContent = 'Error';
    elements.headerStatus.classList.remove('text-amber');
    elements.headerStatus.classList.add('text-rose');
  }
}

// API: Run Benchmark
async function runBenchmark() {
  elements.headerStatus.textContent = 'Benchmarking...';

  const payload = {
    num_tasks: parseInt(elements.inputTasks.value, 10),
    total_technicians: parseInt(elements.inputTechs.value, 10),
    num_hubs: parseInt(elements.inputHubs.value, 10),
    seed: parseInt(elements.inputSeed.value, 10),
  };

  try {
    const res = await fetch('/api/benchmark', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    state.benchmarkData = data;
    updateBenchmarkUI(data);
    elements.headerStatus.textContent = 'Ready';
  } catch (err) {
    console.error('Benchmark API error:', err);
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
  document.getElementById('q-shots').textContent = `${qm.ancilla_measurement_shots.toLocaleString()} Shots`;
}

// Coordinate Scaling: converts [0, 100] coordinate domain to canvas dimensions
function scaleCoord(x, y) {
  const rect = elements.canvas.parentElement.getBoundingClientRect();
  const pad = 40;
  const w = rect.width - pad * 2;
  const h = rect.height - pad * 2;
  return {
    px: pad + (x / 100.0) * w,
    py: pad + ((100.0 - y) / 100.0) * h, // Invert Y for cartesian
  };
}

// Render Interactive Canvas Map
function renderMap() {
  if (!state.dispatchData) return;

  const rect = elements.canvas.parentElement.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);

  const { hubs, tasks, active_technicians } = state.dispatchData;

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
  if (state.showRoutes && active_technicians) {
    active_technicians.forEach((tech, idx) => {
      if (!tech.assigned_tasks || tech.assigned_tasks.length === 0) return;
      const hub = hubs[tech.depot_id];
      const hubPos = scaleCoord(hub.x, hub.y);
      const color = ROUTE_PALETTE[idx % ROUTE_PALETTE.length];

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 3]);
      ctx.globalAlpha = 0.65;

      ctx.moveTo(hubPos.px, hubPos.py);
      tech.assigned_tasks.forEach((tId) => {
        const task = tasks[tId];
        const tPos = scaleCoord(task.x, task.y);
        ctx.lineTo(tPos.px, tPos.py);
      });
      ctx.lineTo(hubPos.px, hubPos.py);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;
    });
  }

  // 3. Draw Tasks
  tasks.forEach((task) => {
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
  hubs.forEach((hub) => {
    const pos = scaleCoord(hub.x, hub.y);

    // Hub Outer Glow
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#00F0FF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Hub Inner Badge
    ctx.beginPath();
    ctx.arc(pos.px, pos.py, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#00F0FF';
    ctx.fill();

    // Hub Label
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillStyle = '#F9FAFB';
    ctx.textAlign = 'center';
    ctx.fillText(`${hub.code} (${hub.active_technicians})`, pos.px, pos.py - 24);
  });

  // 5. Draw Animated Technician Vehicle Dots if playback active
  if (active_technicians && state.animation.currentMinute > 0) {
    const elapsedM = state.animation.currentMinute;

    active_technicians.forEach((tech, idx) => {
      if (!tech.assigned_tasks || tech.assigned_tasks.length === 0) return;
      const hub = hubs[tech.depot_id];
      const hubPos = scaleCoord(hub.x, hub.y);
      const color = ROUTE_PALETTE[idx % ROUTE_PALETTE.length];

      // Build sequence of points
      const waypoints = [hubPos];
      tech.assigned_tasks.forEach((tId) => {
        const t = tasks[tId];
        waypoints.push(scaleCoord(t.x, t.y));
      });
      waypoints.push(hubPos);

      // Estimate current vehicle position based on fraction of shift completed
      const totalShift = tech.total_shift_min || 1.0;
      const fraction = Math.min(1.0, elapsedM / totalShift);
      const totalSegments = waypoints.length - 1;
      const exactIndex = fraction * totalSegments;
      const segIndex = Math.min(totalSegments - 1, Math.floor(exactIndex));
      const segFraction = exactIndex - segIndex;

      const pStart = waypoints[segIndex];
      const pEnd = waypoints[segIndex + 1];

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
  let hoveredItem = null;
  let hoveredType = null;

  // Check tasks
  for (const t of tasks) {
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
    for (const h of hubs) {
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

// Update Benchmark Charts & Table
function updateBenchmarkUI(data) {
  const sc = data.scenarios;
  const adv = data.quantum_advantage;

  // Banner Highlights
  document.getElementById('adv-dist-val').textContent = `${adv.distance_saved_percent.toFixed(1)}%`;
  document.getElementById('adv-dist-km').textContent = `${adv.distance_saved_km.toFixed(0)} km saved`;
  document.getElementById('adv-hours-val').textContent = `${adv.windshield_hours_saved.toFixed(1)} hrs`;
  document.getElementById('adv-cost-val').textContent = `$${adv.operating_cost_saved_usd.toFixed(2)}`;
  document.getElementById('adv-co2-val').textContent = `${adv.co2_saved_kg.toFixed(0)} kg CO2`;

  // Render Charts
  renderBenchmarkCharts(sc);

  // Render Audit Table
  const tbody = document.getElementById('benchmark-tbody');
  tbody.innerHTML = '';

  const order = ['baseline_fifo', 'hard_kmeans', 'quantum_multitier_qfcm'];
  order.forEach((key) => {
    const item = sc[key];
    const isQuantum = key === 'quantum_multitier_qfcm';
    const tr = document.createElement('tr');
    if (isQuantum) tr.style.background = 'rgba(0, 240, 255, 0.05)';

    tr.innerHTML = `
      <td><strong>${item.name}</strong> ${isQuantum ? '⚡' : ''}</td>
      <td>${item.distance_km.toFixed(1)} km</td>
      <td>${item.windshield_hours.toFixed(1)} h</td>
      <td class="${isQuantum ? 'text-amber' : ''}">$${item.operating_cost_usd.toFixed(2)}</td>
      <td>${item.co2_kg.toFixed(1)} kg</td>
      <td>${item.depot_workload_std.toFixed(2)} h</td>
      <td class="${item.shift_compliance_rate >= 80 ? 'text-emerald' : 'text-rose'}">${item.shift_compliance_rate.toFixed(1)}%</td>
      <td>${(item.runtime_seconds * 1000).toFixed(1)} ms</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderBenchmarkCharts(sc) {
  const labels = ['FIFO Baseline', 'Hard K-Means', 'Quantum SC-QFCM'];
  const colors = ['#6B7280', '#F59E0B', '#00F0FF'];

  // Chart 1: Distance & Windshield Hours
  if (state.charts.distance) state.charts.distance.destroy();
  state.charts.distance = new Chart(document.getElementById('chart-distance'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Distance (km)',
          data: [sc.baseline_fifo.distance_km, sc.hard_kmeans.distance_km, sc.quantum_multitier_qfcm.distance_km],
          backgroundColor: colors,
        },
      ],
    },
    options: chartDefaultOptions(),
  });

  // Chart 2: Operating Cost
  if (state.charts.cost) state.charts.cost.destroy();
  state.charts.cost = new Chart(document.getElementById('chart-cost'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Operating Cost ($)',
          data: [sc.baseline_fifo.operating_cost_usd, sc.hard_kmeans.operating_cost_usd, sc.quantum_multitier_qfcm.operating_cost_usd],
          backgroundColor: ['#6B7280', '#F59E0B', '#10B981'],
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
          data: [sc.baseline_fifo.depot_workload_std, sc.hard_kmeans.depot_workload_std, sc.quantum_multitier_qfcm.depot_workload_std],
          backgroundColor: ['#6B7280', '#EF4444', '#8B5CF6'],
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
          data: [sc.baseline_fifo.co2_kg, sc.hard_kmeans.co2_kg, sc.quantum_multitier_qfcm.co2_kg],
          backgroundColor: ['#6B7280', '#F59E0B', '#F43F5E'],
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

// Initial Boot
window.addEventListener('DOMContentLoaded', () => {
  initListeners();
  resizeCanvas();
  runDispatch();
});
