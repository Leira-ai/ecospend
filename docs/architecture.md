# Arsitektur EcoSpend

Dokumen ini menjelaskan implementasi yang ada di repository saat ini. Sumber kebenaran operasional tetap `package.json`, `src/`, dan migrasi di `supabase/`.

## Konteks sistem

```text
Pengguna
   │ HTTPS
   ▼
Next.js 16 App Router
   ├── halaman publik, Auth, onboarding, dan dasbor
   ├── Route Handlers terautentikasi di /api
   ├── Zod, logika domain, dan adapter data
   ├── DemoProvider (hanya saat ?demo=1)
   └── AuthenticatedStoreProvider
              │ Supabase SSR/browser client + user JWT
              ▼
      Supabase Auth + PostgreSQL + RLS + Storage
```

EcoSpend menyediakan dua mode eksplisit:

- **Demo:** `/dashboard?demo=1` memilih `DemoProvider`, data sintetis, dan penyimpanan browser. Mode ini tidak memerlukan konfigurasi Supabase dan tidak membuktikan RLS atau integrasi backend.
- **Akun nyata:** URL dan anon/publishable key Supabase yang valid mengaktifkan Auth SSR, proteksi route, onboarding, Route Handlers, dan `RemoteDashboardStore`. Tanpa `demo=1`, dasbor memerlukan sesi ketika Supabase dikonfigurasi.

## Routing dan autentikasi

`src/proxy.ts` memperbarui cookie sesi untuk route Auth/dasbor/onboarding. Pengguna tanpa sesi dialihkan dari dasbor akun ke login, sedangkan pengguna terautentikasi yang belum menyelesaikan profil diarahkan ke `/onboarding`. Callback Auth menukar kode sesi; halaman login, register, lupa kata sandi, reset, dan logout memakai Supabase Auth.

Onboarding menyimpan nama, mata uang, serta zona waktu pada `profiles`, lalu menyimpan siklus anggaran, target tabungan, tema, notifikasi, dan preferensi karbon pada user metadata. Pengguna dapat melewati alur akun dan membuka demo secara eksplisit.

## Lapisan aplikasi

- `src/app/`: halaman App Router, metadata, loading/error boundaries, dan Route Handlers.
- `src/components/`: fitur UI publik, onboarding, dasbor, grafik, dialog, impor, serta lampiran.
- `src/lib/`: domain uang/karbon/impor, schema Zod, optional Supabase clients, data helpers, dan keamanan request.
- `supabase/migrations/`: schema, constraint, indeks, trigger, RLS, Storage policy, dan RPC.
- `supabase/tests/database/`: pgTAP untuk schema, privilege, isolasi, transfer, Storage, karbon, dan recurring generation.

Data privat tidak memakai cache bersama: Route Handlers dan route sensitif diberi `no-store`, sedangkan production headers menambahkan CSP, frame denial, HSTS, nosniff, referrer policy, permissions policy, dan COOP.

## Data API yang diimplementasikan

Route Handlers terautentikasi mencakup profil, akun, kategori, transaksi tunggal/bulk/transfer, anggaran, target/kontribusi, transaksi berulang/generasi, aturan merchant, notifikasi, karbon, impor preview/commit, lampiran, ekspor, logout, dan penghapusan akun. Input mutasi divalidasi dan identitas diambil dari sesi, bukan `user_id` dari browser.

`RemoteDashboardStore` memuat snapshot dasbor dari API tersebut dan mengirim mutasi kembali ke Route Handlers. RLS, foreign key komposit, check constraint, dan trigger tetap menjadi batas integritas terakhir. Beberapa aksi UI yang tidak mempunyai operasi server ekuivalen menolak operasi secara eksplisit, bukan diam-diam mengubah data lokal akun.

## Model data

Migrasi saat ini membentuk:

- profil, akun, kategori, transaksi, tag, dan riwayat impor;
- aturan merchant, anggaran, target, kontribusi, serta transaksi berulang;
- faktor emisi dan estimasi karbon bersnapshot;
- notifikasi dan metadata lampiran transaksi;
- occurrence guard untuk pembangkitan transaksi berulang.

Semua tabel milik pengguna memakai `user_id`, constraint kepemilikan, indeks query/RLS, dan forced RLS. Pengguna terautentikasi hanya dapat melihat/mengubah baris sendiri. Kategori sistem dan faktor emisi dapat dibaca pengguna terautentikasi tetapi tidak dapat diubah oleh role browser.

## Uang dan transfer

Nilai moneter disimpan sebagai `BIGINT` satuan minor:

```text
Rp10.000 -> 10000 IDR minor units
$12.34   -> 1234 USD minor units
```

Nilai `BIGINT` diserialisasi sebagai string pada JSON untuk menghindari hilangnya presisi JavaScript. Agregasi lintas mata uang tidak dilakukan tanpa konversi eksplisit.

