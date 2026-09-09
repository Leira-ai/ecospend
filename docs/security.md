# Keamanan dan Privasi EcoSpend

Dokumen ini merangkum kontrol yang sudah ada dan pemeriksaan yang tetap wajib dilakukan sebelum deployment produksi. Build dan tes lokal bukan bukti konfigurasi cloud sudah aman.

## Model ancaman

Aset utama adalah sesi, identitas, transaksi, anggaran/target, file impor/lampiran, preferensi, dan estimasi karbon. Risiko utama meliputi akses lintas akun, token/rahasia bocor, input berbahaya, cache privat, salah konfigurasi RLS/Storage/Auth redirect, kegagalan cleanup akun, brute force/kuota, dan hasil karbon yang disalahartikan.

Browser serta seluruh input klien tidak tepercaya. Zod dan validasi UI membantu kualitas input, tetapi otorisasi ditegakkan oleh sesi terverifikasi, Route Handlers, privilege PostgreSQL, RLS, constraint, dan Storage policy.

## Mode demo dan environment

Konfigurasi frontend saat ini:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

URL dan anon/publishable key Supabase dapat terlihat di browser; keamanan tetap bergantung pada RLS. Jangan menaruh service-role key, JWT secret, password database, token administratif, atau PII pada `NEXT_PUBLIC_*`, repository, log, fixture, screenshot, atau issue.

Konfigurasi Supabase dianggap aktif hanya jika URL valid dan URL/key tersedia bersama. Mode demo tetap dipilih secara eksplisit dengan `/dashboard?demo=1`, memakai data sintetis lokal, dan menampilkan indikator demo. Mode demo tidak mengirim data ke Supabase dan tidak membuktikan keamanan backend.

## Autentikasi, sesi, dan onboarding

- Supabase SSR memperbarui cookie sesi melalui Proxy middleware; server memakai `getClaims()` untuk gate awal dan `getUser()` saat identitas penuh diperlukan.
- Dasbor akun mengharuskan sesi; query `demo=1` adalah jalur demo terpisah.
- Login, register/konfirmasi email, callback, forgot/reset password, dan logout diimplementasikan.
- Callback/redirect dibatasi ke destination internal yang aman; onboarding mengalihkan pengguna akun yang belum selesai.
- Onboarding tidak meminta nomor rekening, kartu, atau PIN. Profil database dan user metadata menyimpan hanya preferensi yang didokumentasikan.
- Logout membersihkan storage/cache EcoSpend lokal; token tidak disimpan ke URL, log, atau local storage buatan aplikasi.

Konfigurasi Auth produksi, HTTPS, cookie, email template, redirect allowlist, rate limit penyedia, dan proteksi enumerasi tetap harus diverifikasi pada proyek Supabase tujuan.

## RLS dan privilege

Migrasi mengaktifkan dan memaksa RLS pada tabel privat. Policy membatasi baris dengan `auth.uid()`; relasi anak memakai foreign key komposit `(id,user_id)` untuk menjaga pemilik parent. Anon dicabut dari seluruh tabel publik. Kategori sistem serta faktor emisi read-only bagi pengguna terautentikasi.

Function privilege diperkeras: RPC transfer, penghapusan akun, dan recurring generation hanya dapat dijalankan role `authenticated`; helper internal dicabut dari role browser kecuali helper Storage yang dibutuhkan policy. Security-definer function memakai `search_path=''` dan identitas dari `auth.uid()`.

Filter `.eq("user_id", ...)` pada SDK hanya defense-in-depth, bukan pengganti RLS. pgTAP menguji anon, pengguna A, pengguna B, ownership, forced RLS, dan privilege function.

## Data API dan request safety

Route Handlers mengambil user dari sesi, memvalidasi JSON/form data, membatasi metode/content type/payload, dan mengembalikan error terstruktur tanpa query/token. Mutasi memakai pemeriksaan origin yang sesuai dan endpoint sensitif memiliki rate limit in-memory per instance. Rate limiter ini bukan rate limit global terdistribusi; deployment publik tetap memerlukan kontrol platform/upstream untuk serangan lintas instance.

Production config memberi `Cache-Control: private, no-store` pada dasbor, Auth, dan API. Header global mencakup CSP, `frame-ancestors 'none'`, X-Frame-Options DENY, nosniff, referrer policy, permissions policy, COOP, dan HSTS. CSP mengizinkan origin Supabase yang dikonfigurasi untuk koneksi; verifikasi header aktual pada deployment HTTPS.

## Transfer atomik

Transfer tidak boleh dibuat dengan insert transaksi biasa. RPC `create_transfer` memeriksa sesi, kepemilikan dua akun aktif, akun berbeda, nominal positif, dan mata uang sama. Dalam satu transaksi database, RPC membuat debit/kredit tertaut; deferred constraint trigger memverifikasi tepat dua row, satu pemilik, satu nominal/mata uang, dua akun, satu debit, dan satu kredit. Anon dan helper invariant tidak mempunyai execute privilege.

## Recurring generation

Endpoint generasi memerlukan sesi, request same-origin, dan rate limit; RPC memerlukan `auth.uid()`. Row jadwal dikunci, occurrence key unik mencegah duplikasi, row pengguna lain tidak terlihat, transfer tidak dapat dihasilkan, dan jumlah pemrosesan dibatasi. Endpoint tersedia tetapi bukan background scheduler; deployment harus menentukan kapan endpoint dipanggil dan memonitor kegagalan tanpa menggunakan service-role di browser.

