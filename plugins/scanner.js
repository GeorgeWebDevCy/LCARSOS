export function init({ registerButton, playBeep, speak }) {
  const scannerObjects = [
    { type: 'Asteroid Field', threat: 'Low', analysis: 'Fragment cloud with stable drift vectors. Safe for passive observation.' },
    { type: 'Unidentified Vessel', threat: 'Unknown', analysis: 'Warp signature unresolved. Maintain lock and compare transponder bands.' },
    { type: 'Nebula', threat: 'None', analysis: 'Ionized gas interference detected. Sensor resolution reduced by 28 percent.' },
    { type: 'Spatial Anomaly', threat: 'Medium', analysis: 'Subspace distortions present. Structural harmonics should be monitored.' },
    { type: 'Derelict Ship', threat: 'Low', analysis: 'No active propulsion detected. Recommend focused life-sign sweep.' },
    { type: 'Radiation Cloud', threat: 'High', analysis: 'Elevated particle density. Shield modulation advised before approach.' },
    { type: 'Comet', threat: 'None', analysis: 'Volatile ice body with predictable trajectory. Long-range scan sufficient.' },
    { type: 'Plasma Storm', threat: 'Medium', analysis: 'Charged plasma arcs detected. Navigation corridors may shift rapidly.' }
  ];

  let scanInterval = null;
  let detectionInterval = null;
  let audioCtx = null;
  let scannerTone = null;
  let scannerGain = null;
  let activeObjects = [];

  registerButton('Scanner', () => {
    playBeep();
    speak('Activating forward scanner');
    stopScannerAudio();
    clearTimers();

    const content = document.getElementById('content');
    content.innerHTML = `
      <div class="scanner-full">
        <div class="scanner-stage" id="scanner-stage">
          <div class="scanner-container">
            <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
            <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
            <div class="scanner"><div><div class="select-left"><div class="select-bracket"></div></div><div class="select-right"><div class="select-bracket"></div></div></div></div>
          </div>
          <div class="scanner-contact-overlay hidden" id="scanner-contact-overlay"></div>
        </div>
        <div class="scanner-data">
          <h3>Sensor Readings</h3>
          <div id="scan-progress">Initializing forward sweep...</div>
          <div id="scanner-analysis" class="scanner-analysis">
            <div class="scanner-analysis-label">Active Analysis</div>
            <div id="scanner-analysis-title" class="scanner-analysis-title">No contact lock</div>
            <div id="scanner-analysis-body" class="scanner-analysis-body">Long-range sensors are standing by.</div>
          </div>
          <div id="detected-objects"></div>
        </div>
      </div>`;
    content.classList.remove('hidden');
    startScan();
  });

  function startScan() {
    const stage = document.getElementById('scanner-stage');
    const progress = document.getElementById('scan-progress');
    const analysisTitle = document.getElementById('scanner-analysis-title');
    const analysisBody = document.getElementById('scanner-analysis-body');

    if (!stage || !progress || !analysisTitle || !analysisBody) return;

    stage.classList.remove('locked');
    analysisTitle.textContent = 'Long-range sweep active';
    analysisBody.textContent = 'Scanning adjacent sectors for ships, anomalies, and radiation signatures.';

    startScannerAudio();

    let count = 0;
    const maxScans = 5;

    scanInterval = setInterval(() => {
      count += 1;
      progress.textContent = `Sweeping sector ${count}/${maxScans}...`;
      pulseScannerTone();

      if (count >= maxScans) {
        clearInterval(scanInterval);
        scanInterval = null;
        progress.textContent = 'Contact lock acquired';
        displayObjects();
      }
    }, 1200);
  }

  function displayObjects() {
    const objectsDiv = document.getElementById('detected-objects');
    const stage = document.getElementById('scanner-stage');
    const overlay = document.getElementById('scanner-contact-overlay');
    const progress = document.getElementById('scan-progress');
    const analysisTitle = document.getElementById('scanner-analysis-title');
    const analysisBody = document.getElementById('scanner-analysis-body');

    if (!objectsDiv || !stage || !overlay || !progress || !analysisTitle || !analysisBody) return;

    const count = Math.floor(Math.random() * 4) + 2;
    activeObjects = Array.from({ length: count }, () => {
      const obj = scannerObjects[Math.floor(Math.random() * scannerObjects.length)];
      const distance = (Math.random() * 50000 + 1000).toFixed(0);
      const bearing = Math.floor(Math.random() * 360);
      const signal = `${Math.floor(Math.random() * 40) + 60}%`;
      const x = 14 + Math.random() * 72;
      const y = 18 + Math.random() * 60;
      return { ...obj, distance, bearing, signal, x, y };
    });

    stage.classList.add('locked');
    overlay.classList.remove('hidden');
    overlay.innerHTML = activeObjects.map((obj, index) => `
      <div class="scanner-contact-marker${index === 0 ? ' active' : ''}" data-contact-index="${index}" style="left:${obj.x}%; top:${obj.y}%;">
        <span class="scanner-contact-dot"></span>
        <span class="scanner-contact-label">C${index + 1}</span>
      </div>
    `).join('');

    objectsDiv.innerHTML = activeObjects.map((obj, index) => `
      <button class="detected-object${index === 0 ? ' active' : ''}" data-contact-index="${index}">
        <span class="obj-type">${obj.type}</span>
        <span class="obj-distance">${obj.distance} km</span>
        <span class="obj-bearing">${obj.bearing}&deg;</span>
        <span class="obj-threat ${obj.threat.toLowerCase()}">${obj.threat}</span>
      </button>
    `).join('');

    objectsDiv.querySelectorAll('.detected-object').forEach((button) => {
      button.addEventListener('click', () => setActiveObject(Number(button.dataset.contactIndex), true));
    });

    stopScannerAudio();
    playDetectionChirp();
    speak(`${count} objects detected. Contact lock established.`);
    progress.textContent = `Scan complete. ${count} contacts under analysis.`;

    setActiveObject(0, false);

    detectionInterval = setInterval(() => {
      if (!activeObjects.length) return;
      const nextIndex = (getActiveObjectIndex() + 1) % activeObjects.length;
      setActiveObject(nextIndex, false);
    }, 2600);
  }

  function setActiveObject(index, announce) {
    const target = activeObjects[index];
    if (!target) return;

    const analysisTitle = document.getElementById('scanner-analysis-title');
    const analysisBody = document.getElementById('scanner-analysis-body');
    const progress = document.getElementById('scan-progress');

    document.querySelectorAll('.detected-object').forEach((node, nodeIndex) => {
      node.classList.toggle('active', nodeIndex === index);
    });

    document.querySelectorAll('.scanner-contact-marker').forEach((node, nodeIndex) => {
      node.classList.toggle('active', nodeIndex === index);
    });

    if (analysisTitle) analysisTitle.textContent = `${target.type} | Bearing ${target.bearing}°`;
    if (analysisBody) {
      analysisBody.textContent = `${target.analysis} Range ${target.distance} km. Signal confidence ${target.signal}. Threat assessment ${target.threat}.`;
    }
    if (progress) progress.textContent = `Analyzing contact ${index + 1} of ${activeObjects.length}`;

    if (announce) {
      playBeep();
      speak(`${target.type} selected for detailed analysis`);
    }
  }

  function getActiveObjectIndex() {
    const activeButton = document.querySelector('.detected-object.active');
    return activeButton ? Number(activeButton.dataset.contactIndex) : 0;
  }

  function startScannerAudio() {
    if (!window.AudioContext && !window.webkitAudioContext) return;

    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    stopScannerAudio();

    scannerTone = audioCtx.createOscillator();
    scannerGain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    const settings = window.lcarsSettings || {};

    scannerTone.type = 'triangle';
    scannerTone.frequency.value = 190;
    scannerGain.gain.value = (settings.beepVolume ?? 50) / 100 * 0.025;
    filter.type = 'bandpass';
    filter.frequency.value = 860;
    filter.Q.value = 1.4;

    scannerTone.connect(filter);
    filter.connect(scannerGain);
    scannerGain.connect(audioCtx.destination);
    scannerTone.start();
  }

  function pulseScannerTone() {
    if (!audioCtx || !scannerTone || !scannerGain) return;

    const now = audioCtx.currentTime;
    scannerTone.frequency.cancelScheduledValues(now);
    scannerGain.gain.cancelScheduledValues(now);
    scannerTone.frequency.setValueAtTime(190, now);
    scannerTone.frequency.linearRampToValueAtTime(460, now + 0.12);
    scannerTone.frequency.linearRampToValueAtTime(220, now + 0.32);
    scannerGain.gain.setValueAtTime(scannerGain.gain.value, now);
    scannerGain.gain.linearRampToValueAtTime(scannerGain.gain.value * 1.8, now + 0.06);
    scannerGain.gain.linearRampToValueAtTime(scannerGain.gain.value, now + 0.22);
  }

  function playDetectionChirp() {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const settings = window.lcarsSettings || {};
    const volume = (settings.beepVolume ?? 50) / 100 * 0.14;
    const now = audioCtx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(720, now);
    osc.frequency.exponentialRampToValueAtTime(1280, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  function stopScannerAudio() {
    if (scannerTone) {
      scannerTone.stop();
      scannerTone.disconnect();
      scannerTone = null;
    }
    if (scannerGain) {
      scannerGain.disconnect();
      scannerGain = null;
    }
  }

  function clearTimers() {
    if (scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
    }
    if (detectionInterval) {
      clearInterval(detectionInterval);
      detectionInterval = null;
    }
  }
}
