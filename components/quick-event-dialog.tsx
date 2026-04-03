"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  time: z.string().optional(),
  description: z.string().optional(),
  calendar: z.string().optional(),
  recurrence: z.string().optional(),
  location: z.string().optional(),
});

interface QuickEventDialogProps {
  onEventCreated: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  selectedDate: Date | null;
  userId?: string;
}

export function QuickEventDialog({
  open,
  onOpenChange,
  selectedDate,
  userId,
  onEventCreated,
}: QuickEventDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      time: "",
      description: "",
      calendar: "primary",
      recurrence: "none",
      location: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedDate) {
      return;
    }

    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create events",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Parse the time or use default time
      const [hours, minutes] = values.time
        ? values.time.split(":").map(Number)
        : [9, 0];

      const startDate = new Date(selectedDate);
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(hours + 1, minutes, 0, 0);

      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          description: values.description,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          location: values.location,
          category: "Personal",
          userId,
          pushToGoogle: true,
          recurrence:
            values.recurrence === "none" ? undefined : values.recurrence,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      toast({
        title: "Event created",
        description: "Your event has been created successfully",
      });
      onEventCreated();
      onOpenChange(false);
      form.reset();
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Floating Dialog */}
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            transition={{ duration: 0.2 }}
          >
            <div className="glass overflow-hidden rounded-2xl border border-white/[0.08] shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-white/[0.08] border-b bg-white/[0.02] px-6 py-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Quick Event</h3>
                  <p className="text-sm text-white/50">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
                <Button
                  className="h-8 w-8 rounded-lg hover:bg-white/[0.08]"
                  onClick={() => onOpenChange(false)}
                  size="icon"
                  variant="ghost"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>

              {/* Form */}
              <Form {...form}>
                <form
                  className="space-y-4 px-6 py-5"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm text-white/90">
                          Title <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] focus-visible:ring-white/20"
                            placeholder="Event title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm text-white/90">
                          Time
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] focus-visible:ring-white/20"
                            placeholder="Optional"
                            type="time"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="calendar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm text-white/90">
                          Calendar
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04]">
                              <SelectValue placeholder="Select calendar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass border-white/[0.08]">
                            <SelectItem value="primary">My Calendar</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                            <SelectItem value="personal">Personal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm text-white/90">
                          Repeat
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04]">
                              <SelectValue placeholder="Does not repeat" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="glass border-white/[0.08]">
                            <SelectItem value="none">
                              Does not repeat
                            </SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">
                              Weekly on{" "}
                              {selectedDate && format(selectedDate, "EEEE")}
                            </SelectItem>
                            <SelectItem value="monthly">
                              Monthly on day{" "}
                              {selectedDate && format(selectedDate, "d")}
                            </SelectItem>
                            <SelectItem value="monthly-weekday">
                              Monthly on{" "}
                              {selectedDate && format(selectedDate, "EEEE")}
                            </SelectItem>
                            <SelectItem value="yearly">
                              Annually on{" "}
                              {selectedDate && format(selectedDate, "MMMM d")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-medium text-sm text-white/90">
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] focus-visible:ring-white/20"
                            placeholder="Add location (optional)"
                            {...field}
                          />
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
                        <FormLabel className="font-medium text-sm text-white/90">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[80px] resize-none rounded-lg border-white/[0.08] bg-white/[0.04] focus-visible:ring-white/20"
                            placeholder="Add description (optional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-3 pt-2">
                    <Button
                      className="h-10 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08]"
                      disabled={isLoading}
                      onClick={() => onOpenChange(false)}
                      type="button"
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="h-10 flex-1 rounded-lg bg-white font-medium text-black hover:bg-white/90"
                      disabled={isLoading}
                      type="submit"
                    >
                      {isLoading ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
