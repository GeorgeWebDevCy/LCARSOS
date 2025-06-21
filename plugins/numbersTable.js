export function init({ registerButton, playBeep, speak }) {
  registerButton('Numbers', () => {
    playBeep();
    speak('Displaying data stream');
    const content = document.getElementById('content');
    content.innerHTML = '<div id="numbers-container" class="numbers-container"></div>';
    content.classList.remove('hidden');
    generate();
    if (!window.numbersInterval) {
      window.numbersInterval = setInterval(generate, 4000);
    }
  });

  function generate() {
    const container = document.getElementById('numbers-container');
    if (!container) return;
    container.innerHTML = '';
    const rows = 7;
    const cols = 24;
    for (let r = 0; r < rows; r++) {
      const row = document.createElement('div');
      row.className = 'numbers-row';
      for (let c = 0; c < cols; c++) {
        const span = document.createElement('span');
        span.className = 'numbers-cell';
        span.textContent = Math.floor(Math.random() * 10);
        row.appendChild(span);
      }
      container.appendChild(row);
    }
  }
}
