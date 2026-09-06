/**
 * Ananta Interactive 3D Bloch Sphere Visualizer
 * Fully visible 3D rendering with exact physical support for Pure States (|r| = 1.0)
 * and Entangled / Bell States (|r| = 0.00, maximally mixed states at the sphere center).
 * Features high-contrast labeled axes, dynamic camera framing, glowing 3D entanglement nexus,
 * interactive rotation, and auto-rotation.
 */

class BlochSphereVisualizer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.currentVector = new THREE.Vector3(0, 1, 0);
    this.targetVector = new THREE.Vector3(0, 1, 0);
    this.blochRadius = 1.0;
    this.isEntangled = false;
    this.autoRotate = false;
    this.isAnimating = true;
    this.animFrameId = null;

    this.initScene();
    this.buildBlochElements();
    this.setupInteractivity();
    this.animate();
  }

  initScene() {
    const width = this.container.clientWidth || 450;
    const height = this.container.clientHeight || 340;

    this.scene = new THREE.Scene();
    // 40-degree FOV gives comfortable perspective without wide-angle edge distortion
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    // Camera positioned with generous distance so radius 1.3 + labels at 1.85 are 100% visible
    this.camera.position.set(3.4, 2.4, 4.4);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // Dynamic Multi-Source Illumination
    const ambient = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambient);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(6, 12, 8);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xd946ef, 0.8);
    dirLight2.position.set(-6, -8, -6);
    this.scene.add(dirLight2);
  }

  buildBlochElements() {
    this.blochGroup = new THREE.Group();
    this.scene.add(this.blochGroup);

    const radius = 1.30;
    this.radius = radius;

    // 1. Translucent Frosted Glass Sphere
    const sphereGeo = new THREE.SphereGeometry(radius, 36, 28);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.18,
      roughness: 0.1,
      metalness: 0.1,
      clearcoat: 0.6,
      depthWrite: false
    });
    this.sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.blochGroup.add(this.sphereMesh);

    // 2. Geometric Wireframe Grid (Latitude & Longitude)
    const wireGeo = new THREE.WireframeGeometry(sphereGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    const wireLine = new THREE.LineSegments(wireGeo, wireMat);
    this.blochGroup.add(wireLine);

    // 3. Equatorial Ring (X-Y Plane)
    const eqRingGeo = new THREE.RingGeometry(radius - 0.015, radius + 0.015, 64);
    const eqRingMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55
    });
    const eqRing = new THREE.Mesh(eqRingGeo, eqRingMat);
    eqRing.rotation.x = Math.PI / 2;
    this.blochGroup.add(eqRing);

    // 4. Meridian Ring (Z Plane)
    const meridianRing = new THREE.Mesh(eqRingGeo, new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    }));
    meridianRing.rotation.y = Math.PI / 2;
    this.blochGroup.add(meridianRing);

    // 5. High-Contrast Coordinate Axes & Labels
    const axisLen = radius * 1.25; // 1.62
    const labelDist = radius * 1.42; // 1.85
    this.createAxis(new THREE.Vector3(1, 0, 0), axisLen, labelDist, 0x38bdf8, '|X⟩ (|+⟩)');
    this.createAxis(new THREE.Vector3(-1, 0, 0), axisLen, labelDist, 0x0284c7, '|-⟩');
    this.createAxis(new THREE.Vector3(0, 1, 0), axisLen, labelDist, 0x10b981, '|0⟩');
    this.createAxis(new THREE.Vector3(0, -1, 0), axisLen, labelDist, 0x059669, '|1⟩');
    this.createAxis(new THREE.Vector3(0, 0, 1), axisLen, labelDist, 0xec4899, '|+i⟩');
    this.createAxis(new THREE.Vector3(0, 0, -1), axisLen, labelDist, 0xbe185d, '|-i⟩');

    // 6. Arrow Group (State Vector |ψ⟩)
    this.arrowGroup = new THREE.Group();
    this.blochGroup.add(this.arrowGroup);

    // Arrow Shaft (Luminous Crimson Red)
    const shaftGeo = new THREE.CylinderGeometry(0.04, 0.04, radius, 20);
    shaftGeo.translate(0, radius / 2, 0);
    const shaftMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xb91c1c,
      emissiveIntensity: 0.4,
      roughness: 0.15
    });
    this.arrowShaft = new THREE.Mesh(shaftGeo, shaftMat);
    this.arrowGroup.add(this.arrowShaft);

    // Arrow Cone Tip (Gold)
    const coneGeo = new THREE.ConeGeometry(0.13, 0.32, 24);
    coneGeo.translate(0, radius, 0);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      roughness: 0.1
    });
    this.arrowCone = new THREE.Mesh(coneGeo, coneMat);
    this.arrowGroup.add(this.arrowCone);

    // Glowing Quantum Tip Halo
    const haloGeo = new THREE.SphereGeometry(0.18, 16, 16);
    haloGeo.translate(0, radius, 0);
    this.haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
      wireframe: true
    });
    this.arrowHalo = new THREE.Mesh(haloGeo, this.haloMat);
    this.arrowGroup.add(this.arrowHalo);

    // 7. Trajectory Trail Arc
    this.maxTrailPoints = 64;
    this.trailPositions = new Float32Array(this.maxTrailPoints * 3);
    this.trailGeometry = new THREE.BufferGeometry();
    this.trailGeometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3));
    this.trailMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.75,
      linewidth: 2
    });
    this.trailLine = new THREE.Line(this.trailGeometry, this.trailMat);
    this.blochGroup.add(this.trailLine);

    // 8. 3D ENTANGLEMENT NEXUS CORE (Active for Bell State & Mixed States at Origin r = 0)
    this.nexusGroup = new THREE.Group();
    this.blochGroup.add(this.nexusGroup);
    this.nexusGroup.visible = false;

    // Glowing Central Entangled Singularity
    const nexusCoreGeo = new THREE.IcosahedronGeometry(0.24, 2);
    const nexusCoreMat = new THREE.MeshPhysicalMaterial({
      color: 0xec4899,
      emissive: 0xd946ef,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.2,
      transparent: true,
      opacity: 0.9
    });
    this.nexusCore = new THREE.Mesh(nexusCoreGeo, nexusCoreMat);
    this.nexusGroup.add(this.nexusCore);

    // Entangled Bipartite Orbiting Ring 1
    const ring1Geo = new THREE.TorusGeometry(0.36, 0.015, 16, 48);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.85 });
    this.nexusRing1 = new THREE.Mesh(ring1Geo, ring1Mat);
    this.nexusGroup.add(this.nexusRing1);

    // Entangled Bipartite Orbiting Ring 2
    const ring2Geo = new THREE.TorusGeometry(0.42, 0.015, 16, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.85 });
    this.nexusRing2 = new THREE.Mesh(ring2Geo, ring2Mat);
    this.nexusRing2.rotation.x = Math.PI / 3;
    this.nexusGroup.add(this.nexusRing2);
  }

  createAxis(dir, length, labelDistance, color, labelText) {
    const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(length)];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.65, linewidth: 2 });
    this.blochGroup.add(new THREE.Line(geo, mat));

    // High-Resolution Sprite Label
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.font = 'bold 36px "Outfit", "Inter", sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(dir.clone().multiplyScalar(labelDistance));
    sprite.scale.set(0.78, 0.39, 1);
    this.blochGroup.add(sprite);
  }

  updateCoordinates(blochCoords) {
    const bx = Number.isFinite(Number(blochCoords.x)) ? Number(blochCoords.x) : 0;
    const by = Number.isFinite(Number(blochCoords.y)) ? Number(blochCoords.y) : 0;
    const bz = Number.isFinite(Number(blochCoords.z)) ? Number(blochCoords.z) : 1;

    // Vector length in Bloch ball r = sqrt(x^2 + y^2 + z^2)
    const r = Math.sqrt(bx * bx + by * by + bz * bz);
    this.blochRadius = r;
    this.isEntangled = (r < 0.12);

    if (r > 0.001) {
      this.targetVector.set(bx, bz, by);
    } else {
      // Maximally entangled state (e.g. Bell State) -> at center origin (0, 0, 0)
      this.targetVector.set(0, 0.0001, 0);
    }

    this.updateEntanglementDisplay(r, blochCoords);
  }

  updateEntanglementDisplay(r, blochCoords) {
    const banner = document.getElementById('bloch-entanglement-hud');
    if (!banner) return;

    if (this.isEntangled) {
      banner.style.display = 'flex';
      banner.innerHTML = `
        <div class="bloch-entangle-badge">
          <span>⚡ Bell State Entangled Subsystem</span>
        </div>
        <div class="bloch-entangle-sub">
          Vector: |r| = 0.00 (Origin Center) | Maximally Mixed Subsystem (Purity Tr(ρ²)=0.50, Entropy S=1.0 bit)
        </div>
      `;
    } else if (r < 0.92) {
      banner.style.display = 'flex';
      banner.innerHTML = `
        <div class="bloch-entangle-badge" style="color: #fbbf24;">
          <span>⚠️ Partially Decohered State</span>
        </div>
        <div class="bloch-entangle-sub">
          Vector: |r| = ${r.toFixed(2)} (Inside Sphere Volume) | Mixed State (Tr(ρ²) = ${(0.5 * (1 + r * r)).toFixed(2)})
        </div>
      `;
    } else {
      banner.style.display = 'none';
    }
  }

  addTrailPoint(pt) {
    if (!this.trailPositions || !this.trailGeometry || !this.trailGeometry.attributes || !this.trailGeometry.attributes.position) return;
    const pos = this.trailPositions;
    for (let i = (this.maxTrailPoints - 1) * 3; i >= 3; i--) {
      pos[i] = pos[i - 3];
    }
    pos[0] = pt.x;
    pos[1] = pt.y;
    pos[2] = pt.z;
    this.trailGeometry.attributes.position.needsUpdate = true;
  }

  resetOrientation() {
    this.blochGroup.rotation.set(0, 0, 0);
    this.camera.position.set(3.4, 2.4, 4.4);
    this.camera.lookAt(0, 0, 0);
    this.autoRotate = false;
    const btnAuto = document.getElementById('btn-bloch-autorotate');
    if (btnAuto) {
      btnAuto.classList.remove('active');
      btnAuto.textContent = '⟳ Auto-Rotate';
    }
    const btnReset = document.getElementById('btn-bloch-reset-cam');
    if (btnReset) {
      btnReset.classList.add('pulse-active');
      setTimeout(() => btnReset.classList.remove('pulse-active'), 400);
    }
  }

  toggleAutoRotation() {
    this.autoRotate = !this.autoRotate;
    const btnAuto = document.getElementById('btn-bloch-autorotate');
    if (btnAuto) {
      btnAuto.classList.toggle('active', this.autoRotate);
      btnAuto.textContent = this.autoRotate ? '⏸ Pause Spin' : '⟳ Auto-Rotate';
    }
    return this.autoRotate;
  }

  resize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w > 0 && h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
  }

  setupInteractivity() {
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const dom = this.renderer.domElement;

    // Direct binding for control buttons
    const btnReset = document.getElementById('btn-bloch-reset-cam');
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.preventDefault();
        this.resetOrientation();
      });
    }

    const btnAuto = document.getElementById('btn-bloch-autorotate');
    if (btnAuto) {
      btnAuto.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAutoRotation();
      });
    }

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

    // Touch support for mobile/tablets
    dom.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMousePos.x;
      const deltaY = e.touches[0].clientY - prevMousePos.y;

      this.blochGroup.rotation.y += deltaX * 0.008;
      this.blochGroup.rotation.x += deltaY * 0.008;

      prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    window.addEventListener('touchend', () => { isDragging = false; });

    window.addEventListener('resize', () => this.resize());
  }

  start() {
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }

  stop() {
    this.isAnimating = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  animate() {
    if (!this.isAnimating) return;
    this.animFrameId = requestAnimationFrame(() => this.animate());

    if (!this.container || this.container.offsetParent === null) {
      return;
    }

    const time = performance.now() * 0.002;

    // Optional gentle auto-rotation
    if (this.autoRotate) {
      this.blochGroup.rotation.y += 0.005;
    }

    // Vector lerping towards target
    this.currentVector.lerp(this.targetVector, 0.12);

    // Scale arrow length matching Bloch vector radius r:
    // For Bell state (r=0), arrow shrinks into center origin smoothly
    const scale = Math.max(0.02, Math.min(1.0, this.blochRadius));
    this.arrowGroup.scale.set(scale, scale, scale);

    if (this.blochRadius > 0.08) {
      this.arrowShaft.visible = true;
      this.arrowCone.visible = true;
      this.arrowHalo.visible = true;
      this.nexusGroup.visible = false;
      this.addTrailPoint(this.currentVector.clone().multiplyScalar(this.radius));
    } else {
      // Bell State maximally entangled at center origin
      this.arrowShaft.visible = false;
      this.arrowCone.visible = false;
      this.arrowHalo.visible = false;
      this.nexusGroup.visible = true;

      // Animate living quantum entanglement nexus
      const pulse = 1.0 + Math.sin(time * 2.5) * 0.15;
      this.nexusCore.scale.set(pulse, pulse, pulse);
      this.nexusRing1.rotation.z += 0.035;
      this.nexusRing1.rotation.y += 0.02;
      this.nexusRing2.rotation.x -= 0.03;
      this.nexusRing2.rotation.z += 0.025;
    }

    // Tip Halo Pulse for Pure States
    if (this.arrowHalo && this.arrowHalo.visible) {
      const pulse = 1.0 + Math.sin(time * 3.0) * 0.2;
      this.arrowHalo.scale.set(pulse, pulse, pulse);
    }

    // Orient arrow along current vector
    const up = new THREE.Vector3(0, 1, 0);
    const dir = this.currentVector.clone().normalize();
    if (dir.lengthSq() > 0.001) {
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      this.arrowGroup.setRotationFromQuaternion(quat);
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.BlochSphereVisualizer = BlochSphereVisualizer;
