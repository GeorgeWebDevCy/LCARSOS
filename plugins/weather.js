export function init({ registerButton, playBeep, speak }) {
  let currentLat = 37.7749;
  let currentLon = -122.4194;
  let locationName = 'San Francisco';

  registerButton('Weather', () => {
    playBeep();
    speak('Fetching weather report');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="weather-container">
        <h2>Weather - <span id="location-name">${locationName}</span></h2>
        <div id="weather-panel">Loading...</div>
        <button class="lcars-button" id="use-location">Use My Location</button>
      </div>`;
    content.classList.remove('hidden');
    update();
    setupListeners();
  });

  function update() {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLat}&longitude=${currentLon}&current_weather=true`)
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
          speak(`Current temperature ${weather.temperature} degrees at ${locationName}`);
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

  function setupListeners() {
    const locBtn = document.getElementById('use-location');
    if (locBtn) {
      locBtn.addEventListener('click', () => {
        playBeep();
        speak('Acquiring location');
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              currentLat = position.coords.latitude;
              currentLon = position.coords.longitude;
              locationName = 'Your Location';
              document.getElementById('location-name').textContent = locationName;
              localStorage.setItem('lcars-weather-lat', currentLat);
              localStorage.setItem('lcars-weather-lon', currentLon);
              update();
            },
            (error) => {
              speak('Location access denied');
              console.error('Geolocation error:', error);
            }
          );
        } else {
          speak('Geolocation not supported');
        }
      });
    }
  }

  const savedLat = localStorage.getItem('lcars-weather-lat');
  const savedLon = localStorage.getItem('lcars-weather-lon');
  if (savedLat && savedLon) {
    currentLat = parseFloat(savedLat);
    currentLon = parseFloat(savedLon);
    locationName = 'Saved Location';
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