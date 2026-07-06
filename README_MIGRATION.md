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
# 1. Pasang dependency
npm install

# 2. Siapkan environment
cp .env.example .env
#    lalu isi DATABASE_URL dengan connection string Neon Anda (pakai yang "pooled", sslmode=require)
#    dan isi JWT_SECRET dengan string acak yang panjang.

# 3. Selaraskan Prisma dengan database yang sudah ada (READ-ONLY, aman untuk data)
npx prisma db pull
npx prisma generate

# 4. Jalankan server
npm run dev
```

Server berjalan di `http://127.0.0.1:8000/api` (port 8000 dipilih agar cocok dengan `VITE_API_URL` frontend, sehingga frontend tidak perlu diubah).

Cek kesehatan API: buka `http://127.0.0.1:8000/api/health` → harus membalas `{ "status": "ok" }`.

## Struktur

```
prisma/
  schema.prisma        # skema DB (direkonstruksi dari migration Laravel)
src/
  server.ts            # entry point (start server)
  app.ts               # konfigurasi Express (CORS, JSON, /api, error handler)
  config/env.ts        # akses environment variable terpusat
  lib/prisma.ts        # Prisma client bersama
  middleware/          # error handler (auth JWT menyusul di Tahap 2)
  routes/              # /api/health (route domain menyusul)
```

## Catatan penting

- **`prisma db pull` tidak mengubah data.** Ia hanya membaca struktur tabel yang sudah ada. Setelah dijalankan, bandingkan hasilnya dengan `schema.prisma` ini — keduanya harus setara. (Sebagian atribut seperti `@default(now())`/`@updatedAt` mungkin perlu ditambahkan kembali setelah pull; itu normal.)
- **CORS** kini dikonfigurasi eksplisit (di Laravel otomatis). Tambahkan origin frontend Anda di `CORS_ORIGIN`.
- **BigInt**: primary key `bigint` diserialisasi sebagai angka agar cocok dengan output Laravel lama.
- **Backup database** disarankan sebelum tahap-tahap berikutnya, sebagai pengaman standar.

## Progress tahapan

- [x] **Tahap 0** — Fondasi proyek (Express, TypeScript, config, health endpoint)
- [x] **Tahap 1** — Skema Prisma dari migration Laravel
- [ ] **Tahap 2** — Infra inti (Prisma client, auth JWT, validasi Zod, pagination & cache parity)
- [ ] **Tahap 3** — Auth (register, login, logout, me, users)
- [ ] **Tahap 4** — Projects, Enhancements, Timelines, Requirements (+ cascade recalculateProgress)
- [ ] **Tahap 5** — Dashboard (5 endpoint + cache 60 detik)
- [ ] **Tahap 6** — Notifications
- [ ] **Tahap 7** — Scheduler (cron: overdue check, deadline reminder)
- [ ] **Tahap 8** — Uji paritas vs Laravel + konfigurasi deploy
