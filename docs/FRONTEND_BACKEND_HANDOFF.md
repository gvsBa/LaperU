# Handoff integrasi Frontend–Backend LaperU

Status catatan: **19 September 2026**. Basis integrasi: commit `14fc231`, dengan perubahan lokal di `D:\ASE LAB\laperu-integration`. Saat catatan dibuat, worktree berada pada detached HEAD; perubahan integrasi **belum di-commit/push**. Folder asli `D:\ASE LAB\laperu-web` tetap dipertahankan dan bukan folder untuk menjalankan hasil integrasi ini.

## Yang sudah dihubungkan

- Login serta registrasi Customer dan UMKM memakai API, bukan sekadar pindah halaman.
- Beranda mengambil rekomendasi dari daftar warung; Guest dapat mencari, memfilter kategori/budget/status buka, mengganti halaman hasil, dan membuka detail warung.
- Detail menampilkan menu, harga, jam, fasilitas, pembayaran, foto, ulasan, dan tautan Maps dari respons Backend.
- Customer dapat menyimpan/menghapus favorit di detail serta melihat daftar favorit miliknya.
- Halaman `/account` menampilkan identitas, jenis/status akun dari sesi asli, serta logout.
- Ada tampilan memuat, data kosong, kegagalan request, dan jalur mencoba kembali. Tidak ada penggantian respons gagal dengan daftar warung mock.

Desain utama Frontend rekan tim dipertahankan. `?mode=account` bukan mekanisme autentikasi dan tidak memberi akses akun.

## Menjalankan di Windows / VS Code

Prasyarat: Node.js/npm, database MySQL atau MariaDB lokal yang berjalan, dan kredensial database development. Jangan memakai database produksi untuk setup/seed.

Jalankan dari terminal PowerShell:

```powershell
Set-Location -LiteralPath 'D:\ASE LAB\laperu-integration'
npm ci
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
if (-not (Test-Path -LiteralPath 'backend\.env')) { Copy-Item -LiteralPath 'backend\.env.example' -Destination 'backend\.env' }
```

Buka folder `D:\ASE LAB\laperu-integration` melalui **File → Open Folder** di VS Code. Sesuaikan file environment, tanpa menimpa konfigurasi yang sudah ada:

| File | Konfigurasi lokal yang perlu diperiksa |
|---|---|
| `.env` | `VITE_API_BASE_URL=/api/v1` |
| `backend/.env` | `DATABASE_URL` sesuai akun, port, dan nama database development milik tim |
| `backend/.env` | `PORT=3000`, `NODE_ENV=development` |
| `backend/.env` | `FRONTEND_ORIGIN=http://127.0.0.1:5173` jika browser memakai alamat tersebut |
| `backend/.env` | `PUBLIC_API_ORIGIN=http://127.0.0.1:3000` agar URL unggahan menunjuk Backend lokal yang benar |
| `backend/.env` | Ganti contoh `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` dan kredensial Admin; jangan commit file `.env` |

Kemudian:

```powershell
npm run db:migrate --workspace @laperu/backend
npm run db:seed --workspace @laperu/backend
npm run dev:all
```

Buka `http://127.0.0.1:5173`. Seed menyiapkan data referensi serta Admin, **bukan daftar warung demo**; daftar kosong pada database baru adalah hasil yang wajar. Seed juga memperbarui password/status Admin untuk email yang dikonfigurasi, sehingga hanya jalankan pada database development/QA yang memang dituju.

### Proxy dan konsistensi alamat

- Browser memanggil `/api/v1` pada origin Frontend. Vite meneruskan `/api` dan `/uploads` ke `http://127.0.0.1:3000`.
- `localhost` dan `127.0.0.1` adalah host berbeda untuk browser/cookie. Gunakan satu host secara konsisten dan cocokkan `FRONTEND_ORIGIN` dengan URL browser **beserta portnya**. Jika Vite memilih port selain `5173`, perbarui konfigurasi terkait lalu mulai ulang.
- Jika Backend menggunakan port lain, set `$env:LAPERU_API_PROXY_TARGET = 'http://127.0.0.1:PORT_BACKEND'` pada terminal sebelum menjalankan Vite; sesuaikan `PORT` dan `PUBLIC_API_ORIGIN` Backend juga. Variabel proxy dibaca dari environment proses, bukan otomatis dari isi `.env` oleh konfigurasi ini.
- Proxy ini untuk development. Hosting hasil `dist` memerlukan reverse proxy `/api` dan `/uploads` sendiri, atau konfigurasi origin API, cookie, HTTPS, dan CORS yang disepakati. `npm run preview` bukan setup deployment API.

## Pemetaan halaman ke API

Semua endpoint berikut memakai prefix `/api/v1`.

| Halaman / aksi | Endpoint | Catatan integrasi |
|---|---|---|
| `/login` | `POST /auth/login` | JSON `email`, `password`; kesalahan login ditampilkan |
| `/register` | `POST /auth/register/customer` | JSON `fullName`, `email`, `password` |
| `/register?role=umkm` | `POST /auth/register/umkm` | Tambahan `businessName`, `ownerName`, `phone`, `address`; membuat akun PENDING dan draft pengajuan |
| Memulihkan sesi / logout | `POST /auth/refresh`, `POST /auth/logout` | Refresh cookie dikirim browser; `/account` memakai identitas dari respons sesi |
| Beranda | `GET /warungs?limit=4` | Rekomendasi mengikuti urutan hasil Backend, bukan personalisasi |
| `/explore` | `GET /meta`, `GET /warungs` | UI saat ini mengirim `q`, `category`, `maxPrice`, `openNow`, `page`, `limit=12` |
| `/restaurants/:slug` | `GET /warungs/:slug` | Detail memakai **slug**, bukan UUID warung |
| `/favorites` dan status favorit di detail | `GET /customer/favorites` | Privat, role CUSTOMER |
| Simpan / hapus favorit | `POST /customer/favorites/:id`, `DELETE /customer/favorites/:id` | `id` adalah UUID warung dari respons, bukan slug |

