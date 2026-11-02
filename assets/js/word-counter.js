/**
 * ToolForge - Word & Character Counter
 * 100% Client-Side Real-Time Text Analysis
 */

(function () {
  'use strict';

  // Elements
  const textArea = document.getElementById('textInput');
  const countWords = document.getElementById('countWords');
  const countChars = document.getElementById('countChars');
  const countCharsNoSpace = document.getElementById('countCharsNoSpace');
  const countSentences = document.getElementById('countSentences');
  const countParagraphs = document.getElementById('countParagraphs');
  const readTimeEl = document.getElementById('readTime');
  const speakTimeEl = document.getElementById('speakTime');

  // Action Buttons
  const btnUppercase = document.getElementById('btnUppercase');
  const btnLowercase = document.getElementById('btnLowercase');
  const btnTitleCase = document.getElementById('btnTitleCase');
  const btnSentenceCase = document.getElementById('btnSentenceCase');
  const btnCleanSpaces = document.getElementById('btnCleanSpaces');
  const btnCopyText = document.getElementById('btnCopyText');
  const btnClearText = document.getElementById('btnClearText');
  const btnSampleText = document.getElementById('btnSampleText');

  // Keyword Table
  const keywordTableBody = document.getElementById('keywordTableBody');

  // Social Limit Cards
  const limits = [
    { id: 'limitTwitter', max: 280 },
    { id: 'limitInstagram', max: 2200 },
    { id: 'limitLinkedIn', max: 3000 },
    { id: 'limitTitleTag', max: 60 },
    { id: 'limitMetaDesc', max: 160 }
  ];

  const sampleParagraph = `ToolForge provides fast, privacy-friendly online utilities built directly for your browser. Every tool processes data locally using modern Web APIs without storing or sending files to external servers. This architecture provides maximum security, zero wait times, and high reliability across mobile and desktop devices. Experience seamless productivity with our free image compressor, EMI calculator, QR code generator, word counter, and PDF merge tools today!`;

  // Real-time listener
  if (textArea) {
    textArea.addEventListener('input', updateStats);
    textArea.addEventListener('change', updateStats);
  }

  function updateStats() {
    const text = textArea.value;
    const trimmed = text.trim();

    // Words
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    countWords.textContent = wordCount.toLocaleString();

    // Characters
    const charCount = text.length;
    countChars.textContent = charCount.toLocaleString();

    // Characters without spaces
    const charNoSpaceCount = text.replace(/\s/g, '').length;
    countCharsNoSpace.textContent = charNoSpaceCount.toLocaleString();

    // Sentences
    const sentences = trimmed ? trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0) : [];
    const sentenceCount = sentences.length;
    countSentences.textContent = sentenceCount.toLocaleString();

    // Paragraphs
    const paragraphs = trimmed ? trimmed.split(/\n+/).filter(p => p.trim().length > 0) : [];
    const paragraphCount = paragraphs.length;
    countParagraphs.textContent = paragraphCount.toLocaleString();

    // Reading & Speaking Time
    // Avg reading speed: 200 wpm; Speaking speed: 130 wpm
    readTimeEl.textContent = formatTime(wordCount / 200);
    speakTimeEl.textContent = formatTime(wordCount / 130);

    // Update Social Media Limits
    updateSocialLimits(charCount);

    // Update Keyword Density
    updateKeywordDensity(words);
  }

  function formatTime(minutesDecimal) {
    if (minutesDecimal <= 0) return '0 sec';
    const totalSeconds = Math.round(minutesDecimal * 60);
    if (totalSeconds < 60) {
      return `${totalSeconds} sec`;
    }
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return secs > 0 ? `${mins} min ${secs} s` : `${mins} min`;
  }

  function updateSocialLimits(currentChars) {
    limits.forEach(item => {
      const container = document.getElementById(item.id);
      if (!container) return;

      const fill = container.querySelector('.social-progress-fill');
      const label = container.querySelector('.social-current');
      if (label) label.textContent = `${currentChars} / ${item.max}`;

      const pct = Math.min(100, Math.round((currentChars / item.max) * 100));
      if (fill) {
        fill.style.width = `${pct}%`;
        fill.classList.remove('warning', 'danger');

        if (currentChars > item.max) {
          fill.classList.add('danger');
          fill.style.width = '100%';
        } else if (pct >= 85) {
          fill.classList.add('warning');
        }
      }
    });
  }

  // Common stop words to exclude from keyword density
  const stopWords = new Set([
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren\'t',
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', 'can\'t', 'cannot', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few',
    'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
    'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'let\'s', 'me',
    'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
    'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
    'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
    'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we',
    'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would',
    'you', 'your', 'yours', 'yourself', 'yourselves'
  ]);

  function updateKeywordDensity(words) {
    if (!keywordTableBody) return;

    if (words.length === 0) {
      keywordTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:1rem;">Type or paste text above to see keyword density.</td></tr>';
      return;
    }

    const freqMap = {};
    let totalEligible = 0;

    words.forEach(w => {
      // Normalize: lower case, strip punctuation
      const clean = w.toLowerCase().replace(/[^a-z0-9'-]/g, '');
      if (clean.length > 2 && !stopWords.has(clean)) {
        freqMap[clean] = (freqMap[clean] || 0) + 1;
        totalEligible++;
      }
    });

    const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    if (sorted.length === 0) {
      keywordTableBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-muted); padding:1rem;">No recurring keywords detected yet.</td></tr>';
      return;
    }

    keywordTableBody.innerHTML = '';
    sorted.forEach(([word, count]) => {
      const density = ((count / words.length) * 100).toFixed(1);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600; text-transform:capitalize;">${word}</td>
        <td>${count}</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span>${density}%</span>
            <div style="flex-grow:1; max-width:80px; height:5px; background:var(--bg-muted); border-radius:99px; overflow:hidden;">
              <div style="width:${Math.min(100, density * 5)}%; height:100%; background:var(--brand-primary);"></div>
            </div>
          </div>
        </td>
      `;
      keywordTableBody.appendChild(tr);
    });
  }

  // Case Conversions & Tool Actions
  if (btnUppercase) {
    btnUppercase.addEventListener('click', () => {
      textArea.value = textArea.value.toUpperCase();
      updateStats();
      window.showToast('Converted to UPPERCASE');
    });
  }

  if (btnLowercase) {
    btnLowercase.addEventListener('click', () => {
      textArea.value = textArea.value.toLowerCase();
      updateStats();
      window.showToast('Converted to lowercase');
    });
  }

  if (btnTitleCase) {
    btnTitleCase.addEventListener('click', () => {
      textArea.value = textArea.value.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
      updateStats();
      window.showToast('Converted to Title Case');
    });
  }

  if (btnSentenceCase) {
    btnSentenceCase.addEventListener('click', () => {
      const lower = textArea.value.toLowerCase();
      textArea.value = lower.replace(/(^\s*|\.\s*|\?\s*|!\s*)([a-z])/g, (match, prefix, char) => {
        return prefix + char.toUpperCase();
      });
      updateStats();
      window.showToast('Converted to Sentence case');
    });
  }

  if (btnCleanSpaces) {
    btnCleanSpaces.addEventListener('click', () => {
      textArea.value = textArea.value
        .split('\n')
        .map(line => line.replace(/[ \t]+/g, ' ').trim())
        .join('\n')
        .replace(/\n{3,}/g, '\n\n');
      updateStats();
      window.showToast('Extra whitespace cleaned');
    });
  }

  if (btnCopyText) {
    btnCopyText.addEventListener('click', () => {
      if (!textArea.value) {
        window.showToast('Textarea is empty.');
        return;
      }
      window.copyToClipboard(textArea.value, 'Text copied to clipboard!');
    });
  }

  if (btnClearText) {
    btnClearText.addEventListener('click', () => {
      textArea.value = '';
      updateStats();
      window.showToast('Text cleared');
    });
  }

  if (btnSampleText) {
    btnSampleText.addEventListener('click', () => {
      textArea.value = sampleParagraph;
      updateStats();
      window.showToast('Sample text loaded');
    });
  }

  // Initial stats run
  updateStats();

})();
