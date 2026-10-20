# LaperU — Handoff Backend untuk SDD

Tanggal penyusunan awal: **15 September 2026**. Pembaruan integrasi: **19 Oktober 2026**. Penanggung jawab Backend: **Achmad Bagus Pratama**.

Untuk pengumpulan 22 Oktober, database berada di laptop melalui XAMPP/MariaDB 10.4.32. Frontend aktif adalah React JSX dari tim, bukan entry TypeScript lama. Dashboard UMKM/Admin, tulis/edit/hapus ulasan Customer, laporan, dan moderasi sudah dihubungkan pada branch pengumpulan. Daftar route/hasil uji terkini berada di `FRONTEND_BACKEND_HANDOFF.md` dan `SUBMISSION_STATUS.md`. Dokumen ini tetap bahan koordinasi, bukan klaim SDD final tim sudah disahkan.

Dokumen ini adalah bahan koordinasi dengan Khalif (SA), UI/UX, Frontend, dan QA, bukan pengganti SDD final atau bukti bahwa seluruh fitur sudah lulus pengujian. Isi diturunkan dari kode dan migration di repository, bukan dari asumsi desain. Status **tersedia** berarti implementasi ditemukan; hasil eksekusi database, pengujian API, integrasi browser, dan persetujuan tim harus dicatat terpisah.

## 1. Arsitektur yang tersedia

```text
Browser / Frontend React JSX
  ├─ REST JSON /api/v1/* ──> Express + TypeScript
  │                          ├─ CORS, JSON parser, cookie parser, Helmet
  │                          ├─ autentikasi + otorisasi role + validasi Zod
  │                          ├─ modul auth / warungs / customer / umkm / admin / meta
  │                          └─ mysql2 pool ──> MariaDB lokal XAMPP / InnoDB
  └─ file /uploads/* <────── penyimpanan gambar lokal Backend
```

- Bentuk aplikasi: satu Backend modular, bukan microservices. Sebagian besar query berada di route handler; autentikasi memisahkan service.
- Identitas record umumnya UUID. Query nilai memakai parameter; nama kolom dinamis dipilih dari daftar tetap di kode.
- Konfigurasi lokal: `DATABASE_URL`, `FRONTEND_ORIGIN`, `PORT`, `PUBLIC_API_ORIGIN`, secret dan umur token, serta direktori/batas upload.
- `/api/v1/health` memeriksa proses API; `/api/v1/health/database` memeriksa koneksi MySQL. Keduanya bukan jaminan semua fitur berfungsi.
- Deployment final, domain Frontend/API, HTTPS, penyimpanan gambar persisten, dan backup belum ditetapkan dalam dokumen ini.

Sumber: `backend/src/app.ts`, `backend/src/config/env.ts`, `backend/src/db/pool.ts`.

## 2. Pembagian modul dan akses

Semua path berikut berada di bawah `/api/v1`.

| Aktor | Modul / path utama | Kemampuan yang tersedia di Backend |
|---|---|---|
| Guest dan semua pengguna | `/warungs`, `/warungs/:slug`, `/meta` | Pencarian/filter, detail warung aktif yang disetujui, menu, ulasan terlihat, informasi referensi, tautan rute peta |
| Pengguna akun | `/auth/*` | Registrasi Customer/UMKM, login, refresh, logout, profil sesi |
| Customer | `/customer/favorites`, `/customer/reviews`, `/customer/reports` | Favorit, membuat/mengubah/menghapus ulasan sendiri, riwayat ulasan, mengirim laporan |
| UMKM | `/umkm/application`, `/umkm/application/submit` | Melihat pengajuan, mengedit draft/revisi, mengirim pengajuan |
| UMKM | `/umkm/warung`, `/umkm/menus`, `/umkm/operating-hours`, `/umkm/facilities`, `/umkm/payment-methods` | Mengelola warung milik akun setelah record warung tersedia melalui persetujuan Admin |
| UMKM | `/umkm/uploads/images`, `/umkm/photos`, `/umkm/reviews`, `/umkm/statistics` | Upload dan pencatatan foto, membalas ulasan warung sendiri, statistik sederhana |
| Admin | `/admin/dashboard`, `/admin/users`, `/admin/applications` | Ringkasan, status akun, peninjauan dan keputusan pengajuan |
| Admin | `/admin/warungs`, `/admin/categories`, `/admin/facilities`, `/admin/reports`, `/admin/reviews`, `/admin/audit-logs` | Pengelolaan warung/referensi, moderasi, audit tindakan tertentu |

Tidak ada role `GUEST` di tabel akun: guest adalah pengguna tanpa sesi. Tidak ada endpoint registrasi Admin publik; akun Admin disiapkan melalui seed. Akses privat ditentukan Backend, bukan hanya menu yang disembunyikan Frontend.

