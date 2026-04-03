import { generateText } from "ai";
import type { CalendarEvent } from "@/types/calendar";
import { processCalendarIntent } from "./ai-calendar-intent";
import { calendarTools } from "./ai-tools";
import { getOpenRouterModel, getOpenRouterProviderOptions } from "./openrouter";
import { getSystemPrompt } from "./system-prompts";

const calendarToolSchemas = {
  getEvents: {
    description: "Get events between two dates",
    parameters: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start date in ISO format" },
        endDate: { type: "string", description: "End date in ISO format" },
      },
      required: ["startDate", "endDate"],
    },
  },
  getTodayEvents: {
    description: "Get all events for today",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  createEvent: {
    description: "Create a new event with conflict checking",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Event title" },
        startTime: { type: "string", description: "Start time in ISO format" },
        endTime: { type: "string", description: "End time in ISO format" },
        description: {
          type: "string",
          description: "Event description (optional)",
        },
        location: { type: "string", description: "Event location (optional)" },
        color: { type: "string", description: "Event color (optional)" },
      },
      required: ["title", "startTime", "endTime"],
    },
  },
  updateEvent: {
    description: "Update an existing event with conflict checking",
    parameters: {
      type: "object",
      properties: {
        eventId: { type: "string", description: "ID of the event to update" },
        updates: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "New event title (optional)",
            },
            description: {
              type: "string",
              description: "New event description (optional)",
            },
            start: {
              type: "string",
              description: "New start time in ISO format (optional)",
            },
            end: {
              type: "string",
              description: "New end time in ISO format (optional)",
            },
            location: {
              type: "string",
              description: "New event location (optional)",
            },
            color: {
              type: "string",
              description: "New event color (optional)",
            },
          },
        },
      },
      required: ["eventId", "updates"],
    },
  },
  deleteEvent: {
    description: "Delete an event",
    parameters: {
      type: "object",
      properties: {
        eventId: { type: "string", description: "ID of the event to delete" },
      },
      required: ["eventId"],
    },
  },
  findEvents: {
    description: "Search for events by title or description",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
  findAvailableTimeSlots: {
    description: "Find available time slots on a specific date",
    parameters: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in ISO format" },
        durationMinutes: { type: "number", description: "Duration in minutes" },
      },
      required: ["date", "durationMinutes"],
    },
  },
  checkForConflicts: {
    description: "Check if a time slot conflicts with existing events",
    parameters: {
      type: "object",
      properties: {
        startTime: { type: "string", description: "Start time in ISO format" },
        endTime: { type: "string", description: "End time in ISO format" },
        buffer: {
          type: "number",
          description: "Buffer time in minutes (optional)",
        },
      },
      required: ["startTime", "endTime"],
    },
  },
  analyzeBusyTimes: {
    description: "Analyze calendar for busy times and patterns",
    parameters: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start date in ISO format" },
        endDate: { type: "string", description: "End date in ISO format" },
      },
      required: ["startDate", "endDate"],
    },
  },
  findOptimalMeetingTime: {
    description: "Find optimal meeting times",
    parameters: {
      type: "object",
      properties: {
        participantIds: {
          type: "array",
          items: { type: "string" },
          description: "List of participant IDs",
        },
        durationMinutes: {
          type: "number",
          description: "Meeting duration in minutes",
        },
        startDate: { type: "string", description: "Start date in ISO format" },
        endDate: { type: "string", description: "End date in ISO format" },
      },
      required: ["participantIds", "durationMinutes", "startDate", "endDate"],
    },
  },
  rescheduleEvent: {
    description: "Reschedule an event",
    parameters: {
      type: "object",
      properties: {
        eventId: {
          type: "string",
          description: "ID of the event to reschedule",
        },
        newStartTime: {
          type: "string",
          description: "New start time in ISO format",
        },
        newEndTime: {
          type: "string",
          description: "New end time in ISO format",
        },
      },
      required: ["eventId", "newStartTime", "newEndTime"],
    },
  },
};

