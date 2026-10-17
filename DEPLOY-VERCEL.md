# Deploy ke Vercel

## Perbaikan konfigurasi
- `vite.config.ts` tidak lagi mendaftarkan plugin `nitro()` secara terpisah. TanStack Start sudah mengelola integrasi servernya sendiri; mendaftarkan Nitro lagi dapat menyebabkan konflik saat build.
- `vercel.json` menetapkan perintah build `npm run build`.

## Langkah deploy
1. Ekstrak ZIP ini, lalu upload folder `TANSTACK_EKRAF-main` ke GitHub.
2. Import repository tersebut di Vercel. Framework Preset: TanStack Start (atau biarkan Auto-detect).
3. Pada **Project → Settings → Environment Variables**, tambahkan:
   - `BETTER_AUTH_URL` = URL deployment Vercel, contoh `https://nama-project.vercel.app`
   - `BETTER_AUTH_SECRET` = secret acak minimal 32 karakter. Buat secret sendiri; jangan gunakan contoh publik atau commit ke Git.
4. Aktifkan variabel untuk Production (dan Preview jika diperlukan), lalu deploy/redeploy.

Jika build tetap gagal, buka **Deployments → deployment gagal → Build Logs**. Kode aplikasi memerlukan `BETTER_AUTH_SECRET` ketika build berjalan dalam mode production; karena itu variabel tersebut perlu tersedia untuk deployment.

## Catatan
Aplikasi ini masih menggunakan penyimpanan in-memory untuk akun, sesi, dan produk. Data bisa hilang saat fungsi serverless dimulai ulang dan tidak cocok untuk data produksi tanpa database persisten.
