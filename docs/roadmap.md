# Roadmap EcoSpend

## Sekarang (beta)
- Mode demo + mode akun Supabase production aktif.
- Transfer atomik, lampiran privat, recurring idempoten, ekspor/penghapusan akun.
- Quality gates: lint, typecheck, 98 Vitest, E2E + Axe, pgTAP, Knip, audit bersih, CI hijau.

## Berikutnya
- SMTP kustom + uji deliverability email.
- Rate limit terdistribusi untuk endpoint sensitif.
- Sentry error tracking (kode siap, tinggal tempel DSN) + alerting.
- Lazy-load chart halaman karbon untuk LCP di bawah 2,5 dtk.
- Sisa temuan aksesibilitas P1 (standardisasi token tombol/brand, `aria-current` nav mobile, label transfer).

## Nanti (bila ada permintaan)
- Notifikasi push dan pengingat anggaran terjadwal.
- Kategori kustom lanjutan dan anggaran rollover penuh di UI.
- Mode multi-mata uang dan impor bank otomatis via CSV template bank lokal.
- Paket berbayar / donasi untuk menutup biaya infra.
