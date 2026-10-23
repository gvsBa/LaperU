# Handoff integrasi FE + Backend LaperU

Diperbarui 23 Oktober 2026. Target: demo/UAT lokal XAMPP.
Baseline FE: feat/frontend-ui commit 88161f4. Backend/hardening sebelumnya: release/submission-2026-10-22 commit a78dc5c.
Branch integrasi: integration/frontend-api-2026-10-22. Target review/PR: feat/frontend-ui, bukan main.

## Keputusan untuk FE

Tidak perlu merge release lama secara utuh, dan jangan hanya menyalin backend/.
Branch ini dimulai dari desain FE terbaru; perubahan src adalah penghubung API ke komponen terbaru, bukan menimpa semua halaman dengan UI release lama.

Yang diperlukan bersama Backend: package.json/lockfile, konfigurasi Vite/proxy, AuthProvider, service API, route guards, dan perubahan handler/data di halaman. Checkout branch integrasi untuk menguji paket yang sama dengan QA. Merge ke branch FE dilakukan setelah review; main tidak diubah otomatis.

Struktur visual FE (sidebar, tabel, kartu, modal, palet/aset) dipertahankan. Penyesuaian disengaja: data dummy/angka palsu dihapus; halaman akun menampilkan identitas asli dan fitur keamanan belum tersedia dibuat read-only; loading/error/retry/pagination ditambah; logout UMKM tetap terlihat di mobile. Halaman akun UMKM disederhanakan sehingga tidak identik per-pixel dengan prototype keamanan yang belum diimplementasikan.

## Cakupan yang sudah dihubungkan

- Guest: daftar/detail warung, cari nama/menu, kategori/harga/rating/buka/fasilitas/pembayaran, sortir/pagination, rute Maps.
- Customer: registrasi/login/logout/sesi pulih, favorit, enam rating, buat/edit/hapus ulasan sendiri, laporan warung/ulasan, aktivitas dan status laporan.
- UMKM: registrasi/draft, upload foto, pengajuan/revisi, status keputusan; profil warung, menu/harga/ketersediaan/nonaktif, tujuh hari operasional, fasilitas/pembayaran, foto galeri, balasan ulasan, statistik nyata.
- Admin: periksa/approve/revise/reject, status warung/pengguna, moderasi ulasan, proses laporan, CRUD kategori/fasilitas, baca/export audit.
- Gambar JPG/PNG maksimum 2 MB; signature diperiksa Backend. Foto pengajuan terbit sebagai storefront saat disetujui.
- Token akses berada di memori; refresh cookie HTTP-only dengan rotasi; Backend tetap menegakkan role/ownership meskipun URL UI dimanipulasi.

Tambahan kontrak non-breaking:
- GET /admin/reviews: q/page/limit, data.items dan pagination.
- GET /customer/reports: maksimal 100 laporan terbaru milik pengguna.
- GET /customer/reviews?warungId=UUID: filter ulasan sendiri untuk detail.
- GET /warungs?sort=recommended|rating|cheapest|nearest; nearest membutuhkan koordinat.
- GET /umkm/reviews menyertakan averageRating.
- Tidak ada migrasi destruktif atau perubahan struktur tabel dalam integrasi FE ini.

## Batasan yang harus diberitahu saat penyerahan

