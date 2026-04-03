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
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const result = await auth.api.getAccessToken({
      body: {
        providerId: "google",
      },
      headers,
    });

    return {
      accessToken: result.accessToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt?.getTime() ?? null,
      idToken: result.idToken ?? null,
      scopes: result.scopes,
    };
  },
});

export const refreshGoogleAccessToken = mutation({
  args: {},
  handler: async (ctx) => {
    const { auth, headers } = await authComponent.getAuth(createAuth, ctx);

    const result = await auth.api.refreshToken({
      body: {
        providerId: "google",
      },
      headers,
    });

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessTokenExpiresAt: result.accessTokenExpiresAt?.getTime() ?? null,
      refreshTokenExpiresAt: result.refreshTokenExpiresAt?.getTime() ?? null,
      idToken: result.idToken ?? null,
      scopes: result.scopes,
    };
  },
});
