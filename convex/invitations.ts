import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
  },
});

export const listByEvent = query({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_event", (q) => q.eq("eventId", eventId))
      .collect();
  },
});

export const getByEventAndInvitee = query({
  args: { eventId: v.string(), inviteeEmail: v.string() },
  handler: async (ctx, { eventId, inviteeEmail }) => {
    return await ctx.db
      .query("invitations")
      .withIndex("by_event_invitee", (q) =>
        q.eq("eventId", eventId).eq("inviteeEmail", inviteeEmail)
      )
      .unique();
  },
});

export const create = mutation({
  args: {
    token: v.string(),
    eventId: v.string(),
    organizerUserId: v.string(),
    organizerName: v.string(),
    organizerEmail: v.string(),
    inviteeEmail: v.string(),
    eventTitle: v.string(),
    eventStart: v.string(),
    eventEnd: v.string(),
    eventLocation: v.optional(v.string()),
    eventCalendarId: v.optional(v.string()),
    status: v.string(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("invitations", args);
  },
});

export const updateStatus = mutation({
  args: {
    token: v.string(),
    status: v.string(),
    respondedAt: v.number(),
  },
  handler: async (ctx, { token, status, respondedAt }) => {
    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    await ctx.db.patch(invitation._id, { status, respondedAt });
    return invitation;
  },
});