## 3. Model data dan relasi utama

Migration acuan: `backend/database/migrations/001_initial_schema.sql`.

| Kelompok | Relasi dan aturan penting |
|---|---|
| Akun dan sesi | `users` 1:N `refresh_tokens`; email unik; role `ADMIN/CUSTOMER/UMKM`; status akun `ACTIVE/PENDING/SUSPENDED` |
| Kepemilikan usaha | `users` 1:0..1 `umkm_profiles`; profil 1:0..1 `umkm_submissions` dan 1:0..1 `warungs`. Alur registrasi UMKM membuat profil dan submission sekaligus |
| Kategori | `categories` 1:N `warungs`; satu warung maksimal satu kategori dan boleh belum memiliki kategori |
| Konten warung | `warungs` 1:N `menu_items`, `operating_hours`, `photos`, dan `warung_profile_views` |
| Fasilitas/pembayaran | N:M melalui `warung_facilities` dan `warung_payment_methods` |
| Favorit | N:M Customer–warung melalui `favorites`, unik untuk pasangan pengguna dan warung |
| Ulasan | `users` dan `warungs` masing-masing 1:N `reviews`; satu ulasan per pasangan pengguna–warung; enam skor integer 1–5; status `VISIBLE/HIDDEN` |
| Balasan | Satu ulasan maksimal satu `review_replies`; penyimpanan berikutnya memperbarui balasan |
| Laporan | `reports` menunjuk pelapor dan peninjau; `target_type` + `target_id` bersifat polimorfik, bukan foreign key langsung ke warung/ulasan |
| Audit | `audit_logs` menunjuk Admin dan identitas entitas; beberapa aksi penting dicatat, bukan setiap perubahan sistem |

Catatan desain yang perlu masuk SDD:

- Satu akun UMKM saat ini hanya memiliki satu profil dan satu warung. Dukungan banyak cabang membutuhkan perubahan model.
- Pengajuan menyimpan status/catatan terbaru pada satu record; bukan tabel riwayat setiap versi pengajuan. Keputusan Admin juga dicatat pada audit log.
- Penonaktifan warung/menu memakai `is_active`, bukan menghapus record. Customer menghapus ulasannya secara permanen; balasan ikut terhapus melalui foreign key.
- `price_min/price_max` pada profil warung diisi terpisah; belum dihitung otomatis dari harga menu.
- Jumlah kunjungan adalah jumlah pembukaan detail yang tercatat, bukan jumlah pengunjung unik. Statistik 30 hari memakai waktu database.
- Rating agregat adalah rata-rata enam aspek dari ulasan berstatus `VISIBLE`.

## 4. Alur autentikasi

```text
Registrasi / login
  → validasi input dan kredensial
  → accessToken + user dikirim sebagai JSON
  → refresh token dikirim sebagai cookie HttpOnly
  → Frontend memakai Authorization: Bearer <accessToken>
  → Backend memeriksa token serta role/status akun dari database
```

- Customer baru berstatus `ACTIVE`. UMKM baru berstatus akun `PENDING`, tetapi dapat login untuk melengkapi pengajuan.
- Password di-hash dengan bcrypt. Refresh token acak disimpan di database sebagai hash SHA-256; token aslinya tidak dikirim di JSON.
- Default access token 15 menit dan refresh cookie 30 hari, dapat diubah lewat environment.
- `POST /auth/refresh` menerima cookie dan mengganti refresh token. Frontend perlu mengambil access token baru saat membuka ulang aplikasi dan menangani sesi kedaluwarsa.
- `GET /auth/me` mengembalikan `{ id, fullName, email, role, status }` pada `data`, bukan objek session lengkap.
- `POST /auth/logout` mencabut refresh token yang dikirim dan membersihkan cookie. Access token yang sudah diterbitkan tidak dicabut individual oleh endpoint ini; Frontend harus menghapus token dari memorinya.
- Cookie memakai `HttpOnly`, path `/api/v1/auth`, `SameSite=Lax`, serta `Secure` pada production. `credentials: 'include'` diperlukan. Domain/site deployment harus dibahas sebelum memakai Frontend dan API pada situs berbeda.

**Kondisi Frontend repository saat dokumen disusun:** halaman login dan pendaftaran Customer sudah memanggil API, tetapi klien baru menyediakan `login` dan `registerCustomer`. Pemulihan sesi, refresh otomatis, logout, route guard, pendaftaran UMKM, dan perpindahan dashboard per role belum tersedia. Access token saat ini hanya di memori. Checkbox **Ingat saya** belum mengubah masa sesi.

## 5. Alur pengajuan UMKM dan keputusan Admin

