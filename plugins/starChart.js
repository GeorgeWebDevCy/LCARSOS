export function init({ registerButton, playBeep, speak }) {
  let canvas, ctx;
  let offsetX = 0, offsetY = 0;
  let scale = 1;
  let isDragging = false;
  let lastX, lastY;
  let stars = [];

  registerButton('Star Chart', () => {
    playBeep();
    speak('Displaying star chart');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="star-chart-container">
        <canvas id="star-chart" width="800" height="600"></canvas>
        <div class="star-chart-controls">
          <button class="lcars-button small" id="zoom-in">Zoom +</button>
          <button class="lcars-button small" id="zoom-out">Zoom -</button>
          <button class="lcars-button small" id="reset-view">Reset</button>
        </div>
        <div id="star-info"></div>
      </div>`;
    content.classList.remove('hidden');
    initChart();
    setupControls();
  });

  async function initChart() {
    canvas = document.getElementById('star-chart');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    try {
      const res = await fetch('plugins/star-systems.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const starNames = await res.json();
      stars = starNames.map((name, i) => ({
        name,
        x: 100 + (i * 60) % 700,
        y: 80 + (i * 40) % 500,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.7 ? '#fa0' : '#ff6'
      }));
    } catch (err) {
      console.error('Star chart data failed', err);
      stars = [
        { name: 'Sol', x: 400, y: 300, size: 4, color: '#fff' },
        { name: 'Alpha Centauri', x: 200, y: 150, size: 3, color: '#ff6' },
        { name: 'Betelgeuse', x: 600, y: 200, size: 3.5, color: '#fa0' },
        { name: 'Vega', x: 150, y: 450, size: 3, color: '#ff6' },
        { name: 'Altair', x: 650, y: 400, size: 2.5, color: '#ff6' }
      ];
    }

    draw();

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      lastX = e.offsetX;
      lastY = e.offsetY;
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        offsetX += e.offsetX - lastX;
        offsetY += e.offsetY - lastY;
        lastX = e.offsetX;
        lastY = e.offsetY;
        draw();
      }
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
      canvas.style.cursor = 'grab';
    });

    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - offsetX) / scale;
      const y = (e.clientY - rect.top - offsetY) / scale;
      checkStarClick(x, y);
    });

    canvas.style.cursor = 'grab';
  }

  function checkStarClick(x, y) {
    for (const star of stars) {
      const dist = Math.sqrt((x - star.x) ** 2 + (y - star.y) ** 2);
      if (dist < star.size * 3) {
        const info = document.getElementById('star-info');
        info.innerHTML = `<p>Selected: <strong>${star.name}</strong></p>`;
        speak(`Selected star system ${star.name}`);
        return;
      }
    }
  }

  function draw() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    for (let i = 0; i < 150; i++) {
      const x = ((i * 137.5) % canvas.width) / scale + offsetX / scale;
      const y = ((i * 97.3) % canvas.height) / scale + offsetY / scale;
      if (x > 0 && x < canvas.width / scale && y > 0 && y < canvas.height / scale) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, Math.random() * 1.5 + 0.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const star of stars) {
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '12px Orbitron, sans-serif';
      ctx.fillText(star.name, star.x + star.size + 5, star.y + 4);
    }

    ctx.restore();
  }

  function setupControls() {
    document.getElementById('zoom-in').addEventListener('click', () => {
      playBeep();
      scale = Math.min(scale * 1.2, 5);
      draw();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      playBeep();
      scale = Math.max(scale / 1.2, 0.3);
      draw();
    });

    document.getElementById('reset-view').addEventListener('click', () => {
      playBeep();
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      draw();
    });
  }
}