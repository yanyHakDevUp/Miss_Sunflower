/* ==========================================================================
   MISS SUNFLOWER — DYNAMIC RESPONSIVE 3D BOTANICAL ENGINE (THREE.JS)
   Dynamic camera FOV scaling for narrow mobile phone screens to eliminate
   3D cropping, full 100% viewport canvas rendering, and touch controls.
   ========================================================================== */

import * as THREE from 'three';

export class SunflowerEngine {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Growth State
    this.state = {
      sproutGrowth: 0,
      stemGrowth: 0,
      bloomProgress: 0,
      sunIntensity: 0.4,
      pollenAlpha: 0,
      cameraDistance: 1.25,
      cameraOffsetY: 0.15,
      cameraRotationY: 0,
      windSpeed: 1.0,
      isGardenMode: false,
      timeOfDay: 'sunrise'
    };

    this.clock = new THREE.Clock();
    this.petals = [];
    this.leaves = [];

    // Orbit controls state
    this.isDragging = false;
    this.prevMouseX = 0;
    this.prevMouseY = 0;
    this.orbitRotX = 0.1;
    this.orbitRotY = 0;
    this.orbitZoom = 1.25;
    this.initialPinchDist = 0;

    this.init();
  }

  init() {
    // 1. Scene Setup
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0e0b07, 0.03);

    // 2. WebGL Renderer (100% viewport pixel ratio)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. Dynamic Camera Setup with Mobile Aspect Ratio FOV Correction!
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.05, 100);
    this.updateCameraFov();

    // 4. Load Textures
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {
      soil: this.textureLoader.load('/assets/soil.png'),
      seed: this.textureLoader.load('/assets/seed.png'),
      center: this.textureLoader.load('/assets/center.png'),
      field: this.textureLoader.load('/assets/field.png'),
      ref: this.textureLoader.load('/assets/sunflower_ref.png'),
      ceo: this.textureLoader.load('/assets/ceo.png'),
      herfamily: this.textureLoader.load('/assets/herfamily.jpg')
    };

    Object.values(this.textures).forEach(tex => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    });

    this.textures.proceduralPetal = this.generatePetalTexture();

    // 5. Build 3D Objects
    this.setupLighting();
    this.buildSoilGround();
    this.buildSeedAndSprout();
    this.buildPhotorealisticSunflower();
    this.buildPollenParticleSystem();
    this.buildBackgroundGardenField();

    // 6. Mouse & Touch Orbit Listeners
    this.initOrbitControls();

    // Window Resize & Orientation Change Listeners
    window.addEventListener('resize', this.onWindowResize.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(this.onWindowResize.bind(this), 200);
    });

    // Start Animation Loop
    this.animate();
  }

  /* ---------------------------------------------------------------------
     DYNAMIC FOV CALCULATION FOR NARROW MOBILE SCREENS
     Prevents 3D cropping on iPhones/Androids (aspect ratio < 1.0)
     --------------------------------------------------------------------- */
  updateCameraFov() {
    const aspect = this.width / this.height;
    this.camera.aspect = aspect;

    if (aspect < 1.0) {
      // Narrow mobile screen: scale FOV dynamically so 3D flower and sun are 100% visible
      this.camera.fov = Math.min(65, 40 / Math.pow(aspect, 0.85));
    } else {
      this.camera.fov = 40;
    }
    this.camera.updateProjectionMatrix();
  }

  generatePetalTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 512, 1024);

    ctx.beginPath();
    ctx.moveTo(256, 1000);
    ctx.bezierCurveTo(420, 850, 480, 450, 420, 180);
    ctx.quadraticCurveTo(256, 10, 92, 180);
    ctx.bezierCurveTo(32, 450, 92, 850, 256, 1000);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 1000, 0, 0);
    grad.addColorStop(0.0, '#C86000');
    grad.addColorStop(0.2, '#FFA000');
    grad.addColorStop(0.6, '#FFD700');
    grad.addColorStop(0.9, '#FFE645');
    grad.addColorStop(1.0, '#FFD800');

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(217, 100, 0, 0.22)';
    ctx.lineWidth = 3;

    const veinOffsets = [-120, -70, -30, 0, 30, 70, 120];
    veinOffsets.forEach(off => {
      ctx.beginPath();
      ctx.moveTo(256 + off * 0.3, 980);
      ctx.quadraticCurveTo(256 + off * 1.2, 500, 256 + off * 0.7, 120);
      ctx.stroke();
    });

    const sheenGrad = ctx.createRadialGradient(256, 400, 20, 256, 400, 220);
    sheenGrad.addColorStop(0, 'rgba(255, 255, 230, 0.3)');
    sheenGrad.addColorStop(1, 'rgba(255, 255, 230, 0)');
    ctx.fillStyle = sheenGrad;
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0xffe6b3, 0x3d2b14, 1.0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff0c2, 0.8);
    this.sunLight.position.set(2, 6, -4);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.bias = -0.0001;
    this.scene.add(this.sunLight);

    this.rimLight = new THREE.DirectionalLight(0xff9e00, 0.9);
    this.rimLight.position.set(-3, 2, 2);
    this.scene.add(this.rimLight);

    const sunGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      color: 0xffcc33,
      transparent: true,
      opacity: 0.85
    });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(0, 1.8, -25);
    this.scene.add(this.sunMesh);
  }

  buildSoilGround() {
    const groundGeo = new THREE.PlaneGeometry(30, 30, 64, 64);
    const pos = groundGeo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const dist = Math.sqrt(x*x + y*y);
      const mound = Math.exp(-dist * 1.5) * 0.08;
      const noise = (Math.sin(x * 8) * Math.cos(y * 8)) * 0.02;
      pos.setZ(i, mound + noise);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
      map: this.textures.soil,
      roughness: 0.85,
      metalness: 0.1,
      color: 0x3d3226
    });

    this.groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.groundMesh.rotation.x = -Math.PI / 2;
    this.groundMesh.position.y = 0;
    this.groundMesh.receiveShadow = true;
    this.scene.add(this.groundMesh);
  }

  buildSeedAndSprout() {
    this.seedGroup = new THREE.Group();

    const seedGeo = new THREE.ConeGeometry(0.06, 0.16, 16);
    seedGeo.scale(1, 1, 0.5);
    seedGeo.rotateZ(Math.PI / 3);

    const seedMat = new THREE.MeshStandardMaterial({
      map: this.textures.seed,
      roughness: 0.6,
      color: 0x221f1b
    });

    this.seedMesh = new THREE.Mesh(seedGeo, seedMat);
    this.seedMesh.position.set(0.02, 0.03, 0);
    this.seedMesh.rotation.set(0.3, 0.2, 0.6);
    this.seedMesh.castShadow = true;
    this.seedGroup.add(this.seedMesh);

    this.stemPoints = [
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0.01, 0.2, 0.01),
      new THREE.Vector3(-0.02, 0.45, -0.01),
      new THREE.Vector3(0.01, 0.75, 0),
      new THREE.Vector3(0, 1.0, 0)
    ];
    this.stemCurve = new THREE.CatmullRomCurve3(this.stemPoints);

    this.stemMat = new THREE.MeshStandardMaterial({
      color: 0x4a7c36,
      roughness: 0.5,
      metalness: 0.1
    });

    this.stemMeshGroup = new THREE.Group();
    this.buildLeaves();

    this.seedGroup.add(this.stemMeshGroup);
    this.scene.add(this.seedGroup);
  }

  buildLeaves() {
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.12, 0.08, 0.18, 0);
    leafShape.quadraticCurveTo(0.12, -0.08, 0, 0);

    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x3d702b,
      side: THREE.DoubleSide,
      roughness: 0.4
    });

    const leafHeights = [0.25, 0.45, 0.68, 0.85];
    const leafAngles = [0, Math.PI * 0.65, Math.PI * 1.3, Math.PI * 1.9];

    leafHeights.forEach((h, idx) => {
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      leafMesh.position.set(0, h, 0);
      leafMesh.rotation.y = leafAngles[idx];
      leafMesh.rotation.z = Math.PI * 0.15;
      leafMesh.scale.set(0, 0, 0);
      leafMesh.castShadow = true;

      this.leaves.push({
        mesh: leafMesh,
        height: h,
        angle: leafAngles[idx]
      });
      this.stemMeshGroup.add(leafMesh);
    });
  }

  buildPhotorealisticSunflower() {
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 1.0, 0);

    this.headGroup.rotation.x = Math.PI * 0.14;

    const diskRadius = 0.32;
    const diskGeo = new THREE.CylinderGeometry(diskRadius, diskRadius * 0.95, 0.05, 48);

    const diskMat = new THREE.MeshStandardMaterial({
      map: this.textures.center,
      roughness: 0.7,
      metalness: 0.05,
      color: 0x5a3e1b
    });

    this.diskMesh = new THREE.Mesh(diskGeo, diskMat);
    this.diskMesh.rotation.x = Math.PI / 2;
    this.diskMesh.castShadow = true;
    this.headGroup.add(this.diskMesh);

    const receptGeo = new THREE.CylinderGeometry(diskRadius * 0.95, 0.1, 0.15, 32);
    receptGeo.translate(0, -0.075, 0);
    receptGeo.rotateX(Math.PI / 2);
    
    const receptMat = new THREE.MeshStandardMaterial({
      color: 0x3d6e2a,
      roughness: 0.6
    });
    this.receptacleMesh = new THREE.Mesh(receptGeo, receptMat);
    this.receptacleMesh.position.z = -0.05;
    this.headGroup.add(this.receptacleMesh);

    const petalWidth = 0.18;
    const petalLength = 0.55;

    const petalGeo = new THREE.PlaneGeometry(petalWidth, petalLength, 12, 12);
    petalGeo.translate(0, petalLength * 0.5, 0);

    const pPos = petalGeo.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      const y = pPos.getY(i);
      const x = pPos.getX(i);
      const normY = y / petalLength;
      
      const cupZ = -Math.pow(x / (petalWidth * 0.5), 2) * 0.02;
      const bendZ = Math.sin(normY * Math.PI) * 0.035 - Math.pow(normY, 2) * 0.04;
      
      pPos.setZ(i, cupZ + bendZ);
    }
    petalGeo.computeVertexNormals();

    const petalMat = new THREE.MeshStandardMaterial({
      map: this.textures.proceduralPetal,
      alphaTest: 0.08,
      transparent: true,
      roughness: 0.25,
      metalness: 0.02,
      side: THREE.DoubleSide,
      shadowSide: THREE.DoubleSide
    });

    const ringConfigs = [
      { count: 24, radius: diskRadius * 0.96, isOuter: true, zOffset: 0.01 },
      { count: 20, radius: diskRadius * 0.84, isOuter: false, zOffset: -0.01 }
    ];

    let petalIdx = 0;
    ringConfigs.forEach(ring => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (i / ring.count) * Math.PI * 2 + (ring.isOuter ? 0 : Math.PI / ring.count);
        
        const petalMesh = new THREE.Mesh(petalGeo, petalMat);
        petalMesh.position.x = Math.cos(angle) * ring.radius;
        petalMesh.position.y = Math.sin(angle) * ring.radius;
        petalMesh.position.z = ring.zOffset;

        petalMesh.rotation.z = angle - Math.PI / 2;
        petalMesh.rotation.x = Math.PI * 0.38;

        const s = 0.92 + Math.random() * 0.16;
        petalMesh.scale.set(s, s, s);
        petalMesh.castShadow = true;

        this.petals.push({
          mesh: petalMesh,
          angle: angle,
          index: petalIdx++,
          isOuter: ring.isOuter,
          closedRotX: Math.PI * 0.38,
          openRotX: ring.isOuter ? Math.PI * 0.12 : Math.PI * 0.18,
          rotSpeed: 0.8 + Math.random() * 0.4
        });

        this.headGroup.add(petalMesh);
      }
    });

    this.headGroup.scale.set(0.01, 0.01, 0.01);
    this.scene.add(this.headGroup);
  }

  buildPollenParticleSystem() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 7;
      positions[i * 3 + 1] = Math.random() * 4.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 7;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particleCanvas = document.createElement('canvas');
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const ctx = particleCanvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255, 230, 130, 1)');
    grad.addColorStop(0.4, 'rgba(255, 195, 65, 0.6)');
    grad.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const pTex = new THREE.CanvasTexture(particleCanvas);

    const material = new THREE.PointsMaterial({
      size: 0.09,
      map: pTex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.pollenParticles = new THREE.Points(geometry, material);
    this.scene.add(this.pollenParticles);
  }

  buildBackgroundGardenField() {
    const bgGeo = new THREE.CylinderGeometry(24, 24, 15, 32, 1, true, -Math.PI*0.4, Math.PI*0.8);
    const bgMat = new THREE.MeshBasicMaterial({
      map: this.textures.field,
      side: THREE.DoubleSide,
      fog: true
    });
    this.bgFieldMesh = new THREE.Mesh(bgGeo, bgMat);
    this.bgFieldMesh.position.set(0, 4, -6);
    this.scene.add(this.bgFieldMesh);
  }

  initOrbitControls() {
    const onStart = (clientX, clientY) => {
      if (!this.state.isGardenMode) return;
      this.isDragging = true;
      this.prevMouseX = clientX;
      this.prevMouseY = clientY;
    };

    const onMove = (clientX, clientY) => {
      if (!this.state.isGardenMode || !this.isDragging) return;
      const deltaX = clientX - this.prevMouseX;
      const deltaY = clientY - this.prevMouseY;

      this.orbitRotY += deltaX * 0.006;
      this.orbitRotX = Math.max(-0.4, Math.min(0.6, this.orbitRotX + deltaY * 0.006));

      this.prevMouseX = clientX;
      this.prevMouseY = clientY;
    };

    const onEnd = () => { this.isDragging = false; };

    this.canvas.addEventListener('mousedown', (e) => onStart(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);
    this.canvas.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    this.canvas.addEventListener('wheel', (e) => {
      if (!this.state.isGardenMode) return;
      this.orbitZoom = Math.max(0.6, Math.min(3.0, this.orbitZoom + e.deltaY * 0.001));
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2 && this.initialPinchDist > 0) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = (this.initialPinchDist - dist) * 0.005;
        this.orbitZoom = Math.max(0.6, Math.min(3.0, this.orbitZoom + delta));
        this.initialPinchDist = dist;
      }
    }, { passive: true });

    window.addEventListener('touchend', onEnd);
  }

  updateGrowthState() {
    const t = this.clock.getElapsedTime();

    if (this.state.stemGrowth > 0) {
      const growthPointsCount = Math.max(2, Math.floor(this.state.stemGrowth * 30));
      const subPoints = this.stemCurve.getPoints(growthPointsCount);
      const tempCurve = new THREE.CatmullRomCurve3(subPoints);
      
      if (this.stemMesh) this.stemMeshGroup.remove(this.stemMesh);
      
      const stemRadius = 0.024 * Math.min(1, this.state.stemGrowth * 1.5);
      const tubeGeo = new THREE.TubeGeometry(tempCurve, growthPointsCount, stemRadius, 12, false);
      this.stemMesh = new THREE.Mesh(tubeGeo, this.stemMat);
      this.stemMesh.castShadow = true;
      this.stemMeshGroup.add(this.stemMesh);

      this.leaves.forEach(leaf => {
        if (this.state.stemGrowth > leaf.height) {
          const leafProgress = Math.min(1, (this.state.stemGrowth - leaf.height) * 3);
          leaf.mesh.scale.set(leafProgress * 0.85, leafProgress * 0.85, leafProgress * 0.85);
          leaf.mesh.rotation.z = Math.PI * 0.15 + Math.sin(t * 2 + leaf.height * 10) * 0.05 * this.state.windSpeed;
        }
      });
    }

    if (this.state.stemGrowth > 0.7) {
      const headScale = Math.min(1, (this.state.stemGrowth - 0.7) * 3.33);
      this.headGroup.scale.set(headScale, headScale, headScale);
    }

    if (this.state.bloomProgress > 0) {
      this.petals.forEach(p => {
        const petalDelay = (p.index / 44) * 0.45;
        const localBloom = Math.max(0, Math.min(1, (this.state.bloomProgress - petalDelay) / (1 - petalDelay)));
        
        const curRotX = p.closedRotX - localBloom * (p.closedRotX - p.openRotX);
        const petalWind = Math.sin(t * 3 * p.rotSpeed + p.index) * 0.035 * localBloom * this.state.windSpeed;
        
        p.mesh.rotation.x = curRotX + petalWind;
      });

      this.headGroup.rotation.z = Math.sin(t * 1.5) * 0.03 * this.state.windSpeed;
      this.headGroup.rotation.y = Math.cos(t * 1.2) * 0.02 * this.state.windSpeed;
    }

    this.sunLight.intensity = this.state.sunIntensity;
    this.pollenParticles.material.opacity = this.state.pollenAlpha;

    if (this.state.pollenAlpha > 0) {
      const pos = this.pollenParticles.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + 0.003;
        let x = pos.getX(i) + Math.sin(t + i) * 0.001;
        if (y > 5) y = 0;
        pos.setY(i, y);
        pos.setX(i, x);
      }
      this.pollenParticles.geometry.attributes.position.needsUpdate = true;
    }

    const aspect = this.width / this.height;
    const distanceMult = aspect < 1.0 ? 1.35 : 1.0;

    if (this.state.isGardenMode) {
      const camX = Math.sin(this.orbitRotY) * Math.cos(this.orbitRotX) * (this.orbitZoom * distanceMult);
      const camY = 1.0 + Math.sin(this.orbitRotX) * (this.orbitZoom * distanceMult);
      const camZ = Math.cos(this.orbitRotY) * Math.cos(this.orbitRotX) * (this.orbitZoom * distanceMult);
      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(0, 0.9, 0);
    } else {
      const camNoiseX = Math.sin(t * 0.8) * 0.02;
      const camNoiseY = Math.cos(t * 0.6) * 0.02;
      const effectiveDist = this.state.cameraDistance * distanceMult;
      const camX = Math.sin(this.state.cameraRotationY) * effectiveDist + camNoiseX;
      const camZ = Math.cos(this.state.cameraRotationY) * effectiveDist;
      const camY = this.state.cameraOffsetY + camNoiseY;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(0, this.state.cameraOffsetY * 0.8, 0);
    }
  }

  setTimeOfDayPreset(preset) {
    this.state.timeOfDay = preset;
    if (preset === 'sunrise') {
      this.hemiLight.color.setHex(0xffe6b3);
      this.hemiLight.groundColor.setHex(0x3d2b14);
      this.sunLight.color.setHex(0xfff0c2);
      this.sunLight.intensity = 2.0;
      this.scene.fog.color.setHex(0x0e0b07);
    } else if (preset === 'noon') {
      this.hemiLight.color.setHex(0xffffff);
      this.hemiLight.groundColor.setHex(0x555555);
      this.sunLight.color.setHex(0xffffff);
      this.sunLight.intensity = 2.8;
      this.scene.fog.color.setHex(0x87ceeb);
    } else if (preset === 'golden') {
      this.hemiLight.color.setHex(0xffaa33);
      this.hemiLight.groundColor.setHex(0x2b1500);
      this.sunLight.color.setHex(0xff8c00);
      this.sunLight.intensity = 2.4;
      this.scene.fog.color.setHex(0x2b1500);
    } else if (preset === 'night') {
      this.hemiLight.color.setHex(0x6688aa);
      this.hemiLight.groundColor.setHex(0x050a15);
      this.sunLight.color.setHex(0x88aacc);
      this.sunLight.intensity = 0.8;
      this.scene.fog.color.setHex(0x040609);
    }
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.renderer.setSize(this.width, this.height, false);
    this.updateCameraFov();
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.updateGrowthState();
    this.renderer.render(this.scene, this.camera);
  }
}
