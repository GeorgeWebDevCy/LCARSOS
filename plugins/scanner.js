export function init({ registerButton, playBeep, speak }) {
  const scannerObjects = [
    { type: 'Asteroid Field', threat: 'Low' },
    { type: 'Unidentified Vessel', threat: 'Unknown' },
    { type: 'Nebula', threat: 'None' },
    { type: 'Spatial Anomaly', threat: 'Medium' },
    { type: 'Derelict Ship', threat: 'Low' },
    { type: 'Radiation Cloud', threat: 'High' },
    { type: 'Comet', threat: 'None' },
    { type: 'Plasma Storm', threat: 'Medium' }
  ];

  registerButton('Scanner', () => {
    playBeep();
    speak('Activating forward scanner');
    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="scanner-full">
        <div class="scanner-container">
          <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
          <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
          <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
        </div>
        <div class="scanner-data">
          <h3>Sensor Readings</h3>
          <div id="scan-progress">Scanning...</div>
          <div id="detected-objects"></div>
        </div>
      </div>`;
    content.classList.remove('hidden');
    startScan();
  });

  function startScan() {
    const progress = document.getElementById('scan-progress');
    const objectsDiv = document.getElementById('detected-objects');
    let count = 0;
    const maxScans = 5;
    
    const scanInterval = setInterval(() => {
      count++;
      progress.textContent = `Scanning sector ${count}/${maxScans}...`;
      
      if (count === maxScans) {
        clearInterval(scanInterval);
        progress.textContent = 'Scan complete';
        displayObjects();
      }
    }, 1500);
  }

  function displayObjects() {
    const objectsDiv = document.getElementById('detected-objects');
    const count = Math.floor(Math.random() * 4) + 1;
    const detected = [];
    
    for (let i = 0; i < count; i++) {
      const obj = scannerObjects[Math.floor(Math.random() * scannerObjects.length)];
      const distance = (Math.random() * 50000 + 1000).toFixed(0);
      detected.push({ ...obj, distance, bearing: Math.floor(Math.random() * 360) });
    }

    objectsDiv.innerHTML = detected.map(obj => `
      <div class="detected-object">
        <span class="obj-type">${obj.type}</span>
        <span class="obj-distance">${obj.distance} km</span>
        <span class="obj-bearing">${obj.bearing}°</span>
        <span class="obj-threat ${obj.threat.toLowerCase()}">${obj.threat}</span>
      </div>
    `).join('');

    speak(`${count} objects detected`);
  }
}