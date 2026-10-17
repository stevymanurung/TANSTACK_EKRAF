import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { type Product, db } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/session";

export const productSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(120, "Name is too long"),
	description: z.string().trim().min(1, "Description is required").max(2000, "Description is too long"),
	imageUrl: z.string().trim().max(300_000, "Image is too large").optional().default(""),
	price: z.coerce.number().finite().min(0, "Price cannot be negative").max(1_000_000_000, "Price is too large"),
	stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock cannot be negative").max(1_000_000, "Stock is too large"),
});

export type ProductInput = z.infer<typeof productSchema>;

// TanStack Start server functions support GET and POST only. Mutations use
// POST and encode the intended action in the validator/body.
export const getProducts = createServerFn({ method: "GET" }).handler(async () => {
	await requireAuth();
	return [...db.product].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) as Product[];
});

export const createProduct = createServerFn({ method: "POST" })
	.validator(productSchema)
	.handler(async ({ data }) => {
		await requireAdmin();
		validateProductImage(data.imageUrl);
		const now = new Date().toISOString();
		const product = {
			id: crypto.randomUUID(),
			...data,
			createdAt: now,
			updatedAt: now,
		} as Product;
		db.product.push(product);
		return product;
	});

export const updateProduct = createServerFn({ method: "POST" })
	.validator(
		z.object({
			id: z.string().trim().min(1).max(100),
			...productSchema.shape,
		}),
	)
	.handler(async ({ data }) => {
		await requireAdmin();
		validateProductImage(data.imageUrl);
		const index = db.product.findIndex((p) => p.id === data.id);
		if (index === -1) {
			const err = new Error("Product not found") as Error & { status?: number };
			err.status = 404;
			throw err;
		}
		const now = new Date().toISOString();
		const updated = {
			...db.product[index],
			name: data.name,
			description: data.description,
			imageUrl: data.imageUrl || "",
			price: data.price,
			stock: data.stock,
			updatedAt: now,
		} as Product;
		db.product[index] = updated;
		return updated;
	});

export const deleteProduct = createServerFn({ method: "POST" })
	.validator(z.object({ id: z.string().trim().min(1).max(100) }))
	.handler(async ({ data }) => {
		await requireAdmin();
		const index = db.product.findIndex((p) => p.id === data.id);
		if (index === -1) {
			const err = new Error("Product not found") as Error & { status?: number };
			err.status = 404;
			throw err;
		}
		db.product.splice(index, 1);
		return { ok: true };
	});


/** Reject unsafe image payloads even if a caller bypasses the client-side picker. */
function validateProductImage(imageUrl: string | undefined) {
	if (!imageUrl) return;
	if (imageUrl.length > 300_000) {
		throw new Error("Product image must be smaller than 300 KB after optimization.");
	}
	const isDataImage = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(imageUrl);
	let isHttpsUrl = false;
	try {
		const parsed = new URL(imageUrl);
		isHttpsUrl = parsed.protocol === "https:";
	} catch {
		// A non-URL may still be a supported base64 image.
	}
	if (!isDataImage && !isHttpsUrl) {
		throw new Error("Image must be an HTTPS URL or a valid PNG, JPEG, WebP, or GIF image.");
	}
	if (isDataImage) {
		const dimensions = readImageDimensions(imageUrl);
		if (!dimensions) throw new Error("The uploaded image could not be validated. Please upload it again.");
		if (dimensions.width > 512 || dimensions.height > 512) {
			throw new Error("Product image dimensions must not exceed 512 × 512 pixels.");
		}
	}
}

/** Read dimensions from supported image headers without trusting client metadata. */
function readImageDimensions(dataUrl: string): { width: number; height: number } | null {
	try {
		const encoded = dataUrl.slice(dataUrl.indexOf(",") + 1);
		const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
		const ascii = (start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length));
		if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP") {
			const chunk = ascii(12, 4);
			if (chunk === "VP8X" && bytes.length >= 30) {
				return { width: 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16), height: 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16) };
			}
			if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
				return { width: 1 + (((bytes[22] & 0x3f) << 8) | bytes[21]), height: 1 + (((bytes[24] & 0x0f) << 10) | (bytes[23] << 2) | ((bytes[22] & 0xc0) >> 6)) };
			}
			if (chunk === "VP8 " && bytes.length >= 30) {
				for (let i = 20; i < Math.min(bytes.length - 9, 80); i++) {
					if (bytes[i] === 0x9d && bytes[i + 1] === 0x01 && bytes[i + 2] === 0x2a) return { width: view.getUint16(i + 3, true) & 0x3fff, height: view.getUint16(i + 5, true) & 0x3fff };
				}
			}
		}
		if (bytes.length >= 24 && bytes[0] === 0x89 && ascii(1, 3) === "PNG" && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return { width: view.getUint32(16), height: view.getUint32(20) };
		if (ascii(0, 3) === "GIF" && bytes.length >= 10) return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
		if (bytes[0] === 0xff && bytes[1] === 0xd8) {
			let offset = 2;
			while (offset + 9 < bytes.length) {
				if (bytes[offset] !== 0xff) { offset++; continue; }
				const marker = bytes[offset + 1];
				const length = view.getUint16(offset + 2);
				if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
				if (length < 2) break;
				offset += 2 + length;
			}
		}
	} catch { return null; }
	return null;
}
