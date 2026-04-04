export function init({ registerButton, playBeep, speak }) {
  let renderer = null;
  let scene = null;
  let camera = null;
  let mesh = null;
  let animationFrameId = null;
  let threePromise = null;
  let resizeAttached = false;

  registerButton('Planet 3D', async () => {
    playBeep();
    speak('Rendering planet view');

    const content = document.getElementById('content');
    content.innerHTML = '<div id="planet-container" style="width:100%;height:600px"></div>';
    content.classList.remove('hidden');

    try {
      await loadThree();
      setupOrMount();
    } catch (error) {
      content.innerHTML = `
        <div class="error">
          PLANET VIEW UNAVAILABLE: ${escapeHtml(error?.message || 'Unknown rendering error')}
        </div>`;
    }
  });

  function loadThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (threePromise) return threePromise;

    threePromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-lcars-three]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.THREE), { once: true });
        existing.addEventListener('error', () => reject(new Error('Three.js failed to load.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/three@0.173.0/build/three.min.js';
      script.dataset.lcarsThree = 'true';
      script.onload = () => resolve(window.THREE);
      script.onerror = () => reject(new Error('Unable to load Three.js from the CDN.'));
      document.head.appendChild(script);
    });

    return threePromise;
  }

  function setupOrMount() {
    const container = document.getElementById('planet-container');
    if (!container) return;

    if (!scene || !camera || !renderer) {
      initializeScene(container);
    } else if (renderer.domElement.parentElement !== container) {
      container.appendChild(renderer.domElement);
      onResize();
    }

    if (!resizeAttached) {
      window.addEventListener('resize', onResize);
      resizeAttached = true;
    }

    startAnimation();
  }

  function initializeScene(container) {
    const { THREE } = window;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 0.1, 2.6);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 96, 64);
    const material = new THREE.MeshPhongMaterial({
      map: createPlanetTexture(THREE),
      shininess: 18,
      specular: new THREE.Color(0x35536b)
    });

    mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.z = 0.4;
    scene.add(mesh);

    const ambient = new THREE.AmbientLight(0x506070, 1.2);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(3, 2, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x6aa7ff, 0.7);
    rimLight.position.set(-4, -1, -2);
    scene.add(rimLight);

    onResize();
  }

  function createPlanetTexture(THREE) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1b3a68');
    gradient.addColorStop(0.45, '#224f86');
    gradient.addColorStop(1, '#0a1d38');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 22; i += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const w = 90 + Math.random() * 180;
      const h = 40 + Math.random() * 120;
      const hue = 85 + Math.random() * 35;
      ctx.fillStyle = `hsla(${hue}, 38%, ${35 + Math.random() * 20}%, 0.9)`;
      drawBlob(ctx, x, y, w, h);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 3;
    for (let i = 1; i <= 6; i += 1) {
      const y = (canvas.height / 7) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(canvas.width * 0.25, y - 12, canvas.width * 0.75, y + 12, canvas.width, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }

  function drawBlob(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.5, height * 0.5, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  function startAnimation() {
    if (animationFrameId) return;

    const renderFrame = () => {
      animationFrameId = requestAnimationFrame(renderFrame);

      const container = document.getElementById('planet-container');
      if (!container || !renderer || !scene || !camera || !mesh) return;

      mesh.rotation.y += 0.003;
      renderer.render(scene, camera);
    };

    renderFrame();
  }

  function onResize() {
    const container = document.getElementById('planet-container');
    if (!container || !renderer || !camera) return;

    const width = Math.max(container.clientWidth, 320);
    const height = Math.max(container.clientHeight, 320);

    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }
}
