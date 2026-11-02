/**
 * ToolForge - GST & Sales Tax Calculator
 * 100% In-Browser Tax Calculation & Split Engine
 */

(function () {
  'use strict';

  let mode = 'exclusive'; // 'exclusive' (Add GST) or 'inclusive' (Remove GST)
  let activeRate = 18;
  let currency = '₹';

  // Elements
  const modeToggles = document.querySelectorAll('.btn-gst-mode');
  const currencySelect = document.getElementById('currencySelect');
  const amountInputLabel = document.getElementById('amountInputLabel');
  const amountDisplay = document.getElementById('amountDisplay');
  const baseAmountInput = document.getElementById('baseAmountInput');
  const slabButtons = document.querySelectorAll('.btn-tax-slab');
  const customRateRow = document.getElementById('customRateRow');
  const customRateInput = document.getElementById('customRateInput');

  const netLabel = document.getElementById('netLabel');
  const grossLabel = document.getElementById('grossLabel');
  const netResult = document.getElementById('netResult');
  const gstResult = document.getElementById('gstResult');
  const grossResult = document.getElementById('grossResult');

  const cgstResult = document.getElementById('cgstResult');
  const sgstResult = document.getElementById('sgstResult');
  const igstResult = document.getElementById('igstResult');
  const copyInvoiceBtn = document.getElementById('copyInvoiceBtn');

  init();

  function init() {
    setupEventListeners();
    calculateAndRender();
  }

  function setupEventListeners() {
    // Mode toggles
    modeToggles.forEach(btn => {
      btn.addEventListener('click', () => {
        modeToggles.forEach(b => {
          b.classList.remove('btn-primary');
          b.classList.add('btn-secondary');
        });
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        mode = btn.dataset.mode;

        if (mode === 'exclusive') {
          amountInputLabel.textContent = 'Initial Amount (Before GST)';
          netLabel.textContent = 'Net Amount (Base)';
          grossLabel.textContent = 'Total Gross Amount';
        } else {
          amountInputLabel.textContent = 'Total Amount (Inclusive of GST)';
          netLabel.textContent = 'Pre-Tax Base Amount';
          grossLabel.textContent = 'Original MRP Paid';
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

    // Base Amount input
    if (baseAmountInput) {
      baseAmountInput.addEventListener('input', () => {
        calculateAndRender();
      });
    }

    // Slab buttons
    slabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        slabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const rateVal = btn.dataset.rate;
        if (rateVal === 'custom') {
          customRateRow.classList.remove('hidden');
          activeRate = Math.max(0, parseFloat(customRateInput.value) || 0);
          customRateInput.focus();
        } else {
          customRateRow.classList.add('hidden');
          activeRate = parseFloat(rateVal);
        }

        calculateAndRender();
      });
    });

    // Custom rate input
    if (customRateInput) {
      customRateInput.addEventListener('input', () => {
        activeRate = Math.max(0, parseFloat(customRateInput.value) || 0);
        calculateAndRender();
      });
    }

    // Copy Summary
    if (copyInvoiceBtn) {
      copyInvoiceBtn.addEventListener('click', copySummaryToClipboard);
    }
  }

  function calculateAndRender() {
    const inputVal = Math.max(0, parseFloat(baseAmountInput.value) || 0);
    amountDisplay.textContent = formatMoney(inputVal);

    let netAmount = 0;
    let gstAmount = 0;
    let grossAmount = 0;

    if (mode === 'exclusive') {
      // Add GST: input is net
      netAmount = inputVal;
      gstAmount = (netAmount * activeRate) / 100;
      grossAmount = netAmount + gstAmount;
    } else {
      // Remove GST: input is gross
      grossAmount = inputVal;
      netAmount = grossAmount / (1 + (activeRate / 100));
      gstAmount = grossAmount - netAmount;
    }

    const halfRate = (activeRate / 2).toFixed(1).replace('.0', '');
    const halfTax = gstAmount / 2;

    // Display
    netResult.textContent = formatMoney(netAmount);
    gstResult.textContent = formatMoney(gstAmount);
    grossResult.textContent = formatMoney(grossAmount);

    cgstResult.textContent = `${formatMoney(halfTax)} (${halfRate}%)`;
    sgstResult.textContent = `${formatMoney(halfTax)} (${halfRate}%)`;
    igstResult.textContent = `${formatMoney(gstAmount)} (${activeRate}%)`;
  }

  function formatMoney(num) {
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${currency} ${formatted}`;
  }

  function copySummaryToClipboard() {
    const inputVal = Math.max(0, parseFloat(baseAmountInput.value) || 0);
    const summaryText = [
      `=== GST TAX BREAKDOWN ===`,
      `Calculation: ${mode === 'exclusive' ? 'Add GST (Exclusive)' : 'Remove GST (Inclusive)'}`,
      `Selected Rate: ${activeRate}%`,
      `Base / Net Cost: ${netResult.textContent}`,
      `Central GST (CGST): ${cgstResult.textContent}`,
      `State GST (SGST): ${sgstResult.textContent}`,
      `Total GST: ${gstResult.textContent}`,
      `Total Final Gross Invoice: ${grossResult.textContent}`,
      `=========================`,
      `Computed via ToolForge (100% In-Browser)`
    ].join('\n');

    navigator.clipboard.writeText(summaryText).then(() => {
      if (window.showToast) window.showToast('Copied GST Invoice Breakdown!', 'success');
      else alert('Copied to clipboard!');
    }).catch(() => {
      if (window.showToast) window.showToast('Summary copied', 'success');
    });
  }

})();
