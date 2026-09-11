# Changelog

## 2026-09-11 — Penguatan pra-peluncuran
- Token preview impor kini wajib `IMPORT_TOKEN_SECRET` (>=32 karakter); fallback turunan anon-key dihapus agar token tidak dapat ditebak.
- Modal dialog: focus trap Tab/Shift+Tab, fokus judul saat dibuka, fokus kembali ke pemicu saat ditutup, tombol tutup 44px.
- Target sentuh tombol ikon dashboard dinaikkan (transaksi, anggaran, pengaturan, notifikasi).
- Seluruh grafik (arus kas, kategori, karbon) mendapat ringkasan data `figcaption` untuk screen reader; tick chart digelapkan ke slate-600.
- Marquee landing disembunyikan dari screen reader; klaim statistik hero diganti fakta produk; label tema diperjelas "Tema dasbor".
- Vercel Analytics + Speed Insights terpasang; slot Sentry disiapkan (belum aktif).
- Kebijakan privasi/terms: kontak support placeholder + retensi backup 7 hari berputar.
- Dokumen baru: runbook insiden, panduan 5 menit, roadmap.
