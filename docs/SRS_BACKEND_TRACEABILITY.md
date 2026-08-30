# Traceability SRS ke Backend

Dokumen ini menyelaraskan SRS `Software Requirements Specification Team Frame_ASE LAB 2026` dengan REST API. Status `Siap` berarti kontrak endpoint dan implementasi Backend tersedia; pengujian end-to-end tetap membutuhkan migration serta seed pada MySQL.

| Requirement | Ringkasan | Endpoint/implementasi | Status |
|---|---|---|---|
| FR-LOG-01 | Login akun | `POST /auth/login`, refresh, logout, dan `GET /auth/me` | Siap |
| FR-REG-01 | Registrasi Customer/UMKM | `POST /auth/register/customer`, `POST /auth/register/umkm` | Siap |
| FR-ADM-01 | Dashboard ringkasan | `GET /admin/dashboard` | Siap |
| FR-ADM-02 | Daftar pengajuan UMKM | `GET /admin/applications` dengan status dan pagination | Siap |
| FR-ADM-03 | Verifikasi UMKM | Detail dan keputusan approve/revision/reject | Siap |
| FR-ADM-04 | Suspend akun | Daftar pengguna dan ubah status | Siap |
| FR-ADM-05 | Kelola warung, kategori, fasilitas | Endpoint Admin warung, kategori, dan fasilitas | Siap |
| FR-ADM-06 | Moderasi ulasan/laporan | Daftar laporan, keputusan laporan, visibility ulasan | Siap |
| FR-ADM-07 | Audit log | `GET /admin/audit-logs` dan pencatatan tindakan penting | Siap |
| FR-UMK-01 | Pengajuan dan status verifikasi | `GET/PATCH /umkm/application`, submit | Siap |
| FR-UMK-02 | Revisi pengajuan | Catatan Admin, edit ketika `REVISION`, kirim ulang | Siap |
| FR-UMK-03 | Profil, fasilitas, pembayaran | Profil warung, `PUT /facilities`, `PUT /payment-methods` | Siap |
| FR-UMK-04 | Kelola menu | List, tambah, ubah, dan nonaktifkan menu | Siap |
| FR-UMK-05 | Jam dan status buka/tutup | Operating hours dan `statusOverride` | Siap |
| FR-UMK-06 | Unggah foto | Multipart JPG/JPEG/PNG maksimal 2 MB lalu simpan URL | Siap |
| FR-UMK-07 | Balas ulasan | List ulasan dan upsert balasan | Siap |
| FR-UMK-08 | Statistik sederhana | Kunjungan profil, 30 hari, favorit, rating, ulasan | Siap |
| FR-CUS-01 | Guest mode | Pencarian dan detail warung bersifat publik | Siap |
| FR-CUS-02 | Pencarian/filter | Nama/menu, harga, kategori, status, rating, fasilitas, pembayaran, dan radius jarak dari koordinat pengguna | Siap |
| FR-CUS-03 | Detail warung | Profil, menu, jam, foto, fasilitas, pembayaran, ulasan | Siap |
| FR-CUS-04 | Enam kategori rating | Rasa, harga, porsi, kebersihan, kenyamanan, kecepatan | Siap |
| FR-CUS-05 | Edit/hapus ulasan | Hanya pemilik ulasan | Siap |
| FR-CUS-06 | Laporan | `POST /customer/reports` | Siap |
| FR-CUS-07 | Riwayat ulasan | `GET /customer/reviews` | Siap |
| FR-CUS-08 | Favorit | List, tambah, hapus | Siap |
| FR-CUS-09 | Rute peta | `mapUrl` Google Maps pada detail warung | Siap |

## Temuan dokumen yang perlu dikonfirmasi SA/QA

- Deskripsi requirement pertama `FR-CUS-07` di tabel SRS tertulis menyimpan daftar favorit, padahal nama fitur, use case, activity diagram, dan RTM menyatakan `Riwayat Ulasan`. Backend mengikuti use case/RTM: FR-CUS-07 adalah riwayat ulasan; FR-CUS-08 adalah favorit.
- Test Plan mencantumkan pemulihan/lupa password dalam cakupan Autentikasi, tetapi SRS hanya memiliki FR Login dan Register. Fitur lupa password belum dibuat agar Backend tidak menambah scope tanpa requirement ID.
- Backend menerima `latitude`, `longitude`, dan `radiusKm` (maksimal 50 km) untuk filter jarak. Frontend tetap harus meminta izin lokasi atau menyediakan titik awal manual; keputusan UX ini perlu dikonfirmasi ke SA/UIUX.
