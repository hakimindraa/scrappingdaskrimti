# DASTI Scraper - Pagination Troubleshooting

## Masalah: Scraper Hanya Mengambil 1 Halaman

### Gejala
- Scraper hanya mengambil data dari halaman pertama
- Pagination tidak berjalan ke halaman berikutnya
- Total data yang di-scrape hanya 10-20 items (1 halaman)
- Website asli memiliki banyak halaman (35+ halaman)

### Penyebab Umum

#### 1. Selector Pagination Tidak Cocok
Website DASTI mungkin menggunakan struktur HTML pagination yang berbeda dari yang di-expect scraper.

#### 2. JavaScript Pagination
Pagination mungkin menggunakan JavaScript/AJAX yang memerlukan waktu loading lebih lama.

#### 3. Element Tidak Clickable
Element pagination mungkin tertutup oleh element lain atau tidak visible.

## Cara Debug

### Step 1: Check Pagination Elements

Gunakan endpoint debug untuk melihat elemen pagination:

```bash
GET http://localhost:5002/api/scraper/debug/pagination
```

Response akan menunjukkan:
- Semua link pagination yang ditemukan
- Text dan href dari setiap link
- Apakah element visible atau tidak
- HTML structure pagination

### Step 2: Check Backend Logs

Lihat console backend untuk log detail:

```bash
# Windows CMD
cd dasti-scraper
start-dasti.bat
```

Log akan menampilkan:
```
[DASTI] Attempting to navigate to page 2
[DASTI] Found 10 elements with selector: //ul[contains(@class, 'pagination')]//a
[DASTI] Clicking element: 2
[DASTI] Successfully navigated to page 2
```

Atau jika gagal:
```
[DASTI] Found 0 elements with selector: ...
[DASTI] Failed to navigate to next page
```

### Step 3: Manual Test di Browser

1. Buka browser Chromium yang dibuka oleh scraper
2. Coba klik pagination secara manual
3. Perhatikan:
   - Apakah URL berubah?
   - Apakah ada loading indicator?
   - Berapa lama waktu loading?
   - Apakah data berubah?

## Solusi

### Solusi 1: Update Selector Pagination

Jika struktur HTML berbeda, update selector di `scraper_service.py`:

```python
# Tambahkan selector khusus untuk website DASTI
page_selectors = [
    # Existing selectors
    f"//ul[contains(@class, 'pagination')]//a[text()='{target_page}']",
    
    # Custom selector untuk DASTI
    f"//div[@class='pagination']//a[text()='{target_page}']",
    f"//nav//a[text()='{target_page}']",
    # Tambahkan selector lain sesuai struktur HTML DASTI
]
```

### Solusi 2: Increase Wait Time

Jika pagination menggunakan AJAX, tambah waktu tunggu:

```python
# Di _click_next_page()
time.sleep(3)  # Dari 2 detik ke 3 detik
```

Dan di `_wait_for_page_change()`:
```python
timeout=20  # Dari 15 detik ke 20 detik
```

### Solusi 3: Scroll Before Click

Pastikan element visible sebelum di-klik:

```python
# Sudah ada di code
self.driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", element)
time.sleep(0.5)
```

### Solusi 4: Use URL Navigation

Jika pagination menggunakan URL parameter (e.g., `?page=2`), gunakan navigasi URL:

```python
def navigate_to_page(self, page_num: int):
    current_url = self.driver.current_url
    # Parse URL and update page parameter
    if '?' in current_url:
        base_url = current_url.split('?')[0]
        new_url = f"{base_url}?page={page_num}"
    else:
        new_url = f"{current_url}?page={page_num}"
    
    self.driver.get(new_url)
    time.sleep(3)
```

## Cara Test Perbaikan

### Test 1: Scrape 2 Halaman
```json
POST /api/scraper/start
{
  "startPage": 1,
  "endPage": 2
}
```

Expected: 20 data (10 per halaman)

### Test 2: Scrape 5 Halaman
```json
POST /api/scraper/start
{
  "startPage": 1,
  "endPage": 5
}
```

Expected: 50 data

### Test 3: Check Logs
```bash
GET /api/scraper/logs?limit=50
```

Cari log:
- "Berhasil navigasi ke halaman X"
- "Gagal navigasi ke halaman selanjutnya"

## Workaround Sementara

Jika pagination tidak bisa diperbaiki, gunakan workaround:

### Option 1: Manual Page Navigation
1. Scrape halaman 1
2. Manual klik ke halaman 2 di browser
3. Scrape halaman 2
4. Repeat...

### Option 2: URL-based Scraping
1. Copy URL halaman 1
2. Paste & scrape
3. Copy URL halaman 2
4. Paste & scrape
5. Repeat...

### Option 3: Increase Max Failures
```python
# Di scrape_all_pages()
max_failures = 10  # Dari 5 ke 10
```

Ini akan membuat scraper lebih persistent.

## Specific Fix untuk Website DASTI

Berdasarkan screenshot, website DASTI menggunakan pagination dengan angka (1, 2, 3, 4, 5... 35).

### Inspect Element Pagination

1. Buka browser Chromium
2. Right-click pada angka pagination
3. Inspect element
4. Copy HTML structure

Contoh yang mungkin:
```html
<ul class="pagination">
  <li><a href="?page=1">1</a></li>
  <li class="active"><a href="?page=2">2</a></li>
  <li><a href="?page=3">3</a></li>
  ...
</ul>
```

### Update Selector Berdasarkan Struktur

Jika struktur seperti di atas, selector yang tepat:
```python
f"//ul[@class='pagination']//a[@href='?page={target_page}']"
```

Atau jika menggunakan class lain:
```python
f"//div[@class='dataTables_paginate']//a[text()='{target_page}']"
```

## Advanced Debugging

### Enable Selenium Wire
Untuk melihat network requests:

```python
from seleniumwire import webdriver

# Lihat semua requests
for request in driver.requests:
    if 'page' in request.url:
        print(request.url)
```

### Take Screenshot on Failure
```python
if not self._click_next_page(target_page=next_page):
    self.driver.save_screenshot(f"pagination_fail_page_{next_page}.png")
```

### Log Page Source
```python
with open(f"page_{current_page}.html", "w", encoding="utf-8") as f:
    f.write(self.driver.page_source)
```

## Checklist Debugging

- [ ] Check pagination elements dengan `/debug/pagination`
- [ ] Check backend logs untuk error messages
- [ ] Manual test pagination di browser
- [ ] Inspect HTML structure pagination
- [ ] Update selector jika perlu
- [ ] Increase wait time jika perlu
- [ ] Test dengan 2-3 halaman dulu
- [ ] Check logs setelah test
- [ ] Verify data count sesuai expected

## Contact Support

Jika masih tidak bisa, kirim informasi berikut:
1. Screenshot website DASTI (pagination area)
2. HTML structure pagination (dari inspect element)
3. Backend logs
4. Response dari `/debug/pagination`
5. URL website DASTI

---

**Update**: 2 Maret 2026
**Version**: 1.1.1
**Status**: Debugging Guide
