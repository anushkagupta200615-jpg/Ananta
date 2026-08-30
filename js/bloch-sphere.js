/**
 * Interactive 3D Bloch Sphere Visualizer - Light Theme Edition
 * Optimized for clean white backgrounds with high-contrast axes, labels, and state vector arrow.
 */

class BlochSphereVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.currentVector = new THREE.Vector3(0, 1, 0);
    this.targetVector = new THREE.Vector3(0, 1, 0);

    this.initScene();
    this.buildBlochElements();
    this.setupInteractivity();
    this.animate();
  }

  initScene() {
    const width = this.container.clientWidth || 320;
    const height = this.container.clientHeight || 200;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(2.8, 2.2, 3.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Ambient & Directional Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0x0f62fe, 0.8);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    const softLight = new THREE.DirectionalLight(0x8a3ffc, 0.5);
    softLight.position.set(-5, -5, -5);
    this.scene.add(softLight);
  }

  buildBlochElements() {
    this.blochGroup = new THREE.Group();
    this.scene.add(this.blochGroup);

    const radius = 1.45;

    // Translucent Frosted Sphere (Light Theme)
    const sphereGeo = new THREE.SphereGeometry(radius, 32, 24);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0xeff6ff,
      transparent: true,
      opacity: 0.35,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.5
    });
    this.sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.blochGroup.add(this.sphereMesh);

    // Wireframe Grid Lines
    const wireGeo = new THREE.WireframeGeometry(sphereGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.35
    });
    const wireLine = new THREE.LineSegments(wireGeo, wireMat);
    this.blochGroup.add(wireLine);

    // Equatorial Ring (X-Y plane, IBM Blue)
    const ringGeo = new THREE.RingGeometry(radius - 0.015, radius + 0.015, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x0f62fe,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const eqRing = new THREE.Mesh(ringGeo, ringMat);
    eqRing.rotation.x = Math.PI / 2;
    this.blochGroup.add(eqRing);

    // Meridian Ring (Z plane, Violet)
    const meridianRing = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({
      color: 0x8a3ffc,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4
    }));
    meridianRing.rotation.y = Math.PI / 2;
    this.blochGroup.add(meridianRing);

    // Coordinate Axes with Dark High-Contrast Labels
    this.createAxis(new THREE.Vector3(1, 0, 0), radius * 1.25, 0x0f62fe, '|X⟩');
    this.createAxis(new THREE.Vector3(-1, 0, 0), radius * 1.25, 0x0043ce, '|-⟩');
    this.createAxis(new THREE.Vector3(0, 1, 0), radius * 1.25, 0x0f62fe, '|0⟩');
    this.createAxis(new THREE.Vector3(0, -1, 0), radius * 1.25, 0x0f62fe, '|1⟩');
    this.createAxis(new THREE.Vector3(0, 0, 1), radius * 1.25, 0x8a3ffc, '|+i⟩');
    this.createAxis(new THREE.Vector3(0, 0, -1), radius * 1.25, 0x6929c4, '|-i⟩');

    // Arrow Group
    this.arrowGroup = new THREE.Group();
    this.blochGroup.add(this.arrowGroup);

    // Arrow Shaft (Crimson Red)
    const shaftGeo = new THREE.CylinderGeometry(0.035, 0.035, radius, 16);
    shaftGeo.translate(0, radius / 2, 0);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xda1e28,
      roughness: 0.2
    });
    this.arrowShaft = new THREE.Mesh(shaftGeo, shaftMat);
    this.arrowGroup.add(this.arrowShaft);

    // Arrow Cone Tip (Gold)
    const coneGeo = new THREE.ConeGeometry(0.12, 0.32, 24);
    coneGeo.translate(0, radius, 0);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.1
    });
    this.arrowCone = new THREE.Mesh(coneGeo, coneMat);
    this.arrowGroup.add(this.arrowCone);
  }

  createAxis(dir, length, color, labelText) {
    const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(length)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6, linewidth: 2 });
    this.blochGroup.add(new THREE.Line(geo, mat));

    // Axis label sprite with crisp dark text for white background
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 30px "Outfit", "Inter", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(dir.clone().multiplyScalar(length + 0.25));
    sprite.scale.set(0.65, 0.32, 1);
    this.blochGroup.add(sprite);
  }

  updateCoordinates(blochCoords) {
    const bx = Number(blochCoords.x) || 0;
    const by = Number(blochCoords.y) || 0;
    const bz = Number(blochCoords.z) || 1;

    this.targetVector.set(bx, bz, by);
    const len = this.targetVector.length();
    if (len > 0.0001) {
      this.targetVector.normalize();
    } else {
      this.targetVector.set(0, 1, 0);
    }
  }

  setupInteractivity() {
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const dom = this.renderer.domElement;

    dom.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      this.blochGroup.rotation.y += deltaX * 0.008;
      this.blochGroup.rotation.x += deltaY * 0.008;

      prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    window.addEventListener('resize', () => {
      if (!this.container) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      if (w > 0 && h > 0) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.currentVector.lerp(this.targetVector, 0.12);

    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, this.currentVector.clone().normalize());
    this.arrowGroup.setRotationFromQuaternion(quat);

    this.renderer.render(this.scene, this.camera);
  }
}

window.BlochSphereVisualizer = BlochSphereVisualizer;
