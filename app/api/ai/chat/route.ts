import { generateText, tool } from "ai";
import { z } from "zod";
import { calendarTools } from "@/lib/ai-tools";
import { getCurrentAuthUser } from "@/lib/auth-server";
import {
  getOpenRouterModel,
  getOpenRouterProviderOptions,
} from "@/lib/openrouter";
import { getSystemPrompt } from "@/lib/system-prompts";

export const runtime = "nodejs";

const conversationContexts = new Map<
  string,
  Array<{ role: "user" | "assistant"; content: string }>
>();

const tools = {
  getTodayEvents: tool({
    description:
      "Get all events scheduled for today. Use this to show the user what's on their calendar today.",
    parameters: z.object({}),
    execute: async (_, { userId }: { userId: string }) => {
      const events = await calendarTools.getTodayEvents(userId);
      return {
        success: true,
        events,
        count: events.length,
        message:
          events.length > 0
            ? `Found ${events.length} event(s) for today`
            : "No events scheduled for today",
      };
    },
  }),

  getEvents: tool({
    description:
      "Get calendar events within a specific date range. Use this to fetch events for a particular period like next week, this month, or a custom date range.",
    parameters: z.object({
      startDate: z
        .string()
        .describe(
          "Start date in ISO 8601 format (e.g., 2024-12-15 or 2024-12-15T09:00:00Z)"
        ),
      endDate: z
        .string()
        .describe(
          "End date in ISO 8601 format (e.g., 2024-12-20 or 2024-12-20T17:00:00Z)"
        ),
    }),
    execute: async ({ startDate, endDate }, { userId }: { userId: string }) => {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return { success: false, error: "Invalid date format", events: [] };
      }

      const events = await calendarTools.getEvents(userId, start, end);
      return {
        success: true,
        events,
        count: events.length,
        dateRange: { start: startDate, end: endDate },
        message:
          events.length > 0
            ? `Found ${events.length} event(s) in this period`
            : "No events in this date range",
      };
    },
  }),

  createEvent: tool({
    description:
      "Create a new calendar event. Provide title, start time, end time, and optional details like description and location.",
    parameters: z.object({
      title: z.string().describe("Event title/name (required)"),
      startTime: z
        .string()
        .describe(
          "Start time in ISO 8601 format (required, e.g., 2024-12-15T09:00:00Z)"
        ),
      endTime: z
        .string()
        .describe(
          "End time in ISO 8601 format (required, e.g., 2024-12-15T10:00:00Z)"
        ),
      description: z.string().optional().describe("Event description or notes"),
      location: z
        .string()
        .optional()
        .describe("Event location (physical or virtual)"),
      color: z.string().optional().describe("Event color for categorization"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const startTime = new Date(params.startTime);
      const endTime = new Date(params.endTime);

      if (
        Number.isNaN(startTime.getTime()) ||
        Number.isNaN(endTime.getTime())
      ) {
        return { success: false, error: "Invalid date/time format" };
      }

      if (startTime >= endTime) {
        return { success: false, error: "Start time must be before end time" };
      }

      const hasConflict = await calendarTools.checkForConflicts(
        userId,
        params.startTime,
        params.endTime
      );

      if (hasConflict) {
        return {
          success: false,
          error: "Time slot has a scheduling conflict",
          conflict: true,
          suggestion: "Try using findAvailableTimeSlots to find open times",
        };
      }

      const event = await calendarTools.createEvent(
        userId,
        params.title,
        params.startTime,
        params.endTime,
        params.description,
        params.location,
        params.color
      );
      return {
        success: true,
        event,
        message: `Event "${params.title}" created for ${params.startTime}`,
      };
    },
  }),

  updateEvent: tool({
    description:
      "Update an existing calendar event. Specify the event ID and which fields to update.",
    parameters: z.object({
      eventId: z.string().describe("ID of the event to update (required)"),
      title: z.string().optional().describe("New event title"),
      startTime: z
        .string()
        .optional()
        .describe("New start time in ISO 8601 format"),
      endTime: z
        .string()
        .optional()
        .describe("New end time in ISO 8601 format"),
      description: z.string().optional().describe("New event description"),
      location: z.string().optional().describe("New event location"),
      color: z.string().optional().describe("New event color"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const { eventId, ...updateData } = params;

      if (updateData.startTime && updateData.endTime) {
        const startTime = new Date(updateData.startTime);
        const endTime = new Date(updateData.endTime);

        if (
          Number.isNaN(startTime.getTime()) ||
          Number.isNaN(endTime.getTime())
        ) {
          return { success: false, error: "Invalid date/time format" };
        }

        if (startTime >= endTime) {
          return {
            success: false,
            error: "Start time must be before end time",
          };
        }

        // Check for conflicts with new time
        const hasConflict = await calendarTools.checkForConflicts(
          userId,
          updateData.startTime,
          updateData.endTime
        );

        if (hasConflict) {
          return {
            success: false,
            error: "New time slot has a scheduling conflict",
            conflict: true,
          };
        }
      }

      const event = await calendarTools.updateEvent(
        userId,
        eventId,
        updateData
      );
      return {
        success: true,
        event,
        message: `Event "${eventId}" updated successfully`,
      };
    },
  }),

  deleteEvent: tool({
    description: "Delete/remove a calendar event by its ID.",
    parameters: z.object({
      eventId: z.string().describe("ID of the event to delete (required)"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      await calendarTools.deleteEvent(userId, params.eventId);
      return {
        success: true,
        message: `Event "${params.eventId}" deleted successfully`,
      };
    },
  }),

  findEvents: tool({
    description:
      "Search for events by title, description, or location. Useful when user can't remember exact event details.",
    parameters: z.object({
      query: z.string().describe("Search query/keywords to find events"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const events = await calendarTools.findEvents(userId, params.query);
      return {
        success: true,
        events,
        count: events.length,
        query: params.query,
        message:
          events.length > 0
            ? `Found ${events.length} event(s) matching "${params.query}"`
            : `No events found matching "${params.query}"`,
      };
    },
  }),

  analyzeSchedule: tool({
    description:
      "Analyze your calendar patterns and busy times over a date range. Provides insights about workload distribution, busiest days/hours, and scheduling patterns.",
    parameters: z.object({
      startDate: z.string().describe("Analysis start date in ISO 8601 format"),
      endDate: z.string().describe("Analysis end date in ISO 8601 format"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const start = new Date(params.startDate);
      const end = new Date(params.endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return { success: false, error: "Invalid date format" };
      }

      const analysis = await calendarTools.analyzeSchedule(
        userId,
        params.startDate,
        params.endDate
      );
      return {
        success: true,
        analysis,
        message: "Schedule analysis complete",
      };
    },
  }),

  findAvailableTimeSlots: tool({
    description:
      "Find available time slots on a specific date. Specify the duration needed and get a list of free times.",
    parameters: z.object({
      date: z
        .string()
        .describe("Date to search for availability in ISO 8601 format"),
      durationMinutes: z
        .number()
        .optional()
        .default(30)
        .describe("Minimum duration needed in minutes (default: 30)"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const result = await calendarTools.findAvailableTimeSlots(
        userId,
        params.date,
        params.durationMinutes
      );
      return {
        success: true,
        ...result,
        date: params.date,
        requestedDuration: params.durationMinutes,
        message:
          result.freeSlots.length > 0
            ? `Found ${result.freeSlots.length} available slot(s) with at least ${params.durationMinutes} minutes free`
            : `No available slots with ${params.durationMinutes} minutes free on this date`,
      };
    },
  }),

  checkForConflicts: tool({
    description:
      "Check if a proposed time slot has any scheduling conflicts. Always use this before creating or updating events.",
    parameters: z.object({
      startTime: z.string().describe("Proposed start time in ISO 8601 format"),
      endTime: z.string().describe("Proposed end time in ISO 8601 format"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const hasConflict = await calendarTools.checkForConflicts(
        userId,
        params.startTime,
        params.endTime
      );
      return {
        success: true,
        hasConflict,
        timeSlot: { start: params.startTime, end: params.endTime },
        message: hasConflict
          ? "⚠️ Conflict detected in this time slot"
          : "✓ Time slot is available",
      };
    },
  }),

  suggestRescheduling: tool({
    description:
      "Get rescheduling suggestions for an event. Automatically finds alternative available time slots.",
    parameters: z.object({
      eventId: z.string().describe("ID of the event to reschedule"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const suggestions = await calendarTools.suggestRescheduling(
        userId,
        params.eventId
      );
      return {
        success: true,
        ...suggestions,
        message: suggestions.success
          ? `Found ${suggestions.alternativeSlots.length} alternative time slot(s) for rescheduling`
          : "Could not find rescheduling suggestions",
      };
    },
  }),

  getCalendarAnalytics: tool({
    description:
      "Get detailed analytics about your calendar usage including meeting hours, categories, and busiest periods.",
    parameters: z.object({
      startDate: z.string().describe("Analysis start date in ISO 8601 format"),
      endDate: z.string().describe("Analysis end date in ISO 8601 format"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const analytics = await calendarTools.getCalendarAnalytics(
        userId,
        params.startDate,
        params.endDate
      );
      return {
        success: true,
        analytics,
        message: "Calendar analytics computed",
      };
    },
  }),

  findFreeTimeSlots: tool({
    description:
      "Find all free time slots across a date range with minimum duration. Great for scheduling recurring meetings.",
    parameters: z.object({
      startDate: z.string().describe("Range start date in ISO 8601 format"),
      endDate: z.string().describe("Range end date in ISO 8601 format"),
      minDurationMinutes: z
        .number()
        .optional()
        .default(30)
        .describe("Minimum duration in minutes"),
    }),
    execute: async (params, { userId }: { userId: string }) => {
      const result = await calendarTools.findFreeTimeSlots(
        userId,
        params.startDate,
        params.endDate,
        params.minDurationMinutes
      );
      return {
        success: true,
        ...result,
        dateRange: { start: params.startDate, end: params.endDate },
        message: `Found ${result.freeSlots.length} total free slot(s) across the period`,
      };
    },
  }),
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { message, conversationId, timezone, currentDate } = await req.json();

    // Maintain conversation history
    let history = conversationContexts.get(conversationId) || [];
    history.push({ role: "user", content: message });

    // Keep history manageable
    if (history.length > 20) {
      history = history.slice(-20);
    }

    try {
      const { text } = await generateText({
        model: getOpenRouterModel(),
        providerOptions: getOpenRouterProviderOptions(user.id),
        system: getSystemPrompt("calendar", timezone, currentDate),
        messages: history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        tools,
        toolChoice: "auto",
        temperature: 0.7,
        maxTokens: 2000,
      });

      history.push({ role: "assistant", content: text });
      conversationContexts.set(conversationId, history);

      return Response.json({
        response: text,
        conversationId,
      });
    } catch (aiError) {
      console.error("[AI Chat] AI generation error:", aiError);
      return Response.json(
        {
          error: "Failed to process request",
          response:
            "I'm having trouble processing your request. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[AI Chat] Error processing request:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        response:
          "Sorry, I encountered an error while processing your request.",
      },
      { status: 500 }
    );
  }
}
