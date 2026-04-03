"use client";

import {
  addMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isValid,
  parse,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const VALUE_FORMAT = "yyyy-MM-dd'T'HH:mm";
const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES_STEP_5 = Array.from({ length: 12 }, (_, i) => i * 5);
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

interface DateTimePickerProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  popoverClassName?: string;
  showIcon?: boolean;
  triggerClassName?: string;
  value?: string;
}

interface TimePickerProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  popoverClassName?: string;
  triggerClassName?: string;
  value?: string;
}

function parseDateTime(value?: string) {
  if (!value) {
    return null;
  }
  const parsed = parse(value, VALUE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

function formatDateTimeValue(date: Date) {
  return format(date, VALUE_FORMAT);
}

function getBaseDate(date: Date | null) {
  const base = date ? new Date(date) : new Date();
  base.setSeconds(0, 0);
  if (!date) {
    base.setHours(DEFAULT_HOUR, DEFAULT_MINUTE, 0, 0);
  }
  return base;
}

function getTimeParts(date: Date | null) {
  if (!date) {
    return { hour: 9, minute: 0, meridiem: "AM" as const };
  }
  const h24 = date.getHours();
  return {
    hour: h24 % 12 || 12,
    meridiem: (h24 >= 12 ? "PM" : "AM") as "AM" | "PM",
    minute: date.getMinutes(),
  };
}

function getDisplayLabel(date: Date | null, placeholder: string) {
  if (!date) {
    return placeholder;
  }
  return format(date, "EEE, MMM d, yyyy · h:mm a");
}

function parseTimeValue(value?: string) {
  if (!value) {
    return null;
  }
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return null;
  }
  return { hours: h, minutes: m };
}

function formatTimeLabel(hours: number, minutes: number) {
  const h12 = hours % 12 || 12;
  const mer = hours >= 12 ? "PM" : "AM";
  return `${h12}:${String(minutes).padStart(2, "0")} ${mer}`;
}

function formatTimeValue(hours: number, minutes: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function startOfVisibleMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function MiniCalendar({
  onSelect,
  selected,
}: {
  onSelect: (date: Date) => void;
  selected: Date | null;
}) {
  const [viewMonth, setViewMonth] = useState(() =>
    startOfVisibleMonth(selected ?? new Date())
  );

  const selectedMonthKey = selected?.getTime();

  useEffect(() => {
    if (selectedMonthKey === undefined) {
      return;
    }
    setViewMonth((prev) => {
      const s = new Date(selectedMonthKey);
      if (
        prev.getFullYear() === s.getFullYear() &&
        prev.getMonth() === s.getMonth()
      ) {
        return prev;
      }
      return startOfVisibleMonth(s);
    });
  }, [selectedMonthKey]);

  const firstOfMonth = startOfVisibleMonth(viewMonth);
  const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: 0 });
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 41);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const goPrev = useCallback(() => setViewMonth((v) => subMonths(v, 1)), []);
  const goNext = useCallback(() => setViewMonth((v) => addMonths(v, 1)), []);

  const monthLabelId = `mini-cal-${firstOfMonth.getTime()}`;

  return (
    <div
      aria-labelledby={monthLabelId}
      className="select-none rounded-xl border border-border/80 bg-muted/25 p-3"
      role="group"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          aria-label="Previous month"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={goPrev}
          type="button"
        >
          <ChevronLeftIcon aria-hidden className="size-4" />
        </button>
        <span
          className="min-w-0 truncate text-center font-heading font-semibold text-foreground text-sm tracking-tight"
          id={monthLabelId}
        >
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          aria-label="Next month"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={goNext}
          type="button"
        >
          <ChevronRightIcon aria-hidden className="size-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 px-0.5">
        {WEEKDAYS.map((wd, i) => (
          <div
            className="py-1.5 text-center font-medium text-[10px] text-muted-foreground tabular-nums tracking-tight"
            key={`dow-${String(i)}`}
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = Boolean(selected && isSameDay(day, selected));
          const isToday = isSameDay(day, new Date());
          const isOutside = !isSameMonth(day, viewMonth);

          return (
            <button
              aria-current={isToday ? "date" : undefined}
              aria-label={format(day, "EEEE, MMMM d, yyyy")}
              aria-pressed={isSelected}
              className={cn(
                "flex aspect-square min-h-9 w-full items-center justify-center rounded-lg text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isOutside &&
                  "text-muted-foreground/40 hover:bg-accent/40 hover:text-muted-foreground",
                !(isOutside || isSelected) &&
                  "text-foreground/90 hover:bg-accent/80",
                isToday &&
                  !isSelected &&
                  "bg-chart-2/15 font-semibold text-foreground ring-1 ring-chart-2/40",
                isSelected &&
                  "bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
              )}
              key={day.toISOString()}
              onClick={() => onSelect(day)}
              type="button"
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeWheel({
  meridiem,
  onMeridiemChange,
  onTimeChange,
  selectedHour,
  selectedMinute,
}: {
  meridiem: "AM" | "PM";
  onMeridiemChange: (m: "AM" | "PM") => void;
  onTimeChange: (hour: number, minute: number) => void;
  selectedHour: number;
  selectedMinute: number;
}) {
  const closestMinute = MINUTES_STEP_5.reduce((prev, curr) =>
    Math.abs(curr - selectedMinute) < Math.abs(prev - selectedMinute)
      ? curr
      : prev
  );

  return (
    <div className="flex gap-2">
      <div className="flex-1 overflow-hidden rounded-xl border border-border/80 bg-muted/20">
        <div className="grid max-h-[160px] grid-cols-4 gap-1 overflow-y-auto p-1.5">
          {HOURS.map((h) => (
            <button
              className={cn(
                "flex h-8 items-center justify-center rounded-md text-muted-foreground text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                h === selectedHour
                  ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              key={h}
              onClick={() => onTimeChange(h, selectedMinute)}
              type="button"
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div className="w-[72px] overflow-hidden rounded-xl border border-border/80 bg-muted/20">
        <div className="grid max-h-[160px] grid-cols-1 gap-1 overflow-y-auto p-1.5">
          {MINUTES_STEP_5.map((m) => (
            <button
              className={cn(
                "flex h-8 items-center justify-center rounded-md text-muted-foreground text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                m === closestMinute
                  ? "bg-primary font-semibold text-primary-foreground shadow-sm"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              key={m}
              onClick={() => onTimeChange(selectedHour, m)}
              type="button"
            >
              :{String(m).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-[52px] flex-col gap-1 rounded-xl border border-border/80 bg-muted/20 p-1.5">
        {(["AM", "PM"] as const).map((m) => (
          <button
            className={cn(
              "flex flex-1 items-center justify-center rounded-md font-medium text-muted-foreground text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              m === meridiem
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            key={m}
            onClick={() => onMeridiemChange(m)}
            type="button"
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DateTimePicker({
  disabled,
  onChange,
  placeholder = "Pick date and time",
  popoverClassName,
  showIcon = true,
  triggerClassName,
  value,
}: DateTimePickerProps) {
  const selectedDate = parseDateTime(value);
  const timeParts = getTimeParts(selectedDate);

  const updateDate = (nextDate: Date) => {
    const base = getBaseDate(selectedDate);
    base.setFullYear(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      nextDate.getDate()
    );
    onChange(formatDateTimeValue(base));
  };

  const updateTime = (hour: number, minute: number) => {
    const base = getBaseDate(selectedDate);
    let h24 = hour % 12;
    if (timeParts.meridiem === "PM") {
      h24 += 12;
    }
    base.setHours(h24, minute, 0, 0);
    onChange(formatDateTimeValue(base));
  };

  const updateMeridiem = (m: "AM" | "PM") => {
    const base = getBaseDate(selectedDate);
    let h24 = timeParts.hour % 12;
    if (m === "PM") {
      h24 += 12;
    }
    base.setHours(h24, timeParts.minute, 0, 0);
    onChange(formatDateTimeValue(base));
  };

  const setToday = () => {
    const base = getBaseDate(selectedDate);
    const today = new Date();
    base.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());
    onChange(formatDateTimeValue(base));
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "liquid-glass-input flex h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-foreground text-sm transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          triggerClassName
        )}
        disabled={disabled}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {showIcon ? (
              <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : null}
            <span
              className={cn(
                "truncate",
                !selectedDate && "text-muted-foreground"
              )}
            >
              {getDisplayLabel(selectedDate, placeholder)}
            </span>
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[min(100vw-1.5rem,360px)] max-w-[360px] gap-0 overflow-hidden rounded-3xl border border-border bg-popover p-0 text-popover-foreground shadow-[var(--glass-shadow-elevated)] ring-1 ring-border/60",
          popoverClassName
        )}
        sideOffset={8}
      >
        <div className="border-border border-b px-5 py-3.5">
          <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Schedule
          </p>
          <p className="mt-1 font-heading font-semibold text-foreground text-sm">
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d")
              : "Choose a date & time"}
          </p>
        </div>

        <div className="px-3 py-3 sm:px-4">
          <MiniCalendar onSelect={updateDate} selected={selectedDate} />
        </div>

        <div className="border-border border-t px-3 py-3 sm:px-4">
          <p className="mb-2 font-medium text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Time
          </p>
          <TimeWheel
            meridiem={timeParts.meridiem}
            onMeridiemChange={updateMeridiem}
            onTimeChange={updateTime}
            selectedHour={timeParts.hour}
            selectedMinute={timeParts.minute}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-border border-t px-3 py-2.5 sm:px-4">
          <Button
            className="h-8 rounded-full border border-border bg-transparent px-3.5 text-muted-foreground text-xs hover:bg-accent hover:text-accent-foreground"
            onClick={() => onChange("")}
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
          <Button
            className="h-8 rounded-full border border-border bg-transparent px-3.5 text-muted-foreground text-xs hover:bg-accent hover:text-accent-foreground"
            onClick={setToday}
            type="button"
            variant="ghost"
          >
            Today
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TimePicker({
  disabled,
  onChange,
  placeholder = "Pick time",
  popoverClassName,
  triggerClassName,
  value,
}: TimePickerProps) {
  const parsedValue = parseTimeValue(value);
  const timeParts = getTimeParts(
    parsedValue
      ? new Date(2026, 0, 1, parsedValue.hours, parsedValue.minutes)
      : null
  );

  const updateTime = (hour: number, minute: number) => {
    let h24 = hour % 12;
    if (timeParts.meridiem === "PM") {
      h24 += 12;
    }
    onChange(formatTimeValue(h24, minute));
  };

  const updateMeridiem = (m: "AM" | "PM") => {
    let h24 = timeParts.hour % 12;
    if (m === "PM") {
      h24 += 12;
    }
    onChange(formatTimeValue(h24, timeParts.minute));
  };

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "liquid-glass-input flex h-10 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-foreground text-sm transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          triggerClassName
        )}
        disabled={disabled}
      >
        <span className="min-w-0 flex-1">
          <span
            className={cn("truncate", !parsedValue && "text-muted-foreground")}
          >
            {parsedValue
              ? formatTimeLabel(parsedValue.hours, parsedValue.minutes)
              : placeholder}
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[min(100vw-1.5rem,280px)] max-w-[280px] gap-0 overflow-hidden rounded-3xl border border-border bg-popover p-0 text-popover-foreground shadow-[var(--glass-shadow-elevated)] ring-1 ring-border/60",
          popoverClassName
        )}
        sideOffset={8}
      >
        <div className="border-border border-b px-5 py-3.5">
          <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Time
          </p>
          <p className="mt-1 font-heading font-semibold text-foreground text-sm">
            {parsedValue
              ? formatTimeLabel(parsedValue.hours, parsedValue.minutes)
              : "Choose a time"}
          </p>
        </div>

        <div className="px-3 py-3 sm:px-4">
          <TimeWheel
            meridiem={timeParts.meridiem}
            onMeridiemChange={updateMeridiem}
            onTimeChange={updateTime}
            selectedHour={timeParts.hour}
            selectedMinute={timeParts.minute}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-border border-t px-3 py-2.5 sm:px-4">
          <Button
            className="h-8 rounded-full border border-border bg-transparent px-3.5 text-muted-foreground text-xs hover:bg-accent hover:text-accent-foreground"
            onClick={() => onChange("")}
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
          <Button
            className="h-8 rounded-full border border-border bg-transparent px-3.5 text-muted-foreground text-xs hover:bg-accent hover:text-accent-foreground"
            onClick={() => onChange("09:00")}
            type="button"
            variant="ghost"
          >
            9:00 AM
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
