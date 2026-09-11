# Runbook Insiden EcoSpend

Kontak dukungan: support@ecospend.local (placeholder; ganti sebelum peluncuran publik).

## Kebocoran data / kredensial

1. Cabut kredensial yang bocor (rotasi key Supabase/Vercel yang terdampak).
2. Tutup akses: revoke sesi via Supabase Auth, nonaktifkan deployment bila perlu.
3. Identifikasi cakupan: tabel, user_id, rentang waktu, log terkait.
4. Beri tahu pengguna terdampak maksimal 72 jam setelah konfirmasi.
5. Catat timeline, akar masalah, dan perbaikan di CHANGELOG.

## Penyalahgunaan / spam akun

1. Nonaktifkan akun via Supabase Auth; hapus konten berbahaya.
2. Perketat rate limit endpoint terkait bila terbukti disalahgunakan.
3. Tinjau log 7 hari terakhir untuk pola yang sama.

## Downtime / error massal

1. Cek status Vercel dan Supabase; baca log deployment terbaru.
2. Rollback ke deployment Vercel terakhir yang sehat bila penyebabnya rilis baru.
3. Uji landing, login, dan dashboard demo pasca-rollback.
4. Umumkan status ke pengguna beta bila gangguan lebih dari 30 menit.

## Backup dan pemulihan

- Backup database otomatis harian oleh Supabase, retensi berputar maksimal 7 hari.
- Penghapusan akun menghapus data aktif seketika; salinan backup lama hilang saat tertimpa.
- Uji restore ke proyek staging sebelum memulihkan produksi.

## SMTP

- Default: pengirim bawaan Supabase (limit ketat, rawan spam).
- TODO produksi serius: pasang SMTP kustom (mis. Resend) di Supabase → Authentication → SMTP, lalu uji kirim ke Gmail/Yahoo/Outlook.
