/**
 * ToolForge - Common Shared Utilities
 * Lightweight vanilla JavaScript
 */

(function () {
  'use strict';

  // 1. Theme Management
  const THEME_STORAGE_KEY = 'toolforge-theme';
  const htmlEl = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggle');

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    const sunIcon = themeToggleBtn.querySelector('.icon-sun');
    const moonIcon = themeToggleBtn.querySelector('.icon-moon');
    if (sunIcon && moonIcon) {
      if (theme === 'dark') {
        sunIcon.classList.remove('hidden');
        moonIcon.classList.add('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
  }

  // Initial theme setup
  applyTheme(getPreferredTheme());

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = htmlEl.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // 2. Mobile Drawer Navigation
  const mobileToggleBtn = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');

  if (mobileToggleBtn && mobileDrawer) {
    mobileToggleBtn.addEventListener('click', () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileToggleBtn.setAttribute('aria-expanded', isOpen);
    });
  }

  // 2b. Dropdown Menus Interaction (Click / Touch / Accessibility)
  const dropdownItems = document.querySelectorAll('.nav-item-dropdown');
  dropdownItems.forEach(item => {
    const toggle = item.querySelector('.dropdown-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 992 || 'ontouchstart' in window) {
        e.preventDefault();
        const isOpen = item.classList.toggle('open');
        toggle.setAttribute('aria-expanded', isOpen);
        dropdownItems.forEach(sibling => {
          if (sibling !== item) {
            sibling.classList.remove('open');
            sibling.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item-dropdown')) {
      dropdownItems.forEach(item => {
        item.classList.remove('open');
        item.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dropdownItems.forEach(item => {
        item.classList.remove('open');
        item.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // 3. FAQ Accordion Logic
  document.querySelectorAll('.faq-item').forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    if (!questionBtn || !answer) return;

    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close other FAQs in the same group if desired
      item.parentElement.querySelectorAll('.faq-item').forEach(other => {
        other.classList.remove('active');
        const otherAnswer = other.querySelector('.faq-answer');
        if (otherAnswer) otherAnswer.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        item.classList.remove('active');
        answer.style.maxHeight = null;
      }
    });
  });

  // 4. Toast Notification System
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastContainer);
  }

  window.showToast = function (message, duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.2s ease-out';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  };

  // 5. Global Copy Helper
  window.copyToClipboard = async function (text, successMessage = 'Copied to clipboard!') {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      window.showToast(successMessage);
      return true;
    } catch (err) {
      console.error('Failed to copy: ', err);
      window.showToast('Could not copy to clipboard');
      return false;
    }
  };

  // 6. Format Bytes Utility
  window.formatBytes = function (bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // 7. Interactive Mouse Spotlight & Card Cursor Illumination
  (function initMouseEffects() {
    let spotlight = document.querySelector('.mouse-spotlight');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.className = 'mouse-spotlight';
      document.body.prepend(spotlight);
    }

    let ticking = false;
    let mouseX = -500;
    let mouseY = -500;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--mouse-x', `${mouseX}px`);
          document.documentElement.style.setProperty('--mouse-y', `${mouseY}px`);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // Interactive Card Spotlight on Hover
    const interactiveCards = document.querySelectorAll('.tool-card, .tool-box, .step-card, .design-prompt-box');
    interactiveCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--card-x', `${x}px`);
        card.style.setProperty('--card-y', `${y}px`);
      }, { passive: true });
    });
  })();

})();
