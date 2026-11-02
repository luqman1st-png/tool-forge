/**
 * ToolForge - Image Compressor & Resizer
 * 100% Client-Side Canvas Image Processing
 */

(function () {
  'use strict';

  // Elements
  const dropzone = document.getElementById('imageDropzone');
  const fileInput = document.getElementById('imageFileInput');
  const editorSection = document.getElementById('editorSection');
  const resetBtn = document.getElementById('resetBtn');

  // Preview elements
  const originalPreview = document.getElementById('originalPreview');
  const compressedPreview = document.getElementById('compressedPreview');
  const originalDimensionsEl = document.getElementById('originalDimensions');
  const originalSizeEl = document.getElementById('originalSize');
  const compressedDimensionsEl = document.getElementById('compressedDimensions');
  const compressedSizeEl = document.getElementById('compressedSize');
  const savingsBadge = document.getElementById('savingsBadge');
  const downloadBtn = document.getElementById('downloadBtn');

  // Controls
  const widthInput = document.getElementById('targetWidth');
  const heightInput = document.getElementById('targetHeight');
  const lockAspectCheckbox = document.getElementById('lockAspect');
  const qualitySlider = document.getElementById('qualitySlider');
  const qualityValEl = document.getElementById('qualityVal');
  const formatSelect = document.getElementById('formatSelect');
  const presetButtons = document.querySelectorAll('.btn-preset');
  const compressBtn = document.getElementById('compressBtn');

  // State
  let currentFile = null;
  let originalImage = null;
  let originalWidth = 0;
  let originalHeight = 0;
  let aspectRatio = 1;
  let compressedBlob = null;
  let compressedDataUrl = null;

  // Drag and drop handlers
  if (dropzone && fileInput) {
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-active');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('drag-active');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-active');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelection(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelection(e.target.files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    if (!file.type.startsWith('image/')) {
      window.showToast('Please upload a valid image file (JPEG, PNG, WebP, etc.)');
      return;
    }

    currentFile = file;
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        originalImage = img;
        originalWidth = img.naturalWidth;
        originalHeight = img.naturalHeight;
        aspectRatio = originalWidth / originalHeight;

        // Set inputs
        widthInput.value = originalWidth;
        heightInput.value = originalHeight;
        originalDimensionsEl.textContent = `${originalWidth} x ${originalHeight} px`;
        originalSizeEl.textContent = window.formatBytes(currentFile.size);
        originalPreview.src = event.target.result;

        // Detect default output format
        if (file.type === 'image/png') {
          formatSelect.value = 'image/png';
        } else if (file.type === 'image/webp') {
          formatSelect.value = 'image/webp';
        } else {
          formatSelect.value = 'image/jpeg';
        }

        // Show editor
        dropzone.classList.add('hidden');
        editorSection.classList.remove('hidden');

        // Initial compression
        compressImage();
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  }

  // Dimension changes with aspect ratio lock
  if (widthInput && heightInput && lockAspectCheckbox) {
    widthInput.addEventListener('input', () => {
      const w = parseInt(widthInput.value, 10);
      if (lockAspectCheckbox.checked && w > 0 && aspectRatio > 0) {
        heightInput.value = Math.round(w / aspectRatio);
      }
    });

    heightInput.addEventListener('input', () => {
      const h = parseInt(heightInput.value, 10);
      if (lockAspectCheckbox.checked && h > 0 && aspectRatio > 0) {
        widthInput.value = Math.round(h * aspectRatio);
      }
    });
  }

  // Preset Buttons (25%, 50%, 75%, 100%)
  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const scale = parseFloat(btn.dataset.scale);
      if (originalWidth > 0 && originalHeight > 0) {
        widthInput.value = Math.round(originalWidth * scale);
        heightInput.value = Math.round(originalHeight * scale);
        compressImage();
      }
    });
  });

  // Quality slider
  if (qualitySlider && qualityValEl) {
    qualitySlider.addEventListener('input', (e) => {
      qualityValEl.textContent = `${e.target.value}%`;
    });
    qualitySlider.addEventListener('change', () => {
      compressImage();
    });
  }

  if (formatSelect) {
    formatSelect.addEventListener('change', () => {
      compressImage();
    });
  }

  if (compressBtn) {
    compressBtn.addEventListener('click', () => {
      compressImage();
    });
  }

  // Main compression function
  function compressImage() {
    if (!originalImage) return;

    const targetWidth = Math.max(1, parseInt(widthInput.value, 10) || originalWidth);
    const targetHeight = Math.max(1, parseInt(heightInput.value, 10) || originalHeight);
    const targetFormat = formatSelect.value || 'image/jpeg';
    const quality = parseFloat(qualitySlider.value) / 100;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    // Smooth scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If JPEG, fill white background to avoid black background for transparent PNGs
    if (targetFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);

    canvas.toBlob((blob) => {
      if (!blob) {
        window.showToast('Compression failed. Please try a different format.');
        return;
      }

      compressedBlob = blob;
      if (compressedDataUrl) {
        URL.revokeObjectURL(compressedDataUrl);
      }
      compressedDataUrl = URL.createObjectURL(blob);

      // Update Preview UI
      compressedPreview.src = compressedDataUrl;
      compressedDimensionsEl.textContent = `${targetWidth} x ${targetHeight} px`;
      compressedSizeEl.textContent = window.formatBytes(blob.size);

      // Calculate reduction
      const originalSize = currentFile.size;
      const newSize = blob.size;
      const diff = originalSize - newSize;
      const pct = Math.round((diff / originalSize) * 100);

      if (pct > 0) {
        savingsBadge.textContent = `-${pct}% Saved`;
        savingsBadge.style.color = 'var(--brand-success)';
        savingsBadge.style.background = 'rgba(16, 185, 129, 0.15)';
      } else if (pct < 0) {
        savingsBadge.textContent = `+${Math.abs(pct)}% (Larger)`;
        savingsBadge.style.color = 'var(--brand-warning)';
        savingsBadge.style.background = 'rgba(245, 158, 11, 0.15)';
      } else {
        savingsBadge.textContent = '0% Change';
        savingsBadge.style.color = 'var(--text-secondary)';
        savingsBadge.style.background = 'var(--bg-muted)';
      }

      downloadBtn.disabled = false;
    }, targetFormat, quality);
  }

  // Download Trigger
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      if (!compressedBlob || !compressedDataUrl) return;

      const ext = formatSelect.value === 'image/png' ? 'png' : (formatSelect.value === 'image/webp' ? 'webp' : 'jpg');
      const baseName = currentFile.name.substring(0, currentFile.name.lastIndexOf('.')) || 'image';
      const fileName = `${baseName}-compressed.${ext}`;

      const link = document.createElement('a');
      link.href = compressedDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.showToast('Download started!');
    });
  }

  // Reset Trigger
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentFile = null;
      originalImage = null;
      if (compressedDataUrl) {
        URL.revokeObjectURL(compressedDataUrl);
        compressedDataUrl = null;
      }
      fileInput.value = '';
      editorSection.classList.add('hidden');
      dropzone.classList.remove('hidden');
      window.showToast('Ready for a new image');
    });
  }

})();
