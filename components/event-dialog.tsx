"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { CalendarCategory, CalendarEvent } from "@/lib/calendar";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start: z.string().min(1, "Start time is required"),
  end: z.string().min(1, "End time is required"),
  category: z.string().optional(),
  location: z.string().optional(),
});

interface EventDialogProps {
  categories: CalendarCategory[];
  event: CalendarEvent | null;
  onEventDeleted: () => void;
  onEventUpdated: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  userId?: string;
}

export function EventDialog({
  open,
  onOpenChange,
  event,
  categories,
  onEventUpdated,
  onEventDeleted,
  userId,
}: EventDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isCreating = !event;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      start: "",
      end: "",
      category: "",
      location: "",
    },
  });

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title || "",
        description: event.description || "",
        start: event.start
          ? format(new Date(event.start), "yyyy-MM-dd'T'HH:mm")
          : "",
        end: event.end ? format(new Date(event.end), "yyyy-MM-dd'T'HH:mm") : "",
        category: event.category || "",
        location: event.location || "",
      });
    } else {
      form.reset({
        title: "",
        description: "",
        start: "",
        end: "",
        category: "",
        location: "",
      });
    }
  }, [event, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create or edit events",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        isCreating
          ? "/api/calendar/events"
          : `/api/calendar/events/${event?.id}`,
        {
          method: isCreating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            userId,
            pushToGoogle: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${isCreating ? "create" : "update"} event`);
      }

      toast({
        title: isCreating ? "Event created" : "Event updated",
        description: `Your event has been ${isCreating ? "created" : "updated"} successfully`,
      });
      onEventUpdated();
      onOpenChange(false);
    } catch (_error) {
      toast({
        title: "Error",
        description: `Failed to ${isCreating ? "create" : "update"} event`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!event) {
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
        throw new Error("Failed to delete event");
      }

      toast({
        title: "Event deleted",
        description: "Your event has been deleted successfully",
      });
      onEventDeleted();
      onOpenChange(false);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="glass border-white/[0.08] p-0 shadow-2xl sm:max-w-[480px]">
        <DialogHeader className="border-white/[0.08] border-b bg-white/[0.02] px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="font-bold text-xl">
                {isCreating ? "Create Event" : "Edit Event"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-white/50">
                {isCreating
                  ? "Add a new event to your calendar"
                  : "Update your event details"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-4 px-6 py-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium text-sm text-white/90">
                    Title
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

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-sm text-white/90">
                      Start
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-sm focus-visible:ring-white/20"
                        type="datetime-local"
                        {...field}
                      />
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
                    <FormLabel className="font-medium text-sm text-white/90">
                      End
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04] text-sm focus-visible:ring-white/20"
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-sm text-white/90">
                      Category
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-10 rounded-lg border-white/[0.08] bg-white/[0.04]">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="glass border-white/[0.08]">
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
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
                        placeholder="Optional"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <DialogFooter className="-mx-6 mt-6 gap-2 border-white/[0.08] border-t px-6 pt-3 pb-6">
              {!isCreating && (
                <Button
                  className="h-10 rounded-lg border border-red-500/20 bg-red-500/10 px-4 text-red-500 hover:bg-red-500/20"
                  disabled={isLoading}
                  onClick={handleDelete}
                  type="button"
                  variant="ghost"
                >
                  <Trash2Icon className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button
                  className="h-10 rounded-lg border border-white/[0.08] bg-white/[0.04] px-5 hover:bg-white/[0.08]"
                  disabled={isLoading}
                  onClick={() => onOpenChange(false)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <Button
                  className="h-10 rounded-lg bg-white px-5 font-medium text-black hover:bg-white/90"
                  disabled={isLoading}
                  type="submit"
                >
                  {isLoading
                    ? isCreating
                      ? "Creating..."
                      : "Saving..."
                    : isCreating
                      ? "Create"
                      : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
