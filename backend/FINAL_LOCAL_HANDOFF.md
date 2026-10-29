# LaperU — handoff backend lokal

Tanggal finalisasi: 29 Oktober 2026. Lokasi: `D:\ASE LAB\laperu-integration`.
Basis: commit `f1fc70a`, branch `integration/frontend-api-2026-10-22`, ditambah finalisasi backend inti. Setelah rollback yang diminta pemilik project, perubahan terhadap baseline hanya berada di `backend`. Rollback dipublikasikan sebagai commit baru, tanpa force-push, merge, deployment, atau perubahan kredensial.

## Menjalankan untuk presentasi

1. Buka folder project di VS Code. Gunakan terminal pada folder root project, bukan folder `src`.
2. Nyalakan **MySQL** di XAMPP. Apache tidak diperlukan: API menggunakan Node.js, frontend menggunakan Vite.
3. Jalankan pemeriksaan lokal dan server:

```powershell
cd "D:\ASE LAB\laperu-integration"
npm.cmd run check:local --workspace @laperu/backend
npm.cmd run dev:all
```

4. Buka `http://127.0.0.1:5173`. Jangan berganti antara `localhost` dan `127.0.0.1` saat login, karena cookie mengikuti host.
5. Biarkan terminal server tetap berjalan. `Ctrl+C` menghentikan frontend/backend. MySQL dihentikan melalui XAMPP setelah presentasi selesai.

API: `http://127.0.0.1:3000/api/v1`. Pemeriksaan database: `/health/database`. Backend secara default hanya mendengarkan `127.0.0.1`; tidak perlu membuka akses jaringan publik. `HOST` adalah konfigurasi opsional, bukan alasan untuk membuka firewall.

**Skema versi ini:** 19 tabel inti dari migrasi 001. Akun ADMIN, CUSTOMER dan UMKM tetap memakai kredensial lokal yang ada. Rollback source tidak menghapus database: laptop yang sudah menjalankan migrasi 002 masih memiliki dua tabel tambahan dan data showcase sebelumnya, tetapi kode versi ini tidak memerlukan tabel tambahan tersebut. Tidak ada downgrade SQL atau reset password yang dijalankan. Pemeriksaan `check:local` hanya memeriksa ketersediaan 19 tabel yang diperlukan, bukan menyatakan jumlah total tabel adalah 19.

## Akun presentasi

- **Admin:** lihat `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di `backend/.env` pada laptop sendiri. Kecocokan keduanya sudah diperiksa tanpa mencetak password.
- **Customer dan pemilik UMKM demo:** lihat `backend/.demo-accounts.local.json`. File ini privat dan tidak masuk Git.
- **Guest:** buka tanpa login; bukan akun tambahan.
- UMKM demo memang sudah disetujui agar dashboard dapat langsung didemokan. Untuk memperlihatkan proses persetujuan, buat **akun UMKM baru**, jangan memakai akun demo yang sudah disetujui.
- Jangan kirim `.env`, file kredensial demo, cookie atau token ke grup, repository maupun screenshot presentasi.

Untuk komputer baru / database kosong saja, setelah dependency terpasang dan `backend/.env` disiapkan:

```powershell
npm.cmd run db:migrate --workspace @laperu/backend
npm.cmd run db:seed --workspace @laperu/backend
npm.cmd run db:seed:demo --workspace @laperu/backend
```

Tidak perlu menjalankan `npm ci` setiap kali presentasi. Instalasi dependency pada komputer baru biasanya perlu internet; aplikasi inti di laptop yang sudah disiapkan tidak memerlukan hosting atau layanan berbayar. Jangan mengganti `.env` dengan contoh bila konfigurasi laptop sudah benar.

Seed demo tidak mereset akun lama. Jika kredensial yang tersimpan berbeda dari database, seed berhenti, bukan menimpa password. Seed ulang juga tidak membatalkan penangguhan atau mengubah usaha yang telah diedit.

## Urutan demo dan acceptance test

1. **Guest:** lihat daftar warung; cari nama, filter kategori, budget, buka sekarang; buka detail/menu. Akses fitur privat tanpa login harus ditolak.
2. **Customer baru:** daftar dengan email belum pernah digunakan. Uji email duplikat, email tidak valid, password lemah, lalu login benar/salah. Pendaftaran selalu menjadi CUSTOMER; payload tidak dapat mengangkat dirinya menjadi ADMIN.
3. **Customer:** tambah/hapus favorit, muat ulang, beri/edit ulasan, kirim laporan, lihat riwayat sendiri; tidak boleh mengakses data privat akun lain.
4. **UMKM baru:** daftar, lengkapi identitas, unggah PNG/JPEG maksimal 2 MiB, kirim pengajuan. Status menjadi PENDING; menu belum dapat dikelola sebelum disetujui. Dua submit bersamaan hanya boleh menghasilkan satu keberhasilan.
5. **Admin:** lihat pengajuan; beri catatan revisi, pemilik memperbaiki dan mengirim ulang; setujui. Tolak pengajuan melalui akun uji terpisah jika ingin menunjukkan jalur penolakan. Status REJECTED tidak otomatis dapat diajukan ulang pada kontrak saat ini.
6. **UMKM disetujui:** ubah profil, tambah/edit/nonaktifkan menu, atur harga/ketersediaan, jam operasional, fasilitas/pembayaran; balas ulasan milik warung sendiri.
7. **Moderasi:** customer melapor, admin memproses laporan/menyembunyikan ulasan; guest tidak melihat ulasan tersembunyi. Akun ditangguhkan ditolak oleh API meskipun memegang token lama.
8. **Logout:** sesi refresh dicabut; halaman privat tidak boleh kembali aktif hanya dengan reload. Gunakan profil browser/incognito terpisah saat berganti peran agar cookie tidak saling tertukar.

## Perbaikan backend pada finalisasi ini

- Pembuatan customer dan sesi menjadi satu transaksi: kegagalan sesi tidak meninggalkan akun setengah jadi.
- Metadata sesi dibatasi sesuai kolom SQL; token akses ditandatangani sebelum penyimpanan sesi.
- Hash password UMKM diselesaikan sebelum mengambil koneksi database.
- Email dinormalisasi sebelum validasi. Password baru dibatasi 72 byte UTF-8 agar tidak terpotong diam-diam oleh bcrypt. Login akun lama tetap mempertahankan aturan kompatibilitas yang ada.
- Kuota anti-spam login/registrasi tidak lagi dikonsumsi oleh `/auth/me`, refresh atau logout.
- Pengeditan/pengiriman pengajuan memakai transaksi dan penguncian status; resubmit membersihkan identitas peninjau sebelumnya.
- Lokasi upload konsisten pada mode development dan build (`backend/uploads`), atau mengikuti `UPLOAD_DIRECTORY` jika diatur.
- JSON rusak ditolak dengan 400; JSON terlalu besar dengan 413, bukan kesalahan internal 500.
- Authorization, cookie sesi, Set-Cookie, dan password pada log request disamarkan.
- Seed demo diuji dua kali pada database sementara, memakai file kredensial QA terpisah dari kredensial presentasi.
- Struktur 19 tabel inti tidak berubah; migrasi dan fitur recovery/showcase tambahan dibatalkan dari source. Database lokal yang sudah terisi tidak dihapus.

## Bukti pengujian dan cara mengulang

```powershell
# TypeScript, ESLint, OpenAPI, unit test dan build FE/BE
npm.cmd run check

