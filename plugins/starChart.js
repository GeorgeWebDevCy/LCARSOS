export function init({ registerButton, playBeep, speak }) {
  registerButton('Star Chart', async () => {
    playBeep();
    speak('Displaying star chart');
    const content = document.getElementById('content');
    content.innerHTML = '<canvas id="star-chart" width="800" height="600"></canvas>';
    content.classList.remove('hidden');
    await drawChart();
  });

  async function drawChart() {
    const canvas = document.getElementById('star-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background stars
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const r = Math.random() * 1.5 + 0.5;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Load star names
    try {
      const res = await fetch('plugins/star-systems.json');
      const stars = await res.json();
      for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const name = stars[Math.floor(Math.random() * stars.length)];
        ctx.fillStyle = '#ff6';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '14px Orbitron, sans-serif';
        ctx.fillText(name, x + 5, y - 5);
      }
    } catch (err) {
      console.error('Star chart data failed', err);
    }
  }
}
