export function init({ registerButton, playBeep, speak }) {
  registerButton('Transmission', () => {
    playBeep();
    speak('Incoming transmission');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="transmission">
        <img class="transmission-logo" src="https://raw.githubusercontent.com/louh/lcars/main/src/federation-logo.svg" alt="Federation" />
        <h1 class="transmission-title">Incoming Transmission</h1>
        <h3 class="transmission-subtitle">Starfleet Command &bull; Authorized access only</h3>
      </div>`;
    content.classList.remove('hidden');
  });
}