# MariaDB sementara, migrasi/seed berulang, integrasi API + browser
npm.cmd run test:browser:local

# Database presentasi yang aktif: baca saja
npm.cmd run check:local --workspace @laperu/backend

# Server dev:all harus aktif. Login tiga peran, browser dibatasi ke localhost.
npm.cmd run check:offline --workspace @laperu/backend
```

- `npm run check`: 44 tes backend, 98 tes frontend, typecheck, lint, validasi OpenAPI dan build lolos.
- Runner MariaDB sementara untuk versi ini: 17 tes integrasi API dan 17 skenario browser lintas peran. Hasil browser terakhir tersedia di `test-results/browser-smoke.json`.
- Pemeriksaan offline: login dan pemuatan data ADMIN, CUSTOMER, UMKM lolos dengan browser hanya diizinkan mengakses localhost; tidak ada permintaan eksternal atau JavaScript exception pada tiga halaman yang diuji.
- Lingkungan: Windows, Node.js 24.15.0, MariaDB XAMPP 10.4.32, Chromium headless 153.0.8010.12.
- Runner hanya membersihkan instance/database/folder sementara yang dibuat sendiri; tidak menghapus database presentasi. Hasil browser tersimpan di `test-results/` dan diabaikan Git.
- Enam tes regresi baru dibuktikan gagal sebelum perbaikan lalu berhasil setelahnya. Tes lain mencakup upload path, error JSON dan redaksi log.

## Batas yang harus disampaikan dengan jujur

- Handoff ini memfinalkan backend untuk flow yang tersedia, bukan mengklaim semua ide dalam desain sudah diimplementasikan.
- Lupa/ganti password, 2FA, manajemen perangkat, perubahan profil akun dan hapus foto galeri belum tersedia/terhubung pada versi ini. Frontend kembali ke baseline tim; jangan menjanjikan fitur yang tidak tersedia.
- Tautan rute Google Maps tetap membutuhkan internet ketika dibuka. Aplikasi dan data lokal tidak menggantikan layanan peta eksternal. Foto yang sengaja diisi menggunakan URL eksternal juga membutuhkan koneksi; gunakan upload lokal untuk demo offline.
- Pengujian browser otomatis menggunakan Chromium; bukan bukti pengujian Safari atau seluruh perangkat fisik.
- Pemeriksaan offline memblokir permintaan HTTP eksternal di browser, bukan mematikan jaringan sistem operasi. Login dan data halaman tiga peran diuji; fungsi yang memang eksternal tidak dijamin offline.
- Pengujian otomatis bukan sertifikasi keamanan atau jaminan bebas seluruh bug. Lakukan latihan presentasi bersama tim memakai akun dan data yang memang akan ditampilkan.

## Jika ada masalah

- `ECONNREFUSED`: nyalakan MySQL XAMPP, lalu jalankan `check:local` lagi.
- `ER_ACCESS_DENIED_ERROR`: sesuaikan kredensial database **milik instalasi laptop tersebut** pada `DATABASE_URL`; jangan asal mengosongkan password atau mereset root.
- `EMAIL_EXISTS`: email sudah terdaftar. Login atau gunakan email uji baru; jangan hapus data demi mengulang demo.
- `429`: tunggu jendela 15 menit setelah terlalu banyak login/registrasi. Uji massal melalui runner QA, bukan menghabiskan kuota server presentasi.
- Port terpakai: periksa terminal/server yang sudah berjalan; jangan mematikan proses lain secara massal.
- Jangan menghapus folder `backend/uploads`, file kredensial lokal atau database XAMPP: ketiganya dibutuhkan untuk mempertahankan hasil demo.
