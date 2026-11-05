# Doğukan'ın Notları

Noir / editoryal tasarımlı, minimalist ve edebi kişisel yazı sitesi.

---

## GitHub Pages ile Yayımlama
1. Tüm dosya ve klasörleri `dogukanlacin.github.io` deposunun ana dizinine (`root`) yükleyin.
2. GitHub'da **Settings → Pages** bölümüne gidin.
3. **Deploy from a branch** seçeneğini seçin; Branch: `main`, Folder: `/(root)` olarak ayarlayın ve **Save** butonuna basın.
4. Birkaç dakika sonra `https://dogukanlacin.github.io` adresini ziyaret edin.

---

## Yeni Yazı Ekleme Rehberi

### Yöntem 1: Otomatik Yazı Oluşturucu (Önerilen)

Terminalde tek bir komut çalıştırarak HTML sayfasını, arşiv kaydını ve RSS beslemesini aynı anda oluşturabilirsiniz:

```bash
node scripts/new-post.js
```

Bu komutu çalıştırdığınızda betik size sırayla soracaktır:
1. **Yazı Başlığı:** Başlığı girdiğinizde Türkçe harfler otomatik temizlenerek temiz bir URL (`slug.html`) oluşturulur.
2. **Kısa Özet / Alt Başlık:** Arşiv kartında ve paylaşımlarda görünecek 1-2 cümlelik edebi özet.
3. **Yayın Tarihi:** Boş bırakıp Enter'a basarsanız bugünün tarihi otomatik atanır.
4. **Kapak Görseli:** İsteğe bağlı görsel bağlantısı (yoksa Enter ile geçebilirsiniz).
5. **Öne Çıkan Not mu?:** `e` (evet) veya `h` (hayır).

İşlem tamamlandığında:
* Yeni HTML dosyanız (`ornek-yazi-adi.html`) tüm etiketleriyle hazır olarak açılır.
* `assets/posts.json` arşiv listesine kaydedilir.
* `feed.xml` RSS beslemesi anında güncellenir.
* Aynı isimde bir yazı zaten varsa mevcut dosyanın üzerine yazılmaz; sistem sizi uyarır.

---

### Yöntem 2: Manuel (Elle) Yazı Ekleme

1. **Yazı Sayfası:** `post-template.html` şablonunu kopyalayıp `yazi-adi.html` olarak kaydedin ve başlık/paragrafları güncelleyin.
2. **Arşiv Kaydı:** `assets/posts.json` dosyasını açıp yeni yazı nesnesini ekleyin:
   ```json
   [
     {
       "title": "Yazının Başlığı",
       "slug": "yazinin-basligi",
       "date": "2026-11-05",
       "excerpt": "Yazının kısa özeti.",
       "readingTime": "3 dk okuma",
       "coverImage": "",
       "featured": false,
       "url": "yazinin-basligi.html"
     }
   ]
   ```
3. **RSS Güncelleme:** Terminalden `node scripts/build-rss.js` komutunu çalıştırın.

---

## Editoryal Görsel Sistemi (Yapay Zekâ ile Özgün Görseller)

Yazılarınız için yapay zekâ ile üreteceğiniz görseller `assets/images/posts/` dizininde saklanır:
* **Kapak Görselleri:** `assets/images/posts/<slug>-cover.webp` (16:9 yatay, ~150-250 KB)
* **Yazı İçi Görseller:** `assets/images/posts/<slug>-01.webp`, `assets/images/posts/<slug>-02.webp`
* **Format:** Tüm görseller WebP formatında, metinsiz ve filigransız olmalıdır.

Sinematik noir estetik ilkeleri ve detaylı rehber için:
👉 **[assets/images/posts/GUIDELINES.md](assets/images/posts/GUIDELINES.md)** dosyasını inceleyebilirsiniz.
