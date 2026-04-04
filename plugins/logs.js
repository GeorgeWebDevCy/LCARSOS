export function init({ registerButton, playBeep, speak }) {
  registerButton('Logs', async () => {
    playBeep();
    speak('Displaying system logs');
    const content = document.getElementById('content');
    content.innerHTML = '<h2>System Logs</h2><pre id="logs-content" class="logs-container">Loading...</pre>';
    content.classList.remove('hidden');

    try {
      const logs = await window.electronAPI.getLogs();
      const logContent = document.getElementById('logs-content');
      logContent.textContent = logs || 'No logs available';
      logContent.scrollTop = logContent.scrollHeight;
    } catch (err) {
      document.getElementById('logs-content').textContent = `Error loading logs: ${err.message}`;
    }
  });
}