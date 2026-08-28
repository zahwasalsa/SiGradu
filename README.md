# Sigradu

Sistem terintegrasi Yudisium → Campus Hiring & Tracer Study → Wisuda. Lihat `docs/` untuk requirement lengkap dan `docs/DATABASE_DESIGN.md` untuk rancangan skema database.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui (varian `base` — komponen dibangun di atas [`@base-ui/react`](https://base-ui.com), **bukan** Radix — perhatikan ini saat menambah komponen baru: gunakan prop `render={<Element />}`, bukan `asChild`) · Supabase (Postgres, Auth, Storage) · Zod · React Hook Form.

## Menjalankan secara lokal

```bash
npm install
npm run dev
```

Buka http://localhost:3000 — tanpa koneksi Supabase yang valid, aplikasi tetap bisa dibuka (halaman `/login` render normal), tapi login dan semua query data tidak akan berjalan.

## Menghubungkan Supabase (WAJIB sebelum data bisa dipakai)

1. Salin `.env.example` ke `.env.local` (sudah ada file `.env.local` berisi placeholder — tinggal ganti isinya).
2. Ambil nilai dari **Supabase Dashboard → Project Settings → API** pada project Sigradu (project dengan 20 tabel yang sudah dibuat sebelumnya):
   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/publishable key.
   - `SUPABASE_SERVICE_ROLE_KEY` — opsional, hanya isi jika nanti ada server action yang butuh bypass RLS (mis. generate Buku Wisuda lintas mahasiswa). **Jangan pernah** memberi prefix `NEXT_PUBLIC_` pada key ini atau mengirimkannya ke client.
3. Restart `npm run dev`.

### Skema database — terverifikasi terhadap project asli ✅

`src/types/database.ts` di-generate langsung dari project Supabase live (bukan tulisan tangan lagi):

```bash
npx supabase gen types typescript --project-id mawyyiooxpscpkfswgih > src/types/database.ts
```

Kalau schema database berubah di kemudian hari, jalankan ulang command di atas lalu `npm run build` untuk menangkap perbedaan.

### Storage bucket

3 bucket **privat** sudah dibuat di Supabase Storage lewat migration (lihat bagian RLS di bawah), sesuai `docs/STORAGE_DESIGN.md`:

- `yudisium` (subfolder per jenis dokumen ditulis di path, mis. `ktp/<studentId>/...`)
- `hiring`
- `wisuda`

## Row Level Security (RLS) — sudah diterapkan ✅

Ke-20 tabel + `storage.objects` sudah punya RLS aktif dan policy sesuai `docs/DATABASE_DESIGN.md` §9, diterapkan lewat 8 file migration di `supabase/migrations/` (dijalankan manual lewat Supabase SQL Editor, bukan `supabase db push`, karena project belum di-link CLI). Ringkasan keputusan penting (deviasi dari dokumen, hal yang di-flag sebagai OPEN QUESTION, dsb.) ada di riwayat percakapan sesi setup — belum dirangkum jadi dokumen terpisah.

Catatan: sebelum migration ini diterapkan, ditemukan **127 policy RLS lama** di database (bukan buatan sesi ini) dengan penamaan berbeda dan beberapa di antaranya memberi akses `ALL` (termasuk DELETE) yang lebih longgar dari desain kita — semuanya sudah dihapus dan diganti total dengan 83 policy dari `supabase/migrations/`. Skrip rollback manual ada di `supabase/rollback_rls_and_storage.sql` bila suatu saat perlu dibatalkan.

## Struktur folder

```
src/
  app/
    login/                      # halaman login (shared, redirect berdasar role setelah masuk)
    (student)/                  # route group Portal Mahasiswa — layout dgn sidebar/header
      dashboard/  yudisium/  hiring/  tracer/  wisuda/
    admin/                       # Portal Admin — layout dgn sidebar/header, nav berbeda per role
      dashboard/  yudisium/  hiring/  tracer/  wisuda/  reports/  settings/
  components/
    ui/            # shadcn/ui primitives (@base-ui/react)
    layout/        # AppShell, Sidebar, UserMenu, nav config per role
    shared/         # StatusBadge, PageHeader, EmptyState, LockedNotice
    yudisium/ hiring/ tracer/ wisuda/ admin/  # form & kontrol per modul
  lib/
    supabase/      # client.ts (browser), server.ts (RSC/Server Action), middleware.ts (session refresh)
    auth/session.ts # getCurrentUser / requireUser / requireRole (dipakai di setiap layout & action)
    modules/gating.ts # logika gating Modul 2/3 (satu sumber kebenaran progres mahasiswa)
    modules/periods.ts
    rbac.ts        # peta role -> modul admin yang boleh diakses
    storage.ts     # helper upload/signed URL Supabase Storage
    status-history.ts # helper wajib dipanggil setiap perubahan status (CLAUDE.md #10)
  types/
    database.ts    # tipe tabel — di-generate dari live schema, lihat catatan di atas
    domain.ts       # enum status & label Bahasa Indonesia, dipakai di seluruh UI
  proxy.ts          # (dulu middleware.ts — Next.js 16 me-rename convention ini) refresh sesi + gate login
```

## Alur gating modul (CLAUDE.md #7, #8)

Tidak ada kolom "boleh akses modul X" yang disimpan — status dicek langsung tiap request lewat `src/lib/modules/gating.ts`:

- Modul 2 (Hiring & Tracer) terbuka jika `yudisium_applications.status = 'approved'` milik mahasiswa tsb.
- Modul 3 (Wisuda) terbuka jika `tracer_studies.status = 'approved'`.
- Syarat Hiring dianggap terpenuhi jika: sudah di-bypass admin, **atau** (`belum_bekerja` dan jumlah `job_applications` ≥ `hiring_thresholds`), **atau** (`sudah_bekerja`/`wirausaha`/`melanjutkan_studi` dan ada `employment_proofs.status = 'verified'`).

## Apa yang BELUM diimplementasikan / perlu keputusan lanjutan

Semua ditandai `OPEN QUESTION` di `docs/DATABASE_DESIGN.md` §11 masih berlaku. Yang paling relevan untuk lanjutan development:

- Field-level form Modul 1 (data akademik/pribadi/orang tua lengkap) — dokumen rujukannya tidak ada di `docs/`.
- Nilai/skala pasti untuk beberapa field Tracer Study (saat ini input teks bebas, bukan dropdown baku).
- Provider notifikasi email/WhatsApp (tabel `notifications` ada, belum ada pengiriman nyata).
- Pembuatan akun mahasiswa/admin (belum ada halaman signup — asumsinya akun diprovision manual oleh admin lewat Supabase dashboard/SQL untuk sekarang).
- Generate Buku Wisuda (mail merge ke template Google Slides) — menunggu template diterima (PDF §10).
- Provisioning akun pertama (mahasiswa/admin) — belum ada halaman signup, buat manual lewat Supabase Auth dashboard + insert baris `public.users`/`public.students`.
- Isi data master minimal (`periods` aktif, `faculties`, `study_programs`) — tidak ada UI untuk ini, isi manual lewat SQL Editor.
