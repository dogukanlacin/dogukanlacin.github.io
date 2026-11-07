/**
 * Doğukan'ın Notları — Markdown ve Pages CMS İçerik Derleme Sistemi
 * 
 * Bu betik:
 * 1. "content/posts/*.md" altındaki tüm Markdown yazılarını okur.
 * 2. YAML frontmatter ve Markdown içeriğini ayrıştırır.
 * 3. "post-template.html" şablonunu editoryal olarak doldurarak "<slug>.html" üretir.
 * 4. Mevcut "assets/posts.json" arşiv kayıtlarını günceller (eski yazıları korur).
 * 5. RSS ("feed.xml") ve Site Haritasını ("sitemap.xml") senkronize eder.
 * 6. İsteğe bağlı "--dest=_site" parametresi ile GitHub Pages dağıtım klasörünü hazırlar.
 * 
 * Kullanım:
 *   Yerel derleme: node scripts/build-posts.js
 *   Dağıtım çıktısı: node scripts/build-posts.js --dest=_site
 */

const fs = require('fs');
const path = require('path');

// Marked kütüphanesini yükle (yoksa güvenli yerel dönüştürücüye geri dön)
let marked;
try {
  marked = require('marked');
} catch (e) {
  marked = null;
}

const rootDir = path.resolve(__dirname, '..');
const contentDir = path.join(rootDir, 'content', 'posts');
const templatePath = path.join(rootDir, 'post-template.html');
const postsJsonPath = path.join(rootDir, 'assets', 'posts.json');
const buildRssPath = path.join(rootDir, 'scripts', 'build-rss.js');
const buildSitemapPath = path.join(rootDir, 'scripts', 'build-sitemap.js');

const siteConfig = {
  siteUrl: 'https://dogukanlacin.github.io/',
  defaultOgImage: 'assets/og-image.png',
  author: 'Doğukan Laçin'
};

// Komut Satırı Argümanlarını Çözümle (--dest=_site vb.)
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex).trim();
        const value = arg.slice(eqIndex + 1).trim();
        args[key] = value;
      } else {
        const key = arg.slice(2).trim();
        args[key] = true;
      }
    }
  });
  return args;
}

// Türkçe Karakter Uyumlu URL (Slug) Oluşturucu
function slugify(text) {
  if (!text) return '';
  const charMap = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u'
  };

  let str = text.trim();
  str = str.replace(/[çÇğĞıIİöÖşŞüÜ]/g, (c) => charMap[c] || c);
  str = str.toLowerCase();
  str = str.replace(/[^a-z0-9]+/g, '-');
  str = str.replace(/^-+|-+$/g, '');
  return str || 'yazi';
}

// Türkçe Tarih Formatlayıcı (2026-11-05 -> 5 Kasım 2026)
function formatTurkishDate(dateStr) {
  try {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return String(dateStr);
  } catch {
    return String(dateStr);
  }
}

// Bugünün Tarihi (YYYY-MM-DD)
function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// HTML Kaçış Yardımcısı
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Görsel Yollarını Normalleştir (Örn: "/assets/images/..." -> "assets/images/...")
function normalizeImagePath(imgUrl) {
  if (!imgUrl) return '';
  let clean = String(imgUrl).trim();
  // Tam HTTP URL ise olduğu gibi bırak
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean;
  }
  // Başındaki eğik çizgiyi kaldırarak göreceli yola çevir
  clean = clean.replace(/^\/+/, '');
  // Eğer sadece dosya adı verilmişse "assets/images/posts/" altına bağla
  if (!clean.includes('/')) {
    clean = `assets/images/posts/${clean}`;
  }
  return clean;
}

// YAML Frontmatter Ayrıştırıcı (Hafif ve Sıfır Bağımlılık)
function parseFrontmatter(fileContent) {
  const raw = fileContent.trimStart();
  if (!raw.startsWith('---')) {
    return { data: {}, body: raw };
  }

  const endMatch = raw.indexOf('\n---', 3);
  if (endMatch === -1) {
    return { data: {}, body: raw };
  }

  const frontmatterBlock = raw.substring(3, endMatch).trim();
  const body = raw.substring(endMatch + 4).trimStart();
  const data = {};

  const lines = frontmatterBlock.split(/\r?\n/);
  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#')) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Tırnak işaretlerini temizle
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Boolean ve sayısal tipleri çözümle
    if (value.toLowerCase() === 'true') {
      data[key] = true;
    } else if (value.toLowerCase() === 'false') {
      data[key] = false;
    } else if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      data[key] = value.substring(0, 10);
    } else {
      data[key] = value;
    }
  }

  return { data, body };
}

