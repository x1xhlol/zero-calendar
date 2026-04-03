import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
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
  }).index("by_userId", ["userId"]),

  events: defineTable({
    userId: v.string(),
    eventId: v.string(),
    startMs: v.number(),
    endMs: v.number(),
    source: v.optional(v.string()),
    data: v.any(),
  })
    .index("by_user", ["userId"])
    .index("by_user_eventId", ["userId", "eventId"]),

  categories: defineTable({
    userId: v.string(),
    categoryId: v.string(),
    data: v.any(),
  })
    .index("by_user", ["userId"])
    .index("by_user_categoryId", ["userId", "categoryId"]),
});
