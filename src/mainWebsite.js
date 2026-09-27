/* ==========================================================================
   MAIN FAN TRIBUTE WEBSITE INTERACTION ENGINE
   Handles Product Modal Popups, 3D Explorer secondary viewport, Fan Tribute Wall,
   CEO Quote Carousel, and Audio/Replay controls.
   ========================================================================== */

import * as THREE from 'three';
import { audioManager } from './audioManager.js';

export class MainWebsiteEngine {
  constructor(cinematicSequence) {
    this.cinematicSequence = cinematicSequence;
    this.explorerEngine = null;
    this.currentQuoteIndex = 0;
    this.quoteTimer = null;

    this.sampleTributes = [
      {
        name: 'Elena Vance',
        location: 'Milan, Italy',
        message: 'Miss Sunflower Brand redefined elegance for me. CEO\'s leadership is a beacon of warm light across the industry!',
        date: '2026-09-12'
      },
      {
        name: 'Julian Thorne',
        location: 'London, UK',
        message: 'The dedication to authenticity and botanical brilliance is unmatched. Thank you for building such an incredible vision!',
        date: '2026-09-18'
      },
      {
        name: 'Sophia Chen',
        location: 'Tokyo, Japan',
        message: 'A true digital masterpiece tribute for a true visionary. The Soleil d\'Or fragrance is constant golden sunshine in a bottle.',
        date: '2026-09-24'
      }
    ];

    this.init();
  }

  init() {
    this.initNavigation();
    this.initQuoteCarousel();
    this.initGardenWall();
    this.initProductModals();
    this.initHeaderControls();
  }

