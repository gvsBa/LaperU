# LaperU

Integrasi lokal frontend tim (`feat/frontend-ui`, commit `14fc231`) dengan Backend REST API LaperU. Folder kerja integrasi: `D:\ASE LAB\laperu-integration`; project asli di `D:\ASE LAB\laperu-web` tidak diganti. Perubahan integrasi belum dipush atau digabung ke branch tim.

Frontend yang sudah terhubung: registrasi Customer/UMKM, login, pemulihan sesi, logout, pencarian/filter warung, detail/menu/ulasan, dan favorit Customer. Dashboard pengelolaan UMKM/Admin dan formulir penulisan ulasan belum diimplementasikan pada frontend ini.

## Stack

- Frontend aktif: React JSX, React Router, Vite, Tailwind; file TypeScript lama masih tersimpan tetapi bukan entry UI aktif.
- Backend: Node.js, Express, TypeScript.
- Target database: MySQL 8; pengujian database lokal yang sudah dijalankan menggunakan MariaDB 10.4.32, bukan bukti kompatibilitas MySQL 8.
- Authentication: access token JWT dan rotating refresh token melalui cookie HTTP-only.

## Menjalankan project

1. Pasang dependensi dari root:

```powershell
npm ci
```

2. Siapkan environment:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

3. Isi `backend/.env` dengan koneksi database development yang benar, secret JWT acak, serta email/password admin sendiri. Jangan gunakan kredensial contoh untuk deployment. Pastikan database aktif, kemudian buat tabel dan data awal pada database development tersebut:

```powershell
npm run db:migrate --workspace @laperu/backend
npm run db:seed --workspace @laperu/backend
```

4. Jalankan Frontend dan Backend bersama-sama:

```powershell
npm run dev:all
```

- Frontend: `http://127.0.0.1:5173/login`
- Backend: `http://127.0.0.1:3000/api/v1`
- Health check: `http://127.0.0.1:3000/api/v1/health`

Frontend memakai URL relatif `/api/v1`; Vite meneruskan `/api` dan `/uploads` ke Backend lokal. Jangan berganti antara `localhost` dan `127.0.0.1` saat menguji sesi cookie. Proxy Vite hanya untuk development; deployment perlu reverse proxy HTTPS atau konfigurasi API/origin/cookie yang ditinjau ulang.

Seed menambahkan admin serta kategori/fasilitas/metode pembayaran, bukan restoran nyata. Hasil pencarian kosong sebelum warung disetujui adalah normal.

## Dokumentasi

- Kontrak API: `backend/openapi.yaml`
- Petunjuk Backend: `backend/README.md`
- Tema dan target performa: `docs/THEME_AND_PERFORMANCE.md`
- Weekly report Bagus: `docs/WEEKLY_REPORT.md`
- Handoff integrasi FE–BE: `docs/FRONTEND_BACKEND_HANDOFF.md`
- Bukti pengujian pekan ini: `docs/PROGRESS_2026-09-19.md`
- Traceability SRS ke Backend: `docs/SRS_BACKEND_TRACEABILITY.md`
- Handoff dan data uji QA: `docs/QA_HANDOFF.md`, `backend/test-data/`

## Pemeriksaan kualitas

```powershell
npm run typecheck:all
npm run lint
npm run lint:api
npm run test:backend
npm run test:frontend
npm run build:all
```

`typecheck:all` memeriksa Backend dan file TypeScript lama; bukan pemeriksaan tipe menyeluruh atas frontend JSX aktif. Frontend JSX diperiksa melalui lint, build, serta tes API client/service.

Pengujian database sementara terisolasi (memerlukan binary MariaDB/XAMPP, tidak menyentuh database development):

```powershell
npm run test:database:local --workspace @laperu/backend
```

Pengujian browser dengan database sementara dibangun ulang sebelum dijalankan:

```powershell
npx playwright install chromium
npm run test:browser:local
```

Status hasil dan batas browser yang benar-benar diuji dicatat di dokumen progress, bukan diasumsikan dari tersedianya skrip. Semua data uji sementara dihapus oleh runner setelah selesai.

Untuk membuat sampel gambar valid, tidak valid, dan oversize bagi QA:

```powershell
npm run qa:generate-images --workspace @laperu/backend
```
