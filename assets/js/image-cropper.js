/**
 * ToolForge - Image Cropper & Aspect Ratio Tool
 * 100% Client-Side Interactive HTML5 Canvas Cropping Engine
 */

(function () {
  'use strict';

  // Elements
  const dropzone = document.getElementById('cropperDropzone');
  const fileInput = document.getElementById('cropperFileInput');
  const workspaceSection = document.getElementById('cropperWorkspaceSection');
  const resetBtn = document.getElementById('resetCropperBtn');

  // Canvas
  const canvas = document.getElementById('cropCanvas');
  const previewCanvas = document.getElementById('croppedPreviewCanvas');
  const cropDimEl = document.getElementById('cropDimensions');
  const downloadCroppedBtn = document.getElementById('downloadCroppedBtn');
  const exportFormatSelect = document.getElementById('exportFormatSelect');

  // Controls
  const aspectPills = document.querySelectorAll('.aspect-pill');
  const btnRotateLeft = document.getElementById('btnRotateLeft');
  const btnRotateRight = document.getElementById('btnRotateRight');
  const btnFlipH = document.getElementById('btnFlipH');
  const btnFlipV = document.getElementById('btnFlipV');

  let currentImage = null;
  let imgWidth = 0;
  let imgHeight = 0;

  // Rotation & Flip state
  let rotationDeg = 0; // 0, 90, 180, 270
  let flipH = false;
  let flipV = false;

  // Crop Box relative coordinates (0 to 1)
  let crop = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
  let currentAspectRatio = null; // null = free, or width / height (e.g. 1, 16/9)

  // Dragging state
  let isDragging = false;
  let isResizing = false;
  let resizeHandle = ''; // 'nw', 'ne', 'sw', 'se'
  let dragStartX = 0;
  let dragStartY = 0;
  let cropStart = { ...crop };

  // File loading
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
        loadImage(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        loadImage(e.target.files[0]);
      }
    });
  }

  function loadImage(file) {
    if (!file.type.startsWith('image/')) {
      window.showToast('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        imgWidth = img.naturalWidth;
        imgHeight = img.naturalHeight;
        rotationDeg = 0;
        flipH = false;
        flipV = false;

        // Reset crop box
        initCropBox();

        dropzone.classList.add('hidden');
        workspaceSection.classList.remove('hidden');

        draw();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function initCropBox() {
    if (currentAspectRatio) {
      applyAspectRatio(currentAspectRatio);
    } else {
      crop = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
    }
  }

  function applyAspectRatio(ratio) {
    currentAspectRatio = ratio;
    if (!ratio) {
      crop = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };
      draw();
      return;
    }

    // Adjust crop box based on canvas aspect ratio
    const canvasAspect = canvas.width / canvas.height;
    // target ratio is w / h
    if (ratio >= canvasAspect) {
      const w = 0.8;
      const h = (w * canvasAspect) / ratio;
      crop.w = w;
      crop.h = Math.min(0.9, h);
    } else {
      const h = 0.8;
      const w = (h * ratio) / canvasAspect;
      crop.h = h;
      crop.w = Math.min(0.9, w);
    }
    crop.x = Math.max(0, (1 - crop.w) / 2);
    crop.y = Math.max(0, (1 - crop.h) / 2);

    draw();
  }

  // Aspect ratio chips
  aspectPills.forEach(pill => {
    pill.addEventListener('click', () => {
      aspectPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const val = pill.dataset.ratio;
      if (val === 'free') {
        applyAspectRatio(null);
      } else {
        const parts = val.split(':');
        const ratio = parseFloat(parts[0]) / parseFloat(parts[1]);
        applyAspectRatio(ratio);
      }
    });
  });

  // Transformations
  if (btnRotateRight) {
    btnRotateRight.addEventListener('click', () => {
      rotationDeg = (rotationDeg + 90) % 360;
      draw();
    });
  }

  if (btnRotateLeft) {
    btnRotateLeft.addEventListener('click', () => {
      rotationDeg = (rotationDeg + 270) % 360;
      draw();
    });
  }

  if (btnFlipH) {
    btnFlipH.addEventListener('click', () => {
      flipH = !flipH;
      draw();
    });
  }

  if (btnFlipV) {
    btnFlipV.addEventListener('click', () => {
      flipV = !flipV;
      draw();
    });
  }

  // Draw Main Cropper Canvas
  function draw() {
    if (!currentImage) return;

    // Display sizing
    const maxWidth = 760;
    const maxHeight = 500;
    const isSideways = rotationDeg === 90 || rotationDeg === 270;
    const naturalW = isSideways ? imgHeight : imgWidth;
    const naturalH = isSideways ? imgWidth : imgHeight;

    let displayW = naturalW;
    let displayH = naturalH;

    if (displayW > maxWidth) {
      displayH = (displayH * maxWidth) / displayW;
      displayW = maxWidth;
    }
    if (displayH > maxHeight) {
      displayW = (displayW * maxHeight) / displayH;
      displayH = maxHeight;
    }

    canvas.width = Math.round(displayW);
    canvas.height = Math.round(displayH);
    const ctx = canvas.getContext('2d');

    // 1. Draw Transformed Image
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotationDeg * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    const drawW = isSideways ? canvas.height : canvas.width;
    const drawH = isSideways ? canvas.width : canvas.height;
    ctx.drawImage(currentImage, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // 2. Draw Dark Overlay Outside Crop Box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    const cx = crop.x * canvas.width;
    const cy = crop.y * canvas.height;
    const cw = crop.w * canvas.width;
    const ch = crop.h * canvas.height;

    // Top
    ctx.fillRect(0, 0, canvas.width, cy);
    // Bottom
    ctx.fillRect(0, cy + ch, canvas.width, canvas.height - (cy + ch));
    // Left
    ctx.fillRect(0, cy, cx, ch);
    // Right
    ctx.fillRect(cx + cw, cy, canvas.width - (cx + cw), ch);

    // 3. Draw Crop Box Border & Grid Lines
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, cw, ch);

    // Rule of thirds grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1;
    // vertical
    ctx.beginPath();
    ctx.moveTo(cx + cw / 3, cy);
    ctx.lineTo(cx + cw / 3, cy + ch);
    ctx.moveTo(cx + (cw * 2) / 3, cy);
    ctx.lineTo(cx + (cw * 2) / 3, cy + ch);
    // horizontal
    ctx.moveTo(cx, cy + ch / 3);
    ctx.lineTo(cx + cw, cy + ch / 3);
    ctx.moveTo(cx, cy + (ch * 2) / 3);
    ctx.lineTo(cx + cw, cy + (ch * 2) / 3);
    ctx.stroke();

    // 4. Draw Corner Resize Handles
    const handleSize = 10;
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2;

    const corners = [
      { x: cx, y: cy },
      { x: cx + cw, y: cy },
      { x: cx, y: cy + ch },
      { x: cx + cw, y: cy + ch }
    ];

    corners.forEach(p => {
      ctx.fillRect(p.x - handleSize / 2, p.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(p.x - handleSize / 2, p.y - handleSize / 2, handleSize, handleSize);
    });

    // 5. Update Preview & Dimensions
    updateCroppedPreview(displayW, displayH, naturalW, naturalH);
  }

  // Generate cropped preview
  function updateCroppedPreview(displayW, displayH, naturalW, naturalH) {
    if (!previewCanvas) return;

    const scaleX = naturalW / displayW;
    const scaleY = naturalH / displayH;

    const realCropW = Math.round(crop.w * displayW * scaleX);
    const realCropH = Math.round(crop.h * displayH * scaleY);

    if (cropDimEl) {
      cropDimEl.textContent = `${realCropW} × ${realCropH} px`;
    }

    // Render Preview
    const pWidth = 240;
    const pHeight = Math.round((crop.h / crop.w) * pWidth) || 240;
    previewCanvas.width = pWidth;
    previewCanvas.height = Math.min(320, pHeight);

    const pCtx = previewCanvas.getContext('2d');
    pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Source slice on main canvas
    const sx = Math.round(crop.x * canvas.width);
    const sy = Math.round(crop.y * canvas.height);
    const sw = Math.round(crop.w * canvas.width);
    const sh = Math.round(crop.h * canvas.height);

    pCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, previewCanvas.width, previewCanvas.height);
  }

  // Mouse / Touch interaction on crop canvas
  canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / canvas.width;
    const my = (e.clientY - rect.top) / canvas.height;

    dragStartX = mx;
    dragStartY = my;
    cropStart = { ...crop };

    // Check corner handles (handle radius ~16px)
    const hx = 16 / canvas.width;
    const hy = 16 / canvas.height;

    if (Math.abs(mx - crop.x) < hx && Math.abs(my - crop.y) < hy) {
      isResizing = true;
      resizeHandle = 'nw';
    } else if (Math.abs(mx - (crop.x + crop.w)) < hx && Math.abs(my - crop.y) < hy) {
      isResizing = true;
      resizeHandle = 'ne';
    } else if (Math.abs(mx - crop.x) < hx && Math.abs(my - (crop.y + crop.h)) < hy) {
      isResizing = true;
      resizeHandle = 'sw';
    } else if (Math.abs(mx - (crop.x + crop.w)) < hx && Math.abs(my - (crop.y + crop.h)) < hy) {
      isResizing = true;
      resizeHandle = 'se';
    } else if (mx >= crop.x && mx <= crop.x + crop.w && my >= crop.y && my <= crop.y + crop.h) {
      isDragging = true;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging && !isResizing) return;

    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / canvas.width;
    const my = (e.clientY - rect.top) / canvas.height;
    const dx = mx - dragStartX;
    const dy = my - dragStartY;

    if (isDragging) {
      crop.x = Math.max(0, Math.min(1 - crop.w, cropStart.x + dx));
      crop.y = Math.max(0, Math.min(1 - crop.h, cropStart.y + dy));
    } else if (isResizing) {
      const minSize = 0.08;

      if (resizeHandle === 'se') {
        let newW = Math.max(minSize, Math.min(1 - cropStart.x, cropStart.w + dx));
        let newH = currentAspectRatio ? (newW * canvas.width) / (currentAspectRatio * canvas.height) : Math.max(minSize, Math.min(1 - cropStart.y, cropStart.h + dy));
        crop.w = newW;
        crop.h = Math.min(1 - crop.y, newH);
      } else if (resizeHandle === 'sw') {
        let newW = Math.max(minSize, cropStart.w - dx);
        let newX = cropStart.x + dx;
        if (newX >= 0) {
          crop.x = newX;
          crop.w = newW;
        }
      } else if (resizeHandle === 'ne') {
        let newW = Math.max(minSize, Math.min(1 - cropStart.x, cropStart.w + dx));
        let newH = Math.max(minSize, cropStart.h - dy);
        let newY = cropStart.y + dy;
        if (newY >= 0) {
          crop.y = newY;
          crop.h = newH;
          crop.w = newW;
        }
      } else if (resizeHandle === 'nw') {
        let newX = cropStart.x + dx;
        let newY = cropStart.y + dy;
        if (newX >= 0 && newY >= 0) {
          crop.x = newX;
          crop.y = newY;
          crop.w = Math.max(minSize, cropStart.w - dx);
          crop.h = Math.max(minSize, cropStart.h - dy);
        }
      }
    }

    draw();
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
  });

  // Download High-Resolution Cropped Image
  if (downloadCroppedBtn) {
    downloadCroppedBtn.addEventListener('click', () => {
      if (!currentImage) return;

      const isSideways = rotationDeg === 90 || rotationDeg === 270;
      const naturalW = isSideways ? imgHeight : imgWidth;
      const naturalH = isSideways ? imgWidth : imgHeight;

      // Full resolution off-screen canvas
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = naturalW;
      fullCanvas.height = naturalH;
      const fCtx = fullCanvas.getContext('2d');

      fCtx.save();
      fCtx.translate(naturalW / 2, naturalH / 2);
      fCtx.rotate((rotationDeg * Math.PI) / 180);
      fCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      const dw = isSideways ? naturalH : naturalW;
      const dh = isSideways ? naturalW : naturalH;
      fCtx.drawImage(currentImage, -dw / 2, -dh / 2, dw, dh);
      fCtx.restore();

      // Final Crop Canvas
      const finalCropX = Math.round(crop.x * naturalW);
      const finalCropY = Math.round(crop.y * naturalH);
      const finalCropW = Math.round(crop.w * naturalW);
      const finalCropH = Math.round(crop.h * naturalH);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = finalCropW;
      outCanvas.height = finalCropH;
      const oCtx = outCanvas.getContext('2d');

      const format = exportFormatSelect ? exportFormatSelect.value : 'image/jpeg';
      if (format === 'image/jpeg') {
        oCtx.fillStyle = '#ffffff';
        oCtx.fillRect(0, 0, finalCropW, finalCropH);
      }

      oCtx.drawImage(fullCanvas, finalCropX, finalCropY, finalCropW, finalCropH, 0, 0, finalCropW, finalCropH);

      const ext = format === 'image/png' ? 'png' : (format === 'image/webp' ? 'webp' : 'jpg');
      outCanvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = `cropped-image-${Date.now()}.${ext}`;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.showToast('High-resolution cropped image downloaded!');
      }, format, 0.92);
    });
  }

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentImage = null;
      fileInput.value = '';
      workspaceSection.classList.add('hidden');
      dropzone.classList.remove('hidden');
    });
  }

})();
