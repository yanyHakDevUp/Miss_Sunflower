/* ==========================================================================
   MISS SUNFLOWER — CINEMATIC TIMELINE & HERO ANTIMATION SEQUENCE (GSAP)
   Orchestrates Hero Blooming Animation Sequence:
   Dark Screen -> Seed resting -> Sprout -> Realtime Petal Bloom ->
   "MISS SUNFLOWER By Lai Souyiek" -> "A little digital garden, made by a fan." -> Enter Garden
   ========================================================================== */

import gsap from 'gsap';
import { audioManager } from './audioManager.js';

export class CinematicSequence {
  constructor(sunflowerEngine, onEnterGarden) {
    this.engine = sunflowerEngine;
    this.onEnterGarden = onEnterGarden;
    this.timeline = null;
    this.isCompleted = false;

    this.initDOMReferences();
  }

  initDOMReferences() {
    this.textStage1 = document.getElementById('text-stage-1');
    this.textStage2 = document.getElementById('text-stage-2');
    this.textStage3 = document.getElementById('text-stage-3');
    this.sunburstLayer = document.getElementById('sunburst-layer');
    this.startScreen = document.getElementById('start-screen');
    this.beginBtn = document.getElementById('begin-experience-btn');
    this.enterGardenBtn = document.getElementById('enter-garden-btn');
    this.replayBtn = document.getElementById('replay-btn');

    if (this.beginBtn) {
      this.beginBtn.addEventListener('click', () => this.start());
    }

    if (this.enterGardenBtn) {
      this.enterGardenBtn.addEventListener('click', () => this.enterGarden());
    }

    if (this.replayBtn) {
      this.replayBtn.addEventListener('click', () => this.replay());
    }
  }

  start() {
    if (this.startScreen) {
      gsap.to(this.startScreen, {
        opacity: 0,
        duration: 0.8,
        onComplete: () => {
          this.startScreen.classList.add('hidden');
        }
      });
    }

    audioManager.play();

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.isCompleted = true;
      }
    });

    const state = this.engine.state;
    state.isGardenMode = false;

    // ----------------------------------------------------
    // STAGE 1: DARK QUIET SOIL & SEED RESTING (0s - 3.5s)
    // ----------------------------------------------------
    this.timeline.to(state, {
      cameraDistance: 0.35,
      cameraOffsetY: 0.04,
      duration: 3.5,
      ease: 'power2.out'
    });

    // ----------------------------------------------------
    // STAGE 2: SPROUT EMERGENCE (3.5s - 7.5s)
    // ----------------------------------------------------
    this.timeline.to(state, {
      sproutGrowth: 1.0,
      sunIntensity: 0.3,
      duration: 4.0,
      ease: 'power1.inOut'
    }, '+=0.5');

    // ----------------------------------------------------
    // STAGE 3: STEM GROWTH & UPWARD CAMERA TRACKING (7.5s - 13.5s)
    // ----------------------------------------------------
    this.timeline.to(state, {
      stemGrowth: 0.85,
      cameraOffsetY: 0.85,
      cameraDistance: 0.55,
      sunIntensity: 0.7,
      duration: 6.0,
      ease: 'power2.inOut'
    });

    // ----------------------------------------------------
    // STAGE 4: PETAL-BY-PETAL REALTIME BLOOM (13.5s - 20s)
    // ----------------------------------------------------
    this.timeline.to(state, {
      stemGrowth: 1.0,
      bloomProgress: 1.0,
      sunIntensity: 1.6,
      duration: 6.5,
      ease: 'sine.inOut',
      onStart: () => {
        if (this.sunburstLayer) this.sunburstLayer.classList.add('active');
      }
    });

    // ----------------------------------------------------
    // STAGE 5: SUNLIGHT SWELL & POLLEN PARTICLES (20s - 24s)
    // ----------------------------------------------------
    this.timeline.to(state, {
      pollenAlpha: 0.85,
      sunIntensity: 2.2,
      duration: 4.0,
      ease: 'power1.out'
    });

    // ----------------------------------------------------
    // STAGE 6: CAMERA FIELD PULL BACK (24s - 29s)
    // ----------------------------------------------------
    this.timeline.to(state, {
      cameraDistance: 2.2,
      cameraOffsetY: 1.1,
      cameraRotationY: 0.15,
      duration: 5.0,
      ease: 'power2.inOut'
    });

    // ----------------------------------------------------
    // STAGE 7: EXACT HERO TYPOGRAPHY SEQUENCE
    // ----------------------------------------------------
    // Text 1: "Welcome 🌻"
    this.timeline.call(() => {
      if (this.textStage1) this.textStage1.classList.add('visible');
    }, null, '+=0.5');

    // Text 2: "MISS SUNFLOWER By Lai Souyiek"
    this.timeline.call(() => {
      if (this.textStage1) this.textStage1.classList.remove('visible');
      if (this.textStage2) this.textStage2.classList.add('visible');
    }, null, '+=3.5');

    // Text 3: "A little digital garden, made by a fan." & Enter Button
    this.timeline.call(() => {
      if (this.textStage2) this.textStage2.classList.remove('visible');
      if (this.textStage3) this.textStage3.classList.add('visible');
    }, null, '+=3.5');
  }

  enterGarden() {
    if (this.textStage3) this.textStage3.classList.remove('visible');
    
    // Zoom camera gently into 3D garden mode
    gsap.to(this.engine.state, {
      cameraDistance: 1.3,
      cameraOffsetY: 0.9,
      duration: 1.5,
      ease: 'power2.inOut',
      onComplete: () => {
        this.engine.state.isGardenMode = true;
        if (this.onEnterGarden) this.onEnterGarden();
      }
    });
  }

  replay() {
    if (this.timeline) this.timeline.kill();

    this.engine.state.isGardenMode = false;
    this.engine.state.sproutGrowth = 0;
    this.engine.state.stemGrowth = 0;
    this.engine.state.bloomProgress = 0;
    this.engine.state.sunIntensity = 0.2;
    this.engine.state.pollenAlpha = 0;
    this.engine.state.cameraDistance = 1.2;
    this.engine.state.cameraOffsetY = 0.1;
    this.engine.state.cameraRotationY = 0;

    [this.textStage1, this.textStage2, this.textStage3].forEach(el => {
      if (el) el.classList.remove('visible');
    });

    const gardenInterface = document.getElementById('garden-interface');
    if (gardenInterface) gardenInterface.classList.add('hidden');

    if (this.sunburstLayer) this.sunburstLayer.classList.remove('active');

    this.start();
  }
}
