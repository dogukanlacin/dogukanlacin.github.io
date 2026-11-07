/**
 * Doğukan'ın Notları — RSS 2.0 Besleme Oluşturucu
 * assets/posts.json dosyasını okur ve feed.xml dosyasını otomatik günceller.
 * Kullanım: node scripts/build-rss.js
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const postsJsonPath = path.join(rootDir, 'assets', 'posts.json');
const feedXmlPath = path.join(rootDir, 'feed.xml');

const siteConfig = {
  title: "Doğukan'ın Notları",
  siteUrl: "https://dogukanlacin.github.io/",
  feedUrl: "https://dogukanlacin.github.io/feed.xml",
  description: "İnsan, hayat ve kendimiz üzerine düşünceler ve edebi notlar.",
  language: "tr"
};

// RFC 822 Tarih Formatı (Örn: Thu, 05 Nov 2026 12:00:00 +0300)
function toRFC822Date(dateStr) {
  let date;
  if (!dateStr) {
    date = new Date();
  } else {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 9, 0, 0));
    } else {
      date = new Date(dateStr);
    }
  }

  if (isNaN(date.getTime())) {
    date = new Date();
  }

  return date.toUTCString();
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
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

function generateRss() {
  let posts = [];
  try {
    if (fs.existsSync(postsJsonPath)) {
      const data = JSON.parse(fs.readFileSync(postsJsonPath, 'utf8'));
      posts = Array.isArray(data) ? data : (data.posts || []);
    }
  } catch (err) {
    console.error('posts.json okunamadı:', err.message);
    posts = [];
  }

  const lastBuildDate = new Date().toUTCString();

  const itemsXml = posts.map(post => {
    const postUrl = post.url
      ? (post.url.startsWith('http') ? post.url.replace(/\.html$/, '') : siteConfig.siteUrl + post.url.replace(/^\//, '').replace(/\.html$/, ''))
      : (post.slug ? `${siteConfig.siteUrl}${post.slug}` : siteConfig.siteUrl);

    const title = post.title || 'Başlıksız';
    const excerpt = post.excerpt || '';
    const pubDate = toRFC822Date(post.date);
    const category = post.category || 'Genel';

    return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${escapeXml(postUrl)}</link>
      <guid isPermaLink="true">${escapeXml(postUrl)}</guid>
      <description><![CDATA[${excerpt}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category><![CDATA[${category}]]></category>
    </item>`;
  }).join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)}</title>
    <link>${escapeXml(siteConfig.siteUrl)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>${siteConfig.language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(siteConfig.feedUrl)}" rel="self" type="application/rss+xml"/>
${itemsXml ? itemsXml + '\n' : ''}  </channel>
</rss>
`;

  fs.writeFileSync(feedXmlPath, xmlContent, 'utf8');
  console.log(`feed.xml başarıyla oluşturuldu. Toplam yazı: ${posts.length}`);
}

generateRss();
