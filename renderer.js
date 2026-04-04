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

  const pluginArea = document.getElementById('plugin-bar').querySelector('.buttons-container');

  window.lcarsSettings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');

  function registerButton(label, handler) {
    const button = document.createElement('button');
    button.className = 'lcars-button';
    button.textContent = label;
    button.addEventListener('click', () => {
      const content = document.getElementById('content');
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
    return font.load().then(() => {
      document.fonts.add(font);
    });
  }

  loadFont('Share Tech Mono', 'https://fonts.gstatic.com/s/sharetechmono/v15/J7aHnp1uDWRBEqV98dVQ5mRY1yo.woff2');
  loadFont('Orbitron', 'https://fonts.gstatic.com/s/orbitron/v30/yMJRMIlzdpvBhQQL_Qq7dytiyr2GqCJDM8c.woff2');

  window.lcarsSettings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');

  const voicePresets = {
    default: { rate: 1.0, pitch: 1.0 },
    'computer': { rate: 0.9, pitch: 0.8 },
    'computer-slow': { rate: 0.7, pitch: 0.8 },
    'computer-deep': { rate: 0.85, pitch: 0.6 },
    'enterprise': { rate: 0.95, pitch: 0.9 },
    'voyager-bridge': { rate: 0.85, pitch: 0.85 }
  };

  async function speak(text) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (synth.speaking) synth.cancel();
    
    const settings = window.lcarsSettings || {};
    const presetName = localStorage.getItem('lcars-voice-preset') || 'default';
    const preset = voicePresets[presetName] || voicePresets.default;
    const effect = localStorage.getItem('lcars-computer-effect') || 'none';
    
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = (settings.ttsRate ?? 100) / 100 * preset.rate;
    utter.pitch = (settings.ttsPitch ?? 100) / 100 * preset.pitch;
    utter.volume = (settings.ttsVolume ?? 100) / 100;
    
    const voices = synth.getVoices();
    const stored = localStorage.getItem('lcars-voice');
    let voice = null;
    if (stored) {
      voice = voices.find(v => v.name === stored);
    }
    if (!voice) {
      voice = voices.find(v => /en-US/i.test(v.lang)) || 
              voices.find(v => /en/i.test(v.lang));
    }
    if (!voice) {
      voice = voices.find(v => v.name.includes('Microsoft') || v.name.includes('Google'));
    }
    if (voice) utter.voice = voice;
    
    if (effect !== 'none') {
      utter.onend = () => {
        applyAudioEffect(text, effect);
      };
    }
    
    synth.speak(utter);
  }

  function applyAudioEffect(text, effect) {
    if (!window.AudioContext) return;
    
    const ctx = window.lcarsAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    window.lcarsAudioCtx = ctx;
    
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();
    
    const settings = window.lcarsSettings || {};
    gainNode.gain.value = (settings.ttsVolume ?? 100) / 100 * 0.3;
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(2000, ctx.currentTime);
    
    if (effect === 'echo') {
      filterNode.frequency.setValueAtTime(1000, ctx.currentTime);
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.15;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.3;
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      filterNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(ctx.destination);
      gainNode.connect(ctx.destination);
    } else if (effect === 'reverb') {
      filterNode.frequency.setValueAtTime(1500, ctx.currentTime);
      const convolver = ctx.createConvolver();
      const rate = ctx.sampleRate;
      const length = rate * 1.5;
      const impulse = ctx.createBuffer(2, length, rate);
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
      }
      convolver.buffer = impulse;
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      filterNode.connect(convolver);
      convolver.connect(ctx.destination);
      gainNode.connect(ctx.destination);
    } else if (effect === 'radio') {
      filterNode.type = 'bandpass';
      filterNode.frequency.setValueAtTime(1000, ctx.currentTime);
      filterNode.Q.setValueAtTime(1, ctx.currentTime);
      const noise = ctx.createBufferSource();
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = Math.random() * 2 - 1;
      }
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.02;
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.5);
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(ctx.destination);
    }
    
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.3);
  }
    
    const voices = synth.getVoices();
    const stored = localStorage.getItem('lcars-voice');
    let voice = null;
    if (stored) {
      voice = voices.find(v => v.name === stored);
    }
    if (!voice) {
      voice = voices.find(v => /en-US/i.test(v.lang)) || 
              voices.find(v => /en/i.test(v.lang));
    }
    if (!voice) {
      voice = voices.find(v => v.name.includes('Microsoft') || v.name.includes('Google'));
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const plugins = await res.json();
      for (const name of plugins) {
        try {
          const mod = await import(`./plugins/${name}.js`);
          if (mod.init) {
            mod.init({ registerButton, playBeep, speak });
          }
        } catch (pluginErr) {
          console.error(`Plugin ${name} failed to load:`, pluginErr);
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

  btn.addEventListener('click', () => {
    playBeep();
    speak('Accessing series database');
    btn.textContent = 'Loading...';
    fetch('star_trek_series.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
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
      })
      .catch(err => {
        console.error('Series fetch failed', err);
        const content = document.getElementById('content');
        content.innerHTML = '<p class="error">Data unavailable. Please try again.</p>';
        content.classList.remove('hidden');
        btn.textContent = 'Activate';
        speak('Data unavailable');
      });
  });

  quoteBtn.addEventListener('click', () => {
    playBeep();
    quoteBtn.textContent = 'Loading...';
    speak('Fetching quote');
    fetch('star_trek_quotes.json')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const content = document.getElementById('content');
        const random = data[Math.floor(Math.random() * data.length)];
        content.innerHTML = `<h2>${random.author}</h2><p>${random.text}</p>`;
        content.classList.remove('hidden');
        quoteBtn.textContent = 'Random Quote';
        speak(random.text);
      })
      .catch(err => {
        console.error('Quote fetch failed', err);
        const content = document.getElementById('content');
        content.innerHTML = '<p class="error">Quote database unavailable.</p>';
        content.classList.remove('hidden');
        quoteBtn.textContent = 'Random Quote';
        speak('Quote unavailable');
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
    const buttons = document.querySelectorAll('.lcars-button');
    const focused = document.activeElement;
    let index = -1;
    if (focused && focused.classList.contains('lcars-button')) {
      index = Array.from(buttons).indexOf(focused);
    }

    if (e.code === 'ArrowRight' || e.code === 'ArrowDown') {
      e.preventDefault();
      if (index === -1) {
        buttons[0]?.focus();
      } else {
        buttons[(index + 1) % buttons.length]?.focus();
      }
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowUp') {
      e.preventDefault();
      if (index === -1) {
        buttons[buttons.length - 1]?.focus();
      } else {
        buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
      }
    }
    if (e.code === 'Enter' && focused && focused.classList.contains('lcars-button')) {
      e.preventDefault();
      focused.click();
    }
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
