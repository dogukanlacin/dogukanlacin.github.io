/**
 * Doğukan'ın Notları — XML Sitemap (Site Haritası) Oluşturucu
 * assets/posts.json dosyasını okur ve kök dizindeki sitemap.xml dosyasını günceller.
 * 
 * Kullanım:
 *   node scripts/build-sitemap.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const postsJsonPath = path.join(rootDir, 'assets', 'posts.json');
const sitemapXmlPath = path.join(rootDir, 'sitemap.xml');

const siteConfig = {
  siteUrl: 'https://dogukanlacin.github.io/'
};

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
      }
    });
}

function generateSitemap() {
  let posts = [];
  try {
    if (fs.existsSync(postsJsonPath)) {
      const data = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
      posts = Array.isArray(data) ? data : (data.posts || []);
    }
  } catch (err) {
    posts = [];
  }

  const today = getTodayISO();

  // 1. Statik Sayfalar (Ana Sayfa ve Hakkımda)
  const staticPagesXml = `  <url>
    <loc>${siteConfig.siteUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteConfig.siteUrl}about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;

  // 2. Blog Yazıları Girişleri
  const postsUrlXml = posts.map(post => {
    let postUrl = '';
    if (post.url && post.url.startsWith('http')) {
      postUrl = post.url;
    } else if (post.url) {
      postUrl = `${siteConfig.siteUrl}${post.url.replace(/^\//, '').replace(/\.html$/, '')}`;
    } else if (post.slug) {
      postUrl = `${siteConfig.siteUrl}${post.slug}`;
    } else {
      return '';
    }

    const lastmod = post.date || today;

    return `  <url>
    <loc>${escapeXml(postUrl)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
  }).filter(Boolean).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPagesXml}${postsUrlXml ? '\n' + postsUrlXml : ''}
</urlset>
`;

  fs.writeFileSync(sitemapXmlPath, xmlContent, 'utf8');
  console.log(`sitemap.xml başarıyla oluşturuldu. Toplam URL: ${posts.length + 2}`);
}

if (require.main === module) {
  generateSitemap();
}

module.exports = { generateSitemap };
