export function init({ registerButton, playBeep, speak }) {
  registerButton('Warp Output', () => {
    playBeep();
    speak('Displaying warp field output');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div id="warp-output" class="warp-output">
        <div class="warp-bar"><div class="warp-bar-fill"></div></div>
        <div class="warp-bar"><div class="warp-bar-fill"></div></div>
        <div class="warp-bar"><div class="warp-bar-fill"></div></div>
        <div class="warp-bar"><div class="warp-bar-fill"></div></div>
      </div>`;
    content.classList.remove('hidden');
    update();
    if (!window.warpInterval) {
      window.warpInterval = setInterval(update, 1000);
    }
  });

  function update() {
    const bars = document.querySelectorAll('#warp-output .warp-bar-fill');
    bars.forEach(bar => {
      const value = Math.floor(Math.random() * 100);
      bar.style.width = value + '%';
      bar.textContent = value + '%';
    });
  }
}
