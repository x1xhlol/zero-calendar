"use client";

import { CheckIcon, ClockIcon, XIcon } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface Participant {
  email: string;
  status?: "pending" | "accepted" | "declined" | "needs-action";
}

interface ParticipantsInputProps {
  className?: string;
  inputClassName?: string;
  onChange: (value: Participant[]) => void;
  placeholder?: string;
  value: Participant[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmails(rawValue: string) {
  return rawValue
    .split(/[\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

const STATUS_STYLES: Record<
  string,
  { icon: React.ElementType; color: string }
> = {
  accepted: { icon: CheckIcon, color: "text-emerald-400" },
  pending: { icon: ClockIcon, color: "text-amber-400" },
  declined: { icon: XIcon, color: "text-red-400" },
  "needs-action": { icon: ClockIcon, color: "text-white/35" },
};

export function ParticipantsInput({
  className,
  inputClassName,
  placeholder = "Add email and press Enter",
  value,
  onChange,
}: ParticipantsInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedEmails = useMemo(
    () => new Set(value.map((p) => p.email.toLowerCase())),
    [value]
  );

  const commitDraft = () => {
    const nextEmails = normalizeEmails(draft);
    if (nextEmails.length === 0) {
      setDraft("");
      return;
    }

    const nextValue = [...value];

    for (const email of nextEmails) {
      if (
        !EMAIL_REGEX.test(email) ||
        normalizedEmails.has(email.toLowerCase())
      ) {
        continue;
      }

      nextValue.push({ email, status: "pending" });
    }

    onChange(nextValue);
    setDraft("");
  };

  const removeParticipant = (email: string) => {
    onChange(value.filter((p) => p.email !== email));
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((participant) => {
            const statusInfo =
              STATUS_STYLES[participant.status || "pending"] ||
              STATUS_STYLES.pending;
            const StatusIcon = statusInfo.icon;

            return (
              <span
                className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.06] px-2 py-1"
                key={participant.email}
              >
                <StatusIcon
                  className={cn("h-3 w-3 shrink-0", statusInfo.color)}
                />
                <span className="min-w-0 truncate text-[11px] text-white/80">
                  {participant.email}
                </span>
                <button
                  className="shrink-0 rounded-full p-0.5 text-white/30 transition-colors hover:bg-white/[0.08] hover:text-white/70"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeParticipant(participant.email);
                  }}
                  type="button"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <input
        className={cn(
          "w-full bg-transparent text-white/85 text-xs outline-none placeholder:text-white/25",
          inputClassName
        )}
        onBlur={commitDraft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            commitDraft();
          }

          if (
            event.key === "Backspace" &&
            draft.length === 0 &&
            value.length > 0
          ) {
            event.preventDefault();
            removeParticipant(value.at(-1)!.email);
          }
        }}
        placeholder={value.length === 0 ? placeholder : "Add another..."}
        ref={inputRef}
        value={draft}
      />
    </div>
  );
}
