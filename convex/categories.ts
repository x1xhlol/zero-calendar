import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getByCategoryId = query({
  args: { userId: v.string(), categoryId: v.string() },
  handler: async (ctx, { userId, categoryId }) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_user_categoryId", (q) =>
        q.eq("userId", userId).eq("categoryId", categoryId)
      )
      .unique();
  },
});

export const upsert = mutation({
  args: {
    userId: v.string(),
    categoryId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("categories")
      .withIndex("by_user_categoryId", (q) =>
        q.eq("userId", args.userId).eq("categoryId", args.categoryId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }

    return await ctx.db.insert("categories", args);
  },
});
