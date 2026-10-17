import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { adapter } from "./db";

// Production must use a stable, private secret configured in the hosting environment.
// Never fall back to Better Auth's development default in a deployed environment.
const authSecret = process.env.BETTER_AUTH_SECRET;
const authBaseURL = process.env.BETTER_AUTH_URL;

if (process.env.NODE_ENV === "production" && !authSecret) {
	throw new Error(
		"Missing BETTER_AUTH_SECRET. Add a strong secret in Vercel Project Settings > Environment Variables, then redeploy.",
	);
}

export const auth = betterAuth({
	database: adapter,
	...(authSecret ? { secret: authSecret } : {}),
	...(authBaseURL ? { baseURL: authBaseURL } : {}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
	},
	rateLimit: {
		window: 60,
		max: 5,
		storage: "memory",
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		cookieCache: {
			enabled: true,
			maxAge: 60 * 15,
		},
	},
	advanced: {
		defaultCookieAttributes: {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		},
	},
	plugins: [tanstackStartCookies()],
});

export default auth;