```text
Registrasi UMKM
  → akun PENDING + profil + pengajuan DRAFT
  → lengkapi identitas + upload foto → simpan URL pada pengajuan
  → submit → pengajuan PENDING, form terkunci
  → Admin meninjau
      ├─ REVISION + catatan → pemilik edit → submit ulang → PENDING
      ├─ REJECTED + catatan → terminal pada implementasi saat ini
      └─ APPROVED → akun ACTIVE + warung APPROVED dan aktif
                     → pemilik dapat mengelola konten warung
```

- Submit memerlukan nama usaha, nama pemilik, telepon, alamat, dan foto tampak depan.
- Hanya pengajuan `PENDING` dapat diberi keputusan Admin. Revisi/penolakan wajib memiliki catatan minimal lima karakter.
- Transaksi persetujuan memperbarui pengajuan, mengaktifkan akun, membuat/mengaktifkan warung, dan mencatat audit.
- **Status akun, status pengajuan, dan status publikasi warung berbeda.** Tampilan status pengajuan harus memakai `GET /umkm/application`, bukan hanya `user.status`.
- Warung baru langsung memenuhi syarat publikasi setelah disetujui walaupun kategori, koordinat, harga, menu, dan jam bisa masih kosong. Jika tim menghendaki tahap “lengkapi profil sebelum terbit”, alur itu perlu disepakati dan diimplementasikan.
- Upload gambar dapat dilakukan UMKM saat masih draft. Upload hanya mengembalikan URL; untuk foto pengajuan lanjutkan `PATCH /umkm/application` dengan `storefrontPhotoUrl`, untuk galeri warung lanjutkan `POST /umkm/photos`.
- Penangguhan akun oleh Admin tidak otomatis menyamakan status pengajuan atau menonaktifkan publikasi warung. Kebijakan ini perlu dipastikan.

## 6. Kontrak praktis dengan Frontend

Spesifikasi endpoint: `backend/openapi.yaml`. Cocokkan contoh UI dengan schema validasi dan response aktual sebelum mengunci SDD.

| Area | Kontrak yang harus diikuti |
|---|---|
| Base URL | Environment Frontend `VITE_API_BASE_URL`; default `http://localhost:3000/api/v1`. Origin Frontend harus ada di `FRONTEND_ORIGIN` Backend |
| Berhasil | `{ "success": true, "data": ..., "message"?: "..." }`. Banyak mutasi mengembalikan `data: null`; lakukan refetch bila butuh tampilan terbaru |
| Gagal | `{ "success": false, "code": "...", "message": "...", "details"?: ... }`; validasi mengembalikan HTTP 422 dan rincian field |
| Sesi | Request privat memakai Bearer; request auth berbasis cookie memakai `credentials: 'include'`; 401 = sesi tidak dapat dipakai, 403 = akses ditolak/akun ditangguhkan |
| Pagination | List berhalaman memakai `data.items` dan `data.pagination { page, limit, total, totalPages }`; list lain seperti favorit, menu, dan referensi berupa array |
| Identitas | Detail publik memakai **slug**, sedangkan favorit/ulasan/mutasi memakai **UUID**. `GET /umkm/application` mengembalikan `id` lama (= ID profil), `profileId`, dan `submissionId`; gunakan `submissionId` untuk keputusan Admin. `GET /admin/applications` memakai `id` submission |
| Referensi | Ambil kategori/fasilitas/pembayaran dari `/meta`; filter publik memakai **slug**, penyimpanan relasi UMKM memakai **id** |
| Lokasi | Kirim `latitude` dan `longitude` bersama; `radiusKm` membutuhkan keduanya dan maksimal 50. Tanpa koordinat pengguna, pencarian tetap tersedia |
| Harga | Integer rupiah; filter menggunakan rentang harga profil warung, bukan jaminan bahwa setiap menu berada pada budget tersebut |
| Jam | `dayOfWeek` mengikuti query Backend: 0=Senin sampai 6=Minggu. PUT mengirim tujuh hari unik; hari buka wajib kedua jam. Input jam `HH:mm`, output database `TIME` dapat berupa `HH:mm:ss` |
| Pembayaran | Detail publik memakai key `payments`; detail milik UMKM memakai `paymentMethods` |
| Kategori edit | Response `/umkm/warung` menyertakan `categoryId` (UUID atau null) agar form edit dapat mengisi nilai kategori tersimpan |
| Nilai boolean | Input API memakai boolean; flag hasil MySQL seperti `isOpen/isAvailable/isActive/isClosed` dapat berupa angka 0/1. Jangan mengandalkan kesetaraan `=== true` tanpa normalisasi |
| Gambar | `multipart/form-data` dengan satu field `image`; JPEG/PNG, default maksimal 2 MiB (2.097.152 byte). Jangan menetapkan `Content-Type: application/json` saat mengirim FormData |
| Ulasan | Wajib enam skor: `tasteRating`, `priceRating`, `portionRating`, `cleanlinessRating`, `comfortRating`, `speedRating`; masing-masing 1–5. Ulasan kedua pada warung sama menghasilkan 409 `REVIEW_EXISTS` |

