document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('main-btn');
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  function playBeep() {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 440;
    osc.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  btn.addEventListener('click', () => {
    playBeep();
    btn.textContent = 'Activated';
  });
});
