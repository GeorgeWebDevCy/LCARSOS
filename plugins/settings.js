export function init({ registerButton, playBeep, speak }) {
  registerButton('Settings', () => {
    playBeep();
    speak('Opening settings');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="settings-panel">
        <h2>System Settings</h2>
        <div class="setting-group">
          <label>Color Theme</label>
          <select id="theme-select">
            <option value="">Default</option>
            <option value="alt">Alt</option>
            <option value="classic">Classic</option>
            <option value="ds9">DS9</option>
            <option value="tng">TNG</option>
            <option value="voyager">Voyager</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Computer Voice</label>
          <select id="voice-preset">
            <option value="default">Default</option>
            <option value="computer">LCARS Computer</option>
            <option value="computer-slow">LCARS Computer (Slow)</option>
            <option value="computer-deep">LCARS Computer (Deep)</option>
            <option value="enterprise">Enterprise</option>
            <option value="voyager-bridge">Voyager Bridge</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Custom TTS Rate</label>
          <input type="range" id="tts-rate" min="50" max="150" value="90">
          <span id="tts-rate-value">0.9x</span>
        </div>
        <div class="setting-group">
          <label>Custom TTS Pitch</label>
          <input type="range" id="tts-pitch" min="50" max="150" value="80">
          <span id="tts-pitch-value">0.8</span>
        </div>
        <div class="setting-group">
          <label>Computer Effect</label>
          <select id="computer-effect">
            <option value="none">None</option>
            <option value="echo">Echo</option>
            <option value="reverb">Reverb</option>
            <option value="radio">Radio</option>
          </select>
        </div>
        <div class="setting-group">
          <label>Beep Volume</label>
          <input type="range" id="beep-volume" min="0" max="100" value="50">
          <span id="beep-value">50%</span>
        </div>
        <div class="setting-group">
          <label>Ambient Hum Volume</label>
          <input type="range" id="hum-volume" min="0" max="100" value="30">
          <span id="hum-value">30%</span>
        </div>
        <div class="setting-group">
          <label>TTS Volume</label>
          <input type="range" id="tts-volume" min="0" max="100" value="100">
          <span id="tts-value">100%</span>
        </div>
        <div class="setting-group">
          <label>Weather Update (seconds)</label>
          <input type="number" id="weather-interval" min="30" max="3600" value="60">
        </div>
        <div class="setting-group">
          <label>Status Update (seconds)</label>
          <input type="number" id="status-interval" min="1" max="60" value="5">
        </div>
        <div class="setting-group">
          <label>Default View</label>
          <select id="default-view">
            <option value="">None</option>
            <option value="series">Star Trek Series</option>
            <option value="quote">Random Quote</option>
            <option value="status">System Status</option>
            <option value="weather">Weather</option>
          </select>
        </div>
        <button class="lcars-button" id="save-settings">Save Settings</button>
        <button class="lcars-button" id="test-voice">Test Voice</button>
      </div>`;
    content.classList.remove('hidden');
    loadSettings();
    setupListeners();
  });

  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');
    document.getElementById('theme-select').value = localStorage.getItem('lcars-theme') || '';
    document.getElementById('voice-preset').value = localStorage.getItem('lcars-voice-preset') || 'default';
    document.getElementById('computer-effect').value = localStorage.getItem('lcars-computer-effect') || 'none';
    document.getElementById('tts-rate').value = settings.ttsRate ?? 90;
    document.getElementById('tts-pitch').value = settings.ttsPitch ?? 80;
    document.getElementById('beep-volume').value = settings.beepVolume ?? 50;
    document.getElementById('hum-volume').value = settings.humVolume ?? 30;
    document.getElementById('tts-volume').value = settings.ttsVolume ?? 100;
    document.getElementById('weather-interval').value = settings.weatherInterval ?? 60;
    document.getElementById('status-interval').value = settings.statusInterval ?? 5;
    document.getElementById('default-view').value = settings.defaultView ?? '';
    updateLabels();
  }

  function updateLabels() {
    document.getElementById('beep-value').textContent = document.getElementById('beep-volume').value + '%';
    document.getElementById('hum-value').textContent = document.getElementById('hum-volume').value + '%';
    document.getElementById('tts-value').textContent = document.getElementById('tts-volume').value + '%';
    document.getElementById('tts-rate-value').textContent = (document.getElementById('tts-rate').value / 100).toFixed(1) + 'x';
    document.getElementById('tts-pitch-value').textContent = (document.getElementById('tts-pitch').value / 100).toFixed(1);
  }

  function setupListeners() {
    ['beep-volume', 'hum-volume', 'tts-volume', 'tts-rate', 'tts-pitch'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateLabels);
    });

    document.getElementById('save-settings').addEventListener('click', () => {
      playBeep();
      const theme = document.getElementById('theme-select').value;
      const voicePreset = document.getElementById('voice-preset').value;
      const computerEffect = document.getElementById('computer-effect').value;
      const settings = {
        beepVolume: parseInt(document.getElementById('beep-volume').value),
        humVolume: parseInt(document.getElementById('hum-volume').value),
        ttsVolume: parseInt(document.getElementById('tts-volume').value),
        ttsRate: parseInt(document.getElementById('tts-rate').value),
        ttsPitch: parseInt(document.getElementById('tts-pitch').value),
        weatherInterval: parseInt(document.getElementById('weather-interval').value),
        statusInterval: parseInt(document.getElementById('status-interval').value),
        defaultView: document.getElementById('default-view').value,
        voicePreset: voicePreset,
        computerEffect: computerEffect
      };
      
      localStorage.setItem('lcars-settings', JSON.stringify(settings));
      localStorage.setItem('lcars-theme', theme);
      localStorage.setItem('lcars-voice-preset', voicePreset);
      localStorage.setItem('lcars-computer-effect', computerEffect);
      
      window.lcarsSettings = settings;
      
      if (theme) {
        document.body.setAttribute('data-theme', theme);
      } else {
        document.body.removeAttribute('data-theme');
      }
      
      if (window.lcarsHumOsc && window.lcarsHumGain) {
        window.lcarsHumGain.gain.value = settings.humVolume / 100;
      }
      
      speak('Settings saved');
      const content = document.getElementById('content');
      const banner = document.createElement('p');
      banner.className = 'success';
      banner.textContent = 'Settings saved successfully.';
      content.prepend(banner);
      setTimeout(() => banner.remove(), 2500);
    });

    document.getElementById('test-voice').addEventListener('click', () => {
      playBeep();
      speak('LCARS interface operational. All systems nominal.');
    });
  }
}