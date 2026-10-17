import { createFileRoute, redirect } from "@tanstack/react-router";

import { getServerSession } from "@/lib/server/auth";

/** The workspace is private: visitors land on sign-in before seeing any app content. */
export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { session } = await getServerSession();
    throw redirect({ to: session ? "/dashboard" : "/login" });
  },
  component: () => null,
});
