export function init({ registerButton, playBeep, speak }) {
  registerButton('Omega Directive', () => {
    playBeep();
    speak('Omega Directive activated');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="omega-directive">
        <img src="https://raw.githubusercontent.com/louh/lcars/main/src/omega-directive.svg" alt="Omega Directive" />
        <h2>Omega Directive</h2>
        <p>Top secret Starfleet protocol. Clearance level 10 required.</p>
      </div>`;
    content.classList.remove('hidden');
  });
}
