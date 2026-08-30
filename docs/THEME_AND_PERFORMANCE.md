# Tema dan Target Performance LaperU

## TEMA

**Nama tema:** Minimal Monochrome

**Arah visual:** sederhana, bersih, dan fungsional. Tampilan memakai ruang kosong yang lega, garis tipis, bentuk kotak, serta hierarki tipografi yang jelas. Tidak menggunakan gradient, ilustrasi dekoratif, atau efek bayangan berat.

**Palet warna:**

- Primary Black: `#111111` — tombol utama, judul, dan fokus.
- Pure White: `#FFFFFF` — latar utama.
- Muted Gray: `#6B6B6B` — teks sekunder.
- Border Gray: `#D8D8D8` — garis dan input.
- Soft Gray: `#F5F5F5` — hover atau bidang sekunder.

**Tipografi:** system font (`Inter`, `Segoe UI`, `San Francisco`, sans-serif) agar cepat dimuat dan konsisten pada Chrome maupun Safari. Tidak ada font eksternal pada halaman autentikasi.

**Prinsip komponen:** sudut tegas, tombol hitam solid, input putih dengan border 1 px, focus ring hitam 2 px, tanpa aksen warna tambahan, dan tetap nyaman digunakan melalui keyboard serta layar sentuh.

## Target Performance

**Dukungan browser:** Chrome dan Safari versi stabil saat ini serta satu versi mayor sebelumnya. Layout harus tetap berfungsi mulai lebar 320 px.

**Loading Page berdasarkan LCP:**

- Best: `≤ 1,2 detik`.
- Normal: `> 1,2 sampai 2,5 detik`.
- Worst yang masih dapat diterima: `> 2,5 sampai 4 detik`.
- Gagal target: `> 4 detik`.

**Target pendukung:**

- INP: `≤ 200 ms`.
- CLS: `≤ 0,10`.
- JavaScript awal Frontend: `≤ 200 KB gzip`.
- Response API p95 untuk baca data: `≤ 500 ms`.
- Response API p95 untuk operasi tulis: `≤ 800 ms`.
- Semua daftar menggunakan pagination dan foto menggunakan lazy loading pada tahap implementasi katalog.

**Kriteria penerimaan SRS (batas wajib):**

- Waktu muat halaman maksimal `3 detik`.
- Waktu respons API maksimal `2 detik`.
- Sistem tidak crash saat diuji dengan `50 pengguna bersamaan`.

Target internal di atas sengaja lebih ketat daripada batas SRS. QA menyatakan gagal apabila melewati batas SRS, sedangkan nilai di antara target internal dan batas SRS dicatat sebagai lulus dengan catatan optimasi.
