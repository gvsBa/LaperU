# LaperU Backend — demo lokal

Backend Express/TypeScript dan MariaDB XAMPP. Branch `backend/final-local-2026-10-29` berangkat dari `feat/frontend-ui` commit `88161f4`; hanya folder `backend/` yang diubah.

**Batas integrasi:** frontend bawaan checkout ini masih berupa prototype statis. Login di `src/pages/auth/Login.jsx` melakukan navigasi tanpa request API. Menjalankan kedua server tidak otomatis menghubungkannya. Dataset database, autentikasi, dan recovery di sini dapat digunakan melalui API/alat terminal. UI tim tidak diubah dan tidak diklaim sudah end-to-end. Tim FE perlu menyambungkan API secara terpisah jika diizinkan.

## Persiapan dan menjalankan

Perlu Node.js/npm dan MariaDB bawaan XAMPP. Diuji dengan Node 24 dan MariaDB 10.4.32 di Windows. Nyalakan **MySQL XAMPP**, tidak perlu Apache, hosting, SMS, email, atau layanan berbayar. Instalasi paket pertama memerlukan internet; runtime API, database, recovery, dan dataset tidak.

Checkout ini **bukan npm workspace**. Semua perintah backend dijalankan dari folder backend, bukan dengan `--workspace`:

```powershell
cd "D:\ASE LAB\LaperU\backend"
npm.cmd ci
npm.cmd run setup:local
```

Setup hanya membuat `backend/.env` jika belum ada, dengan secret/password admin acak, API loopback port 3001, dan database **laperu_backend_demo**. Default koneksi untuk XAMPP baru menggunakan root tanpa password; jika MySQL Anda memiliki password, sesuaikan DATABASE_URL secara privat di .env, URL-encode karakter khusus. Jangan unggah file ini. Menyalin konfigurasi koneksi lokal yang sudah benar juga didukung:

```powershell
npm.cmd run setup:local -- --database-config "D:\path-ke-proyek-lama\backend\.env"
```

Hanya koneksi MySQL lokal dibaca; nama database diganti menjadi laperu_backend_demo. File sumber dan database lama tidak diubah. Akun admin/JWT baru dibuat, bukan disalin.

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
npm.cmd run db:seed:demo
npm.cmd run db:seed:showcase
npm.cmd run check:local
npm.cmd run build
npm.cmd start
```

Untuk pengembangan gunakan `npm.cmd run dev`. Tidak perlu menjalankan install/migrasi/seed setiap kali demo. API: http://127.0.0.1:3001/api/v1. Jangan menyalakan start dan dev pada port yang sama.

Frontend asli di terminal lain:

```powershell
cd "D:\ASE LAB\LaperU"
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Buka http://127.0.0.1:5174. Perintah root `dev:all` dan `--workspace @laperu/backend` dari dokumentasi versi lama **tidak berlaku** untuk checkout ini.

## Akun dan data demo

- Admin: ADMIN_EMAIL/ADMIN_PASSWORD di `.env`.
- Customer/UMKM utama: `.demo-accounts.local.json`. Customer aktif; UMKM sudah disetujui untuk demo pengelolaan.
- Akun simulasi tambahan: `.showcase-accounts.local.json`.
- Guest: tanpa akun.
- Jangan kirim file-file tersebut ke grup atau GitHub. Seed tidak mengganti password akun yang sudah ada. Setelah mengganti password, kredensial seed lama tidak lagi cocok; jangan reset ulang database untuk mengatasinya.

Dataset awal menambahkan 16 referensi usaha publik, 12 usaha fiktif, 36 customer simulasi, 12 pemilik simulasi, 96 menu, 180 ulasan, 108 balasan, 216 favorit, 360 tayangan. Ini di luar dua akun demo utama beserta satu warung/3 menunya. ID seed stabil; pengulangan tidak menggandakan data atau menimpa perubahan pengguna.

Semua aktivitas fiktif hanya pada usaha bertanda **Simulasi**, bukan testimoni palsu untuk usaha nyata. Referensi publik mencantumkan sumber dan tanggal pengecekan; harga, jam buka, koordinat, foto, dan rating yang belum diverifikasi tidak dibuat-buat. Akun internal pengelola referensi tidak dapat login. Status APPROVED seed hanya membuat katalog tampil melalui API, **bukan bukti verifikasi pemilik nyata**.

Sumber dan batas kesegaran data: [data/SOURCES.md](data/SOURCES.md).

## Pemulihan password tanpa internet/OTP

Bukti kepemilikan adalah **kode pemulihan rahasia** yang diterbitkan setelah login dan konfirmasi password. Nama/email/NIM saja bukan bukti. Karena frontend tidak diubah, gunakan alat terminal ini dari backend:

