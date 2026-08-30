# Handoff Backend ke QA

## Penilaian format saat ini

Workbook Test Case sudah memakai struktur inti yang benar: `Test ID`, `Test Case Scenario`, `Test Steps`, `Test Data`, dan `Expected Result`. Contoh `TC-LOG-01-A/B` juga sudah membedakan skenario positif dan negatif. Agar hasil eksekusi lebih mudah diaudit, tambahkan kolom berikut bila belum ada:

- `Requirement ID` untuk hubungan langsung dengan RTM.
- `Pre-condition` sebagai kolom terpisah, bukan bercampur dengan skenario.
- `Actual Result`, `Status` (`Not Run/Pass/Fail/Blocked`), `Tester`, `Execution Date`, dan `Evidence/Link`.
- `Priority` serta `Environment/Browser` untuk membedakan Chrome, Safari, dan Firefox.
- `Bug ID` agar kegagalan dapat dilacak ke sheet Bug Report.

Struktur Test Plan juga sudah lengkap: scope, RTM, non-functional testing, risiko, suspension/exit criteria, resource, environment, schedule, dan deliverables. Perbaikan yang masih disarankan:

- Isi bagian `7.2 Schedule` dengan tanggal baseline, API testing, system testing, regression, dan sign-off.
- Pada Test Environment, tulis URL/build/commit yang diuji, versi browser, versi MySQL, dan versi dataset agar hasil dapat direproduksi.
- Definisikan severity `Blocker/Critical/High/Medium/Low` serta aturan bug Medium/Low yang boleh tersisa saat exit criteria 95% tercapai.
- Tambahkan syarat bahwa semua bug Critical/High sudah di-retest dan berstatus Closed, bukan hanya tidak tersisa pada daftar aktif.
- Ubah expected result URL bypass di level API menjadi HTTP `401/403`; redirect ke Login adalah tanggung jawab Frontend.
- Hapus pemulihan/lupa password dari scope atau minta SA membuat Requirement ID karena fitur itu belum ada di SRS.

## Paket data uji

- Payload akun, kata sandi, SQLi, dan XSS: `backend/test-data/qa-payloads.json`.
- Generator sampel gambar: `npm run qa:generate-images --workspace @laperu/backend`.
- Hasil generator mencakup PNG/JPG valid, isi file palsu, GIF tidak didukung, dan JPG tepat satu byte di atas batas 2 MB.
- Seluruh alamat memakai domain reservasi `example.test`; tidak ada akun nyata.

## Expected result keamanan

| Pengujian | Expected result |
|---|---|
| Email tidak valid/SQLi pada field email | HTTP 422, `VALIDATION_ERROR`, query database tidak dijalankan |
| SQLi pada pencarian | Diproses sebagai teks pencarian biasa melalui parameter SQL; tidak mengubah struktur query |
| Markup XSS pada field teks | HTTP 422, `VALIDATION_ERROR` |
| Guest membuka endpoint Customer/UMKM/Admin | HTTP 401, `UNAUTHENTICATED` |
| Role yang salah membuka endpoint privat | HTTP 403, `FORBIDDEN` |
| Gambar > 2 MB | HTTP 413, `IMAGE_TOO_LARGE` |
| Ekstensi/MIME valid tetapi signature palsu | HTTP 422, `INVALID_IMAGE_CONTENT` |
| GIF atau format lain | HTTP 422, `IMAGE_REQUIRED` atau `IMAGE_UPLOAD_ERROR` |

## Catatan eksekusi

- Jalankan migration dan seed pada database khusus QA; jangan gunakan database produksi.
- Reset dummy data sebelum satu rangkaian regression agar hasil konsisten.
- Untuk API, simpan bukti request, response, status code, dan waktu respons.
- Uji target SRS: page load maksimal 3 detik, API maksimal 2 detik, serta stabil pada 50 pengguna bersamaan.
