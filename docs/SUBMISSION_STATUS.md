# Status persiapan pengumpulan — 20 Oktober 2026

Target pengumpulan: **22 Oktober 2026**. Penanggung jawab Backend: Achmad Bagus Pratama.

## Source yang dipakai

- Repository: https://github.com/gvsBa/LaperU
- Branch integrasi: `release/submission-2026-10-22`.
- Frontend tim: `feat/frontend-ui` sampai commit `05dc7a0161f40d3e601981069d48a72d91e3c021` (9 Oktober).
- Snapshot integrasi Backend sebelumnya: `7ec9c00`. Pekerjaan lokal lama dipertahankan sebelum penggabungan.
- Integrasi ini disiapkan untuk review; bukan pernyataan bahwa main sudah digabung atau tim telah melakukan sign-off.

## Implementasi yang tersedia

1. Guest: pencarian, filter kategori/budget/buka/rating/fasilitas/pembayaran, detail warung, menu, jadwal dan ulasan dari database.
2. Customer: registrasi/login/logout, favorit persisten, menulis enam rating, edit/hapus ulasan sendiri, dan pelaporan.
3. UMKM: identitas usaha dan foto, kirim pengajuan, menerima revisi, perbaikan/kirim ulang, profil setelah approved, menu, jadwal, fasilitas, pembayaran, foto galeri, balasan ulasan dan statistik sederhana.
4. Admin: pemeriksaan pengajuan, approve/revision/reject, status akun, profil/visibilitas warung, kategori/fasilitas, laporan, moderasi ulasan, audit log.
5. Setup database lokal XAMPP, migration/seed, demo fiktif opsional, konfigurasi lokal tanpa menimpa secret lama.

Layar publik mengikuti desain FE tim; layar pengelolaan dibuat sederhana. Ini bukan desain ulang monokrom seluruh aplikasi. Data demo diberi label fiktif, bukan daftar usaha nyata yang sudah diverifikasi.

## Hasil verifikasi lokal

| Pemeriksaan | Hasil yang diamati |
| --- | --- |
| Instalasi `npm ci` | Berhasil dari lockfile |
| `npm run check` | Berhasil diulang 20 Oktober dengan Node 24.19.0: typecheck, ESLint, OpenAPI, unit tests, build FE/BE |
| Unit Backend | 33 lulus |
| Unit frontend | 79 lulus |
| API–database | 16 skenario lulus pada MariaDB 10.4.32, database QA sementara |
| Browser end-to-end | 18 skenario lulus pada Chromium headless 153.0.8010.12 |
| Chrome terpasang | 18 skenario yang sama lulus pada Chrome 155.0.8059.82, mode headless, 19 Oktober |
| Viewport browser | 1365×900 dan mobile emulasi 390×844; tidak ada overflow horizontal pada halaman yang diuji |
| Exception JavaScript pada suite browser | Tidak ditemukan |
| `npm audit` seluruh dependency | 0 vulnerabilities pada pemeriksaan ulang 20 Oktober; bukan jaminan tidak ada celah keamanan |
| Seed demo lokal | Berhasil dijalankan dua kali, tanpa mengganti akun Admin |

Suite browser meliputi sesi/redirect, pencarian dan filter, detail/menu/favorit, error/empty/not-found, pengajuan UMKM, keputusan revisi, kirim ulang, approval, perubahan data usaha, ulasan/edit, balasan, dan moderasi. Tes memakai data fiktif; tidak berinteraksi dengan usaha nyata.

Bukti browser dihasilkan ulang pada `test-results/browser-smoke.json` dan screenshot di folder yang sama (diabaikan Git). Jalankan perintah dalam README untuk reproduksi. Pengujian menggunakan instance QA terisolasi, bukan menghapus database development.

## Kendala environment yang tercatat

- Node 24.15.0 sempat mengalami assertion libuv setelah CLI selesai. Pemeriksaan kualitas akhir berhasil dengan Node 24.19.0. Kegagalan awal tidak dihitung sebagai hasil lulus.
- Suite database/browser berhasil memakai Node 24.15.0. Percobaan seed melalui tsx pada runtime 24.19.0 sempat tertahan dan dihentikan hanya pada proses uji milik runner. Penyebabnya belum dipastikan; versi 24.19.0 tidak diklaim lulus seluruh alur runtime.
- Startup instance QA MariaDB di Windows sempat berhenti sebelum siap; log tidak menunjukkan penyebab akhir yang pasti. Pengulangan suite berhasil. Jika muncul kembali, periksa proses/port/log, jangan menghapus database development.
- Default browser memakai Chromium headless shell; binary Chromium penuh sempat gagal diluncurkan pada lingkungan ini.

## Batas dan tindakan sebelum pengumpulan

- Konfigurasi laptop lama masih memakai sebagian nilai contoh development yang sudah ada di repo. Nilai contoh bukan secret aman untuk server publik. Setup baru menghasilkan secret acak, tetapi sengaja tidak menimpa konfigurasi/akun lama. Ganti secret dan kredensial contoh secara terkoordinasi sebelum akses publik; rotasi akun lama belum dilakukan.
- Safari, perangkat fisik, MySQL 8, uji beban 50 sesi dan benchmark waktu loading belum diverifikasi. Angka Best/Normal/Worst dalam dokumen performa adalah target, bukan hasil ukur.
- Pemulihan password, email verification, pemesanan/pembayaran online dan notifikasi belum diimplementasikan.
- Radius pencarian tersedia pada API, tetapi kontrol geolokasi dan pilihan sortir baru FE belum dihubungkan. UI memakai urutan server rating/jumlah ulasan.
- JSX aktif diperiksa lint/build/browser; typecheck frontend tidak berarti seluruh JSX telah dikonversi menjadi TypeScript.
- Dokumen SRS/SDD/desain/test plan final milik tim masih perlu dicocokkan dan disahkan oleh SA, UI/UX, FE dan QA. Dokumen lokal ini bukan pengganti sign-off tersebut.
- Review PR, simulasi presentasi di laptop, backup privat, dan pengumpulan LMS tetap harus dilakukan. Tidak ada klaim deployment produksi atau pengiriman laporan ke grup.

Panduan: [README](../README.md), [urutan demo](SUBMISSION_GUIDE.md), [weekly report](WEEKLY_REPORT.md), [kontrak integrasi](FRONTEND_BACKEND_HANDOFF.md).
