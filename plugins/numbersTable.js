export function init({ registerButton, playBeep, speak }) {
  registerButton('Numbers', () => {
    playBeep();
    speak('Displaying data stream');
    const content = document.getElementById('content');
    content.innerHTML = '<div id="numbers-container" class="numbers-container"></div>';
    content.classList.remove('hidden');
    generate();
    if (!window.numbersInterval) {
      window.numbersInterval = setInterval(generate, 180);
    }
  });

  function generate() {
    const container = document.getElementById('numbers-container');
    if (!container) return;
    container.innerHTML = '';

    const cellWidth = 24;
    const rowHeight = 22;
    const rows = Math.max(18, Math.floor(container.clientHeight / rowHeight));
    const cols = Math.max(32, Math.floor(container.clientWidth / cellWidth));

    for (let r = 0; r < rows; r++) {
      const row = document.createElement('div');
      row.className = 'numbers-row';
      row.style.animationDelay = `${(r % 12) * 0.08}s`;

      for (let c = 0; c < cols; c++) {
        const span = document.createElement('span');
        span.className = 'numbers-cell';
        span.textContent = randomDigit();
        if (Math.random() > 0.965) {
          span.classList.add('accent');
        }
        row.appendChild(span);
      }
      container.appendChild(row);
    }
  }

  function randomDigit() {
    return Math.floor(Math.random() * 10);
  }
}
