export function init({ registerButton, playBeep, speak }) {
  let loaded = false;
  let renderer, scene, camera, mesh;

  registerButton('Planet 3D', () => {
    playBeep();
    speak('Rendering planet view');
    const content = document.getElementById('content');
    content.innerHTML = '<div id="planet-container" style="width:100%;height:600px"></div>';
    content.classList.remove('hidden');
    if (!loaded) {
      loadThree().then(setup);
    }
  });

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/three@0.173.0/build/three.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function setup() {
    const container = document.getElementById('planet-container');
    if (!container) return;
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 2;
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(1, 64, 32);
    const loader = new THREE.TextureLoader();
    loader.load('https://raw.githubusercontent.com/louh/lcars/main/public/planets/2k_earth.jpg', (texture) => {
      const material = new THREE.MeshLambertMaterial({ map: texture });
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      const light = new THREE.PointLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
      loaded = true;
      animate();
    });
    window.addEventListener('resize', onResize);
  }

  function animate() {
    if (!loaded) return;
    requestAnimationFrame(animate);
    if (mesh) {
      mesh.rotation.y += 0.002;
    }
    renderer.render(scene, camera);
  }

  function onResize() {
    const container = document.getElementById('planet-container');
    if (!container || !renderer) return;
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
  }
}
