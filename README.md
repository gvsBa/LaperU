# LaperU

Website informasi kuliner sekitar Telkom University: Guest, Customer, UMKM, dan Admin. Versi persiapan pengumpulan **22 Oktober 2026**; pembaruan **20 Oktober 2026**.

Frontend tim dari `feat/frontend-ui` sampai commit `05dc7a0` digabung dengan integrasi Backend. Desain logo, Explore, dan detail berasal dari pekerjaan FE; autentikasi, data API, serta layar pengelolaan ditambahkan pada branch `release/submission-2026-10-22`. Folder kerja lokal: `D:\ASE LAB\laperu-integration`. Folder lama `laperu-web` tidak diganti.

Hasil integrasi tersedia untuk review melalui [Pull Request #1](https://github.com/gvsBa/LaperU/pull/1). Gunakan branch tersebut sampai tim menyetujui merge; branch `main` tidak otomatis diperbarui.

## Stack dan cakupan

- Frontend: React JSX, React Router, Vite, Tailwind.
- Backend: Express, TypeScript, Zod, mysql2; REST API `/api/v1`.
- Database pengumpulan: **MariaDB lokal melalui XAMPP**, bukan database cloud. Pengujian menggunakan MariaDB 10.4.32. MySQL 8 belum diverifikasi.
- Sesi: JWT access token di memori dan rotating refresh cookie HttpOnly.
- Guest: pencarian, kategori/budget/status buka/rating/fasilitas/pembayaran, pagination, detail/menu/ulasan dan rute Maps.
- Customer: registrasi/login, favorit, tulis/edit/hapus ulasan enam aspek, riwayat ulasan, laporan.
- UMKM: draft/foto/pengajuan/revisi, profil, menu/harga/ketersediaan, jadwal, fasilitas/pembayaran, galeri, balasan dan statistik.
- Admin: pemeriksaan/keputusan pengajuan, pengguna, profil/visibilitas warung, kategori/fasilitas, laporan/moderasi dan audit log.

## Jalankan dari VS Code — Windows

Buka folder project, lalu **Terminal → New Terminal**. Gunakan `npm.cmd` jika PowerShell menolak `npm.ps1`. Lingkungan yang diuji memakai Node 24: **24.15.0 untuk aplikasi, seed dan suite database/browser**, serta **24.19.0 untuk pemeriksaan `check`**. Pada 24.15.0, CLI validasi OpenAPI sempat berakhir dengan assertion libuv; pada 24.19.0, seed melalui tsx sempat tertahan. Karena itu jangan menganggap satu versi sudah lulus seluruh perintah. Detail ada di dokumen status. Tidak ada perubahan instalasi Node global pada laptop.

1. Instal dependency dan siapkan konfigurasi:

```powershell
npm.cmd ci
npm.cmd run setup:local
```

Setup hanya membuat `.env` yang belum ada; konfigurasi lama tidak ditimpa. Secret dan password Admin baru dihasilkan acak, disimpan di `backend/.env`, dan tidak dicetak ke terminal.

2. Buka XAMPP Control Panel dan **Start MySQL**. Apache tidak diperlukan untuk React/Express. Pastikan `backend/.env` menunjuk database lokal yang benar; default setup memakai root lokal tanpa password. Jika root mempunyai password/port berbeda, sesuaikan `DATABASE_URL`. Jangan menggunakan konfigurasi lokal ini untuk server publik.

3. Buat tabel dan data referensi:

```powershell
npm.cmd run db:migrate --workspace @laperu/backend
npm.cmd run db:seed --workspace @laperu/backend
```

Migrasi memakai `CREATE TABLE IF NOT EXISTS`; tidak menghapus tabel lama. Seed menambah Admin jika belum ada dan **tidak mengganti password/status akun yang sudah ada**. Mengedit `ADMIN_PASSWORD` setelah akun dibuat tidak mereset password akun tersebut.

4. Opsional, siapkan data presentasi fiktif:

```powershell
npm.cmd run db:seed:demo --workspace @laperu/backend
```

Script hanya menerima database lokal `laperu` atau `laperu_test_*`, tidak berjalan di production, dan tidak menimpa akun berbeda. Membuat dua akun demo, satu warung berlabel demo, tiga menu, dan jadwal. Aman dijalankan ulang untuk dataset yang sama. Email/password demo disimpan di `backend/.demo-accounts.local.json` yang diabaikan Git. Kredensial Admin tetap ada di `backend/.env`.

Data demo disiapkan langsung untuk presentasi; status approved pada data demo **bukan bukti verifikasi usaha nyata**. Untuk mendemokan proses persetujuan, daftarkan UMKM baru melalui website.

5. Jalankan aplikasi:

```powershell
npm.cmd run dev:all
```

- Website: http://127.0.0.1:5173
- Login: http://127.0.0.1:5173/login
- Koneksi database: http://127.0.0.1:3000/api/v1/health/database
- Dashboard: `/umkm`, `/admin`; hanya role yang sesuai dapat mengakses.
- Tekan **Ctrl+C** pada terminal untuk menghentikan FE/BE. Hentikan MySQL melalui XAMPP ketika selesai.

Gunakan `127.0.0.1` secara konsisten, bukan bergantian dengan `localhost`. Port Vite dikunci 5173 agar cookie/CORS tidak berubah diam-diam. Jika port terpakai, hentikan proses project lama atau sesuaikan konfigurasi secara eksplisit.

## Pemeriksaan

```powershell
npm.cmd run check
npm.cmd audit
npx.cmd playwright install chromium
npm.cmd run test:browser:local
```

`check` menjalankan typecheck, lint, validasi OpenAPI, unit tests FE/BE, dan build keduanya. Typecheck frontend hanya mencakup file TS lama; JSX aktif diperiksa lint/build dan tes browser, bukan diklaim sepenuhnya typed.

`test:browser:local` membuat database QA terisolasi dengan binary XAMPP, mengulang migrasi/seed, menjalankan tes API–database dan browser, lalu membersihkan instance sementara tersebut. Tidak menghapus database development. Bukti browser tersimpan di `test-results/` (diabaikan Git). Default browser adalah Chromium headless shell. Untuk Chrome terpasang:

```powershell
$env:LAPERU_BROWSER_CHANNEL = 'chrome'
npm.cmd run test:browser:local
Remove-Item Env:LAPERU_BROWSER_CHANNEL
```

## Dokumen pengumpulan

- [Status pengumpulan dan hasil uji](docs/SUBMISSION_STATUS.md)
- [Panduan demo dan checklist 22 Oktober](docs/SUBMISSION_GUIDE.md)
- [Weekly report](docs/WEEKLY_REPORT.md)
- [Handoff FE–BE](docs/FRONTEND_BACKEND_HANDOFF.md)
- [SDD Backend](docs/SDD_BACKEND_HANDOFF.md)
- [Kontrak API](backend/openapi.yaml)
- [Traceability SRS](docs/SRS_BACKEND_TRACEABILITY.md)
- [Handoff QA](docs/QA_HANDOFF.md)
- [Target performa](docs/THEME_AND_PERFORMANCE.md)

Jangan ikut mengumpulkan `.env`, kredensial demo, `node_modules`, data directory XAMPP, atau log privat. Source/schema bukan dump data pengguna. Backup database privat dilakukan terpisah sebelum demo.

Batas: tidak ada pemulihan password/email verification, pemesanan/pembayaran online, notifikasi, atau klaim production deployment. Safari/perangkat fisik dan uji 50 sesi pengguna bersamaan belum disahkan. Filter radius tersedia pada API, tetapi kontrol geolokasi dan pilihan sortir baru FE belum dihubungkan; UI menampilkan urutan rating/jumlah ulasan dari server tanpa menyimulasikan hasil.
