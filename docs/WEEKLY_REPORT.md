# Weekly Report

Nama: Achmad Bagus Pratama  
Divisi: Backend

Progress Minggu ini:

- Menentukan stack Backend: Node.js, Express, TypeScript, dan MySQL.
- Menyiapkan struktur project Backend, konfigurasi environment, CORS, security headers, rate limit, logging, serta format response dan error yang konsisten.
- Membuat rancangan database dan migration awal untuk akun, UMKM, pengajuan, warung, menu, jam operasional, fasilitas, metode pembayaran, ulasan, favorit, laporan, refresh token, dan audit log.
- Membuat endpoint awal berdasarkan role Guest, Customer, UMKM, dan Admin, termasuk authentication serta verifikasi akun UMKM.
- Menyiapkan kontrak API OpenAPI dan dokumentasi integrasi untuk Frontend.
- Membuat prototype login dan sign-up minimalis hitam-putih serta menghubungkan form ke client API Backend.
- Menyelaraskan endpoint dengan SRS dan RTM QA terbaru, termasuk enam kategori rating, riwayat ulasan, balasan UMKM, statistik, pengelolaan fasilitas/pembayaran, moderasi Admin, dan unggah gambar maksimal 2 MB.
- Menyiapkan dummy data QA untuk email, kombinasi password, SQLi/XSS, dan sampel gambar valid/invalid/oversize.

Target Minggu Depan:

- Sinkronisasi kontrak API OpenAPI terbaru dengan Frontend, System Analyst, dan QA.
- Menjalankan migration pada MySQL tim, membuat dummy data, dan menguji alur registrasi, login, pengajuan UMKM, serta approval Admin secara end-to-end.
- Mulai integrasi endpoint authentication dan daftar warung bersama Frontend.
- Menyesuaikan endpoint apabila terdapat perubahan flow atau kebutuhan dari SRS, UI/UX, dan Test Case QA.

Kendala:

- MySQL Server belum tersedia pada environment lokal saat setup, sehingga build dan pengujian API tanpa database sudah dilakukan, sedangkan pengujian database end-to-end menunggu instance MySQL aktif.
- Backend sudah menyediakan filter radius dari koordinat, tetapi UX sumber koordinat/izin lokasi masih perlu dikonfirmasi ke SA/UIUX. Test Plan juga memasukkan lupa password yang belum memiliki Requirement ID di SRS sehingga scope-nya perlu dikonfirmasi ke SA/QA.

Dokumentasi: https://github.com/gvsBa/LaperU
