# DATABASE_DESIGN.md — Sigradu (Supabase / PostgreSQL)

Status dokumen: **Rancangan skema — tahap finalisasi database, belum diimplementasikan sebagai migration.**
Disusun berdasarkan seluruh dokumen di `docs/` (REQUIREMENTS, ROLES_PERMISSIONS, STATUS_FLOW, STORAGE_DESIGN, UI_REQUIREMENTS, WORKFLOW, PDF "Rancangan Alur Terintegrasi") dan `CLAUDE.md`.

## Cara membaca dokumen ini

Dua jenis penanda dipakai:

- **Keputusan Desain** — pilihan struktural (nama tabel/kolom, tipe data, normalisasi, enum mana yang dijadikan acuan) yang saya ambil untuk menyelesaikan tugas "finalisasi skema". Ini bukan aturan bisnis baru — disertai alasan, dan bisa Anda override.
- **`OPEN QUESTION`** — parameter atau keputusan bisnis yang **belum ditentukan** di dokumen manapun. Struktur kolom/tabel tetap disiapkan agar tidak menghambat desain, tapi nilai/aturannya menunggu keputusan Anda.

Konvensi umum yang dipakai di semua tabel (tidak diulang di tiap tabel):

- Primary key: `id uuid`, default `gen_random_uuid()`.
- `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()` di semua tabel transaksional (di-refresh via trigger `updated_at`, kecuali tabel log yang immutable seperti `status_histories`, `bypass_logs`, `yudisium_reviews`).
- Semua kolom FK diberi index otomatis.
- Default `ON DELETE RESTRICT` untuk FK, kecuali disebutkan lain (mis. `users` → `auth.users` pakai `CASCADE`).
- Semua tabel milik skema `public`, terhubung ke `auth.users` bawaan Supabase Auth.

---

## 1. Ringkasan Tabel

**16 tabel dari rancangan awal** (`docs/DATABASE_DESIGN.md` versi sebelumnya): `users, students, periods, yudisium_applications, yudisium_documents, yudisium_reviews, employment_status, job_applications, employment_proofs, tracer_studies, graduation_registrations, graduation_payments, graduation_book_data, status_histories, bypass_logs, notifications`.

