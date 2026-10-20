# Konfigurasi pengujian Backend

Verifikasi: 15 September 2026.

## Pemisahan pengujian

- `npm run test:backend` menjalankan test sumber TypeScript di `backend/tests/**/*.test.ts`.
- `backend/tests/integration/**` dikecualikan dari perintah default karena membutuhkan database uji terpisah.
- Hasil kompilasi di `backend/dist` tidak ikut ditemukan oleh test runner. Menjalankan build tidak boleh menambah jumlah test yang dihitung.

Sebelum perbaikan, test runner menemukan dua file sumber dan dua salinan hasil build sehingga melaporkan 26 test lulus. Jumlah test sumber yang benar adalah **13 test dalam 2 file**. Angka lama yang menghitung hasil build tidak dapat digunakan sebagai jumlah skenario unik.

## Menjalankan hasil build

```sh
npm run build --workspace @laperu/backend
npm run start --workspace @laperu/backend
```

`rootDir` TypeScript tetap `.` agar kode aplikasi, script, dan test dapat diperiksa bersama. Karena itu, entry point hasil build adalah `backend/dist/src/server.js`, bukan `backend/dist/server.js`.

## Bukti pemeriksaan baseline konfigurasi

- Test sumber: 13/13 lulus, 2 file.
- Build Backend: lulus.
- Typecheck Backend: lulus.
- Proses hasil kompilasi dengan `NODE_ENV=production`: dapat dijalankan dan `/api/v1/health` mengembalikan HTTP 200, `success: true`, serta `status: up`.

Smoke test tersebut hanya memeriksa entry point dan endpoint health, menggunakan port sementara serta alamat database yang sengaja tidak aktif. Pemeriksaan itu bukan bukti koneksi MySQL, kelulusan alur bisnis end-to-end, atau kesiapan deployment production. Hasil pengujian integrasi database dicatat terpisah.

## Hasil sesudah regression test ditambahkan

Pada update 15 September 2026, jumlah tes sumber menjadi **33/33 dalam 6 file**. Suite database terpisah berisi **16 skenario integrasi**. Angka 13 di atas adalah baseline unik sebelum penambahan, bukan total final. Rincian dan batas verifikasi: `docs/PROGRESS_2026-09-15.md`.
