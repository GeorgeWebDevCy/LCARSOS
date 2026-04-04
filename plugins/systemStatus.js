export function init({ registerButton, playBeep, speak }) {
  registerButton('Status', async () => {
    playBeep();
    speak('Displaying system status');
    const content = document.getElementById('content');
    content.innerHTML = '<h2>System Status</h2><div id="status-panel">Loading...</div>';
    content.classList.remove('hidden');
    update();
  });

  async function update() {
    const info = await window.electronAPI.getSystemInfo();
    const panel = document.getElementById('status-panel');
    if (panel) {
      panel.innerHTML = `
        <ul>
          <li>Platform: ${info.platform}</li>
          <li>Architecture: ${info.arch}</li>
          <li>CPU Cores: ${info.cpus}</li>
          <li>Total Memory: ${info.memory} GB</li>
        </ul>`;
    }
  }

  let intervalId = null;
  let currentView = 'Status';

  function startInterval() {
    if (intervalId) clearInterval(intervalId);
    const settings = window.lcarsSettings || {};
    const seconds = settings.statusInterval ?? 5;
    intervalId = setInterval(update, seconds * 1000);
  }

  startInterval();
  update();

  window.addEventListener('storage', () => {
    window.lcarsSettings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');
    const settings = window.lcarsSettings;
    const content = document.getElementById('status-panel');
    if (content && content.innerHTML.includes('Platform:')) {
      startInterval();
    }
  });
}