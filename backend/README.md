# LaperU Backend

REST API versi awal yang mengikuti kebutuhan fitur pada Notion untuk Guest, Customer, UMKM, dan Admin.

## Endpoint utama

| Area | Endpoint |
|---|---|
| Sistem | `GET /api/v1/health`, `GET /api/v1/health/database` |
| Auth | registrasi Customer/UMKM, login, refresh, logout, profil akun |
| Guest | pencarian/filter dan detail warung, metadata filter |
| Customer | favorit, riwayat dan ulasan multidimensi, serta laporan |
| UMKM | pengajuan, profil warung, menu, jam operasional, fasilitas, pembayaran, unggah foto, balasan ulasan, dan statistik |
| Admin | dashboard, verifikasi pengajuan, pengguna, warung, kategori, fasilitas, moderasi, dan audit log |

Spesifikasi request dan response tersedia di `openapi.yaml`.

## Setup database lokal XAMPP

Jalankan `npm run setup:local` dari root, lalu Start MySQL melalui XAMPP dan sesuaikan `DATABASE_URL` di `backend/.env`. Pengumpulan menggunakan MariaDB lokal; pengujian dilakukan pada versi 10.4.32. Script migrasi dapat membuat database yang belum ada selama akun memiliki izin. Apache tidak diperlukan.

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

Jika dijalankan dari root project, tambahkan `--workspace @laperu/backend` pada perintah database.

Seed hanya membuat Admin yang belum ada; password/status akun lama tidak diubah. Seed demo opsional: `npm run db:seed:demo` dari folder backend. Akun demo disimpan pada `.demo-accounts.local.json` yang tidak masuk Git. Tidak ada data pengguna nyata yang perlu diunggah ke GitHub.

## Integrasi Frontend

- Base URL default: `http://localhost:3000/api/v1`.
- Request login/registrasi menggunakan JSON.
- Frontend harus memakai `credentials: "include"` agar refresh cookie ikut dikirim.
- Endpoint privat memakai header `Authorization: Bearer <accessToken>`.
- Format berhasil: `{ "success": true, "data": ... }`.
- Format gagal: `{ "success": false, "code": "...", "message": "..." }`.

## Unggah foto

Kirim `multipart/form-data` dengan field `image` ke `POST /api/v1/umkm/uploads/images`. Backend menerima JPG/JPEG/PNG maksimal 2 MB, memeriksa MIME dan signature file, lalu mengembalikan URL yang dapat dipakai pada pengajuan, menu, atau galeri. Penyimpanan lokal siap untuk development; sebelum deployment multi-instance, ganti adapter penyimpanan dengan object storage seperti Cloudinary atau S3.

## QA

- Traceability requirement: `../docs/SRS_BACKEND_TRACEABILITY.md`.
- Handoff QA terkini: `../docs/QA_START_HERE.md` dan `../docs/QA_TEST_CHECKLIST.md`.
- Payload aman untuk testing: `test-data/qa-payloads.json`.
- Generator file gambar batas: `npm run qa:generate-images`.
- Tes sumber tanpa database: `npm test` (tidak menghitung salinan hasil build).
- Tes database sementara terisolasi Windows/XAMPP: `npm run test:database:local`.
- Tes pada instance QA yang disiapkan sendiri: `npm run test:integration`; wajib `LAPERU_INTEGRATION_TESTS=1`, database lokal berawalan `laperu_test_`, dan akun seed QA pada environment. Lebih mudah gunakan runner terisolasi di atas.
- Cakupan serta batas integrasi terbaru: `../docs/FRONTEND_INTEGRATION_HANDOFF.md`.

## Menjalankan hasil build

```powershell
npm run build
npm start
```

Entrypoint hasil build: `dist/src/server.js`. Perintah dijalankan dari folder `backend`; dari root tambahkan `--workspace @laperu/backend`.
