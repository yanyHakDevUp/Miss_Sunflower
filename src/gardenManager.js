/* ==========================================================================
   MISS SUNFLOWER — DIGITAL GARDEN INTERACTION & TAB MANAGER
   ========================================================================== */

export class GardenManager {
  constructor(sunflowerEngine) {
    this.engine = sunflowerEngine;
    this.init();
  }

  init() {
    this.initTabs();
    this.initTODPresets();
  }

  reveal() {
    const gardenInterface = document.getElementById('garden-interface');
    if (gardenInterface) {
      gardenInterface.classList.remove('hidden');
    }
  }

  initTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.garden-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const targetId = tab.getAttribute('data-target');
        const targetPanel = document.getElementById(targetId);

        if (targetPanel) {
          targetPanel.classList.add('active');
        }

        if (targetId === 'section-3d-garden') {
          this.engine.state.isGardenMode = true;
        }
      });
    });
  }

  initTODPresets() {
    document.querySelectorAll('.tod-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tod-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tod = btn.getAttribute('data-tod');
        this.engine.setTimeOfDayPreset(tod);
      });
    });
  }
}
