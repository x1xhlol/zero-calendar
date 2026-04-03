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
import { useCallback, useEffect, useId, useState } from "react";
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

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => i);
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

/** Parse typed times: 14:37, 2:37 pm, 2:37pm, 930 → 9:30, etc. */
function parseFlexibleTimeString(
  raw: string
): { hours: number; minutes: number } | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) {
    return null;
  }

  const hasMeridiem = /\b(am|pm)\b/i.test(s);
  const rest = s.replace(/\b(am|pm)\b/gi, "").trim();

  // 24h HH:mm or H:mm
  const m24 = rest.match(/^(\d{1,2}):(\d{2})$/);
  if (m24 && !hasMeridiem) {
    const h = Number(m24[1]);
    const min = Number(m24[2]);
    if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
      return { hours: h, minutes: min };
    }
  }

  // 12h h:mm with am/pm
  const m12 = rest.match(/^(\d{1,2}):(\d{2})$/);
  if (m12 && hasMeridiem) {
    let h = Number(m12[1]);
    const min = Number(m12[2]);
    if (h < 1 || h > 12 || min < 0 || min > 59) {
      return null;
    }
    const isPm = /\bpm\b/.test(s);
    if (h === 12) {
      h = isPm ? 12 : 0;
    } else if (isPm) {
      h += 12;
    }
    return { hours: h, minutes: min };
  }

  // Compact 3–4 digits: 930, 1337
  const compact = rest.replace(":", "").match(/^(\d{3,4})$/);
  if (compact && !hasMeridiem) {
    const digits = compact[1];
    if (digits.length === 3) {
      const h = Number(digits[0]);
      const min = Number(digits.slice(1));
      if (h <= 23 && min <= 59) {
        return { hours: h, minutes: min };
      }
    } else {
      const h = Number(digits.slice(0, 2));
      const min = Number(digits.slice(2));
      if (h <= 23 && min <= 59) {
        return { hours: h, minutes: min };
      }
    }
  }

  // Single hour with am/pm
  const hOnly = rest.match(/^(\d{1,2})$/);
  if (hOnly && hasMeridiem) {
    let h = Number(hOnly[1]);
    if (h < 1 || h > 12) {
      return null;
    }
    const isPm = /\bpm\b/.test(s);
    if (h === 12) {
      h = isPm ? 12 : 0;
    } else if (isPm) {
      h += 12;
    }
    return { hours: h, minutes: 0 };
  }

  // 24h hour only: 9 → 09:00, 17 → 17:00
  const h24Only = rest.match(/^(\d{1,2})$/);
  if (h24Only && !hasMeridiem) {
    const h = Number(h24Only[1]);
    if (h >= 0 && h <= 23) {
      return { hours: h, minutes: 0 };
    }
  }

  return null;
}

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

const selectClass =
  "h-10 min-w-0 flex-1 rounded-lg border border-white/[0.1] bg-white/[0.06] px-2.5 text-white/90 text-xs tabular-nums outline-none focus:border-white/20 focus:ring-2 focus:ring-white/15";