**4 tabel tambahan** diusulkan untuk memenuhi kebutuhan yang sudah dinyatakan eksplisit di dokumen lain tapi belum punya wadah tabel (lihat justifikasi CLAUDE.md aturan #2 "Do not create new tables without explaining why"):

| Tabel baru | Kenapa dibutuhkan |
|---|---|
| `faculties` | "Admin Fakultas" per-fakultas (ROLES_PERMISSIONS.md), filter "Fakultas" di dashboard (PDF §9a), dan gate persetujuan yudisium per fakultas — butuh entitas fakultas yang stabil, bukan teks bebas. |
| `study_programs` | Threshold Hiring wajib configurable **per program studi** (CLAUDE.md aturan #11, PDF §7-8), dan filter "Program Studi" di semua dashboard (PDF §9a/9b/9c) — butuh entitas prodi yang stabil untuk direferensikan `hiring_thresholds`. |
| `hiring_thresholds` | CLAUDE.md aturan #11 eksplisit: "Hiring threshold must be configurable by admin" dan aturan #13 "Do not hardcode business rules". Perlu tabel konfigurasi agar angka threshold tidak hardcode di kode. |
| `job_vacancies` | Route mahasiswa `/hiring/lowongan` (UI_REQUIREMENTS.md) mengindikasikan ada daftar lowongan yang bisa dilamar dari dalam sistem. `OPEN QUESTION` di bawah — cakupan fitur ini belum eksplisit didokumentasikan, tabel disiapkan dengan desain yang mengakomodasi kemungkinan lowongan eksternal juga. |

Total: **20 tabel**.

---

## 2. Tabel Pendukung / Master Data

### 2.1 `faculties`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| name | text | not null, unique | Nama fakultas |
| code | text | unique, nullable | Kode singkat fakultas |
| created_at | timestamptz | not null default now() | |

Index: unique index bawaan pada `name`, `code`.
RLS: SELECT terbuka untuk semua user terautentikasi (data referensi, dibaca semua role). INSERT/UPDATE/DELETE hanya role admin yang berwenang mengelola master data — `OPEN QUESTION`: role mana yang berwenang mengelola master data fakultas/prodi belum ditentukan (kandidat: role admin umum/superadmin yang juga belum terdefinisi, lihat §9.1).

### 2.2 `study_programs`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| faculty_id | uuid | FK → faculties(id), not null | |
| name | text | not null | Nama program studi |
| code | text | nullable | |
| degree_level | enum `degree_level` | not null | Lihat §3.1 |
| created_at | timestamptz | not null default now() | |

Constraint: `UNIQUE(faculty_id, name)`.
Index: FK `faculty_id`.
RLS: sama dengan `faculties`.

### 2.3 `periods`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| type | enum `period_type` | not null | `yudisium` \| `wisuda` — lihat catatan di bawah |
| name | text | not null | Contoh: "Yudisium Genap 2025/2026" |
| start_date | date | not null | |
| end_date | date | not null | |
| is_active | boolean | not null default true | |
| created_at | timestamptz | not null default now() | |

**`OPEN QUESTION`** (dari audit poin 19): apakah periode Hiring/Tracer punya siklus sendiri (mis. "periode hiring bulan berjalan") atau selalu mengikuti `period_id` yudisium yang sama dengan mahasiswa bersangkutan? PDF §8 sendiri menyebut ini belum ditetapkan ("Periode waktu penghitungan threshold Hiring — misalnya per bulan atau per periode pendaftaran yudisium"). **Keputusan Desain sementara**: `employment_status`, `job_applications` (melalui `employment_status`), dan `tracer_studies` mereferensikan `period_id` yang sama dengan `yudisium_applications` milik mahasiswa tersebut (satu siklus kelulusan = satu `period_id` yudisium dipakai bersama di Modul 1 & 2). Tipe `period_type` hanya membedakan `yudisium` vs `wisuda` karena wisuda punya jadwal sendiri yang independen (bisa beberapa gelombang yudisium masuk ke satu periode wisuda). Ini masih perlu dikonfirmasi.

Index: `(type, is_active)`.
RLS: SELECT terbuka untuk semua user terautentikasi. INSERT/UPDATE hanya admin (role pengelola periode — `OPEN QUESTION` sama seperti §2.1).

### 2.4 `hiring_thresholds`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| period_id | uuid | FK → periods(id), not null | |
| study_program_id | uuid | FK → study_programs(id), nullable | `NULL` = berlaku untuk semua prodi pada periode tsb |
| min_applications | integer | not null, check > 0 | Ambang minimal jumlah lamaran |
| set_by | uuid | FK → users(id), not null | Admin BKK yang menetapkan |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Constraint: `UNIQUE(period_id, study_program_id)`.
Index: `(period_id, study_program_id)`.

`OPEN QUESTION` (PDF §8, poin 1–2, audit poin 1–2): angka minimal lamaran dan granularitas periode penghitungan (per bulan vs per periode yudisium) belum ditetapkan Admin BKK. Struktur tabel sudah siap menampung nilai tersebut begitu diputuskan.

RLS: SELECT untuk mahasiswa (perlu tahu threshold berlaku untuknya) dan admin. INSERT/UPDATE/DELETE hanya `admin_bkk`.

### 2.5 `job_vacancies`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| title | text | not null | |
| company_name | text | not null | |
| description | text | nullable | |
| posted_by | uuid | FK → users(id), nullable | Admin BKK pembuat lowongan |
| is_active | boolean | not null default true | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

`OPEN QUESTION`: tidak ada dokumen yang merinci apakah lowongan Hiring dikelola di dalam Sigradu (Admin BKK input lowongan, mahasiswa pilih dari daftar) atau mahasiswa hanya mencatat lamaran ke lowongan di luar sistem secara bebas. Route mahasiswa `/hiring/lowongan` (UI_REQUIREMENTS.md) mengindikasikan ada listing di dalam sistem, tapi tidak ada detail field/proses posting lowongan. Skema `job_applications` (§5.2) dirancang mengakomodasi kedua kemungkinan (FK ke `job_vacancies` **atau** input teks bebas) sampai ini dipastikan.

Index: `is_active`.
RLS: SELECT terbuka untuk semua mahasiswa & admin BKK. INSERT/UPDATE/DELETE hanya `admin_bkk`.

---

## 3. Enum & Status

### 3.1 Enum non-status (tipe data referensi)

- `degree_level`: `sarjana`, `magister`. `OPEN QUESTION`: apakah perlu `diploma`/`doktor` — tidak disebut di dokumen manapun, PDF hanya menyebut "Sarjana/Magister".
- `user_role`: `mahasiswa`, `kaprodi`, `admin_fakultas`, `admin_bkk`, `admin_keuangan`, `admin_kemahasiswaan`, `admin_wisuda`. Diambil langsung dari ROLES_PERMISSIONS.md + PDF §6, tanpa tambahan. `OPEN QUESTION` (audit): apakah dibutuhkan role tambahan `super_admin`/pengelola sistem untuk mengelola `/admin/settings`, master data fakultas/prodi, dan pembuatan akun admin lain? Tidak ada role ini di dokumen manapun, tapi `/admin/settings` ada di UI_REQUIREMENTS.md tanpa pemilik role yang jelas.
- `period_type`: `yudisium`, `wisuda` (lihat §2.3).
- `document_status` *(dipakai `yudisium_documents`)*: `pending`, `approved`, `revision_needed`.
- `document_type` *(dipakai `yudisium_documents`)*: `ktp`, `kk`, `ijazah`, `dokumen_lain` — mengikuti folder di STORAGE_DESIGN.md. **`OPEN QUESTION`** (audit poin 22): PDF §2 menyebut daftar dokumen lebih panjang ("KTP/KK/Akta/Ijazah/Surat Bebas Perpustakaan/Surat Bebas Laboratorium, dst.") merujuk ke dokumen terpisah "RANCANGAN ALUR YUDISIUM" yang **tidak ada** di folder `D:\sigradu`. Daftar `document_type` final tidak bisa dipastikan sampai dokumen itu diperoleh — enum di atas hanya mencerminkan 4 folder yang sudah ada di STORAGE_DESIGN.md.

### 3.2 Status per modul — rekonsiliasi STATUS_FLOW.md vs PDF

Audit sebelumnya menemukan STATUS_FLOW.md (enum singkat) dan PDF §3c-E/§4c-D (tabel status berbahasa Indonesia, lebih granular) **tidak identik**. Untuk bisa memberikan skema yang bisa dipakai, saya mengambil **Keputusan Desain**: enum kolom database memakai bentuk *machine-readable* (snake_case, konsisten dengan gaya STATUS_FLOW.md), tapi **cakupan nilainya mengikuti granularitas PDF** (lebih lengkap, sudah dipakai sebagai acuan tabel status per modul di UI). Silakan konfirmasi sebelum ini dikunci jadi migration — beri tahu saya bila ada value yang perlu diganti/dihapus/ditambah.

**`yudisium_status`** (tabel `yudisium_applications.status`):
`draft`, `submitted`, `under_review`, `revision`, `approved`, `rejected`
— `approved` = "Lolos Administrasi Yudisium" (PDF), `rejected` = "Tidak Lolos Yudisium" (PDF). Diambil dari STATUS_FLOW.md apa adanya karena PDF §2a tidak memberi label status sedetail itu (hanya 2 keputusan akhir: Lolos/Tidak Lolos).

**`employment_current_status`** (tabel `employment_status.current_status`):
`belum_bekerja`, `sudah_bekerja`, `wirausaha`, `melanjutkan_studi`
— dua nilai terakhir mengikuti PDF §3c-A yang menyebutnya **"disarankan sebagai pengembangan"**, bukan requirement pasti. `OPEN QUESTION` (audit poin 17): apakah `wirausaha`/`melanjutkan_studi` masuk cakupan MVP. Kolom & enum sudah disiapkan agar tidak perlu migration besar bila nanti dikonfirmasi masuk; bila **tidak** masuk cakupan, enum ini tinggal dipangkas jadi `belum_bekerja` / `sudah_bekerja` saja.

**`job_application_status`** (tabel `job_applications.application_status`):
`diproses`, `interview`, `diterima`, `ditolak` — persis PDF §3c-B.

**`employment_proof_status`** (tabel `employment_proofs.status`):
`pending`, `revision_needed`, `verified` — memetakan ke "Menunggu Verifikasi Bukti Kerja" / "Revisi Bukti Kerja" / "Bukti Kerja Terverifikasi" (PDF §3c-E).

**`tracer_status`** (tabel `tracer_studies.status`):
`draft`, `submitted`, `revision`, `approved` — memetakan ke "Menunggu Pengisian" / "Menunggu Verifikasi Tracer & Hiring" / "Revisi Tracer & Hiring" / "Lolos Tracer & Hiring" (PDF §3c-E). Status gabungan Modul 2 ("Lolos Tracer & Hiring") direpresentasikan sebagai `tracer_studies.status = 'approved'` **dan** (kondisi hiring/bukti-kerja terpenuhi — lihat §8 Gating Logic), bukan kolom terpisah, untuk menghindari duplikasi status di dua tempat.

**`graduation_status`** (tabel `graduation_registrations.status`):
`menunggu_kesediaan`, `menunggu_pembayaran`, `menunggu_verifikasi_pembayaran`, `pembayaran_ditolak`, `pembayaran_terverifikasi`, `menunggu_data_buku`, `revisi_data_buku`, `data_buku_lengkap`, `terdaftar_sebagai_wisudawan`, `wisuda_in_absentia` — persis 10 status di PDF §4c-D (lebih lengkap dari STATUS_FLOW.md yang hanya 11 enum berbeda penamaan). Kolom `graduation_registrations.status` ini adalah **status ringkasan/master** dari keseluruhan perjalanan Modul 3 (dipakai untuk kolom "Status Akhir Modul 3" di dashboard PDF §9c); status detail pembayaran & buku wisuda tetap disimpan terpisah di `graduation_payments.status` dan `graduation_book_data.status` (lihat §7) agar riwayat revisi tidak hilang.

**`payment_status`** (tabel `graduation_payments.status`): `pending`, `verified`, `rejected`.

**`book_data_status`** (tabel `graduation_book_data.status`): `pending`, `revision_needed`, `complete`.

**`OPEN QUESTION`** menyeluruh untuk §3.2: semua penamaan di atas adalah usulan saya untuk merekonsiliasi dua sumber yang berbeda — mohon dikonfirmasi sebagai versi final sebelum dijadikan migration, karena mengganti enum setelah data production ada akan lebih mahal daripada mengganti sekarang.

---

## 4. Modul 1 — Yudisium

### 4.1 `users`

Tabel ekstensi dari `auth.users` bawaan Supabase Auth (menyimpan profil + role aplikasi; kredensial login tetap di `auth.users`, tidak diduplikasi).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK, FK → auth.users(id) ON DELETE CASCADE | |
| role | enum `user_role` | not null | Lihat §3.1 |
| full_name | text | not null | |
| email | text | not null, unique | Disalin dari `auth.users.email` saat sign-up untuk kemudahan query/RLS; harus tetap sinkron via trigger. |
| phone_number | text | nullable | "Nomor WhatsApp Aktif" (PDF §5) — dipakai notifikasi. |
| is_active | boolean | not null default true | Nonaktifkan akun tanpa hapus data. |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

**Keputusan Desain**: satu kolom `role` → satu akun = satu role. `OPEN QUESTION` (audit): apakah ada kasus satu orang memegang lebih dari satu role (mis. dosen yang juga Kaprodi dan pembimbing)? Bila ya, desain perlu diubah ke tabel junction `user_roles (user_id, role)` many-to-many. Belum ada indikasi kebutuhan ini di dokumen manapun, jadi desain saat ini memakai kolom tunggal.

Index: `role`, unique `email`.
RLS: SELECT baris sendiri (`auth.uid() = id`) untuk semua role; admin dapat SELECT semua baris user dengan role `mahasiswa` yang relevan dengan modul verifikasinya (detail per modul, lihat §9). UPDATE terbatas ke baris sendiri untuk field non-role (mahasiswa tidak boleh mengubah `role` sendiri — perubahan role hanya lewat service role/admin pengelola akun, `OPEN QUESTION` siapa pemegang wewenang ini, lihat §3.1).

### 4.2 `students`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK → users(id) ON DELETE CASCADE, not null, unique | |
| nim | text | not null, unique | |
| faculty_id | uuid | FK → faculties(id), not null | |
| study_program_id | uuid | FK → study_programs(id), not null | |
| degree_level | enum `degree_level` | not null | Untuk penulisan gelar di Buku Wisuda (PDF §5) |
| thesis_title | text | nullable | "Judul Tugas Akhir" (opsional, referensi tracer — PDF §5) |
| supervisor_name | text | nullable | "Dosen Pembimbing" |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

`OPEN QUESTION` (audit poin 22): field akademik/pribadi/orang tua lengkap untuk Modul 1 (sesuai PDF §2: "data akademik, data pribadi, data orang tua") merujuk ke dokumen "RANCANGAN ALUR YUDISIUM" yang tidak tersedia di folder ini. Tabel `students` di atas hanya memuat field yang **eksplisit disebut dipakai ulang lintas modul** (PDF §5: NIM, nama, prodi, fakultas, gelar, judul TA, dosen pembimbing). Field lain (data pribadi detail, data orang tua, dll.) belum bisa dirancang tanpa dokumen rujukan tersebut — kemungkinan perlu tabel tambahan (`student_personal_data`, `student_parent_data`, dsb.) begitu detail tersedia.

Index: unique `nim`, unique `user_id`, FK `faculty_id`, FK `study_program_id`.
RLS: mahasiswa SELECT/UPDATE hanya baris miliknya (`user_id = auth.uid()`). Semua role admin SELECT (butuh identitas mahasiswa untuk verifikasi lintas modul). INSERT hanya melalui proses pendaftaran (server-side/trigger saat sign-up mahasiswa).

### 4.3 `yudisium_applications`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| student_id | uuid | FK → students(id), not null | |
| period_id | uuid | FK → periods(id) WHERE type='yudisium', not null | |
| status | enum `yudisium_status` | not null default `draft` | |
| submitted_at | timestamptz | nullable | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Constraint: `UNIQUE(student_id, period_id)` — satu pengajuan per mahasiswa per periode.
Index: FK `student_id`, FK `period_id`, `status`.
RLS: mahasiswa SELECT/INSERT/UPDATE (saat `status IN ('draft','revision')`) hanya baris miliknya. `kaprodi` SELECT baris yang `study_program_id` mahasiswanya sesuai penugasan Kaprodi tsb (`OPEN QUESTION`: belum ada tabel/kolom yang memetakan Kaprodi ↔ program studi yang ia tangani — perlu ditambahkan, lihat §9.2). `admin_fakultas` SELECT/UPDATE baris yang `faculty_id` mahasiswanya sesuai fakultas admin tsb (`OPEN QUESTION` sama: belum ada pemetaan admin fakultas ↔ fakultas).

### 4.4 `yudisium_documents`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| application_id | uuid | FK → yudisium_applications(id) ON DELETE CASCADE, not null | |
| document_type | enum `document_type` | not null | Lihat `OPEN QUESTION` §3.1 |
| file_path | text | not null | Path di Supabase Storage, bucket `yudisium/<jenis>/...` |
| file_name | text | not null | |
| file_size_bytes | bigint | nullable | `OPEN QUESTION`: batas ukuran file belum ditentukan (audit poin 10) |
| status | enum `document_status` | not null default `pending` | |
| reviewed_by | uuid | FK → users(id), nullable | |
| notes | text | nullable | |
| uploaded_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Index: FK `application_id`, `document_type`, `status`.
RLS: mahasiswa SELECT/INSERT baris miliknya (melalui join `application_id → yudisium_applications.student_id = auth.uid()`via students). `admin_fakultas` SELECT/UPDATE (verifikasi kelengkapan dokumen).

### 4.5 `yudisium_reviews`

Mencatat setiap keputusan Kaprodi/Admin Fakultas — mendukung siklus revisi berulang dan aturan "sistem tetap mencatat identitas Kaprodi pemberi keputusan dan waktunya sebagai jejak" (PDF §2a) meskipun penilaian dilakukan manual (di luar sistem).

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| application_id | uuid | FK → yudisium_applications(id) ON DELETE CASCADE, not null | |
| reviewer_role | enum(`kaprodi`,`admin_fakultas`) | not null | |
| reviewer_id | uuid | FK → users(id), not null | Identitas Kaprodi/Admin Fakultas pemberi keputusan — **wajib diisi walau proses manual**, sesuai PDF §2a. |
| review_method | enum(`manual`,`digital`) | not null | |
| decision | enum(`lolos`,`tidak_lolos`) | nullable | Diisi untuk tahap Kaprodi & keputusan final Admin Fakultas |
| input_by | uuid | FK → users(id), not null | Siapa yang benar-benar menginput record ini ke sistem (bisa berbeda dari `reviewer_id` saat `review_method = manual`, mis. staf admin menginput hasil rapat prodi). |
| notes | text | nullable | |
| decided_at | timestamptz | not null | Waktu keputusan diambil (bisa berbeda dari `created_at` bila diinput belakangan untuk kasus manual). |
| created_at | timestamptz | not null default now() | |

Tabel ini **immutable** (append-only, tidak ada `updated_at`/UPDATE) — riwayat revisi berarti baris baru, bukan overwrite baris lama.

Index: FK `application_id`, `reviewer_role`.
RLS: `kaprodi` INSERT baris `reviewer_role='kaprodi'` untuk aplikasi dalam lingkup prodinya. `admin_fakultas` INSERT baris `reviewer_role='admin_fakultas'` dan berwenang mengubah `yudisium_applications.status` berdasarkan baris ini. Mahasiswa SELECT baris terkait aplikasinya (read-only, untuk melihat catatan revisi).

---

## 5. Modul 2 — Campus Hiring & Tracer Study

### 5.1 `employment_status`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| student_id | uuid | FK → students(id), not null | |
| period_id | uuid | FK → periods(id), not null | Lihat catatan §2.3 tentang periode Modul 2 |
| current_status | enum `employment_current_status` | not null | Lihat §3.2 |
| declared_at | timestamptz | not null default now() | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Constraint: `UNIQUE(student_id, period_id)`.
Index: FK `student_id`, FK `period_id`.
RLS: mahasiswa SELECT/INSERT/UPDATE baris miliknya. `admin_bkk` SELECT semua (untuk dashboard monitoring PDF §9b).

### 5.2 `job_applications`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| employment_status_id | uuid | FK → employment_status(id) ON DELETE CASCADE, not null | |
| vacancy_id | uuid | FK → job_vacancies(id), nullable | Diisi jika melamar lowongan dari dalam sistem |
| vacancy_name_external | text | nullable | Fallback nama lowongan bila di luar sistem — lihat `OPEN QUESTION` §2.5 |
| applied_at | date | not null | "Tanggal Melamar" |
| application_status | enum `job_application_status` | not null default `diproses` | |
| proof_file_path | text | nullable | Bukti lamaran/screenshot, bucket `hiring/bukti-lamaran/` |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Constraint: `CHECK (vacancy_id IS NOT NULL OR vacancy_name_external IS NOT NULL)` — salah satu wajib terisi.
**Jumlah Total Lamaran Terkirim** (PDF §3c-B) dihitung via `COUNT(*)` per `employment_status_id`, dibandingkan ke `hiring_thresholds.min_applications` — **tidak** disimpan sebagai kolom counter terpisah, untuk menghindari data yang bisa tidak sinkron.

Index: FK `employment_status_id`, FK `vacancy_id`, `applied_at`.
RLS: mahasiswa SELECT/INSERT/UPDATE baris miliknya (melalui join ke `employment_status`). `admin_bkk` SELECT semua.

### 5.3 `employment_proofs`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| employment_status_id | uuid | FK → employment_status(id) ON DELETE CASCADE, not null | |
| company_name | text | not null | |
| business_field | text | nullable | "Bidang Usaha" |
| position | text | nullable | "Jabatan" |
| start_date | date | nullable | "Tanggal Mulai Kerja" |
| proof_type | enum(`surat_keterangan_kerja`,`kontrak_kerja`,`sk_pengangkatan`,`slip_gaji`,`lainnya`) | not null | |
| file_path | text | not null | bucket `hiring/bukti-kerja/` |
| status | enum `employment_proof_status` | not null default `pending` | |
| reviewed_by | uuid | FK → users(id), nullable | |
| reviewed_at | timestamptz | nullable | |
| notes | text | nullable | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Index: FK `employment_status_id`, `status`.
RLS: mahasiswa SELECT/INSERT baris miliknya. `admin_bkk` SELECT/UPDATE semua (verifikasi).

### 5.4 `tracer_studies`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| student_id | uuid | FK → students(id), not null | |
| period_id | uuid | FK → periods(id), not null | |
| current_condition | enum(`bekerja`,`wirausaha`,`melanjutkan_studi`,`belum_bekerja`) | not null | |
| waiting_time_months | integer | nullable | "Waktu Tunggu Mendapat Pekerjaan Pertama" — `OPEN QUESTION` format belum ditentukan (angka bulan? kategori rentang?) |
| job_acquisition_method | text | nullable | "Cara Memperoleh Pekerjaan" — `OPEN QUESTION` apakah free text atau daftar pilihan tetap (biasanya tracer study BAN-PT punya kategori baku) |
| field_relevance | text | nullable | "Kesesuaian Bidang Pekerjaan dgn Prodi" — `OPEN QUESTION` skala/opsi belum ditentukan |
| competency_usage_level | text | nullable | "Tingkat Penggunaan Kompetensi" — `OPEN QUESTION` skala (mis. Likert 1–5) belum ditentukan |
| salary_range | text | nullable | "Rentang Gaji/Pendapatan Pertama" — `OPEN QUESTION` bracket nominal belum ditentukan |
| company_name | text | nullable | Auto-fill dari `employment_proofs` bila tersedia (PDF §3c-D) |
| suggestions | text | nullable | "Saran/Masukan untuk Program Studi" |
| status | enum `tracer_status` | not null default `draft` | |
| reviewed_by | uuid | FK → users(id), nullable | |
| reviewed_at | timestamptz | nullable | |
| review_notes | text | nullable | |
| submitted_at | timestamptz | nullable | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Constraint: `UNIQUE(student_id, period_id)`.

`OPEN QUESTION` besar untuk tabel ini: PDF sendiri menyatakan field Form Tracer Study "mengikuti pola standar tracer study yang umum dipakai untuk pelaporan akreditasi (Kemdikbud/BAN-PT) — dapat disesuaikan saat detail teknis dirancang". Artinya tipe data `text` di atas untuk `waiting_time_months` (harusnya `integer` tapi bisa jadi kategori), `job_acquisition_method`, `field_relevance`, `competency_usage_level`, `salary_range` adalah **placeholder**, bukan final — nilai domain (pilihan dropdown, skala, satuan) perlu diambil dari format tracer study BAN-PT resmi yang dipakai kampus, dan belum ada di dokumen manapun di folder ini.

Index: FK `student_id`, FK `period_id`, `status`.
RLS: mahasiswa SELECT/INSERT/UPDATE baris miliknya (saat `status IN ('draft','revision')`). `admin_bkk` SELECT/UPDATE semua.

### 5.5 `bypass_logs`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| employment_status_id | uuid | FK → employment_status(id), not null | Target bypass |
| scope | enum(`hiring_threshold`) | not null default `hiring_threshold` | Extensible bila nanti ada jenis bypass lain — saat ini hanya satu jenis yang terdokumentasi (PDF §9b) |
| bypassed_by | uuid | FK → users(id), not null | Admin BKK pelaku |
| reason | text | not null | Wajib diisi (CLAUDE.md aturan #12) |
| bypassed_at | timestamptz | not null default now() | |

Tabel ini **immutable** (append-only, log audit). Setelah insert, `employment_status`-nya dianggap "Syarat Hiring Dilewati (Bypass Admin)" — direpresentasikan sebagai **kondisi turunan** (`EXISTS` baris di `bypass_logs` untuk `employment_status_id` tsb), bukan kolom status tambahan di `employment_status`, agar satu sumber kebenaran (riwayat bypass selalu di tabel ini).

Index: FK `employment_status_id`, FK `bypassed_by`.
RLS: `admin_bkk` INSERT/SELECT. Mahasiswa SELECT baris terkait dirinya (read-only, transparansi).

`OPEN QUESTION`: CLAUDE.md aturan #12 berbunyi umum ("Admin bypass must always record..."), sedangkan cakupan bypass yang terdokumentasi hanya untuk syarat Hiring (PDF §9b eksplisit: "cakupan bypass terbatas pada syarat threshold Hiring/bukti kerja; Form Tracer Study tetap wajib"). Apakah bypass akan dibutuhkan di modul lain (mis. syarat dokumen Yudisium, syarat pembayaran Wisuda) di masa depan — belum ada indikasi, kolom `scope` disiapkan sebagai enum agar mudah diperluas tanpa migrasi ulang skema besar, tapi nilai lain belum ditambahkan karena belum ada requirement.

---

## 6. Modul 3 — Wisuda

### 6.1 `graduation_registrations`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| student_id | uuid | FK → students(id), not null | |
| period_id | uuid | FK → periods(id) WHERE type='wisuda', not null | |
| attendance_choice | enum(`hadir`,`in_absentia`) | nullable | "Kesediaan Mengikuti Wisuda" |
| attendance_notes | text | nullable | Catatan/alasan, khusus `in_absentia` (opsional) |
| status | enum `graduation_status` | not null default `menunggu_kesediaan` | Status ringkasan Modul 3 — lihat §3.2 |
| final_status_set_by | uuid | FK → users(id), nullable | Admin Wisuda pada verifikasi akhir |
| final_status_at | timestamptz | nullable | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

Constraint: `UNIQUE(student_id, period_id)`.
Index: FK `student_id`, FK `period_id`, `status`.
RLS: mahasiswa SELECT/INSERT/UPDATE baris miliknya (field `attendance_choice`, saat status masih di tahap awal). `admin_wisuda` SELECT/UPDATE semua (verifikasi akhir). `admin_keuangan`, `admin_kemahasiswaan` SELECT semua (butuh konteks untuk verifikasi sub-tabelnya).

### 6.2 `graduation_payments`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| registration_id | uuid | FK → graduation_registrations(id) ON DELETE CASCADE, not null | |
| amount | numeric(12,2) | not null | `OPEN QUESTION`: nominal resmi belum ditetapkan (PDF §8) — apakah fixed atau bervariasi per prodi/jenjang juga belum jelas |
| payment_date | date | not null | |
| payment_method | text | nullable | `OPEN QUESTION`: metode bayar yang berlaku (transfer manual / virtual account / payment gateway) belum ditetapkan (PDF §8, audit poin 20) |
| proof_file_path | text | not null | bucket `wisuda/pembayaran/` |
| status | enum `payment_status` | not null default `pending` | |
| verified_by | uuid | FK → users(id), nullable | Admin Keuangan |
| verified_at | timestamptz | nullable | |
| rejection_reason | text | nullable | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

**Keputusan Desain**: tabel ini **bisa berisi banyak baris per `registration_id`** (bukan 1:1) untuk menampung siklus "Pembayaran Ditolak → Upload Ulang" (PDF §4a) sebagai baris baru, bukan overwrite — riwayat penolakan tetap tersimpan untuk audit. Baris terbaru (`ORDER BY created_at DESC LIMIT 1`) mencerminkan status bukti bayar aktif.

Index: `(registration_id, created_at DESC)`, `status`.
RLS: mahasiswa SELECT/INSERT baris miliknya (melalui join ke `graduation_registrations`). `admin_keuangan` SELECT/UPDATE semua.

### 6.3 `graduation_book_data`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| registration_id | uuid | FK → graduation_registrations(id) ON DELETE CASCADE, not null, unique | Hanya berlaku untuk `attendance_choice = 'hadir'` |
| photo_file_path | text | not null | bucket `wisuda/foto/` |
| print_full_name | text | not null | Snapshot nama untuk cetak (diisi otomatis dari `students`/`users` saat submit, disimpan terpisah agar tidak berubah jika data induk diedit belakangan) |
| print_degree | text | not null | Snapshot gelar untuk cetak |
| cap_gown_size | text | nullable | "Ukuran Toga/Topi" — `OPEN QUESTION`: opsi ukuran yang tersedia dari kampus belum ditentukan |
| quote_text | text | nullable | Kutipan/quote wisuda (opsional) |
| status | enum `book_data_status` | not null default `pending` | |
| reviewed_by | uuid | FK → users(id), nullable | Admin Kemahasiswaan |
| reviewed_at | timestamptz | nullable | |
| review_notes | text | nullable | |
| created_at | timestamptz | not null default now() | |
| updated_at | timestamptz | not null default now() | |

`OPEN QUESTION` (PDF §10a, audit poin 21): field tambahan untuk Buku Wisuda (predikat kelulusan, IPK, dll.) menyesuaikan template Google Slides yang **belum diterima**. Kolom di atas hanya mencakup field yang eksplisit disebut PDF §4c-C. Kemungkinan besar perlu `ALTER TABLE` menambah kolom begitu template diterima dan field-mapping (PDF §10b) dipetakan.

`OPEN QUESTION` (PDF §8, audit poin 5): apakah wisudawan `wisuda_in_absentia` tetap dianggap perlu mengisi `graduation_book_data`, atau field ini benar-benar hanya untuk `hadir` — memengaruhi apakah kolom sumber data mail merge Buku Wisuda (§10a) mengambil dari sini saja atau perlu fallback data untuk in-absentia juga.

Index: unique `registration_id`.
RLS: mahasiswa SELECT/INSERT/UPDATE baris miliknya. `admin_kemahasiswaan` SELECT/UPDATE semua. `admin_wisuda` SELECT semua (untuk generate buku wisuda).

---

## 7. Tabel Lintas-Modul

### 7.1 `status_histories`

Memenuhi CLAUDE.md aturan #10: "Every important status change must create a status history record."

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| student_id | uuid | FK → students(id), not null | Untuk filter cepat "riwayat status mahasiswa X" |
| module | enum(`yudisium`,`hiring_tracer`,`wisuda`) | not null | |
| source_table | text | not null | Nama tabel sumber perubahan, mis. `yudisium_applications`, `tracer_studies`, `employment_proofs`, `graduation_registrations`, `graduation_payments`, `graduation_book_data` |
| source_id | uuid | not null | id baris sumber |
| old_status | text | nullable | |
| new_status | text | not null | |
| changed_by | uuid | FK → users(id), nullable | `NULL` jika perubahan otomatis sistem |
| reason | text | nullable | |
| changed_at | timestamptz | not null default now() | |

**Keputusan Desain**: `source_table` + `source_id` dipakai (bukan FK langsung ke tiap tabel modul) karena satu modul (terutama Modul 2 dan 3) punya beberapa tabel sumber status berbeda (`tracer_studies`, `employment_proofs`, `job_applications`, `graduation_payments`, `graduation_book_data`, dll.) — FK langsung per tabel akan membuat banyak kolom nullable yang saling eksklusif. Trade-off: tidak ada foreign-key integrity dari `source_id` (pola umum untuk tabel audit-log), diterima karena tabel ini murni pencatatan, bukan sumber kebenaran transaksional.

Tabel ini **immutable** (append-only, tidak ada UPDATE/DELETE).

Index: `(student_id, changed_at DESC)`, `(source_table, source_id)`, `module`.
RLS: SELECT untuk mahasiswa (baris miliknya, read-only — PDF §9b menyarankan log bypass "selalu terlihat di riwayat status mahasiswa"). Semua role admin SELECT (audit). INSERT hanya lewat service-role/trigger server-side (mahasiswa dan admin tidak insert manual — dijamin trigger `AFTER UPDATE` di tabel-tabel sumber, bukan aplikasi yang menulis manual, supaya konsisten).

`OPEN QUESTION`: apakah riwayat status ini perlu ditampilkan ke mahasiswa di UI (mis. halaman `/yudisium/status`), atau hanya dipakai internal admin untuk audit — tidak dijelaskan di UI_REQUIREMENTS.md (audit poin 14).

### 7.2 `notifications`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | uuid | PK | |
| user_id | uuid | FK → users(id), not null | Penerima |
| title | text | not null | |
| message | text | not null | |
| channel | enum(`in_app`,`email`,`whatsapp`) | not null | `OPEN QUESTION`: channel mana yang benar-benar diimplementasikan (audit poin 13) |
| related_module | enum(`yudisium`,`hiring_tracer`,`wisuda`,`general`) | nullable | |
| is_read | boolean | not null default false | |
| sent_at | timestamptz | nullable | Kapan benar-benar terkirim via channel (berbeda dari `created_at`) |
| created_at | timestamptz | not null default now() | |

`OPEN QUESTION` (audit poin 13): provider WhatsApp/email belum ditentukan, begitu juga daftar event pemicu notifikasi per modul (PDF §7 hanya menyebut "Notifikasi email/WhatsApp otomatis setiap kali status berubah" sebagai rekomendasi, bukan spesifikasi trigger per event).

Index: `(user_id, is_read)`, `created_at`.
RLS: setiap user SELECT/UPDATE (`is_read`) hanya baris miliknya (`user_id = auth.uid()`). INSERT hanya service-role (server-side saat status berubah).

---

## 8. Gating Logic (Query-Level, Bukan Tabel Tersendiri)

CLAUDE.md aturan #7–8 mewajibkan gating Modul 2 dan Modul 3 dilakukan sistem, bukan pilihan mahasiswa. Ini **tidak** disimpan sebagai kolom denormalized (mis. `students.can_access_module_2`) supaya tidak ada risiko data usang — dicek langsung tiap request di route protection (server-side):

- **Akses Modul 2 terbuka** jika `EXISTS (SELECT 1 FROM yudisium_applications WHERE student_id = X AND status = 'approved')`.
- **Akses Modul 3 terbuka** jika `EXISTS (SELECT 1 FROM tracer_studies WHERE student_id = X AND status = 'approved')` **dan** kondisi hiring/bukti-kerja mahasiswa tsb terpenuhi (`employment_status.current_status = 'sudah_bekerja'` dengan `employment_proofs.status = 'verified'` terkini, **atau** `belum_bekerja` dengan jumlah `job_applications` mencapai `hiring_thresholds.min_applications` yang berlaku, **atau** ada baris `bypass_logs` untuk `employment_status_id` tsb).

Ini adalah catatan implementasi untuk fase coding nanti (belum dieksekusi sekarang, sesuai instruksi "jangan coding dulu") — dicantumkan di sini karena logikanya bergantung langsung pada skema yang baru dirancang.

---

## 9. Kebutuhan RLS — Ringkasan & Celah yang Perlu Diisi

### 9.1 Prinsip umum

- Semua tabel **wajib RLS ON** (CLAUDE.md aturan #4 — "Do not bypass RLS").
- Mahasiswa: akses baris miliknya sendiri saja, ditentukan lewat rantai `auth.uid() → users.id → students.user_id` lalu FK ke tabel anak.
- Admin per modul: akses dibatasi ke tabel-tabel modul yang jadi tanggung jawabnya (lihat PDF §6 & ROLES_PERMISSIONS.md) — bukan akses penuh ke semua tabel.
- Service role (bukan `anon`/`authenticated`) dipakai hanya di server-side (Next.js server actions/route handlers), tidak pernah ke client (CLAUDE.md aturan #5) — dipakai untuk operasi lintas-tabel seperti gating check, generate buku wisuda, trigger notifikasi.

### 9.2 `OPEN QUESTION` yang memblokir RLS presisi

Beberapa kebijakan RLS di atas ditulis secara prinsip ("admin fakultas akses baris fakultasnya"), tapi **implementasinya butuh data pemetaan yang belum ada di skema manapun**:

1. **Kaprodi ↔ Program Studi**: tidak ada tabel yang memetakan seorang user `kaprodi` menangani prodi yang mana. Tanpa ini, RLS `yudisium_applications`/`yudisium_reviews` untuk role Kaprodi tidak bisa dibatasi per-prodi secara otomatis (hanya bisa "semua Kaprodi lihat semua aplikasi", yang kemungkinan bukan yang diinginkan). Perlu tabel tambahan, misal `kaprodi_assignments (user_id, study_program_id)`, tapi ini saya tidak buat sendiri karena tidak ada indikasi kebutuhan spesifiknya (satu Kaprodi bisa menangani banyak prodi? satu prodi punya banyak Kaprodi paralel?).
2. **Admin Fakultas ↔ Fakultas**: sama seperti di atas, untuk role `admin_fakultas` — apakah satu akun admin fakultas hanya menangani satu fakultas tertentu, atau semua admin fakultas melihat semua fakultas.
3. **Role pengelola master data & `/admin/settings`**: siapa yang berwenang CRUD `faculties`, `study_programs`, `hiring_thresholds`, `periods`, dan mengelola akun/role user lain — tidak ada role ini di ROLES_PERMISSIONS.md (lihat juga `OPEN QUESTION` `super_admin` di §3.1).

Sampai tiga hal ini dijawab, RLS policy untuk tabel Modul 1 (khususnya `yudisium_applications`, `yudisium_reviews`, `yudisium_documents`) hanya bisa dirancang di level "seluruh admin_fakultas/kaprodi vs seluruh data", bukan dibatasi per fakultas/prodi seperti yang diisyaratkan alur bisnisnya.

---

## 10. Index — Daftar Konsolidasi

Selain index per-tabel yang sudah disebut di atas, berikut ringkasan index yang penting untuk performa query dashboard (PDF §9a/9b/9c menyaring berdasarkan Periode, Fakultas, Prodi, Status):

| Tabel | Index |
|---|---|
| `students` | `nim` (unique), `user_id` (unique), `faculty_id`, `study_program_id` |
| `yudisium_applications` | `(student_id, period_id)` unique, `status`, `period_id` |
| `yudisium_documents` | `application_id`, `status` |
| `yudisium_reviews` | `application_id`, `reviewer_role` |
| `employment_status` | `(student_id, period_id)` unique |
| `job_applications` | `employment_status_id`, `applied_at` |
| `employment_proofs` | `employment_status_id`, `status` |
| `tracer_studies` | `(student_id, period_id)` unique, `status` |
| `hiring_thresholds` | `(period_id, study_program_id)` unique |
| `bypass_logs` | `employment_status_id` |
| `graduation_registrations` | `(student_id, period_id)` unique, `status`, `period_id` |
| `graduation_payments` | `(registration_id, created_at DESC)`, `status` |
| `graduation_book_data` | `registration_id` (unique) |
| `status_histories` | `(student_id, changed_at DESC)`, `(source_table, source_id)` |
| `notifications` | `(user_id, is_read)` |

---

## 11. Rangkuman `OPEN QUESTION` (dari dokumen ini)

Konsolidasi seluruh penanda `OPEN QUESTION` di atas, ditambah nomor referensi ke `OPEN QUESTION` audit sebelumnya bila terkait:

1. Dokumen rujukan "RANCANGAN ALUR YUDISIUM" (field akademik/pribadi/orang tua Modul 1, daftar lengkap jenis dokumen) — tidak ada di folder ini. *(≈ audit #22)*
2. Angka & granularitas periode threshold minimal lamaran Hiring. *(audit #1–2)*
3. Apakah `wirausaha`/`melanjutkan_studi` masuk cakupan status pekerjaan MVP. *(audit #17)*
4. Model lowongan Hiring: dikelola di dalam sistem (`job_vacancies`) atau sepenuhnya eksternal.
5. Domain nilai/skala tiap field Form Tracer Study (waktu tunggu, cara memperoleh kerja, kesesuaian bidang, tingkat kompetensi, rentang gaji) — menunggu format tracer study BAN-PT resmi kampus.
6. Batas ukuran & tipe file upload untuk semua dokumen (Yudisium, bukti hiring/kerja, pembayaran, foto). *(audit #10)*
7. Ketentuan teknis foto formal Buku Wisuda (resolusi, dress code, dll.). *(audit #10, PDF §8)*
8. Nominal & metode pembayaran wisuda yang berlaku. *(audit #20, PDF §8)*
9. Apakah "Wisuda In Absentia" tetap masuk Buku Wisuda. *(PDF §8, audit #5)*
10. Field tambahan Buku Wisuda menunggu template Google Slides. *(audit #21)*
11. Channel & provider notifikasi (email/WhatsApp), serta daftar event pemicu. *(audit #13)*
12. Apakah `status_histories` ditampilkan ke mahasiswa atau admin-only. *(audit #14)*
13. Konfirmasi mapping enum status hasil rekonsiliasi STATUS_FLOW.md vs PDF (§3.2 di atas) sebagai versi final.
14. Kebutuhan role `super_admin`/pengelola sistem untuk master data & pengelolaan akun.
15. Apakah satu akun bisa memegang lebih dari satu role (`users.role` tunggal vs many-to-many).
16. Pemetaan Kaprodi ↔ Program Studi dan Admin Fakultas ↔ Fakultas (dibutuhkan untuk RLS presisi).
17. Relasi periode Modul 2 (Hiring/Tracer) terhadap periode Yudisium — dipakai bersama atau siklus sendiri. *(audit #19)*
18. Ukuran Toga/Topi: opsi yang tersedia dari kampus.

Struktur tabel di dokumen ini **tidak menunggu** jawaban-jawaban di atas untuk mulai didiskusikan/direvisi — tapi migration pertama sebaiknya menunggu poin-poin yang memengaruhi bentuk kolom (terutama #1, #3, #4, #5, #13, #15, #16) agar tidak perlu banyak `ALTER TABLE` di awal.

---

*Belum ada migration yang dijalankan. Dokumen ini murni rancangan menunggu konfirmasi Anda.*
