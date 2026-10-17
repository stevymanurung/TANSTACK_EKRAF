import { createServerFn } from "@tanstack/react-start";

import { auth } from "@/lib/auth";
import { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, db } from "@/lib/db";
import { getCurrentSession } from "@/lib/session";

/**
 * Server-only session lookup. Safe to call from TanStack Router `beforeLoad`
 * (which runs on the client during client navigation) because server
 * functions always execute on the server.
 */
export const getServerSession = createServerFn({ method: "GET" }).handler(async () => {
	return getCurrentSession();
});

/**
 * One-time development seed: creates the administrator account (password
 * hashed by Better Auth) and seeds sample products. Idempotent.
 *
 * Called from the client via `useServerFn(seedAdmin)` on the /setup page.
 */
export const seedAdmin = createServerFn({ method: "POST" }).handler(async () => {
	// If the seed email already exists, promote that account instead of trying
	// to register a duplicate email (which would make setup fail).
	let adminUser = db.user.find((u) => u.email.toLowerCase() === SEED_ADMIN_EMAIL.toLowerCase());
	let createdAdmin = false;
	if (!adminUser) {
		try {
			await auth.api.signUpEmail({
				body: {
					email: SEED_ADMIN_EMAIL,
					password: SEED_ADMIN_PASSWORD,
					name: "Administrator",
				},
				headers: new Headers(),
			});
		} catch (error) {
			// Re-read below in case the adapter created the user before an error.
			adminUser = db.user.find((u) => u.email.toLowerCase() === SEED_ADMIN_EMAIL.toLowerCase());
			if (!adminUser) throw error;
		}
		adminUser = db.user.find((u) => u.email.toLowerCase() === SEED_ADMIN_EMAIL.toLowerCase());
		createdAdmin = Boolean(adminUser);
	}
	if (!adminUser) throw new Error("Akun administrator belum berhasil dibuat. Periksa konfigurasi Better Auth lalu coba lagi.");
	const existingRole = db.userRole.find((r) => r.userId === adminUser!.id);
	if (existingRole) existingRole.role = "admin";
	else db.userRole.push({ userId: adminUser.id, role: "admin" });

	// Seed missing sample products without overwriting products already managed by the admin.
	const now = new Date().toISOString();
	const sampleProducts = [
		{ name: "Ulos Ragi Hotang", description: "Kain tenun tradisional dengan motif khas Batak, cocok sebagai koleksi budaya dan hadiah premium.", imageUrl: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80", price: 450000, stock: 12 },
		{ name: "Kopi Arabika Toba", description: "Kopi arabika pilihan dari dataran tinggi sekitar Danau Toba dengan aroma khas dan cita rasa seimbang.", imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80", price: 85000, stock: 28 },
		{ name: "Kerajinan Kayu Lokal", description: "Dekorasi buatan pengrajin lokal dengan material kayu dan sentuhan desain minimalis.", imageUrl: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80", price: 175000, stock: 7 },
		{ name: "Tas Anyaman Handmade", description: "Tas anyaman bergaya kontemporer yang memadukan fungsi sehari-hari dan keterampilan kriya.", imageUrl: "https://images.unsplash.com/photo-1590879860931-6bcae5f4b8e4?auto=format&fit=crop&w=900&q=80", price: 125000, stock: 3 },
		{ name: "Mug Ilustrasi Danau Toba", description: "Mug keramik dengan ilustrasi lanskap Danau Toba, cocok untuk suvenir dan hadiah.", imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558f?auto=format&fit=crop&w=900&q=80", price: 65000, stock: 18 },
		{ name: "Lilin Aromaterapi Pinus", description: "Lilin dekoratif beraroma segar untuk menghadirkan suasana rileks di rumah.", imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80", price: 78000, stock: 14 },
		{ name: "Dompet Tenun Mini", description: "Dompet kecil praktis dengan aksen kain tenun yang mengangkat karya kriya lokal.", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80", price: 95000, stock: 9 },
		{ name: "Poster Peta Sumatera Utara", description: "Poster dekoratif bertema geografis untuk mempercantik ruang kerja atau ruang keluarga.", imageUrl: "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&w=900&q=80", price: 55000, stock: 22 },
		{ name: "Pouch Kain Etnik", description: "Pouch serbaguna untuk menyimpan perlengkapan kecil dengan motif etnik yang menarik.", imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80", price: 72000, stock: 16 },
		{ name: "Gantungan Kunci Rumah Bolon", description: "Suvenir mini terinspirasi arsitektur Rumah Bolon, ringan dan cocok dijadikan oleh-oleh.", imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80", price: 25000, stock: 35 },
		{ name: "Notebook Sampul Daur Ulang", description: "Buku catatan dengan sampul bernuansa natural untuk ide, jurnal, dan kebutuhan belajar.", imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80", price: 42000, stock: 24 },
		{ name: "Paket Suvenir Toba", description: "Paket pilihan berisi produk kreatif lokal untuk hadiah dan kenang-kenangan perjalanan.", imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80", price: 220000, stock: 6 },
	];
	const existingNames = new Set(db.product.map((product) => product.name.toLocaleLowerCase()));
	const missingProducts = sampleProducts.filter((product) => !existingNames.has(product.name.toLocaleLowerCase()));
	db.product.push(...missingProducts.map((product) => ({ id: crypto.randomUUID(), ...product, createdAt: now, updatedAt: now })));
	return {
		ok: true,
		alreadySeeded: !createdAdmin,
		catalogSeeded: missingProducts.length > 0,
		productsAdded: missingProducts.length,
		totalProducts: db.product.length,
		admin: SEED_ADMIN_EMAIL,
	};
});
