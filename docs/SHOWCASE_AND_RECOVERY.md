# LaperU — paket demo lokal dan pemulihan akun

Pembaruan: **29 Oktober 2026**. Tidak membutuhkan deployment, SMS, email berbayar, atau layanan cloud untuk alur inti. Internet diperlukan untuk instalasi awal, GitHub, membuka sumber direktori, atau Maps eksternal.

## Data demo

Seed menambahkan (bukan total seluruh database):

| Jenis | Jumlah | Sifat |
|---|---:|---|
| Referensi usaha/tenant sekitar Telkom University | 16 | Nama/alamat/deskripsi dari direktori publik kampus |
| Usaha showcase | 12 | Fiktif, nama dan kartu berlabel Simulasi |
| Customer showcase | 36 | Identitas fiktif |
| Pemilik showcase aktif | 12 | Identitas fiktif |
| Menu | 96 | Harga dan ketersediaan simulasi |
| Ulasan | 180 | Teks secara eksplisit menyatakan SIMULASI |
| Balasan pemilik | 108 | Simulasi |
| Favorit | 216 | Simulasi |
| Kunjungan profil | 360 | Simulasi statistik |

16 akun internal referensi berstatus SUSPENDED dan bukan akun pemilik asli. Status APPROVED pada baris katalog berarti boleh ditampilkan oleh aplikasi lokal, **bukan bukti verifikasi usaha/pemilik**. Tidak ada password pemilik asli, nomor kontak rekaan, foto curian, atau ulasan palsu yang dilekatkan pada usaha nyata.

Sumber kanonis per entri: [`backend/data/public-listings.json`](../backend/data/public-listings.json). Semua URL menuju direktori resmi `canteen.telkomuniversity.ac.id`. Penelusuran memakai indeks publik; akses langsung sebagian halaman mengembalikan 403. Tanggal penelusuran bukan tanggal pembaruan operasional. Artikel yang diketahui bertanggal Juni 2026 dan 2024; sebagian tidak memiliki tanggal yang dapat dipastikan. **Tidak ada klaim real-time hingga detik ini.** Harga, jam operasional, koordinat, foto, dan status buka referensi sengaja tidak dikarang. UI menampilkan informasi belum dikonfirmasi, sumber, dan tanggal penelusuran.

Daftar referensi: Saip Kitchen, Aby Food, Dongmoon Dimsum Mentai, Tansoe Mapan, Chicken William, BMC Juice x Lamak, Raja Jando x Cokro, Ayam Gepuk Nuklir, Ayam Kremes Sambal Mangga, Barokah WDP Abah, Chinese Food, Warung Bu Roh, Lakeside, Shino Ramen Telkom University, Kedai Duduk Dulu Telkom University, dan Kedai Ngodeng Telkom University.

Contoh sumber terbaru yang ditemukan:

