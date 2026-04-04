export function init({ registerButton, playBeep, speak }) {
  registerButton('Starship', () => {
    playBeep();
    speak('Displaying starship status');
    const content = document.getElementById('content');
    content.innerHTML = `
      <h2>Starship Status</h2>
      <div id="ship-status"></div>`;
    content.classList.remove('hidden');
    update();
  });

  const systems = [
    { label: 'Warp Core Output',     id: 'warp-core',   min: 88, max: 100, unit: '%',  color: '#66cc33' },
    { label: 'Impulse Engines',      id: 'impulse',     min: 80, max: 100, unit: '%',  color: '#99ccff' },
    { label: 'Deflector Shields',    id: 'shields',     min: 60, max: 100, unit: '%',  color: '#cc99cc' },
    { label: 'Structural Integrity', id: 'structural',  min: 94, max: 100, unit: '%',  color: '#66cc33' },
    { label: 'Life Support',         id: 'life-support',min: 99, max: 100, unit: '%',  color: '#99ccff' },
    { label: 'Sensor Array',         id: 'sensors',     min: 85, max: 100, unit: '%',  color: '#ffcc00' },
    { label: 'Phaser Banks',         id: 'phasers',     min: 70, max: 100, unit: '%',  color: '#ff9900' },
    { label: 'Torpedo Bays',         id: 'torpedoes',   min: 0,  max: 100, unit: ' MT', color: '#ff9900' },
  ];

  function update() {
    const panel = document.getElementById('ship-status');
    if (!panel) return;
    panel.innerHTML = systems.map(s => {
      const val = Math.floor(s.min + Math.random() * (s.max - s.min + 1));
      const barW = Math.max(0, Math.min(100, val));
      const statusColor = val >= 80 ? '#66cc33' : val >= 50 ? '#ffcc00' : '#ff3333';
      return `
        <div style="margin:10px 0">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span class="lcars-label">${s.label}</span>
            <span style="font-family:'Share Tech Mono',monospace;color:${statusColor};font-size:1.05em">${val}${s.unit}</span>
          </div>
          <div style="background:#1a1a1a;height:14px;border-radius:7px;overflow:hidden;border-left:3px solid ${s.color}">
            <div style="background:linear-gradient(to right,${s.color}88,${s.color});height:100%;width:${barW}%;transition:width 0.4s ease;border-radius:0 7px 7px 0"></div>
          </div>
        </div>`;
    }).join('');
  }

  setInterval(() => {
    const panel = document.getElementById('ship-status');
    if (panel) update();
  }, 3000);
}
