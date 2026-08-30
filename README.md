# LaperU

Fondasi LaperU terdiri dari Frontend React dan Backend REST API untuk Guest, Customer, UMKM, dan Admin.

## Stack

- Frontend: React, TypeScript, Vite.
- Backend: Node.js, Express, TypeScript.
- Database: MySQL 8.
- Authentication: access token JWT dan rotating refresh token melalui cookie HTTP-only.

## Menjalankan project

1. Pasang dependensi dari root:

```powershell
npm install
```

2. Siapkan environment:

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

3. Pastikan MySQL aktif, kemudian buat tabel dan data awal:

```powershell
npm run db:migrate --workspace @laperu/backend
npm run db:seed --workspace @laperu/backend
```

4. Jalankan Frontend dan Backend bersama-sama:

```powershell
npm run dev:all
```

- Frontend: `http://localhost:5173/login`
- Backend: `http://localhost:3000/api/v1`
- Health check: `http://localhost:3000/api/v1/health`

## Dokumentasi

- Kontrak API: `backend/openapi.yaml`
- Petunjuk Backend: `backend/README.md`
- Tema dan target performa: `docs/THEME_AND_PERFORMANCE.md`
- Weekly report Bagus: `docs/WEEKLY_REPORT.md`
- Traceability SRS ke Backend: `docs/SRS_BACKEND_TRACEABILITY.md`
- Handoff dan data uji QA: `docs/QA_HANDOFF.md`, `backend/test-data/`

## Pemeriksaan kualitas

```powershell
npm run typecheck:all
npm run lint
npm run lint:api
npm run test:backend
npm run build:all
```

Untuk membuat sampel gambar valid, tidak valid, dan oversize bagi QA:

```powershell
npm run qa:generate-images --workspace @laperu/backend
```
