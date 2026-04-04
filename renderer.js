document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('main-btn');
  const quoteBtn = document.getElementById('quote-btn');
  const exitBtn = document.getElementById('exit-btn');
  const sysInfoBtn = document.getElementById('sysinfo-btn');
  const clearBtn = document.getElementById('clear-btn');
  const themeBtn = document.getElementById('theme-btn');
  const humBtn = document.getElementById('hum-btn');
  const alertBtn = document.getElementById('alert-btn');
  const fullBtn = document.getElementById('fullscreen-btn');
  const clock = document.getElementById('clock');
  const content = document.getElementById('content');

  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let humOsc = null;
  const synth = window.speechSynthesis;

  const pluginArea = document.getElementById('plugin-buttons');

  window.lcarsSettings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');

  // Theme cycle order
  const themes = ['', 'alt', 'classic', 'ds9', 'tng', 'voyager'];
  const themeNames = ['Default', 'Alt', 'Classic', 'DS9', 'TNG', 'Voyager'];

  // Alert state
  let currentAlert = 'normal';

  // Voice presets
  const voicePresets = {
    default: { rate: 1.0, pitch: 1.0 },
    computer: { rate: 0.9, pitch: 0.8 },
    'computer-slow': { rate: 0.7, pitch: 0.8 },
    'computer-deep': { rate: 0.85, pitch: 0.6 },
    enterprise: { rate: 0.95, pitch: 0.9 },
    'voyager-bridge': { rate: 0.85, pitch: 0.85 }
  };

  // ===== Plugin registration =====

  function registerButton(label, handler) {
    const button = document.createElement('button');
    button.className = 'lcars-button';
    button.textContent = label;
    button.addEventListener('click', () => {
      content.classList.add('animating-out');
      setTimeout(() => {
        content.classList.remove('animating-out');
        content.classList.add('animating-in');
        handler();
        setTimeout(() => content.classList.remove('animating-in'), 400);
      }, 300);
    });
    pluginArea.appendChild(button);
  }

  function loadFont(name, url) {
    const font = new FontFace(name, `url(${url})`);
    return font.load().then(() => { document.fonts.add(font); });
  }

  loadFont('Share Tech Mono', 'https://fonts.gstatic.com/s/sharetechmono/v15/J7aHnp1uDWRBEqV98dVQ5mRY1yo.woff2');
  loadFont('Orbitron', 'https://fonts.gstatic.com/s/orbitron/v30/yMJRMIlzdpvBhQQL_Qq7dytiyr2GqCJDM8c.woff2');

  // ===== TTS =====

  async function speak(text) {
    if (!synth) return;
    if (synth.speaking) synth.cancel();

    const settings = window.lcarsSettings || {};
    const presetName = localStorage.getItem('lcars-voice-preset') || 'computer';
    const preset = voicePresets[presetName] || voicePresets.computer;
    const effect = localStorage.getItem('lcars-computer-effect') || 'none';

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = (settings.ttsRate ?? 90) / 100 * preset.rate;
    utter.pitch = (settings.ttsPitch ?? 80) / 100 * preset.pitch;
    utter.volume = (settings.ttsVolume ?? 100) / 100;

    const voices = synth.getVoices();
    const stored = localStorage.getItem('lcars-voice');
    let voice = null;
    if (stored) {
      voice = voices.find(v => v.name === stored);
    }
    if (!voice) {
      voice = voices.find(v => /en-US/i.test(v.lang)) || voices.find(v => /en/i.test(v.lang));
    }
    if (!voice) {
      voice = voices.find(v => v.name.includes('Microsoft') || v.name.includes('Google'));
    }
    if (voice) utter.voice = voice;

    if (effect !== 'none') {
      utter.onend = () => applyAudioEffect(effect);
    }

    synth.speak(utter);
  }

  function applyAudioEffect(effect) {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    const audioCtx = window.lcarsAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    window.lcarsAudioCtx = audioCtx;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    const settings = window.lcarsSettings || {};
    gain.gain.value = (settings.ttsVolume ?? 100) / 100 * 0.2;
    osc.type = 'sine';
    osc.frequency.value = 200;
    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    if (effect === 'echo') {
      filter.frequency.value = 1000;
      const delay = audioCtx.createDelay();
      delay.delayTime.value = 0.15;
      const fb = audioCtx.createGain();
      fb.gain.value = 0.3;
      osc.connect(filter);
      filter.connect(gain);
      filter.connect(delay);
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(audioCtx.destination);
      gain.connect(audioCtx.destination);
    } else if (effect === 'reverb') {
      filter.frequency.value = 1500;
      const conv = audioCtx.createConvolver();
      const rate = audioCtx.sampleRate;
      const len = rate * 1.5;
      const imp = audioCtx.createBuffer(2, len, rate);
      for (let c = 0; c < 2; c++) {
        const d = imp.getChannelData(c);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      }
      conv.buffer = imp;
      osc.connect(filter);
      filter.connect(gain);
      filter.connect(conv);
      conv.connect(audioCtx.destination);
      gain.connect(audioCtx.destination);
    } else if (effect === 'radio') {
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 1;
      const noise = audioCtx.createBufferSource();
      const nb = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.5, audioCtx.sampleRate);
      const nd = nb.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      noise.buffer = nb;
      const ng = audioCtx.createGain();
      ng.gain.value = 0.02;
      noise.connect(ng);
      ng.connect(audioCtx.destination);
      noise.start();
      noise.stop(audioCtx.currentTime + 0.5);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
    }

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }

  // ===== Stardate =====

  function calculateStardate() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const dayFraction = (now - start) / (365.25 * 24 * 60 * 60 * 1000);
    // TNG-era projection: 2020 ~= stardate 77000, +1000 per year
    const sd = 77000 + ((now.getFullYear() - 2020) * 1000) + (dayFraction * 1000);
    return sd.toFixed(1);
  }

  function updateStardate() {
    const sd = calculateStardate();
    const el = document.getElementById('stardate-display');
    const ft = document.getElementById('stardate-footer');
    if (el) el.textContent = `SD ${sd}`;
    if (ft) ft.textContent = `STARDATE ${sd}`;
  }

  // ===== Status bar =====

  function setStatus(text) {
    const el = document.getElementById('last-action-text');
    if (el) el.textContent = text.toUpperCase();
  }

  // ===== Alert system =====

  function setAlert(level) {
    currentAlert = level;
    const dot = document.getElementById('alert-dot');
    const label = document.getElementById('alert-label');

    document.body.classList.remove('alert-normal', 'alert-yellow', 'alert-red');
    document.body.classList.add(`alert-${level}`);

    if (dot) dot.className = `alert-dot ${level}`;
    if (label) {
      if (level === 'red') {
        label.textContent = 'RED ALERT';
        speak('Red alert! Red alert! All hands to battle stations!');
      } else if (level === 'yellow') {
        label.textContent = 'YELLOW ALERT';
        speak('Yellow alert. All hands stand by.');
      } else {
        label.textContent = 'NORMAL OPERATIONS';
        speak('Standing down from alert status.');
      }
    }
    playBeep();
  }

  // ===== Theme =====

  function applyStoredTheme() {
    const theme = localStorage.getItem('lcars-theme') || '';
    if (theme) {
      document.body.setAttribute('data-theme', theme);
    } else {
      document.body.removeAttribute('data-theme');
    }
  }
  applyStoredTheme();

  function toggleTheme() {
    playBeep();
    const current = localStorage.getItem('lcars-theme') || '';
    const idx = themes.indexOf(current);
    const next = (idx + 1) % themes.length;
    const nextTheme = themes[next];
    const nextName = themeNames[next];

    if (nextTheme) {
      document.body.setAttribute('data-theme', nextTheme);
    } else {
      document.body.removeAttribute('data-theme');
    }
    localStorage.setItem('lcars-theme', nextTheme);
    speak(`${nextName} theme engaged`);
    setStatus(`Theme: ${nextName}`);
  }

  // ===== Hum =====

  function toggleHum() {
    playBeep();
    const settings = window.lcarsSettings || {};
    const volume = (settings.humVolume ?? 30) / 100;
    if (humOsc) {
      humOsc.stop();
      humOsc.disconnect();
      humOsc = null;
      window.lcarsHumOsc = null;
      window.lcarsHumGain = null;
      humBtn.textContent = 'Hum';
      speak('Ambient hum disabled');
      setStatus('Hum off');
    } else {
      humOsc = ctx.createOscillator();
      const humGain = ctx.createGain();
      humGain.gain.value = volume;
      humOsc.frequency.value = 50;
      humOsc.type = 'sine';
      humOsc.connect(humGain);
      humGain.connect(ctx.destination);
      humOsc.start();
      window.lcarsHumOsc = humOsc;
      window.lcarsHumGain = humGain;
      humBtn.textContent = 'Mute';
      speak('Ambient hum enabled');
      setStatus('Hum on');
    }
  }

  function toggleFullscreen() {
    playBeep();
    window.electronAPI.toggleFullscreen();
    setStatus('Fullscreen toggled');
  }

  // ===== Beep =====

  function playBeep() {
    const settings = window.lcarsSettings || {};
    const volume = (settings.beepVolume ?? 50) / 100;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    osc.type = 'sine';
    osc.frequency.value = 400 + Math.random() * 400;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  // ===== Home panel =====

  function showHomePanel() {
    const sd = calculateStardate();
    const now = new Date();
    content.innerHTML = `
      <div class="lcars-home">
        <div class="lcars-home-header">
          <h1>LCARS INTERFACE</h1>
          <p>LIBRARY COMPUTER ACCESS &amp; RETRIEVAL SYSTEM</p>
        </div>
        <div class="home-grid">
          <div class="home-cell">
            <div class="home-cell-label">Stardate</div>
            <div class="home-cell-value">${sd}</div>
          </div>
          <div class="home-cell">
            <div class="home-cell-label">Earth Time</div>
            <div class="home-cell-value" id="home-time">${now.toLocaleTimeString()}</div>
          </div>
          <div class="home-cell">
            <div class="home-cell-label">Alert Status</div>
            <div class="home-cell-value home-status-normal">NORMAL</div>
          </div>
          <div class="home-cell">
            <div class="home-cell-label">Systems</div>
            <div class="home-cell-value home-status-nominal">NOMINAL</div>
          </div>
        </div>
        <p class="lcars-tagline">SELECT A FUNCTION FROM THE NAVIGATION PANEL</p>
      </div>`;
    setStatus('System ready');
  }

  // ===== Plugin loader =====

  async function loadPlugins() {
    try {
      const res = await fetch('plugins/plugins.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const plugins = await res.json();
      for (const name of plugins) {
        try {
          const mod = await import(`./plugins/${name}.js`);
          if (mod.init) {
            mod.init({ registerButton, playBeep, speak });
          }
        } catch (pluginErr) {
          console.error(`Plugin ${name} failed:`, pluginErr);
        }
      }
    } catch (err) {
      console.error('Plugin loading failed', err);
    }
  }

  // ===== Clock =====

  function updateClock() {
    clock.textContent = new Date().toLocaleTimeString();
    updateStardate();
    const homeTime = document.getElementById('home-time');
    if (homeTime) homeTime.textContent = new Date().toLocaleTimeString();
  }
  updateClock();
  setInterval(updateClock, 1000);

  // ===== Button handlers =====

  btn.addEventListener('click', () => {
    playBeep();
    speak('Accessing series database');
    setStatus('Loading database...');
    btn.textContent = 'Loading...';
    fetch('star_trek_series.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        content.classList.add('animating-in');
        const list = document.createElement('ul');
        data.forEach(series => {
          const item = document.createElement('li');
          item.textContent = `${series.title} (${series.begin.split('-')[0]})`;
          list.appendChild(item);
        });
        content.innerHTML = '<h2>Star Trek Series Database</h2>';
        content.appendChild(list);
        setTimeout(() => content.classList.remove('animating-in'), 400);
        btn.textContent = 'Database';
        speak('Star Trek series database displayed');
        setStatus('Database loaded');
      })
      .catch(err => {
        console.error('Series fetch failed', err);
        content.innerHTML = '<p class="error">Data unavailable. Please try again.</p>';
        btn.textContent = 'Database';
        speak('Data unavailable');
        setStatus('Error: data unavailable');
      });
  });

  quoteBtn.addEventListener('click', () => {
    playBeep();
    quoteBtn.textContent = 'Loading...';
    speak('Accessing quote database');
    setStatus('Fetching quote...');
    fetch('star_trek_quotes.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const random = data[Math.floor(Math.random() * data.length)];
        content.innerHTML = `
          <h2>${random.author}</h2>
          <p style="font-size:1.1em;line-height:1.8;color:#ddd;font-style:italic;padding:12px 0">"${random.text}"</p>`;
        quoteBtn.textContent = 'Quote';
        speak(random.text);
        setStatus('Quote retrieved');
      })
      .catch(err => {
        console.error('Quote fetch failed', err);
        content.innerHTML = '<p class="error">Quote database unavailable.</p>';
        quoteBtn.textContent = 'Quote';
        speak('Quote unavailable');
        setStatus('Error: quotes unavailable');
      });
  });

  sysInfoBtn.addEventListener('click', async () => {
    playBeep();
    speak('Gathering system information');
    setStatus('Loading system info...');
    sysInfoBtn.textContent = 'Loading...';
    const info = await window.electronAPI.getSystemInfo();
    content.innerHTML = `
      <h2>System Information</h2>
      <ul>
        <li>Platform: <span style="color:#66cc33">${info.platform}</span></li>
        <li>Architecture: <span style="color:#66cc33">${info.arch}</span></li>
        <li>CPU Cores: <span style="color:#66cc33">${info.cpus}</span></li>
        <li>Total Memory: <span style="color:#66cc33">${info.memory} GB</span></li>
      </ul>`;
    sysInfoBtn.textContent = 'System';
    speak(`System running on ${info.platform}, ${info.cpus} cores, ${info.memory} gigabytes memory`);
    setStatus('System info displayed');
  });

  clearBtn.addEventListener('click', () => {
    playBeep();
    showHomePanel();
    speak('Display reset');
  });

  themeBtn.addEventListener('click', toggleTheme);
  humBtn.addEventListener('click', toggleHum);
  fullBtn.addEventListener('click', toggleFullscreen);

  if (alertBtn) {
    alertBtn.addEventListener('click', () => {
      const levels = ['normal', 'yellow', 'red'];
      const idx = levels.indexOf(currentAlert);
      setAlert(levels[(idx + 1) % levels.length]);
    });
  }

  // ===== Keyboard nav =====

  document.addEventListener('keydown', (e) => {
    const buttons = Array.from(document.querySelectorAll('.lcars-button'));
    const focused = document.activeElement;
    const index = focused?.classList.contains('lcars-button') ? buttons.indexOf(focused) : -1;

    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      e.preventDefault();
      buttons[index === -1 ? 0 : (index + 1) % buttons.length]?.focus();
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      e.preventDefault();
      buttons[index === -1 ? buttons.length - 1 : (index - 1 + buttons.length) % buttons.length]?.focus();
    }
    if (e.code === 'Enter' && focused?.classList.contains('lcars-button')) {
      e.preventDefault();
      focused.click();
    }
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyT') toggleTheme();
    if (e.code === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  });

  exitBtn.addEventListener('click', () => {
    speak('Shutting down. Goodbye.');
    setStatus('Shutting down...');
    setTimeout(() => window.electronAPI.closeApp(), 1500);
  });

  // ===== Init =====

  loadPlugins();
  showHomePanel();
  updateStardate();
});
