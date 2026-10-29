# Handoff backend lokal — 29 Oktober 2026

## Status yang benar-benar diverifikasi

Backend lokal telah diperbarui dan diuji pada `D:\ASE LAB\LaperU`, branch `backend/final-local-2026-10-29`, berbasis frontend tim commit `88161f4`. Perubahan hanya pada `backend/`. Tidak ada deploy, biaya layanan, force push, atau perubahan frontend.

**Penting sebelum presentasi:** frontend checkout ini masih prototype statis. Contohnya `src/pages/auth/Login.jsx` hanya melakukan navigasi, tidak memanggil API login. Tombol lupa password masih anchor. Backend dan data siap melalui API/terminal, tetapi jangan mempresentasikan UI ini sebagai integrasi database yang sudah selesai. Integrasi UI membutuhkan perubahan FE yang sengaja tidak dilakukan sesuai instruksi pemilik tugas.

## Jalankan kembali

1. Aktifkan MySQL XAMPP (MariaDB); Apache tidak diperlukan.
2. Terminal backend:

```powershell
cd "D:\ASE LAB\LaperU\backend"
npm.cmd run check:local
npm.cmd start
```

Build telah dibuat pada laptop ini. Setelah clone baru, ikuti instalasi/migrasi/build di [README](README.md); file dist dan kredensial tidak dikirim ke GitHub.

3. Terminal frontend asli:

```powershell
cd "D:\ASE LAB\LaperU"
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

4. UI: http://127.0.0.1:5174. API: http://127.0.0.1:3001/api/v1/health. Koneksi DB: http://127.0.0.1:3001/api/v1/health/database.
5. Terminal pemeriksaan API (saat server sudah aktif): `npm.cmd run check:api` dari backend.

Database baru: **laperu_backend_demo**. Database proyek sebelumnya tidak dihapus, di-reset, atau digunakan sebagai target seed. .env lama tidak diubah.

## Akun dan pemulihan

- Admin: `.env`, nilai ADMIN_EMAIL/ADMIN_PASSWORD.
- Customer/UMKM utama: `.demo-accounts.local.json`.
- Customer/pemilik simulasi tambahan: `.showcase-accounts.local.json`.
- Guest tanpa login. Akun internal referensi usaha nyata sengaja tidak dapat login.
- Semua file privat di atas diabaikan Git; jangan bagikan/screenshare password.

Selagi password masih diketahui:

```powershell
cd "D:\ASE LAB\LaperU\backend"
npm.cmd run account:security -- -Action generate
```

Saat lupa: `npm.cmd run account:security -- -Action reset`. Untuk ganti password yang masih diketahui: `npm.cmd run account:security -- -Action change`.

Input password/kode tersembunyi; lima kode disimpan di `recovery.local/`. Simpan salinan pribadi terpisah dari laptop. Kode membuktikan kepemilikan rahasia, bukan email/nama/NIM. Setelah reset, seluruh kode dan sesi lama tidak berlaku; buat kode baru. Jika kode dan password sama-sama hilang, tidak ada jalan pintas mengambil alih akun tanpa verifikasi manual yang sah.

## Dataset lokal

Hasil pembacaan database: 21 tabel, 67 akun, 29 warung, 99 menu, 180 ulasan, 108 balasan, 216 favorit, 360 tayangan.

- 16 warung adalah referensi publik bersumber direktori Telkom, bukan pemilik terverifikasi.
- 12 warung simulasi + 1 warung demo utama adalah fiktif; 96 menu showcase + 3 menu demo utama.
- Semua aktivitas sintetis hanya pada usaha simulasi. Tidak membuat testimoni palsu pada usaha nyata.
- Sumber dan batas kesegaran: [data/SOURCES.md](data/SOURCES.md). Tidak mengklaim operasional terbaru detik ini. Tidak menyalin foto/harga/jam yang belum dikonfirmasi sebagai fakta terkini.
- Melihat JSON dataset: `/api/v1/warungs?dataset=reference&limit=50` atau `dataset=simulation`.
- Data tersimpan lokal, tidak melakukan scraping ketika aplikasi berjalan.

## Bukti pengujian

| Pemeriksaan | Hasil |
|---|---|
| TypeScript backend | Lolos |
| Tes unit backend | 46 lolos |
| Integrasi MariaDB sementara | 30 lolos, termasuk 4 skenario CLI Windows |
| Build backend | Lolos; server hasil build dijalankan |
| Build frontend asli | Lolos tanpa perubahan source |
| API live: health, DB, login/me/endpoint 3 role | Lolos |
| Migrasi dan seed diulang | Lolos, tidak menggandakan dataset |
| OpenAPI | Lolos validator Redocly yang sudah terpasang lokal |
| Lint TypeScript backend | Lolos memakai konfigurasi/tool lint dari checkout integrasi yang sudah tersedia |
| Audit paket backend | 0 kerentanan yang dilaporkan npm audit saat pemeriksaan |
| Backup SQL lokal | Berhasil, tersimpan di backups.local, tidak masuk Git |
| Batas perubahan | Hanya backend/; frontend identik dengan baseline 88161f4 |

Lint/Redocly memakai alat yang sudah ada pada laptop, bukan dependency runtime baru. Perintah verifikasi portabel backend yang disediakan: typecheck, test, test:database:local, build, check:local, check:api, npm audit.

Integrasi menguji pendaftaran baru customer/UMKM, email duplikat, validasi, login/refresh/logout, role dan ownership, unggahan palsu/oversize, submit/revisi/approval, menu, tujuh hari operasional, filter/detail, favorit, enam rating, balasan, laporan/moderasi dan suspensi. Recovery mencakup kode sekali pakai, penyimpanan hash, regenerasi, concurrent reset, invalidasi JWT/refresh, dan penolakan akun suspended. CLI diuji melalui server HTTP lokal dengan input terminal otomatis.

## Urutan demo backend yang disarankan

1. Tunjukkan health/DB dan katalog referensi versus simulasi.
2. Jalankan check:api untuk menunjukkan akun tiga peran benar-benar diterima backend.
3. Jalankan test:database:local untuk pembuktian akun **baru**, alur verifikasi dan kepemilikan tanpa mengotori database presentasi.
4. Gunakan akun customer demo pada alat account:security: generate, simpan kode secara privat, reset, lalu login API dengan password baru. Jangan menampilkan kode/password pada proyektor. Sesudah mengganti password demo, file kredensial seed/check:api yang lama perlu diperbarui secara privat; seed sengaja tidak mengembalikan password lama.
5. Perlihatkan openapi.yaml dan tabel/relasi database sebagai hasil kerja backend, bukan mengklaim semua tombol frontend sudah terhubung.

## Batas dan temuan di luar scope

- npm audit frontend/root melaporkan **5 kerentanan high** pada dependency tree lama. Tidak diperbaiki karena batas backend-only; jangan membuka dev server ke LAN/internet. Penilaian ini bukan klaim kelima temuan semuanya dapat dieksploitasi melalui UI saat ini.
- Backend lokal tidak memerlukan internet setelah paket terpasang. Tautan Google Maps/foto eksternal tetap memerlukan internet.
- Tidak menguji Safari atau menyatakan UI lintas peran end-to-end pada branch ini.
- MariaDB XAMPP 10.4.32 yang diuji; SQL migration 002 menggunakan sintaks MariaDB. Kompatibilitas semua versi MySQL tidak diklaim.
- Backup SQL tidak mencakup file upload. Salin folder uploads secara terpisah untuk backup lengkap.
- Server harus tetap hidup selama demo. Jika port sibuk, periksa proses pemiliknya; jangan mematikan semua node/MySQL secara massal.
