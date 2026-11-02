/**
 * ToolForge - SIP & Compound Interest Calculator
 * 100% Client-Side Investment & Wealth Growth Engine
 */

(function () {
  'use strict';

  // State
  let mode = 'sip'; // 'sip' or 'lumpsum'
  let currency = '$';

  // Elements
  const typeToggles = document.querySelectorAll('.btn-type-toggle');
  const currencySelect = document.getElementById('currencySelect');
  const amountLabel = document.getElementById('amountLabel');
  const amountValDisplay = document.getElementById('amountValDisplay');
  const returnRateValDisplay = document.getElementById('returnRateValDisplay');
  const tenureValDisplay = document.getElementById('tenureValDisplay');

  const investAmount = document.getElementById('investAmount');
  const investAmountRange = document.getElementById('investAmountRange');
  const returnRate = document.getElementById('returnRate');
  const returnRateRange = document.getElementById('returnRateRange');
  const tenureYears = document.getElementById('tenureYears');
  const tenureYearsRange = document.getElementById('tenureYearsRange');

  const investedResult = document.getElementById('investedResult');
  const returnsResult = document.getElementById('returnsResult');
  const maturityResult = document.getElementById('maturityResult');

  const wealthChart = document.getElementById('wealthChart');
  const investedPct = document.getElementById('investedPct');
  const returnsPct = document.getElementById('returnsPct');

  const growthTableBody = document.getElementById('growthTableBody');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  init();

  function init() {
    setupEventListeners();
    calculateAndRender();
  }

  function setupEventListeners() {
    // Mode toggles
    typeToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        typeToggles.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        mode = btn.dataset.type;

        if (mode === 'sip') {
          amountLabel.textContent = 'Monthly Investment Amount';
          if (parseFloat(investAmount.value) > 25000) {
            investAmount.value = 500;
            investAmountRange.value = 500;
          }
          investAmountRange.max = 25000;
        } else {
          amountLabel.textContent = 'One-Time Lumpsum Investment';
          investAmountRange.max = 500000;
        }

        calculateAndRender();
      });
    });

    // Currency selector
    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        currency = e.target.value;
        calculateAndRender();
      });
    }

    // Amount Sync
    syncInputAndRange(investAmount, investAmountRange, (val) => {
      amountValDisplay.textContent = formatCurrency(val);
      calculateAndRender();
    });

    // Return Rate Sync
    syncInputAndRange(returnRate, returnRateRange, (val) => {
      returnRateValDisplay.textContent = `${parseFloat(val).toFixed(1)} %`;
      calculateAndRender();
    });

    // Tenure Sync
    syncInputAndRange(tenureYears, tenureYearsRange, (val) => {
      tenureValDisplay.textContent = `${parseInt(val, 10)} Years`;
      calculateAndRender();
    });

    // Export CSV
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', exportCSV);
    }
  }

  function syncInputAndRange(inputEl, rangeEl, onChange) {
    if (!inputEl || !rangeEl) return;

    inputEl.addEventListener('input', () => {
      const val = parseFloat(inputEl.value) || 0;
      rangeEl.value = val;
      onChange(val);
    });

    rangeEl.addEventListener('input', () => {
      const val = parseFloat(rangeEl.value) || 0;
      inputEl.value = val;
      onChange(val);
    });
  }

  function calculateAndRender() {
    const P = Math.max(1, parseFloat(investAmount.value) || 0);
    const r = Math.max(0.1, parseFloat(returnRate.value) || 0);
    const t = Math.max(1, parseInt(tenureYears.value, 10) || 1);

    amountValDisplay.textContent = formatCurrency(P);
    returnRateValDisplay.textContent = `${r.toFixed(1)} %`;
    tenureValDisplay.textContent = `${t} Years`;

    let totalInvested = 0;
    let maturityValue = 0;

    if (mode === 'sip') {
      const i = (r / 100) / 12;
      const n = t * 12;
      // M = P * ((1+i)^n - 1) / i * (1+i)
      maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      totalInvested = P * n;
    } else {
      // Lumpsum: M = P * (1 + r/100)^t
      maturityValue = P * Math.pow(1 + (r / 100), t);
      totalInvested = P;
    }

    const returnsGained = Math.max(0, maturityValue - totalInvested);

    // Update Metrics
    investedResult.textContent = formatCurrency(totalInvested);
    returnsResult.textContent = formatCurrency(returnsGained);
    maturityResult.textContent = formatCurrency(maturityValue);

    // Percentages
    const investedPercent = Math.round((totalInvested / maturityValue) * 100);
    const returnsPercent = 100 - investedPercent;

    investedPct.textContent = `${investedPercent}% (${formatCurrency(totalInvested)})`;
    returnsPct.textContent = `${returnsPercent}% (${formatCurrency(returnsGained)})`;

    // Render SVG Donut Chart
    renderDonutChart(investedPercent, returnsPercent);

    // Render Yearly Table
    renderYearlyTable(P, r, t);
  }

  function renderDonutChart(invPct, retPct) {
    if (!wealthChart) return;

    const size = 140;
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const invOffset = circumference * (1 - invPct / 100);
    const retOffset = circumference * (1 - retPct / 100);

    wealthChart.innerHTML = `
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="${strokeWidth}"/>
      <!-- Invested Circle (Indigo) -->
      <circle cx="70" cy="70" r="${radius}" fill="none"
              stroke="#6366f1"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${invOffset}"
              transform="rotate(-90 70 70)"
              style="transition: stroke-dashoffset 0.4s ease;"/>
      <!-- Returns Circle (Green) -->
      <circle cx="70" cy="70" r="${radius}" fill="none"
              stroke="#10b981"
              stroke-width="${strokeWidth}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${retOffset}"
              transform="rotate(${(-90 + (invPct / 100) * 360)} 70 70)"
              style="transition: all 0.4s ease;"/>
      <text x="70" y="66" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text-primary)" font-family="var(--font-sans)">Maturity</text>
      <text x="70" y="82" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="var(--font-mono)">${tenureYears.value} Yrs</text>
    `;
  }

  function renderYearlyTable(P, r, t) {
    if (!growthTableBody) return;
    growthTableBody.innerHTML = '';

    const i = (r / 100) / 12;

    for (let yr = 1; yr <= t; yr++) {
      let investedSoFar = 0;
      let balance = 0;

      if (mode === 'sip') {
        const n = yr * 12;
        investedSoFar = P * n;
        balance = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
      } else {
        investedSoFar = P;
        balance = P * Math.pow(1 + (r / 100), yr);
      }

      const returnsSoFar = Math.max(0, balance - investedSoFar);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:600;">Year ${yr}</td>
        <td style="font-family:var(--font-mono); color:var(--text-secondary);">${formatCurrency(investedSoFar)}</td>
        <td style="font-family:var(--font-mono); color:var(--brand-success);">${formatCurrency(returnsSoFar)}</td>
        <td style="font-family:var(--font-mono); font-weight:700; color:var(--text-primary);">${formatCurrency(balance)}</td>
      `;
      growthTableBody.appendChild(tr);
    }
  }

  function formatCurrency(val) {
    const formatted = Math.round(val).toLocaleString('en-US');
    return `${currency} ${formatted}`;
  }

  function exportCSV() {
    const rows = [
      ['Year', 'Invested Capital', 'Returns Earned', 'Future Value']
    ];

    const trs = growthTableBody.querySelectorAll('tr');
    trs.forEach(tr => {
      const cols = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim().replace(/,/g, ''));
      rows.push(cols);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sip-wealth-projection-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.showToast) window.showToast('Exported SIP Wealth Projection to CSV!', 'success');
  }

})();
