import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { db, getUserRole, removeUserRole, setUserRole } from "@/lib/db";
import { requireAdmin } from "@/lib/session";

export const userRoleSchema = z.object({
	userId: z.string().trim().min(1).max(100),
	role: z.enum(["admin", "user"]),
});

export const getUsers = createServerFn({ method: "GET" }).handler(async () => {
	await requireAdmin();
	return db.user.map((u) => ({
		id: u.id,
		email: u.email,
		name: u.name,
		role: getUserRole(u.id),
		emailVerified: !!u.emailVerified,
		createdAt: u.createdAt.toISOString(),
	}));
});

export const updateUserRole = createServerFn({ method: "POST" })
	.validator(userRoleSchema)
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();
		if (data.userId === user.id && data.role !== "admin") {
			throw new Error("You cannot remove your own administrator role.");
		}
		const target = db.user.find((entry) => entry.id === data.userId);
		if (!target) throw new Error("User not found.");
		if (getUserRole(data.userId) === "admin" && data.role !== "admin") {
			const admins = db.user.filter((entry) => getUserRole(entry.id) === "admin");
			if (admins.length <= 1) throw new Error("Cannot demote the last administrator.");
		}
		setUserRole(data.userId, data.role);
		return { ok: true };
	});

export const deleteUser = createServerFn({ method: "POST" })
	.validator(z.object({ userId: z.string().trim().min(1).max(100) }))
	.handler(async ({ data }) => {
		const { user } = await requireAdmin();
		if (data.userId === user.id) throw new Error("You cannot delete your own account while signed in as administrator.");
		const target = db.user.find((entry) => entry.id === data.userId);
		if (!target) throw new Error("User not found.");
		// Prevent removing the last administrator so the app never locks itself out.
		const role = getUserRole(data.userId);
		if (role === "admin") {
			const adminCount = db.userRole.filter((r) => r.role === "admin").length;
			if (adminCount <= 1) {
				const err = new Error("Cannot delete the last administrator") as Error & {
					status?: number;
				};
				err.status = 400;
				throw err;
			}
		}
		db.user = db.user.filter((u) => u.id !== data.userId);
		removeUserRole(data.userId);
		return { ok: true };
	});
