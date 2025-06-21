document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('main-btn');
  const quoteBtn = document.getElementById('quote-btn');
  const exitBtn = document.getElementById('exit-btn');
  const sysInfoBtn = document.getElementById('sysinfo-btn');
  const clearBtn = document.getElementById('clear-btn');
  const themeBtn = document.getElementById('theme-btn');
  const humBtn = document.getElementById('hum-btn');
  const clock = document.getElementById('clock');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let humOsc = null;

  const pluginArea = document.getElementById('left-bar');

  function registerButton(label, handler) {
    const button = document.createElement('button');
    button.className = 'lcars-button';
    button.textContent = label;
    button.addEventListener('click', handler);
    pluginArea.appendChild(button);
  }

  function loadFont(name, url) {
    const font = new FontFace(name, `url(${url})`);
    return font.load().then(() => {
      document.fonts.add(font);
    });
  }

  loadFont('Share Tech Mono', 'https://fonts.gstatic.com/s/sharetechmono/v15/J7aHnp1uDWRBEqV98dVQ5mRY1yo.woff2');
  loadFont('Orbitron', 'https://fonts.gstatic.com/s/orbitron/v30/yMJRMIlzdpvBhQQL_Qq7dytiyr2GqCJDM8c.woff2');

  function applyStoredTheme() {
    const theme = localStorage.getItem('lcars-theme');
    if (theme === 'alt') {
      document.body.setAttribute('data-theme', 'alt');
    }
  }
  applyStoredTheme();

  function toggleTheme() {
    playBeep();
    const isAlt = document.body.getAttribute('data-theme') === 'alt';
    if (isAlt) {
      document.body.removeAttribute('data-theme');
      localStorage.setItem('lcars-theme', 'default');
    } else {
      document.body.setAttribute('data-theme', 'alt');
      localStorage.setItem('lcars-theme', 'alt');
    }
  }

  function toggleHum() {
    playBeep();
    if (humOsc) {
      humOsc.stop();
      humOsc.disconnect();
      humOsc = null;
      humBtn.textContent = 'Hum';
    } else {
      humOsc = ctx.createOscillator();
      humOsc.frequency.value = 50;
      humOsc.type = 'sine';
      humOsc.connect(ctx.destination);
      humOsc.start();
      humBtn.textContent = 'Mute';
    }
  }

  async function loadPlugins() {
    try {
      const res = await fetch('plugins/plugins.json');
      const plugins = await res.json();
      for (const name of plugins) {
        const mod = await import(`./plugins/${name}.js`);
        if (mod.init) {
          mod.init({ registerButton, playBeep });
        }
      }
    } catch (err) {
      console.error('Plugin loading failed', err);
    }
  }
  loadPlugins();

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

  themeBtn.addEventListener('click', toggleTheme);
  humBtn.addEventListener('click', toggleHum);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') {
      toggleTheme();
    }
  });

  exitBtn.addEventListener('click', () => {
    window.electronAPI.closeApp();
  });
});
