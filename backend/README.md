# LaperU Backend

REST API versi awal yang mengikuti kebutuhan fitur pada Notion untuk Guest, Customer, UMKM, dan Admin.

## Endpoint utama

| Area | Endpoint |
|---|---|
| Sistem | `GET /api/v1/health`, `GET /api/v1/health/database` |
| Auth | registrasi Customer/UMKM, login, refresh, logout, profil akun |
| Guest | pencarian/filter dan detail warung, metadata filter |
| Customer | favorit, ulasan multidimensi, dan laporan |
| UMKM | pengajuan, profil warung, menu, jam operasional, dan foto berbasis URL |
| Admin | dashboard, verifikasi pengajuan, status pengguna, laporan, dan audit log |

Spesifikasi request dan response tersedia di `openapi.yaml`.

## Setup MySQL

Salin `.env.example` menjadi `.env`, lalu sesuaikan `DATABASE_URL`. Script migrasi dapat membuat database yang belum ada selama akun MySQL memiliki izin.

```powershell
npm run db:migrate
npm run db:seed
npm run dev
```

Jika dijalankan dari root project, tambahkan `--workspace @laperu/backend` pada perintah database.

## Integrasi Frontend

- Base URL default: `http://localhost:3000/api/v1`.
- Request login/registrasi menggunakan JSON.
- Frontend harus memakai `credentials: "include"` agar refresh cookie ikut dikirim.
- Endpoint privat memakai header `Authorization: Bearer <accessToken>`.
- Format berhasil: `{ "success": true, "data": ... }`.
- Format gagal: `{ "success": false, "code": "...", "message": "..." }`.

## Catatan penyimpanan foto

Endpoint saat ini menyimpan URL foto. Upload file langsung perlu disambungkan ke object storage seperti Cloudinary atau S3 setelah pilihan layanan tim disepakati.
