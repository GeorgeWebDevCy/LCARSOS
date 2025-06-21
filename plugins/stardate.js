export function init({ registerButton, playBeep, speak }) {
  registerButton('Stardate', () => {
    playBeep();
    speak('Calculating current stardate');
    const content = document.getElementById('content');
    content.innerHTML = `<h2>Current Stardate</h2><div id="stardate-panel"></div>`;
    content.classList.remove('hidden');
    update();
  });

  function calcStardate() {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, 0, 0);
    const diff = now - start;
    const day = diff / (1000 * 60 * 60 * 24);
    return (((year - 2323) * 1000) + day * (1000 / 365)).toFixed(1);
  }

  function update() {
    const panel = document.getElementById('stardate-panel');
    if (panel) {
      const sd = calcStardate();
      panel.textContent = sd;
      speak(`Stardate ${sd}`);
    }
  }

  setInterval(update, 60000);
}
