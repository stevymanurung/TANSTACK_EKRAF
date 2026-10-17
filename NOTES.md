# What I broke and how I fixed it

The app entry route previously allowed visitors to view a public landing page before signing in. I changed `/` to redirect signed-out visitors to `/login` and authenticated visitors to `/dashboard`; dashboard, product, and user routes retain their session/access guards. The setup routine now also seeds a meaningful creative-product catalog when the admin account already exists but the product list is empty, and the sample product values plus price labels now use Indonesian Rupiah. The starter still exposed scaffold-only `/about` and `/demo/better-auth` pages, and its route tree contained duplicate demo-route metadata, so I removed those pages and cleaned the generated route map to keep navigation focused on the EKRAF workspace. I strengthened product input validation on the server, added a server-side image payload and dimension check for uploaded data-URL images, limited stock to whole numbers, and added an administrator guard to product creation and administrator-only editing controls while keeping product details readable for ordinary signed-in users. The product list now includes controlled create/edit modals with validation, loading feedback, cancel behavior, and image previews. The login screen received a distinct editorial split-layout redesign with responsive mobile treatment, clearer credential errors, password visibility controls, live signup password requirements (8+ characters, uppercase first character, a dot, and a number), and matching-password confirmation. The user-management page now has a role-change modal, search, status summaries, clear role/status labels, mutation feedback, confirmation before deletion, and a mobile card layout instead of relying on a wide table. Better Auth already has a five-attempt-per-minute in-memory rate limit and secure cookie attributes; the application remains intentionally in-memory, so users/products reset when the server process restarts.

## Security enhancements and what they prevent

- **Server-side Zod validation:** rejects malformed, oversized, negative, or invalid product/user mutation payloads even when a caller bypasses browser validation.
- **Admin-only mutations and page guards:** prevents regular users from creating, editing, deleting products, or changing/deleting accounts; server authorization remains the source of truth.
- **Self-protection for administrators:** blocks self-demotion, self-deletion, and removal/demotion of the last administrator to reduce account lockout risk.
- **Login rate limiting:** Better Auth limits repeated authentication attempts to reduce password-guessing abuse.
- **Session cookie hardening:** cookies are `httpOnly`, `sameSite=lax`, and `secure` in production; sessions expire after seven days and refresh their age daily.
- **Image validation:** restricts image payload size and verifies dimensions for uploaded image data on the server, helping prevent oversized image payloads from being stored.
- **Signup password guidance:** the registration form checks minimum length, an uppercase first character, a dot, a number, and password confirmation before sending the signup request. This is client-side registration UX validation; it does not replace server-side password policy enforcement.

## Verification status

The source was updated against `CHEATSHEET.md`. Automated `bun run lint`, `bun run build`, and route regeneration could not be executed in this environment because Bun/dependencies were unavailable and package installation timed out. Run the commands in the cheatsheet locally before merging.

## Catalog startup seed fix
- The demo catalog now seeds 12 sample products when the server process initializes, so local development does not depend on visiting `/setup` just to see products.
- Existing product names are checked before seeding; existing products are not overwritten or deleted.
- This remains an in-memory demo implementation. Vercel serverless functions do not share reliable mutable memory across requests/cold starts. For persistent production accounts and product CRUD, connect a persistent database before treating the deployed site as production-ready.

## Admin-only workspace flow
- The login screen now presents a single administrator sign-in flow; public sign-up toggle is hidden.
- Dashboard, catalog, product create/detail, and user-management routes check administrator access before rendering.
- Server-side product mutations already require administrator authorization; these protections remain in place.
- Initial admin setup remains available at `/setup` for local project initialization.
- For production, configure `BETTER_AUTH_URL` and a strong `BETTER_AUTH_SECRET`; do not expose `/setup` publicly.


## Akses untuk semua anggota

Alur tidak lagi operator-only: pendaftaran tetap tersedia, semua pengguna yang login dapat melakukan CRUD produk melalui UI dan server functions, sementara manajemen pengguna tetap admin-only. Kebijakan password pendaftaran ditegakkan di sisi server selain panduan validasi di formulir.
