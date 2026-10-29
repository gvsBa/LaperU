# LaperU — integrasi FE terbaru + Backend

Branch: **integration/frontend-api-2026-10-22**. Baseline desain: **feat/frontend-ui @ 88161f4** (Customer, UMKM, Admin). Pembaruan demo lokal, recovery, dan polish UI: **29 Oktober 2026**.

**Revisi tampilan:** sesuai permintaan pemilik project, pemolesan global 29 Oktober dibatalkan dan presentasi halaman dikembalikan ke baseline integrasi `f1fc70a`. CSS asli `index.css` dan `integration.css` tidak diubah. Recovery/ganti password, validasi, integrasi API, data showcase, sumber data, dan filter katalog tetap dipertahankan. `feature-additions.css` hanya menata fitur tambahan tersebut; ilustrasi emoji dan override tampilan global sudah dihapus. Metadata Bahasa Indonesia tetap dipertahankan.

Jangan menyalin folder backend saja atau merge release lama secara utuh. Integrasi memerlukan service API, autentikasi, route guard, proxy, dependency workspace, serta penghubung aksi pada halaman FE. Desain terbaru tetap menjadi baseline; data contoh dan aksi simulasi diganti API.

## Mulai di laptop Windows (VS Code + XAMPP)

Butuh Git, Node.js 24.x, XAMPP (MySQL/MariaDB), dan Chrome. Pembaruan ini diverifikasi dengan Node 24.15.0 dan MariaDB 10.4.32. Apache/PHP bukan server aplikasi ini; Apache hanya perlu jika memakai phpMyAdmin.

Clone ke **folder baru** untuk QA, jangan menimpa checkout atau .env yang sudah ada:

~~~powershell
git clone --branch integration/frontend-api-2026-10-22 https://github.com/gvsBa/LaperU.git LaperU-QA
cd LaperU-QA
code .
npm.cmd ci
npm.cmd run setup:local
~~~

Buka XAMPP Control Panel, Start **MySQL**. Periksa DATABASE_URL di backend/.env. Setup default memakai root tanpa password pada 127.0.0.1:3306 untuk XAMPP lokal saja. Jika root memiliki password/port berbeda, sesuaikan sendiri. Jangan kirim .env/password ke grup. setup:local **tidak menimpa** .env yang ada.

~~~powershell
npm.cmd run db:migrate --workspace @laperu/backend
npm.cmd run db:seed --workspace @laperu/backend
npm.cmd run db:seed:demo --workspace @laperu/backend
npm.cmd run db:seed:showcase --workspace @laperu/backend
npm.cmd run dev:all
~~~

Buka **http://127.0.0.1:5173**. Gunakan host tersebut secara konsisten, jangan bergantian dengan localhost. Terminal tetap menyala. Pemeriksaan koneksi: http://127.0.0.1:3000/api/v1/health/database.

- Admin: email/password lokal dari backend/.env saat seed pertama. Seed ulang tidak mengganti password Admin yang sudah ada.
- Customer dan UMKM demo: backend/.demo-accounts.local.json, dibuat otomatis dengan password acak; file tidak masuk Git.
- UMKM demo sudah disetujui. Untuk menguji pengajuan, daftar akun UMKM baru.
- Database dan akun berada di **laptop masing-masing**, bukan tersinkron melalui GitHub.
- Gunakan server Node/Vite di atas, bukan VS Code Live Server.
- Hentikan aplikasi dengan Ctrl+C pada terminal miliknya, bukan menghentikan seluruh proses Node/MySQL.

## Pemeriksaan

~~~powershell
npm.cmd run check
npm.cmd run test:database:local --workspace @laperu/backend
npx.cmd playwright install chromium
npm.cmd run test:browser:local
~~~

Tes database membuat instance MariaDB sementara dan membersihkannya setelah selesai; tidak memakai database kerja laperu. Default binary C:\xampp\mysql\bin. Jika berbeda, jalankan dari root:

~~~powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/scripts/test-local-database.ps1 -DatabaseBin "D:\xampp\mysql\bin" -BrowserSmoke
~~~

check mencakup typecheck, ESLint, OpenAPI, unit test dan build. Browser test menggunakan data fiktif dan menghasilkan bukti di test-results/ (diabaikan Git). Build lulus bukan bukti Safari atau production sudah teruji.

## Dokumentasi utama

- [Panduan Fikri dari nol + troubleshooting](docs/QA_START_HERE.md)
- [Checklist pengujian manual](docs/QA_TEST_CHECKLIST.md)
- [Handoff FE, cakupan integrasi dan batasan](docs/FRONTEND_INTEGRATION_HANDOFF.md)
- [Kontrak API](backend/openapi.yaml)
- [Demo ramai, sumber data, dan pemulihan offline](docs/SHOWCASE_AND_RECOVERY.md)
- [Handoff lokal terbaru](backend/FINAL_LOCAL_HANDOFF.md)
- [Backend](backend/README.md)

Dokumen lama WEEKLY_REPORT, QA_HANDOFF, SRS_BACKEND_TRACEABILITY dan THEME_AND_PERFORMANCE tetap disimpan sebagai catatan historis; status integrasi terbaru menggunakan tiga dokumen di atas.

## Stack dan batas penggunaan

React JSX + Vite; Express + TypeScript; mysql2; access token di memori dan rotating refresh token di cookie HTTP-only. Verifikasi database menggunakan MariaDB bawaan XAMPP; bukan pembuktian semua versi MySQL.

Versi ini untuk demo/UAT lokal. Ganti password dan reset memakai kode pemulihan offline sudah tersedia. Kode harus dibuat sebelumnya di Akun → Keamanan dengan password saat ini; bukan reset hanya bermodal nama/email. OTP/email, 2FA, manajemen perangkat, edit profil akun, dan hapus foto galeri bukan bagian dari fitur versi ini. Kontrol terkait dinonaktifkan/ditandai, bukan menyimulasikan sukses. Jangan deploy dengan kredensial contoh atau konfigurasi lokal.
