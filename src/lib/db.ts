import { memoryAdapter } from "better-auth/adapters/memory";

export type Role = "admin" | "user";

export interface Product {
	id: string;
	name: string;
	description: string;
	imageUrl?: string;
	price: number;
	stock: number;
	createdAt: string;
	updatedAt: string;
}

export interface UserRole {
	userId: string;
	role: Role;
}

/**
 * In-memory development database.
 *
 * better-auth owns the `user`, `session`, `account` and `verification` tables
 * (managed through `memoryAdapter`). This app adds `product` and `userRole`.
 *
 * NOTE: this is memory only. Data survives within a single running server
 * process (local dev, or one warmed Vercel serverless instance) but is reset
 * on every redeploy / cold start. There is no persistent database by design.
 * See AGENTS.md for how to seed an admin account and sample data.
 */
const memoryDb = {
	user: [] as Array<{
		id: string;
		email: string;
		name: string | null;
		image: string | null;
		emailVerified: boolean;
		emailVerifiedAt: Date | null;
		createdAt: Date;
		updatedAt: Date;
		lastSignInAt: Date | null;
	}>,
	session: [] as unknown[],
	account: [] as unknown[],
	verification: [] as unknown[],
	product: [] as Product[],
	userRole: [] as UserRole[],
};

// Seed demo catalog at process startup so the Products page is not empty
// when a developer forgets to visit /setup. Existing products are preserved.
const demoProducts: Omit<Product, "id" | "createdAt" | "updatedAt">[] = [
  { name: "Ulos Ragi Hotang", description: "Kain tenun tradisional Batak dengan motif khas, cocok untuk koleksi budaya dan hadiah premium.", imageUrl: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=900&q=80", price: 450000, stock: 12 },
  { name: "Kopi Arabika Toba", description: "Kopi arabika pilihan dari dataran tinggi sekitar Danau Toba dengan aroma khas dan cita rasa seimbang.", imageUrl: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80", price: 85000, stock: 28 },
  { name: "Kerajinan Kayu Lokal", description: "Dekorasi buatan pengrajin lokal dengan material kayu dan sentuhan desain minimalis.", imageUrl: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=900&q=80", price: 175000, stock: 7 },
  { name: "Tas Anyaman Handmade", description: "Tas anyaman bergaya kontemporer yang memadukan fungsi sehari-hari dan keterampilan kriya.", imageUrl: "https://images.unsplash.com/photo-1590879860931-6bcae5f4b8e4?auto=format&fit=crop&w=900&q=80", price: 125000, stock: 3 },
  { name: "Mug Ilustrasi Danau Toba", description: "Mug keramik bertema lanskap Danau Toba untuk suvenir dan hadiah.", imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558f?auto=format&fit=crop&w=900&q=80", price: 65000, stock: 18 },
  { name: "Lilin Aromaterapi Pinus", description: "Lilin dekoratif beraroma segar untuk menghadirkan suasana rileks di rumah.", imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=900&q=80", price: 78000, stock: 14 },
  { name: "Dompet Tenun Mini", description: "Dompet kecil praktis dengan aksen kain tenun yang mengangkat karya kriya lokal.", imageUrl: "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=900&q=80", price: 95000, stock: 9 },
  { name: "Poster Peta Sumatera Utara", description: "Poster dekoratif bertema geografis untuk mempercantik ruang kerja atau ruang keluarga.", imageUrl: "https://images.unsplash.com/photo-1582201942988-13e60e4556ee?auto=format&fit=crop&w=900&q=80", price: 55000, stock: 22 },
  { name: "Pouch Kain Etnik", description: "Pouch serbaguna untuk menyimpan perlengkapan kecil dengan motif etnik.", imageUrl: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=80", price: 72000, stock: 16 },
  { name: "Gantungan Kunci Rumah Bolon", description: "Suvenir mini terinspirasi arsitektur Rumah Bolon, cocok sebagai oleh-oleh.", imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=900&q=80", price: 25000, stock: 35 },
  { name: "Notebook Sampul Daur Ulang", description: "Buku catatan bernuansa natural untuk ide, jurnal, dan kebutuhan belajar.", imageUrl: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=80", price: 42000, stock: 24 },
  { name: "Paket Suvenir Toba", description: "Paket pilihan produk kreatif lokal untuk hadiah dan kenang-kenangan perjalanan.", imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=900&q=80", price: 220000, stock: 6 },
];
const seedTimestamp = new Date().toISOString();
for (const product of demoProducts) {
  if (!memoryDb.product.some((item) => item.name.toLocaleLowerCase() === product.name.toLocaleLowerCase())) {
    memoryDb.product.push({ id: crypto.randomUUID(), ...product, createdAt: seedTimestamp, updatedAt: seedTimestamp });
  }
}

export const adapter = memoryAdapter(memoryDb);
export const db = memoryDb;

export const SEED_ADMIN_EMAIL = "admin@example.com";
export const SEED_ADMIN_PASSWORD = "admin12345";

export function getUserRole(userId: string): Role {
	return db.userRole.find((r) => r.userId === userId)?.role ?? "user";
}

export function setUserRole(userId: string, role: Role) {
	const existing = db.userRole.find((r) => r.userId === userId);
	if (existing) {
		existing.role = role;
	} else {
		db.userRole.push({ userId, role });
	}
}

export function removeUserRole(userId: string) {
	db.userRole = db.userRole.filter((r) => r.userId !== userId);
}
