import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";
import type { Preloaded } from "convex/react";
import { fetchAction, fetchMutation, fetchQuery, preloadQuery } from "convex/nextjs";
import type { FunctionReference, FunctionReturnType } from "convex/server";
import { headers } from "next/headers";
import { api } from "@/convex/_generated/api";

const nextJsAuth = convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl:
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL || process.env.CONVEX_SITE_URL!,
});

export const { handler } = nextJsAuth;

type AuthSessionUser = {
  email: string;
  id: string;
  image?: string | null;
  name: string;
};

type AuthSessionResponse =
  | {
      session: unknown;
      user: AuthSessionUser;
    }
  | null;

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost || requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");

  if (host) {
    const protocol =
      forwardedProto ||
      (host.includes("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https");

    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

async function fetchLocalAuthJson<T>(path: string) {
  const requestHeaders = await headers();
  const origin = await getRequestOrigin();
  const cookie = requestHeaders.get("cookie");

  const response = await fetch(`${origin}${path}`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });

  if (!response.ok) {
    throw new Error(`Failed auth request: ${path}`);
  }

  return (await response.json()) as T;
}

export async function getToken() {
  const response = await fetchLocalAuthJson<{ token?: string | null }>(
    "/api/auth/convex/token"
  );
  return response.token ?? undefined;
}

export async function isAuthenticated() {
  return !!(await getToken());
}

export async function preloadAuthQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: [Query["_args"]?]
): Promise<Preloaded<Query>> {
  const token = await getToken();
  return preloadQuery(query, args[0], { token });
}

export async function fetchAuthQuery<Query extends FunctionReference<"query">>(
  query: Query,
  ...args: [Query["_args"]?]
): Promise<FunctionReturnType<Query>> {
  const token = await getToken();
  return fetchQuery(query, args[0], { token });
}

export async function fetchAuthMutation<
  Mutation extends FunctionReference<"mutation">
>(mutation: Mutation, ...args: [Mutation["_args"]?]) {
  const token = await getToken();
  return fetchMutation(mutation, args[0], { token });
}

export async function fetchAuthAction<Action extends FunctionReference<"action">>(
  action: Action,
  ...args: [Action["_args"]?]
) {
  const token = await getToken();
  return fetchAction(action, args[0], { token });
}

export async function getCurrentAuthUser() {
  const session = await fetchLocalAuthJson<AuthSessionResponse>(
    "/api/auth/get-session"
  );
  return session?.user ?? null;
}
