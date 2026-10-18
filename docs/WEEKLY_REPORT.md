# Weekly Report — 19 September 2026

Nama: Achmad Bagus Pratama  
Divisi: Backend

Progress Minggu ini:

- Melanjutkan integrasi Backend dengan frontend dari branch `feat/frontend-ui`, meliputi registrasi/login Customer dan UMKM, pengelolaan sesi, serta logout.
- Menghubungkan pencarian dan filter warung, detail warung/menu, serta simpan dan hapus favorit ke API dengan data dari database.
- Memperbaiki pengelolaan sesi saat login/logout dan penanganan respons yang terlambat agar data akun sebelumnya tidak digunakan setelah sesi berubah.
- Menambahkan pengujian otomatis dan dokumentasi integrasi untuk FE/QA. Hasil pengujian lokal: 33 tes Backend, 68 tes frontend, dan 16 skenario integrasi API–database lulus.

Target Minggu Depan:

- Review integrasi bersama FE dan menyelesaikan pengujian alur melalui browser bersama QA.
- Melanjutkan integrasi pengajuan UMKM dan persetujuan Admin sesuai flow serta prototype yang disepakati.
- Koordinasi dengan SA untuk menyelaraskan kebutuhan Backend pada SDD, serta melakukan pengujian MySQL 8 dan kompatibilitas browser.

Kendala:

- Pengujian saat ini masih menggunakan MariaDB lokal; MySQL 8 dan Safari belum diuji.
- Pengujian browser otomatis belum berhasil dijalankan karena kendala lingkungan browser. Dashboard UMKM/Admin juga belum terhubung pada frontend.
- Hasil integrasi masih lokal dan perlu direview sebelum digabung ke branch tim.

---

Catatan bukti: pengujian API–database memakai database QA sementara. Unit tests frontend menggunakan request mock, sehingga tidak menggantikan pengujian browser. Tidak ada klaim deployment atau penerimaan tim selesai. Hasil berada di `D:\ASE LAB\laperu-integration`, belum di-commit/push. Rincian: `PROGRESS_2026-09-19.md`; setup dan endpoint: `FRONTEND_BACKEND_HANDOFF.md`.
