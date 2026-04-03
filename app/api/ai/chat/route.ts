import { streamText, tool } from "ai";
import { z } from "zod";
import { calendarTools } from "@/lib/ai-tools";
import { getCurrentAuthUser } from "@/lib/auth-server";
import {
  getOpenRouterModel,
  getOpenRouterProviderOptions,
} from "@/lib/openrouter";
import { getSystemPrompt } from "@/lib/system-prompts";

export const runtime = "nodejs";
export const maxDuration = 30;

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type ToolExecutionContext = {
  experimental_context?: {
    userId?: string;
  };
};

const chatRequestSchema = z.object({
  currentDate: z.string().optional(),
  message: z.string().trim().min(1).optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .optional(),
  timezone: z.string().trim().optional(),
});

function getToolUserId(context: ToolExecutionContext) {
  const userId = context.experimental_context?.userId;

  if (!userId) {
    throw new Error("Missing authenticated user context for AI tool execution");
  }

  return userId;
}

function isDateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseRangeStart(value: string) {
  return new Date(isDateOnly(value) ? `${value}T00:00:00` : value);
}

function parseRangeEnd(value: string) {
  return new Date(isDateOnly(value) ? `${value}T23:59:59.999` : value);
}

function hasValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function sanitizeMessages(messages: ChatHistoryMessage[]) {
  return messages
    .filter((message) => message.content.trim().length > 0)
    .slice(-20);
}

function eventsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
) {
  return aStart < bEnd && aEnd > bStart;
}

