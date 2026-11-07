/**
 * Doğukan'ın Notları — Pages CMS ve İçerik Derleme Entegrasyon Testi
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const testPostPath = path.join(rootDir, 'content', 'posts', 'sessizligin-icindeki-dusunce.md');
const generatedHtmlPath = path.join(rootDir, 'sessizligin-icindeki-dusunce.html');
const postsJsonPath = path.join(rootDir, 'assets', 'posts.json');
const feedXmlPath = path.join(rootDir, 'feed.xml');
const sitemapXmlPath = path.join(rootDir, 'sitemap.xml');
const siteDir = path.join(rootDir, '_site');

let passedTests = 0;
let totalTests = 0;
const originalPostsJson = fs.existsSync(postsJsonPath) ? fs.readFileSync(postsJsonPath, 'utf8') : '[]';

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✔ [BAŞARILI] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [BAŞARISIZ] ${message}`);
    process.exitCode = 1;
  }
}

console.log('============================================================');
console.log(' DOĞUKAN\'IN NOTLARI — PAGES CMS & DERLEME DOĞRULAMA TESTİ');
console.log('============================================================\n');

try {
  // 1. .pages.yml Yapılandırma Doğrulaması
  console.log('1. TEST: .pages.yml Yapılandırma Analizi');
  const pagesYmlContent = fs.readFileSync(path.join(rootDir, '.pages.yml'), 'utf8');
  assert(pagesYmlContent.includes('actions:'), '.pages.yml actions alanı tanımlı');
  assert(pagesYmlContent.includes('deploy-site'), 'deploy-site eylemi tanımlı');
  assert(pagesYmlContent.includes('Siteyi Yayınla'), 'Siteyi Yayınla etiketi mevcut');
  assert(pagesYmlContent.includes('media:'), '.pages.yml media alanı tanımlı');
  assert(pagesYmlContent.includes('assets/images/posts'), 'Görsel yükleme yolu assets/images/posts olarak ayarlanmış');
  assert(pagesYmlContent.includes('content/posts'), 'Koleksiyon yolu content/posts olarak ayarlanmış');
  assert(pagesYmlContent.includes('name: title'), 'title alanı mevcut');
  assert(pagesYmlContent.includes('name: excerpt'), 'excerpt alanı mevcut');
  assert(pagesYmlContent.includes('name: date'), 'date alanı mevcut');
  assert(pagesYmlContent.includes('name: coverImage'), 'coverImage alanı mevcut');
  assert(pagesYmlContent.includes('name: imageAlt'), 'imageAlt alanı mevcut');
  assert(pagesYmlContent.includes('name: featured'), 'featured alanı mevcut');
  assert(pagesYmlContent.includes('name: seoTitle'), 'seoTitle alanı mevcut');
  assert(pagesYmlContent.includes('name: seoDescription'), 'seoDescription alanı mevcut');
  assert(pagesYmlContent.includes('name: body'), 'body alanı mevcut');
  assert(!pagesYmlContent.toLowerCase().includes('category'), 'Kategori sistemi kesinlikle eklenmemiş (Kural korundu)');

  // 2. .github/workflows/publish.yml Doğrulaması
  console.log('\n2. TEST: GitHub Actions Workflow Doğrulaması');
  const workflowContent = fs.readFileSync(path.join(rootDir, '.github', 'workflows', 'publish.yml'), 'utf8');
  assert(workflowContent.includes('actions/upload-pages-artifact@v3'), 'Resmî actions/upload-pages-artifact@v3 kullanılıyor');
  assert(workflowContent.includes('actions/deploy-pages@v4'), 'Resmî actions/deploy-pages@v4 kullanılıyor');
  assert(workflowContent.includes('pages: write'), 'Gerekli pages: write izni tanımlı');
  assert(workflowContent.includes('id-token: write'), 'Gerekli id-token: write izni tanımlı');
  assert(workflowContent.includes('scripts/build-posts.js --dest=_site'), 'Derleme komutu doğru parametrelerle çağrılıyor');
  assert(workflowContent.includes('workflow_dispatch:'), 'workflow_dispatch payload girdisi tanımlı');
  assert(workflowContent.includes('branches: ["main"]'), 'Yalnızca gerçek varsayılan dal (main) dinleniyor');

  // 3. Test Markdown Yazısı Oluştur
  console.log('\n3. TEST: Örnek Markdown Yazı Oluşturma ve Derleme');
  const testMarkdown = `---
title: Sessizliğin İçindeki Düşünce
excerpt: Bazen en derin yanıtlar, en sessiz anlarda yankılanır.
date: 2026-11-05
coverImage: /assets/images/posts/ornek-kapak.webp
imageAlt: Loş ışıkta düşünen bir yazar silüeti
featured: true
seoTitle: Sessizliğin İçindeki Düşünce — Özel SEO Başlığı
seoDescription: Yalnızlık ve sessizlik üzerine kaleme alınmış editoryal bir deneme.
---

Gürültülü bir dünyada sessiz kalabilmek, insanın kendine verebileceği en samimi hediyedir. Herkesin bir şeyler söylediği, herkesin fikir beyan ettiği bu çağda susup dinlemek giderek kaybolan bir erdeme dönüştü.

Peki içimizdeki o derin yankıyı en son ne zaman duyduk?

## Sessizliğin Dili

Sessizlik bir yokluk değildir; aksine, en saf varlık halidir. İnsan kalabalıktan çekildiğinde kendi zihninin kıvrımlarında dolaşma cesareti bulur.

> "Bazen kelimelerin bittiği yerde hakiki düşünce başlar."

![Yazı İçi Görsel Denemesi](/assets/images/posts/yazi-ici-gorsel.webp)
`;
  fs.writeFileSync(testPostPath, testMarkdown, 'utf8');
  assert(fs.existsSync(testPostPath), 'Örnek Markdown yazı dosyası oluşturuldu');

  // 4. Derleyiciyi Çalıştır
  console.log('\n4. TEST: Derleyici Betiği Çalıştırma (scripts/build-posts.js)');
  const buildOutput = execSync(`node "${path.join(rootDir, 'scripts', 'build-posts.js')}" --dest=_site`, {
    cwd: rootDir,
    encoding: 'utf8'
  });

  // 5. Üretilen HTML Dosyasını Doğrula
  console.log('\n5. TEST: Üretilen HTML Dosyası Doğrulaması');
  assert(fs.existsSync(generatedHtmlPath), 'sessizligin-icindeki-dusunce.html kök dizinde üretildi');
  assert(fs.existsSync(path.join(siteDir, 'sessizligin-icindeki-dusunce.html')), '_site dizininde üretildi');

  const generatedHtml = fs.readFileSync(generatedHtmlPath, 'utf8');
  assert(generatedHtml.includes('Sessizliğin İçindeki Düşünce — Özel SEO Başlığı'), 'SEO başlığı doğru uygulandı');
  assert(generatedHtml.includes('<h1 class="post-title">Sessizliğin İçindeki Düşünce</h1>'), 'Yazı başlığı doğru');
  assert(generatedHtml.includes('Bazen en derin yanıtlar, en sessiz anlarda yankılanır.'), 'Alt başlık doğru');
  assert(!generatedHtml.includes('class="lead"'), 'İlk paragraf doğal ve eşit tipografiyle üretildi');
  assert(generatedHtml.includes('<h2>Sessizliğin Dili</h2>'), 'H2 ara başlığı doğru üretildi');
  assert(generatedHtml.includes('<blockquote>'), 'Alıntı bloğu (blockquote) doğru üretildi');
  assert(generatedHtml.includes('class="post-cover"'), 'Kapak görseli figure yapısıyla eklendi');
  assert(generatedHtml.includes('class="post-figure"'), 'Yazı içi görsel figure yapısıyla eklendi');
  assert(generatedHtml.includes('<figcaption>Yazı İçi Görsel Denemesi</figcaption>'), 'Görsel alt metni figcaption olarak eklendi');
  assert(generatedHtml.includes('https://twitter.com/intent/tweet?text='), 'X (Twitter) paylaşım URL üretimi doğru');
  assert(generatedHtml.includes('https://www.linkedin.com/sharing/share-offsite/?url='), 'LinkedIn paylaşım URL üretimi doğru');
  assert(generatedHtml.includes('id="reading-settings-panel"'), 'Okuma ayarları paneli korunuyor');
  assert(generatedHtml.includes('data-dl-theme'), 'Sepia / Tema erken yükleyici korunuyor');

  // 6. assets/posts.json Doğrulaması
  console.log('\n6. TEST: assets/posts.json Doğrulaması');
  const postsJson = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
  const foundInJson = postsJson.find(p => p.slug === 'sessizligin-icindeki-dusunce');
  assert(Boolean(foundInJson), 'posts.json dizisi yeni yazıyı içeriyor');
  assert(foundInJson && foundInJson.title === 'Sessizliğin İçindeki Düşünce', 'Kayıt başlığı doğru');
  assert(foundInJson && foundInJson.slug === 'sessizligin-icindeki-dusunce', 'Slug doğru üretilmiş');
  assert(foundInJson && foundInJson.featured === true, 'Öne çıkan (featured) bayrağı doğru');
  assert(foundInJson && (foundInJson.url === 'sessizligin-icindeki-dusunce' || foundInJson.url === 'sessizligin-icindeki-dusunce.html'), 'URL doğru');

  // 7. RSS ve Site Haritası Doğrulaması
  console.log('\n7. TEST: RSS (feed.xml) ve Sitemap (sitemap.xml) Doğrulaması');
  const feedContent = fs.readFileSync(feedXmlPath, 'utf8');
  assert(feedContent.includes('sessizligin-icindeki-dusunce'), 'feed.xml yeni yazıyı içeriyor');
  assert(feedContent.includes('Sessizliğin İçindeki Düşünce'), 'feed.xml yazı başlığını içeriyor');

  const sitemapContent = fs.readFileSync(sitemapXmlPath, 'utf8');
  assert(sitemapContent.includes('https://dogukanlacin.github.io/sessizligin-icindeki-dusunce'), 'sitemap.xml yeni yazıyı içeriyor');

  // 8. Dağıtım Klasörü (_site) Doğrulaması
  console.log('\n8. TEST: Dağıtım Paketi (_site) Doğrulaması');
  assert(fs.existsSync(path.join(siteDir, 'index.html')), '_site/index.html mevcut');
  assert(fs.existsSync(path.join(siteDir, '404.html')), '_site/404.html mevcut');
  assert(fs.existsSync(path.join(siteDir, 'feed.xml')), '_site/feed.xml mevcut');
  assert(fs.existsSync(path.join(siteDir, 'sitemap.xml')), '_site/sitemap.xml mevcut');
  assert(fs.existsSync(path.join(siteDir, 'assets', 'posts.json')), '_site/assets/posts.json mevcut');
  assert(fs.existsSync(path.join(siteDir, 'assets', 'style.css')), '_site/assets/style.css mevcut');

} finally {
  // 9. Temizlik (Test verilerini temizle ve repo durumunu sıfırla)
  console.log('\n9. AŞAMA: Test Verilerinin Temizlenmesi (Kural: Test yazısı yayımlanmamalı)');
  if (fs.existsSync(testPostPath)) fs.unlinkSync(testPostPath);
  if (fs.existsSync(generatedHtmlPath)) fs.unlinkSync(generatedHtmlPath);
  if (fs.existsSync(siteDir)) fs.rmSync(siteDir, { recursive: true, force: true });

  // posts.json orijinal durumuna geri döndür
  fs.writeFileSync(postsJsonPath, originalPostsJson, 'utf8');
  try {
    delete require.cache[require.resolve(path.join(rootDir, 'scripts', 'build-rss.js'))];
    require(path.join(rootDir, 'scripts', 'build-rss.js'));
  } catch (e) {}
  try {
    delete require.cache[require.resolve(path.join(rootDir, 'scripts', 'build-sitemap.js'))];
    const sitemapMod = require(path.join(rootDir, 'scripts', 'build-sitemap.js'));
    if (typeof sitemapMod.generateSitemap === 'function') sitemapMod.generateSitemap();
  } catch (e) {}

  console.log('✔ Test yazısı, oluşturulan test HTML dosyası ve _site klasörü tamamen temizlendi.');
  console.log('✔ assets/posts.json, feed.xml ve sitemap.xml tertemiz başlangıç durumuna getirildi.');
}

console.log('\n============================================================');
console.log(` TEST SONUCU: ${passedTests} / ${totalTests} BAŞARILI!`);
console.log('============================================================\n');
