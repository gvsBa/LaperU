# Fikri — mulai QA LaperU dari nol

Tanggal: 23 Oktober 2026. Branch uji: integration/frontend-api-2026-10-22.
Ini panduan menjalankan dan menguji aplikasi, bukan klaim seluruh desain sudah menjadi fitur.

## 1. Konsep singkat

GitHub menyimpan kode. Git mengambil kode ke laptop. VS Code membuka kode dan terminal. Node.js menjalankan Frontend/Backend. XAMPP menyediakan database MariaDB lokal (tombolnya bernama MySQL). Browser menampilkan aplikasi.

Database, akun, file gambar unggahan, dan password tidak dibagikan melalui GitHub. Fikri akan mempunyai data uji sendiri. Postman, Docker dan GitHub Desktop tidak wajib; browser cukup untuk UAT dasar.

## 2. Peralatan

- VS Code yang sudah terpasang.
- Git untuk Windows dari https://git-scm.com/downloads/win.
- Node.js 24.x dari https://nodejs.org/en/download. Verifikasi integrasi ini memakai 24.19.0.
- XAMPP dari https://www.apachefriends.org/download.html. Runtime SQL yang diuji: MariaDB 10.4.32.
- Chrome. Safari harus diuji pada macOS/iOS oleh anggota yang mempunyai perangkat tersebut; emulasi layar mobile bukan Safari.

Buka terminal PowerShell baru di VS Code setelah instalasi; periksa git --version, node --version, npm.cmd --version. Jika code tidak dikenali, gunakan File → Open Folder, tidak perlu menginstal ulang VS Code.

## 3. Ambil kode

Buka terminal pada folder tempat project akan disimpan. Pakai nama folder baru agar tidak mengubah pekerjaan lain.

~~~powershell
git clone --branch integration/frontend-api-2026-10-22 https://github.com/gvsBa/LaperU.git LaperU-QA
cd LaperU-QA
code .
npm.cmd ci
npm.cmd run setup:local
~~~

Jika folder LaperU-QA sudah ada, buka folder itu dan periksa git status sebelum memperbarui. Jangan reset/force checkout untuk menghilangkan perubahan. Repository privat membutuhkan akun GitHub yang telah diberi akses; jangan meminta token teman.

## 4. Siapkan database dan akun

1. XAMPP Control Panel → Start MySQL. Apache hanya diperlukan jika ingin membuka phpMyAdmin.
2. Buka backend/.env. DATABASE_URL harus menunjuk database lokal milikmu.
3. Default setup adalah mysql://root@127.0.0.1:3306/laperu, cocok hanya jika root lokal memang tidak punya password. Jika tidak cocok, gunakan kredensial yang benar; jangan mengubah/mereset password MySQL agar menyesuaikan contoh.
4. Jalankan dari root project:

~~~powershell
npm.cmd run db:migrate --workspace @laperu/backend
npm.cmd run db:seed --workspace @laperu/backend
npm.cmd run db:seed:demo --workspace @laperu/backend
npm.cmd run dev:all
~~~

Buka http://127.0.0.1:5173. Endpoint http://127.0.0.1:3000/api/v1/health/database harus mengembalikan success true.

Admin memakai ADMIN_EMAIL/ADMIN_PASSWORD pada backend/.env saat pertama di-seed. Customer/UMKM demo ada di backend/.demo-accounts.local.json. Buka secara pribadi di editor; jangan screenshot password, kirim .env, atau commit file tersebut. Seed tidak mengganti password akun yang sudah ada.

UMKM demo sudah approved. Untuk menguji proses verifikasi, buat akun UMKM baru di halaman Daftar → Pemilik warung. Untuk berganti role gunakan Chrome biasa dan Incognito/profil browser terpisah, atau logout dulu. Satu profil browser menggunakan satu refresh cookie aktif.

## 5. Urutan tes utama

Ikuti [QA_TEST_CHECKLIST.md](QA_TEST_CHECKLIST.md):

