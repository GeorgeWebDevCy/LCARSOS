export function init({ registerButton, playBeep, speak }) {
  registerButton('Settings', () => {
    playBeep();
    speak('Opening settings');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="settings-panel">
        <h2>System Settings</h2>
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
          <label>Weather Update Interval (seconds)</label>
          <input type="number" id="weather-interval" min="30" max="3600" value="60">
        </div>
        <div class="setting-group">
          <label>System Status Update (seconds)</label>
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
      </div>`;
    content.classList.remove('hidden');
    loadSettings();
    setupListeners();
  });

  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');
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
  }

  function setupListeners() {
    ['beep-volume', 'hum-volume', 'tts-volume'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateLabels);
    });

    document.getElementById('save-settings').addEventListener('click', () => {
      playBeep();
      const settings = {
        beepVolume: parseInt(document.getElementById('beep-volume').value),
        humVolume: parseInt(document.getElementById('hum-volume').value),
        ttsVolume: parseInt(document.getElementById('tts-volume').value),
        weatherInterval: parseInt(document.getElementById('weather-interval').value),
        statusInterval: parseInt(document.getElementById('status-interval').value),
        defaultView: document.getElementById('default-view').value
      };
      localStorage.setItem('lcars-settings', JSON.stringify(settings));
      window.lcarsSettings = settings;
      if (window.lcarsHumOsc && window.lcarsHumGain) {
        window.lcarsHumGain.gain.value = settings.humVolume / 100;
      }
      speak('Settings saved');
      const content = document.getElementById('content');
      content.innerHTML = '<p class="success">Settings saved successfully.</p>';
      setTimeout(() => content.classList.add('hidden'), 2000);
    });
  }
}