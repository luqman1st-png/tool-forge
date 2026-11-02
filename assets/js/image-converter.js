/**
 * ToolForge - Image Format Converter
 * 100% Client-Side Image Conversion Engine (JPG, PNG, WebP)
 */

(function () {
  'use strict';

  // Elements
  const dropzone = document.getElementById('converterDropzone');
  const fileInput = document.getElementById('converterFileInput');
  const addMoreInput = document.getElementById('addMoreConverterInput');
  const queueSection = document.getElementById('converterQueueSection');
  const queueList = document.getElementById('converterQueueList');
  const clearAllBtn = document.getElementById('clearConverterBtn');
  const targetFormatSelect = document.getElementById('targetFormatSelect');
  const qualitySlider = document.getElementById('converterQualitySlider');
  const qualityValEl = document.getElementById('converterQualityVal');
  const convertAllBtn = document.getElementById('convertAllBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');

  // Summary
  const countFilesEl = document.getElementById('convFilesCount');
  const totalOriginalSizeEl = document.getElementById('convOriginalSize');
  const totalConvertedSizeEl = document.getElementById('convConvertedSize');

  let fileQueue = [];

  // Dropzone drag-and-drop
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
        handleIncomingFiles(e.dataTransfer.files);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleIncomingFiles(e.target.files);
        fileInput.value = '';
      }
    });
  }

  if (addMoreInput) {
    addMoreInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleIncomingFiles(e.target.files);
        addMoreInput.value = '';
      }
    });
  }

  if (qualitySlider && qualityValEl) {
    qualitySlider.addEventListener('input', (e) => {
      qualityValEl.textContent = `${e.target.value}%`;
    });
  }

  // Handle selected files
  function handleIncomingFiles(files) {
    const validImages = Array.from(files).filter(f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(f.name));

    if (validImages.length === 0) {
      window.showToast('Please select valid image files (JPG, PNG, WebP, GIF, BMP).');
      return;
    }

    validImages.forEach(file => {
      const id = 'img_' + Math.random().toString(36).substr(2, 9);
      const item = {
        id: id,
        file: file,
        name: file.name,
        size: file.size,
        thumbUrl: URL.createObjectURL(file),
        convertedBlob: null,
        convertedUrl: null,
        convertedSize: 0,
        status: 'pending' // pending, converted, error
      };
      fileQueue.push(item);
    });

    renderQueue();
    // Auto convert immediately
    convertAllImages();
  }

  function renderQueue() {
    if (!queueList) return;
    queueList.innerHTML = '';

    if (fileQueue.length === 0) {
      if (queueSection) queueSection.classList.add('hidden');
      if (dropzone) dropzone.classList.remove('hidden');
      updateSummary();
      return;
    }

    if (queueSection) queueSection.classList.remove('hidden');
    if (dropzone) dropzone.classList.add('hidden');

    fileQueue.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'converter-item';

      const originalExt = item.name.split('.').pop().toUpperCase();
      const targetMime = targetFormatSelect ? targetFormatSelect.value : 'image/webp';
      const targetExt = targetMime === 'image/jpeg' ? 'JPG' : (targetMime === 'image/png' ? 'PNG' : 'WEBP');

      card.innerHTML = `
        <div class="converter-file-info">
          <img src="${item.thumbUrl}" alt="thumb" class="converter-thumb">
          <div>
            <div style="font-weight:700; font-size:0.95rem; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${escapeHtml(item.name)}
            </div>
            <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
              ${window.formatBytes(item.size)} &bull; ${originalExt} &rarr; <span style="color:var(--brand-accent); font-weight:700;">${targetExt}</span>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:1rem;">
          <div style="font-size:0.8125rem; font-family:var(--font-mono); text-align:right;">
            ${item.convertedSize > 0 ? `<strong>${window.formatBytes(item.convertedSize)}</strong>` : '<span style="color:var(--text-muted);">Converting...</span>'}
            ${item.convertedSize > 0 ? `<div style="font-size:0.75rem; color:var(--brand-success);">${getDiffBadge(item.size, item.convertedSize)}</div>` : ''}
          </div>

          <button type="button" class="btn btn-secondary btn-download-single" style="padding:0.45rem 0.85rem; font-size:0.8125rem;" ${item.convertedUrl ? '' : 'disabled'}>
            Download
          </button>

          <button type="button" class="btn-icon-control btn-icon-danger btn-remove-item" title="Remove" style="width:2rem; height:2rem;">
            &times;
          </button>
        </div>
      `;

      // Download single
      const dlBtn = card.querySelector('.btn-download-single');
      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          if (!item.convertedUrl) return;
          const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
          const ext = targetExt.toLowerCase();
          const link = document.createElement('a');
          link.href = item.convertedUrl;
          link.download = `${baseName}-converted.${ext}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.showToast(`Downloaded ${baseName}-converted.${ext}`);
        });
      }

      // Remove single
      const rmBtn = card.querySelector('.btn-remove-item');
      if (rmBtn) {
        rmBtn.addEventListener('click', () => {
          if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
          if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
          fileQueue.splice(index, 1);
          renderQueue();
        });
      }

      queueList.appendChild(card);
    });

    updateSummary();
  }

  function getDiffBadge(orig, conv) {
    const diff = orig - conv;
    const pct = Math.round((diff / orig) * 100);
    if (pct > 0) return `-${pct}% Saved`;
    if (pct < 0) return `+${Math.abs(pct)}%`;
    return '0%';
  }

  function updateSummary() {
    const count = fileQueue.length;
    let totalOrig = 0;
    let totalConv = 0;
    let allReady = count > 0;

    fileQueue.forEach(i => {
      totalOrig += i.size || 0;
      totalConv += i.convertedSize || 0;
      if (!i.convertedUrl) allReady = false;
    });

    if (countFilesEl) countFilesEl.textContent = count;
    if (totalOriginalSizeEl) totalOriginalSizeEl.textContent = window.formatBytes(totalOrig);
    if (totalConvertedSizeEl) totalConvertedSizeEl.textContent = totalConv > 0 ? window.formatBytes(totalConv) : 'Calculating...';

    if (downloadAllBtn) {
      downloadAllBtn.disabled = !allReady || count === 0;
    }
  }

  // Convert all images client-side
  async function convertAllImages() {
    if (fileQueue.length === 0) return;

    const targetMime = targetFormatSelect ? targetFormatSelect.value : 'image/webp';
    const quality = parseFloat(qualitySlider ? qualitySlider.value : 85) / 100;

    for (const item of fileQueue) {
      try {
        const convertedBlob = await convertImageCanvas(item.file, targetMime, quality);
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
        item.convertedBlob = convertedBlob;
        item.convertedUrl = URL.createObjectURL(convertedBlob);
        item.convertedSize = convertedBlob.size;
        item.status = 'converted';
      } catch (err) {
        console.error('Convert failed:', item.name, err);
        item.status = 'error';
      }
    }

    renderQueue();
    window.showToast('All images converted!');
  }

  function convertImageCanvas(file, targetMime, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        // If converting to JPEG, fill white background for transparent PNG/WebP
        if (targetMime === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob failed'));
        }, targetMime, quality);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Listener for format/quality re-conversion
  if (targetFormatSelect) {
    targetFormatSelect.addEventListener('change', () => {
      convertAllImages();
    });
  }

  if (qualitySlider) {
    qualitySlider.addEventListener('change', () => {
      convertAllImages();
    });
  }

  if (convertAllBtn) {
    convertAllBtn.addEventListener('click', () => {
      convertAllImages();
    });
  }

  // Clear All
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      fileQueue.forEach(item => {
        if (item.convertedUrl) URL.revokeObjectURL(item.convertedUrl);
        if (item.thumbUrl) URL.revokeObjectURL(item.thumbUrl);
      });
      fileQueue = [];
      renderQueue();
      window.showToast('Queue cleared');
    });
  }

  // Download All
  if (downloadAllBtn) {
    downloadAllBtn.addEventListener('click', () => {
      const targetMime = targetFormatSelect ? targetFormatSelect.value : 'image/webp';
      const targetExt = targetMime === 'image/jpeg' ? 'jpg' : (targetMime === 'image/png' ? 'png' : 'webp');

      fileQueue.forEach((item, i) => {
        if (!item.convertedUrl) return;
        setTimeout(() => {
          const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
          const link = document.createElement('a');
          link.href = item.convertedUrl;
          link.download = `${baseName}-converted.${targetExt}`;
          document.body.appendChild(link);
          link.click();
          link.remove();
        }, i * 250);
      });

      window.showToast(`Downloading ${fileQueue.length} converted images...`);
    });
  }

})();
