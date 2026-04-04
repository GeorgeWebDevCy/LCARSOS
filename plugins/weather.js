export function init({ registerButton, playBeep, speak }) {
  registerButton('Weather', async () => {
    playBeep();
    speak('Fetching weather report');
    const content = document.getElementById('content');
    content.innerHTML = '<h2>Weather</h2><div id="weather-panel">Loading...</div>';
    content.classList.remove('hidden');
    await update();
  });

  async function update() {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
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
    } catch (err) {
      console.error('Weather fetch failed', err);
      const panel = document.getElementById('weather-panel');
      if (panel) {
        panel.innerHTML = '<p class="error">Weather data unavailable. Check internet connection.</p>';
      }
      speak('Weather data unavailable');
    }
  }

  setInterval(update, 60000);
}
