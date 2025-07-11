document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('main-btn');
  const quoteBtn = document.getElementById('quote-btn');
  const exitBtn = document.getElementById('exit-btn');
  const sysInfoBtn = document.getElementById('sysinfo-btn');
  const clearBtn = document.getElementById('clear-btn');
  const themeBtn = document.getElementById('theme-btn');
  const humBtn = document.getElementById('hum-btn');
  const fullBtn = document.getElementById('fullscreen-btn');
  const clock = document.getElementById('clock');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let humOsc = null;
  const synth = window.speechSynthesis;

  const pluginArea = document.getElementById('plugin-bar');

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

  function speak(text) {
    if (!synth) return;
    if (synth.speaking) synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    const voices = synth.getVoices();
    const stored = localStorage.getItem('lcars-voice');
    let voice = null;
    if (stored) {
      voice = voices.find(v => v.name === stored);
    }
    if (!voice) {
      voice = voices.find(v => /en/i.test(v.lang));
    }
    if (voice) utter.voice = voice;
    synth.speak(utter);
  }

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
      speak('Default theme activated');
    } else {
      document.body.setAttribute('data-theme', 'alt');
      localStorage.setItem('lcars-theme', 'alt');
      speak('Alternate theme engaged');
    }
  }

  function toggleHum() {
    playBeep();
    if (humOsc) {
      humOsc.stop();
      humOsc.disconnect();
      humOsc = null;
      humBtn.textContent = 'Hum';
      speak('Ambient hum disabled');
    } else {
      humOsc = ctx.createOscillator();
      humOsc.frequency.value = 50;
      humOsc.type = 'sine';
      humOsc.connect(ctx.destination);
      humOsc.start();
      humBtn.textContent = 'Mute';
      speak('Ambient hum enabled');
    }
  }

  function toggleFullscreen() {
    playBeep();
    speak('Toggling fullscreen');
    window.electronAPI.toggleFullscreen();
  }

  async function loadPlugins() {
    try {
      const res = await fetch('plugins/plugins.json');
      const plugins = await res.json();
      for (const name of plugins) {
        const mod = await import(`./plugins/${name}.js`);
        if (mod.init) {
          mod.init({ registerButton, playBeep, speak });
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
    speak('Accessing series database');
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
        speak('Displaying Star Trek series');
      });
  });

  quoteBtn.addEventListener('click', () => {
    playBeep();
    quoteBtn.textContent = 'Loading...';
    speak('Fetching quote');
    fetch('star_trek_quotes.json')
      .then(res => res.json())
      .then(data => {
        const content = document.getElementById('content');
        const random = data[Math.floor(Math.random() * data.length)];
        content.innerHTML = `<h2>${random.author}</h2><p>${random.text}</p>`;
        content.classList.remove('hidden');
        quoteBtn.textContent = 'Random Quote';
        speak(random.text);
      });
  });

  sysInfoBtn.addEventListener('click', async () => {
    playBeep();
    speak('Gathering system information');
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
    speak('System information displayed');
  });

  clearBtn.addEventListener('click', () => {
    playBeep();
    const content = document.getElementById('content');
    content.classList.add('hidden');
    content.innerHTML = '';
    speak('Display cleared');
  });

  themeBtn.addEventListener('click', toggleTheme);
  humBtn.addEventListener('click', toggleHum);
  fullBtn.addEventListener('click', toggleFullscreen);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') {
      toggleTheme();
    }
    if (e.code === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  exitBtn.addEventListener('click', () => {
    speak('Shutting down');
    window.electronAPI.closeApp();
  });
});