## Lampiran privat

Bucket `transaction-attachments` bersifat privat, maksimal 10 MiB, dan allowlist MIME JPEG/PNG/WebP/PDF. Server memvalidasi signature/isi, ukuran, extension/nama aman, path UUID, dan kepemilikan transaksi. Metadata memiliki forced RLS. Storage policy membatasi objek pada prefix user dan transaksi yang dimiliki.

Download memakai signed URL 60 detik dan tidak menampilkan storage path pada respons daftar. Upload yang gagal menyimpan metadata mencoba menghapus objek; error cleanup dilaporkan. Penghapusan file menghapus objek sebelum metadata. Penghapusan akun memindai prefix pemilik secara rekursif, menghapus batch, memverifikasi tidak ada objek tersisa, lalu baru menghapus user/database. Signed URL tetap rahasia sementara: jangan log, kirim ke analytics, atau bagikan.

## Ekspor dan penghapusan akun

Ekspor akun terautentikasi, rate-limited, dinamis/no-store, dan dipaginasi. Output menghilangkan `user_id`, storage path, hash, option internal, token/secret, serta menetralkan formula spreadsheet. Metadata lampiran diekspor, isi file tidak. Audit kebutuhan ekspor sebelum klaim portabilitas regulasi.

Penghapusan akun memerlukan string konfirmasi tepat dan dibatasi tiga percobaan/jam per instance. Cleanup Storage harus berhasil dan terverifikasi sebelum RPC menghapus `auth.users`; cascade membersihkan row terkait. Jika cleanup sebagian gagal, endpoint berhenti dan meminta retry daripada menghapus database terlebih dahulu.

## Uang, karbon, dan integritas

Nilai uang memakai `BIGINT` satuan minor. Batas JSON mempertahankan nilai sebagai string untuk mencegah kehilangan presisi. Constraint menolak nilai tidak valid, ownership lintas user, dan relasi kategori yang salah.

Estimasi karbon menyimpan snapshot factor key, versi, nama, unit, rate, sumber, dan metodologi. Trigger menghitung hasil dan membuat provenance immutable. Faktor demo/seed bersifat sintetis atau disederhanakan; jangan pakai untuk audit, ESG, regulasi, klaim lingkungan, investasi, atau saran finansial.

## Spreadsheet

ExcelJS digunakan; paket `xlsx` tidak ada. CSV/XLSX adalah input tidak tepercaya: preview/commit memvalidasi schema dan row, membatasi payload, serta mendeteksi duplikasi. Ekspor menetralkan string berawalan `=`, `+`, `-`, atau `@` untuk mengurangi formula injection. Jangan memakai nama file sebagai path atau mencatat isi file ke log.

## PWA dan perangkat bersama

Service worker hanya mencache halaman offline dan aset publik minimum. Fetch untuk `/dashboard`, `/api`, dan `/auth` tidak diintersepsi. Tidak ada cache response autentikasi, data finansial, token, atau ekspor; juga tidak ada offline mutation/background sync. Setelah logout/penghapusan akun, cache EcoSpend dibersihkan. Browser history, download, screenshot, dan sesi OS tetap menjadi risiko pada perangkat bersama.

## Dependency dan supply chain

`npm audit` saat verifikasi lokal melaporkan 0 vulnerability. Dependency dikunci di lockfile dan mayoritas versi aplikasi dipin; CI memakai `npm ci` serta action yang dipin ke commit. Knip memblokir file, dependency, dan devDependency tidak terpakai. Gitleaks dikonfigurasi sebagai job CI. Dependabot memantau npm dan GitHub Actions.

Paket otomatisasi performa yang memiliki dependency rentan telah dihapus. Jangan mengembalikan package rentan hanya untuk badge. Verifikasi performa dilakukan setelah deployment dengan PageSpeed Insights atau Lighthouse terpelihara.

## Privasi dan logging

Gunakan minimisasi data, seed/fixture/screenshot sintetis, least privilege operator, dan retensi yang terdokumentasi. Jangan log authorization header, cookie, token, signed URL, email, nominal/deskripsi transaksi, file impor/lampiran, atau payload database. Belum ada bukti konfigurasi analytics, backup, retensi, subprosesor, residency, atau kanal privasi produksi; semua itu harus ditetapkan sebelum peluncuran publik.

## Checklist produksi

- Terapkan dan tinjau seluruh migrasi pada proyek tujuan; jalankan pgTAP terhadap lingkungan rilis yang aman.
- Verifikasi RLS/Storage sebagai anon, pengguna A, pengguna B, dan role server; jangan hanya mengandalkan mock.
- Pastikan tidak ada service-role key/secret di bundle, source map, log, artifact, atau history.
- Verifikasi Auth redirect, email flow, logout/reset, onboarding, transfer, recurring, attachment, ekspor, dan penghapusan akun.
- Jalankan lint, typecheck, 97 Vitest, build, audit, Knip, 10 Playwright+Axe, Supabase lint, dan 132 pgTAP.
- Verifikasi HTTPS serta header/cache/CSP pada URL live.
- Tetapkan rate limiting terdistribusi, monitoring aman, retensi/backup, prosedur insiden, kanal vulnerability report, dan kebijakan privasi.
- Pisahkan faktor demo dari data produksi dan dokumentasikan provenance faktor produksi.

CI tanpa secrets hanya membangun mode demo. Repository lokal belum memiliki remote atau deployment, sehingga tidak ada klaim CI/cloud security sudah lulus.
