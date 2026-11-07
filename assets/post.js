/**
 * Doğukan'ın Notları — Yazı Detay Sayfası Etkileşimleri & Okuma Araçları
 * - Dinamik okuma süresi & kalan süre sayacı
 * - Okuma ilerleme çubuğu & yüzde göstergesi
 * - Odak Modu (Focus Mode)
 * - Sepia Modu (Sıcak Kâğıt Teması)
 * - Font Boyutu Kontrolleri (A- / A+)
 * - Tercihlerin localStorage ile hatırlanması (dl_ ön ekiyle)
 * - WhatsApp & X (Twitter) paylaşımı
 * - Bağlantıyı panoya kopyalama
 */

(function () {
  'use strict';

  // Güvenli Depolama Yardımcısı (Private Mode / Güvenlik İstisnalarına Karşı Korumalı)
  const storage = {
    get(key, fallback = null) {
      try {
        const val = localStorage.getItem(key);
        return val !== null ? val : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, val) {
      try {
        localStorage.setItem(key, val);
      } catch (e) {}
    }
  };

  let totalReadingMinutes = 3;

  // 1. Dinamik Okuma Süresi Hesaplama (Ortalama 200 kelime/dk)
  function initReadingTime() {
    const postBody = document.getElementById('post-body');
    const readingTimeEl = document.getElementById('reading-time');
    if (!postBody) return;

    const text = postBody.innerText || postBody.textContent || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = 200;
    totalReadingMinutes = Math.max(1, Math.ceil(words / wordsPerMinute));

    if (readingTimeEl) {
      readingTimeEl.textContent = `${totalReadingMinutes} dk okuma`;
      readingTimeEl.setAttribute('title', `Yaklaşık ${words} kelime`);
    }
  }

  // 2. Gelişmiş Okuma İlerlemesi (Çubuk, Yüzde ve Kalan Süre)
  function initReadingProgress() {
    const progressBar = document.getElementById('reading-progress');
    const percentEl = document.getElementById('reading-progress-percent');
    const remainingEl = document.getElementById('reading-remaining-time');
    if (!progressBar) return;

    function updateProgress() {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      const clamped = Math.min(100, Math.max(0, progress));

      progressBar.style.width = clamped + '%';

      if (percentEl) {
        percentEl.textContent = Math.round(clamped) + '%';
      }

      if (remainingEl) {
        if (clamped >= 95) {
          remainingEl.textContent = '· Tamamlandı ✓';
        } else {
          const remainingMinutes = Math.max(1, Math.ceil(totalReadingMinutes * (1 - clamped / 100)));
          remainingEl.textContent = `· Kalan: ${remainingMinutes} dk`;
        }
      }
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  // 3. Okuma Ayarları ve Tipografi Sistemi (Yazı Boyutu, Satır Aralığı, Metin Genişliği)
  function initReadingSettings() {
    // A. Geçerli Değerler ve Varsayılanlar
    const FONT_SIZES = ['15px', '17px', '19px', '21px'];
    const LINE_HEIGHTS = ['1.75', '1.95', '2.15'];
    const CONTENT_WIDTHS = ['640px', '760px', '880px'];

    const DEFAULT_FONT_SIZE = '17px';
    const DEFAULT_LINE_HEIGHT = '1.95';
    const DEFAULT_CONTENT_WIDTH = '760px';

    // B. Değer Doğrulama Fonksiyonları
    function normalizeFontSize(val) {
      if (!val) return DEFAULT_FONT_SIZE;
      if (val === '15' || val === '17' || val === '19' || val === '21') val += 'px';
      return FONT_SIZES.includes(val) ? val : DEFAULT_FONT_SIZE;
    }

    function normalizeLineHeight(val) {
      if (!val) return DEFAULT_LINE_HEIGHT;
      return LINE_HEIGHTS.includes(val) ? val : DEFAULT_LINE_HEIGHT;
    }

    function normalizeContentWidth(val) {
      if (!val) return DEFAULT_CONTENT_WIDTH;
      if (val === '640' || val === '760' || val === '880') val += 'px';
      return CONTENT_WIDTHS.includes(val) ? val : DEFAULT_CONTENT_WIDTH;
    }

    // C. DOM Elementleri
    const btnDecrease = document.getElementById('btn-font-decrease');
    const btnIncrease = document.getElementById('btn-font-increase');
    const fontSizeIndicator = document.getElementById('font-size-indicator');

    const btnSettings = document.getElementById('btn-reading-settings');
    const settingsPanel = document.getElementById('reading-settings-panel');
    const btnCloseSettings = document.getElementById('btn-close-settings');

    const currentFontEl = document.getElementById('setting-current-font');
    const currentLineHeightEl = document.getElementById('setting-current-lineheight');
    const currentWidthEl = document.getElementById('setting-current-width');

    const segmentButtons = settingsPanel ? settingsPanel.querySelectorAll('.settings-segment-btn') : [];

    // D. Durum (State) Yönetimi - Storage'dan doğrulanmış değerler
    let currentFontSize = normalizeFontSize(storage.get('dl_font_size'));
    let currentLineHeight = normalizeLineHeight(storage.get('dl_line_height'));
    let currentContentWidth = normalizeContentWidth(storage.get('dl_content_width'));

    // E. Uygulama Fonksiyonları (Ayarlar birbirinden bağımsızdır)
    function applyFontSize(size, save = true) {
      currentFontSize = normalizeFontSize(size);
      document.documentElement.style.setProperty('--post-body-font-size', currentFontSize);

      if (fontSizeIndicator) {
        fontSizeIndicator.textContent = currentFontSize;
      }
      if (currentFontEl) {
        currentFontEl.textContent = currentFontSize;
      }

      const fontIndex = FONT_SIZES.indexOf(currentFontSize);
      if (btnDecrease) btnDecrease.disabled = (fontIndex === 0);
      if (btnIncrease) btnIncrease.disabled = (fontIndex === FONT_SIZES.length - 1);

      // Panel segment butonlarını güncelle
      if (settingsPanel) {
        settingsPanel.querySelectorAll('.settings-segment-btn[data-setting="font-size"]').forEach(btn => {
          const isActive = (btn.getAttribute('data-val') === currentFontSize);
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-checked', String(isActive));
        });
      }

      if (save) {
        storage.set('dl_font_size', currentFontSize);
      }
    }

    function applyLineHeight(lh, save = true) {
      currentLineHeight = normalizeLineHeight(lh);
      document.documentElement.style.setProperty('--post-body-line-height', currentLineHeight);

      if (currentLineHeightEl) {
        const labels = { '1.75': 'Sıkı (1.75)', '1.95': 'Normal (1.95)', '2.15': 'Ferah (2.15)' };
        currentLineHeightEl.textContent = labels[currentLineHeight] || currentLineHeight;
      }

      // Panel segment butonlarını güncelle
      if (settingsPanel) {
        settingsPanel.querySelectorAll('.settings-segment-btn[data-setting="line-height"]').forEach(btn => {
          const isActive = (btn.getAttribute('data-val') === currentLineHeight);
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-checked', String(isActive));
        });
      }

      if (save) {
        storage.set('dl_line_height', currentLineHeight);
      }
    }

    function applyContentWidth(width, save = true) {
      currentContentWidth = normalizeContentWidth(width);
      document.documentElement.style.setProperty('--post-content-width', currentContentWidth);

      if (currentWidthEl) {
        const labels = { '640px': 'Dar (640px)', '760px': 'Standart (760px)', '880px': 'Geniş (880px)' };
        currentWidthEl.textContent = labels[currentContentWidth] || currentContentWidth;
      }

      // Panel segment butonlarını güncelle
      if (settingsPanel) {
        settingsPanel.querySelectorAll('.settings-segment-btn[data-setting="content-width"]').forEach(btn => {
          const isActive = (btn.getAttribute('data-val') === currentContentWidth);
          btn.classList.toggle('active', isActive);
          btn.setAttribute('aria-checked', String(isActive));
        });
      }

      if (save) {
        storage.set('dl_content_width', currentContentWidth);
      }
    }

    // F. Eski A- ve A+ Kontrolleri Dinleyicileri (Yeni sistemle senkronize)
    if (btnDecrease) {
      btnDecrease.addEventListener('click', () => {
        const currentIndex = FONT_SIZES.indexOf(currentFontSize);
        if (currentIndex > 0) {
          applyFontSize(FONT_SIZES[currentIndex - 1]);
        }
      });
    }

    if (btnIncrease) {
      btnIncrease.addEventListener('click', () => {
        const currentIndex = FONT_SIZES.indexOf(currentFontSize);
        if (currentIndex < FONT_SIZES.length - 1) {
          applyFontSize(FONT_SIZES[currentIndex + 1]);
        }
      });
    }

    // G. Panel Açma / Kapatma Mantığı
    function isPanelOpen() {
      return settingsPanel && settingsPanel.style.display !== 'none' && settingsPanel.getAttribute('aria-hidden') === 'false';
    }

    function openSettingsPanel() {
      if (!settingsPanel) return;
      settingsPanel.style.display = 'block';
      settingsPanel.setAttribute('aria-hidden', 'false');
      if (btnSettings) {
        btnSettings.classList.add('active');
        btnSettings.setAttribute('aria-expanded', 'true');
      }
    }

    function closeSettingsPanel(returnFocus = false) {
      if (!settingsPanel) return;
      settingsPanel.style.display = 'none';
      settingsPanel.setAttribute('aria-hidden', 'true');
      if (btnSettings) {
        btnSettings.classList.remove('active');
        btnSettings.setAttribute('aria-expanded', 'false');
        if (returnFocus && typeof btnSettings.focus === 'function') {
          btnSettings.focus();
        }
      }
    }

    if (btnSettings && settingsPanel) {
      btnSettings.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPanelOpen()) {
          closeSettingsPanel();
        } else {
          openSettingsPanel();
        }
      });

      if (btnCloseSettings) {
        btnCloseSettings.addEventListener('click', (e) => {
          e.stopPropagation();
          closeSettingsPanel(true);
        });
      }

      // Panel içi tıklamaların dışarı tıklama olayını tetiklemesini önle
      settingsPanel.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Panel dışına tıklanınca kapat
      document.addEventListener('click', () => {
        if (isPanelOpen()) {
          closeSettingsPanel();
        }
      });

      // ESC tuşu ile paneli kapat (capture aşamasında yakalayarak odak modundan önce paneli kapatır)
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isPanelOpen()) {
          e.preventDefault();
          e.stopPropagation();
          closeSettingsPanel(true);
        }
      }, true);
    }

    // H. Segment Butonları Dinleyicileri
    segmentButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const settingType = btn.getAttribute('data-setting');
        const val = btn.getAttribute('data-val');

        if (settingType === 'font-size') {
          applyFontSize(val);
        } else if (settingType === 'line-height') {
          applyLineHeight(val);
        } else if (settingType === 'content-width') {
          applyContentWidth(val);
        }
      });
    });

    // İ. Başlangıç Değerlerini DOM'a ve Arayüze Uygula
    applyFontSize(currentFontSize, false);
    applyLineHeight(currentLineHeight, false);
    applyContentWidth(currentContentWidth, false);
  }

  // 4. Sepia Modu (Sıcak Kâğıt Teması)
  function initThemeControls() {
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (!themeBtn) return;

    const savedTheme = storage.get('dl_theme', 'noir');

    function setTheme(theme) {
      if (theme === 'sepia') {
        document.documentElement.setAttribute('data-dl-theme', 'sepia');
        themeBtn.classList.add('active');
        themeBtn.setAttribute('aria-pressed', 'true');
      } else {
        document.documentElement.removeAttribute('data-dl-theme');
        themeBtn.classList.remove('active');
        themeBtn.setAttribute('aria-pressed', 'false');
      }
      storage.set('dl_theme', theme);
    }

    themeBtn.addEventListener('click', () => {
      const isSepia = document.documentElement.getAttribute('data-dl-theme') === 'sepia';
      setTheme(isSepia ? 'noir' : 'sepia');
    });

    if (window.MutationObserver) {
      const observer = new MutationObserver(() => {
        const isSepia = document.documentElement.getAttribute('data-dl-theme') === 'sepia';
        themeBtn.classList.toggle('active', isSepia);
        themeBtn.setAttribute('aria-pressed', String(isSepia));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-dl-theme'] });
    }

    setTheme(savedTheme);
  }

  // 5. Odak Modu (Focus Mode)
  function initFocusModeControls() {
    const focusBtn = document.getElementById('btn-focus-toggle');
    const exitFocusBtn = document.getElementById('btn-exit-focus');
    if (!focusBtn) return;

    const savedFocus = storage.get('dl_focus_mode', 'false') === 'true';

    function setFocusMode(enabled) {
      if (enabled) {
        document.body.classList.add('focus-mode');
        focusBtn.classList.add('active');
        focusBtn.setAttribute('aria-pressed', 'true');
      } else {
        document.body.classList.remove('focus-mode');
        focusBtn.classList.remove('active');
        focusBtn.setAttribute('aria-pressed', 'false');
      }
      storage.set('dl_focus_mode', String(enabled));
    }

    focusBtn.addEventListener('click', () => {
      const isFocused = document.body.classList.contains('focus-mode');
      setFocusMode(!isFocused);
    });

    if (exitFocusBtn) {
      exitFocusBtn.addEventListener('click', () => {
        setFocusMode(false);
      });
    }

    // ESC tuşuna basıldığında odak modundan çık
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('focus-mode')) {
        setFocusMode(false);
      }
    });

    setFocusMode(savedFocus);
  }

  // 6. Sosyal Medya Paylaşım & Bağlantı Kopyalama
  function initShareButtons() {
    // A. Kanonik ve Temiz URL Tespiti (Parametre ve hash temizliği)
    function getShareableUrl() {
      const canonical = document.querySelector('link[rel="canonical"]');
      if (canonical && canonical.href && canonical.href.startsWith('http')) {
        return canonical.href.replace(/\.html$/, '');
      }
      return (window.location.origin + window.location.pathname).replace(/\.html$/, '');
    }

    const shareUrl = getShareableUrl();
    const titleEl = document.querySelector('.post-title');
    const pageTitle = (titleEl ? titleEl.textContent : document.title).trim();
    const metaDesc = document.querySelector('meta[name="description"]');
    const shareText = metaDesc ? metaDesc.getAttribute('content') : pageTitle;

    // B. Web Share API (Destekleyen modern mobil tarayıcılarda yerel menü)
    const nativeShareBtns = document.querySelectorAll('.share-native');
    if (navigator.share && typeof navigator.share === 'function') {
      nativeShareBtns.forEach((btn) => {
        btn.style.display = 'inline-flex';
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await navigator.share({
              title: pageTitle,
              text: shareText || pageTitle,
              url: shareUrl
            });
          } catch (err) {
            // Kullanıcı paylaşımı iptal ettiyse (AbortError) sessizce geç
            if (err.name !== 'AbortError') {
              console.warn('Web Share API paylaşım uyarısı:', err);
            }
          }
        });
      });
    } else {
      nativeShareBtns.forEach((btn) => {
        btn.style.display = 'none';
      });
    }

    // C. X (Twitter) Paylaş
    const twitterBtns = document.querySelectorAll('.share-twitter');
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(pageTitle)}&url=${encodeURIComponent(shareUrl)}`;
    twitterBtns.forEach((btn) => {
      btn.href = twitterShareUrl;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(twitterShareUrl, '_blank', 'noopener,noreferrer');
      });
    });

    // D. LinkedIn Paylaş
    const linkedInBtns = document.querySelectorAll('.share-linkedin');
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    linkedInBtns.forEach((btn) => {
      btn.href = linkedInShareUrl;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(linkedInShareUrl, '_blank', 'noopener,noreferrer');
      });
    });

    // E. WhatsApp Paylaş (Mobil ve masaüstü uyumlu)
    const whatsappBtns = document.querySelectorAll('.share-whatsapp');
    const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(pageTitle + ' — ' + shareUrl)}`;
    whatsappBtns.forEach((btn) => {
      btn.href = whatsappShareUrl;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(whatsappShareUrl, '_blank', 'noopener,noreferrer');
      });
    });

        // E2. Instagram Paylaş (Bağlantıyı kopyalar ve Instagram'ı açar / kullanıcıya bildirir)
    const instagramBtns = document.querySelectorAll('.share-instagram');
    instagramBtns.forEach((btn) => {
      const textSpan = btn.querySelector('.share-btn-text') || btn;
      const originalText = textSpan.textContent;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const isCopied = await copyToClipboard(shareUrl);
          if (btn._instaTimeout) {
            clearTimeout(btn._instaTimeout);
          }
          btn.classList.add('copied');
          textSpan.textContent = 'Kopyalandı ✓';
          announceLiveRegion('Yazı bağlantısı kopyalandı. Instagram açılıyor...');

          setTimeout(() => {
            window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
          }, 350);

          btn._instaTimeout = setTimeout(() => {
            btn.classList.remove('copied');
            textSpan.textContent = originalText;
            btn._instaTimeout = null;
          }, 2500);
        } catch (err) {
          window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
        }
      });
    });

    // F. Bağlantıyı Kopyalama (Modern Clipboard API + Dayanıklı Fallback + Çift Tıklama Koruması)
    function copyToClipboard(text) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text)
          .then(() => true)
          .catch(() => fallbackCopy(text));
      }
      return fallbackCopy(text);
    }

    function fallbackCopy(text) {
      return new Promise((resolve) => {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'fixed';
          textarea.style.top = '0';
          textarea.style.left = '-9999px';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.focus();
          textarea.select();
          textarea.setSelectionRange(0, 99999);
          const success = document.execCommand('copy');
          document.body.removeChild(textarea);
          resolve(Boolean(success));
        } catch (err) {
          resolve(false);
        }
      });
    }

    const copyBtns = document.querySelectorAll('.share-copy');
    const liveRegions = document.querySelectorAll('.copy-live-region');

    function announceLiveRegion(message) {
      liveRegions.forEach((region) => {
        region.textContent = message;
      });
    }

    copyBtns.forEach((btn) => {
      const textSpan = btn.querySelector('.copy-text') || btn;
      const originalText = textSpan.textContent;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          const isCopied = await copyToClipboard(shareUrl);
          if (!isCopied) {
            throw new Error('Kopyalama komutu başarısız oldu.');
          }

          // Önceki zamanlayıcı varsa sıfırla (çift tıklama koruması)
          if (btn._copyTimeout) {
            clearTimeout(btn._copyTimeout);
          }

          btn.classList.add('copied');
          textSpan.textContent = 'Kopyalandı ✓';
          btn.setAttribute('aria-label', 'Yazı bağlantısı kopyalandı');
          announceLiveRegion('Yazı bağlantısı panoya kopyalandı.');

          btn._copyTimeout = setTimeout(() => {
            btn.classList.remove('copied');
            textSpan.textContent = originalText;
            btn.setAttribute('aria-label', 'Yazı bağlantısını panoya kopyala');
            announceLiveRegion('');
            btn._copyTimeout = null;
          }, 2000);
        } catch (err) {
          console.error('Bağlantı kopyalanamadı:', err);
          announceLiveRegion('Bağlantı kopyalanamadı.');
        }
      });
    });
  }
  // 7. İlgili Yazılar (Related Posts) Öneri Sistemi
  function initRelatedPosts() {
    const sectionEl = document.getElementById('related-posts');
    const gridEl = document.getElementById('related-posts-grid');
    if (!sectionEl || !gridEl) return;

    // Güvenli HTML Kaçırma
    function escapeHTML(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // Tarih Formatlayıcı
    function formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
          }
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        return dateStr;
      } catch {
        return dateStr;
      }
    }

    // Mevcut sayfanın meta verileri
    const currentTitle = (document.querySelector('.post-title')?.textContent || '').trim();
    const pathParts = window.location.pathname.split('/');
    let filename = pathParts.pop() || '';
    if (!filename || filename === '/') {
      filename = 'index.html';
    }
    const currentSlug = filename.replace(/\.html$/, '');
    const currentUrl = filename;

    function isCurrentPost(p) {
      if (!p) return false;
      if (currentSlug && (p.slug === currentSlug || p.id === currentSlug)) return true;
      if (currentUrl && p.url === currentUrl) return true;
      if (currentTitle && p.title && p.title.trim().toLowerCase() === currentTitle.toLowerCase()) return true;
      return false;
    }

    function sortByDate(a, b) {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return timeB - timeA;
    }

    // JSON verisini çek ve akıllı öneri algoritmasını çalıştır
    async function fetchAndRenderRelated() {
      try {
        const res = await fetch('assets/posts.json?v=' + Date.now());
        if (!res.ok) return;
        const data = await res.json();
        const posts = Array.isArray(data) ? data : (data.posts || []);
        if (!Array.isArray(posts) || posts.length === 0) return;

        // Mevcut yazıyı filtrele
        const others = posts.filter(p => !isCurrentPost(p));
        if (others.length === 0) return;

        // En yeni yazılara göre sırala ve ilk 3 yazıyı öner
        others.sort(sortByDate);
        const recommended = others.slice(0, 3);

        // Öneri bulunamadıysa bölümü gizli tut
        if (recommended.length === 0) return;

        // Kartları oluştur ve ekrana bas
        gridEl.innerHTML = recommended.map(post => {
          const title = escapeHTML(post.title || 'Başlıksız Not');
          const dateFormatted = escapeHTML(formatDate(post.date));
          const excerpt = escapeHTML(post.excerpt || '');
          const readingTime = escapeHTML(post.readingTime || '');
          const rawUrl = post.url || (post.slug ? post.slug : '#');
          const url = escapeHTML(rawUrl.replace(/\.html$/, ''));

          const imageUrl = post.image || post.coverImage;
          const imageAlt = escapeHTML(post.imageAlt || title);
          const imageHTML = (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '')
            ? `<div class="card-media"><img src="${escapeHTML(imageUrl)}" alt="${imageAlt}" loading="lazy"></div>`
            : '';

          return `
            <article class="related-card">
              ${imageHTML}
              <div class="card-content">
                <h4 class="card-title">
                  <a href="${url}">${title}</a>
                </h4>
                ${excerpt ? `<p class="card-excerpt">${excerpt}</p>` : ''}
                <div class="card-footer">
                  <div class="card-meta">
                    ${dateFormatted ? `<time datetime="${escapeHTML(post.date || '')}">${dateFormatted}</time>` : ''}
                    ${dateFormatted && readingTime ? `<span class="meta-dot">·</span>` : ''}
                    ${readingTime ? `<span class="card-reading-time">${readingTime}</span>` : ''}
                  </div>
                  <a class="card-read-link" href="${url}" aria-label="${title} yazısını oku">
                    Yazıyı oku <span>↘</span>
                  </a>
                </div>
              </div>
            </article>
          `;
        }).join('');

        sectionEl.style.display = 'block';
      } catch (err) {
        // Ağ veya yerel protokol istisnasında bölüm gizli kalır
      }
    }

    fetchAndRenderRelated();
  }

  // 9. Düşünce Nabzı (Yazı Sonu Minimalist Okur Etkileşimi)
  function initThoughtPulse() {
    const pulseSection = document.getElementById('thought-pulse');
    if (!pulseSection) return;

    const pathParts = window.location.pathname.split('/');
    let filename = pathParts.pop() || '';
    if (!filename || filename === '/') filename = 'index.html';
    const slug = filename.replace(/\.html$/, '');

    const storageKey = `dl_pulse_${slug}`;
    const pulseBtns = pulseSection.querySelectorAll('.pulse-btn');
    const feedbackEl = document.getElementById('pulse-feedback');

    // Kayıtlı seçimi yükle
    const savedPulse = storage.get(storageKey, null);
    if (savedPulse) {
      pulseBtns.forEach((btn) => {
        if (btn.getAttribute('data-pulse') === savedPulse) {
          btn.classList.add('active');
          btn.setAttribute('aria-checked', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-checked', 'false');
        }
      });
      if (feedbackEl) {
        feedbackEl.textContent = `Tercihiniz kaydedildi: "${savedPulse}". Dilediğiniz zaman değiştirebilirsiniz.`;
        feedbackEl.style.display = 'block';
      }
    }

    // Buton etkileşimleri
    pulseBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const pulseVal = btn.getAttribute('data-pulse');
        if (!pulseVal) return;

        pulseBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-checked', 'false');
        });

        btn.classList.add('active');
        btn.setAttribute('aria-checked', 'true');

        storage.set(storageKey, pulseVal);

        if (feedbackEl) {
          feedbackEl.textContent = `Düşünceni paylaştığın için teşekkürler. "${pulseVal}" tercihin bu tarayıcıda hatırlandı.`;
          feedbackEl.style.display = 'block';
        }
      });
    });
  }

  // Sayfa yüklendiğinde başlat
  function init() {
    initReadingTime();
    initReadingProgress();
    initReadingSettings();
    initThemeControls();
    initFocusModeControls();
    initRelatedPosts();
    initShareButtons();
    initThoughtPulse();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
