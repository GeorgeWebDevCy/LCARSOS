export function init({ registerButton, playBeep, speak }) {
  registerButton('Status', async () => {
    playBeep();
    speak('Displaying system status');
    const content = document.getElementById('content');
    content.innerHTML = `
      <h2>System Status</h2>
      <div id="status-panel">
        <div class="lcars-label" style="padding:10px 0">Loading system data...</div>
      </div>`;
    content.classList.remove('hidden');
    update();
  });

  async function update() {
    const info = await window.electronAPI.getSystemInfo();
    const panel = document.getElementById('status-panel');
    if (!panel) return;

    panel.innerHTML = `
      <div class="home-grid" style="max-width:580px">
        <div class="home-cell">
          <div class="home-cell-label">Platform</div>
          <div class="home-cell-value">${info.platform.toUpperCase()}</div>
        </div>
        <div class="home-cell">
          <div class="home-cell-label">Architecture</div>
          <div class="home-cell-value">${info.arch.toUpperCase()}</div>
        </div>
        <div class="home-cell">
          <div class="home-cell-label">CPU Cores</div>
          <div class="home-cell-value">${info.cpus}</div>
        </div>
        <div class="home-cell">
          <div class="home-cell-label">Total Memory</div>
          <div class="home-cell-value">${info.memory} GB</div>
        </div>
      </div>
      <div class="lcars-panel" style="max-width:580px;margin-top:16px">
        <div class="lcars-panel-header">SUBSYSTEM STATUS</div>
        ${['Compute Core', 'Memory Banks', 'I/O Bus', 'Network Interface'].map(s => `
          <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.07)">
            <span class="lcars-label">${s}</span>
            <span style="display:flex;align-items:center;gap:7px">
              <span class="status-dot online"></span>
              <span style="font-family:'Share Tech Mono',monospace;color:#66cc33;font-size:0.9em">ONLINE</span>
            </span>
          </div>`).join('')}
      </div>`;
  }

  let intervalId = null;

  function startInterval() {
    if (intervalId) clearInterval(intervalId);
    const settings = window.lcarsSettings || {};
    const seconds = settings.statusInterval ?? 5;
    intervalId = setInterval(() => {
      if (document.getElementById('status-panel')) update();
    }, seconds * 1000);
  }

  startInterval();
  update();

  window.addEventListener('storage', () => {
    window.lcarsSettings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');
    startInterval();
  });
}
