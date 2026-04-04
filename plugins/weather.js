export function init({ registerButton, playBeep, speak }) {
  registerButton('Weather', () => {
    playBeep();
    speak('Fetching weather report');
    const content = document.getElementById('content');
    content.innerHTML = '<h2>Weather</h2><div id="weather-panel">Loading...</div>';
    content.classList.remove('hidden');
    update();
  });

  function update() {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const weather = data.current_weather;
        const panel = document.getElementById('weather-panel');
        if (panel) {
          panel.innerHTML = `
            <ul>
              <li>Temperature: ${weather.temperature}°C</li>
              <li>Wind Speed: ${weather.windspeed} km/h</li>
              <li>Conditions: ${weather.weathercode}</li>
            </ul>`;
          speak(`Current temperature ${weather.temperature} degrees`);
        }
      })
      .catch(err => {
        console.error('Weather fetch failed', err);
        const panel = document.getElementById('weather-panel');
        if (panel) {
          panel.innerHTML = '<p class="error">Weather data unavailable. Check internet connection.</p>';
        }
        speak('Weather data unavailable');
      });
  }

  let intervalId = null;

  function startInterval() {
    if (intervalId) clearInterval(intervalId);
    const settings = window.lcarsSettings || {};
    const seconds = settings.weatherInterval ?? 60;
    intervalId = setInterval(update, seconds * 1000);
  }

  startInterval();

  window.addEventListener('storage', () => {
    window.lcarsSettings = JSON.parse(localStorage.getItem('lcars-settings') || '{}');
    const content = document.getElementById('weather-panel');
    if (content && content.innerHTML.includes('Temperature:')) {
      startInterval();
    }
  });
}