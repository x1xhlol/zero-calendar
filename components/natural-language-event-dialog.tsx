"use client";

import { LoaderIcon, SendIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface NaturalLanguageEventDialogProps {
  onEventCreated: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  userId: string; // Added userId prop
}

export function NaturalLanguageEventDialog({
  open,
  onOpenChange,
  onEventCreated,
  userId,
}: NaturalLanguageEventDialogProps) {
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          naturalLanguage: input,
          userId,
          pushToGoogle: true, // Push to Google Calendar instantly
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const _data = await response.json();

      toast({
        title: "Event created",
        description: "Your event has been added to your calendar",
      });

      setInput("");
      onEventCreated();
      onOpenChange(false);
    } catch (_error) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const examples = [
    "Team meeting tomorrow at 3pm",
    "Lunch with Sarah on Friday at noon",
    "Project deadline next Monday",
    "Doctor appointment next week at 2pm",
  ];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="glass border-white/[0.08] p-0 sm:max-w-[600px]">
        <DialogHeader className="border-white/[0.08] border-b px-8 pt-8 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="font-bold text-2xl">
                Create Event
              </DialogTitle>
              <DialogDescription className="text-white/50">
                Describe your event in plain language
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form className="space-y-6 px-8 py-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Textarea
              className="min-h-[120px] resize-none rounded-lg border-white/[0.08] bg-white/[0.04] text-base focus-visible:ring-white/20"
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Team meeting tomorrow at 3pm in Conference Room A"
              value={input}
            />

            <div className="space-y-3">
              <p className="text-sm text-white/40">Examples:</p>
              <div className="grid grid-cols-2 gap-2">
                {examples.map((example, idx) => (
                  <button
                    className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-left text-sm text-white/60 transition-all hover:border-white/[0.1] hover:bg-white/[0.06] hover:text-white/80"
                    key={idx}
                    onClick={() => setInput(example)}
                    type="button"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button
              className="h-11 rounded-lg border border-white/[0.08] bg-white/[0.04] px-6 hover:bg-white/[0.08]"
              disabled={isLoading}
              onClick={() => {
                setInput("");
                onOpenChange(false);
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              className="h-11 flex-1 rounded-lg bg-white px-6 font-medium text-black hover:bg-white/90"
              disabled={isLoading || !input.trim()}
              type="submit"
            >
              {isLoading ? (
                <>
                  <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <SendIcon className="mr-2 h-4 w-4" />
                  Create Event
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
