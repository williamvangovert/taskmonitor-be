# TaskMonitor Backend — Migrasi Laravel → Express

Branch `migrate-to-express` berisi backend baru berbasis **Node.js + TypeScript + Express + Prisma + JWT**, yang secara bertahap menggantikan backend Laravel. Backend Laravel lama tetap utuh di branch `main`.

Tujuan utama: **menjaga kontrak API tetap identik** (URL, method, bentuk JSON) agar frontend React tidak perlu diubah.

## Stack

| Bagian | Teknologi |
| --- | --- |
| Bahasa | TypeScript |
| Runtime | Node.js |
| Framework | Express |
| ORM | Prisma |
| Auth | JWT (Bearer token) |
| Database | PostgreSQL (Neon) — **sama** dengan yang dipakai Laravel |

## Cara menjalankan (di komputer Anda)

```bash
npm install
cp .env.example .env   # isi DATABASE_URL (Neon, pooled, sslmode=require) + JWT_SECRET
npx prisma generate
npm run dev
```

Server berjalan di `http://127.0.0.1:8000/api` (port 8000 agar cocok dengan `VITE_API_URL` frontend).

## Menguji end-to-end lewat frontend

1. Jalankan backend ini (`npm run dev`) — port 8000.
2. Jalankan frontend secara lokal (`npm run dev` di repo `taskmonitor-fe`) — port 5173.
3. Buka `http://localhost:5173`, login dengan akun yang ada, lalu coba:
   - Halaman **Projects**: lihat daftar, buka detail, buat/edit/hapus project.
   - **Enhancement** & **Timeline**: buat, urutkan (berdasarkan waktu buat), lihat `requirements_count`.
   - **Requirements**: tambah/edit/tandai selesai → progress timeline/enhancement/project ikut terhitung ulang.

> Catatan: **Dashboard** dan **Notifikasi** belum ada sampai Tahap 5–6, jadi halaman itu mungkin masih kosong/error — itu wajar untuk sekarang.

## Endpoint yang sudah tersedia

| Method | Path | Keterangan |
| --- | --- | --- |
| POST | /api/register, /api/login | → { user, token } |
| GET | /api/me, /api/users | perlu Bearer token |
| POST | /api/logout | perlu Bearer token |
| GET/POST | /api/projects | list (paginasi) / buat |
| GET/PUT/DELETE | /api/projects/:id | detail / ubah / hapus |
| … | /api/projects/:projectId/enhancements | CRUD enhancement |
| … | /api/projects/:projectId/timelines | CRUD timeline |
| … | /api/timelines/:timelineId/requirements | CRUD requirement |

## Catatan penting

- **snake_case:** semua respons otomatis diubah ke snake_case agar cocok dengan Laravel (frontend tidak berubah).
- **Progress bertingkat:** perubahan requirement memicu perhitungan ulang progress timeline → enhancement → project (sama seperti Laravel).
- **Password lama valid:** hash `$2y$` Laravel dinormalisasi ke `$2b$` untuk verifikasi.
- **Database sama (Neon):** operasi tulis saat menguji akan memengaruhi data yang sama dengan aplikasi live — gunakan data uji bila perlu.
- **`prisma db pull`** menghapus `@default(now())` dari `created_at`; sudah dikembalikan manual di `schema.prisma`.

## Progress tahapan

- [x] **Tahap 0** — Fondasi proyek
- [x] **Tahap 1** — Skema Prisma (terverifikasi vs Neon)
- [x] **Tahap 2** — Infra inti (auth JWT, Zod, snake_case, pagination, cache)
- [x] **Tahap 3** — Auth (register, login, logout, me, users)
- [x] **Tahap 4** — Projects, Enhancements, Timelines, Requirements (+ progress cascade)
- [ ] **Tahap 5** — Dashboard (5 endpoint + cache 60 detik)
- [ ] **Tahap 6** — Notifications
- [ ] **Tahap 7** — Scheduler (cron: overdue check, deadline reminder)
- [ ] **Tahap 8** — Uji paritas vs Laravel + konfigurasi deploy
