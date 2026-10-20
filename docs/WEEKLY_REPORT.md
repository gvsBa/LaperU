# Weekly Report — 20 Oktober 2026

Nama: Achmad Bagus Pratama  
Divisi: Backend

Progress Minggu ini:

- Menggabungkan update frontend tim, termasuk halaman detail warung, dengan Backend pada branch integrasi pengumpulan.
- Menghubungkan alur UMKM dari pengisian data dan upload foto, pengajuan, revisi, sampai persetujuan Admin. Setelah disetujui, UMKM dapat mengelola profil, menu, jadwal, fasilitas, metode pembayaran, serta membalas ulasan.
- Melengkapi integrasi fitur Customer untuk ulasan dan pelaporan, serta dashboard Admin untuk pemeriksaan pengajuan dan moderasi.
- Menyiapkan database lokal menggunakan XAMPP, panduan setup, serta data demo fiktif untuk presentasi.
- Menjalankan pengujian lokal: 33 unit test Backend, 79 unit test frontend, 16 skenario API–database, dan 18 skenario browser berhasil. Pemeriksaan lint, kontrak API, dan build juga berhasil.
- Memperbarui dokumentasi integrasi FE–BE, bahan SDD Backend, handoff QA, serta checklist pengumpulan tanggal 22 Oktober.
- Mengunggah hasil integrasi ke GitHub dan membuka PR #1 untuk review tim, tanpa langsung mengganti branch utama.

Target Minggu Depan / Menjelang Pengumpulan 22 Oktober:

- Review hasil integrasi bersama FE dan QA, lalu sepakati commit final yang akan dikumpulkan.
- Koordinasi dengan SA untuk mencocokkan SDD final dengan implementasi dan batas fitur yang tersedia.
- Melakukan simulasi demo di laptop dengan XAMPP aktif serta menyiapkan berkas pengumpulan tanpa password atau data privat.
- Menindaklanjuti temuan dari review tim yang masih masuk cakupan sebelum pengumpulan.

Kendala:

- Pengujian masih lokal pada MariaDB/XAMPP, Chromium dan Chrome. Safari, perangkat fisik, MySQL 8, serta uji beban belum diverifikasi.
- Sempat terdapat kendala proses Node dan startup database QA di Windows; pengujian berhasil pada lingkungan yang dicatat di dokumen status.
- Hasil integrasi dan dokumen final masih membutuhkan review/sign-off tim sebelum pengumpulan.

---

Laporan ini berdasarkan hasil kerja dan pengujian lokal, bukan klaim production deployment atau penerimaan tim selesai. Rincian bukti dan batas: [SUBMISSION_STATUS.md](SUBMISSION_STATUS.md). Riwayat periode sebelumnya tetap tersedia dalam [PROGRESS_2026-09-19.md](PROGRESS_2026-09-19.md).
