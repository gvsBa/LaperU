# Checklist QA — FE terbaru terhubung Backend

Tanggal 23 Oktober 2026. Branch integration/frontend-api-2026-10-22.
Seluruh status manual di dokumen ini dimulai **NOT RUN**. Hasil otomatis terpisah dalam handoff; jangan menyalin PASS otomatis sebagai bukti uji di laptop Fikri.

Persiapan: ikuti QA_START_HERE.md, buat akun Customer A/B dan UMKM A/B dengan email fiktif berbeda. Siapkan Admin lokal, gambar JPG/PNG valid, palsu, dan >2 MB. Gunakan profil browser terpisah. Untuk tes pengajuan gunakan UMKM baru, bukan akun demo approved.

## P0 — wajib sebelum demo/pengumpulan

| ID | Role / langkah | Hasil yang diharapkan |
|---|---|---|
| ENV-01 | Jalankan aplikasi dan health/database | FE terbuka; API success true; tidak ada error koneksi SQL. |
| AUTH-01 | Daftar Customer valid; reload | Akun tersimpan, sesi pulih, profil menampilkan identitas asli. |
| AUTH-02 | Email sama, format salah, password tanpa angka, konfirmasi berbeda | Ditolak dengan pesan; tidak muncul sukses palsu atau akun duplikat. |
| AUTH-03 | Login salah lalu benar; logout lalu buka /account dan reload | Salah ditolak; benar masuk; setelah logout akses akun meminta login. |
| AUTH-04 | Guest buka /admin; Customer buka /umkm; UMKM buka /admin | Tidak mendapat data terlarang. API tanpa token 401, role salah 403. |
| AUTH-05 | Login dengan next URL eksternal | Tetap menuju halaman internal, tidak membuka situs eksternal. |
| GUEST-01 | Cari nama/menu warung yang sudah disetujui | Hasil dari database, slug membuka detail yang benar. |
| GUEST-02 | Kategori dan harga yang cocok/tidak cocok | Hasil sesuai; filter tidak cocok mengeluarkan warung; rentang harga memakai overlap priceMin/priceMax profil warung. |
| GUEST-03 | Pemilik set CLOSED lalu aktifkan Buka sekarang | Warung tidak muncul dengan filter; tetap ada tanpa filter. |
| DETAIL-01 | Buka menu warung | Harga angka rupiah dan status tersedia/habis sesuai data pemilik; menu nonaktif tidak ditampilkan. |
| FAV-01 | Simpan favorit; reload Aktivitas Favorit; hapus | Bertahan setelah reload, tidak duplikat, hilang setelah hapus. Customer B tidak melihat favorit A. |
| UMKM-01 | Daftar UMKM | Akun role UMKM/PENDING dan pengajuan DRAFT; belum muncul di publik; pengelolaan warung terkunci. |
| UMKM-02 | Kirim tanpa foto; lalu unggah PNG/JPG valid dan kirim | Tanpa kelengkapan ditolak; lengkap berubah Menunggu/PENDING. Pengajuan pending tidak bisa diedit/dikirim ulang. |
| UMKM-03 | File >2 MB, teks diberi ekstensi png, format tak didukung | Ditolak, tidak tampil sebagai pengajuan berhasil. |
| ADMIN-01 | Periksa pengajuan; minta revisi tanpa alasan, lalu alasan ≥5 karakter | Tanpa alasan ditolak; revisi tersimpan dan terlihat oleh pemilik yang benar. |
| UMKM-04 | Perbaiki alamat pada REVISION dan kirim ulang | Kembali PENDING; data terbaru terlihat Admin. |
| ADMIN-02 | Setujui pengajuan | Pemilik bisa mengelola warung; warung muncul publik; persetujuan kedua tidak membuat warung duplikat. |
| ADMIN-03 | Tolak pengajuan baru dengan alasan | REJECTED + alasan terlihat pemilik; tidak terbit; revisi ulang tidak tersedia pada REJECTED. |
| UMKM-05 | Ubah profil, kategori, harga, fasilitas, pembayaran, status buka; reload | Data benar-benar tersimpan; perubahan terlihat di publik/filter. |
| MENU-01 | Tambah, ubah harga, set Habis, nonaktifkan lalu aktifkan menu | Persisten; Habis berbeda dari Nonaktif. Nonaktif tidak tampil di publik. |
| HOURS-01 | Isi tujuh hari, tandai libur; simpan/reload | Jam tersimpan. Jam kosong/terbalik pada hari buka ditolak. Hari Senin indeks 0; Minggu 6. |
| REVIEW-01 | Customer beri enam rating + komentar; reload; edit; coba duplikat | Satu ulasan per Customer per warung; perubahan persisten; rating 1–5; duplikat ditolak. |
| REVIEW-02 | Pemilik membalas ulasan | Balasan terlihat pada detail publik dan riwayat Customer, setelah reload. |
| REPORT-01 | Customer laporkan warung/ulasan; Admin selesaikan dengan catatan | Laporan tampil pada Admin; Customer pelapor melihat status/catatan; Customer lain tidak melihat laporan pribadi. |
| MOD-01 | Admin sembunyikan ulasan | Guest tidak melihat ulasan; tidak dihitung dalam rating publik. Pemilik ulasan masih melihat miliknya dengan tanda disembunyikan. |
| REVIEW-03 | Customer hapus ulasan sendiri | Ulasan dan balasannya tidak tampil lagi; akun lain tidak bisa mengubah/menghapusnya. |
| ADMIN-04 | Nonaktifkan warung atau suspend akun uji | Warung hilang dari publik; akun suspended tidak dapat login/memakai token lama. Aktifkan kembali data QA bila diperlukan. |
| PERSIST-01 | Tutup/restart server aplikasi, login kembali | Data yang disimpan tetap ada pada database lokal. Tidak menghapus database untuk restart. |

