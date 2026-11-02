/**
 * ToolForge - QR Code Generator
 * 100% Client-Side QR Generation Engine
 */

(function () {
  'use strict';

  // Elements
  const tabButtons = document.querySelectorAll('.qr-type-tab');
  const typePanels = document.querySelectorAll('.qr-type-panel');

  // Input Fields
  const urlInput = document.getElementById('qrUrlInput');
  const textInput = document.getElementById('qrTextInput');
  
  // WiFi Fields
  const wifiSsid = document.getElementById('wifiSsid');
  const wifiPass = document.getElementById('wifiPass');
  const wifiType = document.getElementById('wifiType');
  const wifiHidden = document.getElementById('wifiHidden');

  // Email Fields
  const emailTo = document.getElementById('emailTo');
  const emailSubject = document.getElementById('emailSubject');
  const emailBody = document.getElementById('emailBody');

  // SMS Fields
  const smsPhone = document.getElementById('smsPhone');
  const smsMessage = document.getElementById('smsMessage');

  // Customization Elements
  const fgColorInput = document.getElementById('fgColor');
  const bgColorInput = document.getElementById('bgColor');
  const qrSizeInput = document.getElementById('qrSize');
  const qrSizeVal = document.getElementById('qrSizeVal');
  const qrMarginInput = document.getElementById('qrMargin');
  const qrMarginVal = document.getElementById('qrMarginVal');
  const eclSelect = document.getElementById('eclSelect');

  // Output Elements
  const canvas = document.getElementById('qrCanvas');
  const downloadPngBtn = document.getElementById('downloadPngBtn');
  const downloadSvgBtn = document.getElementById('downloadSvgBtn');
  const copyImageBtn = document.getElementById('copyImageBtn');

  let activeType = 'url';
  let debounceTimer = null;
  let currentSvgString = '';

  // Tab switching
  tabButtons.forEach(tab => {
    tab.addEventListener('click', () => {
      tabButtons.forEach(t => t.classList.remove('active'));
      typePanels.forEach(p => p.classList.add('hidden'));

      tab.classList.add('active');
      activeType = tab.dataset.type;
      const targetPanel = document.getElementById(`panel-${activeType}`);
      if (targetPanel) targetPanel.classList.remove('hidden');

      generateQR();
    });
  });

  // Check URL hash on load (e.g. #wifi)
  if (window.location.hash) {
    const hashType = window.location.hash.replace('#', '');
    const matchingTab = document.querySelector(`.qr-tab[data-type="${hashType}"]`);
    if (matchingTab) {
      matchingTab.click();
    }
  }

  // Controls event listeners
  const allInputs = [
    urlInput, textInput, wifiSsid, wifiPass, wifiType, wifiHidden,
    emailTo, emailSubject, emailBody, smsPhone, smsMessage,
    fgColorInput, bgColorInput, eclSelect
  ];

  allInputs.forEach(input => {
    if (input) {
      input.addEventListener('input', scheduleGenerate);
      input.addEventListener('change', scheduleGenerate);
    }
  });

  if (qrSizeInput && qrSizeVal) {
    qrSizeInput.addEventListener('input', (e) => {
      qrSizeVal.textContent = `${e.target.value} px`;
      scheduleGenerate();
    });
  }

  if (qrMarginInput && qrMarginVal) {
    qrMarginInput.addEventListener('input', (e) => {
      qrMarginVal.textContent = `${e.target.value} modules`;
      scheduleGenerate();
    });
  }

  function scheduleGenerate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generateQR, 80);
  }

  // Construct payload text
  function getPayload() {
    switch (activeType) {
      case 'url':
        let url = (urlInput.value || '').trim();
        if (url && !/^https?:\/\//i.test(url) && !url.startsWith('/')) {
          url = 'https://' + url;
        }
        return url || 'https://toolforge.pages.dev';

      case 'text':
        return textInput.value || 'Hello from ToolForge!';

      case 'wifi':
        const ssid = (wifiSsid.value || '').trim();
        const pass = wifiPass.value || '';
        const enc = wifiType.value || 'WPA';
        const hidden = wifiHidden.checked ? 'true' : 'false';
        if (!ssid) return 'WIFI:S:MyNetwork;T:WPA;P:password;;';
        // Wi-Fi QR Format: WIFI:S:<SSID>;T:<WEP|WPA|nopass>;P:<PASSWORD>;H:<true|false>;;
        return `WIFI:S:${escapeWifi(ssid)};T:${enc === 'nopass' ? 'nopass' : enc};P:${escapeWifi(pass)};H:${hidden};;`;

      case 'email':
        const to = (emailTo.value || '').trim();
        const sub = encodeURIComponent(emailSubject.value || '');
        const body = encodeURIComponent(emailBody.value || '');
        if (!to) return 'mailto:hello@example.com';
        return `mailto:${to}?subject=${sub}&body=${body}`;

      case 'sms':
        const phone = (smsPhone.value || '').trim();
        const msg = smsMessage.value || '';
        if (!phone) return 'SMSTO:+1234567890:Hello';
        return `SMSTO:${phone}:${msg}`;

      default:
        return 'https://toolforge.pages.dev';
    }
  }

  function escapeWifi(str) {
    return str.replace(/([\\;,:"])/g, '\\$1');
  }

  // Generate QR Code
  function generateQR() {
    if (typeof qrcode !== 'function') {
      console.error('qrcode-generator library is not loaded');
      return;
    }

    const payload = getPayload();
    const ecl = eclSelect.value || 'M';
    const targetSize = parseInt(qrSizeInput.value, 10) || 300;
    const marginModules = parseInt(qrMarginInput.value, 10) || 2;
    const fg = fgColorInput.value || '#000000';
    const bg = bgColorInput.value || '#ffffff';

    try {
      // 0 = auto-detect best version/type number
      const qr = qrcode(0, ecl);
      qr.addData(payload);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const totalModules = moduleCount + (marginModules * 2);
      const cellSize = targetSize / totalModules;
      const actualSize = Math.round(totalModules * cellSize);

      // 1. Draw on Canvas
      canvas.width = actualSize;
      canvas.height = actualSize;
      const ctx = canvas.getContext('2d');

      // Fill background
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, actualSize, actualSize);

      // Draw modules
      ctx.fillStyle = fg;
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            const x = Math.round((c + marginModules) * cellSize);
            const y = Math.round((r + marginModules) * cellSize);
            const w = Math.ceil(cellSize);
            const h = Math.ceil(cellSize);
            ctx.fillRect(x, y, w, h);
          }
        }
      }

      // 2. Build Scalable SVG string
      let svgRects = '';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.isDark(r, c)) {
            const x = (c + marginModules);
            const y = (r + marginModules);
            svgRects += `<rect x="${x}" y="${y}" width="1" height="1" fill="${fg}" />`;
          }
        }
      }

      currentSvgString = `<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${totalModules}" width="${targetSize}" height="${targetSize}">
  <rect width="${totalModules}" height="${totalModules}" fill="${bg}"/>
  ${svgRects}
</svg>`;

    } catch (err) {
      console.warn('QR generation overflow, upgrading size or error:', err);
      window.showToast('Text is too long for this Error Correction level.');
    }
  }

  // Download PNG
  if (downloadPngBtn) {
    downloadPngBtn.addEventListener('click', () => {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `qrcode-${activeType}-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.showToast('PNG QR code downloaded!');
    });
  }

  // Download SVG
  if (downloadSvgBtn) {
    downloadSvgBtn.addEventListener('click', () => {
      if (!currentSvgString) return;
      const blob = new Blob([currentSvgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `qrcode-${activeType}-${Date.now()}.svg`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      window.showToast('Vector SVG QR code downloaded!');
    });
  }

  // Copy Image to Clipboard
  if (copyImageBtn) {
    copyImageBtn.addEventListener('click', () => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          window.showToast('Could not generate clipboard image.');
          return;
        }

        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            window.showToast('QR Code image copied to clipboard!');
          } else {
            window.showToast('Direct image clipboard copying is not supported in this browser.');
          }
        } catch (err) {
          console.error('Clipboard copy error: ', err);
          window.showToast('Please right-click the QR code to copy it.');
        }
      }, 'image/png');
    });
  }

  // Initial generation
  generateQR();

})();
