# EcoSpend

EcoSpend adalah aplikasi web pencatat keuangan pribadi yang menghubungkan transaksi, anggaran, target, laporan, dan perkiraan jejak karbon dalam satu dasbor. Repository saat ini menyediakan dua jalur yang jelas: mode demo lokal tanpa backend dan mode akun nyata berbasis Supabase.

> **Status rilis:** fitur utama, migrasi, dan suite pengujian tersedia, tetapi repository belum memiliki remote Git, URL publik, atau bukti deployment/CI jarak jauh. Gunakan data nyata hanya setelah konfigurasi serta deployment produksi diverifikasi.

## Tautan dan tangkapan layar

- **Repository GitHub:** menunggu repository/remote Git yang terverifikasi.
- **Aplikasi live:** menunggu deployment yang terverifikasi.
- **Tangkapan layar:** akan ditambahkan setelah deployment terverifikasi; belum ada berkas di `docs/screenshots/`.

## Fitur yang tersedia

- Mode demo eksplisit melalui `/dashboard?demo=1`, memakai data sintetis dan penyimpanan browser; tidak mengirim data ke Supabase.
- Supabase opsional untuk autentikasi SSR: daftar, masuk, konfirmasi email, lupa/reset kata sandi, callback, logout, proteksi dasbor, dan onboarding akun.
- Data API terautentikasi untuk profil, akun, kategori, transaksi, anggaran, target, transaksi berulang, aturan merchant, notifikasi, karbon, impor, ekspor, dan penghapusan akun.
- Onboarding untuk nama tampilan, mata uang, zona waktu, siklus anggaran, target tabungan, tema, notifikasi, dan preferensi karbon.
- Lampiran transaksi privat (JPEG/PNG/WebP/PDF, maksimum 10 MiB) dengan Storage RLS dan signed download URL 60 detik.
- Transfer atomik melalui RPC PostgreSQL yang membuat pasangan debit/kredit tertaut dan memvalidasi pemilik, akun aktif, nominal, dan mata uang.
- Pembangkitan transaksi berulang yang terautentikasi dan idempoten; occurrence guard mencegah tanggal jadwal yang sama dibuat dua kali.
- Ekspor akun sebagai JSON yang dipaginasi, meredaksi field internal, dan menetralkan formula spreadsheet; penghapusan akun membersihkan objek lampiran privat sebelum data/auth dihapus.
- Impor CSV/XLSX, filter/tabel, anggaran, target, laporan, tema responsif, notifikasi dalam aplikasi, dan shell PWA dasar.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS
- Supabase Auth, PostgreSQL, Row Level Security, Storage, dan SSR client
- React Hook Form, Zod, TanStack Table, Recharts, ExcelJS
- Vitest/React Testing Library, Playwright/Axe, pgTAP, ESLint, TypeScript, Knip

## Arsitektur ringkas

`src/app/` berisi UI dan Route Handlers, `src/components/` fitur interaktif, `src/lib/` domain/validasi/adapter, dan `supabase/` migrasi, seed sintetis, serta pgTAP. Dasbor memilih `DemoProvider` hanya ketika query `demo=1`; jalur akun memakai `AuthenticatedStoreProvider` dan Route Handlers. RLS/constraint database adalah batas otorisasi dan integritas terakhir, bukan filter UI.

Nilai uang disimpan sebagai `BIGINT` satuan minor dan diserialisasi sebagai string di batas JSON. Estimasi karbon menyimpan snapshot faktor dan provenance agar hasil lama tetap dapat ditelusuri. Detail: [arsitektur](docs/architecture.md), [keamanan](docs/security.md), [quality gates](docs/quality-gates.md), dan [pengujian database](docs/database-testing.md).

## Menjalankan lokal

### Prasyarat

- Node.js 24 atau lebih baru
- npm
- Docker dan Supabase CLI 2.117.0 hanya untuk backend/database lokal

### Mode demo

```bash
git clone <URL_REPOSITORI>
cd EcoSpend
npm ci
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000/dashboard?demo=1`. Pada PowerShell gunakan `Copy-Item .env.example .env.local`. Nilai Supabase boleh kosong; mode demo dipilih secara eksplisit oleh query `demo=1` dan tidak membuktikan integrasi backend.

### Mode Supabase lokal

```bash
supabase start -x realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
supabase status
```

Salin Project URL lokal ke `NEXT_PUBLIC_SUPABASE_URL` dan publishable/anon key lokal ke `NEXT_PUBLIC_SUPABASE_ANON_KEY` dalam `.env.local`, lalu jalankan `npm run dev`. `supabase start` menerapkan migrasi serta `supabase/seed.sql`; data seed bersifat sintetis.

## Variabel lingkungan

[`.env.example`](.env.example) mendefinisikan semua nama frontend saat ini:

