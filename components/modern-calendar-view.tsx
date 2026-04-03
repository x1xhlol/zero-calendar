"use client";

import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOutIcon,
  MaximizeIcon,
  MessageSquareIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  SendIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { CalendarCategory, CalendarEvent } from "@/types/calendar";
import { EventDialog } from "./event-dialog";
import { QuickEventDialog } from "./quick-event-dialog";

type ViewMode = "day" | "week" | "month" | "year";

interface GoogleCalendar {
  backgroundColor: string;
  id: string;
  primary: boolean;
  summary: string;
  visible: boolean;
}

interface ModernCalendarViewProps {
  initialCategories?: CalendarCategory[];
  initialEvents: CalendarEvent[];
  userEmail?: string;
  userId?: string;
  userImage?: string;
  userName?: string;
  userProvider?: string;
}

export function ModernCalendarView({
  initialEvents,
  initialCategories = [],
  userId,
  userEmail,
  userName,
  userImage,
  userProvider,
}: ModernCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showQuickEventDialog, setShowQuickEventDialog] = useState(false);
  const [quickEventDate, setQuickEventDate] = useState<Date | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatSize, setChatSize] = useState<
    "normal" | "minimized" | "maximized"
  >("normal");
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId] = useState(() => crypto.randomUUID());
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const { toast } = useToast();

  const _userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [categories, setCategories] =
    useState<CalendarCategory[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");

  const isLoggedIn = !!userId;

  useEffect(() => {
    const fetchGoogleCalendars = async () => {
      if (userProvider === "google" && isLoggedIn) {
        try {
          const response = await fetch("/api/calendars/google-list");
          if (response.ok) {
            const data = await response.json();
            setGoogleCalendars(
              data.calendars.map((cal: any) => ({
                ...cal,
                visible: true, // all calendars visible by default
              }))
            );
          }
        } catch (error) {
          console.error("[v0] Failed to fetch Google Calendars:", error);
        }
      }
    };

    fetchGoogleCalendars();
  }, [userProvider, isLoggedIn]);

  useEffect(() => {
    const syncCalendar = async () => {
      if (userProvider === "google" && isLoggedIn) {
        try {
          await fetch("/api/calendar/sync", { method: "POST" });
          // Refresh events after sync
          await refreshEvents();
        } catch (error) {
          console.error("[v0] Auto-sync failed:", error);
        }
      }
    };

    // Initial sync
    syncCalendar();

    // Set up interval for auto-sync every 2 minutes
    const interval = setInterval(syncCalendar, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userProvider, isLoggedIn, refreshEvents]);

  const refreshEvents = async () => {
    if (!userId) {
      return;
    }

    let start: Date, end: Date;

    switch (viewMode) {
      case "day":
        start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
        break;
      case "month":
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
        break;
      case "year":
        start = startOfYear(currentDate);
        end = endOfYear(currentDate);
        break;
    }

    const response = await fetch(
      `/api/calendar/events?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
    );

    if (!response.ok) {
      throw new Error("Failed to refresh events");
    }

    const data = await response.json();
    setEvents(data.events);
  };

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const handlePrevious = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate((prev) => subDays(prev, 1));
        break;
      case "week":
        setCurrentDate((prev) => subWeeks(prev, 1));
        break;
      case "month":
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case "year":
        setCurrentDate((prev) => subYears(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case "day":
        setCurrentDate((prev) => addDays(prev, 1));
        break;
      case "week":
        setCurrentDate((prev) => addWeeks(prev, 1));
        break;
      case "month":
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case "year":
        setCurrentDate((prev) => addYears(prev, 1));
        break;
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDialog(true);
  };

  const toggleCalendarVisibility = async (calendarId: string) => {
    setGoogleCalendars((prev) =>
      prev.map((cal) =>
        cal.id === calendarId ? { ...cal, visible: !cal.visible } : cal
      )
    );
  };

  const getEventColor = (event: CalendarEvent) => {
    const colors: Record<string, string> = {
      Work: "bg-emerald-500",
      Personal: "bg-blue-500",
      Family: "bg-purple-500",
      Meeting: "bg-red-500",
    };
    return colors[event.category || ""] || "bg-blue-500";
  };

  const miniCalendarDays = useMemo(() => {
    const year = miniCalendarDate.getFullYear();
    const month = miniCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const _lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const calendarStart = subDays(firstDay, startingDayOfWeek);
    const calendarEnd = addDays(calendarStart, 41);
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [miniCalendarDate]);

  const renderCalendarView = () => {
    switch (viewMode) {
      case "day":
        return renderDayView();
      case "week":
        return renderWeekView();
      case "month":
        return renderMonthView();
      case "year":
        return renderYearView();
    }
  };

  const renderDayView = () => {
    const dayEvents = events.filter((event) => {
      if (!event.start) {
        return false;
      }
      const eventStart = new Date(event.start);
      return isSameDay(eventStart, currentDate);
    });

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="feature-card-large h-full overflow-hidden rounded-2xl">
        <div className="grid h-full grid-cols-1 divide-y divide-white/[0.06] overflow-auto">
          {hours.map((hour) => (
            <div
              className="flex min-h-[60px] transition-colors hover:bg-white/[0.02]"
              key={hour}
            >
              <div className="w-20 flex-shrink-0 p-3 text-sm text-white/50">
                {format(new Date().setHours(hour, 0), "h:mm a")}
              </div>
              <div className="relative flex-1 p-2">
                {dayEvents
                  .filter((event) => {
                    const eventHour = new Date(event.start).getHours();
                    return eventHour === hour;
                  })
                  .map((event) => (
                    <div
                      className={cn(
                        "mb-1 cursor-pointer rounded-lg px-3 py-2 text-white text-xs transition-all hover:scale-[1.02]",
                        getEventColor(event)
                      )}
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="mt-0.5 text-[10px] text-white/70">
                        {format(new Date(event.start), "h:mm a")} -{" "}
                        {format(new Date(event.end), "h:mm a")}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="feature-card-large flex h-full flex-col overflow-hidden rounded-2xl">
        <div className="sticky top-0 z-10 grid grid-cols-8 border-white/[0.08] border-b bg-white/[0.02]">
          <div className="w-20 p-3" />
          {weekDays.map((day) => (
            <div className="px-2 py-3 text-center" key={day.toISOString()}>
              <div className="mb-1 text-white/50 text-xs">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "mx-auto flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm",
                  isSameDay(day, new Date()) && "bg-blue-500 text-white"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-8 divide-x divide-white/[0.06] overflow-auto">
          <div className="col-span-1">
            {hours.map((hour) => (
              <div
                className="h-[60px] border-white/[0.06] border-b p-2 text-right text-white/50 text-xs"
                key={hour}
              >
                {format(new Date().setHours(hour, 0), "ha")}
              </div>
            ))}
          </div>
          {weekDays.map((day) => (
            <div className="col-span-1" key={day.toISOString()}>
              {hours.map((hour) => {
                const dayEvents = events.filter((event) => {
                  if (!event.start) {
                    return false;
                  }
                  const eventStart = new Date(event.start);
                  return (
                    isSameDay(eventStart, day) && eventStart.getHours() === hour
                  );
                });

                return (
                  <div
                    className="h-[60px] border-white/[0.06] border-b p-1 transition-colors hover:bg-white/[0.02]"
                    key={hour}
                  >
                    {dayEvents.map((event) => (
                      <div
                        className={cn(
                          "mb-0.5 cursor-pointer rounded px-1.5 py-1 text-[10px] text-white transition-all hover:scale-[1.02]",
                          getEventColor(event)
                        )}
                        key={event.id}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="truncate font-medium">
                          {event.title}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const _lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const calendarStart = subDays(firstDay, startingDayOfWeek);
    const calendarEnd = addDays(calendarStart, 41);
    const daysInterval = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    const daysInMonth = daysInterval.map((date) => {
      const dayEvents = events.filter((event) => {
        if (!event.start) {
          return false;
        }
        const eventStart = new Date(event.start);
        return isSameDay(eventStart, date);
      });

      return {
        date,
        isCurrentMonth: isSameMonth(date, currentDate),
        events: dayEvents,
      };
    });

    return (
      <div className="feature-card-large flex h-full flex-col overflow-hidden rounded-2xl">
        <div className="grid grid-cols-7 border-white/[0.08] border-b bg-white/[0.02]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              className="py-4 text-center font-medium text-sm text-white/50"
              key={day}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7 overflow-auto">
          <AnimatePresence mode="wait">
            {daysInMonth.map((day, index) => (
              <motion.div
                animate={{ opacity: 1 }}
                className={cn(
                  "min-h-[100px] cursor-pointer border-white/[0.06] border-r border-b p-3",
                  !day.isCurrentMonth && "bg-white/[0.01]",
                  isSameDay(day.date, new Date()) &&
                    "border-blue-500/20 bg-blue-500/[0.08]"
                )}
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                key={day.date.toISOString()}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (!target.closest(".day-number")) {
                    setQuickEventDate(day.date);
                    setShowQuickEventDialog(true);
                  }
                }}
                transition={{ duration: 0.2, delay: index * 0.01 }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={cn(
                      "day-number cursor-pointer rounded-full font-medium text-sm transition-colors hover:bg-white/[0.08]",
                      !day.isCurrentMonth && "text-white/30",
                      isSameDay(day.date, new Date())
                        ? "flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-white"
                        : "flex h-7 w-7 items-center justify-center text-white/70"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDate(day.date);
                      setViewMode("day");
                    }}
                  >
                    {format(day.date, "d")}
                  </span>
                </div>
                <div className="space-y-1">
                  {day.events.slice(0, 2).map((event) => (
                    <div
                      className={cn(
                        "cursor-pointer rounded-md px-2 py-1 text-white text-xs",
                        getEventColor(event)
                      )}
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    >
                      <div className="truncate font-medium">{event.title}</div>
                    </div>
                  ))}
                  {day.events.length > 2 && (
                    <div className="pl-2 text-white/40 text-xs">
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const _year = currentDate.getFullYear();
    const months = eachMonthOfInterval({
      start: startOfYear(currentDate),
      end: endOfYear(currentDate),
    });

    return (
      <div className="grid h-full grid-cols-3 gap-4 overflow-auto pb-4">
        {months.map((monthDate) => {
          const firstDay = startOfMonth(monthDate);
          const _lastDay = endOfMonth(monthDate);
          const startingDayOfWeek = firstDay.getDay();
          const calendarStart = subDays(firstDay, startingDayOfWeek);
          const calendarEnd = addDays(calendarStart, 34);
          const days = eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd,
          });

          const monthEvents = events.filter((event) => {
            if (!event.start) {
              return false;
            }
            const eventStart = new Date(event.start);
            return eventStart.getMonth() === monthDate.getMonth();
          });

          return (
            <div
              className="feature-card overflow-hidden rounded-xl"
              key={monthDate.toISOString()}
            >
              <div className="border-white/[0.08] border-b bg-white/[0.02] p-3">
                <div className="font-semibold text-sm">
                  {format(monthDate, "MMMM")}
                </div>
              </div>
              <div className="p-2">
                <div className="mb-1 grid grid-cols-7 gap-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div
                      className="text-center font-medium text-[10px] text-white/40"
                      key={i}
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day) => {
                    const hasEvents = monthEvents.some((event) =>
                      isSameDay(new Date(event.start), day)
                    );
                    return (
                      <div
                        className={cn(
                          "flex aspect-square cursor-pointer items-center justify-center rounded text-[10px] transition-colors hover:bg-white/[0.08]",
                          !isSameMonth(day, monthDate) && "text-white/20",
                          isSameDay(day, new Date()) &&
                            "bg-blue-500 font-semibold text-white",
                          hasEvents &&
                            !isSameDay(day, new Date()) &&
                            "bg-white/[0.04]"
                        )}
                        key={day.toISOString()}
                        onClick={() => {
                          setCurrentDate(day);
                          setViewMode("day");
                        }}
                      >
                        {format(day, "d")}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) {
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput("");

    // Add user message to chat
    setChatMessages((prev) => [
      ...prev,
      { role: "user", content: userMessage },
    ]);
    setChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationId,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          currentDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Add assistant response to chat
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error("[v0] Chat error:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      if (!userId) {
        return;
      }
      try {
        const response = await fetch(
          `/api/calendars?userId=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }

        const data = await response.json();
        setCategories(data.calendars);
      } catch (error) {
        console.error("[v0] Failed to fetch user categories:", error);
      }
    };

    fetchCategories();
  }, [userId]);

  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="flex w-64 flex-shrink-0 flex-col space-y-4 overflow-auto border-white/[0.06] border-r p-4">
        {/* Mini Calendar */}
        <div className="feature-card rounded-xl p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-xs">
              {format(miniCalendarDate, "MMMM yyyy")}
            </h3>
            <div className="flex gap-1">
              <Button
                className="h-6 w-6 rounded-md hover:bg-white/[0.08]"
                onClick={() =>
                  setMiniCalendarDate(subMonths(miniCalendarDate, 1))
                }
                size="icon"
                variant="ghost"
              >
                <ChevronLeftIcon className="h-3 w-3" />
              </Button>
              <Button
                className="h-6 w-6 rounded-md hover:bg-white/[0.08]"
                onClick={() =>
                  setMiniCalendarDate(addMonths(miniCalendarDate, 1))
                }
                size="icon"
                variant="ghost"
              >
                <ChevronRightIcon className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="mb-2 grid grid-cols-7 gap-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
              <div
                className="text-center font-medium text-[10px] text-white/40"
                key={i}
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {miniCalendarDays.map((day) => {
              const hasEvents = events.some((event) =>
                isSameDay(new Date(event.start), day)
              );
              return (
                <button
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-md text-[10px] transition-all hover:bg-white/[0.08]",
                    !isSameMonth(day, miniCalendarDate) && "text-white/20",
                    isSameDay(day, new Date()) &&
                      "bg-blue-500 font-semibold text-white",
                    hasEvents &&
                      !isSameDay(day, new Date()) &&
                      "bg-white/[0.04] font-medium"
                  )}
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day);
                    setViewMode("day");
                  }}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create Event Button */}
        <Button
          className="h-11 w-full rounded-xl bg-blue-500 font-medium text-white hover:bg-blue-600"
          onClick={() => {
            setSelectedEvent(null);
            setShowEventDialog(true);
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Event
        </Button>

        {/* Google Calendars List */}
        {userProvider === "google" && googleCalendars.length > 0 && (
          <div className="feature-card rounded-xl p-3">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-semibold text-xs">My Calendars</span>
            </div>
            <div className="space-y-2">
              {googleCalendars.map((calendar) => (
                <div
                  className="flex items-center justify-between gap-2 py-1"
                  key={calendar.id}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div
                      className="h-3 w-3 flex-shrink-0 rounded-sm"
                      style={{ backgroundColor: calendar.backgroundColor }}
                    />
                    <span className="truncate text-white/70 text-xs">
                      {calendar.summary}
                      {calendar.primary && (
                        <span className="ml-1 text-white/40">(Primary)</span>
                      )}
                    </span>
                  </div>
                  <Switch
                    checked={calendar.visible}
                    className="scale-75"
                    onCheckedChange={() =>
                      toggleCalendarVisibility(calendar.id)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Calendar Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between border-white/[0.06] border-b p-4"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-xl tracking-tight">
              {viewMode === "day" && format(currentDate, "MMMM d, yyyy")}
              {viewMode === "week" &&
                `Week of ${format(startOfWeek(currentDate), "MMM d")}`}
              {viewMode === "month" && format(currentDate, "MMMM yyyy")}
              {viewMode === "year" && format(currentDate, "yyyy")}
            </h2>
            <div className="flex items-center gap-1">
              <Button
                className="h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]"
                onClick={handlePrevious}
                size="icon"
                variant="ghost"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                className="h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]"
                onClick={handleNext}
                size="icon"
                variant="ghost"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm hover:bg-white/[0.08]"
              onClick={handleToday}
              size="sm"
              variant="ghost"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Select
              onValueChange={(value) => setViewMode(value as ViewMode)}
              value={viewMode}
            >
              <SelectTrigger className="h-8 w-28 rounded-lg border-white/[0.08] bg-white/[0.04] text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass rounded-xl border-white/[0.08]">
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <SearchIcon className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
              <Input
                className="h-8 w-48 rounded-lg border-white/[0.08] bg-white/[0.04] pl-9 text-sm focus-visible:ring-white/20"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                value={searchQuery}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-9 w-9 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.08] p-0 hover:bg-white/[0.12]"
                  size="icon"
                  variant="ghost"
                >
                  {userImage ? (
                    <img
                      alt={userName}
                      className="h-full w-full object-cover"
                      src={userImage || "/placeholder.svg"}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600 font-semibold text-sm text-white">
                      {userName?.[0] || <UserIcon className="h-4 w-4" />}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass mt-2 w-56 rounded-xl border-white/[0.08] p-1 shadow-xl"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <div className="flex flex-col space-y-1">
                    <p className="font-semibold text-sm text-white">
                      {userName}
                    </p>
                    <p className="text-white/50 text-xs">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem className="cursor-pointer rounded-lg text-white/80 hover:text-white focus:bg-white/[0.08] focus:text-white">
                  <UserIcon className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <Link href="/settings" prefetch>
                  <DropdownMenuItem className="cursor-pointer rounded-lg text-white/80 hover:text-white focus:bg-white/[0.08] focus:text-white">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg text-red-400 hover:text-red-300 focus:bg-white/[0.08] focus:text-red-300"
                  onClick={async () => {
                    await authClient.signOut();
                    window.location.href = "/";
                  }}
                >
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </motion.div>

        {/* Calendar View */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 overflow-hidden p-4"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {renderCalendarView()}
        </motion.div>
      </div>

      {/* AI Chat */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              width:
                chatSize === "minimized"
                  ? 320
                  : chatSize === "maximized"
                    ? 600
                    : 400,
              height:
                chatSize === "minimized"
                  ? 60
                  : chatSize === "maximized"
                    ? 700
                    : 500,
            }}
            className="glass fixed right-6 bottom-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl"
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between border-white/[0.08] border-b bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Zero</h3>
                  <p className="text-white/50 text-xs">Your AI Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  className="h-7 w-7 rounded-md hover:bg-white/[0.08]"
                  onClick={() =>
                    setChatSize(
                      chatSize === "minimized" ? "normal" : "minimized"
                    )
                  }
                  size="icon"
                  variant="ghost"
                >
                  <MinusIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  className="h-7 w-7 rounded-md hover:bg-white/[0.08]"
                  onClick={() =>
                    setChatSize(
                      chatSize === "maximized" ? "normal" : "maximized"
                    )
                  }
                  size="icon"
                  variant="ghost"
                >
                  <MaximizeIcon className="h-3.5 w-3.5" />
                </Button>
                <Button
                  className="h-7 w-7 rounded-md hover:bg-white/[0.08]"
                  onClick={() => setShowAIChat(false)}
                  size="icon"
                  variant="ghost"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {chatSize !== "minimized" && (
              <>
                {/* Chat Content */}
                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    {chatMessages.length === 0 && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                          <SparklesIcon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] p-3 text-sm">
                            <p>
                              Hi! I'm Zero, your calendar assistant. I can help
                              you create events, schedule meetings, and manage
                              your calendar. Try saying:
                            </p>
                            <ul className="mt-2 space-y-1 text-white/70 text-xs">
                              <li>• "Schedule a meeting tomorrow at 2pm"</li>
                              <li>• "Show my events this week"</li>
                              <li>• "Create a reminder for next Monday"</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {chatMessages.map((msg, idx) => (
                      <div
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                        key={idx}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                            <SparklesIcon className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div
                            className={`rounded-2xl p-3 text-sm ${
                              msg.role === "user"
                                ? "ml-12 rounded-tr-sm bg-blue-500"
                                : "rounded-tl-sm bg-white/[0.06]"
                            }`}
                          >
                            {msg.role === "assistant" ? (
                              <Streamdown className="max-w-none text-sm [&_[data-streamdown='link']]:text-cyan-300">
                                {msg.content}
                              </Streamdown>
                            ) : (
                              <p className="whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {chatLoading && (
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                          <SparklesIcon className="h-4 w-4 animate-pulse text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="rounded-2xl rounded-tl-sm bg-white/[0.06] p-3 text-sm">
                            <p className="text-white/50">Thinking...</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Input */}
                <div className="border-white/[0.08] border-t bg-white/[0.01] p-4">
                  <div className="relative">
                    <Input
                      className="h-10 rounded-xl border-white/[0.08] bg-white/[0.04] pr-10 text-sm focus-visible:ring-white/20"
                      disabled={chatLoading}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Type your message..."
                      value={chatInput}
                    />
                    <Button
                      className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                      disabled={!chatInput.trim() || chatLoading}
                      onClick={handleSendMessage}
                      size="icon"
                    >
                      <SendIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Floating Button */}
      {!showAIChat && (
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="fixed right-6 bottom-6 z-50"
          initial={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Button
            className="glass h-14 w-14 rounded-full border border-white/[0.08] shadow-2xl transition-transform duration-300 hover:scale-110"
            onClick={() => setShowAIChat(true)}
            size="icon"
          >
            <MessageSquareIcon className="h-6 w-6 text-white" />
          </Button>
        </motion.div>
      )}

      {/* Dialogs */}
      <EventDialog
        categories={categories}
        event={selectedEvent}
        onEventDeleted={refreshEvents}
        onEventUpdated={refreshEvents}
        onOpenChange={setShowEventDialog}
        open={showEventDialog}
        userId={userId}
      />

      <QuickEventDialog
        onEventCreated={refreshEvents}
        onOpenChange={setShowQuickEventDialog}
        open={showQuickEventDialog}
        selectedDate={quickEventDate}
        userId={userId}
      />
    </div>
  );
}
