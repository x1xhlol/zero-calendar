import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import { api } from "@/convex/_generated/api";

export const {
  handler,
  fetchAuthQuery,
  fetchAuthMutation,
  fetchAuthAction,
  preloadAuthQuery,
  getToken,
  isAuthenticated,
} = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl:
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL || process.env.CONVEX_SITE_URL!,
});

export async function getCurrentAuthUser() {
  return await fetchAuthQuery(api.auth.getCurrentUser, {});
}
