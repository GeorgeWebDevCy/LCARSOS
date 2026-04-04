export function init({ registerButton, playBeep, speak }) {
  registerButton('Stardate', () => {
    playBeep();
    speak('Calculating current stardate');
    const content = document.getElementById('content');
    content.innerHTML = `
      <h2>Stardate Calculator</h2>
      <div class="lcars-panel">
        <div class="lcars-panel-header">CURRENT STARDATE</div>
        <div id="stardate-panel" class="lcars-value" style="font-size:2.2em;text-align:center;padding:14px 0"></div>
      </div>
      <div class="lcars-panel" style="margin-top:14px">
        <div class="lcars-panel-header">EARTH DATE</div>
        <div id="earth-date-panel" style="font-family:'Share Tech Mono',monospace;color:#ccc;padding:6px 0"></div>
      </div>`;
    content.classList.remove('hidden');
    update();
  });

  function calcStardate() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const dayFraction = (now - start) / (365.25 * 24 * 60 * 60 * 1000);
    // TNG-era projection: 2020 ≈ stardate 77000, +1000 per year
    return (77000 + ((now.getFullYear() - 2020) * 1000) + (dayFraction * 1000)).toFixed(1);
  }

  // Speak stardate LCARS-style: "eight three two five seven point three"
  function stardateToSpeech(sd) {
    const [whole, frac] = sd.toString().split('.');
    const digits = whole.split('').join(' ');
    return frac ? `${digits} point ${frac}` : digits;
  }

  function update() {
    const sdPanel = document.getElementById('stardate-panel');
    const edPanel = document.getElementById('earth-date-panel');
    if (sdPanel) {
      const sd = calcStardate();
      sdPanel.textContent = sd;
      speak(`Stardate ${stardateToSpeech(sd)}`);
    }
    if (edPanel) {
      edPanel.textContent = new Date().toLocaleString();
    }
  }

  setInterval(() => {
    const panel = document.getElementById('stardate-panel');
    if (panel) {
      panel.textContent = calcStardate();
    }
    const ed = document.getElementById('earth-date-panel');
    if (ed) {
      ed.textContent = new Date().toLocaleString();
    }
  }, 10000);
}
