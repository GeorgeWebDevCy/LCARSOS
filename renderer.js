document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('main-btn');
  const exitBtn = document.getElementById('exit-btn');
  const clock = document.getElementById('clock');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  function updateClock() {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  function playBeep() {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  btn.addEventListener('click', () => {
    playBeep();
    btn.textContent = 'Loading...';
    fetch('star_trek_series.json')
      .then(res => res.json())
      .then(data => {
        const content = document.getElementById('content');
        const list = document.createElement('ul');
        data.forEach(series => {
          const item = document.createElement('li');
          item.textContent = `${series.title} (${series.begin.split('-')[0]})`;
          list.appendChild(item);
        });
        content.innerHTML = '<h2>Star Trek Series</h2>';
        content.appendChild(list);
        content.classList.remove('hidden');
        btn.textContent = 'Activate';
      });
  });

  exitBtn.addEventListener('click', () => {
    window.electronAPI.closeApp();
  });
});
