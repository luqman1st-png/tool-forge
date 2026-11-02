/**
 * ToolForge - Simple PDF Merge
 * 100% Client-Side PDF Processing powered by pdf-lib
 */

(function () {
  'use strict';

  // Elements
  const dropzone = document.getElementById('pdfDropzone');
  const fileInput = document.getElementById('pdfFileInput');
  const addMoreInput = document.getElementById('addMoreFileInput');
  const queueSection = document.getElementById('pdfQueueSection');
  const queueList = document.getElementById('pdfQueueList');
  const emptyState = document.getElementById('emptyQueueNotice');

  // Summary Elements
  const totalFilesEl = document.getElementById('totalFilesCount');
  const totalPagesEl = document.getElementById('totalPagesCount');
  const totalSizeEl = document.getElementById('totalSizeCount');

  // Controls
  const outputNameInput = document.getElementById('outputPdfName');
  const mergeBtn = document.getElementById('mergePdfBtn');
  const clearAllBtn = document.getElementById('clearPdfQueueBtn');
  const mergeProgress = document.getElementById('mergeProgress');
  const mergeStatusText = document.getElementById('mergeStatusText');

  // State
  let pdfQueue = [];
  let isMerging = false;

  // Dropzone drag & drop
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

  // File loading and parsing
  async function handleIncomingFiles(fileList) {
    if (!window.PDFLib) {
      window.showToast('pdf-lib is loading, please try again in a second.');
      return;
    }

    const validFiles = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.pdf') || f.type === 'application/pdf');

    if (validFiles.length === 0) {
      window.showToast('Please select valid PDF files (.pdf)');
      return;
    }

    window.showToast(`Loading ${validFiles.length} PDF file(s)...`);

    for (const file of validFiles) {
      try {
        const buffer = await readFileAsArrayBuffer(file);
        // Load with pdf-lib to verify and count pages
        const pdfDoc = await PDFLib.PDFDocument.load(buffer, { ignoreEncryption: true });
        const pages = pdfDoc.getPageCount();

        pdfQueue.push({
          id: 'pdf_' + Math.random().toString(36).substr(2, 9),
          file: file,
          name: file.name,
          size: file.size,
          pages: pages,
          buffer: buffer
        });
      } catch (err) {
        console.error('Failed to parse PDF:', file.name, err);
        window.showToast(`Could not load "${file.name}". It may be password-protected.`);
      }
    }

    renderQueue();
  }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  // Render Queue UI
  function renderQueue() {
    if (!queueList) return;

    queueList.innerHTML = '';

    if (pdfQueue.length === 0) {
      if (queueSection) queueSection.classList.add('hidden');
      if (dropzone) dropzone.classList.remove('hidden');
      updateSummary();
      return;
    }

    if (queueSection) queueSection.classList.remove('hidden');
    // Keep dropzone accessible or hide it
    if (dropzone) dropzone.classList.add('hidden');

    pdfQueue.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'pdf-file-item';
      row.innerHTML = `
        <div class="pdf-file-info">
          <div class="pdf-icon-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div class="pdf-name-wrapper">
            <div class="pdf-file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
            <div class="pdf-file-meta">
              <span>${window.formatBytes(item.size)}</span>
              <span>&bull;</span>
              <span>${item.pages} ${item.pages === 1 ? 'page' : 'pages'}</span>
              <span>&bull;</span>
              <span>Order #${index + 1}</span>
            </div>
          </div>
        </div>

        <div class="pdf-action-controls">
          <button type="button" class="btn-icon-control btn-move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
          </button>
          <button type="button" class="btn-icon-control btn-move-down" title="Move Down" ${index === pdfQueue.length - 1 ? 'disabled' : ''}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
          <button type="button" class="btn-icon-control btn-icon-danger btn-remove-file" title="Remove PDF">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;

      // Button listeners
      const upBtn = row.querySelector('.btn-move-up');
      const downBtn = row.querySelector('.btn-move-down');
      const removeBtn = row.querySelector('.btn-remove-file');

      if (upBtn) {
        upBtn.addEventListener('click', () => {
          if (index > 0) {
            const temp = pdfQueue[index];
            pdfQueue[index] = pdfQueue[index - 1];
            pdfQueue[index - 1] = temp;
            renderQueue();
          }
        });
      }

      if (downBtn) {
        downBtn.addEventListener('click', () => {
          if (index < pdfQueue.length - 1) {
            const temp = pdfQueue[index];
            pdfQueue[index] = pdfQueue[index + 1];
            pdfQueue[index + 1] = temp;
            renderQueue();
          }
        });
      }

      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          pdfQueue.splice(index, 1);
          renderQueue();
          window.showToast(`Removed "${item.name}"`);
        });
      }

      queueList.appendChild(row);
    });

    updateSummary();
  }

  function updateSummary() {
    const totalFiles = pdfQueue.length;
    let totalPages = 0;
    let totalBytes = 0;

    pdfQueue.forEach(item => {
      totalPages += item.pages || 0;
      totalBytes += item.size || 0;
    });

    if (totalFilesEl) totalFilesEl.textContent = totalFiles;
    if (totalPagesEl) totalPagesEl.textContent = totalPages;
    if (totalSizeEl) totalSizeEl.textContent = window.formatBytes(totalBytes);

    if (mergeBtn) {
      if (totalFiles < 2) {
        mergeBtn.disabled = true;
        mergeBtn.title = 'Add at least 2 PDF files to merge';
      } else {
        mergeBtn.disabled = false;
        mergeBtn.title = 'Merge all PDFs into a single file';
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Clear All
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      pdfQueue = [];
      renderQueue();
      window.showToast('All PDFs cleared.');
    });
  }

  // Merge Action
  if (mergeBtn) {
    mergeBtn.addEventListener('click', async () => {
      if (pdfQueue.length < 2 || isMerging) return;

      isMerging = true;
      mergeBtn.disabled = true;
      if (mergeProgress) mergeProgress.classList.remove('hidden');
      if (mergeStatusText) mergeStatusText.textContent = 'Initializing merged document...';

      try {
        const mergedDoc = await PDFLib.PDFDocument.create();

        for (let i = 0; i < pdfQueue.length; i++) {
          const item = pdfQueue[i];
          if (mergeStatusText) {
            mergeStatusText.textContent = `Merging file ${i + 1} of ${pdfQueue.length}: ${item.name}...`;
          }

          const donorDoc = await PDFLib.PDFDocument.load(item.buffer, { ignoreEncryption: true });
          const copiedPages = await mergedDoc.copyPages(donorDoc, donorDoc.getPageIndices());
          copiedPages.forEach((page) => mergedDoc.addPage(page));
        }

        if (mergeStatusText) mergeStatusText.textContent = 'Finalizing and compressing PDF...';

        const mergedPdfBytes = await mergedDoc.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        const downloadUrl = URL.createObjectURL(blob);

        let finalFileName = (outputNameInput ? outputNameInput.value : '').trim();
        if (!finalFileName) finalFileName = 'merged-document.pdf';
        if (!finalFileName.toLowerCase().endsWith('.pdf')) finalFileName += '.pdf';

        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = finalFileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadUrl);

        window.showToast('Merged PDF downloaded successfully!');
      } catch (err) {
        console.error('PDF Merge Error:', err);
        window.showToast('Merge failed. One of the documents may be corrupt or encrypted.');
      } finally {
        isMerging = false;
        mergeBtn.disabled = false;
        if (mergeProgress) mergeProgress.classList.add('hidden');
      }
    });
  }

})();
