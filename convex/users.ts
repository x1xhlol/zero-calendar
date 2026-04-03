import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getByGoogleWatchChannelId = query({
  args: { googleWatchChannelId: v.string() },
  handler: async (ctx, { googleWatchChannelId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_googleWatchChannelId", (q) =>
        q.eq("googleWatchChannelId", googleWatchChannelId)
      )
      .unique();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    provider: v.optional(v.string()),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    preferences: v.optional(v.any()),
    lastGoogleSync: v.optional(v.number()),
    googleSyncToken: v.optional(v.string()),
    googleWatchCalendarId: v.optional(v.string()),
    googleWatchChannelId: v.optional(v.string()),
    googleWatchExpiration: v.optional(v.number()),
    googleWatchResourceId: v.optional(v.string()),
    googleWatchToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("users", args);
  },
});
