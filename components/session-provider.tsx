"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexReactClient } from "convex/react";
import type React from "react";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
