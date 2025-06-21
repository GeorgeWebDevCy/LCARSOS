export function init({ registerButton, playBeep }) {
  registerButton('Weather', async () => {
    playBeep();
    const content = document.getElementById('content');
    content.innerHTML = '<h2>Weather</h2><div id="weather-panel">Loading...</div>';
    content.classList.remove('hidden');
    await update();
  });

  async function update() {
    try {
      const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194&current_weather=true');
      const data = await res.json();
      const weather = data.current_weather;
      const panel = document.getElementById('weather-panel');
      if (panel) {
        panel.innerHTML = `
          <ul>
            <li>Temperature: ${weather.temperature}\xB0C</li>
            <li>Wind Speed: ${weather.windspeed} km/h</li>
            <li>Conditions: ${weather.weathercode}</li>
          </ul>`;
      }
    } catch (err) {
      console.error('Weather fetch failed', err);
    }
  }

  setInterval(update, 60000);
}
