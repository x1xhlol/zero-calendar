import { listUserEvents } from "@/lib/store";

export async function getEvents(userId: string, start: Date, end: Date) {
  try {
    const events = await listUserEvents(userId);

    if (!events || events.length === 0) {
      return [];
    }

    return events.filter((event) => {
      const eventStart = new Date(event.start);
      return eventStart >= start && eventStart <= end;
    });
  } catch (error) {
    console.error("Error fetching events:", error);

    return [];
  }
}

export async function findAvailableTimeSlots(
  userId: string,
  date: string,
  durationMinutes = 30
): Promise<any[]> {
  try {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await listUserEvents(userId);
    const dayEvents = events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        (eventStart >= startOfDay && eventStart <= endOfDay) ||
        (eventEnd >= startOfDay && eventEnd <= endOfDay) ||
        (eventStart <= startOfDay && eventEnd >= endOfDay)
      );
    });

    dayEvents.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const workStart = new Date(targetDate);
    workStart.setHours(9, 0, 0, 0);

    const workEnd = new Date(targetDate);
    workEnd.setHours(17, 0, 0, 0);

    const availableSlots = [];
    let currentTime = new Date(workStart);

    for (const event of dayEvents) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      if (eventEnd <= workStart || eventStart >= workEnd) {
        continue;
      }

      const effectiveStart = eventStart < workStart ? workStart : eventStart;
      const effectiveEnd = eventEnd > workEnd ? workEnd : eventEnd;

      if (
        effectiveStart.getTime() - currentTime.getTime() >=
        durationMinutes * 60 * 1000
      ) {
        availableSlots.push({
          start: currentTime.toISOString(),
          end: effectiveStart.toISOString(),
          duration: Math.floor(
            (effectiveStart.getTime() - currentTime.getTime()) / (1000 * 60)
          ),
        });
      }

      currentTime = new Date(effectiveEnd);
    }

    if (
      workEnd.getTime() - currentTime.getTime() >=
      durationMinutes * 60 * 1000
    ) {
      availableSlots.push({
        start: currentTime.toISOString(),
        end: workEnd.toISOString(),
        duration: Math.floor(
          (workEnd.getTime() - currentTime.getTime()) / (1000 * 60)
        ),
      });
    }

    return availableSlots;
  } catch (error) {
    console.error("Error finding available time slots:", error);
    return [];
  }
}

export async function checkForConflicts(
  userId: string,
  start: string,
  end: string
): Promise<boolean> {
  try {
    const startTime = new Date(start);
    const endTime = new Date(end);

    const dayStart = new Date(startTime);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(startTime);
    dayEnd.setHours(23, 59, 59, 999);

    const events = await listUserEvents(userId);
    const dayEvents = events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        (eventStart >= dayStart && eventStart <= dayEnd) ||
        (eventEnd >= dayStart && eventEnd <= dayEnd) ||
        (eventStart <= dayStart && eventEnd >= dayEnd)
      );
    });

    for (const event of dayEvents) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      if (
        (startTime >= eventStart && startTime < eventEnd) ||
        (endTime > eventStart && endTime <= eventEnd) ||
        (startTime <= eventStart && endTime >= eventEnd)
      ) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking for conflicts:", error);
    return false;
  }
}

export async function analyzeBusyTimes(
  userId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const events = await listUserEvents(userId);
    const rangeEvents = events.filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (
        (eventStart >= start && eventStart <= end) ||
        (eventEnd >= start && eventEnd <= end) ||
        (eventStart <= start && eventEnd >= end)
      );
    });

    const timeEvents = rangeEvents.filter((event) => !event.allDay);

    const busyByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];
    const eventsByDayOfWeek = [0, 0, 0, 0, 0, 0, 0];

    const busyByHour = new Array(24).fill(0);

    timeEvents.forEach((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      const dayOfWeek = eventStart.getDay();
      const durationMs = eventEnd.getTime() - eventStart.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      busyByDayOfWeek[dayOfWeek] += durationHours;
      eventsByDayOfWeek[dayOfWeek]++;

      const startHour = eventStart.getHours();
      const endHour = eventEnd.getHours() + (eventEnd.getMinutes() > 0 ? 1 : 0);

      for (let hour = startHour; hour < endHour; hour++) {
        if (hour >= 0 && hour < 24) {
          busyByHour[hour]++;
        }
      }
    });

    let busiestDayIndex = 0;
    let busiestDayHours = 0;
    busyByDayOfWeek.forEach((hours, index) => {
      if (hours > busiestDayHours) {
        busiestDayIndex = index;
        busiestDayHours = hours;
      }
    });

    let busiestHour = 0;
    let busiestHourCount = 0;
    busyByHour.forEach((count, hour) => {
      if (count > busiestHourCount) {
        busiestHour = hour;
        busiestHourCount = count;
      }
    });

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    return {
      totalEvents: timeEvents.length,
      busyByDayOfWeek,
      eventsByDayOfWeek,
      busyByHour,
      busiestDay: dayNames[busiestDayIndex],
      busiestDayHours,
      busiestHour,
      busiestHourCount,
    };
  } catch (error) {
    console.error("Error analyzing busy times:", error);
    return {
      totalEvents: 0,
      busyByDayOfWeek: [0, 0, 0, 0, 0, 0, 0],
      eventsByDayOfWeek: [0, 0, 0, 0, 0, 0, 0],
      busyByHour: new Array(24).fill(0),
      busiestDay: "Unknown",
      busiestDayHours: 0,
      busiestHour: 0,
      busiestHourCount: 0,
    };
  }
}
