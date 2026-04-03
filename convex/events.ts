import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getByEventId = query({
  args: { userId: v.string(), eventId: v.string() },
  handler: async (ctx, { userId, eventId }) => {
    return await ctx.db
      .query("events")
      .withIndex("by_user_eventId", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .unique();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    eventId: v.string(),
    startMs: v.number(),
    endMs: v.number(),
    source: v.optional(v.string()),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_user_eventId", (q) =>
        q.eq("userId", args.userId).eq("eventId", args.eventId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("events", args);
  },
});

export const deleteByEventId = mutation({
  args: { userId: v.string(), eventId: v.string() },
  handler: async (ctx, { userId, eventId }) => {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_user_eventId", (q) =>
        q.eq("userId", userId).eq("eventId", eventId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
