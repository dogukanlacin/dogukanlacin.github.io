/**
 * Doğukan'ın Notları — Genel Site Etkileşimleri (Navigasyon, Tema & Header)
 */

(function () {
  'use strict';

  // 1. Mobil Menü Yönetimi
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-header nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });

    // Menü bağlantılarına tıklandığında menüyü kapat
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (siteNav.classList.contains('open')) {
          siteNav.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.textContent = '☰';
        }
      });
    });

    // ESC tuşuyla menüyü kapat
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = '☰';
      }
    });
  }

  // 2. Global Tema Değiştirici (Noir / Sepia)
  const headerThemeToggle = document.getElementById('header-theme-toggle');

  function updateThemeButtonState(isSepia) {
    if (!headerThemeToggle) return;
    const textEl = headerThemeToggle.querySelector('.theme-text');
    if (textEl) {
      textEl.textContent = isSepia ? 'Noir' : 'Sepia';
    }
    headerThemeToggle.setAttribute('aria-pressed', String(isSepia));
    headerThemeToggle.setAttribute('title', isSepia ? 'Noir Moduna Geç' : 'Sepia Moduna Geç');
  }

  // İlk yüklemede durum belirle
  const currentTheme = localStorage.getItem('dl_theme');
  const initialIsSepia = currentTheme === 'sepia';
  updateThemeButtonState(initialIsSepia);

  if (headerThemeToggle) {
    headerThemeToggle.addEventListener('click', () => {
      const isCurrentlySepia = document.documentElement.getAttribute('data-dl-theme') === 'sepia';
      const newTheme = isCurrentlySepia ? 'noir' : 'sepia';

      if (newTheme === 'sepia') {
        document.documentElement.setAttribute('data-dl-theme', 'sepia');
        try { localStorage.setItem('dl_theme', 'sepia'); } catch (e) {}
        updateThemeButtonState(true);
      } else {
        document.documentElement.removeAttribute('data-dl-theme');
        try { localStorage.setItem('dl_theme', 'noir'); } catch (e) {}
        updateThemeButtonState(false);
      }
    });

    // Sayfa içindeki diğer tema tetikleyicileri ile senkronize kal
    if (window.MutationObserver) {
      const observer = new MutationObserver(() => {
        const isSepia = document.documentElement.getAttribute('data-dl-theme') === 'sepia';
        updateThemeButtonState(isSepia);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dl-theme'] });
    }
  }

  // 3. Header Scroll Durumu (Hafif Cam & Çizgi Vurgusu)
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    function onScroll() {
      if (window.scrollY > 20) {
        siteHeader.classList.add('is-scrolled');
      } else {
        siteHeader.classList.remove('is-scrolled');
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
