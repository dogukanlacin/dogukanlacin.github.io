/**
 * Doğukan'ın Notları — Yeni Yazı Oluşturma ve Yayımlama Otomasyonu
 * 
 * Bu betik:
 * 1. Başlıktan SEO dostu temiz bir dosya adı (slug) üretir.
 * 2. post-template.html şablonunu kullanarak yeni HTML sayfasını hazırlar.
 * 3. assets/posts.json dosyasına yeni yazı kaydını ekler.
 * 4. feed.xml RSS beslemesini otomatik günceller.
 * 5. Aynı isimde yazı varsa üzerine yazmaz, uyarır.
 * 
 * Kullanım:
 *   İnteraktif: node scripts/new-post.js
 *   Parametreli: node scripts/new-post.js --title="Başlık" --category="Denemeler" --excerpt="Özet"
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.resolve(__dirname, '..');
const templatePath = path.join(rootDir, 'post-template.html');
const postsJsonPath = path.join(rootDir, 'assets', 'posts.json');
const buildRssPath = path.join(rootDir, 'scripts', 'build-rss.js');
const buildSitemapPath = path.join(rootDir, 'scripts', 'build-sitemap.js');

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

// Tarih Formatlayıcı (2026-11-05 -> 5 Kasım 2026)
function formatTurkishDate(dateStr) {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
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

// Komut Satırı Argümanlarını Çözümle
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const eqIndex = arg.indexOf('=');
      if (eqIndex !== -1) {
        const key = arg.slice(2, eqIndex).trim();
        const value = arg.slice(eqIndex + 1).trim();
        args[key] = value;
      }
    }
  });
  return args;
}

// Yeni Yazı Üretim Ana Fonksiyonu
function createPost(options) {
  const {
    title,
    category,
    excerpt,
    date = getTodayISO(),
    coverImage = '',
    ogImage = '',
    imageAlt = '',
    featured = false
  } = options;

  if (!title || title.trim() === '') {
    console.error('\n❌ Hata: Yazı başlığı boş bırakılamaz.');
    process.exit(1);
  }

  const slug = slugify(title);
  const targetHtmlPath = path.join(rootDir, `${slug}.html`);

  // 1. Çakışma Kontrolü (Collision Guard)
  if (fs.existsSync(targetHtmlPath)) {
    console.error(`\n⚠️  UYARI: "${slug}.html" adında bir yazı dosyası zaten mevcut!`);
    console.error('Mevcut yazıyı korumak için işlem iptal edildi. Lütfen farklı bir başlık seçiniz.\n');
    process.exit(1);
  }

  // 2. assets/posts.json Dosyasını Kontrol Et
  let posts = [];
  try {
    if (fs.existsSync(postsJsonPath)) {
      const data = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
      posts = Array.isArray(data) ? data : (data.posts || []);
    }
  } catch (err) {
    posts = [];
  }

  const slugExists = posts.some(p => p.slug === slug || p.url === `${slug}.html`);
  if (slugExists) {
    console.error(`\n⚠️  UYARI: "${slug}" arşiv kayıtlarında zaten bulunuyor! İşlem iptal edildi.\n`);
    process.exit(1);
  }

  // 3. post-template.html Şablonunu Oku ve Değiştir
  if (!fs.existsSync(templatePath)) {
    console.error('\n❌ Hata: post-template.html şablon dosyası bulunamadı!');
    process.exit(1);
  }

  let templateHtml = fs.readFileSync(templatePath, 'utf8');
  const formattedDate = formatTurkishDate(date);
  const siteUrl = 'https://dogukanlacin.github.io/';
  const fullPostUrl = `${siteUrl}${slug}.html`;

  // Şablon alanlarını değiştir
  templateHtml = templateHtml
    .replace(/\[Yazı Başlığı\]/g, title)
    .replace(/\[Yazının kısa özeti veya giriş cümlesi buraya gelecek\.\]/g, excerpt || title)
    .replace(/\[Yazının kısa özeti buraya gelecek\.\]/g, excerpt || title)
    .replace(/https:\/\/dogukanlacin\.github\.io\/yazi-adresi\.html/g, fullPostUrl)
    .replace(/<span class="post-category">\[Kategori Adı\]<\/span>/g, `<span class="post-category">${category}</span>`)
    .replace(/content="\[Kategori Adı\]"/g, `content="${category}"`)
    .replace(/"articleSection": "\[Kategori Adı\]"/g, `"articleSection": "${category}"`)
    .replace(/<h1 class="post-title">\[Yazının Başlığı Buraya Gelecek\]<\/h1>/g, `<h1 class="post-title">${title}</h1>`)
    .replace(/<p class="post-subtitle">\[Yazının açılış özeti, edebi alt başlığı veya giriş cümlesi buraya yazılabilir\.\]<\/p>/g, `<p class="post-subtitle">${excerpt || ''}</p>`)
    .replace(/<time datetime="2026-11-05">5 Kasım 2026<\/time>/g, `<time datetime="${date}">${formattedDate}</time>`)
    .replace(/2026-11-05T09:00:00\+03:00/g, `${date}T09:00:00+03:00`);

  // Statik Paylaşım Bağlantılarını Doldur (Progressive Enhancement)
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(fullPostUrl);
  const encodedWhatsApp = encodeURIComponent(`${title} — ${fullPostUrl}`);

  templateHtml = templateHtml
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

  const imagePath = options.image || options.coverImage || '';
  const resolvedImageAlt = options.imageAlt || title;

  // Görsel Açıklaması (Alt Metni) Varsa Meta Etiketleri Güncelle
  if (options.imageAlt && options.imageAlt.trim() !== '') {
    templateHtml = templateHtml
      .replace(
        new RegExp(`<meta property="og:image:alt" content="${title} — Doğukan'ın Notları">`, 'g'),
        `<meta property="og:image:alt" content="${resolvedImageAlt}">`
      )
      .replace(
        new RegExp(`<meta name="twitter:image:alt" content="${title} — Doğukan'ın Notları">`, 'g'),
        `<meta name="twitter:image:alt" content="${resolvedImageAlt}">`
      );
  }

  // Özel OG Görseli veya Kapak Görseli Varsa Meta Etiketlerine Ekle
  const effectiveSocialImage = options.ogImage || imagePath || '';
  if (effectiveSocialImage && effectiveSocialImage.trim() !== '') {
    const fullSocialImageUrl = effectiveSocialImage.startsWith('http') ? effectiveSocialImage : siteUrl + effectiveSocialImage.replace(/^\//, '');
    templateHtml = templateHtml.replace(
      /content="https:\/\/dogukanlacin\.github\.io\/assets\/og-image\.png"/g,
      `content="${fullSocialImageUrl}"`
    );
    templateHtml = templateHtml.replace(
      /"image": "https:\/\/dogukanlacin\.github\.io\/assets\/og-image\.png"/g,
      `"image": "${fullSocialImageUrl}"`
    );
  }

  // Kapak görseli varsa HTML şablonuna ekle
  if (imagePath && imagePath.trim() !== '') {
    const coverFigureHtml = `      <!-- Kapak Görseli -->\n      <figure class="post-cover">\n        <img src="${imagePath}" alt="${resolvedImageAlt}" loading="eager">\n      </figure>\n`;
    templateHtml = templateHtml.replace(
      /<!-- Kapak Görseli Alanı[\s\S]*?-->/g,
      coverFigureHtml
    );
  }

  // 4. Yeni HTML Dosyasını Kaydet
  fs.writeFileSync(targetHtmlPath, templateHtml, 'utf8');

  // 5. assets/posts.json Dosyasına Ekle
  const newPostEntry = {
    title,
    slug,
    category,
    date,
    excerpt: excerpt || '',
    readingTime: '3 dk okuma',
    image: imagePath,
    imageAlt: imageAlt,
    coverImage: imagePath,
    featured: Boolean(featured),
    url: `${slug}.html`
  };

  posts.unshift(newPostEntry); // En yeni yazıyı en başa ekle
  fs.writeFileSync(postsJsonPath, JSON.stringify(posts, null, 2), 'utf8');

  // 6. RSS feed.xml ve Sitemap sitemap.xml Dosyalarını Güncelle
  try {
    delete require.cache[require.resolve(buildRssPath)];
    require(buildRssPath);
  } catch (err) {
    console.warn('⚠️  RSS betiği çalıştırılırken bir uyarı oluştu:', err.message);
  }

  try {
    delete require.cache[require.resolve(buildSitemapPath)];
    const sitemapModule = require(buildSitemapPath);
    if (typeof sitemapModule.generateSitemap === 'function') {
      sitemapModule.generateSitemap();
    }
  } catch (err) {
    console.warn('⚠️  Sitemap betiği çalıştırılırken bir uyarı oluştu:', err.message);
  }

  // Başarı Raporu
  console.log('\n======================================================');
  console.log(' ✨ YENİ NOT BAŞARIYLA OLUŞTURULDU!');
  console.log('======================================================');
  console.log(` 📄 Dosya:        ${slug}.html`);
  console.log(` 📌 Başlık:       ${title}`);
  console.log(` 🏷️  Kategori:     ${category}`);
  console.log(` 📅 Tarih:        ${formattedDate} (${date})`);
  console.log(` 🔗 Arşiv Kaydı:  assets/posts.json dosyasına eklendi.`);
  console.log(` 📡 RSS Besleme:  feed.xml güncellendi.`);
  console.log(` 🗺️  Site Haritası: sitemap.xml güncellendi.`);
  console.log('------------------------------------------------------');
  console.log(' 📝 Sonraki Adım:');
  console.log(`   "${slug}.html" dosyasını açıp "#post-body" alanına`);
  console.log('   yazınızın paragraflarını yazabilirsiniz.');
  console.log('======================================================\n');
}

// İnteraktif Soru-Cevap Arayüzü
function promptInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const categories = [
    'İnsan ve Toplum',
    'Hukuk ve Adalet',
    'Denemeler'
  ];

  console.log('\n--- DOĞUKAN\'IN NOTLARI — YENİ YAZI EDİTÖRÜ ---');
  console.log('Lütfen aşağıdaki adımları doldurun (İptal etmek için Ctrl+C):\n');

  rl.question('1. Yazı Başlığı: ', (title) => {
    if (!title || title.trim() === '') {
      console.log('❌ Başlık boş bırakılamaz.');
      rl.close();
      return;
    }

    console.log('\n2. Kategori Seçiniz:');
    categories.forEach((cat, idx) => console.log(`   [${idx + 1}] ${cat}`));
    rl.question('   Seçiminiz (1/2/3) [1]: ', (catChoice) => {
      let category = categories[0];
      const parsedChoice = parseInt(catChoice.trim(), 10);
      if (parsedChoice >= 1 && parsedChoice <= categories.length) {
        category = categories[parsedChoice - 1];
      }

      rl.question('\n3. Kısa Özet / Alt Başlık: ', (excerpt) => {
        const today = getTodayISO();
        rl.question(`\n4. Yayın Tarihi (YYYY-AA-GG) [${today}]: `, (dateInput) => {
          const date = dateInput.trim() || today;

          rl.question('\n5. Kapak Görseli Yolu (İsteğe bağlı, boş bırakabilirsiniz): ', (cover) => {
            rl.question('\n6. Öne Çıkan Not mu? (e/h) [h]: ', (featuredInput) => {
              const isFeatured = featuredInput.trim().toLowerCase() === 'e';

              rl.close();

              createPost({
                title: title.trim(),
                category,
                excerpt: excerpt.trim(),
                date,
                coverImage: cover.trim(),
                featured: isFeatured
              });
            });
          });
        });
      });
    });
  });
}

// Başlatıcı
const cliArgs = parseArgs();
if (cliArgs.title) {
  createPost({
    title: cliArgs.title,
    category: cliArgs.category || 'İnsan ve Toplum',
    excerpt: cliArgs.excerpt || '',
    date: cliArgs.date || getTodayISO(),
    image: cliArgs.image || cliArgs.cover || '',
    imageAlt: cliArgs.imageAlt || cliArgs.title,
    coverImage: cliArgs.image || cliArgs.cover || '',
    featured: cliArgs.featured === 'true' || cliArgs.featured === '1' || cliArgs.featured === 'e'
  });
} else {
  promptInteractive();
}