```powershell
# Selagi masih ingat password: buat dan simpan lima kode pemulihan.
npm.cmd run account:security -- -Action generate

# Saat lupa password: email + salah satu kode yang sudah disimpan.
npm.cmd run account:security -- -Action reset

# Mengganti password saat masih mengetahui password lama.
npm.cmd run account:security -- -Action change
```

Password/kode diminta secara tersembunyi, bukan sebagai argumen command line. Kode disimpan di `backend/recovery.local/<id>.json`, tidak dicetak dan tidak masuk Git. File berisi rahasia plaintext: simpan salinan secara pribadi di lokasi terpisah dari laptop; jangan screen-share atau membagikannya. Keamanan lokal bergantung pula pada akses akun Windows/disk Anda.

Database hanya menyimpan hash SHA-256 kode acak 128-bit; password menggunakan bcrypt cost 12. Reset berhasil membatalkan **seluruh set kode lama, access token dan refresh session**. Buat set baru setelah login. Kode lama tidak bisa dipakai ulang; akun suspended tidak bisa melewati penangguhan.

Jika password dan semua kode sama-sama hilang, **tidak ada bypass otomatis**. Jangan menganggap mengetahui email cukup. Untuk akun sungguhan diperlukan prosedur verifikasi manual yang sah dan disepakati; tidak disediakan endpoint admin untuk mengambil alih akun tanpa bukti.

## Kontrak API untuk tim FE/QA

Spesifikasi: [openapi.yaml](openapi.yaml). Basis lokal: http://127.0.0.1:3001/api/v1.

- JSON untuk registrasi/login; gunakan `credentials: "include"` agar cookie refresh HttpOnly ikut dikirim.
- Endpoint privat: `Authorization: Bearer <accessToken>`. Jangan menaruh token di URL.
- Origin FE harus tercantum pada FRONTEND_ORIGIN. Gunakan host konsisten (127.0.0.1) pada FE/API.
- Berhasil: `{success: true, data: ...}`; gagal: `{success: false, code, message, ...}`.
- Role: ADMIN, CUSTOMER, UMKM; guest tidak diberi token.
- `GET /health`, `GET /health/database`.
- `POST /auth/register/customer`, `POST /auth/register/umkm`, login/refresh/logout; `GET /auth/me`.
- `POST /auth/recovery-codes`: bearer + currentPassword; respons lima kode sekali tampil.
- `POST /auth/reset-password`: email, recoveryCode, newPassword; tanpa login.
- `POST /auth/change-password`: bearer + currentPassword, newPassword.
- `GET /warungs?dataset=reference&limit=50` atau `dataset=simulation`; detail `GET /warungs/:slug`.
- Jangan memetakan `isOpen: null` menjadi “tutup”; artinya belum diketahui. Pertahankan penanda dataKind/sourceUrl/sourceCheckedOn/sourceNote, dan jangan memberi badge pemilik terverifikasi untuk PUBLIC_REFERENCE.
- Multipart unggah: `POST /umkm/uploads/images`, field `image`, JPG/PNG maksimal 2 MiB; MIME dan signature diperiksa. File lokal tetap tersedia setelah berpindah dev ke build.
- Jam operasional: 0=Senin sampai 6=Minggu, tujuh hari unik; jadwal melintasi tengah malam belum didukung.
- Endpoint pencarian/detail tidak meminta internet. Google Maps dan gambar URL eksternal (jika pengguna memasukkannya) tetap memerlukan internet.

## Verifikasi dan keselamatan

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run test:database:local
npm.cmd run build
npm.cmd audit
npm.cmd run check:local
npm.cmd run check:api
npm.cmd run db:backup:local
```

Runner database membuat instance MariaDB/database sementara, mengulang migrasi dan seed untuk menguji idempotensi, menjalankan skenario registrasi, role/ownership, pengajuan/revisi/approval, upload, menu, favorit, review/moderasi, reset dan CLI Windows, lalu membersihkan hanya direktori/proses QA yang dibuatnya. Tidak menjatuhkan database demo. Untuk instalasi lain gunakan:
`npm.cmd run test:database:local -- -DatabaseBin "D:\xampp\mysql\bin"`.

Backup tersimpan di `backups.local/` (privat, tidak masuk Git). Backup SQL mengandung hash dan data akun: lindungi seperti data sensitif. File upload perlu disalin terpisah untuk backup lengkap. MYSQLDUMP_PATH dapat diarahkan ke binary XAMPP Anda. Jangan mengimpor backup ke database lama tanpa rencana/izin.

Batas lokal: MariaDB XAMPP yang diuji, bukan sertifikasi semua versi MySQL; UI browser lintas peran tidak diuji sebagai integrasi pada branch ini karena frontend masih statis. Jangan gunakan konfigurasi demo ini sebagai deployment publik.