  reveal() {
    const mainSite = document.getElementById('main-website');
    if (mainSite) {
      mainSite.classList.remove('hidden');
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Initialize 3D Interactive Sunflower Studio viewport
    setTimeout(() => {
      this.init3DExplorer();
    }, 400);
  }

  initNavigation() {
    document.querySelectorAll('.nav-link, .hero-cta-group a').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
          }
        }
      });
    });
  }

  initHeaderControls() {
    const soundBtn = document.getElementById('header-sound-btn');
    const soundToggleMain = document.getElementById('sound-toggle-btn');
    const soundLabel = document.getElementById('sound-label');

    const toggle = () => {
      const isUnmuted = audioManager.toggleSound();
      if (soundLabel) soundLabel.textContent = `Sound: ${isUnmuted ? 'On' : 'Mute'}`;
    };

    if (soundBtn) soundBtn.addEventListener('click', toggle);
    if (soundToggleMain) soundToggleMain.addEventListener('click', toggle);

    const replayBtn = document.getElementById('replay-intro-btn');
    const footerReplayBtn = document.getElementById('footer-replay-btn');

    const handleReplay = () => {
      const mainSite = document.getElementById('main-website');
      if (mainSite) mainSite.classList.add('hidden');
      this.cinematicSequence.replay();
    };

    if (replayBtn) replayBtn.addEventListener('click', handleReplay);
    if (footerReplayBtn) footerReplayBtn.addEventListener('click', handleReplay);
  }

  init3DExplorer() {
    const explorerCanvas = document.getElementById('explorer-canvas');
    if (!explorerCanvas || this.explorerEngine) return;

    // Build secondary Three.js interactive 360 viewer scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x12100e);

    const camera = new THREE.PerspectiveCamera(40, explorerCanvas.clientWidth / explorerCanvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.4, 1.8);

    const renderer = new THREE.WebGLRenderer({ canvas: explorerCanvas, antialias: true });
    renderer.setSize(explorerCanvas.clientWidth, explorerCanvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const ambLight = new THREE.AmbientLight(0xffe6b3, 1.2);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffb703, 2.0);
    dirLight.position.set(3, 5, 2);
    scene.add(dirLight);

    // Interactive 3D Sunflower Head Group
    const headGroup = new THREE.Group();
    const texLoader = new THREE.TextureLoader();

    const centerTex = texLoader.load('/assets/center.png');
    const petalTex = texLoader.load('/assets/petal.png');

    const diskGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.06, 32);
    const diskMat = new THREE.MeshStandardMaterial({ map: centerTex, roughness: 0.6 });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 2;
    headGroup.add(disk);

    // 24 Petals
    const petalGeo = new THREE.PlaneGeometry(0.2, 0.6);
    petalGeo.translate(0, 0.3, 0);
    const petalMat = new THREE.MeshStandardMaterial({ map: petalTex, side: THREE.DoubleSide, transparent: true });

    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2;
      const isOuter = i % 2 === 0;
      const r = isOuter ? 0.34 : 0.30;
      const petal = new THREE.Mesh(petalGeo, petalMat);
      petal.position.set(Math.cos(angle) * r, Math.sin(angle) * r, isOuter ? 0.02 : -0.02);
      petal.rotation.y = -angle + Math.PI / 2;
      petal.rotation.x = isOuter ? 0.1 : 0.2;
      headGroup.add(petal);
    }

    scene.add(headGroup);

    // Mouse Drag Rotation Physics
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    explorerCanvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => { isDragging = false; });

    explorerCanvas.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;

      headGroup.rotation.y += deltaX * 0.01;
      headGroup.rotation.x += deltaY * 0.01;

      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    });

    // Preset buttons (Sunrise, Noon, Golden, Night)
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const tod = btn.getAttribute('data-tod');
        if (tod === 'sunrise') {
          dirLight.color.setHex(0xffe099);
          dirLight.intensity = 2.0;
        } else if (tod === 'noon') {
          dirLight.color.setHex(0xffffff);
          dirLight.intensity = 2.8;
        } else if (tod === 'golden') {
          dirLight.color.setHex(0xff8c00);
          dirLight.intensity = 2.5;
        } else if (tod === 'night') {
          dirLight.color.setHex(0x6688aa);
          dirLight.intensity = 0.8;
        }
      });
    });

    const animateExplorer = () => {
      requestAnimationFrame(animateExplorer);
      if (!isDragging) {
        headGroup.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animateExplorer();
  }

  initQuoteCarousel() {
    const slides = document.querySelectorAll('.quote-slide');
    const dots = document.querySelectorAll('.quote-dots .dot');

    if (!slides.length) return;

    const goToSlide = (index) => {
      slides.forEach(s => s.classList.remove('active'));
      dots.forEach(d => d.classList.remove('active'));

      this.currentQuoteIndex = index;
      slides[index].classList.add('active');
      dots[index].classList.add('active');
    };

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        goToSlide(idx);
        this.resetQuoteTimer();
      });
    });

    this.quoteTimer = setInterval(() => {
      const nextIndex = (this.currentQuoteIndex + 1) % slides.length;
      goToSlide(nextIndex);
    }, 6000);
  }

  resetQuoteTimer() {
    if (this.quoteTimer) clearInterval(this.quoteTimer);
    const slides = document.querySelectorAll('.quote-slide');
    this.quoteTimer = setInterval(() => {
      const nextIndex = (this.currentQuoteIndex + 1) % slides.length;
      slides.forEach(s => s.classList.remove('active'));
      document.querySelectorAll('.quote-dots .dot').forEach(d => d.classList.remove('active'));

      this.currentQuoteIndex = nextIndex;
      slides[nextIndex].classList.add('active');
      document.querySelectorAll('.quote-dots .dot')[nextIndex].classList.add('active');
    }, 6000);
  }

  initGardenWall() {
    const notesGrid = document.getElementById('notes-grid');
    const form = document.getElementById('tribute-form');

    // Load from localStorage or defaults
    const stored = localStorage.getItem('miss_sunflower_tributes');
    let tributes = stored ? JSON.parse(stored) : this.sampleTributes;

    const renderTributes = () => {
      if (!notesGrid) return;
      notesGrid.innerHTML = tributes.map(t => `
        <div class="note-card">
          <div class="note-icon">🌻</div>
          <p class="note-text">"${t.message}"</p>
          <div class="note-author">— ${t.name}</div>
          <div class="note-location">${t.location || 'Global Fan'} • ${t.date}</div>
        </div>
      `).join('');
    };

    renderTributes();

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('author-name').value.trim();
        const location = document.getElementById('author-location').value.trim();
        const message = document.getElementById('tribute-message').value.trim();

        if (!name || !message) return;

        const newNote = {
          name,
          location,
          message,
          date: new Date().toISOString().split('T')[0]
        };

        tributes.unshift(newNote);
        localStorage.setItem('miss_sunflower_tributes', JSON.stringify(tributes));
        renderTributes();
        form.reset();

        // Scroll to newly planted note smoothly
        notesGrid.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  initProductModals() {
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('modal-content');
    const closeBtn = document.getElementById('modal-close-btn');

    const products = {
      perfume: {
        title: "Soleil d'Or Fragrance",
        category: "EAU DE PARFUM",
        image: "/assets/petal.png",
        desc: "Created in honor of CEO's warm, radiant leadership. Soleil d'Or balances top notes of wild golden sunflower petals and bergamot with a velvety heart of honeyed amber and French oakmoss.",
        specs: ["Volume: 100ml / 3.4 oz", "Concentration: Eau de Parfum", "Origin: Grasse, France", "Edition: CEO Signature Batch"]
      },
      serum: {
        title: "Sunlit Glow Botanical Serum",
        category: "SKINCARE ELIXIR",
        image: "/assets/center.png",
        desc: "Cold-pressed organic sunflower seed oils rich in essential fatty acids and natural Vitamin E. Restores youthful radiance and shields skin against daily environmental stress.",
        specs: ["Volume: 50ml", "Key Ingredient: Helianthus Annuus Seed Oil", "Formula: 100% Organic Botanical", "Dermatologist Tested"]
      },
      elixir: {
        title: "Golden Hour Nectar",
        category: "LUXURY CARE",
        image: "/assets/seed.png",
        desc: "A multi-use golden body oil infused with fine shimmering gold particles. Evokes the serene warmth of a sunflower field at golden hour sunrise.",
        specs: ["Volume: 150ml", "Finish: Subtle Sun-kissed Glow", "Scent: Warm Amber Vanilla", "Limited Collection"]
      }
    };

    window.openProductModal = (key) => {
      const p = products[key];
      if (!p || !modal || !content) return;

      content.innerHTML = `
        <div style="text-align: center;">
          <img src="${p.image}" alt="${p.title}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 16px; border: 2px solid var(--gold-primary);" />
          <span style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--amber-warmth); display: block; margin-bottom: 6px;">${p.category}</span>
          <h2 style="font-family: var(--font-serif); font-size: 2rem; margin-bottom: 16px;">${p.title}</h2>
          <p style="font-size: 14px; line-height: 1.7; color: var(--text-muted); margin-bottom: 24px;">${p.desc}</p>
          <ul style="list-style: none; text-align: left; background: var(--light-card); padding: 18px 24px; border-radius: 12px; margin-bottom: 24px;">
            ${p.specs.map(s => `<li style="font-size: 13px; margin-bottom: 6px; color: #2b2520;">✨ ${s}</li>`).join('')}
          </ul>
          <button class="primary-btn" onclick="closeProductModal()">Close Preview</button>
        </div>
      `;

      modal.classList.remove('hidden');
    };

    window.closeProductModal = () => {
      if (modal) modal.classList.add('hidden');
    };

    if (closeBtn) closeBtn.addEventListener('click', window.closeProductModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) window.closeProductModal();
      });
    }

    // Attach click listeners to product detail buttons
    const btnPerfume = document.getElementById('btn-perfume');
    const btnSerum = document.getElementById('btn-serum');
    const btnElixir = document.getElementById('btn-elixir');

    if (btnPerfume) btnPerfume.addEventListener('click', () => window.openProductModal('perfume'));
    if (btnSerum) btnSerum.addEventListener('click', () => window.openProductModal('serum'));
    if (btnElixir) btnElixir.addEventListener('click', () => window.openProductModal('elixir'));
  }
}
