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
          <label>Voice Mode</label>
          <select id="voice-mode">
            <option value="browser">Browser TTS</option>
            <option value="elevenlabs">ElevenLabs (requires API key)</option>
          </select>
        </div>
        <div class="setting-group" id="elevenlabs-config" style="display:none;">
          <label>ElevenLabs API Key</label>
          <input type="password" id="elevenlabs-key" placeholder="Enter API Key" style="flex:1;">
        </div>
        <div class="setting-group" id="elevenlabs-voice" style="display:none;">
          <label>ElevenLabs Voice ID</label>
          <input type="text" id="elevenlabs-voiceid" placeholder="Enter Voice ID" style="flex:1;">
        </div>
        <div class="setting-group">
          <label>Browser TTS Rate</label>
          <input type="range" id="tts-rate" min="50" max="150" value="90">
          <span id="tts-rate-value">0.9x</span>
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
      </div>`;
    content.classList.remove('hidden');
    loadSettings();
    setupListeners();
  });

  function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');
    document.getElementById('theme-select').value = localStorage.getItem('lcars-theme') || '';
    document.getElementById('voice-mode').value = localStorage.getItem('lcars-voice-mode') || 'browser';
    document.getElementById('elevenlabs-key').value = localStorage.getItem('lcars-elevenlabs-key') || '';
    document.getElementById('elevenlabs-voiceid').value = localStorage.getItem('lcars-elevenlabs-voiceid') || '';
    document.getElementById('tts-rate').value = settings.ttsRate ?? 90;
    document.getElementById('beep-volume').value = settings.beepVolume ?? 50;
    document.getElementById('hum-volume').value = settings.humVolume ?? 30;
    document.getElementById('tts-volume').value = settings.ttsVolume ?? 100;
    document.getElementById('weather-interval').value = settings.weatherInterval ?? 60;
    document.getElementById('status-interval').value = settings.statusInterval ?? 5;
    document.getElementById('default-view').value = settings.defaultView ?? '';
    updateLabels();
    updateElevenLabsVisibility();
  }

  function updateLabels() {
    document.getElementById('beep-value').textContent = document.getElementById('beep-volume').value + '%';
    document.getElementById('hum-value').textContent = document.getElementById('hum-volume').value + '%';
    document.getElementById('tts-value').textContent = document.getElementById('tts-volume').value + '%';
    document.getElementById('tts-rate-value').textContent = (document.getElementById('tts-rate').value / 100).toFixed(1) + 'x';
  }

  function updateElevenLabsVisibility() {
    const mode = document.getElementById('voice-mode').value;
    const config = document.getElementById('elevenlabs-config');
    const voice = document.getElementById('elevenlabs-voice');
    if (mode === 'elevenlabs') {
      config.style.display = 'flex';
      voice.style.display = 'flex';
    } else {
      config.style.display = 'none';
      voice.style.display = 'none';
    }
  }

  function setupListeners() {
    ['beep-volume', 'hum-volume', 'tts-volume', 'tts-rate'].forEach(id => {
      document.getElementById(id).addEventListener('input', updateLabels);
    });

    document.getElementById('voice-mode').addEventListener('change', updateElevenLabsVisibility);

    document.getElementById('save-settings').addEventListener('click', async () => {
      playBeep();
      const theme = document.getElementById('theme-select').value;
      const voiceMode = document.getElementById('voice-mode').value;
      const settings = {
        beepVolume: parseInt(document.getElementById('beep-volume').value),
        humVolume: parseInt(document.getElementById('hum-volume').value),
        ttsVolume: parseInt(document.getElementById('tts-volume').value),
        ttsRate: parseInt(document.getElementById('tts-rate').value),
        weatherInterval: parseInt(document.getElementById('weather-interval').value),
        statusInterval: parseInt(document.getElementById('status-interval').value),
        defaultView: document.getElementById('default-view').value,
        voiceMode: voiceMode
      };
      
      localStorage.setItem('lcars-settings', JSON.stringify(settings));
      localStorage.setItem('lcars-theme', theme);
      localStorage.setItem('lcars-voice-mode', voiceMode);
      
      if (voiceMode === 'elevenlabs') {
        const apiKey = document.getElementById('elevenlabs-key').value;
        const voiceId = document.getElementById('elevenlabs-voiceid').value;
        localStorage.setItem('lcars-elevenlabs-key', apiKey);
        localStorage.setItem('lcars-elevenlabs-voiceid', voiceId);
      }
      
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
      content.innerHTML = '<p class="success">Settings saved successfully.</p>';
      setTimeout(() => content.classList.add('hidden'), 2000);
    });
  }
}