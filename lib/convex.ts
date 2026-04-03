import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

function getConvexUrl() {
  const url = process.env.CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL;

  if (!url) {
    throw new Error("Convex URL is not configured");
  }

  return url;
}

export function getConvexClient() {
  const client = new ConvexHttpClient(getConvexUrl());
  const adminKey = process.env.CONVEX_DEPLOY_KEY;

  if (adminKey) {
    client.setAdminAuth(adminKey);
  }

  return client;
}

export { api };
