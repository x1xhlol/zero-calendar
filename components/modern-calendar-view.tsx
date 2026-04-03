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
  MenuIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { CalendarCategory, CalendarEvent } from "@/types/calendar";
import { AiPanel } from "./ai-panel";
import { EventDetailPanel } from "./event-detail-panel";

type ViewMode = "day" | "week" | "month" | "year";
type RightPanel = "none" | "event" | "ai";

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

const EVENT_COLORS: Record<string, string> = {
  Work: "text-emerald-400",
  Personal: "text-blue-400",
  Family: "text-purple-400",
  Meeting: "text-amber-400",
};

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
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
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");
  const [eventPanelMode, setEventPanelMode] = useState<"create" | "edit" | "view">("create");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [categories, setCategories] = useState<CalendarCategory[]>(initialCategories);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isMobile = useIsMobile();
  const isLoggedIn = !!userId;

  const refreshEvents = useCallback(async () => {
    if (!userId) return;

    let start: Date;
    let end: Date;

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

    if (!response.ok) throw new Error("Failed to refresh events");
    const data = await response.json();
    setEvents(data.events);
  }, [currentDate, userId, viewMode]);

  useEffect(() => {
    router.prefetch("/settings");
  }, [router]);

  useEffect(() => {
    if (userProvider === "google" && isLoggedIn) {
      fetch("/api/calendars/google-list")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.calendars) {
            setGoogleCalendars(data.calendars.map((cal: GoogleCalendar) => ({ ...cal, visible: true })));
          }
        })
        .catch(() => {});
    }
  }, [userProvider, isLoggedIn]);

  useEffect(() => {
    if (userProvider === "google" && isLoggedIn) {
      const syncNow = async () => {
        try {
          await fetch("/api/calendar/sync", { method: "POST" });
          await refreshEvents();
        } catch {}
      };

      syncNow();

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          void syncNow();
        }
      };

      window.addEventListener("focus", syncNow);
      document.addEventListener("visibilitychange", handleVisibilityChange);

      const interval = setInterval(syncNow, 30 * 1000);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", syncNow);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [userProvider, isLoggedIn, refreshEvents]);

  useEffect(() => {
    void refreshEvents().catch(() => {});
  }, [refreshEvents]);

  useEffect(() => {
    if (!isMobile || rightPanel === "none") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, rightPanel]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/calendars?userId=${encodeURIComponent(userId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.calendars) setCategories(data.calendars); })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "n") {
        e.preventDefault();
        openCreatePanel(new Date());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openCreatePanel = (date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setEventPanelMode("create");
    setRightPanel("event");
    setSidebarOpen(false);
  };

  const openEditPanel = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(event.start ? new Date(event.start) : null);
    setEventPanelMode("edit");
    setRightPanel("event");
    setSidebarOpen(false);
  };

  const openAiPanel = () => {
    setRightPanel("ai");
    setSidebarOpen(false);
  };

  const closePanel = () => {
    setRightPanel("none");
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handlePrevious = () => {
    const fns: Record<ViewMode, (d: Date) => Date> = {
      day: (d) => subDays(d, 1),
      week: (d) => subWeeks(d, 1),
      month: (d) => subMonths(d, 1),
      year: (d) => subYears(d, 1),
    };
    setCurrentDate((prev) => fns[viewMode](prev));
  };

  const handleNext = () => {
    const fns: Record<ViewMode, (d: Date) => Date> = {
      day: (d) => addDays(d, 1),
      week: (d) => addWeeks(d, 1),
      month: (d) => addMonths(d, 1),
      year: (d) => addYears(d, 1),
    };
    setCurrentDate((prev) => fns[viewMode](prev));
  };

  const getEventColor = (event: CalendarEvent) =>
    EVENT_COLORS[event.categories?.[0] || ""] || "text-blue-400";

  const miniCalendarDays = useMemo(() => {
    const firstDay = new Date(miniCalendarDate.getFullYear(), miniCalendarDate.getMonth(), 1);
    const calendarStart = subDays(firstDay, firstDay.getDay());
    return eachDayOfInterval({ start: calendarStart, end: addDays(calendarStart, 41) });
  }, [miniCalendarDate]);

  const toggleCalendarVisibility = (calendarId: string) => {
    setGoogleCalendars((prev) =>
      prev.map((cal) => (cal.id === calendarId ? { ...cal, visible: !cal.visible } : cal))
    );
  };

  const navigateMiniDay = (day: Date) => {
    setCurrentDate(day);
    setViewMode("day");
    setSidebarOpen(false);
  };

  /* ─── View Renderers ────────────────────────── */

  const renderDayView = () => {
    const dayEvents = events.filter((e) => e.start && isSameDay(new Date(e.start), currentDate));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="liquid-glass-subtle h-full overflow-hidden rounded-2xl">
        <div className="h-full divide-y divide-white/[0.04] overflow-auto">
          {hours.map((hour) => (
            <div className="flex min-h-[52px] transition-colors hover:bg-white/[0.02] md:min-h-[56px]" key={hour}>
              <div className="w-12 flex-shrink-0 py-2 pr-2 text-right text-[11px] text-white/30 md:w-16 md:pr-3">
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
              <div className="relative flex-1 border-l border-white/[0.04] px-2 py-1">
                {dayEvents
                  .filter((e) => new Date(e.start).getHours() === hour)
                  .map((event) => (
                    <button
                      className={cn("event-item w-full text-left", getEventColor(event))}
                      key={event.id}
                      onClick={() => openEditPanel(event)}
                      type="button"
                    >
                      <span className="text-white/80">{event.title}</span>
                      <span className="ml-1.5 text-white/30">
                        {format(new Date(event.start), "h:mm a")}
                      </span>
                    </button>
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
    const weekDays = eachDayOfInterval({ start: weekStart, end: addDays(weekStart, 6) });
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="liquid-glass-subtle flex h-full flex-col overflow-hidden rounded-2xl">
        <div className="sticky top-0 z-10 grid grid-cols-8 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="w-12 p-2 md:w-16" />
          {weekDays.map((day) => (
            <div className="px-0.5 py-2 text-center md:px-1 md:py-2.5" key={day.toISOString()}>
              <div className="text-[9px] text-white/30 md:text-[10px]">{format(day, isMobile ? "EEEEE" : "EEE")}</div>
              <div
                className={cn(
                  "mx-auto mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg text-[10px] font-medium md:h-7 md:w-7 md:text-xs",
                  isSameDay(day, new Date()) && "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-8 divide-x divide-white/[0.04] overflow-auto">
          <div>
            {hours.map((hour) => (
              <div className="h-[44px] border-b border-white/[0.04] py-1 pr-1 text-right text-[9px] text-white/25 md:h-[52px] md:pr-2 md:text-[10px]" key={hour}>
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
            ))}
          </div>
          {weekDays.map((day) => (
            <div key={day.toISOString()}>
              {hours.map((hour) => {
                const hourEvents = events.filter(
                  (e) => e.start && isSameDay(new Date(e.start), day) && new Date(e.start).getHours() === hour
                );
                return (
                  <div
                    className="h-[44px] border-b border-white/[0.04] p-0.5 transition-colors hover:bg-white/[0.02] md:h-[52px]"
                    key={hour}
                    onClick={() => {
                      const d = new Date(day);
                      d.setHours(hour, 0, 0, 0);
                      openCreatePanel(d);
                    }}
                  >
                    {hourEvents.map((event) => (
                      <button
                        className={cn("event-item w-full truncate text-left text-[9px] md:text-[10px]", getEventColor(event))}
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEditPanel(event); }}
                        type="button"
                      >
                        {event.title}
                      </button>
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
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const calendarStart = subDays(firstDay, firstDay.getDay());
    const calendarEnd = addDays(calendarStart, 41);
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const daysData = days.map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentDate),
      events: events.filter((e) => e.start && isSameDay(new Date(e.start), date)),
    }));

    return (
      <div className="liquid-glass-subtle flex h-full flex-col overflow-hidden rounded-2xl">
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {(isMobile ? ["S", "M", "T", "W", "T", "F", "S"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day, i) => (
            <div className="py-2 text-center text-[10px] font-medium text-white/30 md:py-2.5 md:text-[11px]" key={i}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-cols-7 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1 }}
              className="col-span-7 grid grid-cols-7"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key={format(currentDate, "yyyy-MM")}
              transition={{ duration: 0.15 }}
            >
              {daysData.map((day) => (
                <div
                  className={cn(
                    "min-h-[48px] cursor-pointer border-b border-r border-white/[0.04] p-1 transition-colors hover:bg-white/[0.02] md:min-h-[90px] md:p-2",
                    !day.isCurrentMonth && "opacity-30",
                    isSameDay(day.date, new Date()) && "bg-blue-500/[0.04]"
                  )}
                  key={day.date.toISOString()}
                  onClick={() => isMobile ? navigateMiniDay(day.date) : openCreatePanel(day.date)}
                >
                  <div className="mb-0.5 flex items-center justify-between md:mb-1.5">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-medium transition-colors hover:bg-white/[0.06]",
                        isSameDay(day.date, new Date())
                          ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                          : "text-white/60"
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
                  {/* Desktop: event names */}
                  <div className="hidden space-y-0.5 md:block">
                    {day.events.slice(0, 3).map((event) => (
                      <button
                        className={cn("event-item w-full truncate text-left", getEventColor(event))}
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); openEditPanel(event); }}
                        type="button"
                      >
                        {event.title}
                      </button>
                    ))}
                    {day.events.length > 3 && (
                      <div className="pl-2 text-[10px] text-white/30">+{day.events.length - 3} more</div>
                    )}
                  </div>
                  {/* Mobile: event dots */}
                  {day.events.length > 0 && (
                    <div className="mt-0.5 flex justify-center gap-[3px] md:hidden">
                      {day.events.slice(0, 3).map((event) => (
                        <div key={event.id} className={cn("h-[5px] w-[5px] rounded-full bg-current", getEventColor(event))} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = eachMonthOfInterval({ start: startOfYear(currentDate), end: endOfYear(currentDate) });

    return (
      <div className="grid h-full min-h-0 grid-cols-2 auto-rows-[minmax(0,1fr)] gap-2 md:grid-cols-3 md:gap-3">
        {months.map((monthDate) => {
          const firstDay = startOfMonth(monthDate);
          const calendarStart = subDays(firstDay, firstDay.getDay());
          const days = eachDayOfInterval({ start: calendarStart, end: addDays(calendarStart, 34) });
          const monthEvents = events.filter((e) => e.start && new Date(e.start).getMonth() === monthDate.getMonth());

          return (
            <div
              className="liquid-glass-subtle flex h-full min-h-0 flex-col overflow-hidden rounded-xl"
              key={monthDate.toISOString()}
            >
              <div className="shrink-0 border-b border-white/[0.06] px-2.5 py-1.5 md:px-3 md:py-2">
                <div className="text-[11px] font-semibold md:text-xs">{format(monthDate, "MMMM")}</div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1.5 pb-1.5 pt-1 md:px-2 md:pb-2 md:pt-1.5">
                <div className="sticky top-0 z-[1] -mx-0.5 mb-1 bg-background/92 px-0.5 pb-1 pt-0.5 shadow-[0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md">
                  <div className="grid grid-cols-7 gap-0.5">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div className="text-center text-[8px] font-medium text-white/25 md:text-[9px]" key={i}>{d}</div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {days.map((day) => {
                    const hasEvents = monthEvents.some((e) => isSameDay(new Date(e.start), day));
                    return (
                      <button
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-md text-[8px] transition-colors hover:bg-white/[0.06] md:text-[9px]",
                          !isSameMonth(day, monthDate) && "opacity-20",
                          isSameDay(day, new Date()) && "bg-blue-500/20 font-semibold text-blue-400 ring-1 ring-blue-500/30",
                          hasEvents && !isSameDay(day, new Date()) && "bg-white/[0.04] font-medium"
                        )}
                        key={day.toISOString()}
                        onClick={() => { setCurrentDate(day); setViewMode("day"); }}
                        type="button"
                      >
                        {format(day, "d")}
                      </button>
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

  const renderCalendarView = () => {
    switch (viewMode) {
      case "day": return renderDayView();
      case "week": return renderWeekView();
      case "month": return renderMonthView();
      case "year": return renderYearView();
    }
  };

  /* ─── Title ─────────────────────────────────── */

  const headerTitle = (() => {
    switch (viewMode) {
      case "day": return format(currentDate, isMobile ? "MMM d" : "MMMM d, yyyy");
      case "week": return `${format(startOfWeek(currentDate), "MMM d")}`;
      case "month": return format(currentDate, isMobile ? "MMM yyyy" : "MMMM yyyy");
      case "year": return format(currentDate, "yyyy");
    }
  })();

  /* ─── Sidebar Content (shared between mobile drawer & desktop) ── */

  const sidebarInner = (
    <>
      {/* AI Quick Input */}
      <div
        className="liquid-glass-input flex cursor-text items-center rounded-xl px-3 py-2.5"
        onClick={() => openAiPanel()}
      >
        <span className="text-xs text-white/25">Ask Zero anything...</span>
      </div>

      {/* Mini Calendar */}
      <div className="liquid-glass-subtle rounded-xl p-3">
        <div className="mb-2.5 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold text-white/70">
            {format(miniCalendarDate, "MMMM yyyy")}
          </h3>
          <div className="flex gap-0.5">
            <Button
              className="h-5 w-5 rounded-md text-white/30 hover:bg-white/[0.06] hover:text-white/60"
              onClick={() => setMiniCalendarDate(subMonths(miniCalendarDate, 1))}
              size="icon"
              variant="ghost"
            >
              <ChevronLeftIcon className="h-3 w-3" />
            </Button>
            <Button
              className="h-5 w-5 rounded-md text-white/30 hover:bg-white/[0.06] hover:text-white/60"
              onClick={() => setMiniCalendarDate(addMonths(miniCalendarDate, 1))}
              size="icon"
              variant="ghost"
            >
              <ChevronRightIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-0.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
            <div className="text-center text-[9px] font-medium text-white/25" key={i}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {miniCalendarDays.map((day) => {
            const hasEvents = events.some((e) => e.start && isSameDay(new Date(e.start), day));
            return (
              <button
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md text-[10px] transition-all hover:bg-white/[0.06]",
                  !isSameMonth(day, miniCalendarDate) && "opacity-20",
                  isSameDay(day, new Date()) && "bg-blue-500/20 font-semibold text-blue-400 ring-1 ring-blue-500/30",
                  hasEvents && !isSameDay(day, new Date()) && "bg-white/[0.03] font-medium",
                  isSameDay(day, currentDate) && !isSameDay(day, new Date()) && "ring-1 ring-white/20"
                )}
                key={day.toISOString()}
                onClick={() => navigateMiniDay(day)}
                type="button"
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Create Event */}
      <Button
        className="h-9 w-full rounded-xl bg-white/95 text-xs font-medium text-black hover:bg-white"
        onClick={() => openCreatePanel(new Date())}
      >
        <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
        New Event
      </Button>

      {/* Google Calendars */}
      {userProvider === "google" && googleCalendars.length > 0 && (
        <div className="liquid-glass-subtle rounded-xl p-3">
              <div className="mb-2.5">
                <span className="section-label">My Calendars</span>
              </div>
          <div className="space-y-1.5">
            {googleCalendars.map((calendar) => (
              <div className="flex items-center justify-between gap-2 py-0.5" key={calendar.id}>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="h-2.5 w-2.5 flex-shrink-0 rounded-sm" style={{ backgroundColor: calendar.backgroundColor }} />
                  <span className="truncate text-[11px] text-white/50">
                    {calendar.summary}
                    {calendar.primary && <span className="ml-1 text-white/25">(Primary)</span>}
                  </span>
                </div>
                <Switch
                  checked={calendar.visible}
                  className="scale-[0.6]"
                  onCheckedChange={() => toggleCalendarVisibility(calendar.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  /* ─── Panel Content (shared between mobile sheet & desktop side) ── */

  const panelContent = (
    <>
      {rightPanel === "event" && (
        <EventDetailPanel
          categories={categories}
          event={selectedEvent}
          mode={eventPanelMode}
          onClose={closePanel}
          onEventCreated={() => {
            void refreshEvents().catch(() => {});
            closePanel();
          }}
          onEventDeleted={() => {
            void refreshEvents().catch(() => {});
            closePanel();
          }}
          onEventUpdated={() => {
            void refreshEvents().catch(() => {});
            closePanel();
          }}
          selectedDate={selectedDate}
          userId={userId}
        />
      )}
      {rightPanel === "ai" && (
        <AiPanel
          onClose={closePanel}
          onEventMutated={refreshEvents}
          userId={userId}
        />
      )}
    </>
  );

  /* ─── Render ────────────────────────────────── */

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col overflow-hidden border-r border-white/[0.06] bg-background"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                <span className="text-sm font-semibold text-white/80">Zero Calendar</span>
                <Button
                  className="h-7 w-7 rounded-lg text-white/40 hover:bg-white/[0.06]"
                  onClick={() => setSidebarOpen(false)}
                  size="icon"
                  variant="ghost"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {sidebarInner}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Sidebar ── */}
      <div className="hidden w-[260px] flex-shrink-0 flex-col overflow-hidden border-r border-white/[0.06] md:flex">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {sidebarInner}
        </div>
      </div>

      {/* ── Main Calendar ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2 md:px-5 md:py-3">
          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Mobile hamburger */}
            <Button
              className="h-8 w-8 rounded-lg text-white/50 hover:bg-white/[0.06] md:hidden"
              onClick={() => setSidebarOpen(true)}
              size="icon"
              variant="ghost"
            >
              <MenuIcon className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-0.5">
              <Button
                className="h-7 w-7 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"
                onClick={handlePrevious}
                size="icon"
                variant="ghost"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                className="h-7 w-7 rounded-lg border border-white/[0.06] bg-white/[0.03] text-white/50 hover:bg-white/[0.06]"
                onClick={handleNext}
                size="icon"
                variant="ghost"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </Button>
            </div>

            <h2 className="text-sm font-bold tracking-tight md:text-base">{headerTitle}</h2>

            <Button
              className="hidden h-7 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 text-[11px] text-white/50 hover:bg-white/[0.06] md:inline-flex"
              onClick={() => setCurrentDate(new Date())}
              size="sm"
              variant="ghost"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2.5">
            {/* Mobile Today button */}
            <Button
              className="h-7 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 text-[11px] text-white/50 hover:bg-white/[0.06] md:hidden"
              onClick={() => setCurrentDate(new Date())}
              size="sm"
              variant="ghost"
            >
              Today
            </Button>

            <Select onValueChange={(v) => setViewMode(v as ViewMode)} value={viewMode}>
              <SelectTrigger className="h-7 w-[4.5rem] rounded-lg border-white/[0.06] bg-white/[0.03] text-[11px] md:w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-white/[0.12] bg-popover shadow-2xl ring-1 ring-white/10">
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            {/* Search — desktop only */}
            <div className="relative hidden md:block">
              <SearchIcon className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
              <input
                className="h-7 w-40 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-7 pr-2 text-[11px] text-white/70 outline-none placeholder:text-white/20 focus:border-white/[0.12]"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events"
                value={searchQuery}
              />
            </div>

            {/* AI toggle — desktop only (mobile accesses via sidebar or FAB area) */}
            <Button
              className={cn(
                "hidden h-7 w-7 rounded-lg border border-white/[0.06] text-white/40 hover:bg-white/[0.06] md:inline-flex",
                rightPanel === "ai" && "border-blue-500/20 bg-blue-500/10 text-blue-400"
              )}
              onClick={() => rightPanel === "ai" ? closePanel() : openAiPanel()}
              size="icon"
              variant="ghost"
            >
              <SparklesIcon className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 w-8 overflow-hidden rounded-full border border-white/[0.08] bg-white/[0.06] p-0 hover:bg-white/[0.1]"
                  size="icon"
                  variant="ghost"
                >
                  {userImage ? (
                    <img alt={userName} className="h-full w-full object-cover" src={userImage} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/40 to-blue-600/40 text-xs font-semibold text-white">
                      {userName?.[0] || <UserIcon className="h-3.5 w-3.5" />}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="mt-2 w-56 rounded-2xl border border-white/[0.12] bg-popover p-1.5 shadow-2xl ring-1 ring-white/10"
              >
                <DropdownMenuLabel className="px-3 py-2.5">
                  <p className="text-xs font-semibold text-white">{userName}</p>
                  <p className="text-[10px] text-white/55">{userEmail}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl text-xs text-white/80 focus:bg-white/[0.06] focus:text-white"
                  onClick={() => router.push("/settings")}
                >
                  <SettingsIcon className="mr-2 h-3.5 w-3.5" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.06]" />
                <DropdownMenuItem
                  className="cursor-pointer rounded-xl text-xs text-red-300 focus:bg-white/[0.06] focus:text-red-300"
                  onClick={async () => {
                    await authClient.signOut();
                    window.location.href = "/";
                  }}
                >
                  <LogOutIcon className="mr-2 h-3.5 w-3.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="min-h-0 flex-1 overflow-hidden p-2 md:p-3">
          {renderCalendarView()}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <AnimatePresence mode="wait">
        {rightPanel !== "none" && (
          isMobile ? (
            /* Mobile: bottom sheet overlay */
            <Fragment key="mobile-panel">
              <motion.div
                className="fixed inset-0 z-40 touch-none bg-black/50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closePanel}
              />
              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] min-h-0 flex-col overflow-hidden rounded-t-2xl border-t border-white/[0.08] bg-background"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 400, damping: 38 }}
              >
                {/* Drag handle */}
                <div className="flex shrink-0 justify-center py-2">
                  <div className="h-1 w-8 rounded-full bg-white/20" />
                </div>
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {panelContent}
                </div>
              </motion.div>
            </Fragment>
          ) : (
            /* Desktop: side panel */
            <motion.div
              animate={{ width: 360, opacity: 1 }}
              className="flex-shrink-0 overflow-hidden border-l border-white/[0.06]"
              exit={{ width: 0, opacity: 0 }}
              initial={{ width: 0, opacity: 0 }}
              key="desktop-panel"
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            >
              <div className="h-full min-h-0 w-[360px]">
                {panelContent}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* ── Mobile FAB ── */}
      {isMobile && rightPanel === "none" && (
        <motion.button
          type="button"
          className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg shadow-black/40 active:scale-95"
          onClick={() => openCreatePanel(new Date())}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 0.9 }}
        >
          <PlusIcon className="h-6 w-6 text-black" />
        </motion.button>
      )}
    </div>
  );
}
