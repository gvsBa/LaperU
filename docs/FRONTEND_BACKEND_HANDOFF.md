# Handoff integrasi Frontend–Backend LaperU

Diperbarui **19 Oktober 2026**, untuk pengumpulan **22 Oktober 2026**. Basis FE tim: `05dc7a0` (detail warung, 9 Oktober), dengan integrasi Backend pada branch `release/submission-2026-10-22`. Catatan pengujian September tetap tersedia di `PROGRESS_2026-09-19.md`; jangan gunakan angka historis sebagai hasil terbaru.

## Menjalankan

Ikuti README root: `npm ci` → `npm run setup:local` → Start MySQL XAMPP → migration → seed → `npm run dev:all`. Database pengumpulan lokal MariaDB/XAMPP. Gunakan http://127.0.0.1:5173; backend pada port 3000.

Seed biasa tidak mereset akun yang sudah ada. Seed demo opsional menambahkan data fiktif dan menyimpan kredensial di file privat yang tidak di-commit. Folder lama `D:\ASE LAB\laperu-web` tetap dipertahankan.

## Kontrak dan halaman

Prefix endpoint: `/api/v1`. Berhasil: `{success:true,data:...}`; gagal: `{success:false,code,message,details?}`.

| Halaman | Sumber data / aksi |
|---|---|
| Login/registrasi | `/auth/login`, `/auth/register/customer`, `/auth/register/umkm` |
| Beranda / Explore | `/warungs`, `/meta`; kategori, harga maksimum, rating minimum, fasilitas, pembayaran, buka, pagination |
| `/restaurants/:slug` | `GET /warungs/:slug`; menu/harga/foto/jadwal/rating/ulasan/Maps |
| `/favorites` | `/customer/favorites`, tambah/hapus berdasarkan UUID warung |
| `/reviews` dan form detail | `/customer/reviews`; membuat, mengubah, menghapus ulasan sendiri |
| Laporan pada detail | `POST /customer/reports`; target WARUNG atau REVIEW |
| `/umkm` | pengajuan/foto/revisi, profil/menu/jadwal/fasilitas/pembayaran/galeri/balasan/statistik |
| `/admin` | dashboard, pagination pengajuan/pengguna/warung, keputusan, laporan, data master, audit |
| `/account` | identitas sesi, navigasi sesuai role dan logout |

Detail menggunakan **slug**, bukan ID numerik dari mock FE. Mutasi memakai UUID dari respons, bukan slug. Pengajuan Admin memakai **submissionId**, bukan profileId. Daftar warung menggunakan `items/pagination`; favorit berupa array. Nilai SQL boolean/numerik dinormalisasi di service frontend. Data kosong/gagal tidak diganti mock.

Logo dan gaya halaman FE terbaru diintegrasikan; kontrol yang belum memiliki integrasi tidak ditampilkan seolah sudah berfungsi. Filter/sort lokal mock dari FE diganti filter server; urutan saat ini rating/jumlah ulasan, bukan sortir harga/jarak di client.

## Sesi dan batas akses

- Access token di memori, refresh cookie HttpOnly; tidak menyimpan token di localStorage.
- Client menyertakan credentials dan token pada endpoint privat. Refresh berbagi satu pekerjaan untuk mencegah rotasi ganda.
- Generasi sesi menolak respons lama setelah logout/pergantian akun.
- Parameter `next` mengizinkan hanya route internal yang dikenal, termasuk Admin/UMKM/riwayat ulasan. Role gate UI tidak menggantikan otorisasi Backend.
- UMKM baru: akun PENDING dan pengajuan DRAFT. Lengkapi identitas/foto lalu kirim menjadi PENDING.
- Admin meminta REVISION, menolak REJECTED, atau menyetujui APPROVED. Hanya DRAFT/REVISION dapat diedit/dikirim ulang; penolakan bukan otomatis membuka pengajuan baru.
- Persetujuan mengaktifkan akun dan membuat warung publik. Status akun, pengajuan, publikasi warung, dan buka/tutup adalah hal berbeda.
- Laporan RESOLVED tidak otomatis menyembunyikan ulasan. Tindakan moderasi terpisah.
- Penghapusan menu melalui flag aktif; penghapusan ulasan menghapus balasan terkait.

## Lingkungan dan batas

Proxy Vite meneruskan `/api` dan `/uploads`; proxy bukan konfigurasi deployment. Backend upload menyimpan gambar lokal. Seed demo tidak membuat usaha nyata.

Jadwal mengikuti waktu server database lokal. Statistik kunjungan menghitung permintaan detail, bukan pengunjung unik. Admin audit menampilkan maksimal 200 aktivitas; ulasan pemilik maksimal 200 dan ulasan publik maksimal 50. Tidak semua daftar dipaginasi.

Belum termasuk: lupa password, verifikasi identitas mahasiswa, radius/geolokasi pada UI, sortir harga/jarak UI, penghapusan galeri melalui UI, dan deployment publik. Safari/perangkat fisik/performa multiuser membutuhkan penerimaan terpisah.

## Pengujian dan koordinasi

Jalankan `npm run check`, `npm audit`, dan `npm run test:browser:local`. Browser default memakai headless shell; Chrome dapat dipilih dengan `LAPERU_BROWSER_CHANNEL=chrome`. Hasil aktual dan keterbatasan ada di `SUBMISSION_STATUS.md`.

SA menyelaraskan SDD dengan schema 19 tabel dan kontrak OpenAPI. QA meninjau bukti browser/API, menambahkan penerimaan manual sesuai test case tim, dan mengisi hasil aktual. FE meninjau penggabungan visual pada PR. Tidak ada klaim dokumen Notion/Drive tim telah diedit atau disahkan.
