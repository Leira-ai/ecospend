# Quality gates

EcoSpend memakai Node.js 24+ dan instalasi reproducible dengan `npm ci`. Hasil di bawah diverifikasi lokal pada repository saat ini; hasil tersebut bukan klaim bahwa GitHub Actions atau deployment publik pernah lulus.

## Gate blocking

| Gate | Command | Hasil lokal saat ini |
| --- | --- | --- |
| ESLint | `npm run lint` | Lulus |
| TypeScript | `npm run typecheck` | Lulus |
| Vitest + RTL | `npm test` | 31 file, 97 tes lulus |
| Production build | `npm run build` | Lulus dengan Next.js 16.3.4; 32 route/page dioptimasi + Proxy |
| Playwright + Axe | `npm run test:e2e -- --project=chromium` | 10 tes lulus |
| Knip | `npm run knip` | Lulus untuk file, dependency, dan devDependency |
| Dependency audit | `npm run audit` | 0 vulnerability |
| Supabase lint | `supabase db lint --level warning` | Lulus |
| pgTAP/RLS | `supabase test db` | 4 file, 132 assertion lulus |
| Secret scan | Gitleaks job di CI | Dikonfigurasi; tidak dijalankan dalam verifikasi lokal ini |

`npm run knip` memakai `--include files,dependencies,devDependencies`, sehingga temuan unused pada ketiga kategori bersifat blocking. Pesan `Configuration hints` dari Knip bersifat saran konfigurasi, bukan unused finding dan tidak membuat command gagal.

## Menjalankan gate

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run audit
npm run knip
npm run test:e2e:install
npm run test:e2e -- --project=chromium
```

Database memerlukan Docker dan Supabase CLI 2.117.0:

```bash
supabase start -x realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
supabase db lint --level warning
supabase test db
```

Build/Playwright dapat berjalan tanpa Supabase dengan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` kosong; E2E memakai mode demo. Pengujian itu tidak memvalidasi Supabase cloud.

## Cakupan

- **Vitest/RTL (97):** domain uang/finance/impor/karbon, schema, optional Supabase config, security helpers, attachment validation/repository/UI, recurring request/RPC adapter, export/penghapusan akun, onboarding/proxy, store/adapter, dasbor, pengaturan, PWA cleanup, dan alur interaksi.
- **Playwright/Axe (10):** landing, demo, transaksi/filter, anggaran, laporan CSV, mobile/keyboard navigation, batas metodologi karbon, serta tiga scan Axe pada landing, dasbor, dan dialog transaksi. Axe tidak memakai exclusion dan memblokir violation serious/critical.
- **pgTAP (132):** schema/privilege/forced RLS, anon denial, isolasi dua user, ownership komposit, kategori/faktor read-only, transfer atomik, snapshot karbon, Storage privat, dan recurring generation idempoten.

Automasi tidak menggantikan review screen reader, 200% zoom/reflow, visual/browser matrix, reduced motion, dark mode, konfigurasi Auth cloud, header produksi, dan isolasi user pada deployment aktual.

## CI

`.github/workflows/ci.yml` berjalan pada push/pull request ke `main` atau `master` dan mempunyai:

1. **quality:** `npm ci`, lint, typecheck, Vitest, build, audit, dan Knip;
2. **e2e:** Chromium install lalu Playwright+Axe;
3. **secrets:** checkout history penuh lalu Gitleaks.

Workflow memakai Node.js 24, permission read-only, concurrency cancellation, dan action yang dipin ke commit. Environment Supabase sengaja kosong, sehingga CI menguji build/demo tanpa secret. Supabase lint dan pgTAP saat ini dijalankan lokal, bukan di workflow. Repository tidak memiliki remote/run GitHub yang dapat diperiksa, jadi status CI tidak diklaim.

## Performance

Paket otomatisasi performa yang memiliki dependency rentan telah dihapus. Performance verification ditunda sampai URL produksi tersedia, lalu dilakukan dengan PageSpeed Insights atau rilis Lighthouse yang masih dipelihara. Jangan menambahkan kembali package rentan hanya untuk menghasilkan badge.

## Artefak dan batasan

Playwright memakai production server (`npm run build && npm run start`) dan menyimpan trace/screenshot/video hanya pada kondisi yang dikonfigurasi. Hasil generated tetap lokal/ignored. Shell PWA bukan offline-first; E2E tidak membuktikan offline data sync. Faktor karbon demo sintetis/disederhanakan; test hanya membuktikan perilaku kode, bukan akurasi ilmiah.
