# TANSTACK_EKRAF — Paket Final Perbaikan

Paket ini menggabungkan revisi UI, dashboard, katalog produk, form tambah/edit produk, validasi input, proteksi operasi server, setup administrator, dan perbaikan redirect login.

## Menjalankan lokal

1. Ekstrak ZIP ke folder baru.
2. Jalankan `bun install`.
3. Salin `.env.example` menjadi `.env.local`.
4. Atur `BETTER_AUTH_URL` sesuai port yang digunakan. Jika terminal menunjukkan `localhost:3001`, gunakan `http://localhost:3001`.
5. Buat `BETTER_AUTH_SECRET` acak dan rahasia; jangan commit `.env.local` ke Git.
6. Jalankan `bun dev`.
7. Buka `/setup` dan tekan **Siapkan Akun Administrator**, lalu login di `/login`.

Kredensial seed pengembangan yang ditampilkan oleh aplikasi: `admin@example.com` / `Ekraf.2026`. Ganti password sebelum penggunaan nyata.

## Deployment Vercel

Tambahkan `BETTER_AUTH_URL=https://<domain-vercel-anda>` dan `BETTER_AUTH_SECRET=<secret-acak-rahasia>` di Project Settings → Environment Variables untuk Production, Preview jika perlu, lalu redeploy.

## Perubahan utama

- Login tidak lagi otomatis mengarahkan sesi yang mungkin stale ke dashboard. Halaman terlindungi memeriksa sesi server; ini mencegah redirect loop `/login` ↔ `/dashboard`.
- Dashboard, produk, dan manajemen pengguna tetap tersedia dengan proteksi server-side untuk operasi sensitif.
- Katalog demo memuat produk contoh saat proses server dimulai dan setup dapat menambahkan produk yang belum ada.
- Form produk mendukung gambar, validasi, pencarian, urutan, edit dan hapus.
- Login tetap satu alur admin; setup disediakan untuk inisialisasi akun administrator.

## Batasan penting

Proyek mengikuti cheatsheet yang menggunakan adapter dan data in-memory. Data akun, sesi, peran, dan produk akan hilang saat proses server restart dan tidak konsisten di antara instance serverless Vercel. Untuk deployment produksi yang stabil, gunakan database persisten dan adapter Better Auth yang sesuai. Jangan membuka `/setup` untuk umum di production.

## Pengujian

Jalankan `bun run lint`, `bun run build`, dan `bunx tsr generate` pada lingkungan dengan dependensi terpasang. Paket ini tidak boleh dianggap lolos build penuh sebelum perintah tersebut berhasil dijalankan.
