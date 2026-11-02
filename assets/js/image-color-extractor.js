/**
 * ToolForge - Image Color Palette Extractor & Eyedropper
 * 100% Client-Side In-Browser Palette Extraction & Pixel Sampling
 */

(function () {
  'use strict';

  // DOM Elements
  const dropCard = document.getElementById('dropCard');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const sampleBtn = document.getElementById('sampleBtn');
  const paletteWorkspace = document.getElementById('paletteWorkspace');
  const swatchesContainer = document.getElementById('swatchesContainer');
  const mainCanvas = document.getElementById('mainCanvas');
  const loupe = document.getElementById('loupe');
  const loupeCanvas = document.getElementById('loupeCanvas');
  const sampleColorBox = document.getElementById('sampleColorBox');
  const selectedHex = document.getElementById('selectedHex');
  const selectedRgb = document.getElementById('selectedRgb');
  const selectedHsl = document.getElementById('selectedHsl');
  const copySelectedHexBtn = document.getElementById('copySelectedHexBtn');
  const copyCssBtn = document.getElementById('copyCssBtn');
  const copyJsonBtn = document.getElementById('copyJsonBtn');
  const downloadPaletteBtn = document.getElementById('downloadPaletteBtn');
  const newImageBtn = document.getElementById('newImageBtn');
  const imgDimensions = document.getElementById('imgDimensions');

  let activeImage = null;
  let extractedPalette = [];

  // Initialize
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
    if (sampleBtn) {
      sampleBtn.addEventListener('click', loadSampleImage);
    }

    if (newImageBtn) {
      newImageBtn.addEventListener('click', () => {
        fileInput.value = '';
        dropCard.scrollIntoView({ behavior: 'smooth' });
        dropZone.focus();
      });
    }

    // Canvas Eyedropper & Loupe
    if (mainCanvas && loupe && loupeCanvas) {
      mainCanvas.addEventListener('mousemove', handleCanvasMouseMove);
      mainCanvas.addEventListener('mouseleave', () => {
        loupe.style.display = 'none';
      });
      mainCanvas.addEventListener('click', handleCanvasClick);
    }

    // Copy Selected
    if (copySelectedHexBtn) {
      copySelectedHexBtn.addEventListener('click', () => {
        copyToClipboard(selectedHex.textContent.trim(), 'HEX copied to clipboard!');
      });
    }

    if (selectedHex) {
      selectedHex.addEventListener('click', () => {
        copyToClipboard(selectedHex.textContent.trim(), 'HEX copied!');
      });
    }

    if (selectedRgb) {
      selectedRgb.addEventListener('click', () => {
        copyToClipboard(selectedRgb.textContent.trim(), 'RGB copied!');
      });
    }

    // Copy CSS Variables
    if (copyCssBtn) {
      copyCssBtn.addEventListener('click', () => {
        if (!extractedPalette.length) return;
        const css = `:root {\n` + extractedPalette.map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.percent}% */`).join('\n') + `\n}`;
        copyToClipboard(css, 'CSS variables copied to clipboard!');
      });
    }

    // Copy JSON
    if (copyJsonBtn) {
      copyJsonBtn.addEventListener('click', () => {
        if (!extractedPalette.length) return;
        const json = JSON.stringify(extractedPalette.map(c => c.hex), null, 2);
        copyToClipboard(json, 'Palette JSON copied to clipboard!');
      });
    }

    // Download Swatch Card
    if (downloadPaletteBtn) {
      downloadPaletteBtn.addEventListener('click', downloadPaletteCard);
    }
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      if (window.showToast) window.showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        processLoadedImage(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    // Generate a vibrant sunset landscape procedurally
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 900;
    sCanvas.height = 600;
    const sCtx = sCanvas.getContext('2d');

    // Sky gradient (warm purple to deep orange to gold)
    const skyGrad = sCtx.createLinearGradient(0, 0, 0, 420);
    skyGrad.addColorStop(0, '#2d1b4e');
    skyGrad.addColorStop(0.35, '#8c2d6f');
    skyGrad.addColorStop(0.65, '#e0533c');
    skyGrad.addColorStop(0.9, '#f39c12');
    skyGrad.addColorStop(1, '#f1c40f');
    sCtx.fillStyle = skyGrad;
    sCtx.fillRect(0, 0, 900, 600);

    // Glowing Sun
    const sunGrad = sCtx.createRadialGradient(450, 320, 20, 450, 320, 140);
    sunGrad.addColorStop(0, '#fffbe6');
    sunGrad.addColorStop(0.3, '#f9ca24');
    sunGrad.addColorStop(0.7, 'rgba(243, 156, 18, 0.4)');
    sunGrad.addColorStop(1, 'rgba(243, 156, 18, 0)');
    sCtx.fillStyle = sunGrad;
    sCtx.beginPath();
    sCtx.arc(450, 320, 140, 0, Math.PI * 2);
    sCtx.fill();

    // Distant mountain silhouette
    sCtx.fillStyle = '#4a154b';
    sCtx.beginPath();
    sCtx.moveTo(0, 420);
    sCtx.lineTo(150, 340);
    sCtx.lineTo(280, 380);
    sCtx.lineTo(450, 310);
    sCtx.lineTo(620, 370);
    sCtx.lineTo(760, 330);
    sCtx.lineTo(900, 410);
    sCtx.lineTo(900, 600);
    sCtx.lineTo(0, 600);
    sCtx.closePath();
    sCtx.fill();

    // Near mountain ridge
    sCtx.fillStyle = '#1e0c29';
    sCtx.beginPath();
    sCtx.moveTo(0, 460);
    sCtx.lineTo(180, 410);
    sCtx.lineTo(360, 470);
    sCtx.lineTo(540, 400);
    sCtx.lineTo(720, 460);
    sCtx.lineTo(900, 430);
    sCtx.lineTo(900, 600);
    sCtx.lineTo(0, 600);
    sCtx.closePath();
    sCtx.fill();

    // Foreground lake reflection
    const waterGrad = sCtx.createLinearGradient(0, 480, 0, 600);
    waterGrad.addColorStop(0, '#100718');
    waterGrad.addColorStop(0.5, '#2e133d');
    waterGrad.addColorStop(1, '#1a0924');
    sCtx.fillStyle = waterGrad;
    sCtx.fillRect(0, 480, 900, 120);

    const img = new Image();
    img.onload = () => {
      processLoadedImage(img);
      if (window.showToast) window.showToast('Loaded Sunset Artwork sample', 'success');
    };
    img.src = sCanvas.toDataURL('image/png');
  }

  function processLoadedImage(img) {
    activeImage = img;
    paletteWorkspace.classList.remove('hidden');

    // Display image on main canvas
    mainCanvas.width = img.naturalWidth || img.width;
    mainCanvas.height = img.naturalHeight || img.height;
    const ctx = mainCanvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    if (imgDimensions) {
      imgDimensions.textContent = `Dimensions: ${mainCanvas.width} × ${mainCanvas.height} px`;
    }

    // Extract dominant palette
    extractedPalette = extractColors(mainCanvas, 6);
    renderPaletteSwatches(extractedPalette);

    // Set first color as active sample
    if (extractedPalette.length > 0) {
      updateSampledColor(extractedPalette[0].r, extractedPalette[0].g, extractedPalette[0].b);
    }

    paletteWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Color Quantization & Dominant Clustering
  function extractColors(sourceCanvas, maxColors = 6) {
    const sampleSize = 120;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleSize;
    tempCanvas.height = sampleSize;
    const tempCtx = tempCanvas.getContext('2d');

    // Draw downscaled to eliminate noise and speed up
    tempCtx.drawImage(sourceCanvas, 0, 0, sampleSize, sampleSize);
    const imgData = tempCtx.getImageData(0, 0, sampleSize, sampleSize).data;

    // Bucket into 32-step color bins (8 levels per channel: 0, 32, 64, ...)
    const step = 32;
    const colorMap = new Map();
    let totalValidPixels = 0;

    for (let i = 0; i < imgData.length; i += 4) {
      const a = imgData[i + 3];
      if (a < 128) continue; // Skip transparency

      const r = Math.round(imgData[i] / step) * step;
      const g = Math.round(imgData[i + 1] / step) * step;
      const b = Math.round(imgData[i + 2] / step) * step;

      const key = `${r},${g},${b}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
      totalValidPixels++;
    }

    if (totalValidPixels === 0) return [];

    // Sort buckets by frequency
    const sortedBuckets = Array.from(colorMap.entries())
      .map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        return { r, g, b, count };
      })
      .sort((a, b) => b.count - a.count);

    // Select visually distinct clusters (Euclidean distance threshold >= 45)
    const distinctColors = [];
    const minDistance = 45;

    for (const item of sortedBuckets) {
      const isTooClose = distinctColors.some(existing => {
        const dr = item.r - existing.r;
        const dg = item.g - existing.g;
        const db = item.b - existing.b;
        return Math.sqrt(dr * dr + dg * dg + db * db) < minDistance;
      });

      if (!isTooClose) {
        const hex = rgbToHex(item.r, item.g, item.b);
        const percent = Math.max(1, Math.round((item.count / totalValidPixels) * 100));
        distinctColors.push({
          r: item.r,
          g: item.g,
          b: item.b,
          hex,
          percent
        });
      }

      if (distinctColors.length >= maxColors) break;
    }

    return distinctColors;
  }

  function renderPaletteSwatches(palette) {
    if (!swatchesContainer) return;
    swatchesContainer.innerHTML = '';

    palette.forEach((color, index) => {
      const swatch = document.createElement('div');
      swatch.style.cssText = `
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        cursor: pointer;
      `;
      swatch.setAttribute('role', 'button');
      swatch.setAttribute('tabindex', '0');
      swatch.setAttribute('title', `Click to copy ${color.hex}`);

      const isLight = (color.r * 299 + color.g * 587 + color.b * 114) / 1000 > 140;

      swatch.innerHTML = `
        <div style="height: 100px; background-color: ${color.hex}; position: relative; display: flex; align-items: flex-end; justify-content: flex-end; padding: 0.5rem;">
          <span style="font-size: 0.7rem; font-weight: 700; font-family: var(--font-mono); background: ${isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)'}; color: ${isLight ? '#fff' : '#000'}; padding: 0.2rem 0.45rem; border-radius: 9999px;">
            ${color.percent}%
          </span>
        </div>
        <div style="padding: 0.875rem 0.75rem;">
          <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.25rem;">${color.hex}</div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">rgb(${color.r}, ${color.g}, ${color.b})</div>
        </div>
      `;

      swatch.addEventListener('mouseenter', () => {
        swatch.style.transform = 'translateY(-4px)';
        swatch.style.borderColor = 'var(--brand-primary)';
        swatch.style.boxShadow = `0 8px 20px rgba(0,0,0,0.2)`;
      });

      swatch.addEventListener('mouseleave', () => {
        swatch.style.transform = '';
        swatch.style.borderColor = 'var(--border-color)';
        swatch.style.boxShadow = '';
      });

      swatch.addEventListener('click', () => {
        updateSampledColor(color.r, color.g, color.b);
        copyToClipboard(color.hex, `Copied ${color.hex} to clipboard!`);
      });

      swatchesContainer.appendChild(swatch);
    });
  }

  // Interactive Eyedropper & Loupe
  function getCanvasPixelCoords(e) {
    const rect = mainCanvas.getBoundingClientRect();
    const scaleX = mainCanvas.width / rect.width;
    const scaleY = mainCanvas.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    return {
      x: Math.max(0, Math.min(x, mainCanvas.width - 1)),
      y: Math.max(0, Math.min(y, mainCanvas.height - 1)),
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
  }

  function handleCanvasMouseMove(e) {
    if (!activeImage) return;

    const coords = getCanvasPixelCoords(e);
    const ctx = mainCanvas.getContext('2d');
    const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;

    // Position the loupe
    loupe.style.display = 'block';
    loupe.style.left = `${coords.offsetX}px`;
    loupe.style.top = `${coords.offsetY}px`;

    // Render 5x zoom into loupeCanvas
    const lCtx = loupeCanvas.getContext('2d');
    lCtx.imageSmoothingEnabled = false;
    lCtx.clearRect(0, 0, 100, 100);

    const zoom = 5;
    const sourceW = 100 / zoom;
    const sourceH = 100 / zoom;
    const sourceX = coords.x - sourceW / 2;
    const sourceY = coords.y - sourceH / 2;

    lCtx.drawImage(mainCanvas, sourceX, sourceY, sourceW, sourceH, 0, 0, 100, 100);

    // Border color on loupe matching current pixel
    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    loupe.style.borderColor = hex;
  }

  function handleCanvasClick(e) {
    if (!activeImage) return;

    const coords = getCanvasPixelCoords(e);
    const ctx = mainCanvas.getContext('2d');
    const pixel = ctx.getImageData(coords.x, coords.y, 1, 1).data;

    updateSampledColor(pixel[0], pixel[1], pixel[2]);
    copyToClipboard(selectedHex.textContent.trim(), `Sampled pixel: ${selectedHex.textContent.trim()}`);
  }

  function updateSampledColor(r, g, b) {
    const hex = rgbToHex(r, g, b);
    const rgbStr = `rgb(${r}, ${g}, ${b})`;
    const [h, s, l] = rgbToHsl(r, g, b);
    const hslStr = `hsl(${h}, ${s}%, ${l}%)`;

    if (sampleColorBox) sampleColorBox.style.backgroundColor = hex;
    if (selectedHex) selectedHex.textContent = hex;
    if (selectedRgb) selectedRgb.textContent = rgbStr;
    if (selectedHsl) selectedHsl.textContent = hslStr;
  }

  // Export Palette as PNG Swatch Card
  function downloadPaletteCard() {
    if (!extractedPalette.length) return;

    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 1000;
    cardCanvas.height = 480;
    const ctx = cardCanvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0a0c10';
    ctx.fillRect(0, 0, 1000, 480);

    // Header branding
    ctx.font = '700 28px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('Color Palette', 50, 60);

    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Extracted via ToolForge • 100% In-Browser Studio', 50, 88);

    // Swatches
    const swatchCount = extractedPalette.length;
    const startX = 50;
    const startY = 120;
    const totalW = 900;
    const swatchW = totalW / swatchCount;
    const swatchH = 260;

    extractedPalette.forEach((c, idx) => {
      const x = startX + idx * swatchW;
      
      // Color block
      ctx.fillStyle = c.hex;
      ctx.fillRect(x, startY, swatchW, swatchH - 70);

      // Label block
      ctx.fillStyle = '#11151f';
      ctx.fillRect(x, startY + swatchH - 70, swatchW, 70);

      // HEX Text
      ctx.font = '700 14px "JetBrains Mono", monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(c.hex, x + 12, startY + swatchH - 42);

      // Percentage / RGB
      ctx.font = '500 11px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`${c.percent}%`, x + 12, startY + swatchH - 20);
    });

    // Watermark
    ctx.font = '600 13px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('toolforge.pages.dev', 850, 440);

    // Trigger download
    const link = document.createElement('a');
    link.download = `palette-${Date.now()}.png`;
    link.href = cardCanvas.toDataURL('image/png');
    link.click();

    if (window.showToast) window.showToast('Downloaded Palette Card PNG!', 'success');
  }

  // Utilities
  function rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return (`#${toHex(r)}${toHex(g)}${toHex(b)}`).toUpperCase();
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [
      Math.round(h * 360),
      Math.round(s * 100),
      Math.round(l * 100)
    ];
  }

  function copyToClipboard(text, successMsg) {
    navigator.clipboard.writeText(text).then(() => {
      if (window.showToast) {
        window.showToast(successMsg, 'success');
      } else {
        alert(successMsg);
      }
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (window.showToast) window.showToast(successMsg, 'success');
    });
  }

})();