Bukan implementasi penuh semua fitur pada prototype. Berikut belum tersedia dan tidak boleh dinyatakan selesai:
- Edit identitas profil akun, reset/lupa/ganti password, email verifikasi mahasiswa.
- 2FA, daftar perangkat, riwayat login, logout semua perangkat, nonaktif akun mandiri.
- Notifikasi, promo/randomizer, foto ulasan, hapus/ganti foto galeri.
- Grafik statistik harian. Tayangan profil dihitung sebagai request detail, bukan orang unik; reload menambah tayangan.
- Admin tidak punya reset password pengguna. Pengajuan REJECTED tidak dapat dikirim ulang; gunakan REVISION untuk perbaikan.
- Sebagian tabel Admin menggunakan pencarian/filter atas 20 data halaman aktif dan diberi keterangan. Audit maksimum 200 terbaru; ulasan publik maksimum 50; riwayat Customer maksimum 100; ulasan UMKM maksimum 200. Daftar laporan Admin belum dipaginasi.
- Nearest mengecualikan warung tanpa koordinat. Koordinat dapat diisi melalui kontrak profil Backend; UI pemilih lokasi belum tersedia.
- Penyimpanan profil/fasilitas/pembayaran adalah tiga request terpisah; bila salah satunya gagal, perubahan sebelumnya bisa sudah tersimpan. Error ditampilkan; reload untuk memeriksa data.
- Data demo bukan usaha nyata. Registrasi mahasiswa belum membuktikan identitas mahasiswa.
- Tidak ada order, pembayaran online atau delivery.
- Review UI/UX akhir, uji laptop Fikri, Safari fisik dan pengukuran performa masih perlu manusia/perangkat terkait.

## Verifikasi dan lingkungan

Hasil ulang setelah instalasi bersih dengan npm ci pada 23 Oktober 2026:
- Typecheck, ESLint, validasi OpenAPI dan build FE/BE: PASS.
- Unit Backend: 34 PASS; unit/service Frontend: 98 PASS.
- API dengan MariaDB sementara: 16 PASS, termasuk migrasi/seed berulang dan ownership lintas akun.
- Chromium headless: 17 PASS, tidak ada uncaught page exception. Screenshot desktop/mobile diperiksa.
- Chrome terpasang 155.0.8059.85 (dijalankan headless): 17 PASS pada perjalanan yang sama; bukan 17 kasus tambahan yang berbeda. Safari belum diuji.
- npm audit --audit-level=low: 0 vulnerability terlapor pada saat pemeriksaan. Ini bukan jaminan bebas semua celah keamanan.
- git diff --check: PASS.

Dependency patch keamanan: Vite 8.2.4, Vitest 4.1.12, follow-redirects 1.16.1 dan ip-address 10.7.4 pada lockfile. Tidak mengganti framework. Rujukan [Vite advisory](https://github.com/advisories/GHSA-9jrq-w75r-8gcw) dan [follow-redirects advisory](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8).

Perintah reproduksi:
- npm.cmd run check: typecheck, ESLint, OpenAPI, unit Backend/Frontend, production build.
- npm.cmd run test:browser:local: migrasi/seed dua kali, 16 skenario SQL/API, lalu 17 perjalanan browser.
- Bukti browser: test-results/browser-smoke.json dan PNG lokal (tidak masuk Git).
- Node 24.19.0; MariaDB 10.4.32; Chromium headless 153.0.8010.12; desktop 1365×900 dan mobile emulasi 390×844.
- Untuk mengulang Chrome di PowerShell: set $env:LAPERU_BROWSER_CHANNEL='chrome' sebelum npm.cmd run test:browser:local. Chrome harus terpasang.
- Tidak sama dengan Safari/iPhone nyata atau deployment production.

Pada percobaan awal, MariaDB bawaan XAMPP mengalami assertion native-AIO dan Node 24.15 mengalami worker exit. Runner kini menonaktifkan native-AIO **hanya pada instance QA sementara**, bukan konfigurasi XAMPP pengguna. Opsi ini didokumentasikan oleh [MariaDB](https://mariadb.com/docs/server/server-usage/storage-engines/innodb/innodb-system-variables#innodb_use_native_aio). Pengujian ulang tetap menjalankan semua assertion, tanpa skip/melemahkan tes.

## Menyerahkan kepada Fikri

Mulai [QA_START_HERE.md](QA_START_HERE.md), kemudian [QA_TEST_CHECKLIST.md](QA_TEST_CHECKLIST.md). Gunakan branch dan commit yang sama. Jangan mengirim .env, token, password, database dump pribadi, node_modules atau uploads ke GitHub.

Tidak ada merge main, deployment, pengumpulan LMS, atau pesan ke rekan yang dilakukan otomatis.
