"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  TagIcon,
  TextIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { CalendarCategory, CalendarEvent } from "@/types/calendar";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  category: z.string().optional(),
  location: z.string().optional(),
});

interface EventDetailPanelProps {
  categories: CalendarCategory[];
  event: CalendarEvent | null;
  mode: "create" | "edit" | "view";
  onClose: () => void;
  onEventCreated: () => void;
  onEventDeleted: () => void;
  onEventUpdated: () => void;
  selectedDate: Date | null;
  userId?: string;
}

const spring = { type: "spring", stiffness: 300, damping: 30 };

export function EventDetailPanel({
  event,
  mode,
  categories,
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

  const defaultStart = selectedDate
    ? format(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 9, 0),
        "yyyy-MM-dd'T'HH:mm"
      )
    : "";
  const defaultEnd = selectedDate
    ? format(
        new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 10, 0),
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
      category: "",
      location: "",
    },
  });

  useEffect(() => {
    if (event && (mode === "edit" || mode === "view")) {
      form.reset({
        title: event.title || "",
        description: event.description || "",
        start: event.start ? format(new Date(event.start), "yyyy-MM-dd'T'HH:mm") : "",
        end: event.end ? format(new Date(event.end), "yyyy-MM-dd'T'HH:mm") : "",
        category: event.categories?.[0] || "",
        location: event.location || "",
      });
    } else if (mode === "create") {
      form.reset({
        title: "",
        description: "",
        start: defaultStart,
        end: defaultEnd,
        category: "",
        location: "",
      });
    }
  }, [event, mode, form, defaultStart, defaultEnd]);

  useEffect(() => {
    if (isCreating && titleRef.current) {
      const timer = setTimeout(() => titleRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isCreating]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({ title: "Sign in required", description: "Please sign in to manage events", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const url = isCreating ? "/api/calendar/events" : `/api/calendar/events/${event?.id}`;
      const method = isCreating ? "POST" : "PATCH";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, userId, pushToGoogle: true }),
      });

      if (!response.ok) throw new Error("Failed to save event");

      toast({
        title: isCreating ? "Event created" : "Event updated",
        description: `Your event has been ${isCreating ? "created" : "updated"}`,
      });

      if (isCreating) onEventCreated();
      else onEventUpdated();
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to save event", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!event || !userId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar/events/${event.id}?userId=${userId}&pushToGoogle=true`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete");

      toast({ title: "Event deleted", description: "Your event has been deleted" });
      onEventDeleted();
      onClose();
    } catch {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
      className="flex h-full flex-col overflow-hidden"
      exit={{ x: 80, opacity: 0 }}
      initial={{ x: 80, opacity: 0 }}
      transition={spring}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white/90">
            {isCreating ? "New Event" : isEditing ? "Edit Event" : event?.title}
          </h3>
          {dateDisplay && (
            <p className="mt-0.5 text-xs text-white/40">{dateDisplay}</p>
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
        <form className="flex flex-1 flex-col" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      className="h-10 border-0 bg-transparent px-0 text-lg font-semibold text-white placeholder:text-white/25 focus-visible:ring-0"
                      placeholder="Event title"
                      {...field}
                      ref={(e) => {
                        field.ref(e);
                        (titleRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
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
                      <div className="liquid-glass-input flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                        <ClockIcon className="h-3.5 w-3.5 text-white/30" />
                        <input
                          className="flex-1 bg-transparent text-xs text-white/80 outline-none placeholder:text-white/25"
                          type="datetime-local"
                          {...field}
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
                      <div className="liquid-glass-input flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                        <ClockIcon className="h-3.5 w-3.5 text-white/30" />
                        <input
                          className="flex-1 bg-transparent text-xs text-white/80 outline-none placeholder:text-white/25"
                          type="datetime-local"
                          {...field}
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
                          <div className="liquid-glass-input flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                            <MapPinIcon className="h-3.5 w-3.5 text-white/30" />
                            <input
                              className="flex-1 bg-transparent text-xs text-white/80 outline-none placeholder:text-white/25"
                              placeholder="Add location"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {categories.length > 0 && (
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <div className="liquid-glass-input flex items-center gap-2.5 rounded-xl px-3 py-2.5">
                            <TagIcon className="h-3.5 w-3.5 text-white/30" />
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-xs text-white/80 shadow-none focus:ring-0">
                                  <SelectValue placeholder="Category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="liquid-glass-elevated rounded-xl border-white/[0.08]">
                                {categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="liquid-glass-input flex items-start gap-2.5 rounded-xl px-3 py-2.5">
                            <TextIcon className="mt-0.5 h-3.5 w-3.5 text-white/30" />
                            <Textarea
                              className="min-h-[60px] flex-1 resize-none border-0 bg-transparent p-0 text-xs text-white/80 shadow-none placeholder:text-white/25 focus-visible:ring-0"
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

          <div className="border-t border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-2">
              {isEditing && (
                <Button
                  className="h-8 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-xs text-red-400 hover:bg-red-500/20"
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
                  className="h-8 rounded-lg bg-white px-4 text-xs font-medium text-black hover:bg-white/90"
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