## P1 — kelengkapan dan regresi

| ID | Langkah | Hasil yang diharapkan |
|---|---|---|
| SORT-01 | Harga termurah / rating tertinggi | Urutan dilakukan server sebelum pagination; bukan hanya mengurutkan satu halaman. |
| SORT-02 | Terdekat, izinkan dan tolak lokasi | Izin lokasi diminta; koordinat diperlukan; penolakan ditampilkan tanpa mengubah urutan lama. Warung tanpa koordinat dikecualikan. |
| FILTER-01 | Fasilitas, pembayaran, min rating, reset | Data sesuai referensi API; reset kembali semua filter awal. |
| PAGE-01 | >20 data Admin / >12 warung publik, halaman berikut/sebelumnya | Data dan total sesuai halaman; statistik/filter tabel Admin diberi keterangan hanya halaman yang dimuat. |
| PHOTO-01 | UMKM tambah foto galeri dan foto menu | Foto tersimpan, reload tetap tampil; gambar tidak sekadar preview browser. |
| REF-01 | Admin tambah/edit/hapus kategori atau fasilitas QA yang belum dipakai | Perubahan nyata, opsi meta diperbarui. Jangan menghapus referensi nyata; penghapusan dapat melepas relasi warung. |
| LOG-01 | Lakukan persetujuan/moderasi lalu buka Audit Log dan export | Aktivitas tercatat; CSV sesuai filter, teks yang diawali =/+/-/@ tidak dieksekusi sebagai formula. CRUD referensi belum dicatat audit. |
| ERR-01 | Matikan Backend sendiri / simulasikan request gagal lalu retry | Pesan error terlihat, bukan data contoh/sukses palsu; retry pulih saat server kembali. |
| ERR-02 | Pencarian tak ada dan slug tak dikenal | Empty/not found jelas; error jaringan tidak disamakan dengan hasil kosong. |
| SEC-01 | Uji email SQLi, ulasan markup XSS, ID resource milik akun B | Validasi/otorisasi menolak sesuai kontrak; tidak ada query error sensitif atau script tereksekusi. Hanya lokal milik tim. |
| UI-01 | Desktop 1365px, mobile 390px; tab/enter/focus | Tidak ada overflow halaman; form dapat digunakan keyboard; logout UMKM dapat diakses di mobile. |
| BROWSER-01 | Chrome nyata; Safari macOS/iOS bila tersedia | Catat browser/OS. Jika tidak punya Safari: NOT RUN, bukan PASS. |
| PERF-01 | Ukur initial load/warm load dengan Network/Performance | Catat device, jaringan, jumlah data, median dan rentang. Belum ada SLA lulus yang disepakati; jangan mengarang Best/Normal/Worst. |

## Belum tersedia — bukan PASS dan jangan dijanjikan dalam demo

Edit nama/email/telepon profil akun; reset/lupa/ganti password; verifikasi email mahasiswa; 2FA; daftar perangkat/riwayat login; logout semua perangkat; nonaktif akun mandiri; notifikasi; promo/randomizer; upload foto ulasan; hapus/ganti foto galeri; grafik statistik per hari. Foto galeri baru dapat ditambah, menu dapat dinonaktifkan. Tidak ada pemesanan/pembayaran online/kurir.

Penolakan pengajuan bersifat terminal pada versi ini; untuk perbaikan gunakan REVISION sebelum menolak. Admin tidak menyunting akun Admin lain. Akun mahasiswa belum membuktikan status mahasiswa secara otomatis.

## Rekap yang dikirim ke Bagus

Tanggal / commit / lingkungan:
Jumlah PASS:
Jumlah FAIL:
Jumlah BLOCKED:
Jumlah NOT RUN:
Bug P0/P1:
Bukti:
Kesimpulan: layak demo lokal / belum layak (sebutkan blocker).

Checklist ini adalah usulan UAT berdasarkan implementasi aktual, bukan pengganti persetujuan SRS oleh SA atau hasil tes manual Fikri.
