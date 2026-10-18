# Pengujian Backend dengan database nyata

Pengujian ini menjalankan request HTTP melalui aplikasi Express menggunakan Supertest dan koneksi database asli. Ini **API integration test**, bukan pengujian browser/Frontend dan bukan hasil uji beban.

## 1. Lokal Windows + XAMPP/MariaDB

Dari root project:

```powershell
npm run test:database:local --workspace @laperu/backend
```

Runner `backend/scripts/test-local-database.ps1` menggunakan binary bawaan `C:\xampp\mysql\bin`. Untuk lokasi berbeda:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File backend/scripts/test-local-database.ps1 -DatabaseBin 'D:\xampp\mysql\bin'
```

Perilaku runner:

1. Membuat direktori data sementara baru, password root acak, port kosong, dan server yang hanya mendengarkan `127.0.0.1`.
2. Tidak mengubah service, konfigurasi, database, atau password instalasi XAMPP milik pengguna.
3. Menjalankan migration dan seed masing-masing dua kali untuk memeriksa setup dapat diulang.
4. Menjalankan suite integrasi pada database unik `laperu_test_<runId>`, dengan akun dummy `example.test`.
5. Menghentikan proses database yang dibuat runner, memulihkan environment proses, lalu membersihkan direktori sementara beserta database/foto dummy. Fixture ini bukan data demo permanen.

XAMPP yang tersedia saat pengujian 15 September 2026 menyediakan **MariaDB 10.4.32**, bukan MySQL 8. Kelulusan suite lokal tidak otomatis membuktikan kompatibilitas MySQL 8. Target database tim tetap harus dikonfirmasi dan diuji pada mesin yang akan digunakan.

## 2. MySQL tim atau instance lokal yang sudah tersedia

Gunakan database khusus QA, jangan database produksi maupun development berisi data nyata. Suite menolak berjalan jika flag pengujian tidak aktif, nama database bukan `laperu_test_*`, atau host bukan loopback. Untuk server tim, jalankan di host database atau melalui port-forward loopback yang disetujui tim.

Contoh PowerShell dari root project; ganti kredensial contoh dengan akun khusus QA yang berhak membuat database/tabel. Jangan commit kredensial:

```powershell
$env:DATABASE_URL = 'mysql://qa_user:QA_PASSWORD@127.0.0.1:3306/laperu_test_local'
$env:NODE_ENV = 'test'
$env:ADMIN_EMAIL = 'qa-admin@example.test'
$env:ADMIN_PASSWORD = 'QaAdmin12345'
$env:LAPERU_INTEGRATION_TESTS = '1'
npm run db:migrate --workspace @laperu/backend
npm run db:seed --workspace @laperu/backend
npm run test:integration --workspace @laperu/backend
```

Password Admin di atas hanya data uji pada database QA. Seed saat ini memperbarui password/status Admin untuk email yang diberikan; jangan menjalankan contoh pada database berisi akun nyata. Gunakan terminal khusus QA dan tutup setelah selesai agar environment ini tidak dipakai menjalankan aplikasi biasa.

Suite menggunakan identitas unik setiap run. Runner manual tidak otomatis menghapus database; kelola dataset QA tersebut secara terpisah. Jangan menghitung jumlah test sebagai persentase seluruh requirement yang selesai.

## 3. Jenis bukti

| Pemeriksaan | Yang dibuktikan | Yang belum dibuktikan |
|---|---|---|
| `test:backend` | Tes sumber validasi, middleware, dan API sesuai cakupan suite tanpa database | Alur SQL nyata |
| `test:database:local` | Migration/seed berulang dan alur API pada MariaDB sementara | MySQL 8, UI, atau data produksi |
| `test:integration` pada MySQL | Alur API sesuai suite pada versi MySQL yang dicatat QA | Semua fitur, Safari/Chrome, uji beban |
| `build:all` + compiled health check | Build dan entrypoint server dapat berjalan | Kesiapan deployment penuh |

Simpan tanggal, versi database, revision/commit, perintah, jumlah tes, dan hasil aktual pada laporan QA. Catatan eksekusi terbaru: `docs/PROGRESS_2026-09-15.md`.
