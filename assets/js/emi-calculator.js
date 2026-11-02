/**
 * ToolForge - EMI / Loan Calculator
 * 100% Client-Side Financial Calculation Engine
 */

(function () {
  'use strict';

  // Elements
  const loanAmountInput = document.getElementById('loanAmount');
  const loanAmountRange = document.getElementById('loanAmountRange');
  const interestRateInput = document.getElementById('interestRate');
  const interestRateRange = document.getElementById('interestRateRange');
  const loanTenureInput = document.getElementById('loanTenure');
  const loanTenureRange = document.getElementById('loanTenureRange');
  const tenureTypeRadios = document.querySelectorAll('input[name="tenureType"]');
  const currencySelect = document.getElementById('currencySelect');

  // Result Elements
  const emiResultEl = document.getElementById('emiResult');
  const totalInterestEl = document.getElementById('totalInterestResult');
  const totalAmountEl = document.getElementById('totalAmountResult');
  const principalPctEl = document.getElementById('principalPct');
  const interestPctEl = document.getElementById('interestPct');
  const chartSvg = document.getElementById('breakdownChart');
  const chartLegendPrincipal = document.getElementById('legendPrincipal');
  const chartLegendInterest = document.getElementById('legendInterest');

  // Amortization Table
  const tableBody = document.getElementById('amortizationTableBody');
  const viewToggleButtons = document.querySelectorAll('.btn-view-toggle');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  let currentView = 'yearly'; // 'yearly' or 'monthly'
  let cachedSchedule = [];

  // Dual binding helper
  function syncInputs(numberInput, rangeInput, onChange) {
    if (!numberInput || !rangeInput) return;

    numberInput.addEventListener('input', () => {
      rangeInput.value = numberInput.value;
      if (onChange) onChange();
    });

    rangeInput.addEventListener('input', () => {
      numberInput.value = rangeInput.value;
      if (onChange) onChange();
    });
  }

  // Setup dual sync
  syncInputs(loanAmountInput, loanAmountRange, calculateEMI);
  syncInputs(interestRateInput, interestRateRange, calculateEMI);
  syncInputs(loanTenureInput, loanTenureRange, calculateEMI);

  tenureTypeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const isYears = document.querySelector('input[name="tenureType"]:checked').value === 'years';
      if (isYears) {
        loanTenureRange.min = '1';
        loanTenureRange.max = '30';
        loanTenureInput.max = '30';
        if (parseFloat(loanTenureInput.value) > 30) loanTenureInput.value = '20';
        loanTenureRange.value = loanTenureInput.value;
      } else {
        loanTenureRange.min = '6';
        loanTenureRange.max = '360';
        loanTenureInput.max = '360';
        if (parseFloat(loanTenureInput.value) < 6) loanTenureInput.value = '60';
        loanTenureRange.value = loanTenureInput.value;
      }
      calculateEMI();
    });
  });

  if (currencySelect) {
    currencySelect.addEventListener('change', calculateEMI);
  }

  // View toggle (yearly vs monthly)
  viewToggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleButtons.forEach(b => b.classList.remove('btn-primary'));
      viewToggleButtons.forEach(b => b.classList.add('btn-secondary'));
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      currentView = btn.dataset.view;
      renderTable(cachedSchedule);
    });
  });

  function formatCurrency(val, currency = '$') {
    return currency + ' ' + Math.round(val).toLocaleString();
  }

  // Main calculation
  function calculateEMI() {
    const P = parseFloat(loanAmountInput.value) || 0;
    const annualRate = parseFloat(interestRateInput.value) || 0;
    let tenureVal = parseFloat(loanTenureInput.value) || 0;
    const isYears = document.querySelector('input[name="tenureType"]:checked').value === 'years';
    const totalMonths = isYears ? Math.round(tenureVal * 12) : Math.round(tenureVal);
    const currency = currencySelect ? currencySelect.value : '$';

    if (P <= 0 || annualRate <= 0 || totalMonths <= 0) {
      emiResultEl.textContent = `${currency} 0`;
      totalInterestEl.textContent = `${currency} 0`;
      totalAmountEl.textContent = `${currency} 0`;
      return;
    }

    const r = (annualRate / 12) / 100;
    const emi = (P * r * Math.pow(1 + r, totalMonths)) / (Math.pow(1 + r, totalMonths) - 1);
    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - P;

    const principalPct = Math.round((P / totalPayment) * 100);
    const interestPct = 100 - principalPct;

    // Update Result Labels
    emiResultEl.textContent = formatCurrency(emi, currency);
    totalInterestEl.textContent = formatCurrency(totalInterest, currency);
    totalAmountEl.textContent = formatCurrency(totalPayment, currency);
    principalPctEl.textContent = `${principalPct}% (${formatCurrency(P, currency)})`;
    interestPctEl.textContent = `${interestPct}% (${formatCurrency(totalInterest, currency)})`;

    // Render Donut Chart SVG
    renderDonutChart(principalPct, interestPct);

    // Generate Full Amortization Schedule
    generateSchedule(P, r, emi, totalMonths, currency);
  }

  // SVG Donut Chart
  function renderDonutChart(principalPct, interestPct) {
    if (!chartSvg) return;

    const radius = 54;
    const circumference = 2 * Math.PI * radius; // ~339.292
    const principalStroke = (principalPct / 100) * circumference;
    const interestStroke = (interestPct / 100) * circumference;

    chartSvg.innerHTML = `
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--bg-muted)" stroke-width="18"/>
      <!-- Principal Segment -->
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--brand-primary)" stroke-width="18"
              stroke-dasharray="${principalStroke} ${circumference}" stroke-dashoffset="0"
              transform="rotate(-90 70 70)" style="transition: stroke-dasharray 0.4s ease;"/>
      <!-- Interest Segment -->
      <circle cx="70" cy="70" r="${radius}" fill="none" stroke="var(--brand-warning)" stroke-width="18"
              stroke-dasharray="${interestStroke} ${circumference}" stroke-dashoffset="-${principalStroke}"
              transform="rotate(-90 70 70)" style="transition: all 0.4s ease;"/>
      <text x="70" y="66" text-anchor="middle" font-size="11" font-weight="600" fill="var(--text-muted)">Principal / Int.</text>
      <text x="70" y="82" text-anchor="middle" font-size="13" font-weight="700" fill="var(--text-primary)">${principalPct}% / ${interestPct}%</text>
    `;
  }

  // Amortization Schedule Calculation
  function generateSchedule(principal, monthlyRate, emi, totalMonths, currency) {
    let balance = principal;
    const monthlyList = [];
    let cumulativeInterest = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const interestForMonth = balance * monthlyRate;
      let principalForMonth = emi - interestForMonth;

      // Final month adjustment
      if (m === totalMonths || balance < principalForMonth) {
        principalForMonth = balance;
      }

      balance = Math.max(0, balance - principalForMonth);
      cumulativeInterest += interestForMonth;

      monthlyList.push({
        month: m,
        year: Math.ceil(m / 12),
        monthInYear: ((m - 1) % 12) + 1,
        openingBalance: balance + principalForMonth,
        emi: principalForMonth + interestForMonth,
        principalPaid: principalForMonth,
        interestPaid: interestForMonth,
        closingBalance: balance,
        cumulativeInterest: cumulativeInterest
      });

      if (balance <= 0) break;
    }

    cachedSchedule = monthlyList;
    renderTable(monthlyList);
  }

  // Render Table (Yearly or Monthly)
  function renderTable(schedule) {
    if (!tableBody || !schedule || schedule.length === 0) return;

    const currency = currencySelect ? currencySelect.value : '$';
    tableBody.innerHTML = '';

    if (currentView === 'yearly') {
      // Group by year
      const yearsMap = {};
      schedule.forEach(item => {
        if (!yearsMap[item.year]) {
          yearsMap[item.year] = {
            year: item.year,
            openingBalance: item.openingBalance,
            totalEmi: 0,
            totalPrincipal: 0,
            totalInterest: 0,
            closingBalance: item.closingBalance
          };
        }
        yearsMap[item.year].totalEmi += item.emi;
        yearsMap[item.year].totalPrincipal += item.principalPaid;
        yearsMap[item.year].totalInterest += item.interestPaid;
        yearsMap[item.year].closingBalance = item.closingBalance;
      });

      Object.values(yearsMap).forEach(y => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">Year ${y.year}</td>
          <td>${formatCurrency(y.openingBalance, currency)}</td>
          <td style="font-weight:600; color:var(--brand-primary);">${formatCurrency(y.totalEmi, currency)}</td>
          <td>${formatCurrency(y.totalPrincipal, currency)}</td>
          <td style="color:var(--brand-warning);">${formatCurrency(y.totalInterest, currency)}</td>
          <td>${formatCurrency(y.closingBalance, currency)}</td>
        `;
        tableBody.appendChild(tr);
      });
    } else {
      // Monthly view (display first 120 months or paginated)
      schedule.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:600;">Month ${item.month} (Yr ${item.year})</td>
          <td>${formatCurrency(item.openingBalance, currency)}</td>
          <td style="font-weight:600; color:var(--brand-primary);">${formatCurrency(item.emi, currency)}</td>
          <td>${formatCurrency(item.principalPaid, currency)}</td>
          <td style="color:var(--brand-warning);">${formatCurrency(item.interestPaid, currency)}</td>
          <td>${formatCurrency(item.closingBalance, currency)}</td>
        `;
        tableBody.appendChild(tr);
      });
    }
  }

  // CSV Export
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      if (!cachedSchedule || cachedSchedule.length === 0) {
        window.showToast('Please calculate an EMI first.');
        return;
      }

      const headers = ['Month', 'Year', 'Opening Balance', 'EMI', 'Principal Paid', 'Interest Paid', 'Closing Balance'];
      const rows = cachedSchedule.map(s => [
        s.month,
        s.year,
        Math.round(s.openingBalance),
        Math.round(s.emi),
        Math.round(s.principalPaid),
        Math.round(s.interestPaid),
        Math.round(s.closingBalance)
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'loan-amortization-schedule.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.showToast('Amortization schedule exported as CSV!');
    });
  }

  // Initial calculation on load
  calculateEMI();

})();
