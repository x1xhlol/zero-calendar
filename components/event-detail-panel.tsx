"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  TextIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  type Participant,
  ParticipantsInput,
} from "@/components/ui/participants-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import type { CalendarEvent } from "@/types/calendar";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  participants: z
    .array(
      z.object({
        email: z.string(),
        status: z
          .enum(["pending", "accepted", "declined", "needs-action"])
          .optional(),
      })
    )
    .default([]),
  calendarId: z.string().optional(),
  location: z.string().optional(),
});

interface EventDetailPanelProps {
  event: CalendarEvent | null;
  googleCalendars: {
    backgroundColor: string;
    id: string;
    primary: boolean;
    summary: string;
    visible: boolean;
  }[];
  mode: "create" | "edit" | "view";
  onClose: () => void;
  onEventCreated: () => void;
  onEventDeleted: () => void;
  onEventUpdated: () => void;
  selectedDate: Date | null;
  userId?: string;
}

const spring = { type: "spring", stiffness: 300, damping: 30 };

/** Single-line glass rows: same height as category select (h-10). */
const glassRow =
  "liquid-glass-input flex h-10 min-h-10 min-w-0 shrink-0 items-center gap-3 rounded-xl px-3";

export function EventDetailPanel({
  event,
  mode,
  googleCalendars,
  selectedDate,
  userId,
  onClose,
  onEventCreated,
  onEventUpdated,
  onEventDeleted,
}: EventDetailPanelProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const isCreating = mode === "create";
  const isEditing = mode === "edit";
  const defaultGoogleCalendarId =
    googleCalendars.find((calendar) => calendar.primary)?.id ??
    googleCalendars[0]?.id ??
    "";

  const defaultStart = selectedDate
    ? format(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          9,
          0
        ),
        "yyyy-MM-dd'T'HH:mm"
      )
    : "";
  const defaultEnd = selectedDate
    ? format(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          10,
          0
        ),
        "yyyy-MM-dd'T'HH:mm"
      )
    : "";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      start: defaultStart,
      end: defaultEnd,
      participants: [],
      calendarId: "",
      location: "",
    },
  });

  useEffect(() => {
    if (event && (mode === "edit" || mode === "view")) {
      form.reset({
        title: event.title || "",
        description: event.description || "",
        start: event.start
          ? format(new Date(event.start), "yyyy-MM-dd'T'HH:mm")
          : "",
        end: event.end ? format(new Date(event.end), "yyyy-MM-dd'T'HH:mm") : "",
        participants:
          event.attendees?.map((attendee) => ({
            email: attendee.email,
            status: (attendee.status ?? "pending") as Participant["status"],
          })) || [],
        calendarId: event.calendarId || defaultGoogleCalendarId,
        location: event.location || "",
      });
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        start: defaultStart,
        end: defaultEnd,
        participants: [],
        calendarId: "",
        location: "",
      });
    }
  }, [event, mode, form, defaultStart, defaultEnd, defaultGoogleCalendarId]);

  useEffect(() => {
    if (
      !(isCreating && defaultGoogleCalendarId) ||
      form.getValues("calendarId")
    ) {
      return;
    }

    form.setValue("calendarId", defaultGoogleCalendarId, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    });
  }, [defaultGoogleCalendarId, form, isCreating]);

  useEffect(() => {
    if (isCreating && titleRef.current) {
      const timer = setTimeout(() => titleRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isCreating]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to manage events",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const url = isCreating
        ? "/api/calendar/events"
        : `/api/calendar/events/${event?.id}`;
      const method = isCreating ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: values.title,
          description: values.description,
          start: values.start,
          end: values.end,
          location: values.location,
          calendarId: values.calendarId || undefined,
          attendees: values.participants.map((p) => ({
            email: p.email,
            status: p.status,
          })),
          pushToGoogle: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save event");
      }

      const { event: savedEvent } = await response.json();
      const savedEventId = savedEvent?.id || event?.id;

      const newParticipants = values.participants.filter(
        (p) => p.status === "pending" || !p.status
      );

      if (newParticipants.length > 0 && savedEventId) {
        try {
          await fetch("/api/invitations/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventId: savedEventId,
              eventTitle: values.title,
              eventStart: values.start,
              eventEnd: values.end,
              eventLocation: values.location,
              eventCalendarId: values.calendarId,
              invitees: newParticipants.map((p) => p.email),
            }),
          });
        } catch {
          console.error("Failed to send invitations");
        }
      }

      const invitedCount = newParticipants.length;
      const inviteNote =
        invitedCount > 0
          ? ` — ${invitedCount} invite${invitedCount > 1 ? "s" : ""} sent`
          : "";

      toast({
        title: isCreating ? "Event created" : "Event updated",
        description: `Your event has been ${isCreating ? "created" : "updated"}${inviteNote}`,
      });

      if (isCreating) {
        onEventCreated();
      } else {
        onEventUpdated();
      }
      onClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!(event && userId)) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/calendar/events/${event.id}?userId=${userId}&pushToGoogle=true`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast({
        title: "Event deleted",
        description: "Your event has been deleted",
        action: (
          <ToastAction
            altText="Undo event deletion"
            onClick={() => {
              restoreDeletedEvent(event).catch(console.error);
            }}
          >
            Undo
          </ToastAction>
        ),
      });
      onEventDeleted();
      onClose();
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function restoreDeletedEvent(deletedEvent: CalendarEvent) {
    if (!userId) {
      return;
    }

    try {
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          title: deletedEvent.title,
          description: deletedEvent.description,
          start: deletedEvent.start,
          end: deletedEvent.end,
          location: deletedEvent.location,
          color: deletedEvent.color,
          allDay: deletedEvent.allDay,
          calendarId: deletedEvent.calendarId,
          attendees: deletedEvent.attendees,
          pushToGoogle: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to restore");
      }

      toast({
        title: "Deletion undone",
        description: `"${deletedEvent.title}" has been restored`,
      });
      onEventCreated();
    } catch {
      toast({
        title: "Could not undo",
        description: "Failed to restore the deleted event",
        variant: "destructive",
      });
    }
  }

  const dateDisplay = selectedDate
    ? format(selectedDate, "EEEE, MMMM d")
    : event?.start
      ? format(new Date(event.start), "EEEE, MMMM d")
      : "";

  return (
    <motion.div
      animate={{ x: 0, opacity: 1 }}
      className="flex h-full min-h-0 flex-col overflow-hidden"
      exit={{ x: 80, opacity: 0 }}
      initial={{ x: 80, opacity: 0 }}
      transition={spring}
    >
      <div className="flex items-center justify-between border-white/[0.06] border-b px-5 py-4">
        <div>
          <h3 className="font-semibold text-sm text-white/90">
            {isCreating ? "New Event" : isEditing ? "Edit Event" : event?.title}
          </h3>
          {dateDisplay && (
            <p className="mt-0.5 text-white/40 text-xs">{dateDisplay}</p>
          )}
        </div>
        <Button
          className="h-7 w-7 rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white/70"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Form {...form}>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-10 border-0 bg-transparent px-0 font-semibold text-lg text-white placeholder:text-white/25 focus-visible:ring-0"
                      placeholder="Event title"
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        (
                          titleRef as React.MutableRefObject<HTMLInputElement | null>
                        ).current = e;
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-1">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className={glassRow}>
                        <ClockIcon className="size-4 shrink-0 text-white/30" />
                        <DateTimePicker
                          onChange={field.onChange}
                          showIcon={false}
                          triggerClassName="h-full min-h-0 flex-1 rounded-none border-0 bg-transparent px-0 text-xs shadow-none hover:bg-transparent focus-visible:ring-0"
                          value={field.value}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className={glassRow}>
                        <ClockIcon className="size-4 shrink-0 text-white/30" />
                        <DateTimePicker
                          onChange={field.onChange}
                          showIcon={false}
                          triggerClassName="h-full min-h-0 flex-1 rounded-none border-0 bg-transparent px-0 text-xs shadow-none hover:bg-transparent focus-visible:ring-0"
                          value={field.value}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <AnimatePresence>
              {(expanded || !isCreating) && (
                <motion.div
                  animate={{ height: "auto", opacity: 1 }}
                  className="space-y-2 overflow-hidden"
                  exit={{ height: 0, opacity: 0 }}
                  initial={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className={glassRow}>
                            <MapPinIcon className="size-4 shrink-0 text-white/30" />
                            <input
                              className="min-h-0 min-w-0 flex-1 bg-transparent py-0 text-white/80 text-xs leading-normal outline-none placeholder:text-white/25"
                              placeholder="Add location"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isCreating && googleCalendars.length > 1 && (
                    <FormField
                      control={form.control}
                      name="calendarId"
                      render={({ field }) => (
                        <FormItem>
                          <div className={glassRow}>
                            <CalendarIcon className="size-4 shrink-0 text-white/30" />
                            <Select
                              onValueChange={field.onChange}
                              value={field.value || defaultGoogleCalendarId}
                            >
                              <FormControl>
                                <SelectTrigger className="!h-full min-h-0 min-w-0 flex-1 justify-between gap-2 rounded-none border-0 bg-transparent px-0 py-0 text-white/80 text-xs shadow-none focus:ring-0 [&_svg]:size-3.5 [&_svg]:text-white/40">
                                  <SelectValue placeholder="Calendar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="rounded-xl border border-white/[0.12] shadow-2xl">
                                {googleCalendars.map((calendar) => (
                                  <SelectItem
                                    key={calendar.id}
                                    value={calendar.id}
                                  >
                                    {calendar.summary}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-3">
                              <UsersIcon className="mt-3 size-4 shrink-0 text-white/30" />
                              <ParticipantsInput
                                className="flex-1 border-white/[0.06]"
                                onChange={field.onChange}
                                placeholder="Add participants by email"
                                value={field.value}
                              />
                            </div>
                            <p className="pl-7 text-[10px] text-white/25">
                              Invitations will be sent via email.
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="liquid-glass-input flex min-w-0 items-start gap-3 rounded-lg px-3 py-2.5">
                            <TextIcon className="mt-1 size-4 shrink-0 text-white/30" />
                            <Textarea
                              className="field-sizing-fixed min-h-[4.5rem] min-w-0 flex-1 resize-none rounded-none border-0 bg-transparent p-0 py-0.5 pl-0.5 text-white/80 text-xs leading-relaxed shadow-none placeholder:text-white/25 focus-visible:ring-0"
                              placeholder="Add notes"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {isCreating && !expanded && (
              <button
                className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-[11px] text-white/30 transition-colors hover:text-white/50"
                onClick={() => setExpanded(true)}
                type="button"
              >
                More options
                <ChevronDownIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="border-white/[0.06] border-t px-5 py-3">
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button
                  className="h-8 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-red-400 text-xs hover:bg-red-500/20"
                  disabled={isLoading}
                  onClick={handleDelete}
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="mr-1.5 h-3 w-3" />
                  Delete
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button
                  className="h-8 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 text-xs hover:bg-white/[0.08]"
                  disabled={isLoading}
                  onClick={onClose}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  className="h-8 rounded-lg bg-white px-4 font-medium text-black text-xs hover:bg-white/90"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading ? "Saving..." : isCreating ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}
