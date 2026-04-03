"use client";

import { motion } from "framer-motion";
import { SendIcon, XIcon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatMessage {
  content: string;
  role: "user" | "assistant";
}

interface AiPanelProps {
  onClose: () => void;
  onEventMutated?: () => void;
  userId?: string;
}

const spring = { type: "spring", stiffness: 300, damping: 30 };

export function AiPanel({ userId, onClose, onEventMutated }: AiPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    const nextMessages = [...messages, { role: "user" as const, content: userMessage }];
    setInput("");
    setMessages(nextMessages);
    setIsStreaming(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          currentDate: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to get response";
        try {
          const data = await response.json();
          errorMessage = data.response || data.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      if (response.headers.get("content-type")?.includes("text/event-stream") && response.body) {
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const rawEvent of events) {
            const line = rawEvent
              .split("\n")
              .find((eventLine) => eventLine.startsWith("data: "));

            if (!line) {
              continue;
            }

            try {
              const event = JSON.parse(line.slice(6)) as
                | { type: "text"; text: string }
                | { type: "tool-result"; toolName: string }
                | { type: "done"; didMutateCalendar: boolean }
                | { type: "error"; message: string };

              if (event.type === "text") {
                accumulated += event.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: accumulated,
                  };
                  return updated;
                });
              }

              if (event.type === "done" && event.didMutateCalendar) {
                onEventMutated?.();
              }

              if (event.type === "error") {
                throw new Error(event.message);
              }
            } catch (error) {
              if (error instanceof Error) {
                throw error;
              }
            }
          }
        }
      } else {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.response?.includes("created") || data.response?.includes("deleted") || data.response?.includes("updated")) {
          onEventMutated?.();
        }
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
          <h3 className="text-sm font-semibold text-white/90">Zero AI</h3>
          <p className="text-[10px] text-white/30">Calendar assistant</p>
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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm font-medium text-white/60">Ask Zero anything</p>
              <p className="mt-1.5 max-w-[220px] text-[11px] leading-relaxed text-white/30">
                Create events, check your schedule, find free time, or get insights.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                {["What's on today?", "Schedule a meeting", "Find free time"].map((suggestion) => (
                  <button
                    className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/60"
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")} key={idx}>
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-blue-500/90 text-white"
                    : "bg-white/[0.04] text-white/80"
                )}
              >
                {msg.role === "assistant" ? (
                  <Streamdown className="max-w-none text-[13px] [&_[data-streamdown='link']]:text-cyan-400">
                    {msg.content}
                  </Streamdown>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2.5">
              <div className="rounded-2xl bg-white/[0.04] px-3.5 py-2.5">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="liquid-glass-input flex items-center gap-2 rounded-xl px-3 py-2">
          <input
            className="flex-1 bg-transparent text-[13px] text-white/80 outline-none placeholder:text-white/25"
            disabled={isStreaming}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Zero..."
            ref={inputRef}
            value={input}
          />
          <Button
            className="h-7 w-7 rounded-lg bg-blue-500/80 text-white hover:bg-blue-500 disabled:opacity-30"
            disabled={!input.trim() || isStreaming}
            onClick={sendMessage}
            size="icon"
          >
            <SendIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
