/* ==========================================================================
   MISS SUNFLOWER — DIGITAL GARDEN FAN EXPERIENCE ENTRYPOINT
   ========================================================================== */

import './style.css';
import { SunflowerEngine } from './sunflowerEngine.js';
import { CinematicSequence } from './cinematicSequence.js';
import { GardenManager } from './gardenManager.js';
import { audioManager } from './audioManager.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('webgl-canvas');
  
  if (!canvas) {
    console.error('WebGL canvas element not found');
    return;
  }

  // 1. Initialize Photorealistic 3D Curved Sunflower Engine
  const sunflowerEngine = new SunflowerEngine(canvas);

  // 2. Initialize Digital Garden Manager
  const gardenManager = new GardenManager(sunflowerEngine);

  // 3. Initialize Hero Cinematic Sequence
  const cinematicSequence = new CinematicSequence(sunflowerEngine, () => {
    // Reveal Digital Garden UI Panels on completion
    gardenManager.reveal();
  });

  // 4. Top Bar Sound Button Listener
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundIconOn = document.getElementById('sound-icon-on');
  const soundIconOff = document.getElementById('sound-icon-off');
  const soundLabel = document.getElementById('sound-label');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isUnmuted = audioManager.toggleSound();
      if (soundLabel) soundLabel.textContent = `Sound: ${isUnmuted ? 'On' : 'Mute'}`;
      if (soundIconOn && soundIconOff) {
        soundIconOn.classList.toggle('hidden', !isUnmuted);
        soundIconOff.classList.toggle('hidden', isUnmuted);
      }
    });
  }
});
