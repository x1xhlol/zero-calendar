import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL || "http://localhost:3000";
const secret =
  process.env.BETTER_AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "development-secret-change-me";

export const authComponent = createClient<DataModel>(components.betterAuth);

function normalizeTimestamp(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) {
      return numericValue;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "getTime" in value &&
    typeof value.getTime === "function"
  ) {
    const timestamp = value.getTime();
    return typeof timestamp === "number" && Number.isFinite(timestamp)
      ? timestamp
      : null;
  }

  return null;
}

async function getGoogleAccount(ctx: GenericCtx<DataModel>) {
  const user = await authComponent.safeGetAuthUser(ctx);

  if (!user) {
    return null;
  }

  return await ctx.runQuery(components.betterAuth.adapter.findOne, {
    model: "account",
    where: [
      { field: "userId", value: user._id as string, connector: "AND" },
      { field: "providerId", value: "google", connector: "AND" },
    ],
  });
}

function getScopeValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string").join(" ");
  }

  return null;
}

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    secret,
    database: authComponent.adapter(ctx),
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        prompt: "consent",
        accessType: "offline",
        scopes: [
          "openid",
          "email",
          "profile",
          "https://www.googleapis.com/auth/calendar",
        ],
      },
    },
    plugins: [convex({ authConfig })],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await authComponent.safeGetAuthUser(ctx);
  },
});

export const getGoogleAccessToken = mutation({
  args: {},
  handler: async (ctx) => {
    const account = await getGoogleAccount(ctx);

    return {
      accessToken: account?.accessToken ?? null,
      accessTokenExpiresAt: normalizeTimestamp(account?.accessTokenExpiresAt),
      refreshToken: account?.refreshToken ?? null,
      refreshTokenExpiresAt: normalizeTimestamp(account?.refreshTokenExpiresAt),
      idToken: account?.idToken ?? null,
      scope: getScopeValue(account?.scope),
      scopes:
        typeof account?.scope === "string"
          ? account.scope.split(" ").filter(Boolean)
          : [],
    };
  },
});

export const refreshGoogleAccessToken = mutation({
  args: {},
  handler: async (ctx) => {
    const account = await getGoogleAccount(ctx);

    return {
      accessToken: account?.accessToken ?? null,
      refreshToken: account?.refreshToken ?? null,
      accessTokenExpiresAt: normalizeTimestamp(account?.accessTokenExpiresAt),
      refreshTokenExpiresAt: normalizeTimestamp(account?.refreshTokenExpiresAt),
      idToken: account?.idToken ?? null,
      scope: getScopeValue(account?.scope),
    };
  },
});