function TimePickerPanel({
  hours24,
  minutes,
  onCommit,
}: {
  hours24: number;
  minutes: number;
  onCommit: (nextH24: number, nextMin: number) => void;
}) {
  const inputId = useId();
  const hour12 = hours24 % 12 || 12;
  const meridiem: "AM" | "PM" = hours24 >= 12 ? "PM" : "AM";
  const [draft, setDraft] = useState(() => formatTimeValue(hours24, minutes));

  useEffect(() => {
    setDraft(formatTimeValue(hours24, minutes));
  }, [hours24, minutes]);

  const apply12 = (h12: number, min: number, mer: "AM" | "PM") => {
    let h24 = h12 % 12;
    if (mer === "PM") {
      h24 += 12;
    }
    onCommit(h24, min);
  };

  const tryCommitDraft = () => {
    const parsed = parseFlexibleTimeString(draft);
    if (parsed) {
      onCommit(parsed.hours, parsed.minutes);
      setDraft(formatTimeValue(parsed.hours, parsed.minutes));
    } else {
      setDraft(formatTimeValue(hours24, minutes));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          className="mb-1.5 block font-medium text-[10px] text-white/45 uppercase tracking-[0.14em]"
          htmlFor={inputId}
        >
          Type exact time
        </label>
        <input
          className="h-10 w-full rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 text-sm text-white/90 tabular-nums outline-none placeholder:text-white/35 focus:border-white/20 focus:ring-2 focus:ring-white/15"
          id={inputId}
          inputMode="text"
          onBlur={tryCommitDraft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              tryCommitDraft();
            }
          }}
          placeholder="e.g. 14:37, 2:37 pm, 937"
          spellCheck={false}
          type="text"
          value={draft}
        />
        <p className="mt-1.5 text-[10px] text-white/35 leading-relaxed">
          24-hour or 12-hour with am/pm. Any minute 0–59.
        </p>
      </div>

      <div>
        <p className="mb-2 font-medium text-[10px] text-white/45 uppercase tracking-[0.14em]">
          Or choose
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Hour"
            className={selectClass}
            onChange={(e) => apply12(Number(e.target.value), minutes, meridiem)}
            value={hour12}
          >
            {HOURS_12.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span className="text-sm text-white/50">:</span>
          <select
            aria-label="Minute"
            className={cn(selectClass, "min-w-[4.25rem] flex-none")}
            onChange={(e) => apply12(hour12, Number(e.target.value), meridiem)}
            value={minutes}
          >
            {MINUTES_60.map((m) => (
              <option key={m} value={m}>
                {String(m).padStart(2, "0")}
              </option>
            ))}
          </select>
          <select
            aria-label="AM or PM"
            className={cn(selectClass, "min-w-[4.5rem] flex-none")}
            onChange={(e) =>
              apply12(hour12, minutes, e.target.value as "AM" | "PM")
            }
            value={meridiem}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
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

  const updateDate = (nextDate: Date) => {
    const base = getBaseDate(selectedDate);
    base.setFullYear(
      nextDate.getFullYear(),
      nextDate.getMonth(),
      nextDate.getDate()
    );
    onChange(formatDateTimeValue(base));
  };

  const updateTimeFromPanel = (nextH24: number, nextMin: number) => {
    const base = getBaseDate(selectedDate);
    base.setHours(nextH24, nextMin, 0, 0);
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
              <CalendarIcon className="h-4 w-4 shrink-0 text-white/45" />
            ) : null}
            <span
              className={cn(
                "truncate font-medium text-white/[0.92] tabular-nums",
                !selectedDate && "text-white/40"
              )}
            >
              {getDisplayLabel(selectedDate, placeholder)}
            </span>
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-white/45" />
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
          <p className="mb-2 font-medium text-[10px] text-white/45 uppercase tracking-[0.2em]">
            Time
          </p>
          <TimePickerPanel
            hours24={selectedDate?.getHours() ?? DEFAULT_HOUR}
            minutes={selectedDate?.getMinutes() ?? DEFAULT_MINUTE}
            onCommit={updateTimeFromPanel}
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

export function DatePicker({
  disabled,
  onChange,
  placeholder = "Pick a date",
  popoverClassName,
  triggerClassName,
  value,
}: {
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder?: string;
  popoverClassName?: string;
  triggerClassName?: string;
  value?: string;
}) {
  const selectedDate = value
    ? (() => {
        const p = parse(value, "yyyy-MM-dd", new Date());
        return isValid(p) ? p : null;
      })()
    : null;

  const updateDate = (next: Date) => {
    onChange(format(next, "yyyy-MM-dd"));
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
            <span
              className={cn(
                "truncate font-medium text-white/[0.92] tabular-nums",
                !selectedDate && "text-white/40"
              )}
            >
              {selectedDate
                ? format(selectedDate, "EEE, MMM d, yyyy")
                : placeholder}
            </span>
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-white/45" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[min(100vw-1.5rem,320px)] max-w-[320px] gap-0 overflow-hidden rounded-3xl border border-border bg-popover p-0 text-popover-foreground shadow-[var(--glass-shadow-elevated)] ring-1 ring-border/60",
          popoverClassName
        )}
        sideOffset={8}
      >
        <div className="border-border border-b px-5 py-3.5">
          <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Date
          </p>
          <p className="mt-1 font-heading font-semibold text-foreground text-sm">
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d")
              : "Choose a date"}
          </p>
        </div>

        <div className="px-3 py-3 sm:px-4">
          <MiniCalendar onSelect={updateDate} selected={selectedDate} />
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
            onClick={() => onChange(format(new Date(), "yyyy-MM-dd"))}
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
            className={cn(
              "truncate font-medium text-white/[0.92] tabular-nums",
              !parsedValue && "text-white/40"
            )}
          >
            {parsedValue
              ? formatTimeLabel(parsedValue.hours, parsedValue.minutes)
              : placeholder}
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-white/45" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[min(100vw-1.5rem,340px)] max-w-[340px] gap-0 overflow-hidden rounded-3xl border border-white/[0.1] bg-[#141418] p-0 text-white shadow-[var(--glass-shadow-elevated)] ring-1 ring-white/[0.06]",
          popoverClassName
        )}
        sideOffset={8}
      >
        <div className="border-white/[0.08] border-b px-5 py-3.5">
          <p className="font-medium text-[10px] text-white/45 uppercase tracking-[0.2em]">
            Time
          </p>
          <p className="mt-1 font-heading font-semibold text-sm text-white/95">
            {parsedValue
              ? formatTimeLabel(parsedValue.hours, parsedValue.minutes)
              : "Choose a time"}
          </p>
        </div>

        <div className="px-3 py-3 sm:px-4">
          <TimePickerPanel
            hours24={parsedValue?.hours ?? DEFAULT_HOUR}
            minutes={parsedValue?.minutes ?? DEFAULT_MINUTE}
            onCommit={(h, m) => onChange(formatTimeValue(h, m))}
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
