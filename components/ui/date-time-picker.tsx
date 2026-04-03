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
import { useCallback, useState } from "react";
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
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

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

function MiniCalendar({
  onSelect,
  selected,
}: {
  onSelect: (date: Date) => void;
  selected: Date | null;
}) {
  const [viewMonth, setViewMonth] = useState(selected ?? new Date());

  const firstOfMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth(),
    1
  );
  const gridStart = startOfWeek(firstOfMonth, { weekStartsOn: 0 });
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridStart.getDate() + 41);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const goPrev = useCallback(() => setViewMonth((v) => subMonths(v, 1)), []);
  const goNext = useCallback(() => setViewMonth((v) => addMonths(v, 1)), []);

  return (
    <div className="select-none px-1">
      <div className="mb-3 flex items-center justify-between">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          onClick={goPrev}
          type="button"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <span className="font-semibold text-[13px] text-white">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
          onClick={goNext}
          type="button"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0">
        {WEEKDAYS.map((wd) => (
          <div
            className="py-1 text-center font-medium text-[11px] text-white/30"
            key={wd}
          >
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0">
        {days.map((day) => {
          const isSelected = selected && isSameDay(day, selected);
          const isToday = isSameDay(day, new Date());
          const isOutside = !isSameMonth(day, viewMonth);

          return (
            <button
              className={cn(
                "flex h-9 w-full items-center justify-center rounded-lg text-[13px] transition-all",
                isOutside && "text-white/15",
                !(isOutside || isSelected) &&
                  "text-white/75 hover:bg-white/[0.06]",
                isToday && !isSelected && "font-semibold text-blue-400",
                isSelected &&
                  "bg-white font-semibold text-black shadow-[0_0_12px_rgba(255,255,255,0.15)]"
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
      <div className="flex-1 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <div className="grid max-h-[160px] grid-cols-4 gap-0 overflow-y-auto p-1">
          {HOURS.map((h) => (
            <button
              className={cn(
                "flex h-8 items-center justify-center rounded-lg text-xs transition-all",
                h === selectedHour
                  ? "bg-white font-semibold text-black"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white"
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

      <div className="w-[72px] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
        <div className="grid max-h-[160px] grid-cols-1 gap-0 overflow-y-auto p-1">
          {MINUTES_STEP_5.map((m) => (
            <button
              className={cn(
                "flex h-8 items-center justify-center rounded-lg text-xs transition-all",
                m === closestMinute
                  ? "bg-white font-semibold text-black"
                  : "text-white/60 hover:bg-white/[0.06] hover:text-white"
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

      <div className="flex w-[52px] flex-col gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
        {(["AM", "PM"] as const).map((m) => (
          <button
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg font-medium text-xs transition-all",
              m === meridiem
                ? "bg-white text-black"
                : "text-white/50 hover:bg-white/[0.06] hover:text-white"
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
          "flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-left text-sm text-white/85 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
          triggerClassName
        )}
        disabled={disabled}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            {showIcon ? (
              <CalendarIcon className="h-4 w-4 shrink-0 text-white/35" />
            ) : null}
            <span className={cn("truncate", !selectedDate && "text-white/35")}>
              {getDisplayLabel(selectedDate, placeholder)}
            </span>
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-white/35" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[340px] gap-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c0f] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.06] backdrop-blur-2xl",
          popoverClassName
        )}
        sideOffset={8}
      >
        {/* Header */}
        <div className="border-white/[0.06] border-b px-5 py-3.5">
          <p className="font-medium text-[10px] text-white/30 uppercase tracking-[0.2em]">
            Schedule
          </p>
          <p className="mt-1 font-semibold text-sm text-white/90">
            {selectedDate
              ? format(selectedDate, "EEEE, MMMM d")
              : "Choose a date & time"}
          </p>
        </div>

        {/* Calendar */}
        <div className="px-4 py-3">
          <MiniCalendar onSelect={updateDate} selected={selectedDate} />
        </div>

        {/* Time */}
        <div className="border-white/[0.06] border-t px-4 py-3">
          <p className="mb-2 font-medium text-[10px] text-white/30 uppercase tracking-[0.2em]">
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

        {/* Footer */}
        <div className="flex items-center justify-between border-white/[0.06] border-t px-4 py-2.5">
          <Button
            className="h-8 rounded-full border border-white/[0.06] bg-transparent px-3.5 text-white/50 text-xs hover:bg-white/[0.04] hover:text-white/80"
            onClick={() => onChange("")}
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
          <Button
            className="h-8 rounded-full border border-white/[0.06] bg-transparent px-3.5 text-white/50 text-xs hover:bg-white/[0.04] hover:text-white/80"
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
          "flex h-10 w-full items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-left text-sm text-white/85 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
          triggerClassName
        )}
        disabled={disabled}
      >
        <span className="min-w-0 flex-1">
          <span className={cn("truncate", !parsedValue && "text-white/35")}>
            {parsedValue
              ? formatTimeLabel(parsedValue.hours, parsedValue.minutes)
              : placeholder}
          </span>
        </span>
        <ChevronDownIcon className="h-4 w-4 shrink-0 text-white/35" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "w-[280px] gap-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0c0f] p-0 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)] ring-1 ring-white/[0.06] backdrop-blur-2xl",
          popoverClassName
        )}
        sideOffset={8}
      >
        <div className="border-white/[0.06] border-b px-5 py-3.5">
          <p className="font-medium text-[10px] text-white/30 uppercase tracking-[0.2em]">
            Time
          </p>
          <p className="mt-1 font-semibold text-sm text-white/90">
            {parsedValue
              ? formatTimeLabel(parsedValue.hours, parsedValue.minutes)
              : "Choose a time"}
          </p>
        </div>

        <div className="px-4 py-3">
          <TimeWheel
            meridiem={timeParts.meridiem}
            onMeridiemChange={updateMeridiem}
            onTimeChange={updateTime}
            selectedHour={timeParts.hour}
            selectedMinute={timeParts.minute}
          />
        </div>

        <div className="flex items-center justify-between border-white/[0.06] border-t px-4 py-2.5">
          <Button
            className="h-8 rounded-full border border-white/[0.06] bg-transparent px-3.5 text-white/50 text-xs hover:bg-white/[0.04] hover:text-white/80"
            onClick={() => onChange("")}
            type="button"
            variant="ghost"
          >
            Clear
          </Button>
          <Button
            className="h-8 rounded-full border border-white/[0.06] bg-transparent px-3.5 text-white/50 text-xs hover:bg-white/[0.04] hover:text-white/80"
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