Pencarian publik: `q`, `category`, `facility`, `payment`, `minPrice`, `maxPrice`, `minRating`, `openNow`, `latitude`, `longitude`, `radiusKm`, `page`, dan `limit`. `openNow` pada query memakai string `true/false`. Urutan bawaan rating, jumlah ulasan, nama; bila koordinat diberikan, jarak menjadi prioritas pertama. Peta berupa tautan Google Maps, bukan layanan navigasi internal.

Klien Frontend saat ini baru meneruskan pesan error dan HTTP status, belum `code/details`. Untuk pesan error per field dan state khusus seperti `APPLICATION_LOCKED`, FE perlu menyimpan metadata tersebut.

## 7. Batas implementasi dan verifikasi

- Belum tersedia endpoint lupa/reset password atau verifikasi email mahasiswa. Jangan menampilkan “mahasiswa terverifikasi” hanya karena registrasi berhasil.
- Persetujuan syarat penggunaan saat ini divalidasi Frontend saja; Backend belum menyimpan waktu/versi persetujuan.
- Jam buka otomatis belum mendukung operasional lintas tengah malam; zona waktu deployment dan validasi jam masih perlu dipastikan.
- Upload memeriksa ukuran, MIME, dan signature awal file; belum merupakan validasi decode gambar penuh. Penyimpanan masih lokal, belum object storage/CDN.
- Tidak tersedia fitur pesanan, pembayaran transaksi, pengantaran, promo, atau rekomendasi berbasis AI. Informasi metode pembayaran adalah atribut warung saja.
- Browser Chrome/Safari, beban pengguna, dan target performa tidak dapat dinyatakan lulus dari build atau tes unit saja.
- Status dan bukti pengujian harus mengacu pada catatan QA/hasil eksekusi terbaru. Dokumen ini tidak menyatakan E2E MySQL atau integrasi UI sudah lulus.

## 8. Keputusan yang dibutuhkan untuk finalisasi SDD

| Pemilik keputusan | Pertanyaan terarah | Pengaruh ke implementasi |
|---|---|---|
| SA + UI/UX + BE | Apakah penolakan final atau boleh diperbaiki dan diajukan ulang? | State machine pengajuan dan tombol aksi |
| SA + UI/UX + BE | Apakah persetujuan Admin langsung mempublikasikan warung atau menunggu profil lengkap? | Syarat publikasi dan halaman onboarding |
| SA + BE | Saat akun pemilik ditangguhkan, apakah warung ikut disembunyikan? | Aturan status akun vs publikasi |
| SA + QA | Apakah lupa password termasuk MVP? Jika ya, tambahkan requirement dan alurnya | Endpoint reset, pengiriman email, test case |
| SA + UI/UX | Apakah wajib email Telkom/validasi mahasiswa? Bagaimana teks persetujuan dan pencatatannya? | Form pendaftaran dan data tambahan |
| UI/UX + FE | Tujuan sesudah login per role, tampilan sesi habis, serta arti “Ingat saya”? | Route guard, refresh, perilaku sesi |
| UI/UX + FE | Jika izin lokasi ditolak, pakai titik kampus/manual atau tanpa filter jarak? | State lokasi dan parameter pencarian |
| SA + BE + UI/UX | Dukungan jam melewati tengah malam, patokan WIB, dan sumber rentang harga? | Validasi jam, status buka, dan filter budget |
| FE + BE | Domain/origin pengujian dan deployment serta normalisasi boolean/jam? | Kontrak response, CORS, cookie, integrasi form |

## 9. Urutan handoff berikutnya

1. SA memakai dokumen ini untuk mengisi arsitektur, database, antarmuka, dan batasan SDD; cocokkan ID kebutuhan dengan `docs/SRS_BACKEND_TRACEABILITY.md`.
2. SA/UIUX/BE menetapkan keputusan pada tabel di atas; jangan menandai keputusan sebagai final sebelum disepakati tim.
3. BE dan FE menyelaraskan format response dan sesi; integrasikan login/registrasi lebih dahulu, lalu guest discovery, pengajuan UMKM, dan review Admin.
4. QA menjalankan skenario pada database khusus uji dan mencatat request/response, actual result, tanggal, environment, serta build/commit. Unit test, API dengan database nyata, dan pengujian browser dilaporkan terpisah.

**Bahan yang sudah tersedia untuk dibagikan:** migration SQL, OpenAPI, schema validasi, traceability SRS, dan dokumen ini. Bukti eksekusi terbaru dilampirkan oleh BE/QA setelah benar-benar dijalankan; penyusunan bahan ini tidak berarti koordinasi tim atau persetujuan SDD sudah terjadi.