async function executeToolCall(userId: string, toolName: string, args: any) {
  if (!calendarTools[toolName as keyof typeof calendarTools]) {
    console.warn(`Tool ${toolName} not found`);
    return {
      error: true,
      message: `Tool ${toolName} not found`,
    };
  }

  try {
    let argsArray: any[] = [];

    switch (toolName) {
      case "getEvents":
        argsArray = [userId, args.startDate, args.endDate];
        break;
      case "getTodayEvents":
        argsArray = [userId];
        break;
      case "createEvent":
        argsArray = [
          userId,
          args.title,
          args.startTime,
          args.endTime,
          args.description,
          args.location,
          args.color,
        ];
        break;
      case "updateEvent":
        argsArray = [userId, args.eventId, args.updates];
        break;
      case "deleteEvent":
        argsArray = [userId, args.eventId];
        break;
      case "findEvents":
        argsArray = [userId, args.query];
        break;
      case "findAvailableTimeSlots":
        argsArray = [userId, args.date, args.durationMinutes];
        break;
      case "checkForConflicts":
        argsArray = [userId, args.startTime, args.endTime, args.buffer];
        break;
      case "analyzeBusyTimes":
        argsArray = [userId, args.startDate, args.endDate];
        break;
      case "findOptimalMeetingTime":
        argsArray = [
          userId,
          args.participantIds,
          args.durationMinutes,
          args.startDate,
          args.endDate,
        ];
        break;
      case "rescheduleEvent":
        argsArray = [userId, args.eventId, args.newStartTime, args.newEndTime];
        break;
      default:
        return {
          error: true,
          message: `Unknown tool: ${toolName}`,
        };
    }

    try {
      const result = await calendarTools[toolName](...argsArray);
      return result;
    } catch (toolError) {
      console.error(`Error executing tool ${toolName}:`, toolError);
      return {
        error: true,
        message:
          toolError instanceof Error
            ? toolError.message
            : "Unknown error in tool execution",
      };
    }
  } catch (error) {
    console.error(`Error preparing tool ${toolName}:`, error);
    return {
      error: true,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function processCalendarQuery(
  query: string,
  userId: string,
  conversationHistory = ""
) {
  try {
    console.log("[AI] Processing calendar intent...");
    const intent = await processCalendarIntent(query);
    console.log("[AI] Detected intent:", intent.type);

    const systemPrompt = getSystemPrompt("calendar");

    const fullPrompt = conversationHistory
      ? `${conversationHistory}\n\nUser: ${query}`
      : query;

    try {
      if (
        intent.type === "create_event" ||
        intent.type === "update_event" ||
        intent.type === "delete_event"
      ) {
        const response = await generateText({
          model: getOpenRouterModel(),
          providerOptions: getOpenRouterProviderOptions(userId),
          prompt: fullPrompt,
          system: systemPrompt,
          temperature: 0.7,
          maxTokens: 800,
        });

        return response.text;
      }
      if (
        intent.type === "query_events" ||
        intent.type === "find_availability"
      ) {
        const initialResponse = await generateText({
          model: getOpenRouterModel(),
          providerOptions: getOpenRouterProviderOptions(userId),
          prompt: fullPrompt,
          system: systemPrompt,
          temperature: 0.7,
          maxTokens: 800,
          tools: calendarToolSchemas,
        });

        if (initialResponse.toolCalls && initialResponse.toolCalls.length > 0) {
          console.log("Tool calls detected:", initialResponse.toolCalls);

          const toolResults = await Promise.all(
            initialResponse.toolCalls.map(async (call) => {
              try {
                const result = await executeToolCall(
                  userId,
                  call.name,
                  call.arguments
                );
                return {
                  tool: call.name,
                  args: call.arguments,
                  result,
                };
              } catch (error) {
                console.error(`Error executing tool ${call.name}:`, error);
                return {
                  tool: call.name,
                  args: call.arguments,
                  result: {
                    error: true,
                    message:
                      error instanceof Error ? error.message : "Unknown error",
                  },
                };
              }
            })
          );

          console.log("Tool results:", JSON.stringify(toolResults, null, 2));

          try {
            const finalResponse = await generateText({
              model: getOpenRouterModel(),
              providerOptions: getOpenRouterProviderOptions(userId),
              prompt: `${fullPrompt}\n\nTool results: ${JSON.stringify(
                toolResults,
                null,
                2
              )}\n\nBased on these results, provide a helpful response to the user. Remember to use Markdown formatting for better readability.`,
              system: systemPrompt,
              temperature: 0.7,
              maxTokens: 800,
            });

            return finalResponse.text;
          } catch (finalError) {
            console.error("Error generating final response:", finalError);

            let fallbackResponse =
              "I found some information for you, but I'm having trouble formulating a complete response. Here's what I found:\n\n";

            toolResults.forEach((result) => {
              const toolName =
                result.tool.charAt(0).toUpperCase() +
                result.tool.slice(1).replace(/([A-Z])/g, " $1");

              if (result.result.error) {
                fallbackResponse += `**${toolName}**: Sorry, I couldn't complete this operation.\n`;
              } else {
                try {
                  const resultSummary = JSON.stringify(result.result, null, 2);
                  fallbackResponse += `### ${toolName}:\n\`\`\`json\n${resultSummary}\n\`\`\`\n\n`;
                } catch (_e) {
                  fallbackResponse += `**${toolName}**: Found some information but couldn't format it properly.\n\n`;
                }
              }
            });

            return fallbackResponse;
          }
        } else {
          console.log("No tool calls detected in the response");
          return initialResponse.text;
        }
      } else {
        const response = await generateText({
          model: getOpenRouterModel(),
          providerOptions: getOpenRouterProviderOptions(userId),
          prompt: fullPrompt,
          system: systemPrompt,
          temperature: 0.7,
          maxTokens: 800,
        });

        return response.text;
      }
    } catch (aiError) {
      console.error("Error with AI model:", aiError);

      try {
        const simpleResponse = await generateText({
          model: getOpenRouterModel(),
          providerOptions: getOpenRouterProviderOptions(userId),
          prompt: query,
          system:
            "You are a helpful calendar assistant. Respond to the user's query without using any special tools. Use Markdown formatting for better readability.",
          temperature: 0.7,
          maxTokens: 800,
        });

        return simpleResponse.text;
      } catch (simpleError) {
        console.error("Error with simple response:", simpleError);
        return "I'm sorry, I'm having trouble accessing the calendar system right now. How else can I assist you?";
      }
    }
  } catch (error) {
    console.error("Error in processCalendarQuery:", error);
    return "I'm sorry, I encountered an error while processing your request. Please try again.";
  }
}

export async function streamCalendarQuery(
  query: string,
  userId: string,
  onChunk: (chunk: string) => void,
  conversationHistory = ""
) {
  try {
    onChunk("Processing your request...");

    const response = await processCalendarQuery(
      query,
      userId,
      conversationHistory
    );

    onChunk(`\n\n${response}`);
  } catch (error) {
    console.error("Error in streamCalendarQuery:", error);
    onChunk(
      "\n\nI'm sorry, I encountered an error while processing your request. Please try again."
    );
  }
}

export async function generateEventSuggestion(
  description: string
): Promise<Partial<CalendarEvent>> {
  try {
    const intent = await processCalendarIntent(description);

    if (intent.type === "create_event") {
      return {
        title: intent.eventDetails.title,
        start: intent.eventDetails.startTime,
        end: intent.eventDetails.endTime,
        description: intent.eventDetails.description,
        location: intent.eventDetails.location,
        allDay: intent.eventDetails.allDay,
      };
    }

    const prompt = `
      Generate a calendar event based on this description: "${description}"
      
      Return a JSON object with these fields:
      - title: string (required) - A clear, descriptive title for the event
      - description: string (optional) - Any details about the event
      - start: ISO date string (required) - The start time of the event
      - end: ISO date string (required) - The end time of the event
      - location: string (optional) - Where the event takes place
      - category: string (optional) - A category for the event
      - allDay: boolean (optional) - Whether this is an all-day event
      
      Current date and time: ${new Date().toISOString()}
      
      IMPORTANT: Parse the description carefully to extract accurate date, time, and duration information.
      If a specific time is mentioned (like "11:00 AM"), do NOT make it an all-day event.
      If no specific time is mentioned, you can set it as an all-day event.
      Make sure the end time is appropriate for the event type (typically 30-60 minutes for meetings).
    `;

    try {
      const { text } = await generateText({
        model: getOpenRouterModel(),
        providerOptions: getOpenRouterProviderOptions(),
        prompt,
        temperature: 0.2,
        maxTokens: 1000,
      });

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from the response");
      }

      try {
        const parsedJson = JSON.parse(jsonMatch[0]);

        if (!(parsedJson.title && parsedJson.start && parsedJson.end)) {
          throw new Error("Missing required fields in generated event");
        }

        if (parsedJson.allDay === undefined) {
          const startDate = new Date(parsedJson.start);
          parsedJson.allDay =
            startDate.getHours() === 0 && startDate.getMinutes() === 0;
        }

        return parsedJson;
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        throw new Error("Failed to parse JSON from AI response");
      }
    } catch (aiError) {
      console.error("AI error:", aiError);

      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      return {
        title: description || "New Event",
        start: now.toISOString(),
        end: oneHourLater.toISOString(),
        description: "Created from natural language input",
        allDay: false,
      };
    }
  } catch (error) {
    console.error("Error generating event suggestion:", error);
    throw new Error(
      `Error generating event suggestion: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function executeAIToolCall(
  userId: string,
  tool: string,
  args: any[]
) {
  if (!calendarTools[tool as keyof typeof calendarTools]) {
    throw new Error(`Tool ${tool} not found`);
  }

  if (args[0] !== userId) {
    args.unshift(userId);
  }

  try {
    return await calendarTools[tool](...args);
  } catch (error) {
    console.error(`Error executing tool ${tool}:`, error);
    throw error;
  }
}