Kontrak berhasil: `{ "success": true, "data": ... }`; gagal: `{ "success": false, "code": "...", "message": "..." }`, dengan `details` bila tersedia. Client mengembalikan `data` untuk request berhasil dan melempar `ApiError` untuk kegagalan. Daftar warung berisi `items` dan `pagination`; daftar favorit langsung berupa array. Field SQL seperti `isOpen` dinormalisasi dari `0/1`; nilai null tidak dibuat seolah-olah data lengkap.

## Sesi dan akses

- Access token hanya di memori aplikasi, tidak disimpan pada `localStorage`/`sessionStorage`. Request privat menyertakan `Authorization: Bearer <accessToken>`.
- Refresh token memakai cookie HttpOnly dari Backend (`SameSite=Lax`, path `/api/v1/auth`; `Secure` pada production). Semua request client menggunakan `credentials: 'include'`.
- Saat aplikasi dimuat ulang, AuthProvider mencoba refresh sesi. Request privat dapat refresh sekali ketika mendapatkan `401`; refresh yang sedang berjalan dipakai bersama agar tidak menggandakan rotasi.
- Penanda generasi sesi menolak respons lama setelah akun berubah/logout. Login, registrasi, refresh, dan logout dikoordinasikan agar respons yang terlambat tidak memulihkan sesi yang sudah dibatalkan.
- Logout membersihkan sesi lokal. Jika jaringan gagal, UI menyatakan sesi server belum terkonfirmasi berakhir dan menyediakan coba lagi; ini bukan klaim cookie server berhasil dicabut.
- Parameter `next` hanya mengizinkan `/explore`, `/favorites`, `/account`, dan `/restaurants/<slug>`. URL eksternal, jalur ganda/terenkode yang tidak diizinkan, serta loop login/register ditolak.
- Penyembunyian tombol berdasarkan role hanya untuk pengalaman pengguna; pemeriksaan token, role, dan kepemilikan tetap menjadi tanggung jawab Backend.

## Batas cakupan untuk FE / QA

- **UMKM:** baru registrasi dan informasi akun. Halaman melengkapi foto, mengirim/merevisi pengajuan, profil/menu/jam, balasan, dan statistik belum dibuat. Status PENDING pada akun baru **tidak berarti pengajuan sudah dikirim**.
- **Admin:** dapat login dan melihat akun; dashboard persetujuan/moderasi belum dihubungkan ke UI.
- **Customer:** favorit sudah dihubungkan; form membuat/mengubah ulasan, riwayat ulasan, dan laporan belum dibuat. Ulasan publik tetap dapat dibaca di detail.
- Filter radius/lokasi, fasilitas, metode pembayaran, dan minimum rating tersedia pada kontrak Backend, tetapi belum menjadi kontrol di halaman Explore saat ini.
- Lupa password, pengaturan “ingat saya”, notifikasi, dan foto profil pengguna tidak disimulasikan sebagai fitur siap pakai. Penetapan/verifikasi status mahasiswa juga belum dibuat.

## Verifikasi dan handoff QA

| Pemeriksaan | Status saat catatan ini dibuat |
|---|---|
| Frontend unit tests | **68 lulus**: client/sesi dan pemetaan data/endpoint restoran; request dimock pada unit tests |
| Backend source tests | **33 lulus**; bukan bukti alur database menyeluruh |
| API + database nyata pada worktree integrasi ini | **16/16 lulus** pada MariaDB 10.4.32; migration dan seed diulang dua kali |
| Browser smoke Frontend → API → database | **Belum terverifikasi**: Chrome/Edge menutup sebelum skenario pertama; 13 skenario disiapkan tetapi belum lulus. Browser Playwright terpisah belum selesai dipasang |
| Safari, uji beban, dan deployment production | Belum dinyatakan terverifikasi |

Perintah dari root worktree:

```powershell
npm run test:frontend
npm run test:backend
npm run lint
npm run build:all
npm run test:database:local --workspace @laperu/backend
npm run test:browser:local
```

Dua perintah terakhir memakai binary XAMPP/MariaDB di `C:\xampp\mysql\bin`, membuat database QA sementara terisolasi, lalu membersihkannya. Sebelum browser smoke, jalankan `npx playwright install chromium` satu kali untuk memasang browser pengujian terpisah. Runner membangun ulang Backend sebelum menguji dan memakai channel `chromium` secara default; `LAPERU_BROWSER_CHANNEL` dapat memilih channel terpasang lainnya. Ini tidak membuktikan MySQL 8 atau Safari. Untuk konfigurasi database/port dan cara menjalankan suite manual, lihat `docs/DATABASE_TESTING.md`; untuk kontrak lengkap, lihat `backend/openapi.yaml`.

Prioritas penerimaan QA: Guest tidak bisa mengakses favorit privat; registrasi/login gagal tidak membuat sesi palsu; reload memulihkan sesi valid; pergantian akun tidak menampilkan favorit akun lama; simpan/hapus favorit bertahan setelah reload; role non-Customer tidak dapat menulis favorit; UMKM baru tidak langsung menjadi warung publik. Catat hasil aktual terpisah dari daftar skenario yang direncanakan.
