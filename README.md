# EKRAF Workspace

Dashboard administrasi privat untuk mengelola katalog produk dan akun pengguna. Pengunjung yang membuka `/` akan diarahkan ke halaman login terlebih dahulu; setelah login berhasil, aplikasi membuka dashboard. Dibangun dengan TanStack Start, React, Better Auth, TanStack Query, Tailwind CSS, dan komponen UI yang sudah tersedia di proyek.

## Menjalankan proyek

```bash
bun install
cp .env.example .env.local
# Isi BETTER_AUTH_URL dan BETTER_AUTH_SECRET pada .env.local
bun dev
```

Buka `http://localhost:3000/setup`, lalu pilih **Siapkan Akun Administrator**. Jika katalog kosong, proses setup juga mengisi empat produk contoh bertema produk kreatif lokal (ulos, kopi, kerajinan kayu, dan tas anyaman). Setelah itu masuk lewat `/login` menggunakan akun awal:

- Email: `admin@example.com`
- Password: `admin12345`

Segera ganti kredensial awal sebelum aplikasi dipakai pada lingkungan bersama. Seed bersifat idempoten: pemanggilan ulang tidak membuat akun admin duplikat.

## Fitur utama

- Dashboard privat dengan ringkasan produk, total stok, nilai persediaan dalam Rupiah, daftar produk terbaru, dan pintasan pengelolaan.
- Login dan pendaftaran dengan Better Auth, rate limit login, dan pengaturan cookie sesi. Saat pendaftaran, password harus minimal 8 karakter, diawali huruf besar, mengandung titik (`.`), angka, serta dikonfirmasi ulang.
- CRUD produk untuk administrator melalui modal tambah/edit, termasuk pencarian, pengurutan, stok, harga, dan gambar produk.
- Unggah gambar yang otomatis dioptimalkan ke maksimal 512 px; URL gambar HTTPS juga dapat digunakan dan diperiksa dari sisi klien.
- Manajemen pengguna dengan modal perubahan peran, pencarian, status akun, dan konfirmasi penghapusan; proteksi mencegah admin menghapus atau menurunkan peran dirinya sendiri serta mencegah hilangnya admin terakhir.
- Tema terang/gelap/otomatis dan layout responsif untuk layar kecil.

## Catatan data

Sesuai rancangan tugas, penyimpanan tetap menggunakan adapter in-memory. Data akun, sesi, peran, dan produk dapat hilang ketika proses server berhenti atau dimulai ulang. Ini bukan penyimpanan persisten untuk produksi.

## Pemeriksaan sebelum submit

```bash
bun run lint
bun run build
bunx tsr generate
```

Baca `CHEATSHEET.md` untuk rincian tugas dan `NOTES.md` untuk ringkasan perbaikan serta penjelasan keamanan.


## Deploy ke Vercel (wajib)

Di Vercel buka **Project → Settings → Environment Variables** lalu tambahkan variabel untuk **Production** (dan Preview bila diperlukan):

- `BETTER_AUTH_URL` = URL domain deployment, misalnya `https://tanstack-ekraf-two.vercel.app`
- `BETTER_AUTH_SECRET` = secret acak kuat, minimal 32 karakter. Buat dengan `bun -e \"console.log(crypto.randomUUID()+crypto.randomUUID())\"` atau generator secret tepercaya. Jangan gunakan contoh publik dan jangan commit nilai ini ke GitHub.

Setelah menyimpan variabel, buka **Deployments** dan lakukan **Redeploy**. Perubahan Environment Variables tidak berlaku pada deployment yang sudah berjalan sampai deployment baru dibuat. Jika masih muncul error, periksa Runtime Logs.

**Penting untuk produksi:** aplikasi ini masih memakai adapter in-memory untuk akun, sesi, role, dan produk. Pada Vercel serverless data bisa hilang saat cold start atau berpindah instance. Untuk penggunaan nyata, migrasikan ke database persisten sebelum mengandalkan login/katalog produksi.


## Akses anggota dan keamanan password

Semua akun yang berhasil login dapat melihat katalog dan menambah, mengedit, atau menghapus produk. Manajemen akun dan perubahan peran tetap dibatasi untuk administrator. Saat pendaftaran, password divalidasi di sisi server: minimal 8 karakter, karakter pertama huruf besar, mengandung titik (.) dan setidaknya satu angka. Contoh format: `Ekraf.2026` (gunakan password unik milik sendiri).
