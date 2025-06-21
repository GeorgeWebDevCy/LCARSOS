export function init({ registerButton, playBeep, speak }) {
  registerButton('Scanner', () => {
    playBeep();
    speak('Activating forward scanner');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="scanner-container">
        <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
        <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
        <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
      </div>`;
    content.classList.remove('hidden');
  });
}