const tools = {
  getTodayEvents: tool({
    description: "Retrieve the user's events for today.",
    parameters: z.object({}),
    execute: async (_, context) => {
      const userId = getToolUserId(context);
      const events = await calendarTools.getTodayEvents(userId);

      return {
        success: true,
        events,
        count: events.length,
        message:
          events.length > 0
            ? `Found ${events.length} event(s) for today.`
            : "No events scheduled for today.",
      };
    },
  }),

  getEvents: tool({
    description: "Retrieve events within a date range.",
    parameters: z.object({
      startDate: z.string().describe("ISO date or datetime for the range start."),
      endDate: z.string().describe("ISO date or datetime for the range end."),
    }),
    execute: async ({ startDate, endDate }, context) => {
      const userId = getToolUserId(context);
      const start = parseRangeStart(startDate);
      const end = parseRangeEnd(endDate);

      if (!hasValidDate(start) || !hasValidDate(end) || start > end) {
        return { success: false, error: "Invalid date range.", events: [] };
      }

      const events = await calendarTools.getEvents(userId, start, end);

      return {
        success: true,
        events,
        count: events.length,
        dateRange: { start: startDate, end: endDate },
        message:
          events.length > 0
            ? `Found ${events.length} event(s) in this period.`
            : "No events in this date range.",
      };
    },
  }),

  createEvent: tool({
    description: "Create a new calendar event.",
    parameters: z.object({
      title: z.string().describe("Event title."),
      startTime: z.string().describe("ISO datetime for when the event starts."),
      endTime: z.string().describe("ISO datetime for when the event ends."),
      description: z.string().optional().describe("Optional event notes."),
      location: z.string().optional().describe("Optional event location."),
      color: z.string().optional().describe("Optional event color/category hint."),
    }),
    execute: async (params, context) => {
      const userId = getToolUserId(context);
      const startTime = new Date(params.startTime);
      const endTime = new Date(params.endTime);

      if (!hasValidDate(startTime) || !hasValidDate(endTime)) {
        return { success: false, error: "Invalid date/time format." };
      }

      if (startTime >= endTime) {
        return { success: false, error: "Start time must be before end time." };
      }

      const hasConflict = await calendarTools.checkForConflicts(
        userId,
        params.startTime,
        params.endTime
      );

      if (hasConflict) {
        return {
          success: false,
          error: "Time slot has a scheduling conflict.",
          conflict: true,
          suggestion:
            "Use findAvailableTimeSlots or findFreeTimeSlots to suggest open times.",
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
        message: `Created "${params.title}" for ${params.startTime}.`,
      };
    },
  }),

  updateEvent: tool({
    description: "Update an existing calendar event.",
    parameters: z.object({
      eventId: z.string().describe("ID of the event to update."),
      title: z.string().optional().describe("New event title."),
      startTime: z.string().optional().describe("New ISO start datetime."),
      endTime: z.string().optional().describe("New ISO end datetime."),
      description: z.string().optional().describe("New event description."),
      location: z.string().optional().describe("New event location."),
      color: z.string().optional().describe("New event color."),
    }),
    execute: async (params, context) => {
      const userId = getToolUserId(context);
      const existingEvent = await calendarTools.getEvent(userId, params.eventId);

      if (!existingEvent) {
        return { success: false, error: "Event not found." };
      }

      const nextStart = new Date(params.startTime ?? existingEvent.start);
      const nextEnd = new Date(params.endTime ?? existingEvent.end);

      if (!hasValidDate(nextStart) || !hasValidDate(nextEnd)) {
        return { success: false, error: "Invalid date/time format." };
      }

      if (nextStart >= nextEnd) {
        return { success: false, error: "Start time must be before end time." };
      }

      const overlappingEvents = await calendarTools.getEvents(
        userId,
        nextStart,
        nextEnd
      );

      const hasConflict = overlappingEvents.some((event) => {
        if (event.id === existingEvent.id) {
          return false;
        }

        return eventsOverlap(
          nextStart,
          nextEnd,
          new Date(event.start),
          new Date(event.end)
        );
      });

      if (hasConflict) {
        return {
          success: false,
          error: "New time slot has a scheduling conflict.",
          conflict: true,
        };
      }

      const event = await calendarTools.updateEvent(userId, params.eventId, {
        ...(params.color !== undefined ? { color: params.color } : {}),
        ...(params.description !== undefined
          ? { description: params.description }
          : {}),
        ...(params.endTime !== undefined ? { end: params.endTime } : {}),
        ...(params.location !== undefined ? { location: params.location } : {}),
        ...(params.startTime !== undefined ? { start: params.startTime } : {}),
        ...(params.title !== undefined ? { title: params.title } : {}),
      });

      return {
        success: true,
        event,
        message: `Updated "${event.title}".`,
      };
    },
  }),

  deleteEvent: tool({
    description: "Delete a calendar event by ID.",
    parameters: z.object({
      eventId: z.string().describe("ID of the event to delete."),
    }),
    execute: async ({ eventId }, context) => {
      const userId = getToolUserId(context);
      const event = await calendarTools.getEvent(userId, eventId);

      if (!event) {
        return { success: false, error: "Event not found." };
      }

      await calendarTools.deleteEvent(userId, eventId);

      return {
        success: true,
        deletedEvent: event,
        message: `Deleted "${event.title}".`,
      };
    },
  }),

  findEvents: tool({
    description: "Search calendar events by title, description, or location.",
    parameters: z.object({
      query: z.string().describe("Search query."),
    }),
    execute: async ({ query }, context) => {
      const userId = getToolUserId(context);
      const events = await calendarTools.findEvents(userId, query);

      return {
        success: true,
        events,
        count: events.length,
        query,
        message:
          events.length > 0
            ? `Found ${events.length} event(s) matching "${query}".`
            : `No events found matching "${query}".`,
      };
    },
  }),

  analyzeSchedule: tool({
    description: "Analyze schedule patterns over a date range.",
    parameters: z.object({
      startDate: z.string().describe("ISO date or datetime for the analysis start."),
      endDate: z.string().describe("ISO date or datetime for the analysis end."),
    }),
    execute: async ({ startDate, endDate }, context) => {
      const userId = getToolUserId(context);
      const start = parseRangeStart(startDate);
      const end = parseRangeEnd(endDate);

      if (!hasValidDate(start) || !hasValidDate(end) || start > end) {
        return { success: false, error: "Invalid date range." };
      }

      const analysis = await calendarTools.analyzeSchedule(
        userId,
        start.toISOString(),
        end.toISOString()
      );

      return {
        success: true,
        analysis,
        message: "Schedule analysis complete.",
      };
    },
  }),

  findAvailableTimeSlots: tool({
    description: "Find available time slots on a specific date.",
    parameters: z.object({
      date: z.string().describe("ISO date or datetime to search."),
      durationMinutes: z
        .number()
        .optional()
        .default(30)
        .describe("Minimum duration needed in minutes."),
    }),
    execute: async ({ date, durationMinutes }, context) => {
      const userId = getToolUserId(context);
      const result = await calendarTools.findAvailableTimeSlots(
        userId,
        date,
        durationMinutes
      );

      return {
        success: true,
        ...result,
        date,
        requestedDuration: durationMinutes,
        message:
          result.freeSlots.length > 0
            ? `Found ${result.freeSlots.length} available slot(s).`
            : "No available slots found for that date.",
      };
    },
  }),

  checkForConflicts: tool({
    description: "Check whether a proposed time slot conflicts with existing events.",
    parameters: z.object({
      startTime: z.string().describe("Proposed ISO start datetime."),
      endTime: z.string().describe("Proposed ISO end datetime."),
    }),
    execute: async ({ startTime, endTime }, context) => {
      const userId = getToolUserId(context);
      const hasConflict = await calendarTools.checkForConflicts(
        userId,
        startTime,
        endTime
      );

      return {
        success: true,
        hasConflict,
        timeSlot: { start: startTime, end: endTime },
        message: hasConflict
          ? "Conflict detected in this time slot."
          : "Time slot is available.",
      };
    },
  }),

  suggestRescheduling: tool({
    description: "Suggest alternative slots for rescheduling an event.",
    parameters: z.object({
      eventId: z.string().describe("ID of the event to reschedule."),
    }),
    execute: async ({ eventId }, context) => {
      const userId = getToolUserId(context);
      const suggestions = await calendarTools.suggestRescheduling(userId, eventId);

      return {
        success: true,
        ...suggestions,
        message: suggestions.success
          ? `Found ${suggestions.alternativeSlots.length} alternative slot(s).`
          : "Could not find rescheduling suggestions.",
      };
    },
  }),

  getCalendarAnalytics: tool({
    description: "Get detailed analytics about calendar usage over a date range.",
    parameters: z.object({
      startDate: z.string().describe("ISO date or datetime for the analysis start."),
      endDate: z.string().describe("ISO date or datetime for the analysis end."),
    }),
    execute: async ({ startDate, endDate }, context) => {
      const userId = getToolUserId(context);
      const start = parseRangeStart(startDate);
      const end = parseRangeEnd(endDate);

      if (!hasValidDate(start) || !hasValidDate(end) || start > end) {
        return { success: false, error: "Invalid date range." };
      }

      const analytics = await calendarTools.getCalendarAnalytics(
        userId,
        start.toISOString(),
        end.toISOString()
      );

      return {
        success: true,
        analytics,
        message: "Calendar analytics computed.",
      };
    },
  }),

  findFreeTimeSlots: tool({
    description: "Find all free time slots across a date range.",
    parameters: z.object({
      startDate: z.string().describe("ISO date or datetime for the range start."),
      endDate: z.string().describe("ISO date or datetime for the range end."),
      minDurationMinutes: z
        .number()
        .optional()
        .default(30)
        .describe("Minimum duration in minutes."),
    }),
    execute: async ({ startDate, endDate, minDurationMinutes }, context) => {
      const userId = getToolUserId(context);
      const start = parseRangeStart(startDate);
      const end = parseRangeEnd(endDate);

      if (!hasValidDate(start) || !hasValidDate(end) || start > end) {
        return { success: false, error: "Invalid date range." };
      }

      const result = await calendarTools.findFreeTimeSlots(
        userId,
        start.toISOString(),
        end.toISOString(),
        minDurationMinutes
      );

      return {
        success: true,
        ...result,
        dateRange: { start: startDate, end: endDate },
        message: `Found ${result.freeSlots.length} free slot(s) in this range.`,
      };
    },
  }),
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentAuthUser();

    if (!user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = chatRequestSchema.parse(await req.json());
    const history = sanitizeMessages(
      body.messages ??
        (body.message
          ? [{ role: "user", content: body.message }]
          : [])
    );

    if (history.length === 0) {
      return Response.json(
        { error: "A message is required." },
        { status: 400 }
      );
    }

    const result = streamText({
      model: getOpenRouterModel(),
      providerOptions: getOpenRouterProviderOptions(user.id),
      system: getSystemPrompt("calendar", body.timezone, body.currentDate),
      messages: history,
      tools,
      toolChoice: "auto",
      maxSteps: 5,
      maxTokens: 1600,
      temperature: 0.2,
      experimental_context: {
        userId: user.id,
      },
    });

    const encoder = new TextEncoder();
    let didMutateCalendar = false;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            switch (part.type) {
              case "text-delta":
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "text",
                      text: part.text,
                    })}\n\n`
                  )
                );
                break;
              case "tool-result":
                if (
                  part.toolName === "createEvent" ||
                  part.toolName === "updateEvent" ||
                  part.toolName === "deleteEvent"
                ) {
                  didMutateCalendar = true;
                }

                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      type: "tool-result",
                      toolName: part.toolName,
                    })}\n\n`
                  )
                );
                break;
              case "error":
                throw part.error;
            }
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "done",
                didMutateCalendar,
              })}\n\n`
            )
          );
          controller.close();
        } catch (error) {
          console.error("[AI Chat] AI generation error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message:
                  "I'm having trouble processing your request. Please try again.",
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
      },
    });
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
