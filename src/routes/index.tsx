import { createFileRoute, redirect } from "@tanstack/react-router";

import { getServerSession } from "@/lib/server/auth";

/** Root URL is the single entry point: signed-in members go to Dashboard, visitors go to Login. */
export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { session } = await getServerSession();
    throw redirect({ to: session ? "/dashboard" : "/login" });
  },
  component: () => null,
});
