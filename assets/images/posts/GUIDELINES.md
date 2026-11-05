# Doğukan'ın Notları — Editoryal Görsel Üretim Rehberi

Bu rehber, blog yazıları için yapay zekâ (Midjourney, DALL-E, Stable Diffusion, Flux vb.) ile üretilecek özgün görsellerin ortak estetik kimliğini, prompt formüllerini ve teknik standartlarını belirler.

---

## 1. Temel Görsel Felsefesi & Marka Kimliği

* **Estetik Çerçeve:** Noir, sinematik, edebi ve minimalist.
* **Renk Paleti:** Derin siyahlar (`#111`), antrasit gölgeler, kırık beyaz ışık hüzmeleri ve sıcak bronz / kehribar (`#b7a98a`) ışıltılar.
* **Işık ve Atmosfer:** Chiaroscuro (güçlü ışık-gölge karşıtlığı), 35mm film greni, hafif sis/pus, sakin ve dingin kompozisyonlar.
* **Zorunlu Kurallar:**
  * Görsellerde **kesinlikle metin, başlık, logo, imza veya filigran** bulunmayacaktır.
  * Yapay, aşırı parlak (over-saturated) renklerden ve stok fotoğraf klişelerinden kaçınılır.
  * Belirli bir gerçek kişiyi veya güncel olayı tasvir etmesi gerekmeyen felsefi yazılarda **sembolik, metaforik ve sanatsal** kompozisyonlar tercih edilir.

---

## 2. Kategori Bazlı Görsel Tarzları

| Kategori | Görsel Yaklaşım | Örnek Kompozisyon |
|---|---|---|
| **İnsan ve Toplum** | Atmosferik editoryal portre veya sokak sinematiği | Yağmurlu bir akşamda buğulu pencere arkasındaki insan silüeti; loş bir sokak lambasının altındaki uzun gölge. |
| **Hukuk ve Adalet** | Felsefi sembolizm ve monumental mimari | Devasa taş/mermer sütunlar arasındaki keskin ışık-gölge çizgisi; kırık bir terazinin loş ışık altındaki soyut yansıması; sessiz bir adalet salonunun geometrisi. |
| **Denemeler** | Minimalist durağan hayat (still life) ve dingin anlar | Ahşap bir masanın kenarında açık bir defter ve kahve buharı; açık kapıdan odaya sızan sabah ışığı; rüzgârda savrulan boş bir kâğıt. |

---

## 3. Yapay Zekâ Prompt Şablonları

### A. Kapak Görseli (Cover Image — 16:9)
Kapak görselleri geniş, sinematik ve yatay olmalıdır.

```text
Cinematic noir editorial photography, [YAZININ KONUSU / SEMBOLİK SAHNE], dramatic chiaroscuro lighting, deep anthracite shadows with subtle warm bronze amber rim light, atmospheric 35mm film grain, minimalist contemplative mood, high contrast, shot on Leica M6 or Hasselblad, 8k resolution --ar 16:9 --style raw --no text, words, watermark, logo, cartoon, saturated colors
```

#### Örnek Kapak Promptu (Konu: Sessizlik ve İç Hesaplaşma):
> `Cinematic noir editorial photography, a lone thoughtful silhouette by a large minimalist window looking out into a misty evening city, dramatic chiaroscuro lighting, deep anthracite shadows with subtle warm bronze amber highlights, 35mm film texture, melancholic peaceful literary atmosphere, 8k --ar 16:9 --no text, watermark, signature`

---

### B. Yazı İçi Görseller (Inline Figures)
Yazı içindeki düşünce geçişlerini destekleyen, detay ve doku odaklı kareler.

```text
Intimate editorial macro still-life, [METAFORİK DETAY / OBJE], moody natural side-lighting, chiaroscuro contrast, dark noir aesthetic, subtle warm gold tones, vintage book aesthetics, shallow depth of field, 35mm film grain --ar 16:9 --no text, watermark
```

#### Örnek Yazı İçi Promptu (Konu: Zamana ve Belleğe Dair Notlar):
> `Intimate editorial still-life, an antique fountain pen resting on an open blank textured notebook, soft warm ray of light slicing through darkness, dark wood surface, shallow depth of field, 35mm film grain, moody cinematic atmosphere --ar 16:9 --no text, watermark`

---

## 4. Dosya İsimlendirme ve Teknik Standartlar

1. **Format:** Web üzerinde en hızlı yükleme için her zaman **`.webp`** formatı kullanılmalıdır.
2. **Ölçüler:**
   * **Kapak Görseli:** 1600×900 px (16:9) veya 1200×675 px. Hedef dosya boyutu: `120 KB – 240 KB`.
   * **Yazı İçi Görseller:** 1200×675 px veya 1000×562 px. Hedef dosya boyutu: `80 KB – 160 KB`.
3. **Konum:** Tüm görseller `assets/images/posts/` dizinine kaydedilir.
4. **İsimlendirme Standardı:**
   * Kapak: `yazi-slug-cover.webp`
   * 1. Yazı içi görsel: `yazi-slug-01.webp`
   * 2. Yazı içi görsel: `yazi-slug-02.webp`
   *(Yalnızca küçük harfler, rakamlar ve tire `-` kullanılır; Türkçe harf veya boşluk içermez).*

---

## 5. HTML İçinde Kullanım Şablonları

### Kapak Görseli (Yazı Başlığının Hemen Altında)
```html
<figure class="post-cover">
  <img src="assets/images/posts/yazi-slug-cover.webp" alt="Görselin edebi betimlemesi" loading="eager">
  <figcaption>İsteğe bağlı editoryal görsel alt notu.</figcaption>
</figure>
```

### Standart Yazı İçi Görsel
```html
<figure class="post-figure">
  <img src="assets/images/posts/yazi-slug-01.webp" alt="Görsel betimlemesi" loading="lazy">
  <figcaption>Fotoğraf / İllüstrasyon üzerine kısa bir editoryal not.</figcaption>
</figure>
```

### Geniş / Tam Genişlik (Bleed) Görsel
Okuma alanının dışına taşarak sinematik bir ferahlık katan geniş görsel:
```html
<figure class="post-figure post-figure-bleed">
  <img src="assets/images/posts/yazi-slug-02.webp" alt="Görsel betimlemesi" loading="lazy">
  <figcaption>Sinematik ve geniş açılı editoryal kompozisyon.</figcaption>
</figure>
```