// Markdown -> HTML Dönüştürücü (Marked ile veya Dahili Yedek Dönüştürücü)
function renderMarkdown(markdownText) {
  if (!markdownText) return '';

  if (marked) {
    // Özel Renderer ile Editoryal Noir Figür Yapısı
    const renderer = new marked.Renderer();

    // Görsel formatı: <figure class="post-figure"><img ...><figcaption>...</figcaption></figure>
    renderer.image = function ({ href, title, text }) {
      const cleanSrc = normalizeImagePath(href);
      const captionHtml = text ? `\n        <figcaption>${escapeHtml(text)}</figcaption>` : '';
      return `\n      <figure class="post-figure">\n        <img src="${cleanSrc}" alt="${escapeHtml(text || title || '')}" loading="lazy">${captionHtml}\n      </figure>\n`;
    };

    // Alıntı blokları (blockquote)
    renderer.blockquote = function ({ tokens }) {
      const quoteBody = this.parser.parse(tokens);
      return `\n      <blockquote>\n        ${quoteBody.trim()}\n      </blockquote>\n`;
    };

    marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: false
    });

    let html = marked.parse(markdownText);

    // Tüm paragraflar eşit ve tutarlı tipografiyle işlenir

    return html;
  }

  // Yedek Basit Markdown Dönüştürücü (Marked yüklenemezse)
  let html = markdownText
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/^> (.*$)/gim, '<blockquote><p>$1</p></blockquote>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
      const cleanSrc = normalizeImagePath(src);
      const figCaption = alt ? `<figcaption>${escapeHtml(alt)}</figcaption>` : '';
      return `<figure class="post-figure"><img src="${cleanSrc}" alt="${escapeHtml(alt)}" loading="lazy">${figCaption}</figure>`;
    })
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

  const paragraphs = html.split(/\n\s*\n/).filter(p => p.trim());
  let formatted = '';
  paragraphs.forEach((p, idx) => {
    p = p.trim();
    if (p.startsWith('<h') || p.startsWith('<blockquote') || p.startsWith('<figure')) {
      formatted += `${p}\n\n`;
    } else {
      formatted += `<p>${p}</p>\n\n`;
    }
  });

  return formatted;
}

