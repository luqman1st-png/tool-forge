/**
 * ToolForge - Photo Filters & Image Effects Studio
 * 100% Client-Side GPU-Accelerated Filter Engine
 */

(function () {
  'use strict';

  // DOM Elements
  const dropCard = document.getElementById('dropCard');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const sampleFilterBtn = document.getElementById('sampleFilterBtn');
  const filterWorkspace = document.getElementById('filterWorkspace');
  const filterPreviewImg = document.getElementById('filterPreviewImg');
  const holdCompareBtn = document.getElementById('holdCompareBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const changeImageBtn = document.getElementById('changeImageBtn');
  const downloadFilteredBtn = document.getElementById('downloadFilteredBtn');
  const exportFormat = document.getElementById('exportFormat');

  // Sliders
  const brightnessSlider = document.getElementById('brightnessSlider');
  const contrastSlider = document.getElementById('contrastSlider');
  const saturateSlider = document.getElementById('saturateSlider');
  const sepiaSlider = document.getElementById('sepiaSlider');
  const grayscaleSlider = document.getElementById('grayscaleSlider');
  const hueSlider = document.getElementById('hueSlider');
  const blurSlider = document.getElementById('blurSlider');

  // Labels
  const brightnessVal = document.getElementById('brightnessVal');
  const contrastVal = document.getElementById('contrastVal');
  const saturateVal = document.getElementById('saturateVal');
  const sepiaVal = document.getElementById('sepiaVal');
  const grayscaleVal = document.getElementById('grayscaleVal');
  const hueVal = document.getElementById('hueVal');
  const blurVal = document.getElementById('blurVal');

  // Presets
  const presetButtons = document.querySelectorAll('.filter-preset-btn');

  let activeImageObj = null;
  let activeImageSrc = '';

  const PRESETS = {
    normal: { brightness: 100, contrast: 100, saturate: 100, sepia: 0, grayscale: 0, hue: 0, blur: 0 },
    cinematic: { brightness: 95, contrast: 135, saturate: 125, sepia: 15, grayscale: 0, hue: 350, blur: 0 },
    vintage: { brightness: 92, contrast: 88, saturate: 80, sepia: 65, grayscale: 0, hue: 20, blur: 0 },
    cyberpunk: { brightness: 110, contrast: 145, saturate: 180, sepia: 0, grayscale: 0, hue: 195, blur: 0 },
    noir: { brightness: 105, contrast: 150, saturate: 0, sepia: 0, grayscale: 100, hue: 0, blur: 0 },
    golden: { brightness: 108, contrast: 115, saturate: 145, sepia: 35, grayscale: 0, hue: 35, blur: 0 },
    emerald: { brightness: 95, contrast: 125, saturate: 115, sepia: 20, grayscale: 0, hue: 145, blur: 0 },
    highcontrast: { brightness: 105, contrast: 165, saturate: 130, sepia: 0, grayscale: 0, hue: 0, blur: 0 }
  };

  init();

  function init() {
    setupDragAndDrop();
    setupEventListeners();
  }

  function setupDragAndDrop() {
    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fileInput.click();
      }
    });

    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });
  }

  function setupEventListeners() {
    if (sampleFilterBtn) {
      sampleFilterBtn.addEventListener('click', loadSampleNatureImage);
    }

    if (changeImageBtn) {
      changeImageBtn.addEventListener('click', () => {
        fileInput.value = '';
        dropCard.scrollIntoView({ behavior: 'smooth' });
        dropZone.focus();
      });
    }

    // Sliders input
    const sliders = [brightnessSlider, contrastSlider, saturateSlider, sepiaSlider, grayscaleSlider, hueSlider, blurSlider];
    sliders.forEach(slider => {
      if (slider) {
        slider.addEventListener('input', () => {
          updateLabels();
          applyActiveFilter();
          clearPresetActiveState();
        });
      }
    });

    // Presets
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.dataset.preset;
        if (PRESETS[presetKey]) {
          applyPresetValues(PRESETS[presetKey]);
          presetButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        }
      });
    });

    // Reset All
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        applyPresetValues(PRESETS.normal);
        presetButtons.forEach(b => b.classList.remove('active'));
        const normalBtn = document.querySelector('[data-preset="normal"]');
        if (normalBtn) normalBtn.classList.add('active');
        if (window.showToast) window.showToast('Reset all adjustments', 'info');
      });
    }

    // Hold to compare
    if (holdCompareBtn && filterPreviewImg) {
      const showOriginal = () => {
        filterPreviewImg.style.filter = 'none';
      };
      const restoreFilter = () => {
        applyActiveFilter();
      };

      holdCompareBtn.addEventListener('mousedown', showOriginal);
      holdCompareBtn.addEventListener('mouseup', restoreFilter);
      holdCompareBtn.addEventListener('mouseleave', restoreFilter);
      holdCompareBtn.addEventListener('touchstart', (e) => { e.preventDefault(); showOriginal(); });
      holdCompareBtn.addEventListener('touchend', restoreFilter);
    }

    // Download Filtered Image
    if (downloadFilteredBtn) {
      downloadFilteredBtn.addEventListener('click', downloadFilteredImage);
    }
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      if (window.showToast) window.showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      activeImageSrc = e.target.result;
      const img = new Image();
      img.onload = () => {
        activeImageObj = img;
        loadWorkspaceWithImage();
      };
      img.src = activeImageSrc;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleNatureImage() {
    // Generate a beautiful landscape canvas (misty mountain forest at dawn)
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 960;
    sCanvas.height = 640;
    const ctx = sCanvas.getContext('2d');

    // Sky gradient (cool azure to peach dawn)
    const sky = ctx.createLinearGradient(0, 0, 0, 400);
    sky.addColorStop(0, '#1a365d');
    sky.addColorStop(0.4, '#2b6cb0');
    sky.addColorStop(0.75, '#e28743');
    sky.addColorStop(1, '#ffdda1');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 960, 640);

    // Glowing sun rising
    const sun = ctx.createRadialGradient(480, 360, 10, 480, 360, 180);
    sun.addColorStop(0, '#ffffff');
    sun.addColorStop(0.25, '#ffeaa7');
    sun.addColorStop(0.6, 'rgba(255, 184, 108, 0.45)');
    sun.addColorStop(1, 'rgba(255, 184, 108, 0)');
    ctx.fillStyle = sun;
    ctx.beginPath();
    ctx.arc(480, 360, 180, 0, Math.PI * 2);
    ctx.fill();

    // Mountain 1 (distant)
    ctx.fillStyle = '#3c4074';
    ctx.beginPath();
    ctx.moveTo(0, 420);
    ctx.lineTo(240, 260);
    ctx.lineTo(480, 390);
    ctx.lineTo(720, 240);
    ctx.lineTo(960, 380);
    ctx.lineTo(960, 640);
    ctx.lineTo(0, 640);
    ctx.fill();

    // Mountain 2 (midground with pine ridges)
    ctx.fillStyle = '#223348';
    ctx.beginPath();
    ctx.moveTo(0, 480);
    ctx.lineTo(180, 360);
    ctx.lineTo(390, 460);
    ctx.lineTo(600, 340);
    ctx.lineTo(820, 440);
    ctx.lineTo(960, 410);
    ctx.lineTo(960, 640);
    ctx.lineTo(0, 640);
    ctx.fill();

    // Foreground trees silhouette
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 520, 960, 120);

    // Draw pines along foreground
    for (let x = 20; x < 940; x += 35) {
      const treeH = 60 + Math.sin(x) * 25;
      ctx.beginPath();
      ctx.moveTo(x, 520 - treeH);
      ctx.lineTo(x + 18, 540);
      ctx.lineTo(x - 18, 540);
      ctx.fill();
    }

    const img = new Image();
    img.onload = () => {
      activeImageObj = img;
      activeImageSrc = img.src;
      loadWorkspaceWithImage();
      if (window.showToast) window.showToast('Loaded Nature Sample Photo', 'success');
    };
    img.src = sCanvas.toDataURL('image/jpeg', 0.95);
  }

  function loadWorkspaceWithImage() {
    filterPreviewImg.src = activeImageSrc;
    filterWorkspace.classList.remove('hidden');
    applyActiveFilter();
    filterWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function applyPresetValues(vals) {
    if (brightnessSlider) brightnessSlider.value = vals.brightness;
    if (contrastSlider) contrastSlider.value = vals.contrast;
    if (saturateSlider) saturateSlider.value = vals.saturate;
    if (sepiaSlider) sepiaSlider.value = vals.sepia;
    if (grayscaleSlider) grayscaleSlider.value = vals.grayscale;
    if (hueSlider) hueSlider.value = vals.hue;
    if (blurSlider) blurSlider.value = vals.blur;

    updateLabels();
    applyActiveFilter();
  }

  function clearPresetActiveState() {
    presetButtons.forEach(btn => btn.classList.remove('active'));
  }

  function updateLabels() {
    if (brightnessVal) brightnessVal.textContent = `${brightnessSlider.value}%`;
    if (contrastVal) contrastVal.textContent = `${contrastSlider.value}%`;
    if (saturateVal) saturateVal.textContent = `${saturateSlider.value}%`;
    if (sepiaVal) sepiaVal.textContent = `${sepiaSlider.value}%`;
    if (grayscaleVal) grayscaleVal.textContent = `${grayscaleSlider.value}%`;
    if (hueVal) hueVal.textContent = `${hueSlider.value}°`;
    if (blurVal) blurVal.textContent = `${blurSlider.value}px`;
  }

  function buildFilterString() {
    const b = brightnessSlider.value;
    const c = contrastSlider.value;
    const s = saturateSlider.value;
    const sp = sepiaSlider.value;
    const g = grayscaleSlider.value;
    const h = hueSlider.value;
    const bl = blurSlider.value;

    return `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sp}%) grayscale(${g}%) hue-rotate(${h}deg) blur(${bl}px)`;
  }

  function applyActiveFilter() {
    if (!filterPreviewImg) return;
    filterPreviewImg.style.filter = buildFilterString();
  }

  function downloadFilteredImage() {
    if (!activeImageObj) return;

    const outCanvas = document.createElement('canvas');
    const width = activeImageObj.naturalWidth || activeImageObj.width;
    const height = activeImageObj.naturalHeight || activeImageObj.height;

    outCanvas.width = width;
    outCanvas.height = height;
    const ctx = outCanvas.getContext('2d');

    // Scale blur relative to original resolution for fidelity
    // Preview is roughly ~500px, so calculate scale factor
    const previewWidth = filterPreviewImg.clientWidth || 500;
    const scaleRatio = width / previewWidth;
    const scaledBlur = parseFloat(blurSlider.value) * scaleRatio;

    const b = brightnessSlider.value;
    const c = contrastSlider.value;
    const s = saturateSlider.value;
    const sp = sepiaSlider.value;
    const g = grayscaleSlider.value;
    const h = hueSlider.value;

    ctx.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) sepia(${sp}%) grayscale(${g}%) hue-rotate(${h}deg) blur(${scaledBlur}px)`;
    ctx.drawImage(activeImageObj, 0, 0, width, height);

    const format = exportFormat ? exportFormat.value : 'image/png';
    const ext = format === 'image/jpeg' ? 'jpg' : (format === 'image/webp' ? 'webp' : 'png');

    const downloadLink = document.createElement('a');
    downloadLink.download = `filtered-photo-${Date.now()}.${ext}`;
    downloadLink.href = outCanvas.toDataURL(format, 0.95);
    downloadLink.click();

    if (window.showToast) window.showToast('Downloaded photo in full resolution!', 'success');
  }

})();