1. Guest mencari warung dan membuka detail.
2. Customer daftar/login, favorit, ulasan dan laporan.
3. UMKM baru daftar, unggah foto, kirim pengajuan.
4. Admin minta revisi → UMKM memperbaiki → Admin menyetujui.
5. UMKM mengisi profil/menu/jam/fasilitas/pembayaran/foto, lalu lihat hasilnya dari Customer/Guest.
6. UMKM membalas ulasan → Admin memoderasi → Customer melihat status laporan.
7. Reload setelah menyimpan untuk memastikan data benar-benar tersimpan.
8. Tes input salah, akses role lain, unggahan oversize dan kondisi jaringan gagal.

Jangan lakukan uji keamanan pada website lain, layanan kampus atau database nyata. Gunakan instance LaperU lokal dan data fiktif.

## 6. Data uji dan bukti

~~~powershell
npm.cmd run qa:generate-images --workspace @laperu/backend
~~~

Sampel berada di backend/test-data/generated/. Gunakan gambar valid, file palsu dan oversize. Batas gambar 2 MB (2.097.152 byte), format JPG/PNG. Data fiktif: nama Warung QA Fikri, alamat Alamat fiktif pengujian kampus, email unik domain example.test. Buat password khusus QA yang tidak dipakai pada akun pribadi.

Format laporan bug:
- ID kasus dan judul.
- Commit: hasil git rev-parse --short HEAD.
- Tanggal/jam, browser/versi, ukuran layar.
- Role dan status pengajuan (tanpa password/token).
- Langkah reproduksi 1–2–3.
- Hasil yang diharapkan dan hasil aktual.
- Screenshot/video tanpa data rahasia.
- Endpoint, status HTTP dan pesan error bila tersedia (F12 → Network; jangan salin Authorization/Cookie).
- Severity: blocker / major / minor.
- Status: PASS / FAIL / BLOCKED / NOT RUN. Jangan menandai PASS jika belum dicoba.

## 7. Masalah umum

- npm.ps1 diblokir: gunakan npm.cmd, tidak perlu mengubah Execution Policy global.
- Access denied root@localhost: MySQL terjangkau, tetapi user/password tidak cocok. Periksa DATABASE_URL dan login lokal. Jangan menghapus database.
- ECONNREFUSED pada 3306: MySQL belum aktif atau port salah.
- Gagal fetch / proxy error: pastikan npm.cmd run dev:all masih berjalan dan API health/database berhasil.
- Port 5173/3000 dipakai: periksa terminal project yang sudah berjalan; tutup hanya proses milikmu, jangan mematikan semua Node atau MySQL.
- Login Admin gagal setelah mengganti .env: seed tidak mereset password akun lama. Hubungi Bagus; jangan DROP database.
- Gambar milik laptop lain tidak muncul: unggahan tersimpan lokal, tidak ikut clone GitHub.
- Nearest meminta lokasi: izinkan lokasi; warung tanpa koordinat tidak masuk hasil terdekat.
- Tombol 2FA/password/edit akun tidak aktif: memang belum diimplementasikan, lihat daftar batasan. Tidak dicatat sebagai PASS fungsi.
- Jika otomatisasi Node 24.15 berhenti dengan worker/libuv error, ulangi memakai Node 24.19 yang dipakai verifikasi. Catat versi dan kegagalan; jangan menghapus tes.

## 8. Tes otomatis (opsional untuk Fikri)

~~~powershell
npm.cmd run check
npx.cmd playwright install chromium
npm.cmd run test:browser:local
~~~

Tes browser juga menjalankan 16 skenario API/SQL terlebih dahulu. Runner membuat database sementara pada port acak dan membersihkannya sendiri. Default XAMPP C:\xampp; opsi lokasi lain ada di README. Laporan/screenshot otomatis berada di test-results/. Tes otomatis tidak menggantikan review desain FE, Safari, pengukuran performa, atau uji manual di laptop Fikri.
