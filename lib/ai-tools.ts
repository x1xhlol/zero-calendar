import {
  addDays,
  areIntervalsOverlapping,
  endOfDay,
  format,
  isSameDay,
  startOfDay,
} from "date-fns";
import {
  createEvent,
  deleteEvent,
  getEvents,
  getTodayEvents,
  updateEvent,
} from "./calendar";
import {
  analyzeBusyTimes,
  checkForConflicts,
  findAvailableTimeSlots,
} from "./calendar-utils";

export const calendarTools = {
  getEvents,
  getTodayEvents,
  createEvent,
  updateEvent,
  deleteEvent,

  findEvents: async (userId: string, query: string) => {
    const now = new Date();
    const thirtyDaysLater = new Date(now);
    thirtyDaysLater.setDate(now.getDate() + 30);

    const events = await getEvents(
      userId,
      now.toISOString(),
      thirtyDaysLater.toISOString()
    );
    const lowerQuery = query.toLowerCase();

    return events.filter(
      (event) =>
        event.title?.toLowerCase().includes(lowerQuery) ||
        event.description?.toLowerCase().includes(lowerQuery) ||
        event.location?.toLowerCase().includes(lowerQuery)
    );
  },

  findAvailableTimeSlots,
  checkForConflicts,
  analyzeBusyTimes,

  findOptimalMeetingTime: async (
    userId: string,
    _participantIds: string[],
    durationMinutes: number,
    startDate: string,
    _endDate: string
  ) => {
    return await findAvailableTimeSlots(userId, startDate, durationMinutes);
  },

  rescheduleEvent: async (
    userId: string,
    eventId: string,
    newStartTime: string,
    newEndTime: string
  ) => {
    return await updateEvent(userId, eventId, {
      start: newStartTime,
      end: newEndTime,
    });
  },

  getCalendarAnalytics: async (
    userId: string,
    startDate: string,
    endDate: string
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const events = await getEvents(userId, start, end);

    let totalMeetingMinutes = 0;
    let meetingCount = 0;
    const categoryCounts: Record<string, number> = {};
    const dailyMeetingMinutes: Record<string, number> = {};

    events.forEach((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      if (event.allDay) {
        return;
      }

      const durationMinutes =
        (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60);
      totalMeetingMinutes += durationMinutes;
      meetingCount++;

      if (event.categories && event.categories.length > 0) {
        event.categories.forEach((category) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      } else {
        categoryCounts.Uncategorized = (categoryCounts.Uncategorized || 0) + 1;
      }

      const dateKey = format(eventStart, "yyyy-MM-dd");
      dailyMeetingMinutes[dateKey] =
        (dailyMeetingMinutes[dateKey] || 0) + durationMinutes;
    });

    const dayCount = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageDailyMeetingMinutes = totalMeetingMinutes / dayCount;

    let busiestDay = "";
    let busiestDayMinutes = 0;

    Object.entries(dailyMeetingMinutes).forEach(([date, minutes]) => {
      if (minutes > busiestDayMinutes) {
        busiestDay = date;
        busiestDayMinutes = minutes;
      }
    });

    return {
      totalMeetingMinutes,
      totalMeetingHours: Math.round((totalMeetingMinutes / 60) * 10) / 10,
      meetingCount,
      averageMeetingLength:
        meetingCount > 0 ? Math.round(totalMeetingMinutes / meetingCount) : 0,
      averageDailyMeetingMinutes: Math.round(averageDailyMeetingMinutes),
      averageDailyMeetingHours:
        Math.round((averageDailyMeetingMinutes / 60) * 10) / 10,
      categoryCounts,
      busiestDay,
      busiestDayMinutes,
      busiestDayHours: Math.round((busiestDayMinutes / 60) * 10) / 10,
      dailyMeetingMinutes,
    };
  },

  findFreeTimeSlots: async (
    userId: string,
    startDate: string,
    endDate: string,
    minDurationMinutes = 30
  ) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const events = await getEvents(userId, start, end);
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const freeSlots = [];
    let currentDay = startOfDay(start);
    const lastDay = endOfDay(end);

    while (currentDay <= lastDay) {
      const dayStart = new Date(currentDay);
      dayStart.setHours(9, 0, 0, 0);

      const dayEnd = new Date(currentDay);
      dayEnd.setHours(17, 0, 0, 0);

      if (dayEnd < start || dayStart > end) {
        currentDay = addDays(currentDay, 1);
        continue;
      }

      const effectiveDayStart = dayStart < start ? start : dayStart;
      const effectiveDayEnd = dayEnd > end ? end : dayEnd;

      const dayEvents = sortedEvents.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return areIntervalsOverlapping(
          { start: effectiveDayStart, end: effectiveDayEnd },
          { start: eventStart, end: eventEnd }
        );
      });

      const augmentedEvents = [
        {
          start: effectiveDayStart.toISOString(),
          end: effectiveDayStart.toISOString(),
        },
        ...dayEvents,
        {
          start: effectiveDayEnd.toISOString(),
          end: effectiveDayEnd.toISOString(),
        },
      ];

      for (let i = 0; i < augmentedEvents.length - 1; i++) {
        const currentEventEnd = new Date(augmentedEvents[i].end);
        const nextEventStart = new Date(augmentedEvents[i + 1].start);

        if (
          nextEventStart.getTime() - currentEventEnd.getTime() >=
          minDurationMinutes * 60 * 1000
        ) {
          freeSlots.push({
            start: currentEventEnd.toISOString(),
            end: nextEventStart.toISOString(),
            duration: Math.floor(
              (nextEventStart.getTime() - currentEventEnd.getTime()) /
                (1000 * 60)
            ),
            label: `${format(currentEventEnd, "EEE, MMM d, h:mm a")} - ${format(nextEventStart, "h:mm a")}`,
          });
        }
      }

      currentDay = addDays(currentDay, 1);
    }

    return {
      freeSlots,
      totalFreeSlots: freeSlots.length,
      totalFreeDurationMinutes: freeSlots.reduce(
        (total, slot) => total + slot.duration,
        0
      ),
    };
  },

  suggestRescheduling: async (userId: string, eventId: string) => {
    const now = new Date();
    const futureDate = addDays(now, 14);
    const events = await getEvents(userId, now, futureDate);

    const eventToReschedule = events.find((event) => event.id === eventId);
    if (!eventToReschedule) {
      return {
        success: false,
        message: "Event not found",
      };
    }

    const eventStart = new Date(eventToReschedule.start);
    const eventEnd = new Date(eventToReschedule.end);
    const durationMinutes = Math.floor(
      (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60)
    );

    const result = await calendarTools.findFreeTimeSlots(
      userId,
      now.toISOString(),
      futureDate.toISOString(),
      durationMinutes
    );

    const alternativeSlots = result.freeSlots
      .filter((slot) => !isSameDay(new Date(slot.start), eventStart))
      .slice(0, 3);

    return {
      success: true,
      event: {
        id: eventToReschedule.id,
        title: eventToReschedule.title,
        start: eventToReschedule.start,
        end: eventToReschedule.end,
        duration: durationMinutes,
      },
      alternativeSlots,
    };
  },
};

export function getCalendarTools() {
  return calendarTools;
}
