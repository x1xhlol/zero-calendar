"use client";

import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  plugins: [convexClient()],
});
