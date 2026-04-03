import "server-only";

import {
  createOpenRouter,
  type OpenRouterProviderOptions,
} from "@openrouter/ai-sdk-provider";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey) {
  throw new Error("OPENROUTER_API_KEY is not configured");
}

const openrouter = createOpenRouter({
  apiKey,
  compatibility: "strict",
});

export function getOpenRouterModel() {
  const model = process.env.OPENROUTER_MODEL || "x-ai/grok-4.1-fast";
  return openrouter.chat(model);
}

export function getOpenRouterProviderOptions(user?: string): {
  openrouter: OpenRouterProviderOptions;
} {
  return {
    openrouter: {
      reasoning: {
        enabled: true,
        effort: "high",
      },
      ...(user ? { user } : {}),
    },
  };
}
