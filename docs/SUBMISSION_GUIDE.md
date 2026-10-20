# Panduan pengumpulan LaperU — 22 Oktober 2026

Penanggung jawab Backend: Achmad Bagus Pratama. Diperbarui 20 Oktober 2026.

## Sebelum presentasi

1. Gunakan branch integrasi yang tercantum di README/PR, bukan checkout lama atau hanya branch FE mock.
2. Jalankan setup README dengan database lokal XAMPP. Tidak perlu cloud database maupun Apache.
3. Pastikan health database menyatakan up dan halaman Explore terbuka.
4. Gunakan data fiktif demo atau data yang diizinkan tim. Jangan mengunggah data pribadi atau password ke repo.
5. Simpan backup database/unggahan privat terpisah. Catat commit yang dipakai saat demo.
6. Siapkan satu jendela biasa untuk Customer/UMKM dan jendela incognito untuk Admin agar sesi tidak saling menggantikan.

## Urutan demo 8–12 menit

1. **Guest:** buka Explore, cari warung, terapkan budget/kategori, lihat menu/jam/ulasan, buka rute Maps.
2. **Customer:** registrasi/login, simpan favorit, reload untuk menunjukkan persistensi, tulis ulasan enam aspek, edit melalui Ulasan Saya.
3. **UMKM baru:** registrasi pemilik, buka dashboard, simpan identitas dan unggah foto JPG/PNG <=2 MB, kirim pengajuan.
4. **Admin:** login pada sesi terpisah, pilih pengajuan, periksa identitas/foto, minta revisi dengan alasan.
5. **UMKM:** baca catatan, perbaiki data dan kirim ulang.
6. **Admin:** setujui pengajuan; tunjukkan status berubah dan warung tersedia.
7. **UMKM disetujui:** ubah profil/rentang harga, tambah menu, atur buka/tutup, fasilitas dan metode pembayaran; balas ulasan.
8. **Moderasi:** Customer melaporkan ulasan; Admin menyembunyikan ulasan, lalu mengisi hasil pemeriksaan laporan.
9. **Bukti:** tunjukkan hasil test yang benar-benar dijalankan, bukan hanya daftar rencana test.

Untuk penolakan pengajuan, gunakan akun UMKM uji terpisah: status REJECTED tidak dapat diajukan ulang pada implementasi sekarang.

## Checklist berkas

- Source code dan lockfile dari GitHub/arsip branch pengumpulan.
- README dan panduan menjalankan dari nol.
- Migration SQL serta data referensi; demo data opsional.
- OpenAPI, handoff FE–BE, bahan SDD, status uji, weekly report.
- Dokumen final SRS/SDD/UIUX/test plan/test case tim: review dan pengesahan tetap oleh pemilik dokumennya.
- Jika diminta ZIP, gunakan arsip source dari commit; **jangan** ZIP seluruh folder kerja dengan credential/database/node_modules.

## Penerimaan tim yang masih wajib

- FE: tinjau tampilan hasil integrasi dan fitur UI yang belum tercakup.
- SA: cocokkan SDD final dengan implementasi, status flow, dan batas fitur.
- QA: sign-off test case; Safari/perangkat fisik dan 50 sesi pengguna nyata belum dibuktikan oleh tes lokal.
- Tim: review/merge branch pengumpulan setelah disetujui, pastikan link/commit final yang dikumpulkan.
- Bagus: lakukan satu simulasi demo di laptop dengan XAMPP aktif.

Pengumpulan LMS, merge ke main, deployment, dan pengiriman laporan ke grup tidak dilakukan otomatis oleh pekerjaan ini.
