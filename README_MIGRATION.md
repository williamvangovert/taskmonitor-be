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
npx prisma generate    # (jalankan prisma db pull sekali untuk verifikasi jika perlu)
npm run dev
```

Server berjalan di `http://127.0.0.1:8000/api` (port 8000 agar cocok dengan `VITE_API_URL` frontend).

## Menguji auth (Tahap 3)

```bash
# Health
curl http://127.0.0.1:8000/api/health

# Login dengan user yang SUDAH ADA di database (password lama tetap berlaku)
curl -X POST http://127.0.0.1:8000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"EMAIL_ANDA","password":"PASSWORD_ANDA"}'
# -> { "user": {...}, "token": "..." }

# Ambil profil dengan token dari langkah sebelumnya
curl http://127.0.0.1:8000/api/me -H 'Authorization: Bearer TOKEN_DISINI'
```

Atau langsung dari frontend: jalankan frontend, buka halaman Login, dan coba login memakai akun yang ada. Password lama tetap bekerja (hash bcrypt Laravel kompatibel).

## Struktur

```
prisma/schema.prisma   # skema DB (terverifikasi via prisma db pull)
src/
  server.ts            # entry point
  app.ts               # Express: CORS, JSON, snake_case output, /api, error handler
  config/env.ts        # environment variable terpusat
  lib/prisma.ts        # Prisma client (BigInt -> number)
  lib/cache.ts         # cache TTL in-memory (untuk dashboard)
  middleware/          # auth (JWT), validate (Zod), errorHandler
  utils/               # jwt, password (bcrypt), case (snake_case), pagination, asyncHandler
  controllers/         # auth.controller
  routes/              # index (+ /health), auth.routes
```

## Catatan penting

- **snake_case:** semua respons otomatis diubah ke snake_case agar cocok dengan output Laravel lama (frontend tidak berubah).
- **Auth:** JWT via header `Authorization: Bearer`. Login/registrasi balas `{ user, token }`. Kredensial salah balas **422** `{ message, errors }` (bukan 401), sesuai Laravel.
- **Password lama tetap valid:** hash `$2y$` dari Laravel dinormalisasi ke `$2b$` untuk verifikasi bcryptjs.
- **`prisma db pull` menghapus `@default(now())`** dari `created_at`. Sudah dikembalikan manual di `schema.prisma`; jika Anda menjalankan db pull lagi, tambahkan kembali.
- **`.env` tidak pernah di-commit** (ada di `.gitignore`).

## Progress tahapan

- [x] **Tahap 0** — Fondasi proyek (Express, TypeScript, health endpoint)
- [x] **Tahap 1** — Skema Prisma (terverifikasi vs database Neon)
- [x] **Tahap 2** — Infra inti (auth JWT, validasi Zod, snake_case, pagination, cache)
- [x] **Tahap 3** — Auth (register, login, logout, me, users)
- [ ] **Tahap 4** — Projects, Enhancements, Timelines, Requirements (+ cascade recalculateProgress)
- [ ] **Tahap 5** — Dashboard (5 endpoint + cache 60 detik)
- [ ] **Tahap 6** — Notifications
- [ ] **Tahap 7** — Scheduler (cron: overdue check, deadline reminder)
- [ ] **Tahap 8** — Uji paritas vs Laravel + konfigurasi deploy