// Okuma Süresi Hesaplayıcı (~200 kelime/dakika)
function calculateReadingTime(text) {
  if (!text) return '1 dk okuma';
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/[#*_`>~-]/g, ' ');
  const words = clean.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} dk okuma`;
}

// Dizin Kopyalama Yardımcısı (Özyinelemeli)
function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Ana Derleme Fonksiyonu
function buildAllPosts() {
  const args = parseArgs();
  const destDir = args.dest ? path.resolve(rootDir, args.dest) : null;

  console.log('--- DOĞUKAN\'IN NOTLARI — İÇERİK DERLEME SİSTEMİ ---');
  if (destDir) {
    console.log(`Hedef Dağıtım Klasörü: ${destDir}`);
  }

  // 1. Şablon dosyasını kontrol et
  if (!fs.existsSync(templatePath)) {
    console.error('❌ Hata: post-template.html şablonu bulunamadı!');
    process.exit(1);
  }
  const baseTemplateHtml = fs.readFileSync(templatePath, 'utf8');

  // 2. Mevcut posts.json verisini oku (Hiçbir eski yazıyı kaybetme!)
  let existingPosts = [];
  try {
    if (fs.existsSync(postsJsonPath)) {
      const raw = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
      existingPosts = Array.isArray(raw) ? raw : (raw.posts || []);
    }
  } catch (err) {
    console.warn('⚠️  posts.json okunamadı, boş başlatılıyor.');
    existingPosts = [];
  }

  // 3. "content/posts/" dizinini kontrol et
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  const postFiles = fs.readdirSync(contentDir).filter(f => f.endsWith('.md') && !f.startsWith('.'));
  console.log(`Bulunan Markdown Yazı Sayısı: ${postFiles.length}`);

  const compiledPosts = [];
  const processedSlugs = new Set();

  for (const fileName of postFiles) {
    const filePath = path.join(contentDir, fileName);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, body } = parseFrontmatter(fileContent);

    const title = data.title || path.basename(fileName, '.md');
    // Slug: Öncelik frontmatter.slug, ardından dosya adı, ardından başlıktan üretilen slug
    const fileSlug = path.basename(fileName, '.md');
    const slug = slugify(data.slug || fileSlug || title);

    if (processedSlugs.has(slug)) {
      console.warn(`⚠️  Yinelenen slug atlandı: ${slug} (${fileName})`);
      continue;
    }
    processedSlugs.add(slug);

    const date = data.date || getTodayISO();
    const formattedDate = formatTurkishDate(date);
    const excerpt = data.excerpt || '';
    const coverImage = normalizeImagePath(data.coverImage || data.image || '');
    const imageAlt = data.imageAlt || title;
    const featured = Boolean(data.featured);
    const seoTitle = data.seoTitle || title;
    const seoDescription = data.seoDescription || excerpt;

    const fullPostUrl = `${siteConfig.siteUrl}${slug}`;
    const readingTime = calculateReadingTime(body);

    // Markdown gövdesini HTML'e çevir
    const renderedBodyHtml = renderMarkdown(body);

    // post-template.html içeriğini doldur
    let postHtml = baseTemplateHtml;

    // Başlık ve Meta Etiketleri
    const pageTitle = seoTitle.includes("Doğukan'ın Notları")
      ? seoTitle
      : `${seoTitle} — Doğukan'ın Notları`;

    postHtml = postHtml
      .replace(/<title>\[Yazı Başlığı\] — Doğukan'ın Notları<\/title>/g, `<title>${escapeHtml(pageTitle)}<\/title>`)
      .replace(/<meta property="og:title" content="\[Yazı Başlığı\] — Doğukan'ın Notları">/g, `<meta property="og:title" content="${escapeHtml(pageTitle)}">`)
      .replace(/<meta name="twitter:title" content="\[Yazı Başlığı\] — Doğukan'ın Notları">/g, `<meta name="twitter:title" content="${escapeHtml(pageTitle)}">`)
      .replace(/"headline": "\[Yazı Başlığı\]"/g, `"headline": "${escapeHtml(title).replace(/"/g, '\\"')}"`)
      .replace(/"description": "\[Yazının kısa özeti veya giriş cümlesi buraya gelecek\.\]"/g, `"description": "${escapeHtml(seoDescription || excerpt || title).replace(/"/g, '\\"')}"`)
      .replace(/\[Yazı Başlığı\]/g, escapeHtml(title))
      .replace(/\[Yazının kısa özeti veya giriş cümlesi buraya gelecek\.\]/g, escapeHtml(seoDescription || excerpt || title))
      .replace(/\[Yazının kısa özeti buraya gelecek\.\]/g, escapeHtml(seoDescription || excerpt || title))
      .replace(/https:\/\/dogukanlacin\.github\.io\/yazi-adresi(\.html)?/g, fullPostUrl)
      .replace(/<h1 class="post-title">\[Yazının Başlığı Buraya Gelecek\]<\/h1>/g, `<h1 class="post-title">${escapeHtml(title)}</h1>`)
      .replace(/<p class="post-subtitle">\[Yazının açılış özeti, edebi alt başlığı veya giriş cümlesi buraya yazılabilir\.\]<\/p>/g, excerpt ? `<p class="post-subtitle">${escapeHtml(excerpt)}</p>` : "")
      .replace(/<time datetime="2026-11-05">5 Kasım 2026<\/time>/g, `<time datetime="${date}">${formattedDate}</time>`)
      .replace(/2026-11-05T09:00:00\+03:00/g, `${date}T09:00:00+03:00`);

    // Statik Paylaşım Bağlantıları
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(fullPostUrl);
    const encodedWhatsApp = encodeURIComponent(`${title} — ${fullPostUrl}`);

    postHtml = postHtml
      .replace(
        /href="https:\/\/twitter\.com\/intent\/tweet"/g,
        `href="https://twitter.com/intent/tweet?text=${encodedTitle}&amp;url=${encodedUrl}"`
      )
      .replace(
        /href="https:\/\/www\.linkedin\.com\/sharing\/share-offsite\/"/g,
        `href="https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}"`
      )
      .replace(
        /href="https:\/\/api\.whatsapp\.com\/send"/g,
        `href="https://api.whatsapp.com/send?text=${encodedWhatsApp}"`
      );

    // Kapak Görseli ve Sosyal Paylaşım Görselleri
    const effectiveSocialImage = coverImage || siteConfig.defaultOgImage;
    const fullSocialImageUrl = effectiveSocialImage.startsWith('http')
      ? effectiveSocialImage
      : siteConfig.siteUrl + effectiveSocialImage.replace(/^\/+/, '');

    if (coverImage) {
      postHtml = postHtml.replace(
        /content="https:\/\/dogukanlacin\.github\.io\/assets\/og-image\.png"/g,
        `content="${fullSocialImageUrl}"`
      );
      postHtml = postHtml.replace(
        /"image": "https:\/\/dogukanlacin\.github\.io\/assets\/og-image\.png"/g,
        `"image": "${fullSocialImageUrl}"`
      );
      postHtml = postHtml.replace(
        new RegExp(`<meta property="og:image:alt" content=".*?">`, 'g'),
        `<meta property="og:image:alt" content="${escapeHtml(imageAlt)} — Doğukan'ın Notları">`
      );
      postHtml = postHtml.replace(
        new RegExp(`<meta name="twitter:image:alt" content=".*?">`, 'g'),
        `<meta name="twitter:image:alt" content="${escapeHtml(imageAlt)} — Doğukan'ın Notları">`
      );

      const coverFigureHtml = `      <!-- Kapak Görseli -->\n      <figure class="post-cover">\n        <img src="${coverImage}" alt="${escapeHtml(imageAlt)}" loading="eager">\n      </figure>\n`;
      postHtml = postHtml.replace(/<!-- KAPAK_GORSELI_ALANI -->/g, coverFigureHtml).replace(/<!-- Kapak Görseli Alanı[\s\S]*?-->/g, coverFigureHtml);
    } else {
      postHtml = postHtml.replace(/<!-- KAPAK_GORSELI_ALANI -->/g, "").replace(/<!-- Kapak Görseli Alanı[\s\S]*?-->/g, "");
    }

    // Yazı Gövdesini Yerleştir
    const postBodyRegex = /<div class="post-body" id="post-body">[\s\S]*?<\/div>/;
    const newPostBody = `<div class="post-body" id="post-body">\n${renderedBodyHtml}\n      </div>`;
    postHtml = postHtml.replace(postBodyRegex, newPostBody);

    // Dosyayı kök dizine kaydet: <slug>.html
    const targetHtmlPath = path.join(rootDir, `${slug}.html`);
    fs.writeFileSync(targetHtmlPath, postHtml, 'utf8');

    // Eğer --dest belirtilmişse hedef klasöre de kaydet
    if (destDir) {
      fs.mkdirSync(destDir, { recursive: true });
      fs.writeFileSync(path.join(destDir, `${slug}.html`), postHtml, 'utf8');
    }

    compiledPosts.push({
      title,
      slug,
      date,
      excerpt,
      readingTime,
      image: coverImage,
      imageAlt,
      coverImage,
      featured,
      url: slug
    });

    console.log(` ✔ Derlendi: ${slug}.html (${formattedDate})`);
  }

  // 4. assets/posts.json Güncelleme (Birleştirme Mantığı)
  // Mevcut kayıtları koru, güncellenenleri üzerine yaz, yenileri ekle
  const mergedPostsMap = new Map();

  // Önce mevcut kayıtları ekle
  for (const post of existingPosts) {
    const key = post.slug || (post.url ? post.url.replace(/\.html$/, '') : null);
    if (key) {
      mergedPostsMap.set(key, post);
    }
  }

  // Ardından derlenen markdown kayıtlarıyla güncelle/ekle
  for (const post of compiledPosts) {
    mergedPostsMap.set(post.slug, post);
  }

  // Tarihe göre azalan (en yeni en başta) sırala
  const finalPosts = Array.from(mergedPostsMap.values()).sort((a, b) => {
    const dateA = new Date(a.date || '1970-01-01').getTime();
    const dateB = new Date(b.date || '1970-01-01').getTime();
    return dateB - dateA;
  });

  fs.writeFileSync(postsJsonPath, JSON.stringify(finalPosts, null, 2), 'utf8');
  console.log(`\n📄 assets/posts.json güncellendi. Toplam kayıt: ${finalPosts.length}`);

  // 5. RSS ve Site Haritasını Güncelle
  try {
    delete require.cache[require.resolve(buildRssPath)];
    require(buildRssPath);
  } catch (err) {
    console.warn('⚠️  RSS oluşturulurken bir uyarı oluştu:', err.message);
  }

  try {
    delete require.cache[require.resolve(buildSitemapPath)];
    const sitemapModule = require(buildSitemapPath);
    if (typeof sitemapModule.generateSitemap === 'function') {
      sitemapModule.generateSitemap();
    }
  } catch (err) {
    console.warn('⚠️  Sitemap oluşturulurken bir uyarı oluştu:', err.message);
  }

  // 6. Dağıtım Klasörü Hazırlığı (--dest belirtildiyse)
  if (destDir) {
    console.log('\n📦 Dağıtım klasörü senkronize ediliyor...');
    fs.mkdirSync(destDir, { recursive: true });

    // Ana statik dosyaları kopyala
    const staticFiles = ['index.html', 'about.html', '404.html', 'favicon.ico', 'robots.txt', 'feed.xml', 'sitemap.xml'];
    for (const file of staticFiles) {
      const src = path.join(rootDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(destDir, file));
      }
    }

    // assets dizinini kopyala
    copyDirSync(path.join(rootDir, 'assets'), path.join(destDir, 'assets'));

    // Kök dizindeki diğer mevcut .html yazılarını kopyala
    const rootHtmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html') && f !== 'post-template.html');
    for (const htmlFile of rootHtmlFiles) {
      fs.copyFileSync(path.join(rootDir, htmlFile), path.join(destDir, htmlFile));
    }

    console.log(`✅ Dağıtım klasörü "${destDir}" başarıyla hazırlandı.`);
  }

  console.log('\n✨ İŞLEM BAŞARIYLA TAMAMLANDI!\n');
}

if (require.main === module) {
  buildAllPosts();
}

module.exports = { buildAllPosts };
