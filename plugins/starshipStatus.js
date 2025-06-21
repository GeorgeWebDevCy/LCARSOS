export function init({ registerButton, playBeep }) {
  registerButton('Starship', () => {
    playBeep();
    const content = document.getElementById('content');
    content.innerHTML = '<h2>Starship Status</h2><div id="ship-status">Loading...</div>';
    content.classList.remove('hidden');
    update();
  });

  function update() {
    const panel = document.getElementById('ship-status');
    if (panel) {
      const core = Math.floor(90 + Math.random() * 10);
      const shields = Math.floor(70 + Math.random() * 30);
      panel.innerHTML = `
        <ul>
          <li>Warp Core Output: ${core}%</li>
          <li>Shield Strength: ${shields}%</li>
          <li>Life Support: Nominal</li>
        </ul>`;
    }
  }

  setInterval(update, 5000);
}