- `NEXT_PUBLIC_APP_URL`: origin publik untuk canonical metadata, sitemap, dan konfigurasi URL aplikasi; gunakan `http://localhost:3000` saat lokal.
- `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase HTTPS, atau HTTP loopback saat lokal.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/publishable key Supabase.

URL dan key harus diisi bersama untuk mode akun. Keduanya terlihat di browser dan hanya aman dengan RLS/Storage policy. Jangan pernah menaruh `service_role`, JWT secret, atau password database pada `NEXT_PUBLIC_*`.

## Migrasi dan database lokal

Migrasi di `supabase/migrations/` adalah sumber kebenaran untuk schema, constraint, indeks, trigger, RLS, Storage, RPC transfer/penghapusan akun, dan recurring generation. Untuk membuat ulang database lokal:

```bash
supabase db reset --local --yes
supabase db lint --level warning
supabase test db
```

`db reset` menghapus data database lokal, menerapkan seluruh migrasi, lalu menjalankan seed. Jangan arahkan perintah reset ke produksi. Lihat [docs/database-testing.md](docs/database-testing.md).

## Quality gates

Status lokal yang diverifikasi pada repository saat ini:

- 97 tes Vitest/RTL lulus (`npm test`).
- 132 tes pgTAP lulus (`supabase test db`).
- 10 tes Playwright Chromium, termasuk tiga scan Axe, lulus (`npm run test:e2e -- --project=chromium`).
- ESLint, typecheck, Knip untuk file/dependency/devDependency, Supabase lint, dan build produksi lulus.
- `npm audit` melaporkan 0 vulnerability.
- Build Next.js 16.3.4 menghasilkan 32 halaman statis/dinamis teroptimasi ditambah Proxy middleware.

Perintah utama:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run audit
npm run knip
npm run test:e2e:install
npm run test:e2e -- --project=chromium
```

Knip bersifat blocking untuk file yang tidak digunakan serta dependency/devDependency yang tidak digunakan; configuration hint informasional bukan temuan blocking. Suite dan angka di atas adalah hasil lokal, bukan klaim bahwa GitHub Actions atau deployment sudah lulus.

## CI

`.github/workflows/ci.yml` dikonfigurasi untuk push/pull request ke `main` dan `master`, memakai Node.js 24, action yang dipin ke commit, dan job terpisah untuk quality, Playwright/Axe, serta Gitleaks. Quality menjalankan instalasi bersih, lint, typecheck, 97 Vitest, build, audit, dan Knip. CI memberi konfigurasi Supabase kosong dan hanya membangun mode demo; workflow tidak menguji deployment Supabase nyata. Karena belum ada remote/run GitHub dalam repository lokal, dokumen ini tidak mengklaim CI pernah lulus.

## Deployment

Target harus mendukung Next.js App Router dan server Route Handlers.

1. Buat/hubungkan repository dan pilih Node.js 24+.
2. Terapkan migrasi Supabase ke proyek tujuan melalui alur rilis terkontrol; jangan memakai `db reset` pada produksi.
3. Tetapkan ketiga variabel lingkungan, termasuk `NEXT_PUBLIC_APP_URL` dengan origin HTTPS deployment.
4. Jalankan seluruh quality gates dan verifikasi Auth redirect URL, RLS dua pengguna, Storage privat, transfer, recurring generation, ekspor, serta penghapusan akun.
5. Verifikasi header keamanan, canonical/sitemap, dan smoke test pada URL produksi sebelum mengisi tautan live atau screenshot.

Paket otomatisasi performa yang memiliki dependency rentan telah dihapus. Verifikasi performa ditunda sampai ada URL produksi dan dilakukan dengan PageSpeed Insights atau rilis Lighthouse yang masih dipelihara.

## Uang dan karbon

- Uang memakai `BIGINT` satuan minor, bukan floating point; jangan mengubah nilai database besar ke JavaScript `number` tanpa pemeriksaan rentang.
- Estimasi aktivitas memakai `jumlah × faktor kgCO₂e/unit`; estimasi berbasis belanja memerlukan penyelarasan mata uang, wilayah, tahun, dan kategori.
- Hasil adalah estimasi CO₂e, bukan pengukuran langsung, audit, sertifikasi, atau saran finansial.
- Faktor demo di seed/UI bersifat sintetis atau disederhanakan, dapat usang, dan tidak layak untuk ESG, regulasi, klaim lingkungan, investasi, atau perbandingan ilmiah.
- Hindari penghitungan ganda antara aktivitas dan belanja untuk kejadian yang sama.

## Batasan saat ini

- Belum ada URL GitHub/live atau deployment produksi yang terverifikasi.
- Mode demo bersifat lokal, menggunakan data sintetis, dan tidak membuktikan Auth/RLS/Storage.
- Shell PWA hanya menyimpan halaman offline dan aset publik minimum; tidak ada cache data privat, offline penuh, mutasi offline, background sync, atau resolusi konflik.
- Faktor karbon demo bukan dataset produksi.
- Paket gratis hosting/Supabase memiliki batas kuota, performa, egress, retensi, dan availability.
- Kinerja belum diukur pada produksi; gunakan PageSpeed/Lighthouse terpelihara setelah URL live tersedia.

## Lisensi

Dilisensikan dengan [MIT License](LICENSE). Hak cipta © 2026 Leira.
