export function init({ registerButton, playBeep, speak }) {
  const WORLD_WIDTH = 2200;
  const WORLD_HEIGHT = 1400;

  const categoryColors = {
    colony: '#ffd37a',
    science: '#8fe3ff',
    relay: '#caa6ff',
    command: '#ff9e66',
    frontier: '#9effb2'
  };

  const threatColors = {
    low: '#66cc33',
    medium: '#ffcc00',
    high: '#ff6633',
    unknown: '#cc99ff'
  };

  let canvas = null;
  let ctx = null;
  let viewport = null;
  let stars = [];
  let backdropStars = [];
  let selectedStarId = null;
  let scale = 0.72;
  let offsetX = 0;
  let offsetY = 0;
  let showGrid = true;
  let showSweep = true;
  let animationFrameId = null;
  let resizeHandlerAttached = false;
  let isDragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let scanPhase = 0;
  let frameTick = 0;

  registerButton('Star Chart', async () => {
    playBeep();
    speak('Displaying tactical star chart');

    const content = document.getElementById('content');
    content.innerHTML = `
      <section class="star-chart-shell">
        <div class="star-chart-heading">
          <div class="star-chart-title-block">
            <div class="star-chart-kicker">Astrometrics</div>
            <h2>LCARS Tactical Display</h2>
          </div>
          <div class="star-chart-status">
            <div class="star-status-chip">
              <span class="star-status-label">Mode</span>
              <span class="star-status-value" id="star-mode-label">Tactical Survey</span>
            </div>
            <div class="star-status-chip">
              <span class="star-status-label">Sweep</span>
              <span class="star-status-value" id="star-sweep-label">Active</span>
            </div>
          </div>
        </div>

        <div class="star-chart-layout">
          <div class="star-chart-map-panel">
            <div class="star-chart-viewport" id="star-chart-viewport">
              <canvas id="star-chart"></canvas>
              <div class="star-chart-overlay-top">
                <span>SECTOR 001</span>
                <span id="star-zoom-readout">ZOOM 72%</span>
              </div>
              <div class="star-chart-overlay-bottom">
                <span id="star-coordinate-readout">GRID C-07 / VECTOR 182</span>
                <span id="star-contact-readout">PRIMARY CONTACT: NONE</span>
              </div>
            </div>
            <div class="star-chart-controls">
              <button class="lcars-button small" id="zoom-in">Zoom +</button>
              <button class="lcars-button small" id="zoom-out">Zoom -</button>
              <button class="lcars-button small" id="reset-view">Reset</button>
              <button class="lcars-button small" id="toggle-grid">Grid On</button>
              <button class="lcars-button small" id="toggle-sweep">Sweep On</button>
            </div>
          </div>

          <aside class="star-chart-side-panel">
            <div class="star-panel-card">
              <div class="star-panel-label">Primary Contact</div>
              <div class="star-panel-title" id="star-selected-name">Awaiting contact lock</div>
              <div class="star-panel-copy" id="star-selected-summary">Select a system from the map or contact list to begin analysis.</div>
            </div>

            <div class="star-chart-metrics" id="star-metrics"></div>

            <div class="star-panel-card">
              <div class="star-panel-label">Detected Systems</div>
              <div class="star-contact-list" id="star-contact-list"></div>
            </div>
          </aside>
        </div>
      </section>`;
    content.classList.remove('hidden');

    await initializeChart();
  });

  async function initializeChart() {
    stopAnimation();

    canvas = document.getElementById('star-chart');
    viewport = document.getElementById('star-chart-viewport');
    if (!canvas || !viewport) return;

    ctx = canvas.getContext('2d');
    canvas.style.cursor = 'grab';

    try {
      const res = await fetch('plugins/star-systems.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const starNames = await res.json();
      stars = buildSystems(starNames);
    } catch (error) {
      console.error('Star chart data failed', error);
      stars = buildSystems(['Sol', 'Alpha Centauri', 'Andor', 'Bajor', 'Betazed', 'Altair', 'Aldebaran', 'Achernar']);
    }

    backdropStars = createBackdropStars(180);
    selectedStarId = stars[0]?.id ?? null;
    centerOnStar(selectedStarId, 0.78);

    setupControls();
    attachCanvasEvents();
    resizeCanvas();
    refreshSidebar();
    startAnimation();

    if (!resizeHandlerAttached) {
      window.addEventListener('resize', resizeCanvas);
      resizeHandlerAttached = true;
    }
  }

  function buildSystems(names) {
    const categories = ['command', 'science', 'colony', 'relay', 'frontier'];
    const threats = ['low', 'low', 'medium', 'unknown', 'high'];
    const systems = names.map((name, index) => {
      const seed = pseudo(index + 1);
      const ring = Math.floor(index / 6);
      const spoke = index % 6;
      const x = 220 + ring * 170 + Math.sin(spoke * 1.04 + seed * 2.4) * 160 + seed * 120;
      const y = 180 + spoke * 180 + Math.cos(ring * 0.72 + seed * 4.1) * 90 + pseudo(index + 12) * 70;
      const category = categories[index % categories.length];
      const threat = threats[(index + Math.floor(seed * 10)) % threats.length];
      const signal = 58 + Math.floor(pseudo(index + 22) * 41);
      const population = `${(0.4 + pseudo(index + 31) * 8.2).toFixed(1)}B`;
      const distance = Math.round(Math.hypot(x - 420, y - 680) * 0.9);
      const sector = `${String.fromCharCode(65 + ((index * 3) % 8))}-${String(((index * 5) % 12) + 1).padStart(2, '0')}`;
      const heading = Math.round((pseudo(index + 48) * 359));
      const size = 3 + pseudo(index + 65) * 4;
      return {
        id: `system-${index}`,
        name,
        x,
        y,
        size,
        category,
        threat,
        signal,
        population,
        distance,
        sector,
        heading,
        color: categoryColors[category],
        summary: buildSummary(name, category, threat),
        notes: buildNotes(category, threat)
      };
    });

    return systems.sort((a, b) => a.distance - b.distance);
  }

  function buildSummary(name, category, threat) {
    const categoryLabel = categoryLabelFor(category);
    const threatLabel = threatLabelFor(threat);
    return `${name} is classified as a ${categoryLabel.toLowerCase()} with ${threatLabel.toLowerCase()} tactical priority.`;
  }

  function buildNotes(category, threat) {
    const noteMap = {
      command: 'Priority subspace traffic and command routing observed.',
      science: 'High sensor resolution and anomalous signal sampling available.',
      colony: 'Civilian population centers detected across multiple orbital bands.',
      relay: 'Long-range communications relays and lane tracking active.',
      frontier: 'Sparse patrol coverage. Long-range surveillance recommended.'
    };
    const threatMap = {
      low: 'Threat posture stable.',
      medium: 'Elevated traffic requires monitored approach.',
      high: 'Recommend shields and active scan before entering sector.',
      unknown: 'Signature inconclusive. Detailed contact analysis required.'
    };
    return `${noteMap[category]} ${threatMap[threat]}`;
  }

  function createBackdropStars(count) {
    return Array.from({ length: count }, (_, index) => ({
      x: pseudo(index + 101) * WORLD_WIDTH,
      y: pseudo(index + 207) * WORLD_HEIGHT,
      size: 0.5 + pseudo(index + 333) * 1.7,
      alpha: 0.18 + pseudo(index + 419) * 0.45
    }));
  }

  function setupControls() {
    document.getElementById('zoom-in').onclick = () => {
      playBeep();
      scale = Math.min(scale * 1.16, 2.4);
      refreshReadouts();
    };

    document.getElementById('zoom-out').onclick = () => {
      playBeep();
      scale = Math.max(scale / 1.16, 0.42);
      refreshReadouts();
    };

    document.getElementById('reset-view').onclick = () => {
      playBeep();
      centerOnStar(selectedStarId ?? stars[0]?.id, 0.78);
      refreshReadouts();
    };

    document.getElementById('toggle-grid').onclick = (event) => {
      playBeep();
      showGrid = !showGrid;
      event.currentTarget.textContent = showGrid ? 'Grid On' : 'Grid Off';
    };

    document.getElementById('toggle-sweep').onclick = (event) => {
      playBeep();
      showSweep = !showSweep;
      event.currentTarget.textContent = showSweep ? 'Sweep On' : 'Sweep Off';
      document.getElementById('star-sweep-label').textContent = showSweep ? 'Active' : 'Standby';
    };
  }

  function attachCanvasEvents() {
    canvas.onmousedown = (event) => {
      isDragging = true;
      dragMoved = false;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      canvas.style.cursor = 'grabbing';
    };

    canvas.onmousemove = (event) => {
      if (!isDragging) return;
      offsetX += event.clientX - dragStartX;
      offsetY += event.clientY - dragStartY;
      dragMoved = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      refreshReadouts();
    };

    canvas.onmouseup = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.onmouseleave = () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.onclick = (event) => {
      if (dragMoved) return;
      const point = screenToWorld(event);
      const selected = pickSystem(point.x, point.y);
      if (selected) {
        selectStar(selected.id, true);
      }
    };

    canvas.onwheel = (event) => {
      event.preventDefault();
      scale = event.deltaY < 0 ? Math.min(scale * 1.08, 2.4) : Math.max(scale / 1.08, 0.42);
      refreshReadouts();
    };
  }

  function resizeCanvas() {
    if (!canvas || !viewport || !ctx) return;
    const rect = viewport.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${Math.floor(rect.width)}px`;
    canvas.style.height = `${Math.floor(rect.height)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    refreshReadouts();
  }

  function startAnimation() {
    stopAnimation();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      scanPhase = (scanPhase + 0.003) % 1;
      frameTick += 1;
      draw();
    };

    animate();
  }

  function stopAnimation() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  function draw() {
    if (!canvas || !ctx || !viewport) return;

    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const selected = stars.find((star) => star.id === selectedStarId) || null;

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#03101c');
    gradient.addColorStop(0.55, '#020914');
    gradient.addColorStop(1, '#010307');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (showGrid) drawGrid();
    drawBackdrop();
    drawRoutes(selected);
    drawSystems(selected);

    ctx.restore();

    drawSweepOverlay(width, height);
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(116, 190, 255, 0.12)';
    ctx.lineWidth = 1 / scale;

    for (let x = 0; x <= WORLD_WIDTH; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= WORLD_HEIGHT; y += 140) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 153, 0, 0.14)';
    ctx.lineWidth = 2 / scale;
    ctx.strokeRect(120, 120, WORLD_WIDTH - 240, WORLD_HEIGHT - 240);
  }

  function drawBackdrop() {
    backdropStars.forEach((star) => {
      ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawRoutes(selected) {
    if (!selected) return;

    const linked = stars
      .filter((star) => star.id !== selected.id)
      .map((star) => ({ star, score: Math.hypot(star.x - selected.x, star.y - selected.y) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    linked.forEach(({ star }, index) => {
      ctx.strokeStyle = index === 0 ? 'rgba(255, 204, 0, 0.55)' : 'rgba(120, 195, 255, 0.24)';
      ctx.lineWidth = index === 0 ? 2.5 / scale : 1.2 / scale;
      ctx.setLineDash(index === 0 ? [] : [8 / scale, 10 / scale]);
      ctx.beginPath();
      ctx.moveTo(selected.x, selected.y);
      ctx.lineTo(star.x, star.y);
      ctx.stroke();
    });

    ctx.setLineDash([]);
  }

  function drawSystems(selected) {
    const pulse = 0.75 + Math.sin(frameTick * 0.06) * 0.25;

    stars.forEach((star) => {
      const active = selected && star.id === selected.id;
      const haloRadius = star.size + (active ? 14 * pulse : 5);

      ctx.fillStyle = active ? 'rgba(255, 210, 122, 0.16)' : 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.arc(star.x, star.y, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size + (active ? 1.5 : 0), 0, Math.PI * 2);
      ctx.fill();

      if (active) drawSelectionBrackets(star);

      if (active || star.size > 5.2 || star.threat === 'high') {
        ctx.fillStyle = active ? '#fff6d1' : 'rgba(255,255,255,0.78)';
        ctx.font = `${active ? 16 : 13}px Orbitron, sans-serif`;
        ctx.fillText(star.name.toUpperCase(), star.x + 16, star.y - 10);
      }
    });
  }

  function drawSelectionBrackets(star) {
    const radius = star.size + 18;
    const bracket = 12;
    ctx.strokeStyle = '#ffcc66';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(star.x - radius, star.y - radius + bracket);
    ctx.lineTo(star.x - radius, star.y - radius);
    ctx.lineTo(star.x - radius + bracket, star.y - radius);

    ctx.moveTo(star.x + radius - bracket, star.y - radius);
    ctx.lineTo(star.x + radius, star.y - radius);
    ctx.lineTo(star.x + radius, star.y - radius + bracket);

    ctx.moveTo(star.x - radius, star.y + radius - bracket);
    ctx.lineTo(star.x - radius, star.y + radius);
    ctx.lineTo(star.x - radius + bracket, star.y + radius);

    ctx.moveTo(star.x + radius - bracket, star.y + radius);
    ctx.lineTo(star.x + radius, star.y + radius);
    ctx.lineTo(star.x + radius, star.y + radius - bracket);
    ctx.stroke();
  }

  function drawSweepOverlay(width, height) {
    if (!showSweep) return;

    const sweepX = scanPhase * (width + 180) - 180;
    const gradient = ctx.createLinearGradient(sweepX - 90, 0, sweepX + 90, 0);
    gradient.addColorStop(0, 'rgba(90, 160, 255, 0)');
    gradient.addColorStop(0.5, 'rgba(90, 160, 255, 0.18)');
    gradient.addColorStop(1, 'rgba(90, 160, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(sweepX - 90, 0, 180, height);
  }

  function screenToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - offsetX) / scale;
    const y = (event.clientY - rect.top - offsetY) / scale;
    return { x, y };
  }

  function pickSystem(x, y) {
    let winner = null;
    let best = Infinity;

    stars.forEach((star) => {
      const distance = Math.hypot(star.x - x, star.y - y);
      if (distance < Math.max(18, star.size * 5) && distance < best) {
        winner = star;
        best = distance;
      }
    });

    return winner;
  }

  function selectStar(starId, announce) {
    selectedStarId = starId;
    refreshSidebar();
    refreshReadouts();
    if (announce) {
      const star = stars.find((item) => item.id === starId);
      if (star) speak(`System selected. ${star.name}`);
    }
  }

  function refreshSidebar() {
    const selected = stars.find((star) => star.id === selectedStarId) || stars[0];
    if (!selected) return;

    document.getElementById('star-selected-name').textContent = selected.name.toUpperCase();
    document.getElementById('star-selected-summary').textContent = `${selected.summary} ${selected.notes}`;

    document.getElementById('star-metrics').innerHTML = `
      <div class="star-metric-card">
        <div class="star-metric-label">Sector</div>
        <div class="star-metric-value">${selected.sector}</div>
      </div>
      <div class="star-metric-card">
        <div class="star-metric-label">Bearing</div>
        <div class="star-metric-value">${selected.heading}&deg;</div>
      </div>
      <div class="star-metric-card">
        <div class="star-metric-label">Range</div>
        <div class="star-metric-value">${selected.distance} LY</div>
      </div>
      <div class="star-metric-card">
        <div class="star-metric-label">Signal</div>
        <div class="star-metric-value">${selected.signal}%</div>
      </div>
      <div class="star-metric-card">
        <div class="star-metric-label">Class</div>
        <div class="star-metric-value">${categoryLabelFor(selected.category)}</div>
      </div>
      <div class="star-metric-card">
        <div class="star-metric-label">Threat</div>
        <div class="star-metric-value" style="color:${threatColors[selected.threat]};">${threatLabelFor(selected.threat)}</div>
      </div>`;

    const nearby = stars
      .map((star) => ({ star, distance: Math.hypot(star.x - selected.x, star.y - selected.y) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8)
      .map(({ star }) => star);

    const list = document.getElementById('star-contact-list');
    list.innerHTML = nearby.map((star) => `
      <button class="star-contact-item${star.id === selected.id ? ' active' : ''}" data-star-id="${star.id}">
        <span class="star-contact-name">${star.name}</span>
        <span class="star-contact-meta">${star.sector} | ${categoryLabelFor(star.category)} | ${threatLabelFor(star.threat)}</span>
      </button>
    `).join('');

    list.querySelectorAll('.star-contact-item').forEach((button) => {
      button.onclick = () => {
        playBeep();
        selectStar(button.dataset.starId, true);
        centerOnStar(button.dataset.starId, scale);
      };
    });

    document.getElementById('star-mode-label').textContent = `${categoryLabelFor(selected.category)} Focus`;
  }

  function refreshReadouts() {
    const selected = stars.find((star) => star.id === selectedStarId) || null;
    document.getElementById('star-zoom-readout').textContent = `ZOOM ${Math.round(scale * 100)}%`;

    if (!selected) return;

    document.getElementById('star-coordinate-readout').textContent = `GRID ${selected.sector} / VECTOR ${selected.heading}`;
    document.getElementById('star-contact-readout').textContent = `PRIMARY CONTACT: ${selected.name.toUpperCase()}`;
  }

  function centerOnStar(starId, nextScale = scale) {
    const star = stars.find((item) => item.id === starId) || stars[0];
    if (!star || !viewport) return;

    scale = nextScale;
    offsetX = viewport.clientWidth / 2 - star.x * scale;
    offsetY = viewport.clientHeight / 2 - star.y * scale;
    selectedStarId = star.id;
    refreshSidebar();
    refreshReadouts();
  }

  function categoryLabelFor(category) {
    const labels = {
      colony: 'Colony',
      science: 'Science Node',
      relay: 'Relay Hub',
      command: 'Command World',
      frontier: 'Frontier Post'
    };
    return labels[category] || 'Survey Node';
  }

  function threatLabelFor(threat) {
    const labels = {
      low: 'Low',
      medium: 'Medium',
      high: 'High',
      unknown: 'Unknown'
    };
    return labels[threat] || 'Low';
  }

  function pseudo(seed) {
    return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
  }
}