Transfer dibuat hanya melalui RPC `create_transfer(...)`. RPC mengunci dan memeriksa dua akun aktif milik pengguna, menolak akun yang sama, nominal nonpositif, dan mata uang berbeda, lalu membuat tepat satu debit dan satu kredit dengan `transfer_group_id` yang sama dalam satu transaksi database. Trigger deferred menjaga invariant pasangan dan insert transfer langsung ditolak.

## Recurring generation

Template mendukung jadwal harian, mingguan, bulanan, tahunan, interval kustom, serta tanggal akhir. Endpoint same-origin `/api/recurring/generate` memanggil RPC terautentikasi dan rate-limited. RPC:

- menghasilkan transaksi `pending` dengan source `recurring`;
- menghitung catch-up sampai tanggal pengguna berdasarkan zona waktu profil;
- mengunci row dengan `FOR UPDATE SKIP LOCKED`;
- membatasi 500 occurrence per panggilan;
- memakai unique occurrence guard agar pembukaan/panggilan ulang tidak menggandakan transaksi;
- menonaktifkan jadwal setelah tanggal akhir dan melewati referensi akun/kategori yang tidak valid.

Endpoint dan RPC tersedia, tetapi tidak ada scheduler/background job terpisah; pemanggil harus memicu endpoint.

## Lampiran privat

Bucket `transaction-attachments` bersifat privat, maksimum 10 MiB, dan hanya menerima JPEG, PNG, WebP, atau PDF. Path mengikat user, transaksi, dan attachment ID. UI dan server memvalidasi tipe, ukuran, isi/signature, nama, dan kepemilikan transaksi. Download memakai signed URL 60 detik. Storage policy membatasi path pemilik; penghapusan akun lebih dahulu menghapus seluruh objek privat dan memverifikasi bucket bersih.

## Ekspor dan penghapusan akun

`GET /api/export` memaginasi tabel milik pengguna dan menghasilkan JSON versi eksplisit. Field internal/sensitif seperti `user_id`, storage path, hash, option internal, dan token tidak diekspor; string berawalan formula dinetralkan. Ekspor menyertakan snapshot provenance faktor karbon, tetapi bukan isi file lampiran.

Penghapusan akun memerlukan konfirmasi tepat, rate limit, cleanup dan verifikasi Storage, lalu RPC `delete_my_account()` menghapus user Auth sehingga foreign-key cascade membersihkan data. Setelah berhasil, UI membersihkan state/storage/cache EcoSpend lokal dan kembali ke login.

## Karbon

Faktor emisi menyimpan key, versi, unit, wilayah, masa berlaku, sumber, metodologi, dan penanda demo. Trigger menyalin snapshot faktor ke estimasi dan mencegah perubahan provenance lama. Faktor seed/demo sintetis atau disederhanakan; hasil hanya perkiraan CO₂e dan tidak sesuai untuk ESG, regulasi, audit, klaim lingkungan, investasi, atau perbandingan ilmiah.

## Spreadsheet

ExcelJS memproses CSV/XLSX; paket `xlsx` tidak dipakai. Alur impor melakukan preview, validasi row, deteksi duplikat, dan commit terautentikasi. Input spreadsheet dianggap tidak tepercaya. Ekspor menetralkan awalan formula `=`, `+`, `-`, dan `@`.

## PWA dan offline

PWA yang ada hanya shell installable. Service worker menyimpan `/offline` dan aset publik minimum, memakai network-first/no-store untuk navigasi, dan mengabaikan `/dashboard`, `/api`, serta `/auth`. Tidak ada cache data finansial/sesi, offline penuh, mutasi offline, background sync, atau resolusi konflik.

## Environment dan deployment

- `NEXT_PUBLIC_APP_URL`: origin aplikasi untuk metadata/sitemap dan konfigurasi URL publik.
- `NEXT_PUBLIC_SUPABASE_URL`: URL proyek Supabase.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: key publik browser.

Build demo berhasil saat dua nilai Supabase kosong. Deployment akun nyata harus menetapkan ketiganya, menerapkan migrasi, dan mengonfigurasi Auth redirect URL. Repository belum memiliki remote Git atau URL live; CI/deployment produksi tidak diklaim lulus.

## Verifikasi

Repository saat ini memiliki 97 tes Vitest/RTL, 132 assertion pgTAP, dan 10 tes Playwright Chromium+Axe. Knip memblokir file, dependency, dan devDependency yang tidak digunakan. Paket otomatisasi performa yang memiliki dependency rentan telah dihapus; kinerja produksi belum dapat diverifikasi tanpa URL live dan harus diperiksa memakai PageSpeed Insights atau Lighthouse yang masih dipelihara setelah deployment.