- [Saip Kitchen — 11 Juni 2026](https://canteen.telkomuniversity.ac.id/saip-kitchen-solusi-kuliner-rumahan-yang-lezat-dan-terjangkau/)
- [Aby Food — 4 Juni 2026](https://canteen.telkomuniversity.ac.id/aby-food-surga-kuliner-hemat-di-sukapura/)
- [Dongmoon — 4 Juni 2026](https://canteen.telkomuniversity.ac.id/dongmoon-dimsum-mentai-favorit-mahasiswa-telkom-university/)

Di Jelajahi, gunakan **Referensi usaha nyata** untuk sumber publik dan **Simulasi demo** untuk perjalanan lengkap menu, ulasan, favorit, dan dashboard. Ilustrasi kategori adalah ilustrasi, bukan foto makanan/usaha tersebut.

## Menjalankan atau menambahkan data

Jalankan dari root repository di VS Code. Nyalakan MySQL XAMPP dahulu. Jangan menimpa `.env` yang sudah benar.

```powershell
# Untuk laptop ini: backup sebelum perubahan database; path XAMPP default C:\xampp
npm.cmd run db:backup:local --workspace @laperu/backend
npm.cmd run db:migrate --workspace @laperu/backend
# Untuk database baru: seed referensi/admin dan akun demo terlebih dahulu
npm.cmd run db:seed --workspace @laperu/backend
npm.cmd run db:seed:demo --workspace @laperu/backend
npm.cmd run db:seed:showcase --workspace @laperu/backend
npm.cmd run check:local --workspace @laperu/backend
npm.cmd run dev:all
```

Alamat web: http://127.0.0.1:5173. API: http://127.0.0.1:3000/api/v1.

Seed memakai ID deterministik dan INSERT IGNORE agar pengulangan tidak menggandakan data atau menimpa edit yang ada. Kredensial showcase disimpan di `backend/.showcase-accounts.local.json`; akun utama demo tetap di `.demo-accounts.local.json`. Keduanya privat dan diabaikan Git. Backup berada di `backend/backups.local/`, juga diabaikan Git. Jangan hapus file kredensial lalu berharap seed akan mengganti password akun lama.

## Pemulihan password tanpa internet

1. Saat masih bisa masuk: **Akun → Keamanan → Kode pemulihan offline**. UMKM: halaman akun di dashboard.
2. Masukkan password saat ini. Sistem membuat 5 kode acak 128-bit. Unduh/simpan di tempat pribadi yang terpisah dari laptop jika memungkinkan.
3. Keluar, pilih **Lupa kata sandi?**, masukkan email akun, satu kode, password baru, dan konfirmasi.
4. Jika cocok: password berubah, semua access token dan refresh token lama tidak berlaku, serta seluruh set kode lama dibatalkan.
5. Masuk kembali secara manual dengan password baru. Buat set kode baru.

Kode adalah bukti penguasaan rahasia yang sebelumnya hanya diberikan setelah autentikasi ulang. Mengetahui email, nama, NIM, tanggal lahir, atau jawaban pertanyaan umum bukan bukti yang cukup. Jika password dan seluruh kode hilang, versi ini **tidak menyediakan bypass otomatis atau tombol admin untuk mengambil alih akun**. Pemeriksaan identitas oleh pengelola memerlukan bukti independen yang sebelumnya sudah tercatat, bukan sekadar pengakuan pemohon. Aplikasi belum melakukan verifikasi identitas mahasiswa/OTP.

Kontrol implementasi: kode hanya disimpan sebagai SHA-256 (entropy 128-bit, bukan password berentropy rendah), password menggunakan bcrypt cost 12, transaksi + penguncian akun mencegah pemakaian ganda, auth_version menolak JWT lama, refresh dicabut, respons rahasia no-store, log meredaksi rahasia, endpoint berbagi pembatasan 30 request/15 menit/IP di luar test. Tidak ada auto-login setelah reset. Akun SUSPENDED tetap ditolak.

## Perubahan skema (tambahan terhadap ERD lama)

| Tabel / kolom | Tipe | Relasi / aturan |
|---|---|---|
| users.auth_version | INT UNSIGNED NOT NULL DEFAULT 0 | Bertambah setelah password berubah |
| recovery_codes.id | CHAR(36) | Primary key |
| recovery_codes.user_id | CHAR(36) NOT NULL | FK users.id, ON DELETE CASCADE; users 1:N recovery_codes |
| recovery_codes.code_hash | CHAR(64) NOT NULL UNIQUE | SHA-256, bukan kode plaintext |
| recovery_codes.created_at | TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP | Waktu dibuat |
| recovery_codes.used_at | TIMESTAMP NULL | NULL berarti belum dibatalkan/dipakai |
| listing_sources.warung_id | CHAR(36) | PK sekaligus FK warungs.id ON DELETE CASCADE; warungs 1:0..1 listing_sources |
| listing_sources.source_url | VARCHAR(1000) NULL | URL sumber untuk referensi publik |
| listing_sources.checked_on | DATE NOT NULL | Tanggal penelusuran, bukan jaminan operasional |
| listing_sources.data_kind | ENUM('PUBLIC_REFERENCE','SIMULATION') NOT NULL | Pembeda dataset |
| listing_sources.note | VARCHAR(1000) NOT NULL | Batas fakta dan asal data |

Total skema: 21 tabel. Indeks recovery tambahan `(user_id, used_at)`. Sumber SQL: `backend/database/migrations/002_recovery_and_provenance.sql`; kontrak HTTP: `backend/openapi.yaml`.

## Uji sebelum presentasi

`npm.cmd run check` untuk typecheck, lint, OpenAPI, unit, build. `npm.cmd run test:browser:local` untuk migrasi/seed berulang, integrasi SQL dan browser pada database sementara. `npm.cmd run check:offline --workspace @laperu/backend` saat dev server aktif untuk tiga peran dengan HTTP eksternal diblokir. Runner tidak menghapus database presentasi. Chromium/headless dan viewport mobile bukan sertifikasi Safari/perangkat fisik.

Latihan 5 menit: referensi bersumber → filter simulasi → detail/menu → login customer/favorit/ulasan → UMKM/menu/balasan → admin/moderasi → recovery akun uji baru. Jangan menampilkan password/kode pada rekaman presentasi.
