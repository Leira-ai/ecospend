# Local database testing

EcoSpend memiliki 5 migrasi, seed sintetis, dan 4 suite pgTAP dengan total 132 assertion. Pengujian memakai Supabase CLI 2.117.0 dan PostgreSQL lokal melalui Docker; setiap file test berada dalam transaksi dan di-rollback.

## Prasyarat

- Docker Desktop atau daemon Docker lain
- Supabase CLI 2.117.0
- Port lokal 55320–55322 tersedia

## Menjalankan

Dari root repository:

```bash
supabase start -x realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
supabase db lint --level warning
supabase test db
```

Hasil lokal saat verifikasi: schema lint tanpa warning/error dan `Files=4, Tests=132, Result: PASS`.

Untuk membuktikan database dapat direproduksi dari migrasi dan seed:

```bash
supabase db reset --local --yes
supabase db lint --level warning
supabase test db
```

`db reset` menghapus data database lokal, menerapkan seluruh file `supabase/migrations/`, lalu menjalankan `supabase/seed.sql`. Jangan arahkan reset ke database produksi. Setelah selesai gunakan:

```bash
supabase stop
```

Jika health check sementara gagal setelah reset, tunggu `supabase status` menunjukkan stack berjalan lalu ulangi lint/test.

## Suite dan cakupan

| File | Assertion | Cakupan utama |
| --- | ---: | --- |
| `001_schema_security.test.sql` | 47 | tabel/kolom/constraint, forced RLS, grant/revoke, policy, RPC privilege, bucket privat 10 MiB |
| `002_rls_integrity.test.sql` | 30 | anon denial, isolasi dua user, ownership child/parent, kategori/faktor read-only, owner Storage insert |
| `003_transfer_carbon_storage.test.sql` | 25 | validasi dan pasangan transfer atomik, snapshot karbon immutable/nonnegatif, path Storage milik user |
| `004_recurring_generation.test.sql` | 30 | privilege, jadwal/interval/timezone, catch-up, end date, occurrence guard, idempotensi, isolasi user |

Total: 132 assertion.

## Perilaku yang dibuktikan

- Anon tidak mempunyai akses tabel privat dan tidak dapat menjalankan RPC transfer/recurring.
- User A tidak dapat membaca, memindahkan, atau mengaitkan data milik user B.
- Seluruh tabel user penting memakai enabled + forced RLS.
- Kategori sistem dan faktor emisi read-only bagi role browser.
- Transfer valid membuat tepat dua record tertaut (debit/kredit) dengan satu pemilik, nominal, mata uang, dan group; insert transfer langsung ditolak.
- Estimasi karbon dihitung dari faktor dan menyimpan snapshot provenance immutable.
- Bucket `transaction-attachments` private, dibatasi 10 MiB, dan policy path mengikat user/transaksi.
- Pembangkitan recurring hanya membuat draft `pending`, menolak transfer, melakukan catch-up terikat limit, dan tidak membuat occurrence yang sama dua kali.

## Catatan lingkungan

Tes membuat user/row sintetis dengan domain `.invalid`; tidak ada data pribadi. Stack lokal memakai key default Supabase dan bind service yang cocok untuk development saja. Jangan memakai key, password, atau konfigurasi lokal tersebut di produksi.

Suite database memvalidasi migrasi lokal, bukan proyek Supabase cloud. Sebelum rilis, terapkan migrasi melalui alur terkontrol dan jalankan pemeriksaan ekuivalen terhadap lingkungan rilis yang aman. CI repository saat ini belum menjalankan pgTAP, sehingga 132 assertion merupakan gate lokal yang terdokumentasi, bukan status job GitHub.
