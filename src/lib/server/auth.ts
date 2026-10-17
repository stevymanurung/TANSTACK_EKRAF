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
	const hasAdmin = db.user.some((u) => {
		const role = db.userRole.find((r) => r.userId === u.id)?.role;
		return role === "admin";
	});

	if (!hasAdmin) {
		await auth.api.signUpEmail({
			body: {
				email: SEED_ADMIN_EMAIL,
				password: SEED_ADMIN_PASSWORD,
				name: "Administrator",
			},
			headers: new Headers(),
		});

		const adminUser = db.user.find((u) => u.email === SEED_ADMIN_EMAIL);
		if (adminUser) {
			const existing = db.userRole.find((r) => r.userId === adminUser.id);
			if (existing) existing.role = "admin";
			else db.userRole.push({ userId: adminUser.id, role: "admin" });
		}
	}

	// Seed catalog data independently from the admin check so /setup can also
	// repair an empty catalog when the admin account already exists.
	const createdProducts = db.product.length === 0;
	if (createdProducts) {
		const now = new Date().toISOString();
		const products = [
			{
				name: "Ulos Ragi Hotang",
				description: "Kain tenun tradisional dengan motif khas Batak, cocok sebagai koleksi budaya dan hadiah premium.",
				imageUrl: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80",
				price: 450000,
				stock: 12,
			},
			{
				name: "Kopi Arabika Toba",
				description: "Kopi arabika dari dataran tinggi sekitar Danau Toba dengan karakter rasa yang kaya.",
				imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80",
				price: 85000,
				stock: 28,
			},
			{
				name: "Kerajinan Kayu Lokal",
				description: "Dekorasi buatan pengrajin lokal dengan material kayu dan sentuhan desain minimalis.",
				imageUrl: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80",
				price: 175000,
				stock: 7,
			},
			{
				name: "Tas Anyaman Handmade",
				description: "Tas anyaman bergaya kontemporer yang memadukan fungsi sehari-hari dan keterampilan kriya.",
				imageUrl: "https://images.unsplash.com/photo-1590879860931-6bcae5f4b8e4?auto=format&fit=crop&w=900&q=80",
				price: 125000,
				stock: 3,
			},
		].map((product) => ({
			id: crypto.randomUUID(),
			...product,
			createdAt: now,
			updatedAt: now,
		}));
		db.product.push(...products);
	}

	return {
		ok: true,
		alreadySeeded: hasAdmin,
		catalogSeeded: createdProducts,
		admin: SEED_ADMIN_EMAIL,
	};
});
