/**
 * Doğukan'ın Notları — Dinamik Yazı Arşivi Sistemi
 * - posts.json veri kaynağı
 * - Anlık arama (Türkçe karakter duyarlı)
 * - Tarihe göre sıralama (En yeni / En eski)
 * - Öne çıkan yazı (featured) desteği
 * - Boş durum & hata yönetimi
 */

(function () {
  'use strict';

  let allPosts = [];
  let searchQuery = '';
  let currentSort = 'newest';

  // DOM Elemanları
  const elements = {
    controls: document.getElementById('archive-controls'),
    searchInput: document.getElementById('archive-search'),
    searchClear: document.getElementById('search-clear'),
    sortSelect: document.getElementById('archive-sort'),
    featuredArea: document.getElementById('archive-featured'),
    gridArea: document.getElementById('archive-grid'),
    emptyArea: document.getElementById('archive-empty'),
    emptyTitle: document.getElementById('archive-empty-title'),
    emptyDesc: document.getElementById('archive-empty-desc'),
    resetBtn: document.getElementById('archive-reset-btn'),
    errorArea: document.getElementById('archive-error')
  };

  // Güvenli HTML Kaçırma (XSS Koruması)
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Türkçe Karakter Uyumlu Metin Normalleştirme
  function normalizeText(str) {
    if (!str) return '';
    return str
      .toLocaleLowerCase('tr')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ı/g, 'i')
      .trim();
  }

  // Tarih Formatlayıcı (ISO veya "2026-11-05" -> "5 Kasım 2026")
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

  // Yazı Kartı Şablonu Oluşturucu
  function createPostCardHTML(post, isFeatured = false) {
    const title = escapeHTML(post.title || 'Başlıksız Not');
    const dateFormatted = escapeHTML(formatDate(post.date));
    const excerpt = escapeHTML(post.excerpt || '');
    const readingTime = escapeHTML(post.readingTime || '');
    const url = escapeHTML(post.url || (post.slug ? `${post.slug}.html` : '#'));

    // Kapak Görseli: Hem "image" hem "coverImage" alanlarını ve "imageAlt" etiketini destekler
    const imageUrl = post.image || post.coverImage;
    const imageAlt = escapeHTML(post.imageAlt || title);
    const imageHTML = (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '')
      ? `<div class="card-media"><img src="${escapeHTML(imageUrl)}" alt="${imageAlt}" loading="lazy"></div>`
      : '';

    const featuredBadge = isFeatured
      ? `<div class="card-meta-top"><span class="featured-badge"><span class="badge-icon">✳</span> ÖNE ÇIKAN NOT</span></div>`
      : '';

    return `
      <article class="post-card ${isFeatured ? 'is-featured' : ''}">
        ${imageHTML}
        <div class="card-content">
          ${featuredBadge}
          <h3 class="card-title">
            <a href="${url}">${title}</a>
          </h3>
          ${excerpt ? `<p class="card-excerpt">${excerpt}</p>` : ''}
          <div class="card-footer">
            <div class="card-meta">
              ${dateFormatted ? `<time datetime="${escapeHTML(post.date)}">${dateFormatted}</time>` : ''}
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
  }

  // Filtreleme ve Sıralama
  function getFilteredPosts() {
    let result = [...allPosts];

    // 1. Arama Filtresi (Başlık, Açıklama)
    if (searchQuery.trim() !== '') {
      const q = normalizeText(searchQuery);
      result = result.filter(p => {
        const titleNorm = normalizeText(p.title);
        const excerptNorm = normalizeText(p.excerpt);
        return titleNorm.includes(q) || excerptNorm.includes(q);
      });
    }

    // 2. Sıralama (Tarihe göre)
    result.sort((a, b) => {
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      return currentSort === 'oldest' ? timeA - timeB : timeB - timeA;
    });

    return result;
  }

  // Arşiv Görünümünü Güncelle
  function renderArchive() {
    if (!elements.emptyArea) return;

    // Durum 1: Sitede toplamda hiç yazı yok (İlk hal)
    if (allPosts.length === 0) {
      if (elements.controls) elements.controls.style.display = 'none';
      if (elements.featuredArea) elements.featuredArea.style.display = 'none';
      if (elements.gridArea) elements.gridArea.style.display = 'none';

      elements.emptyArea.style.display = 'block';
      if (elements.emptyTitle) elements.emptyTitle.textContent = 'Henüz ilk not düşülmedi.';
      if (elements.emptyDesc) elements.emptyDesc.textContent = 'Burada zamanla düşünceler, gözlemler ve kelimeler birikecek.';
      if (elements.resetBtn) elements.resetBtn.style.display = 'none';
      return;
    }

    // Durum 2: Yazılar var, kontroller görünür
    if (elements.controls) elements.controls.style.display = 'block';

    const filtered = getFilteredPosts();

    // Durum 3: Filtre/Arama sonucu hiç yazı bulunamadı
    if (filtered.length === 0) {
      if (elements.featuredArea) elements.featuredArea.style.display = 'none';
      if (elements.gridArea) elements.gridArea.style.display = 'none';

      elements.emptyArea.style.display = 'block';
      if (elements.emptyTitle) elements.emptyTitle.textContent = 'Aradığın not burada değil.';
      if (elements.emptyDesc) elements.emptyDesc.textContent = 'Farklı bir arama terimi deneyebilirsiniz.';
      if (elements.resetBtn) elements.resetBtn.style.display = 'inline-block';
      return;
    }

    // Durum 4: Sonuçlar bulundu
    elements.emptyArea.style.display = 'none';

    // Öne çıkan yazıyı belirle (featured: true)
    let featuredPost = null;
    let gridPosts = filtered;

    // Yalnızca arama yapılmadığında veya öne çıkan yazı kriterlere uyuyorsa
    const featuredIndex = filtered.findIndex(p => p.featured === true);
    if (featuredIndex !== -1) {
      featuredPost = filtered[featuredIndex];
      gridPosts = filtered.filter((_, idx) => idx !== featuredIndex);
    }

    // Öne çıkan alanı render et
    if (featuredPost && elements.featuredArea) {
      elements.featuredArea.innerHTML = createPostCardHTML(featuredPost, true);
      elements.featuredArea.style.display = 'block';
    } else if (elements.featuredArea) {
      elements.featuredArea.innerHTML = '';
      elements.featuredArea.style.display = 'none';
    }

    // Grid alanını render et
    if (elements.gridArea) {
      if (gridPosts.length > 0) {
        elements.gridArea.innerHTML = gridPosts.map(p => createPostCardHTML(p, false)).join('');
        elements.gridArea.style.display = 'grid';
      } else {
        elements.gridArea.innerHTML = '';
        elements.gridArea.style.display = 'none';
      }
    }
  }

  // Filtreleri Sıfırlama Fonksiyonu
  function resetFilters() {
    searchQuery = '';
    currentSort = 'newest';

    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.searchClear) elements.searchClear.style.display = 'none';
    if (elements.sortSelect) elements.sortSelect.value = 'newest';

    renderArchive();
  }

  // Olay Dinleyicileri (Event Listeners)
  function initEvents() {
    // Arama Girdisi
    if (elements.searchInput) {
      let debounceTimer;
      elements.searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          searchQuery = e.target.value;
          if (elements.searchClear) {
            elements.searchClear.style.display = searchQuery ? 'inline-block' : 'none';
          }
          renderArchive();
        }, 120);
      });
    }

    // Arama Temizleme Butonu
    if (elements.searchClear) {
      elements.searchClear.addEventListener('click', () => {
        if (elements.searchInput) {
          elements.searchInput.value = '';
          elements.searchInput.focus();
        }
        searchQuery = '';
        elements.searchClear.style.display = 'none';
        renderArchive();
      });
    }

    // Sıralama Seçimi
    if (elements.sortSelect) {
      elements.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderArchive();
      });
    }

    // Boş Durum Sıfırlama Butonu
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener('click', resetFilters);
    }
  }

  // Veriyi Yükle ve Başlat
  async function loadPosts() {
    try {
      const response = await fetch('assets/posts.json?v=' + Date.now());
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      const data = await response.json();
      allPosts = Array.isArray(data) ? data : (data.posts || []);
      renderArchive();
    } catch (err) {
      console.warn('Yazı verisi yüklenemedi:', err);
      // Yerel dosya protokolünde veya ağ yokluğunda zarif boş durum göster
      allPosts = [];
      renderArchive();
    }
  }

  // ==========================================================================
  // Kaydedilen Notlar (Bookmark & Saved Posts) Sistemi
  // ==========================================================================
  const savedElements = {
    section: document.getElementById('kaydedilenler'),
    grid: document.getElementById('saved-grid'),
    empty: document.getElementById('saved-empty'),
    badge: document.getElementById('saved-count-badge'),
    navLink: document.getElementById('nav-saved-link')
  };

  // Güvenli Kayıt Listesi Okuma
  function getSavedPosts() {
    try {
      const raw = localStorage.getItem('dl_bookmarks');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // Kayıttan Çıkarma
  function removeSavedPost(targetSlug) {
    try {
      const list = getSavedPosts();
      const updated = list.filter(item => item.slug !== targetSlug && item.url !== targetSlug && item.id !== targetSlug);
      localStorage.setItem('dl_bookmarks', JSON.stringify(updated));
      renderSavedPosts();
    } catch (e) {}
  }

  // Kaydedilen Notlar Bölümünü Ekrana Bas
  function renderSavedPosts() {
    if (!savedElements.grid || !savedElements.empty) return;

    const savedPosts = getSavedPosts();
    const count = savedPosts.length;

    // Rozetleri ve Menü Noktasını Güncelle
    if (savedElements.badge) {
      if (count > 0) {
        savedElements.badge.textContent = `${count} Not`;
        savedElements.badge.style.display = 'inline-block';
      } else {
        savedElements.badge.style.display = 'none';
      }
    }

    if (savedElements.navLink) {
      if (count > 0) {
        savedElements.navLink.innerHTML = `Kaydedilenler <span class="nav-count-dot" title="${count} kaydedilmiş not">•</span>`;
      } else {
        savedElements.navLink.textContent = 'Kaydedilenler';
      }
    }

    // Durum 1: Hiç kayıt yoksa boş durum mesajı göster
    if (count === 0) {
      savedElements.grid.innerHTML = '';
      savedElements.grid.style.display = 'none';
      savedElements.empty.style.display = 'block';
      return;
    }

    // Durum 2: Kayıtlar var
    savedElements.empty.style.display = 'none';
    savedElements.grid.style.display = 'grid';

    savedElements.grid.innerHTML = savedPosts.map(post => {
      const title = escapeHTML(post.title || 'Başlıksız Not');
      const dateFormatted = escapeHTML(post.dateFormatted || formatDate(post.date));
      const excerpt = escapeHTML(post.excerpt || '');
      const readingTime = escapeHTML(post.readingTime || '');
      const url = escapeHTML(post.url || (post.slug ? `${post.slug}.html` : '#'));
      const slug = escapeHTML(post.slug || post.id || post.url);

      const imageUrl = post.image || post.coverImage;
      const imageAlt = escapeHTML(post.imageAlt || title);
      const imageHTML = (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '')
        ? `<div class="card-media"><img src="${escapeHTML(imageUrl)}" alt="${imageAlt}" loading="lazy"></div>`
        : '';

      return `
        <article class="post-card saved-card" data-slug="${slug}">
          ${imageHTML}
          <div class="card-content">
            <div class="card-meta-top">
              <button type="button" class="btn-remove-bookmark" data-slug="${slug}" aria-label="${title} yazısını kaydedilenlerden çıkar" title="Kaydedilenlerden çıkar">
                ✕ Kaldır
              </button>
            </div>
            <h3 class="card-title">
              <a href="${url}">${title}</a>
            </h3>
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

    // "Kaldır" butonlarına olay dinleyicisi ekle
    savedElements.grid.querySelectorAll('.btn-remove-bookmark').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const itemSlug = btn.getAttribute('data-slug');
        removeSavedPost(itemSlug);
      });
    });
  }

  function initSavedPosts() {
    renderSavedPosts();

    // Başka sekmede yer imi eklendiğinde/çıkarıldığında senkronize et
    window.addEventListener('storage', (e) => {
      if (e.key === 'dl_bookmarks') {
        renderSavedPosts();
      }
    });
  }

  // Başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initEvents();
      loadPosts();
      initSavedPosts();
    });
  } else {
    initEvents();
    loadPosts();
    initSavedPosts();
  }
})();
