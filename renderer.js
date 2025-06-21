document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('main-btn');
  const quoteBtn = document.getElementById('quote-btn');
  const exitBtn = document.getElementById('exit-btn');
  const sysInfoBtn = document.getElementById('sysinfo-btn');
  const clearBtn = document.getElementById('clear-btn');
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
    osc.frequency.value = 400 + Math.random() * 400;
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

  quoteBtn.addEventListener('click', () => {
    playBeep();
    quoteBtn.textContent = 'Loading...';
    fetch('star_trek_quotes.json')
      .then(res => res.json())
      .then(data => {
        const content = document.getElementById('content');
        const random = data[Math.floor(Math.random() * data.length)];
        content.innerHTML = `<h2>${random.author}</h2><p>${random.text}</p>`;
        content.classList.remove('hidden');
        quoteBtn.textContent = 'Random Quote';
      });
  });

  sysInfoBtn.addEventListener('click', async () => {
    playBeep();
    sysInfoBtn.textContent = 'Loading...';
    const info = await window.electronAPI.getSystemInfo();
    const content = document.getElementById('content');
    content.innerHTML = `<h2>System Info</h2>
      <ul>
        <li>Platform: ${info.platform}</li>
        <li>Architecture: ${info.arch}</li>
        <li>CPU Cores: ${info.cpus}</li>
        <li>Total Memory: ${info.memory} GB</li>
      </ul>`;
    content.classList.remove('hidden');
    sysInfoBtn.textContent = 'System Info';
  });

  clearBtn.addEventListener('click', () => {
    playBeep();
    const content = document.getElementById('content');
    content.classList.add('hidden');
    content.innerHTML = '';
  });

  exitBtn.addEventListener('click', () => {
    window.electronAPI.closeApp();
  });
});
