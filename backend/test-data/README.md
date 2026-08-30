# Data Uji QA

`qa-payloads.json` berisi akun fiktif, kombinasi kata sandi, dan payload validasi untuk environment testing. Tidak ada kredensial atau identitas nyata di dalam file tersebut.

Untuk membuat sampel gambar batas ukuran:

```powershell
npm run qa:generate-images
```

Output dibuat di folder `test-data/generated` dan tidak disimpan ke Git. Paket berisi:

- `valid-small.png` dan `valid-small.jpg`: gambar valid berukuran kecil.
- `invalid-content.png`: ekstensi PNG dengan isi bukan gambar.
- `unsupported-format.gif`: format yang tidak didukung.
- `oversize.jpg`: JPG valid dengan ukuran tepat satu byte di atas batas konfigurasi.

Gunakan seluruh payload hanya pada aplikasi lokal/testing milik tim. Jangan menjalankan payload terhadap sistem pihak lain.

